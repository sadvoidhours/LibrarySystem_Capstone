# PTC Library Management System (Capstone)

Mobile-based Library Management System for **Pateros Technological College** with RBAC for:
- Student/Faculty (`student`, `faculty`)
- Librarian Admin (`admin`)
- Superadmin (`superadmin`)

## Tech Stack

### Mobile App
- React Native (Expo)
- React Navigation (Stack + Tabs)
- Redux Toolkit
- Axios
- Barcode scanning: `expo-barcode-scanner`

### Backend API
- Node.js + Express (REST)
- MongoDB Atlas + Mongoose
- JWT authentication + role-based middleware
- Cloudinary uploads via signed backend flow

## Project Structure

- `backend/` – Express API, MongoDB models, RBAC, circulation, reports, audit logs
- `mobile/` – Expo app with role-based navigation and dashboard flows

## Deployment

The backend and mobile app are deployed separately. The backend runs on Vercel and the mobile app is built with Expo EAS.

### Backend on Vercel

1. Open Vercel and create a new project from this repository.
2. Set the project root directory to `backend/`.
3. Add the required production environment variables:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `REFRESH_TOKEN_SECRET`
   - `JWT_EXPIRES_IN`
   - `REFRESH_TOKEN_EXPIRES_IN`
   - `CORS_ORIGIN`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `MAILTRAP_HOST`
   - `MAILTRAP_PORT`
   - `MAILTRAP_USER`
   - `MAILTRAP_PASS`
   - `MAILTRAP_FROM`
   - `APP_LANDING_URL`
4. Deploy the project.
5. Confirm `GET /health` and `GET /` return OK on the deployed API URL.
6. Verify the cron jobs are present in `backend/vercel.json` and enabled in Vercel.
7. Test login, refresh, and logout once the API is live.

### Mobile with EAS

1. Open the `mobile/` folder in your local environment.
2. Install dependencies and copy the env template if needed.
3. Set `EXPO_PUBLIC_API_BASE_URL` to the deployed Vercel API URL ending in `/api`.
4. Log in to Expo with `npx eas login`.
5. Initialize the project with `npx eas init` if it has not been linked yet.
6. Build the app with the appropriate profile:
   - `npm run build:android`
   - `npm run build:ios`
   - `npm run build:preview:android`
   - `npm run build:preview:ios`
7. Rebuild the app whenever the API URL changes.
8. Use Expo Go or a development build for local testing, and EAS production builds for release.

## Core Features Implemented

### User (Student / Faculty)
- JWT login
- Profile endpoint and update endpoint
- Digital barcode ID (`/api/users/me/barcode`) with QR image generation
- Catalog search/filter (`/api/books`)
- Borrow request submission (`/api/borrowings/request`)
- Borrow history (`/api/borrowings/my`)
- Notifications (`/api/notifications/my`)
- Penalty visibility in Philippine Peso (₱)

### Admin (Librarian)
- Admin dashboard metrics (`/api/reports/overview`)
- Scanner-based borrow/return (`/api/borrowings/scan/borrow`, `/api/borrowings/scan/return`)
- Catalog CRUD (`/api/books`)
- Automatic penalty computation on return (₱ per day)
- Penalty payment recording (`/api/payments`)
- Borrowing and penalty reports (`/api/reports/*`)

### Superadmin
- Admin account creation (`/api/superadmin/admins`)
- Role override (`/api/superadmin/users/:id/role`)
- Delete book/user records
- Audit log access (`/api/superadmin/audit-logs`)
- Batch barcode generation for books (`/api/superadmin/barcodes/books/batch`)

## Database Collections

Implemented Mongoose models:
- `User`
- `Book`
- `Borrowing`
- `Payment`
- `Notification`
- `AuditLog`

Indexed fields include:
- `userId`
- `bookId`
- `barcodeString`
- other commonly queried fields (`email`, `status`, etc.)

## Setup Instructions

## 1) Backend

1. Open terminal in `backend/`
2. Install dependencies:
   - `npm install`
3. Copy env template:
   - copy `.env.example` to `.env`
4. Fill required variables:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `MAILTRAP_HOST`
   - `MAILTRAP_PORT`
   - `MAILTRAP_USER`
   - `MAILTRAP_PASS`
   - `MAILTRAP_FROM`
   - `APP_LANDING_URL` (optional, used in email buttons)
5. Start API:
   - `npm run dev`

### Mailtrap Test Route

- `POST /api/superadmin/mailtrap/test`
- Use a superadmin token
- Optional request body fields:
  - `to`
  - `subject`
  - `message`

Default API URL: `http://localhost:5000`

### Seeder Commands (run inside `backend/`)

- Seed Filipino books:
   - `npm run seed:filipino-books`

- Reset seeded Filipino books then re-seed:
   - `npm run seed:filipino-books:reset`

- Seed demo users + borrowing transactions:
   - `npm run seed:users-transactions`

- Reset demo transactions then re-seed:
   - `npm run seed:users-transactions:reset`

- Seed full demo dataset (books + users + transactions):
   - `npm run seed:demo`

### Seeded Account Credentials

- Default password for all seeded accounts:
   - `admin12345`

- Superadmin:
   - `moavengoza@paterostechnologicalcollege.edu.ph`

- Admins:
   - `jabellino@paterostechnologicalcollege.edu.ph`
   - `cmalmonte@paterostechnologicalcollege.edu.ph`

- Faculty:
   - `kcadena@paterostechnologicalcollege.edu.ph`

- Student:
   - `naannanggo@paterostechnologicalcollege.edu.ph`

## 2) Mobile

1. Open terminal in `mobile/`
2. Install dependencies:
   - `npm install`
3. Copy env template:
   - copy `.env.example` to `.env`
4. Set API URL:
   - `EXPO_PUBLIC_API_BASE_URL=http://<your-ip-or-host>:5000/api`
5. Start app:
   - `npm start`

> Use local network IP for physical device testing.

## Notes for Deployment Readiness

- Enable HTTPS and secure secrets via environment manager
- Add refresh token strategy and token revocation for production security
- Add background jobs for due reminders/overdue notification pushes
- Add full e2e and integration tests for circulation/payment flows
- Add PDF export templates for printable reports and barcode sheets

## API Health Check

- `GET /health`
- `GET /`
