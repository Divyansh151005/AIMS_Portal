#!/bin/bash
# AIMS Portal - Test Runner Script

echo "🧪 AIMS Portal End-to-End Test Runner"
echo "======================================"
echo ""

# Check if server is running
if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "✅ Server is running on port 5000"
else
    echo "⚠️  Server is NOT running on port 5000"
    echo "Please start the server first:"
    echo "  cd backend && npm run dev"
    echo ""
    read -p "Start server now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Starting server in background..."
        cd backend && npm run dev > /tmp/aims-server.log 2>&1 &
        SERVER_PID=$!
        echo "Server started (PID: $SERVER_PID)"
        echo "Waiting 5 seconds for server to initialize..."
        sleep 5
        cd ..
    else
        echo "Exiting. Please start server manually and try again."
        exit 1
    fi
fi

echo ""
echo "🚀 Running test suite..."
echo ""

# Run tests
cd backend
npm run test:e2e

TEST_EXIT_CODE=$?

echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ Tests completed!"
    echo ""
    echo "📄 View detailed report:"
    echo "   cat backend/tests/TEST_REPORT.md"
    echo "   or"
    echo "   open backend/tests/TEST_REPORT.md"
else
    echo "❌ Tests failed or encountered errors"
fi

echo ""
