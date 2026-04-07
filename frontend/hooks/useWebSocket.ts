"use client";

import { useEffect, useRef, useCallback, useState } from "react";

export interface WsMessage {
  type: "notification" | "pong" | string;
  data: Record<string, any>;
}

interface UseWebSocketOptions {
  onMessage?: (msg: WsMessage) => void;
  enabled?: boolean;
  maxRetries?: number;
}

const BASE_WS = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000")
  .replace(/^http/, "ws");

export function useWebSocket({ onMessage, enabled = true, maxRetries = 3 }: UseWebSocketOptions = {}) {
  const wsRef      = useRef<WebSocket | null>(null);
  const pingRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [connected, setConnected] = useState(false);
  const attempts   = useRef(0);

  const connect = useCallback(() => {
    if (!enabled) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!token) return;

    // Stop after maxRetries to avoid noisy console errors in dev
    if (attempts.current >= maxRetries) return;
    attempts.current += 1;

    const url = `${BASE_WS}/api/v1/ws/notifications?token=${token}`;
    const ws  = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      // Keep-alive ping every 30 s
      pingRef.current = setInterval(() => ws.readyState === WebSocket.OPEN && ws.send("ping"), 30_000);
    };

    ws.onmessage = (evt) => {
      try {
        const msg: WsMessage = JSON.parse(evt.data);
        onMessage?.(msg);
      } catch { /* ignore parse errors */ }
    };

    ws.onclose = () => {
      setConnected(false);
      if (pingRef.current) clearInterval(pingRef.current);
      // Auto-reconnect after 5 s
      if (attempts.current < maxRetries) {
        reconnRef.current = setTimeout(connect, 5_000);
      }
    };

    ws.onerror = () => ws.close();
  }, [enabled, onMessage]);

  useEffect(() => {
    connect();
    return () => {
      if (pingRef.current)   clearInterval(pingRef.current);
      if (reconnRef.current) clearTimeout(reconnRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { connected };
}
