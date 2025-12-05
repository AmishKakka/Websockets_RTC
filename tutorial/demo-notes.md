# Realtime Study Rooms demo notes

This document captures the build steps for the Realtime Study Rooms demo so we can later turn it into a polished tutorial.

## Feature template

### Goal
- State the user-facing outcome for this feature.

### Files you will edit
- List the paths you expect to change.

### Steps
1. List the actions in order.

### Checkpoint
- Describe what to verify before moving on.

## Feature 0: Project setup and starter UI

### Goal
- Set up the repo locally and confirm the starter lobby UI loads.

### Files you will edit
- None yet; just install and run the server/client apps.

### Steps
1. Clone the repo locally.
2. Install server dependencies: `cd demo/server && npm install`.
3. Install client dependencies: `cd demo/client && npm install`.
4. Start the server: from `demo/server`, run `node src/index.js`.
5. Start the client: from `demo/client`, run `npm run dev`.
6. Visit the lobby in your browser (the dev server URL), then manually open `/room/test-room` to confirm routing.

### Checkpoint
- Lobby page renders, and navigating directly to `/room/test-room` loads the starter room view without errors in the console.

## Feature 1: WebSocket protocol overview

### Goal
- Understand the message types used between the browser and server.

### Files you will edit
- tutorial/demo-notes.md
- demo/server/src/messages.js
- demo/server/src/index.js
- demo/client WebSocket helper (currently inline within the page components)
- demo/client/src/pages/LobbyPage.jsx
- demo/client/src/pages/RoomPage.jsx

### Steps
1. `ROOM_LIST_SUBSCRIBE` — Browser lobby ➝ server to ask for the current rooms and future updates (server currently pushes an update on connect even without this message).
   ```json
   {"type":"ROOM_LIST_SUBSCRIBE"}
   ```
   Meaning: subscribe to lobby updates; server responds with `ROOM_LIST_UPDATE`.
2. `ROOM_LIST_UPDATE` — Server ➝ all connected clients to share lobby or room state. In the lobby it carries room summaries; after join it can also include participants and chat history.
   ```json
   {"type":"ROOM_LIST_UPDATE","payload":{"rooms":[{"id":"abc","name":"math-study","participants":2}]}}
   ```
   Another shape sent to a joining client includes room detail:
   ```json
   {"type":"ROOM_LIST_UPDATE","payload":{"roomId":"abc","roomName":"math-study","participants":[{"id":1,"name":"User 1"}],"chatHistory":[]}}
   ```
   Meaning: keep lobby and room UIs in sync with the server’s state.
3. `CREATE_ROOM` — Browser lobby ➝ server to explicitly create a new room.
   ```json
   {"type":"CREATE_ROOM","payload":{"roomName":"math-study","createdBy":"Pat"}}
   ```
   Meaning: request a room be created; in the current code a room is created implicitly when the first `JOIN_ROOM` arrives.
4. `JOIN_ROOM` — Browser room page ➝ server when a user enters a room.
   ```json
   {"type":"JOIN_ROOM","payload":{"roomName":"test-room","name":"Pat"}}
   ```
   Meaning: server tracks the participant, sends back a `ROOM_LIST_UPDATE` with participants and chat history, and broadcasts `PARTICIPANT_JOINED` plus a system message to everyone else.
5. `LEAVE_ROOM` — Browser ➝ server to exit a room.
   ```json
   {"type":"LEAVE_ROOM","payload":{"roomName":"test-room"}}
   ```
   Meaning: server should remove the participant and broadcast `PARTICIPANT_LEFT` (today the removal happens when the socket closes).
6. `CHAT_MESSAGE` — Browser ➝ server to send chat text; server ➝ room to fan it out with metadata.
   ```json
   {"type":"CHAT_MESSAGE","payload":{"text":"Hello team!"}}
   ```
   Broadcast shape after server enriches it:
   ```json
   {"type":"CHAT_MESSAGE","payload":{"id":"uuid","sender":"Pat","text":"Hello team!","timestamp":"2024-03-01T12:00:00.000Z"}}
   ```
   Meaning: carry chat content from one participant to all others.
7. `PARTICIPANT_JOINED` — Server ➝ room participants (except the joiner).
   ```json
   {"type":"PARTICIPANT_JOINED","payload":{"id":2,"name":"Alex"}}
   ```
   Meaning: update the participant list when someone enters.
8. `PARTICIPANT_LEFT` — Server ➝ room participants when someone leaves or disconnects.
   ```json
   {"type":"PARTICIPANT_LEFT","payload":{"id":2}}
   ```
   Meaning: remove the participant from the list and reflect that departure in the UI.

### Checkpoint
- After reading this section, you should be able to sketch a simple diagram showing how a chat message travels from one browser to the server and then out to every other client in the same room.

## Feature 2: Connecting and identifying over WebSockets

### Goal
- Establish a single WebSocket connection from the browser to the Node server and send a first message that identifies the user by nickname; the server will store a participant id and name for each connection.

### Files you will edit
- demo/server/src/index.js
- demo/server/src/rooms.js
- demo/client/src/ws/useWebSocketClient.js
- demo/client/src/pages/LobbyPage.jsx

### Steps
1. Create or reuse a WebSocket helper hook in the client to open one connection per tab and expose a `sendJsonMessage` utility.
2. After the socket connects, send an `IDENTIFY` message with the chosen nickname so the server can associate the connection with that user.
3. On the server, assign a new client id for each connection and store `{ id, name, ws }` in a map keyed by client id; update room participant creation to use the stored nickname when present.
4. Keep the nickname (and, later, the assigned client id) accessible to the Room page—pass the nickname via navigation state or URL params until a shared store is added.

### Checkpoint
- With devtools open, refresh the app: the server logs should show `Client <id> identified as <nickname>` for each tab, and each tab should maintain exactly one active WebSocket connection.

## Feature 3: Realtime lobby room list

### Goal
- Replace the hardcoded lobby room list with live data from WebSocket messages so multiple tabs stay in sync without manual refresh.

### Files you will edit
- demo/server/src/rooms.js
- demo/server/src/index.js
- demo/client/src/pages/LobbyPage.jsx

### Steps
1. Add a helper on the server that returns an array of room summaries (room name and participant count) from the in-memory rooms map.
2. When the server receives `ROOM_LIST_SUBSCRIBE`, add that connection to a subscribers set and immediately send `ROOM_LIST_UPDATE` with the current summaries.
3. Broadcast `ROOM_LIST_UPDATE` to all lobby subscribers whenever rooms are created or participants join/leave.
4. In `LobbyPage`, open a WebSocket on mount, send `ROOM_LIST_SUBSCRIBE`, keep a `rooms` state from incoming `ROOM_LIST_UPDATE` messages, and render the list from that state with graceful empty handling.

### Checkpoint
- With two browser tabs open on the lobby, creating a room in tab A should make that room appear in tab B within about a second, without pressing refresh.
