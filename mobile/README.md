# Mobile App (PTC Library)

## Run

1. `npm install`
2. Copy `.env.example` to `.env`
3. Set `EXPO_PUBLIC_API_BASE_URL`
4. `npm start`

## Production Deployment

1. Set `EXPO_PUBLIC_API_BASE_URL` to the deployed Render backend URL ending in `/api`.
2. Install Expo tooling if needed with `npx eas login` and `npx eas init`.
3. Build a production Android or iOS app with EAS.
4. Use a preview build for internal testing before release.
5. Rebuild the app whenever the backend URL changes.
6. Keep camera and upload permissions configured in `app.json`.

### API URL note

- For physical devices, `localhost` points to the phone itself. Set your backend URL to your PC LAN IP when needed.
- The client now auto-replaces `localhost`/`127.0.0.1` with Expo host IP in development.
- Use `http://localhost:5000/api` for local emulator testing, not `https://localhost:5000/api`.
- In production, use the Render HTTPS API URL.

## Roles and Navigation

- `student/faculty`: Dashboard, Catalog, Borrowings, Notifications
- `admin`: Dashboard, Scanner, Books, Reports
- `superadmin`: Overview, Admins, Audit Logs

## Scanner Flow

`ScannerScreen` supports:
- Camera barcode scanning via `expo-camera`
- Manual barcode fallback input
