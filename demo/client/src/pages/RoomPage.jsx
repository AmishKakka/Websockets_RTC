import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useWebRTC } from '../ws/useWebRTC';
import VideoPlayer from '../components/VideoPlayer';

const RoomPage = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const nickname = location.state?.nickname || 'Anonymous';

  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [draft, setDraft] = useState('');
  const [joinError, setJoinError] = useState('');
  const [typingIndicator, setTypingIndicator] = useState('');
  const [isReadyToJoin, setIsReadyToJoin] = useState(false);

  const ws = useRef(null);
  const hasConnectedRef = useRef(false);
  const typingTimeoutRef = useRef(null);
  const lastTypingSentRef = useRef(0);

  const sendWsMessage = useCallback((type, payload) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type, payload }));
    }
  }, []);

  const {
    localStream,
    remoteStreams,
    isVideoEnabled,
    isAudioEnabled,
    initializeMedia,
    toggleVideo,
    toggleAudio,
    handleWebRTCSignal,
    connectToNewUser,
    removePeer,
  } = useWebRTC(roomId, sendWsMessage);

  useEffect(() => {
    const startCamera = async () => {
      await initializeMedia();
      setIsReadyToJoin(true);
    };
    startCamera();
  }, [initializeMedia]);

  useEffect(() => {
    if (!isReadyToJoin) return;
    console.log('MAIN');

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
      const { type, payload } = parsed;
      console.log('RX:', parsed);

      if (parsed.type.startsWith('WEBRTC_')) {
        handleWebRTCSignal(type, payload);
        return;
      }

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

        case 'REACTION': {
          // Ephemeral realtime signal; we surface lightweight feedback, not stored history.
          const { sender, emoji } = parsed.payload || {};
          if (sender && emoji) {
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now(),
                sender: 'Reaction',
                text: `${sender} reacted with ${emoji}`,
              },
            ]);
          }
          break;
        }

        case 'TYPING': {
          // Ephemeral realtime signal; should not be persisted.
          const sender = parsed.payload?.sender;
          const targetRoom = parsed.payload?.roomName;
          if (targetRoom && targetRoom !== roomId) break;
          if (sender && sender !== nickname) {
            setTypingIndicator(`${sender} is typing...`);
            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current);
            }
            typingTimeoutRef.current = setTimeout(() => {
              setTypingIndicator('');
              typingTimeoutRef.current = null;
            }, 3000);
          }
          break;
        }

        case 'SYSTEM_MESSAGE':
          setMessages((prev) => [
            ...prev,
            { id: Date.now(), sender: 'System', text: parsed.payload.text },
          ]);
          break;

        case 'PARTICIPANT_JOINED':
          setParticipants((prev) => [...prev, parsed.payload]);
          connectToNewUser(parsed.payload.id);
          break;

        case 'PARTICIPANT_LEFT':
          setParticipants((prev) =>
            prev.filter((p) => p.id !== parsed.payload.id)
          );
          removePeer(payload.id);
          break;

        default:
          break;
      }
    };

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      if (ws.current) ws.current.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, nickname, isReadyToJoin]);

  const logTodo = (label) => {
    console.log(`TODO: ${label}`);
    alert(`TODO: ${label}`);
  };

  const sendTyping = () => {
    const now = Date.now();
    if (now - lastTypingSentRef.current < 2000) return;
    lastTypingSentRef.current = now;
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          type: 'TYPING',
          payload: { roomName: roomId, sender: nickname },
        })
      );
    }
  };

  const handleDraftChange = (e) => {
    setDraft(e.target.value);
    sendTyping();
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

  const handleReaction = (emoji) => {
    if (!emoji) return;
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          type: 'REACTION',
          payload: { roomName: roomId, emoji, sender: nickname },
        })
      );
    }
  };

  remoteStreams.forEach((p) => console.log('remote:', p));

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
          <h3 className='section-title'>Video Area</h3>
          <div className='video-grid'>
            <div className='video-tile'>
              {localStream ? (
                <VideoPlayer stream={localStream} isLocal={true} />
              ) : (
                <div className='black-screen-placeholder'>
                  Loading Camera...
                </div>
              )}

              <div
                className='controls-overlay'
                style={{
                  position: 'absolute',
                  bottom: 10,
                  left: 10,
                  zIndex: 10,
                }}
              >
                <button
                  onClick={toggleVideo}
                  className={`btn btn-xs btn-pill ${
                    isVideoEnabled ? 'btn-primary' : 'btn-ghost'
                  }`}
                >
                  {isVideoEnabled ? 'Camera ON' : 'Camera OFF'}
                </button>
                <button
                  onClick={toggleAudio}
                  className={`btn btn-xs btn-pill ${
                    isAudioEnabled ? 'btn-primary' : 'btn-ghost'
                  }`}
                >
                  {isAudioEnabled ? 'Mic ON' : 'Mic OFF'}
                </button>
              </div>
            </div>

            {remoteStreams.map((peer) => {
              const participant = participants.find(
                (p) => String(p.id) === String(peer.id)
              );
              const displayName = participant
                ? participant.name
                : `User ${peer.id}`;

              return (
                <div key={peer.id} className='video-tile'>
                  <VideoPlayer
                    stream={peer.stream}
                    isLocal={false}
                    username={displayName}
                  />
                </div>
              );
            })}
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
              onChange={handleDraftChange}
            />
            <button
              type='button'
              className='btn btn-primary btn-pill'
              onClick={handleSend}
            >
              Send
            </button>
          </div>

          {typingIndicator && (
            <div
              style={{
                marginTop: 6,
                color: '#444',
                fontSize: 12,
                background: '#f3f4f6',
                padding: '6px 10px',
                borderRadius: 8,
              }}
              aria-live='polite'
            >
              {typingIndicator}
            </div>
          )}

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
                onClick={() => handleReaction(emoji)}
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
