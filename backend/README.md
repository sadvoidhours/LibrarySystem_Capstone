# Backend API (PTC Library)

## Run

1. `npm install`
2. Copy `.env.example` to `.env`
3. `npm run dev`

## Render Deployment

1. Create a new Render web service from this repository.
2. Set the service root directory to `backend/`.
3. Use the Render blueprint in the repository root or configure the service with:

	- Build command: `npm install --legacy-peer-deps`
	- Start command: `npm start`
4. Add all required production environment variables in Render:
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
	- `MAILTRAP_HOST`
	- `MAILTRAP_PORT`
	- `MAILTRAP_USER`
	- `MAILTRAP_PASS`
	- `MAILTRAP_FROM`
	- `APP_LANDING_URL`
5. Deploy the project.
6. Confirm the deployed API responds on `GET /health` and `GET /`.
7. Configure Render cron jobs or an external scheduler to call:
	- `GET /api/cron/archive-inactive-accounts`
	- `GET /api/cron/due-reminders`
	- `GET /api/cron/overdue-notices`

	Use the header `x-cron-secret: <CRON_SECRET>` when calling those routes.
8. Point the mobile app to the deployed API URL ending in `/api`.

## Important ENV

- `MONGO_URI`
- `JWT_SECRET`
- `REFRESH_TOKEN_SECRET`
- `JWT_EXPIRES_IN`
- `REFRESH_TOKEN_EXPIRES_IN`
- `CORS_ORIGIN`
- `CRON_SECRET` (recommended for cron route protection)
- `PENALTY_PER_DAY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `MAILTRAP_HOST`
- `MAILTRAP_PORT`
- `MAILTRAP_USER`
- `MAILTRAP_PASS`
- `MAILTRAP_FROM`
- `APP_LANDING_URL` (optional, used in email buttons)

## Main Route Groups

- `/api/auth`
- `/api/users`
- `/api/books`
- `/api/borrowings`
- `/api/notifications`
- `/api/payments`
- `/api/reports`
- `/api/superadmin`
- `/api/uploads`

## Mailtrap Test Endpoint

- `POST /api/superadmin/mailtrap/test`
- Requires a `superadmin` token
- Optional body fields:
	- `to`
	- `subject`
	- `message`

## Seeder

- Seed Filipino books:
	- `npm run seed:filipino-books`

- Reset seeded Filipino books then re-seed:
	- `npm run seed:filipino-books:reset`

- Seed demo Filipino users + borrowing transactions:
	- `npm run seed:users-transactions`

- Reset demo transactions then re-seed:
	- `npm run seed:users-transactions:reset`

- Seed full demo dataset (books + users + transactions):
	- `npm run seed:demo`
