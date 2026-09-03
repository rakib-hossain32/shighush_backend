# Shighush (শিঘুষ) - Backend API

🇧🇩 **দুর্নীতি ও অনিয়ম রিপোর্টিং প্ল্যাটফর্ম** - Backend API Server

Express + TypeScript + MongoDB backend for civic accountability and transparency.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB (running locally or remote)
- Git

### Installation

```bash
# Navigate to backend directory
cd shighush_backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your settings
# Update MONGODB_URI, JWT_SECRET, etc.

# Start MongoDB (if local)
mongod

# Seed database with sample data
npm run seed

# Start development server
npm run dev
```

Server will run on **http://localhost:4000**

## 📋 Default Credentials (After Seeding)

### Admin
- Email: `admin@shighush.com`
- Password: `admin123456`

### Moderator
- Email: `moderator@shighush.com`
- Password: `moderator123`

## 🏗️ Architecture

```
src/
├── config/           # Configuration files (constants, database)
├── controllers/      # Route handlers & business logic
├── middlewares/      # Express middlewares (auth, upload, rate-limit)
├── models/           # MongoDB/Mongoose models
├── routes/           # API route definitions
├── scripts/          # Utility scripts (seed, migration)
├── services/         # External services (email)
├── types/            # TypeScript type definitions
└── utils/            # Helper utilities (PII detection, case ID)
```

## 🔐 Authentication & Authorization

### JWT-Based Auth
- Login with email/password → returns JWT token
- Token expires in 7 days (configurable)
- Include token in `Authorization: Bearer <token>` header

### Roles & Permissions

| Role | Permissions |
|------|-------------|
| **Admin** | All permissions (full access) |
| **Moderator** | Limited (cannot delete reports, manage users, view audit logs) |

### Permission List
- `report:read` - View reports
- `report:review` - Review and update report status
- `report:remove` - Delete reports (Admin only)
- `institution:write` - Manage institutions (Admin only)
- `appeal:handle` - Review appeals
- `flag:handle` - Review flags
- `person:write` - Manage people directory (Admin only)
- `user:read` - View users (Admin only)
- `user:write` - Create/update users (Admin only)
- `audit:read` - View audit logs (Admin only)

## 📡 API Endpoints

### Public Endpoints (No Auth Required)

#### Health Check
```
GET /api/v1/health
```

#### Reports
```
POST   /api/v1/reports              # Create new report
GET    /api/v1/reports              # List reports (published only for public)
GET    /api/v1/reports/:caseId      # Get report by case ID
```

#### Institutions
```
GET    /api/v1/institutions          # List institutions
GET    /api/v1/institutions/:slug    # Get institution by slug
```

#### People
```
GET    /api/v1/people               # List people (published only)
GET    /api/v1/people/:slug         # Get person by slug
```

#### Appeals
```
POST   /api/v1/appeals              # Create appeal
```

#### Flags
```
POST   /api/v1/flags                # Flag a report
```

#### Evidence
```
POST   /api/v1/reports/:reportId/evidence    # Upload evidence
GET    /api/v1/reports/:reportId/evidence    # List evidence
```

### Protected Endpoints (Auth Required)

#### Authentication
```
POST   /api/v1/auth/login           # Login
```

#### Reports (Admin/Moderator)
```
PATCH  /api/v1/reports/:id/status   # Update report status
PATCH  /api/v1/reports/:id/redact   # Redact PII from report
```

#### Institutions (Admin Only)
```
POST   /api/v1/institutions          # Create institution
PATCH  /api/v1/institutions/:id      # Update institution
DELETE /api/v1/institutions/:id      # Delete institution
```

#### Appeals (Admin/Moderator)
```
GET    /api/v1/appeals               # List all appeals
GET    /api/v1/appeals/:id           # Get appeal details
PATCH  /api/v1/appeals/:id/status    # Update appeal status
```

#### Flags (Admin/Moderator)
```
GET    /api/v1/flags                 # List all flags
GET    /api/v1/flags/:id             # Get flag details
PATCH  /api/v1/flags/:id/status      # Update flag status
```

#### People (Admin Only)
```
POST   /api/v1/people                # Create person
PATCH  /api/v1/people/:id/visibility # Update visibility
```

#### Evidence (Admin/Moderator)
```
PATCH  /api/v1/evidence/:id/verify   # Verify evidence
DELETE /api/v1/evidence/:id          # Delete evidence (Admin only)
```

#### Admin Dashboard
```
GET    /api/v1/admin/stats           # Dashboard statistics
GET    /api/v1/admin/users           # List users (Admin only)
POST   /api/v1/admin/users           # Create user (Admin only)
PATCH  /api/v1/admin/users/:id/role  # Update user role (Admin only)
GET    /api/v1/admin/audit-logs      # View audit logs (Admin only)
```

## 📊 Data Models

### Report
- `caseId`: Unique Bengali ID (শি-০০০১)
- `category`: ঘুষ, দুর্নীতি, অবহেলা, etc.
- `status`: received, under_review, published, rejected
- `verificationLevel`: pending, verified, unverifiable
- `piiFindings`: Auto-detected PII (phone, email, NID)

### Institution
- `slug`: URL-friendly identifier
- `nameBn`: Name in Bengali
- `category`: Type of institution
- `reportCount`: Number of linked reports

### Appeal
- `reportId`: Reference to report
- `reason`: incorrect_info, privacy_violation, etc.
- `status`: received, in_review, resolved, rejected

### Flag
- `reportId`: Reference to report
- `reason`: pii_present, false_info, spam, etc.
- `status`: open, reviewed, actioned, dismissed

### Person
- `slug`: URL identifier
- `name`: Person name
- `nameVisibility`: hidden, published, redacted
- `reportCount`: Number of mentions

### Evidence
- `reportId`: Reference to report
- `type`: document, image, audio, video
- `verified`: Boolean verification status
- `url`: File storage URL

### AuditLog
- `userId`: Who performed action
- `action`: What was done (e.g., report:status_change)
- `targetType`: What was affected (report, user, etc.)
- `details`: Action-specific metadata

## 🛠️ Development

### Available Scripts

```bash
npm run dev       # Start development server with hot reload
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
npm run format    # Format code with Prettier
npm run seed      # Seed database with sample data
npm run clean     # Clean build directory
```

### Environment Variables

```env
# Server
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://127.0.0.1:27017/shighush

# JWT
JWT_SECRET=your_secret_key_min_32_chars
JWT_EXPIRES_IN=7d

# Email (Optional - Resend)
RESEND_API_KEY=re_xxxxx
FROM_EMAIL=noreply@shighush.com
ADMIN_EMAIL=admin@shighush.com
```

### Adding New Dependencies

```bash
# For multer (file upload)
npm install multer @types/multer

# For Resend (email service)
npm install resend
```

## 🔒 Security Features

- **Helmet.js**: Security headers
- **Rate Limiting**: Prevents abuse (100 req/15min)
- **CORS**: Cross-origin protection
- **JWT**: Secure authentication
- **bcrypt**: Password hashing
- **Zod**: Input validation
- **PII Detection**: Auto-detects personal info
- **Audit Logging**: Tracks all admin actions

## 📝 PII Detection

Automatically detects and flags:
- Phone numbers (BD format): 01XXXXXXXXX
- Email addresses
- National ID (NID): 10-17 digits
- Passport numbers

## 🧪 Testing

```bash
# Test health check
curl http://localhost:4000/api/v1/health

# Test login
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@shighush.com","password":"admin123456"}'

# Test authenticated endpoint
curl http://localhost:4000/api/v1/admin/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🚢 Deployment

### Build for Production

```bash
npm run build
npm start
```

### Environment Variables (Production)
- Set `NODE_ENV=production`
- Use strong `JWT_SECRET`
- Use production MongoDB URI
- Configure `FRONTEND_URL` for CORS
- Add `RESEND_API_KEY` for emails

### Recommended Hosting
- **Backend**: Railway, Render, DigitalOcean, AWS
- **Database**: MongoDB Atlas (free tier available)
- **File Storage**: Cloudflare R2, AWS S3, Supabase Storage

## 📚 API Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": [ ... ]  // Optional validation errors
}
```

## 🤝 Contributing

1. Follow TypeScript best practices
2. Use Zod for input validation
3. Add audit logs for sensitive actions
4. Write Bengali messages for user-facing strings
5. Document new endpoints in this README

## 📄 License

MIT License - Built for civic transparency in Bangladesh 🇧🇩

---

**যোগাযোগ**: admin@shighush.com  
**সাইট**: https://shighush.com
