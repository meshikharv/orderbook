import { useEffect, useRef, useState, useCallback } from 'react';
import { WsMessage } from '../../../shared/types';

type MessageHandler = (msg: WsMessage) => void;

export function useWebSocket(onMessage: MessageHandler) {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCount = useRef(0);
  const handlerRef = useRef(onMessage);
  handlerRef.current = onMessage;

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${protocol}://${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      retryCount.current = 0;
      // Keep alive
      const ping = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'PING' }));
        } else {
          clearInterval(ping);
        }
      }, 25000);
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as WsMessage;
        if (msg.type !== 'PONG') {
          handlerRef.current(msg);
        }
      } catch { /* ignore */ }
    };

    ws.onclose = () => {
      setConnected(false);
      // Exponential backoff: max 30s
      const delay = Math.min(1000 * Math.pow(2, retryCount.current), 30000);
      retryCount.current += 1;
      retryRef.current = setTimeout(connect, delay);
    };

    ws.onerror = () => ws.close();
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (retryRef.current) clearTimeout(retryRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { connected };
}
