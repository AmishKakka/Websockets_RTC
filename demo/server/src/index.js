const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');
const MessageTypes = require('./messages');
const {
  getOrCreateRoom,
  joinRoom,
  removeParticipantFromAllRooms,
  addChatMessage,
  getRoomMetaData,
  roomExists,
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

function sendJson(ws, message) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function sendError(ws, reason, details = {}) {
  sendJson(ws, {
    type: MessageTypes.ERROR,
    payload: { reason, ...details },
  });
}

function buildRoomStatePayload(room) {
  return {
    roomId: room.id,
    roomName: room.name,
    participants: Array.from(room.participants.values()).map((p) => ({
      id: p.id,
      name: p.name,
    })),
    chatHistory: room.chatHistory,
  };
}

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
          sendJson(ws, {
            type: MessageTypes.ROOM_LIST_UPDATE,
            payload: { rooms: getRoomMetaData() },
          });
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

        case MessageTypes.CREATE_ROOM: {
          const rawRoomName = payload?.roomName ?? payload?.name;
          const roomName =
            typeof rawRoomName === 'string' ? rawRoomName.trim() : '';
          if (!roomName) {
            sendError(ws, 'Room name must be a non-empty string.');
            break;
          }
          if (roomExists(roomName)) {
            sendError(ws, `Room "${roomName}" already exists.`);
            break;
          }

          const identifiedName = clients.get(clientId)?.name;
          const providedName = payload?.createdBy || payload?.name;
          userName = identifiedName || providedName || `User ${clientId}`;
          clients.set(clientId, { ws, name: userName });
          currentRoomName = roomName;

          const room = joinRoom(roomName, {
            id: clientId,
            name: userName,
            ws,
          });

          sendJson(ws, {
            type: MessageTypes.CREATE_ROOM_SUCCESS,
            payload: buildRoomStatePayload(room),
          });
          broadcastRoomList();
          break;
        }

        case MessageTypes.JOIN_ROOM: {
          // TODO: Require identification before allowing room joins.
          const rawRoomName = payload?.roomName;
          const roomName =
            typeof rawRoomName === 'string' ? rawRoomName.trim() : '';
          if (!roomName) {
            sendError(ws, 'Room name must be provided to join.');
            break;
          }
          if (!roomExists(roomName)) {
            sendError(ws, `Room "${roomName}" does not exist.`);
            break;
          }

          const name = payload?.name;
          const identifiedName = clients.get(clientId)?.name;
          userName = identifiedName || name || `User ${clientId}`;
          clients.set(clientId, { ws, name: userName });
          currentRoomName = roomName;

          const room = joinRoom(roomName, { id: clientId, name: userName, ws });
          const roomStatePayload = buildRoomStatePayload(room);

          sendJson(ws, {
            type: MessageTypes.JOIN_ROOM_SUCCESS,
            payload: roomStatePayload,
          });

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
          broadcastToRoom(
            room,
            {
              type: MessageTypes.ROOM_LIST_UPDATE,
              payload: {
                roomId: room.id,
                roomName: room.name,
                participants: roomStatePayload.participants,
              },
            },
            clientId
          );
          broadcastRoomList();
          break;
        }

        case MessageTypes.CHAT_MESSAGE: {
          const incomingRoom =
            typeof payload?.roomName === 'string'
              ? payload.roomName.trim()
              : currentRoomName;
          const roomName = typeof incomingRoom === 'string' ? incomingRoom : '';
          const text =
            typeof payload?.text === 'string' ? payload.text.trim() : '';

          if (!roomName) {
            sendError(ws, 'Chat messages must include a roomName.');
            break;
          }
          if (!text) {
            sendError(ws, 'Chat messages must include text content.');
            break;
          }
          if (!roomExists(roomName)) {
            sendError(ws, `Room "${roomName}" does not exist.`);
            break;
          }

          const room = getOrCreateRoom(roomName);
          const participantKey = String(clientId);
          const participant = room.participants.get(participantKey);

          if (!participant) {
            sendError(ws, `You are not a member of room "${roomName}".`);
            break;
          }

          const senderName =
            participant.name ||
            clients.get(clientId)?.name ||
            payload?.sender ||
            `User ${clientId}`;

          const chatEntry = addChatMessage(room, {
            roomName,
            senderId: participant.id,
            sender: senderName,
            text,
          });

          broadcastToRoom(room, {
            type: MessageTypes.CHAT_MESSAGE,
            payload: { ...chatEntry, roomName },
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
