import { WebSocketServer, WebSocket } from 'ws';
import { WsMessage } from '../../../shared/types';

let wss: WebSocketServer | null = null;

export function initWss(server: WebSocketServer) {
  wss = server;

  wss.on('connection', (ws) => {
    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString()) as WsMessage;
        if (msg.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG' }));
        }
      } catch {
        // ignore malformed messages
      }
    });

    ws.send(JSON.stringify({ type: 'PONG' }));
  });
}

export function broadcast(msg: WsMessage) {
  if (!wss) return;
  const payload = JSON.stringify(msg);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}
