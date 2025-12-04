/**
 * Participant shape:
 * { id, name, ws } where ws is the WebSocket connection.
 */

const { v4: uuidv4 } = require('uuid');
const rooms = new Map();

class Room {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.participants = new Map();
    this.chatHistory = [];
    this.activePoll = null;
  }
}

function getRoomMetaData() {
  const summaries = [];
  for (const [id, room] of rooms.entries()) {
    summaries.push({
      id: room.id,
      name: room.name,
      participants: room.participants.size,
    });
  }
  return summaries;
}

function getOrCreateRoom(name) {
  if (rooms.has(name)) {
    return rooms.get(name);
  }
  const newRoom = new Room(uuidv4(), name);
  rooms.set(name, newRoom);
  return newRoom;
}

function joinRoom(roomName, participant) {
  const room = getOrCreateRoom(roomName);
  room.participants.set(participant.id, participant);
  return room;
}

function removeParticipantFromAllRooms(participantId) {
  const participantRemovedFromRooms = [];

  for (const [roomName, room] of rooms.entries()) {
    if (room.participants.has(participantId)) {
      room.participants.delete(participantId);
      participantRemovedFromRooms.push(room);

      // Delete room if empty
      if (room.participants.size === 0) {
        rooms.delete(roomName);
      }
    }
  }
  return participantRemovedFromRooms;
}

function addChatMessage(room, messageData) {
  const chatEntry = {
    id: uuidv4(),
    sender: messageData.sender,
    text: messageData.text,
    timestamp: new Date().toISOString(),
  };

  // Keep last 50 messages
  room.chatHistory.push(chatEntry);
  if (room.chatHistory.length > 50) {
    room.chatHistory.shift();
  }
  return chatEntry;
}

module.exports = {
  getOrCreateRoom,
  joinRoom,
  removeParticipantFromAllRooms,
  addChatMessage,
  getRoomMetaData,
};
