#!/bin/bash
# Complete Test Runner for AIMS Portal

echo "🧪 AIMS Portal - Complete Test Runner"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check database
echo -e "${YELLOW}📊 Checking database...${NC}"
cd backend
if npx prisma db push --skip-generate > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database schema synced${NC}"
else
    echo -e "${RED}❌ Database setup failed${NC}"
    exit 1
fi

# Check if server is running
echo -e "${YELLOW}🔍 Checking server status...${NC}"
if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Server is running${NC}"
else
    echo -e "${YELLOW}⚠️  Server not running. Starting server...${NC}"
    npm run dev > /tmp/aims-server.log 2>&1 &
    SERVER_PID=$!
    echo "Server starting (PID: $SERVER_PID)..."
    sleep 8
    if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Server started successfully${NC}"
    else
        echo -e "${RED}❌ Server failed to start. Check logs: /tmp/aims-server.log${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${YELLOW}🚀 Running backend tests...${NC}"
echo ""

# Run backend tests
npm run test:e2e

TEST_EXIT=$?

echo ""
if [ $TEST_EXIT -eq 0 ]; then
    echo -e "${GREEN}✅ Backend tests completed!${NC}"
else
    echo -e "${RED}❌ Backend tests encountered errors${NC}"
fi

echo ""
echo -e "${YELLOW}📄 Test Report Location:${NC}"
echo "   backend/tests/TEST_REPORT.md"
echo ""
echo -e "${YELLOW}📋 Frontend Testing:${NC}"
echo "   Please test frontend manually:"
echo "   1. Start frontend: cd frontend && npm run dev"
echo "   2. Open browser: http://localhost:3000"
echo "   3. Follow manual test checklist in COMPLETE_TEST_GUIDE.md"
echo ""

if [ ! -z "$SERVER_PID" ]; then
    echo "Server PID: $SERVER_PID (still running)"
    echo "To stop: kill $SERVER_PID"
fi

exit $TEST_EXIT
