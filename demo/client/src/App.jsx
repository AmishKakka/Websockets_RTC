import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LobbyPage from './pages/LobbyPage.jsx';
import RoomPage from './pages/RoomPage.jsx';
import Layout from './components/Layout.jsx';

function App() {
  // TODO: Wire in networking hooks for WebSocket/WebRTC once implemented.
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<LobbyPage />} />
          <Route path="/rooms/:roomId" element={<RoomPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
