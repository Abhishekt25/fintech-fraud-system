import { WebSocketServer } from 'ws';

let wss = null;
const clients = new Set();

export function initWebSocket(server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log(`WS client connected. Total: ${clients.size}`);

    ws.send(JSON.stringify({ type: 'CONNECTED', data: { clientCount: clients.size } }));

    ws.on('close', () => {
      clients.delete(ws);
      console.log(`WS client disconnected. Total: ${clients.size}`);
    });

    ws.on('error', (err) => {
      console.error('WS error:', err.message);
      clients.delete(ws);
    });

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        handleClientMessage(ws, msg);
      } catch {}
    });
  });

  return wss;
}

function handleClientMessage(ws, msg) {
  if (msg.type === 'PING') {
    ws.send(JSON.stringify({ type: 'PONG', ts: Date.now() }));
  }
}

export function broadcast(type, data) {
  const payload = JSON.stringify({ type, data, ts: Date.now() });
  const dead = [];

  for (const client of clients) {
    if (client.readyState === 1) {
      try {
        client.send(payload);
      } catch {
        dead.push(client);
      }
    } else {
      dead.push(client);
    }
  }

  for (const c of dead) clients.delete(c);
}

export function getClientCount() {
  return clients.size;
}