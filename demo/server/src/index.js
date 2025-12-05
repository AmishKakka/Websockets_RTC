const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');
const MessageTypes = require('./messages');
const {
  getOrCreateRoom,
  joinRoom,
  removeParticipantFromAllRooms,
  addChatMessage,
  getRoomMetaData,
} = require('./rooms');

const PORT = 3001;
const clients = new Map(); // clientId -> { ws, name }
const IDENTIFY_TYPE = MessageTypes.IDENTIFY || 'IDENTIFY';
// Track lobby subscribers so every open tab stays in sync with the shared room list.
const lobbySubscribers = new Set();
const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

const wss = new WebSocketServer({ server });

let nextClientId = 1;

function broadcastToRoom(room, message, excludeClientId = null) {
  const json = JSON.stringify(message);
  room.participants.forEach((participant) => {
    if (
      participant.id !== excludeClientId &&
      participant.ws.readyState === WebSocket.OPEN
    ) {
      participant.ws.send(json);
    }
  });
}

function broadcastRoomList() {
  const message = JSON.stringify({
    type: MessageTypes.ROOM_LIST_UPDATE,
    payload: { rooms: getRoomMetaData() },
  });

  lobbySubscribers.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    } else {
      lobbySubscribers.delete(client);
    }
  });
}

wss.on('connection', (ws) => {
  const clientId = nextClientId++;
  let currentRoomName = null;
  let userName = `User ${clientId}`;
  clients.set(clientId, { ws, name: null });

  console.log('Client connected', { clientId });

  ws.on('message', (data) => {
    try {
      const parsed = JSON.parse(data.toString());
      const { type, payload } = parsed;

      switch (type) {
        case MessageTypes.ROOM_LIST_SUBSCRIBE: {
          lobbySubscribers.add(ws);
          ws.send(
            JSON.stringify({
              type: MessageTypes.ROOM_LIST_UPDATE,
              payload: { rooms: getRoomMetaData() },
            })
          );
          break;
        }

        case IDENTIFY_TYPE: {
          const name = payload?.name;
          if (name) {
            const existing = clients.get(clientId) || {};
            clients.set(clientId, { ...existing, ws, name });
            userName = name;
            console.log(`Client ${clientId} identified as ${name}`);
          }
          break;
        }

        case MessageTypes.JOIN_ROOM: {
          // TODO: Require identification before allowing room joins.
          const { roomName, name } = payload;
          currentRoomName = roomName;
          const identifiedName = clients.get(clientId)?.name;
          userName = identifiedName || name || `User ${clientId}`;
          clients.set(clientId, { ws, name: userName });

          const room = joinRoom(roomName, { id: clientId, name: userName, ws });

          ws.send(
            JSON.stringify({
              type: MessageTypes.ROOM_LIST_UPDATE,
              payload: {
                roomId: room.id,
                roomName: room.name,
                participants: Array.from(room.participants.values()).map(
                  (p) => ({ id: p.id, name: p.name })
                ),
                chatHistory: room.chatHistory,
              },
            })
          );

          broadcastToRoom(
            room,
            {
              type: MessageTypes.SYSTEM_MESSAGE,
              payload: { text: `${userName} joined the room` },
            },
            clientId
          );

          broadcastToRoom(
            room,
            {
              type: 'PARTICIPANT_JOINED',
              payload: { id: clientId, name: userName },
            },
            clientId
          );
          broadcastRoomList();
          break;
        }

        case MessageTypes.CHAT_MESSAGE: {
          if (!currentRoomName) return;
          const room = getOrCreateRoom(currentRoomName);

          const chatEntry = addChatMessage(room, {
            sender: userName,
            text: payload.text,
          });

          broadcastToRoom(room, {
            type: MessageTypes.CHAT_MESSAGE,
            payload: chatEntry,
          });
          break;
        }

        default:
          console.warn('Unknown message type:', type);
      }
    } catch (err) {
      console.error('Failed to parse message', {
        clientId,
        error: err.message,
      });
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected', { clientId });
    clients.delete(clientId);
    lobbySubscribers.delete(ws);
    const participantRemovedFromRooms = removeParticipantFromAllRooms(clientId);

    participantRemovedFromRooms.forEach((room) => {
      broadcastToRoom(room, {
        type: MessageTypes.SYSTEM_MESSAGE,
        payload: { text: `${userName} left the room` },
      });

      broadcastToRoom(room, {
        type: 'PARTICIPANT_LEFT',
        payload: { id: clientId },
      });
    });

    if (participantRemovedFromRooms.length > 0) {
      broadcastRoomList();
    }
  });
});

function startServer() {
  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
