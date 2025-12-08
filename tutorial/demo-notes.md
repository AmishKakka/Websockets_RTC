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
4. Start the server: from `demo/server`, run `npm run dev`.
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
   { "type": "ROOM_LIST_SUBSCRIBE" }
   ```
   Meaning: subscribe to lobby updates; server responds with `ROOM_LIST_UPDATE`.
2. `ROOM_LIST_UPDATE` — Server ➝ all connected clients to share lobby or room state. In the lobby it carries room summaries; after join it can also include participants and chat history.
   ```json
   {
     "type": "ROOM_LIST_UPDATE",
     "payload": {
       "rooms": [{ "id": "abc", "name": "math-study", "participants": 2 }]
     }
   }
   ```
   Another shape sent to a joining client includes room detail:
   ```json
   {
     "type": "ROOM_LIST_UPDATE",
     "payload": {
       "roomId": "abc",
       "roomName": "math-study",
       "participants": [{ "id": 1, "name": "User 1" }],
       "chatHistory": []
     }
   }
   ```
   Meaning: keep lobby and room UIs in sync with the server’s state.
3. `CREATE_ROOM` — Browser lobby ➝ server to explicitly create a new room.
   ```json
   {
     "type": "CREATE_ROOM",
     "payload": { "roomName": "math-study", "createdBy": "Pat" }
   }
   ```
   Meaning: request a room be created; in the current code a room is created implicitly when the first `JOIN_ROOM` arrives.
4. `JOIN_ROOM` — Browser room page ➝ server when a user enters a room.
   ```json
   {
     "type": "JOIN_ROOM",
     "payload": { "roomName": "test-room", "name": "Pat" }
   }
   ```
   Meaning: server tracks the participant, sends back a `ROOM_LIST_UPDATE` with participants and chat history, and broadcasts `PARTICIPANT_JOINED` plus a system message to everyone else.
5. `LEAVE_ROOM` — Browser ➝ server to exit a room.
   ```json
   { "type": "LEAVE_ROOM", "payload": { "roomName": "test-room" } }
   ```
   Meaning: server should remove the participant and broadcast `PARTICIPANT_LEFT` (today the removal happens when the socket closes).
6. `CHAT_MESSAGE` — Browser ➝ server to send chat text; server ➝ room to fan it out with metadata.
   ```json
   { "type": "CHAT_MESSAGE", "payload": { "text": "Hello team!" } }
   ```
   Broadcast shape after server enriches it:
   ```json
   {
     "type": "CHAT_MESSAGE",
     "payload": {
       "id": "uuid",
       "sender": "Pat",
       "text": "Hello team!",
       "timestamp": "2024-03-01T12:00:00.000Z"
     }
   }
   ```
   Meaning: carry chat content from one participant to all others.
7. `PARTICIPANT_JOINED` — Server ➝ room participants (except the joiner).
   ```json
   { "type": "PARTICIPANT_JOINED", "payload": { "id": 2, "name": "Alex" } }
   ```
   Meaning: update the participant list when someone enters.
8. `PARTICIPANT_LEFT` — Server ➝ room participants when someone leaves or disconnects.
   ```json
   { "type": "PARTICIPANT_LEFT", "payload": { "id": 2 } }
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

## Feature 4: Robust create and join room flow

### Goal

- Allow users to create and join rooms from the lobby with basic validation and friendly error messages, avoiding alerts or silent failures.

### Files you will edit

- demo/server/src/index.js
- demo/client/src/pages/LobbyPage.jsx
- demo/client/src/pages/RoomPage.jsx

### Steps

1. Validate room name and nickname on the client before sending create or join requests.
2. On the server, validate `CREATE_ROOM` and `JOIN_ROOM` messages and reply with either a success payload or an `ERROR` payload.
3. In `LobbyPage`, handle `ERROR` messages by setting an error state and rendering a small red message; on success, clear errors and navigate to `/room/:roomName`.
4. In `RoomPage`, handle a failed join by showing a brief error and redirecting back to the lobby.

### Checkpoint

- Trying to join a non-existing room or leaving the nickname empty should show a clear message on the lobby, not a broken room view or a JavaScript error.

## Feature 5: Realtime chat inside a room

### Goal

- Turn the chat area on the Room page into a realtime chat timeline that stays synchronized between all participants in a room.

### Files you will edit

- demo/server/src/rooms.js
- demo/server/src/index.js
- demo/client/src/pages/RoomPage.jsx

### Steps

1. On the server, handle `CHAT_MESSAGE` by verifying the sender is a member of the target room; reject or ignore messages from non-members. Append the message to the room's `chatHistory`, keeping only the last N messages, and broadcast a standardized chat payload (room name, sender name, text, timestamp) to everyone in the room.
2. When a participant joins a room, include the last N messages from `chatHistory` in the join success payload so their chat UI starts with recent context.
3. On the client Room page, replace any placeholder chat content with a `messages` state that initializes from the server's join payload and appends each incoming chat event.
4. When the user clicks "Send", emit a `CHAT_MESSAGE` to the server but do not add it to the UI until the server echoes it back, ensuring all tabs stay in sync and ordering stays consistent.

### Checkpoint

- With two tabs in the same room, sending "hello" from tab A should make "hello" appear in both chat timelines almost immediately, in the same order on both sides.

## Feature 6: Live participants list

### Goal

- Wire the Participants sidebar so it always reflects who is actually in the room, updating when users join, leave, or close their tab.

### Files you will edit

- demo/server/src/rooms.js
- demo/server/src/index.js
- demo/client/src/pages/RoomPage.jsx

### Steps

1. On the server, keep a `Map` of participants per room and update it whenever someone joins or leaves.
2. Broadcast a `PARTICIPANTS_UPDATE` message containing an array of `{ id, name }` to everyone in the room whenever membership changes.
3. In `RoomPage`, update the `participants` state whenever a `PARTICIPANTS_UPDATE` message arrives for the current room.
4. Render the participants list in the sidebar, optionally highlighting the current user so they can spot themselves.

### Checkpoint

- With two tabs in the same room, when one tab closes or explicitly leaves, the other tab should see that participant disappear from the list almost immediately.

## Feature 7: Reactions and typing indicators

### Goal

- Add lightweight realtime signals on top of chat, so participants can send emoji reactions and see who is currently typing.

### Files you will edit

- demo/server/src/index.js
- demo/client/src/pages/RoomPage.jsx

### Steps

1. From the client, send a `REACTION` message when an emoji button is clicked, including `roomName`, the emoji string, and the sender name.
2. On the server, broadcast `REACTION` events to all participants in that room.
3. On the client, show brief visual feedback when a `REACTION` event arrives, such as a small floating emoji or a lightweight "X reacted with 🎉" entry.
4. Send `TYPING` messages from the client when the user types in the chat input, with basic throttling so these aren't spammy.
5. Show a "X is typing..." label when `TYPING` events are received, and hide it after a short timeout.

### Checkpoint

- With two tabs in the same room, clicking a reaction in one tab should trigger visible feedback in the other tab, and typing in one tab should show a "X is typing..." message in the other.

## Feature 8: WebRTC signaling overview

### Goal

- Give the learner a mental model of how WebRTC signaling rides on the existing WebSocket connection, including the offer/answer/ICE message types and which side sends each.

### Files you will edit

- demo/server/src/messages.js
- demo/server/src/index.js
- demo/client/src/ws/useWebSocketClient.js
- demo/client/src/ws/useWebRTC.js
- demo/client/src/pages/RoomPage.jsx

### Steps

1. Add WebRTC-specific message types (`WEBRTC_OFFER`, `WEBRTC_ANSWER`, `WEBRTC_ICE_CANDIDATE`) to the shared `messages.js` enum so both server and client agree on signaling events.
2. Decide who sends which payload: the caller sends `WEBRTC_OFFER { targetId, roomName, sdp }`, the callee replies with `WEBRTC_ANSWER { targetId, roomName, sdp }`, and both sides emit `WEBRTC_ICE_CANDIDATE { targetId, roomName, candidate }` as ICE discovers network paths.
3. In the Node server handler, add cases that simply relay these signaling messages to the intended peer(s) in the same room, tagging them with `senderId` and using the existing WebSocket routing instead of trying to interpret SDP/ICE on the server.
4. In the client WebSocket helper (or the inline socket in `RoomPage`), wire `useWebRTC` so it can send signaling over the established WebSocket and intercept any `WEBRTC_*` messages before they hit the rest of the chat/participants switch.
5. In `useWebRTC` and `RoomPage`, decide when to start the handshake: after a user joins a room, existing participants call `connectToNewUser` to emit an offer to the newcomer, and when a `WEBRTC_OFFER` arrives the callee sets the remote description, creates an answer, and processes queued ICE candidates.

### Checkpoint

- You can sketch the message flow for someone joining a call: which `WEBRTC_*` messages travel over WebSockets, who originates each one, and how the server forwards them so peers can establish a direct media connection.

## Feature 9: Joining a call and showing your own video

### Goal

- Wire up `getUserMedia`, create a WebRTC `RTCPeerConnection`, and show your own camera feed in the Video area when you join a call.

### Files you will edit

- demo/client/src/ws/useWebRTC.js
- demo/client/src/components/VideoPlayer.jsx
- demo/client/src/pages/RoomPage.jsx

### Steps

1. Build a `useWebRTC` hook that calls `navigator.mediaDevices.getUserMedia({ video: true, audio: true })`, stores the local stream in state/refs, and attaches those tracks to new `RTCPeerConnection` instances configured with STUN servers.
2. Have the hook expose helpers for the page to call: initialize/join (start local media), `toggleAudio`, `toggleVideo`, `handleWebRTCSignal` (to process offers/answers/ICE), `connectToNewUser` (to initiate an offer), `removePeer`, `leaveCall`, plus `localStream` and `remoteStreams`.
3. In `RoomPage`, after the user is ready to join, open the WebSocket, send `JOIN_ROOM`, and wire incoming `WEBRTC_*` events to `handleWebRTCSignal`; when `PARTICIPANT_JOINED` arrives, call `connectToNewUser` to start the offer/answer exchange over the WebSocket signaling channel.
4. Render the first video tile with the local stream using `VideoPlayer`, mirroring it when `isLocal` is true and overlaying the user’s name; render additional tiles for each remote stream with the matching participant’s display name.
5. Add UI controls that call `toggleAudio`/`toggleVideo`, disable them until the local stream exists, and surface basic errors if camera/mic access is denied (e.g., log and show a brief message before redirecting).
6. Ensure cleanup on leave/unmount by calling `leaveCall` to stop local tracks, close peer connections, clear remote streams, and close the room’s WebSocket connection.

### Checkpoint

- In a room, clicking “Join call” starts the camera and shows your own video in the first tile; clicking “Leave call” or navigating away stops tracks, closes peers, and removes your video from the grid.

## Feature 10: Remote peers and video tiles

### Goal

- Connect multiple participants in the same room over WebRTC, receive their media tracks, and render remote video tiles labeled with participant names.

### Files you will edit

- demo/server/src/index.js
- demo/client/src/ws/useWebRTC.js
- demo/client/src/components/VideoPlayer.jsx
- demo/client/src/pages/RoomPage.jsx

### Steps

1. In `useWebRTC.js`, create/manage one `RTCPeerConnection` per remote participant, attaching local tracks and wiring `onicecandidate` to send `WEBRTC_ICE_CANDIDATE` over the WebSocket signaling channel and `ontrack` to capture incoming media.
2. When a participant joins, start the offer/answer exchange: existing peers call `connectToNewUser` to emit a `WEBRTC_OFFER`, and receivers handle `WEBRTC_OFFER` by setting the remote description, creating/sending a `WEBRTC_ANSWER`, and queuing/adding ICE candidates until negotiation completes.
3. Collect incoming `MediaStream` objects from `ontrack`, store them alongside the sender/participant id, and keep this list updated as new tracks arrive.
4. In `RoomPage`, render one `VideoPlayer` per remote stream in the Video area, matching each stream’s id to the participant list to show the correct display name.
5. On `PARTICIPANT_LEFT`, explicit leave, or page unmount, close the corresponding peer connection, drop its stream from state, and ensure the tile disappears so only active participants are shown.

### Checkpoint

- With two browser tabs in the same room, after both click “Join call”, each tab shows its own video plus the other user’s video in separate tiles; when one tab leaves, the other tab’s remote tile disappears. 

## Feature 11: Media controls and leaving the call cleanly

### Goal

- Wire the mute and toggle camera controls, and ensure leaving the call tears down WebRTC state and media tracks cleanly for everyone.

### Files you will edit

- demo/client/src/ws/useWebRTC.js
- demo/client/src/pages/RoomPage.jsx

### Steps

1. In `useWebRTC.js`, implement `toggleAudio` and `toggleVideo` to enable/disable the relevant tracks on the local stream and expose the current booleans so the UI can reflect state.
2. Connect the RoomPage buttons (“Mute”, “Stop/Start Video”) to these handlers, disabling them until the local stream exists and swapping labels/styles based on `isAudioEnabled`/`isVideoEnabled`.
3. Add a `leaveCall` helper in `useWebRTC.js` that stops all local tracks, closes every `RTCPeerConnection`, clears refs, and resets `localStream`/`remoteStreams`.
4. Call `leaveCall` when the user clicks “Leave call” and in the RoomPage cleanup effect so no orphaned peers or active camera/mic remain after navigation.
5. Optionally emit a lightweight leave/signal message so other peers can drop the corresponding remote tile immediately when someone exits the call.

### Checkpoint

- You can mute/unmute and toggle the camera mid-call, and leaving the call reliably closes connections, removes all video tiles, and releases camera/mic access in both tabs.
