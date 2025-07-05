import dotenv from 'dotenv';
import express from 'express';
import { WebSocket } from 'ws';

dotenv.config();
const app = express();
const P2PQUAKE_WS_BACKEND = process.env.P2PQUAKE_WS_BACKEND // "wss://api.p2pquake.net/v2/ws" or "wss://api-realtime-sandbox.p2pquake.net/v2/ws"
const PORT = process.env.PORT || 3000;

const pendingClients = [];

let wsConnection;
function connectWS() {
    if (wsConnection) console.log("Reconnecting WebSocket")
    wsConnection = new WebSocket(P2PQUAKE_WS_BACKEND);

    wsConnection.on('open', () => {
        console.log(`WebSocket has opened for "${P2PQUAKE_WS_BACKEND}"`);
    });
    wsConnection.on('message', (data) => {
        let got;
        try {
            got = JSON.parse(data);
        } catch (err) {
            return console.error(`Failed to parse: ${data}`);
        }
        if (!got) return;
        pendingClients.forEach((res) => {
            if (!res.headersSent) {
                res.json(got);
            }
        });
        pendingClients.length = 0;
    });
    wsConnection.on('close', () => setTimeout(connectWS, 1000));
}

connectWS();

function removeClient(res) {
    const index = pendingClients.indexOf(res);
    if (index !== -1) pendingClients.splice(index, 1);
}

app.get("/poll", (req, res) => {
    const timer = setTimeout(() => { // timeout if no data comes within 30 secs
        removeClient(res);
        res.status(204).end(); // No Content
    }, 30000);

    res.on('close', () => {
        clearTimeout(timer);
        removeClient(res);
    });
    pendingClients.push(res);
});

app.listen(PORT, (e) => {
    if (e) console.error(`Unexpected error on server start: ${e}`);
    else console.log(`Server started on ${PORT} port`);
});