import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className='home-container'>
      <header className='hero'>
        <h1>SER421: Real-Time Web Communication</h1>
        <h2>WebSockets & WebRTC</h2>
        <p>
          An interactive critical inquiry project exploring how the modern web
          handles real-time data and peer-to-peer streaming.
        </p>
      </header>

      <main className='main-content'>
        <section className='info-card'>
          <h3>📚 The Tutorial</h3>
          <p>
            Learn the history of HTTP polling, the evolution of WebSockets, and
            the complex architecture of WebRTC through 3 interactive modules.
          </p>
        </section>

        <section className='info-card'>
          <h3>🚀 The Demo</h3>
          <p>
            Experience a live implementation featuring a group chat room and a
            video calling application built from scratch.
          </p>
        </section>
      </main>

      <div className='action-area'>
        <Link to='/module1' className='start-button'>
          Start Module 1: History & Concepts
        </Link>
      </div>

      <footer>
        <p>SER421 Fall 2025 | Advanced Project Team</p>
      </footer>
    </div>
  );
};

export default Home;
