import dotenv from 'dotenv';
import express from 'express';
import { WebSocket } from 'ws';

dotenv.config();
const app = express();
const P2PQUAKE_WS_BACKEND = process.env.P2PQUAKE_WS_BACKEND; // "wss://api.p2pquake.net/v2/ws" or "wss://api-realtime-sandbox.p2pquake.net/v2/ws"
const WOLFXJMA_WS_BACKEND = process.env.WOLFXJMA_WS_BACKEND; // "wss://ws-api.wolfx.jp/jma_eew"
const PORT = process.env.PORT || 3000;

const pending_p2pClients = [];
const pending_jmaClients = [];

function connectWS(target, clients) {
    console.log(`Connecting to ${target}`);
    const wsConnection = new WebSocket(target);

    wsConnection.on('open', () => {
        console.log(`WebSocket has opened for "${target}"`);
    });
    wsConnection.on('message', (data) => {
        let got;
        try {
            got = JSON.parse(data);
        } catch (err) {
            return console.error(`Failed to parse: ${data}`);
        }
        if (!got) return;
        clients.forEach((res) => {
            if (!res.headersSent) {
                res.json(got);
            }
        });
        clients.length = 0;
    });
    wsConnection.on('close', () => setTimeout(() => connectWS(target, clients), 1000));
}

connectWS(P2PQUAKE_WS_BACKEND, pending_p2pClients);
connectWS(WOLFXJMA_WS_BACKEND, pending_jmaClients);

function removeClient(res, clients) {
    const index = clients.indexOf(res);
    if (index !== -1) clients.splice(index, 1);
}

app.get("/poll/p2p", (req, res) => {
    const timer = setTimeout(() => { // timeout if no data comes within 30 secs
        removeClient(res, pending_p2pClients);
        res.status(204).end(); // No Content
    }, 30000);

    res.on('close', () => {
        clearTimeout(timer);
        removeClient(res, pending_p2pClients);
    });
    pending_p2pClients.push(res);
});

app.get("/poll/jma", (req, res) => {
    const timer = setTimeout(() => { // timeout if no data comes within 30 secs
        removeClient(res, pending_jmaClients);
        res.status(204).end(); // No Content
    }, 30000);

    res.on('close', () => {
        clearTimeout(timer);
        removeClient(res, pending_jmaClients);
    });
    pending_jmaClients.push(res);
});

app.listen(PORT, (e) => {
    if (e) console.error(`Unexpected error on server start: ${e}`);
    else console.log(`Server started on ${PORT} port`);
});