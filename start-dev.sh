#!/usr/bin/env bash
# Starts backend, frontend, and optionally ngrok tunnel for sharing
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "Starting backend on :5000..."
nohup node "$ROOT/server/server.js" > "$ROOT/server.log" 2>&1 &
SERVER_PID=$!

echo "Starting frontend on :3000..."
nohup npm --prefix "$ROOT/client" run dev -- --port 3000 > "$ROOT/client.log" 2>&1 &
CLIENT_PID=$!

echo "Backend PID: $SERVER_PID  Frontend PID: $CLIENT_PID"
echo "$SERVER_PID" > "$ROOT/.server.pid"
echo "$CLIENT_PID" > "$ROOT/.client.pid"

# Optional: start ngrok tunnel to expose frontend publicly
if command -v ngrok &>/dev/null; then
  echo "Starting ngrok tunnel → http://localhost:3000 ..."
  nohup ngrok http 3000 > "$ROOT/ngrok.log" 2>&1 &
  NGROK_PID=$!
  echo "ngrok PID: $NGROK_PID"
  echo "$NGROK_PID" > "$ROOT/.ngrok.pid"
  sleep 3
  # Print public URL
  NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['tunnels'][0]['public_url'])" 2>/dev/null || echo "check http://localhost:4040")
  echo ""
  echo "========================================="
  echo "  Public URL: $NGROK_URL"
  echo "========================================="
else
  echo "ngrok not found — skipping tunnel. Install with: brew install ngrok/ngrok/ngrok"
fi

echo ""
echo "Dev servers running. Logs: server.log, client.log"
echo "To stop: kill \$(cat .server.pid) \$(cat .client.pid) 2>/dev/null"
