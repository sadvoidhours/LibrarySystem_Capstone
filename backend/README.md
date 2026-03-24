# Backend API (PTC Library)

## Run

1. `npm install`
2. Copy `.env.example` to `.env`
3. `npm run dev`

## Important ENV

- `MONGO_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
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
