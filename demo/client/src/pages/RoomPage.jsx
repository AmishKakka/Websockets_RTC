import React, { useState } from "react";
import { useParams } from "react-router-dom";

const dummyMessages = [
  { id: 1, author: "Alice", text: "Hey, ready to study?" },
  { id: 2, author: "Bob", text: "Yep! Starting with WebRTC basics." },
  { id: 3, author: "Carol", text: "I will take notes on signaling flows." },
];

const dummyParticipants = ["Alice", "Bob", "Carol", "You"];

const RoomPage = () => {
  const { roomId } = useParams();
  const [draft, setDraft] = useState("");

  const logTodo = (label) => {
    // TODO: replace this with real logic wired to WebSockets / WebRTC
    // This console.log is here so learners can see where behavior will be added.
    console.log(`TODO: ${label}`);
    alert(`TODO: ${label}`);
  };

  const handleSend = () => logTodo("send chat message over WebSocket");

  return (
    <div className="room-layout">
      <div className="room-main">
        <div className="card" style={{ padding: 16 }}>
          <h2 className="section-title" style={{ marginBottom: 4 }}>
            Room: {roomId}
          </h2>
          <p className="section-subtitle">
            Video, chat, reactions, and polls will all be wired to live
            WebSocket and WebRTC behavior in the later modules.
          </p>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <h3 className="section-title" style={{ marginBottom: 10 }}>
            Video area
          </h3>
          <div className="video-grid">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="video-tile">
                Video tile placeholder
              </div>
            ))}
          </div>
        </div>

        <div className="chat-card card">
          <h3 className="section-title" style={{ marginBottom: 8 }}>
            Chat
          </h3>
          <div className="chat-messages">
            {dummyMessages.map((m) => (
              <div key={m.id} className="chat-message">
                <strong>{m.author}:</strong> {m.text}
              </div>
            ))}
          </div>

          <div className="chat-input-row">
            <input
              className="input"
              placeholder="Type a message"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-primary btn-pill"
              onClick={handleSend}
            >
              Send
            </button>
          </div>

          <div className="chat-controls-row">
            <button
              type="button"
              className="btn btn-pill"
              onClick={() => logTodo("join WebRTC call")}
            >
              Join call
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-pill"
              onClick={() => logTodo("leave WebRTC call")}
            >
              Leave call
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-pill"
              onClick={() => logTodo("mute microphone")}
            >
              Mute
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-pill"
              onClick={() => logTodo("toggle camera")}
            >
              Toggle camera
            </button>
          </div>

          <div className="reaction-row">
            {["👍", "❤️", "😂", "🎉"].map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="btn btn-xs btn-pill"
                onClick={() => logTodo(`send reaction ${emoji}`)}
              >
                {emoji}
              </button>
            ))}
            <button
              type="button"
              className="btn btn-xs btn-pill btn-ghost"
              onClick={() => logTodo("start poll")}
            >
              Start poll
            </button>
          </div>
        </div>
      </div>

      <aside className="room-sidebar card-soft">
        <h3 className="section-title">Participants</h3>
        <p className="section-subtitle">
          This list is hardcoded for now. Later you will populate it from
          WebSocket presence events.
        </p>
        <div className="participant-list">
          {dummyParticipants.map((name) => (
            <div key={name} className="participant">
              {name}
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
};

export default RoomPage;
