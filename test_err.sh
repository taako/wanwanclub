#!/bin/bash
npm run dev -- -p 3005 > err_server.log 2>&1 &
DEV_PID=$!
echo "Waiting for dev server..."
sleep 15
curl -s -i -u admin:036 http://localhost:3005/admin
echo "Server log:"
tail -n 30 err_server.log
kill $DEV_PID
