import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LobbyPage = () => {
  const [nickname, setNickname] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [rooms, setRooms] = useState([]);
  const [selectedRoomName, setSelectedRoomName] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const ws = useRef(null);
  const nicknameRef = useRef('');

  useEffect(() => {
    nicknameRef.current = nickname;
  }, [nickname]);

  useEffect(() => {
    // Tip: open two tabs; both subscribe here and will receive live ROOM_LIST_UPDATE pushes as rooms change.
    ws.current = new WebSocket('ws://localhost:3001');

    ws.current.onopen = () => {
      console.log('Lobby connected to server');
      // TODO: Send IDENTIFY with nickname once collected so the server knows this user.
      ws.current.send(JSON.stringify({ type: 'ROOM_LIST_SUBSCRIBE' }));
    };

    ws.current.onmessage = (event) => {
      try {
        const { type, payload } = JSON.parse(event.data);
        if (type === 'ROOM_LIST_UPDATE' && payload.rooms) {
          setRooms(payload.rooms);
        } else if (type === 'ERROR') {
          setError(payload?.reason || 'Something went wrong.');
        } else if (type === 'CREATE_ROOM_SUCCESS') {
          setError('');
          const roomName = payload?.roomName;
          if (roomName) {
            navigate(`/room/${roomName}`, {
              state: { nickname: nicknameRef.current },
            });
          }
        }
      } catch (err) {
        console.error('Lobby WS Error:', err);
      }
    };

    return () => {
      if (ws.current) ws.current.close();
    };
  }, []);

  const handleCreateRoom = () => {
    if (!nickname.trim()) {
      setNicknameError('Please enter a nickname first.');
      return;
    }
    setNicknameError('');
    const newRoomName = prompt('Enter new room name:');
    if (newRoomName) {
      setError('');
      if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
        setError('Connecting to server. Please try again in a moment.');
        return;
      }
      ws.current.send(
        JSON.stringify({
          type: 'CREATE_ROOM',
          payload: { roomName: newRoomName, createdBy: nickname },
        })
      );
    }
  };

  const handleJoinRoom = () => {
    if (!selectedRoomName) {
      setError('Please select a room to join.');
      return;
    }
    if (!nickname.trim()) {
      setNicknameError('Please enter a nickname.');
      return;
    }
    setNicknameError('');
    setError('');
    navigate(`/room/${selectedRoomName}`, { state: { nickname } });
  };

  return (
    <div className='lobby-grid card'>
      <section className='lobby-left'>
        <h2 className='section-title'>Welcome</h2>
        <p className='section-subtitle'>
          Pick a display name and join a study room. Later, WebSockets will keep
          this lobby live.
        </p>

        <div style={{ marginTop: 16, maxWidth: 360 }}>
          <label
            htmlFor='nickname'
            style={{ display: 'block', fontSize: 13, marginBottom: 6 }}
          >
            Nickname
          </label>
          <input
            id='nickname'
            className='input'
            placeholder='Enter your display name'
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value);
              if (nicknameError) setNicknameError('');
            }}
          />
          {nicknameError && (
            <p style={{ color: '#d22', marginTop: 6 }}>{nicknameError}</p>
          )}
          <p className='text-muted' style={{ marginTop: 6 }}>
            This will show up in chat, reactions, and the participant list.
          </p>
        </div>
      </section>

      <section className='lobby-right card-soft'>
        <h2 className='section-title'>Available rooms</h2>
        <p className='section-subtitle'>
          {rooms.length === 0
            ? 'No active rooms. Create one to get started!'
            : 'Join an active conversation below.'}
        </p>

        <div className='room-list'>
          {rooms.map((room) => {
            const selected = room.name === selectedRoomName;
            const count = room.participantCount ?? room.participants ?? 0;
            return (
              <button
                key={room.id || room.name}
                type='button'
                className={`room-card ${selected ? 'selected' : ''}`}
                onClick={() => setSelectedRoomName(room.name)}
              >
                <div className='room-card-main'>
                  <span className='room-dot' />
                  <div>
                    <div className='room-name'>{room.name}</div>
                    <div className='room-meta'>
                      {count} participants
                    </div>
                  </div>
                </div>
                <span className='room-meta'>Join</span>
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
          <button
            type='button'
            className='btn btn-ghost btn-pill'
            onClick={handleCreateRoom}
          >
            + Create room
          </button>
          <button
            type='button'
            className='btn btn-primary btn-pill'
            onClick={handleJoinRoom}
          >
            Join selected room
          </button>
        </div>
        {error && (
          <p style={{ color: '#d22', marginTop: 8, fontSize: 13 }}>{error}</p>
        )}
      </section>
    </div>
  );
};

export default LobbyPage;
