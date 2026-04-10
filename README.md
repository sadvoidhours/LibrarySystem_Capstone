# PTC Library Management System

Production-ready library system for **Pateros Technological College** with role-based access for:
- `student`
- `faculty`
- `admin`
- `superadmin`

The final flow supports end-to-end circulation from mobile barcode scanning through backend transaction processing, penalties, notifications, audit logging, and reports.

## What Is Production Ready

- Borrow and return transactions can be completed from the scanner UI.
- Repeated scans are handled safely so the same action does not create duplicate active borrowings or double returns.
- Backend borrowing rules enforce one active/overdue borrowing per user and book pair.
- Mobile builds are ready for Expo Go, preview, and production EAS builds.
- Backend deployment is configured for Render, with the web/mobile frontend pointing to the production API URL.
- Integration tests cover authentication, scanner flows, payment settlement, and reminder jobs.

## Tech Stack

### Mobile
- React Native with Expo
- React Navigation
- Redux Toolkit
- Axios API client
- `expo-camera` barcode scanning

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication and role-based authorization
- MongoDB transactions for circulation updates
- Cloudinary uploads and Brevo notifications

## Deployment Targets

- Backend API: Render
- Web frontend: Vercel
- Native mobile builds: Expo EAS

## Production Deployment

### Backend on Render

1. Create a Render web service from the `backend/` folder.
2. Set the start command to `npm start`.
3. Add the production environment variables:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `REFRESH_TOKEN_SECRET`
   - `JWT_EXPIRES_IN`
   - `REFRESH_TOKEN_EXPIRES_IN`
   - `CORS_ORIGIN`
   - `CRON_SECRET`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `BREVO_SMTP_HOST`
   - `BREVO_SMTP_PORT`
   - `BREVO_SMTP_USER`
   - `BREVO_SMTP_PASS`
   - `BREVO_FROM`
   - `APP_LANDING_URL`
4. Confirm the deployed API responds on `GET /health` and `GET /`.
5. Configure cron jobs or an external scheduler to call the `/api/cron/*` endpoints with `x-cron-secret`.

### Web Frontend on Vercel

1. Create a Vercel project from the `mobile/` folder.
2. Set the project root to `mobile/`.
3. Use the Expo web build settings in [mobile/vercel.json](mobile/vercel.json).
4. Set `EXPO_PUBLIC_API_BASE_URL` to the deployed Render API URL ending in `/api`.
5. Add the Vercel URL to `CORS_ORIGIN` on the backend.

### Native Mobile Builds

1. Open the `mobile/` folder locally.
2. Install dependencies and configure `.env` if needed.
3. Set `EXPO_PUBLIC_API_BASE_URL` to the deployed Render API URL ending in `/api`.
4. Log in to Expo with `npm exec --yes eas-cli -- login`.
5. Initialize EAS if needed with `npm exec --yes eas-cli -- init`.
6. Build with the appropriate script:
   - `npm run build:preview:android`
   - `npm run build:preview:ios`
   - `npm run build:android`
   - `npm run build:ios`
7. Rebuild whenever the API URL changes.

## Core Features

### Student / Faculty
- JWT login
- Profile update
- Digital barcode ID generation
- Catalog search and filtering
- Borrow request submission
- Borrow history
- Notifications
- Penalty display in Philippine Peso

### Admin
- Dashboard metrics
- Scanner-based borrow and return
- Safe repeat-scan handling
- Catalog CRUD
- Automatic penalty computation on return
- Payment recording
- Borrowing and penalty reports

### Superadmin
- Admin account creation
- Role override
- Delete book and user records
- Audit log access
- Batch barcode generation for books

## Main API Groups

- `/api/auth`
- `/api/users`
- `/api/books`
- `/api/borrowings`
- `/api/notifications`
- `/api/payments`
- `/api/reports`
- `/api/superadmin`
- `/api/uploads`
- `/api/cron`

## Scanner Flow

The scanner screen supports:

- User and book barcode capture
- Borrow mode with due-day selection
- Return mode
- Manual barcode entry fallback
- Duplicate-scan protection in the UI and backend

## Setup for Local Development

### Backend

1. Open a terminal in `backend/`.
2. Run `npm install`.
3. Copy `.env.example` to `.env`.
4. Fill in the required secrets and service credentials.
5. Start the API with `npm run dev`.

### Mobile

1. Open a terminal in `mobile/`.
2. Run `npm install`.
3. Copy `.env.example` to `.env` if needed.
4. Set `EXPO_PUBLIC_API_BASE_URL` to your local or deployed API.
5. Start the app with `npm start`.

## Seeder Commands

Run inside `backend/`:

- `npm run seed:filipino-books`
- `npm run seed:filipino-books:reset`
- `npm run seed:users-transactions`
- `npm run seed:users-transactions:reset`
- `npm run seed:demo`

## API Health Checks

- `GET /health`
- `GET /`