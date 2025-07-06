# P2PQuakeCacher
Proxying earthquake datas from p2pquake.net and api.wolfx.jp to the clients which does not support WebSocket.
### Deploying
1. Clone the repository.
2. Rename `.env.example` to `.env`
3. Add `PORT=<port number>` to `.env` if you want to use other port number. (optional, default: 3000)
4. `npm install` and `node index.js`.
5. Profit.
### Testing
Modify `P2PQUAKE_WS_BACKEND` line in `.env` to the sandboxed url such as `wss://api-realtime-sandbox.p2pquake.net/ws`.
