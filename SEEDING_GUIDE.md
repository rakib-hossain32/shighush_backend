# Database Seeding Guide

This guide explains how to seed your database with initial data including admin users, moderators, institutions, and sample reports.

## What Gets Seeded?

### Users
- **Admin User**
  - Name: রাকিব হোসেন
  - Email: admin@shighush.org
  - Password: Admin@123
  - Role: Admin

- **Moderator User**
  - Name: সাকিব আহমেদ
  - Email: moderator@shighush.org
  - Password: Moderator@123
  - Role: Moderator

### Institutions
- 6 sample institutions in Shibchar area
  - Upazila Parishad
  - Health Complex
  - Land Office
  - Police Station
  - Municipality
  - Union Parishad

### Reports
- 8 sample reports with different statuses:
  - Published reports (3)
  - Under review reports (2)
  - Received/Pending reports (2)
  - Awaiting redaction (1)
- Some reports include PII findings for testing moderation features

## Prerequisites

1. Make sure MongoDB is running
2. Configure your `.env` file with MongoDB connection string:
   ```
   MONGODB_URI=mongodb://127.0.0.1:27017/shighush
   ```

## How to Seed

### Option 1: Using npm script (Recommended)
```bash
npm run seed
```

### Option 2: Using pnpm
```bash
pnpm seed
```

### Option 3: Direct execution
```bash
tsx src/scripts/seed.ts
```

## What Happens During Seeding?

1. **Connects to MongoDB** using the URI from your `.env` file
2. **Clears existing data** - ⚠️ **WARNING**: This deletes all existing users, institutions, and reports
3. **Creates users** - Admin and Moderator with hashed passwords
4. **Creates institutions** - 6 sample institutions in Shibchar
5. **Creates reports** - 8 sample reports with various statuses and scenarios
6. **Updates metrics** - Calculates and updates report counts for each institution

## After Seeding

You can login to the system using:

**Admin Login:**
- Email: `admin@shighush.org`
- Password: `Admin@123`

**Moderator Login:**
- Email: `moderator@shighush.org`
- Password: `Moderator@123`

## Testing Scenarios

The seeded data includes various scenarios for testing:

1. **Published Reports** - Test public viewing and verification levels
2. **Reports with PII** - Test moderation and redaction features
3. **Pending Reports** - Test review workflow
4. **Different Categories** - Test filtering and categorization
5. **Different Institutions** - Test institution metrics and filtering
6. **Date Ranges** - Reports from different dates for timeline testing

## Security Notes

⚠️ **IMPORTANT**: 
- Change the default passwords after first login in production
- The seed script is intended for development and testing only
- Never use these credentials in a production environment
- Consider using environment variables for seed data in production scenarios

## Troubleshooting

### MongoDB Connection Error
```
Error: Could not connect to MongoDB
```
**Solution**: Make sure MongoDB is running and the connection string is correct in `.env`

### Authentication Error
```
Error: Authentication failed
```
**Solution**: Check if your MongoDB instance requires authentication and update the connection string accordingly

### Data Already Exists
The seed script will **clear all existing data** before seeding. This is intentional to ensure a clean slate for testing.

## Customizing Seed Data

To modify the seed data:
1. Edit `src/scripts/seed.ts`
2. Add/modify users, institutions, or reports as needed
3. Run the seed script again

## Related Scripts

- `seedAdmin.ts` - Creates only a single admin user (deprecated, use main seed script instead)
