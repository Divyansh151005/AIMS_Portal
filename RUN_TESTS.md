# Commands to Run End-to-End Tests

## Quick Start (2 Terminal Windows)

### Terminal 1: Start Backend Server
```bash
cd /Users/divyanshbarodiya/Desktop/AIMS_Portal/backend
npm run dev
```

### Terminal 2: Run Tests (after server starts)
```bash
cd /Users/divyanshbarodiya/Desktop/AIMS_Portal/backend
npm run test:e2e
```

---

## Alternative: Run Server in Background

### Option A: Run server in background, then tests
```bash
cd /Users/divyanshbarodiya/Desktop/AIMS_Portal/backend

# Start server in background
npm run dev &

# Wait a few seconds for server to start, then run tests
sleep 5
npm run test:e2e

# Stop background server when done
pkill -f "node.*server.js"
```

### Option B: One-liner (server must already be running)
```bash
cd /Users/divyanshbarodiya/Desktop/AIMS_Portal/backend && npm run test:e2e
```

---

## View Test Results

After tests complete, view the report:
```bash
cat backend/tests/TEST_REPORT.md
```

Or open in your editor:
```bash
open backend/tests/TEST_REPORT.md
```

---

## Troubleshooting

### If port 5000 is already in use:
```bash
# Kill existing process
lsof -ti:5000 | xargs kill -9

# Then start server
cd backend && npm run dev
```

### If database connection fails:
```bash
# Check .env file has DATABASE_URL
cd backend
cat .env | grep DATABASE_URL
```

### Check if server is running:
```bash
curl http://localhost:5000/api/health
```

Expected response: `{"status":"ok","message":"AIMS Portal API is running"}`
