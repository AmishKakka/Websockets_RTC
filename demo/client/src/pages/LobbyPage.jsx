import React, { useState } from "react";

const dummyRooms = [
  { id: "algos", name: "Algorithms Study", participants: 3 },
  { id: "webrtc", name: "WebRTC Lab", participants: 2 },
  { id: "db", name: "Databases Deep Dive", participants: 4 },
];

const LobbyPage = () => {
  const [nickname, setNickname] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState(dummyRooms[0]?.id);

  const handleCreateRoom = () => {
    alert("TODO: implement create room with WebSocket + navigation");
  };

  const handleJoinRoom = () => {
    if (!selectedRoomId) {
      alert("Please select a room to join.");
      return;
    }
    alert(
      `TODO: navigate to /rooms/${selectedRoomId} and join via WebSocket as ${nickname ||
        "anonymous"}`
    );
  };

  return (
    <div className="lobby-grid card">
      <section className="lobby-left">
        <h2 className="section-title">Welcome</h2>
        <p className="section-subtitle">
          Pick a display name and join a study room. Later, WebSockets will keep
          this lobby live.
        </p>

        <div style={{ marginTop: 16, maxWidth: 360 }}>
          <label
            htmlFor="nickname"
            style={{ display: "block", fontSize: 13, marginBottom: 6 }}
          >
            Nickname
          </label>
          <input
            id="nickname"
            className="input"
            placeholder="Enter your display name"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
          <p className="text-muted" style={{ marginTop: 6 }}>
            This will show up in chat, reactions, and the participant list.
          </p>
        </div>
      </section>

      <section className="lobby-right card-soft">
        <h2 className="section-title">Available rooms</h2>
        <p className="section-subtitle">
          These rooms are currently hardcoded. In the tutorial, you will replace
          them with realtime data from the WebSocket server.
        </p>

        <div className="room-list">
          {dummyRooms.map((room) => {
            const selected = room.id === selectedRoomId;
            return (
              <button
                key={room.id}
                type="button"
                className={`room-card ${selected ? "selected" : ""}`}
                onClick={() => setSelectedRoomId(room.id)}
              >
                <div className="room-card-main">
                  <span className="room-dot" />
                  <div>
                    <div className="room-name">{room.name}</div>
                    <div className="room-meta">
                      {room.participants} participants
                    </div>
                  </div>
                </div>
                <span className="room-meta">Join</span>
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
          <button
            type="button"
            className="btn btn-ghost btn-pill"
            onClick={handleCreateRoom}
          >
            + Create room
          </button>
          <button
            type="button"
            className="btn btn-primary btn-pill"
            onClick={handleJoinRoom}
          >
            Join selected room
          </button>
        </div>
      </section>
    </div>
  );
};

export default LobbyPage;
