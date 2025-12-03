import React from "react";

const Layout = ({ children }) => {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-top">
          <div>
            <div className="app-title">Realtime Study Rooms</div>
            <div className="app-subtitle">Learn WebSockets + WebRTC by building</div>
          </div>
          <div className="app-badge">Demo project</div>
        </div>
      </header>
      <main className="app-main">
        <div className="app-main-inner">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
