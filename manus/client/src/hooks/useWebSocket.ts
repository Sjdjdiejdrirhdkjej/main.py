import { useState, useEffect, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  payload: any;
}

interface UseWebSocketOptions {
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
}

interface UseWebSocketReturn {
  socket: WebSocket | null;
  lastMessage: WebSocketMessage | null;
  sendMessage: (message: any) => void;
  connectionStatus: string; // 'Connecting', 'Open', 'Closing', 'Closed', 'Error'
}

const useWebSocket = (url: string, options?: UseWebSocketOptions): UseWebSocketReturn => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('Connecting');

  useEffect(() => {
    if (!url) return;

    console.log(`Attempting to connect to WebSocket at ${url}`);
    setConnectionStatus('Connecting');
    const ws = new WebSocket(url);

    ws.onopen = (event) => {
      console.log('WebSocket connection opened:', event);
      setSocket(ws);
      setConnectionStatus('Open');
      if (options?.onOpen) options.onOpen(event);
    };

    ws.onmessage = (event) => {
      try {
        const parsedMessage: WebSocketMessage = JSON.parse(event.data as string);
        console.log('WebSocket message received:', parsedMessage);
        setLastMessage(parsedMessage);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        // Optionally send an error status or specific message format for unparseable messages
      }
    };

    ws.onclose = (event) => {
      console.log('WebSocket connection closed:', event);
      setSocket(null);
      setConnectionStatus('Closed');
      if (options?.onClose) options.onClose(event);
    };

    ws.onerror = (event) => {
      console.error('WebSocket error:', event);
      setSocket(null);
      setConnectionStatus('Error');
      if (options?.onError) options.onError(event);
    };

    // Cleanup function to close the WebSocket connection when the component unmounts or URL changes
    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        console.log('Closing WebSocket connection');
        setConnectionStatus('Closing');
        ws.close();
      }
    };
  }, [url, options]); // Re-run effect if URL or options change

  const sendMessage = useCallback((message: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      console.log('Sending WebSocket message:', message);
      socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not open. Message not sent:', message);
    }
  }, [socket]);

  return { socket, lastMessage, sendMessage, connectionStatus };
};

export default useWebSocket;
