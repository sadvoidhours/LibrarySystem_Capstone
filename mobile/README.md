# Mobile App (PTC Library)

## Run

1. `npm install`
2. Copy `.env.example` to `.env`
3. Set `EXPO_PUBLIC_API_BASE_URL`
4. `npm start`

If you change `EXPO_PUBLIC_API_BASE_URL`, fully stop Expo Go/Metro and start it again so the new value is bundled into the app.

## Production Deployment

### Web Frontend on Vercel

1. Create a new Vercel project from the `mobile/` folder.
2. Use the Vercel config in [mobile/vercel.json](mobile/vercel.json).
3. Set `EXPO_PUBLIC_API_BASE_URL` to the Render backend URL ending in `/api`.
4. Make sure the backend `CORS_ORIGIN` includes the Vercel frontend URL.
5. Deploy and test the login flow from the browser.

### Native App Builds

1. Set `EXPO_PUBLIC_API_BASE_URL` to the deployed Render backend URL ending in `/api` if you want to override the default.
2. Install Expo tooling if needed with `npm exec --yes eas-cli -- login` and `npm exec --yes eas-cli -- init`.
3. Build with the matching script:
	- `npm run build:preview:android`
	- `npm run build:preview:ios`
	- `npm run build:android`
	- `npm run build:ios`
4. Use preview builds for internal testing before release.
5. Rebuild the app whenever the backend URL changes.
6. Keep camera and upload permissions configured in `app.json`.

For Expo Go development, update `mobile/.env`, restart Metro with `npm start`, and scan the app again. For release builds, the app falls back to the deployed Render API if no env value is available, but you should still rebuild after the URL changes because any override is embedded at build time.

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
- Borrow and return transaction modes
- Due-day selection for borrow scans
- Reset and submission guards to reduce duplicate scans
