# Port Change Notice

## ⚠️ Port Changed from 5000 to 5001

**Reason:** Port 5000 is used by macOS AirPlay Receiver by default, which prevents the Express server from starting.

## Updated Configuration

- **Backend Server:** Now runs on `http://localhost:5001`
- **Health Check:** `http://localhost:5001/api/health`
- **Test Suite:** Automatically uses port 5001

## If You Need to Use Port 5000

**Option 1:** Disable AirPlay Receiver (macOS)
1. System Settings → General → AirDrop & Handoff
2. Turn off "AirPlay Receiver"

**Option 2:** Set custom port via environment variable
```bash
export PORT=5000
cd backend && npm run dev
```

## Update Frontend (if needed)

If your frontend is configured to use a specific API URL, update it:
- **File:** `frontend/.env.local` or `frontend/.env`
- **Add:** `NEXT_PUBLIC_API_URL=http://localhost:5001/api`

Otherwise, the default in `frontend/src/lib/api.js` should be updated or you can set the environment variable.
