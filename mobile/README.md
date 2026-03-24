# Mobile App (PTC Library)

## Run

1. `npm install`
2. Copy `.env.example` to `.env`
3. Set `EXPO_PUBLIC_API_BASE_URL`
4. `npm start`

### API URL note

- For physical devices, `localhost` points to the phone itself. Set your backend URL to your PC LAN IP when needed.
- The client now auto-replaces `localhost`/`127.0.0.1` with Expo host IP in development.

## Roles and Navigation

- `student/faculty`: Dashboard, Catalog, Borrowings, Notifications
- `admin`: Dashboard, Scanner, Books, Reports
- `superadmin`: Overview, Admins, Audit Logs

## Scanner Flow

`ScannerScreen` supports:
- Camera barcode scanning via `expo-camera`
- Manual barcode fallback input
