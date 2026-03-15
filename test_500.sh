#!/bin/bash
npm run dev -- -p 3002 > dev_server.log 2>&1 &
DEV_PID=$!
echo "Waiting for dev server..."
sleep 10
echo "=== Accessing /admin ==="
curl -i http://localhost:3002/admin
echo
echo "=== Server Logs ==="
tail -n 20 dev_server.log
kill $DEV_PID
