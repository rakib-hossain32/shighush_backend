# Shighush API Documentation

Complete API reference for all endpoints with request/response examples.

**Base URL**: `http://localhost:4000/api/v1` (Development)

---

## Table of Contents
- [Authentication](#authentication)
- [Reports](#reports)
- [Institutions](#institutions)
- [Appeals](#appeals)
- [Flags](#flags)
- [People](#people)
- [Evidence](#evidence)
- [Admin](#admin)

---

## Authentication

### Login
Authenticate user and get JWT token.

**Endpoint**: `POST /auth/login`  
**Access**: Public

**Request Body**:
```json
{
  "email": "admin@shighush.com",
  "password": "admin123456"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "name": "Admin User",
      "email": "admin@shighush.com",
      "role": "Admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response** (401):
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

## Reports

### Create Report
Submit a new corruption/misconduct report.

**Endpoint**: `POST /reports`  
**Access**: Public

**Request Body**:
```json
{
  "category": "ঘুষ",
  "institutionId": "507f1f77bcf86cd799439011",
  "institutionName": "শিবচর উপজেলা পরিষদ",
  "narrative": "বিস্তারিত বর্ণনা এখানে...",
  "incidentDate": "2026-09-01",
  "incidentLocation": "শিবচর সদর",
  "accusedName": "নাম প্রকাশ না করা",
  "accusedDesignation": "সহকারী কর্মকর্তা",
  "witnessPresentBn": "হ্যাঁ"
}
```

**Success Response** (201):
```json
{
  "success": true,
  "data": {
    "caseId": "শি-০০০৪",
    "id": "507f1f77bcf86cd799439011",
    "message": "রিপোর্ট সফলভাবে জমা হয়েছে। কেস আইডি: শি-০০০৪"
  }
}
```

### List Reports
Get paginated list of reports.

**Endpoint**: `GET /reports`  
**Access**: Public (published only) / Admin (all)

**Query Parameters**:
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `status` (string): received, under_review, published, rejected
- `category` (string): ঘুষ, দুর্নীতি, অবহেলা, etc.
- `area` (string): Filter by location
- `verificationLevel` (string): pending, verified, unverifiable

**Example**: `GET /reports?page=1&limit=10&status=published&category=ঘুষ`

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "reports": [
      {
        "_id": "...",
        "caseId": "শি-০০০১",
        "category": "ঘুষ",
        "institutionName": "শিবচর উপজেলা পরিষদ",
        "incidentDate": "2026-08-15T00:00:00.000Z",
        "status": "published",
        "verificationLevel": "verified",
        "createdAt": "2026-09-01T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
    }
  }
}
```

### Get Report by Case ID
Retrieve single report details.

**Endpoint**: `GET /reports/:caseId`  
**Access**: Public (if published) / Admin (all)

**Example**: `GET /reports/শি-০০০১`

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "caseId": "শি-০০০১",
    "category": "ঘুষ",
    "narrative": "বিস্তারিত বর্ণনা...",
    "institutionName": "শিবচর উপজেলা পরিষদ",
    "incidentDate": "2026-08-15T00:00:00.000Z",
    "incidentLocation": "শিবচর সদর",
    "status": "published",
    "verificationLevel": "verified",
    "piiFindings": [],
    "publishedAt": "2026-08-20T10:00:00.000Z"
  }
}
```

### Update Report Status
Change report review status (Admin/Moderator only).

**Endpoint**: `PATCH /reports/:id/status`  
**Access**: Protected (report:review)

**Request Body**:
```json
{
  "status": "published",
  "reviewNotes": "রিপোর্ট যাচাই করা হয়েছে এবং প্রকাশিত",
  "verificationLevel": "verified"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "caseId": "শি-০০০১",
    "status": "published",
    "verificationLevel": "verified"
  }
}
```

### Redact Report
Redact PII from report narrative (Admin/Moderator only).

**Endpoint**: `PATCH /reports/:id/redact`  
**Access**: Protected (report:review)

**Request Body**:
```json
{
  "narrative": "Redacted version without PII..."
}
```

---

## Institutions

### List Institutions
Get all institutions with filtering.

**Endpoint**: `GET /institutions`  
**Access**: Public

**Query Parameters**:
- `page`, `limit`
- `category` (string): সরকারি প্রতিষ্ঠান, স্বাস্থ্যসেবা, etc.
- `area` (string): Location filter
- `type` (string): উপজেলা পরিষদ, হাসপাতাল, etc.
- `search` (string): Search by name

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "institutions": [
      {
        "_id": "...",
        "slug": "shibchar-upazila-parishad",
        "nameBn": "শিবচর উপজেলা পরিষদ",
        "nameEn": "Shibchar Upazila Parishad",
        "category": "সরকারি প্রতিষ্ঠান",
        "type": "উপজেলা পরিষদ",
        "area": "শিবচর সদর",
        "reportCount": 15
      }
    ],
    "pagination": { ... }
  }
}
```

### Get Institution by Slug

**Endpoint**: `GET /institutions/:slug`  
**Access**: Public

**Example**: `GET /institutions/shibchar-health-complex`

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "slug": "shibchar-health-complex",
    "nameBn": "শিবচর স্বাস্থ্য কমপ্লেক্স",
    "nameEn": "Shibchar Health Complex",
    "category": "স্বাস্থ্যসেবা",
    "reportCount": 8,
    "recentReports": [
      {
        "caseId": "শি-০০০২",
        "category": "অবহেলা",
        "incidentDate": "2026-08-20T00:00:00.000Z"
      }
    ]
  }
}
```

### Create Institution (Admin Only)

**Endpoint**: `POST /institutions`  
**Access**: Protected (institution:write)

**Request Body**:
```json
{
  "slug": "new-institution",
  "nameBn": "নতুন প্রতিষ্ঠান",
  "nameEn": "New Institution",
  "category": "সরকারি প্রতিষ্ঠান",
  "type": "অফিস",
  "area": "শিবচর সদর",
  "address": "ঠিকানা",
  "description": "বর্ণনা"
}
```

---

## Appeals

### Create Appeal
Submit appeal for a report.

**Endpoint**: `POST /appeals`  
**Access**: Public

**Request Body**:
```json
{
  "caseId": "শি-০০০১",
  "reason": "incorrect_info",
  "description": "বিস্তারিত কারণ এখানে..."
}
```

**Reason Options**:
- `incorrect_info` - ভুল তথ্য
- `privacy_violation` - গোপনীয়তা লঙ্ঘন
- `institutional_response` - প্রতিষ্ঠানের পক্ষ থেকে
- `other` - অন্যান্য

**Success Response** (201):
```json
{
  "success": true,
  "data": { ... },
  "message": "আপিল জমা হয়েছে। রিভিউ করার পর আপনাকে জানানো হবে।"
}
```

### List Appeals (Admin Only)

**Endpoint**: `GET /appeals`  
**Access**: Protected (appeal:handle)

**Query Parameters**:
- `page`, `limit`
- `status`: received, in_review, resolved, rejected
- `reason`: Filter by appeal reason

---

## Flags

### Create Flag
Flag a report for review.

**Endpoint**: `POST /flags`  
**Access**: Public

**Request Body**:
```json
{
  "reportId": "507f1f77bcf86cd799439011",
  "reason": "pii_present",
  "details": "রিপোর্টে ব্যক্তিগত তথ্য রয়েছে"
}
```

**Reason Options**:
- `pii_present` - ব্যক্তিগত তথ্য আছে
- `false_info` - মিথ্যা তথ্য
- `spam` - স্প্যাম
- `duplicate` - ডুপ্লিকেট
- `inappropriate` - অনুপযুক্ত
- `other` - অন্যান্য

**Success Response** (201):
```json
{
  "success": true,
  "data": { ... },
  "message": "ফ্ল্যাগ জমা হয়েছে। মডারেটররা রিভিউ করবেন।"
}
```

### List Flags (Admin/Moderator)

**Endpoint**: `GET /flags`  
**Access**: Protected (flag:handle)

---

## People

### List People
Get people directory (published names only for public).

**Endpoint**: `GET /people`  
**Access**: Public (published) / Admin (all)

**Query Parameters**:
- `page`, `limit`
- `visibility`: hidden, published, redacted (Admin only)
- `search`: Search by name

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "people": [
      {
        "_id": "...",
        "slug": "john-doe",
        "name": "John Doe",
        "designation": "উপজেলা চেয়ারম্যান",
        "nameVisibility": "published",
        "reportCount": 5,
        "verifiedCount": 3
      }
    ],
    "pagination": { ... }
  }
}
```

### Get Person by Slug

**Endpoint**: `GET /people/:slug`  
**Access**: Public (if published)

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "slug": "john-doe",
    "name": "John Doe",
    "designation": "উপজেলা চেয়ারম্যান",
    "reportCount": 5,
    "reports": [
      {
        "caseId": "শি-০০০১",
        "category": "ঘুষ",
        "institutionName": "শিবচর উপজেলা পরিষদ"
      }
    ]
  }
}
```

---

## Evidence

### Upload Evidence
Upload file evidence for a report.

**Endpoint**: `POST /reports/:reportId/evidence`  
**Access**: Public  
**Content-Type**: `multipart/form-data`

**Form Data**:
- `file`: File (max 10MB)

**Allowed Types**:
- Images: jpeg, jpg, png, webp
- Documents: pdf, doc, docx
- Audio: mp3, wav, ogg
- Video: mp4, mpeg, webm

**Success Response** (201):
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "reportId": "...",
    "type": "image",
    "url": "/uploads/evidence-1234567890.jpg",
    "filename": "evidence-1234567890.jpg",
    "originalFilename": "screenshot.jpg",
    "verified": false
  },
  "message": "প্রমাণ সফলভাবে আপলোড হয়েছে"
}
```

### List Evidence

**Endpoint**: `GET /reports/:reportId/evidence`  
**Access**: Public

---

## Admin

### Dashboard Stats

**Endpoint**: `GET /admin/stats`  
**Access**: Protected (Admin/Moderator)

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "metrics": [
      { "key": "total", "label": "মোট রিপোর্ট", "value": 142 },
      { "key": "queue", "label": "রিভিউ প্রয়োজন", "value": 23 },
      { "key": "published", "label": "প্রকাশিত", "value": 105 },
      { "key": "today", "label": "আজকের", "value": 7 }
    ],
    "piiAlerts": 5
  }
}
```

### List Users (Admin Only)

**Endpoint**: `GET /admin/users`  
**Access**: Protected (user:read)

**Query Parameters**:
- `page`, `limit`
- `role`: Admin, Moderator

### Create User (Admin Only)

**Endpoint**: `POST /admin/users`  
**Access**: Protected (user:write)

**Request Body**:
```json
{
  "name": "New User",
  "email": "newuser@example.com",
  "password": "password123",
  "role": "Moderator"
}
```

### List Audit Logs (Admin Only)

**Endpoint**: `GET /admin/audit-logs`  
**Access**: Protected (audit:read)

**Query Parameters**:
- `page`, `limit`
- `userId`: Filter by user
- `action`: Filter by action type
- `targetType`: Filter by target type (report, user, etc.)

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "_id": "...",
        "userId": { "name": "Admin User", "email": "admin@..." },
        "action": "report:status_change",
        "targetType": "report",
        "targetId": "...",
        "details": { "status": "published" },
        "ipAddress": "127.0.0.1",
        "createdAt": "2026-09-01T10:00:00.000Z"
      }
    ],
    "pagination": { ... }
  }
}
```

---

## Error Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (not logged in) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate) |
| 429 | Too Many Requests (rate limit) |
| 500 | Internal Server Error |

---

## Rate Limiting

- **Global**: 100 requests per 15 minutes per IP
- All endpoints share this limit
- Returns 429 when exceeded

---

## Pagination Format

All paginated endpoints return:

```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 142,
    "pages": 8
  }
}
```

---

For integration examples, see `lib/api/client.ts` in the frontend codebase.
