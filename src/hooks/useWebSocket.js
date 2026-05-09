import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL ? `${process.env.REACT_APP_BACKEND_URL}` : '';

export function useWebSocket() {
  const { token } = useAuth();
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const listenersRef = useRef(new Set());

  const addListener = useCallback((callback) => {
    listenersRef.current.add(callback);
    return () => listenersRef.current.delete(callback);
  }, []);

  useEffect(() => {
    if (!token) return;

    const wsUrl = API.replace('https://', 'wss://').replace('http://', 'ws://');
    let ws;
    let reconnectTimer;

    const connect = () => {
      ws = new WebSocket(`${wsUrl}/api/ws/${token}`);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
      };

      ws.onmessage = (event) => {
        if (event.data === 'pong') return;
        try {
          const data = JSON.parse(event.data);
          // Show toast notification for key events
          if (data.type === 'booking_request') {
            toast.info(data.message, { description: 'Tap to view' });
          } else if (data.type === 'new_message') {
            toast.info(`New message from ${data.sender_name}`, { description: data.preview });
          } else if (data.type === 'incoming_call') {
            toast.info(`Incoming ${data.call_type} call from ${data.caller_name}`);
          }
          // Notify all listeners
          listenersRef.current.forEach(cb => cb(data));
        } catch {}
      };

      ws.onclose = () => {
        setConnected(false);
        wsRef.current = null;
        // Reconnect after 5s
        reconnectTimer = setTimeout(connect, 5000);
      };

      ws.onerror = () => { ws.close(); };
    };

    connect();

    // Keep alive
    const pingInterval = setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) ws.send('ping');
    }, 30000);

    return () => {
      clearInterval(pingInterval);
      clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, [token]);

  return { connected, addListener };
}
