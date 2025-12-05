import { useEffect, useRef } from 'react';

/**
 * Basic WebSocket client hook for the demo.
 * TODO: expand into a structured message router with typed handlers.
 */
function useWebSocketClient(url, onMessage) {
  const socketRef = useRef(null);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (onMessageRef.current) {
          onMessageRef.current(parsed);
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message', err);
      }
    };

    return () => {
      socket.close();
    };
  }, [url]);

  const sendJsonMessage = (message) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket is not open; message not sent.');
      return;
    }
    socket.send(JSON.stringify(message));
  };

  return {
    socket: socketRef.current,
    sendJsonMessage,
  };
}

export default useWebSocketClient;
