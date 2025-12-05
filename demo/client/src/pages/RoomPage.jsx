import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

const RoomPage = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const nickname = location.state?.nickname || 'Anonymous';

  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [draft, setDraft] = useState('');
  const [joinError, setJoinError] = useState('');

  const ws = useRef(null);
  const hasConnectedRef = useRef(false);

  useEffect(() => {
    // In React 18 StrictMode (dev), effects mount twice; guard so we don't
    // create/close two sockets and emit duplicate join/leave events.
    // Testing tip: open two tabs, join the same room, and confirm chat stays in sync across both.
    if (hasConnectedRef.current) return;
    hasConnectedRef.current = true;

    ws.current = new WebSocket('ws://localhost:3001');

    ws.current.onopen = () => {
      console.log('Connected to Room');
      ws.current.send(
        JSON.stringify({
          type: 'JOIN_ROOM',
          payload: { roomName: roomId, name: nickname },
        })
      );
    };

    ws.current.onmessage = (event) => {
      const parsed = JSON.parse(event.data);
      console.log('RX:', parsed);

      switch (parsed.type) {
        case 'ERROR':
        case 'JOIN_ROOM_FAILED': {
          // TODO: Replace with richer error messaging/retry guidance in the tutorial.
          setJoinError(parsed.payload?.reason || 'Unable to join room.');
          setTimeout(() => navigate('/'), 1200);
          break;
        }

        case 'JOIN_ROOM_SUCCESS': {
          const participantsPayload = parsed.payload?.participants || [];
          const chatHistoryPayload = parsed.payload?.chatHistory || [];
          setParticipants(participantsPayload);
          setMessages(chatHistoryPayload);
          break;
        }

        case 'ROOM_LIST_UPDATE':
          if (parsed.payload.participants) {
            setParticipants(parsed.payload.participants);
          }
          if (parsed.payload.chatHistory) {
            setMessages(parsed.payload.chatHistory);
          }
          break;

        case 'PARTICIPANTS_UPDATE': {
          const updated = parsed.payload?.participants;
          if (Array.isArray(updated)) {
            setParticipants(updated);
          }
          break;
        }

        case 'CHAT_MESSAGE':
          setMessages((prev) => [...prev, parsed.payload]);
          break;

        case 'SYSTEM_MESSAGE':
          setMessages((prev) => [
            ...prev,
            { id: Date.now(), sender: 'System', text: parsed.payload.text },
          ]);
          break;

        case 'PARTICIPANT_JOINED':
          setParticipants((prev) => [...prev, parsed.payload]);
          break;

        case 'PARTICIPANT_LEFT':
          setParticipants((prev) =>
            prev.filter((p) => p.id !== parsed.payload.id)
          );
          break;

        default:
          break;
      }
    };

    return () => {
      if (ws.current) ws.current.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, nickname]);

  const logTodo = (label) => {
    console.log(`TODO: ${label}`);
    alert(`TODO: ${label}`);
  };

  const handleSend = () => {
    if (!draft.trim()) return;

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          type: 'CHAT_MESSAGE',
          payload: { text: draft },
        })
      );
      setDraft('');
    }
  };

  return (
    <div className='room-layout'>
      <div className='room-main'>
        <div className='card' style={{ padding: 16 }}>
          <h2 className='section-title' style={{ marginBottom: 4 }}>
            Room: {roomId}
          </h2>
          {joinError && (
            <p style={{ color: '#d22', marginTop: 4, fontSize: 13 }}>
              {joinError} Redirecting to lobby...
            </p>
          )}
          <p className='section-subtitle'>
            Video, chat, reactions, and polls will all be wired to live
            WebSocket and WebRTC behavior in the later modules.
          </p>
        </div>

        <div className='card' style={{ padding: 16 }}>
          <h3 className='section-title' style={{ marginBottom: 10 }}>
            Video area
          </h3>
          <div className='video-grid'>
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className='video-tile'>
                Video tile placeholder
              </div>
            ))}
          </div>
        </div>

        <div className='chat-card card'>
          <h3 className='section-title' style={{ marginBottom: 8 }}>
            Chat
          </h3>
          <div className='chat-messages'>
            {messages.map((m, idx) => (
              <div key={m.id || idx} className='chat-message'>
                <strong>{m.sender}:</strong> {m.text}
              </div>
            ))}
            {messages.length === 0 && (
              <div style={{ color: '#888', fontStyle: 'italic' }}>
                No messages yet.
              </div>
            )}
          </div>

          <div className='chat-input-row'>
            <input
              className='input'
              placeholder='Type a message'
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button
              type='button'
              className='btn btn-primary btn-pill'
              onClick={handleSend}
            >
              Send
            </button>
          </div>

          <div className='chat-controls-row'>
            <button
              type='button'
              className='btn btn-pill'
              onClick={() => logTodo('join WebRTC call')}
            >
              Join call
            </button>
            <button
              type='button'
              className='btn btn-ghost btn-pill'
              onClick={() => logTodo('leave WebRTC call')}
            >
              Leave call
            </button>
            <button
              type='button'
              className='btn btn-ghost btn-pill'
              onClick={() => logTodo('mute microphone')}
            >
              Mute
            </button>
            <button
              type='button'
              className='btn btn-ghost btn-pill'
              onClick={() => logTodo('toggle camera')}
            >
              Toggle camera
            </button>
          </div>

          <div className='reaction-row'>
            {['👍', '❤️', '😂', '🎉'].map((emoji) => (
              <button
                key={emoji}
                type='button'
                className='btn btn-xs btn-pill'
                onClick={() => logTodo(`send reaction ${emoji}`)}
              >
                {emoji}
              </button>
            ))}
            <button
              type='button'
              className='btn btn-xs btn-pill btn-ghost'
              onClick={() => logTodo('start poll')}
            >
              Start poll
            </button>
          </div>
        </div>
      </div>

      <aside className='room-sidebar card-soft'>
        <h3 className='section-title'>Participants</h3>
        <div className='participant-list'>
          {participants.map((p) => (
            <div key={p.id} className='participant'>
              {p.name} {p.name === nickname ? '(You)' : ''}
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
};

export default RoomPage;
