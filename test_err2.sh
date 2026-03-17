#!/bin/bash
npm run dev -- -p 3006 > err_server2.log 2>&1 &
DEV_PID=$!
echo "Waiting for dev server..."
sleep 15
curl -s -i -u admin:036 http://localhost:3006/admin > curl_output.txt
echo "Server log:"
tail -n 30 err_server2.log
kill $DEV_PID
