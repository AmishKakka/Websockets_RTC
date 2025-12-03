import React from 'react';
import { Link } from 'react-router-dom';
import Quiz from '../components/Quiz';
import './Modules.css';


function Module1() {  
  const module1Questions = [
    {
      id: 'q1',
      question: "Which organization standardized the WebSocket Protocol (RFC 6455)?",
      options: [
        { value: 'a', label: "W3C (World Wide Web Consortium)" },
        { value: 'b', label: "IETF (Internet Engineering Task Force)" },
        { value: 'c', label: "Mozilla Foundation" }
      ],
      correctAnswer: 'b'
    },
    {
      id: 'q2',
      question: "Before WebSockets, what technique kept an HTTP request open indefinitely?",
      options: [
        { value: 'a', label: "Short Polling" },
        { value: 'b', label: "Long Polling (Comet)" },
        { value: 'c', label: "DNS Flushing" }
      ],
      correctAnswer: 'b'
    },
    {
      id: 'q3',
      question: "Which HTTP header is used to switch to the WebSocket protocol?",
      options: [
        { value: 'upgrade', label: "Upgrade: websocket" },
        { value: 'accept', label: "Accept: text/event-stream" },
        { value: 'auth', label: "Authorization: Socket" }
      ],
      correctAnswer: 'upgrade'
    },
    {
      id: 'q4',
      question: "What HTTP status code indicates a successful switch to WebSockets?",
      options: [
        { value: '200', label: "200 OK" },
        { value: '101', label: "101 Switching Protocols" },
        { value: '301', label: "301 Moved Permanently" }
      ],
      correctAnswer: '101'
    },
    {
      id: 'q5',
      question: "Why does the client send a 'Sec-WebSocket-Key'?",
      options: [
        { value: 'a', label: "To encrypt the video stream." },
        { value: 'b', label: "To prove to the server that the client actually requested a WebSocket (preventing caching issues)." },
        { value: 'c', label: "To compress the data." }
      ],
      correctAnswer: 'b'
    }
  ];

  return (
    <div className="module-container">
      {}
      <nav className="sidebar">
        <h2>Real-Time Web</h2>
        <Link to="/" className="sidebar-link">Home</Link>
        <Link to="/module1" className="sidebar-link active">Module 1: History and Fundamentals</Link>
        <Link to="/module2" className="sidebar-link">Module 2: Analysis</Link>
        <Link to="/module3" className="sidebar-link">Module 3: Hands-on work</Link>
      </nav>

      {}
      <main className="main-content">
        <h1>Module 1: The Fundamentals</h1>
        <p>Before writing code, we must understand the shift from standard HTTP to real-time protocols and the standards bodies that govern them.</p>

        <section>
          <h2>1. Learning Outcomes</h2>
          <p>At the conclusion of this tutorial, you will be able to:</p>
          <ul>
            <li><strong>Differentiate</strong> between the stateless nature of HTTP/REST and the stateful nature of WebSockets.</li>
            <li><strong>Explain</strong> the historical progression from Plugins (Flash) to Comet to standardized WebSockets.</li>
            <li><strong>Identify</strong> the roles of the IETF and W3C in standardizing Real-Time Communications.</li>
          </ul>
        </section>

        <section>
          <h2>2. History & Standards</h2>
          
          <h3>The Era of "Fake" Real-Time (1995-2010)</h3>
          <p>The web was originally designed to be stateless. To achieve real-time bi-directional communication, developers historically used clumsy workarounds:</p>
          <ul>
            <li><strong>Plugins (Java Applets & Flash):</strong> In the early 2000s, plugins were the only way to establish raw TCP sockets. This posed massive security risks and required users to install extra software.</li>
            <li><strong>HTTP Polling:</strong> The client asks the server "Do you have data?" every 1-2 seconds. This created immense header overhead and server load.</li>
            <li><strong>Comet (Long-Polling):</strong> A hack where the client opens an HTTP request, and the server <em>holds it open</em> until data arrives. While effective, it was not a true bi-directional protocol.</li>
          </ul>

          <h3>The Standardization of WebSockets (2011)</h3>
          <p>To solve these hacks, <strong>Ian Hickson and Google Chrome</strong> introduced the WebSocket API. It was standardized by two major bodies to ensure interoperability:</p>
          
          <div className="note">
            <strong>Key Distinction: The Protocol vs. The API</strong>
            <ul>
                <li><strong>The IETF (Internet Engineering Task Force):</strong> Standardized the <em>Wire Protocol</em>. This defines how binary 0s and 1s travel over the network. The standard is <strong>RFC 6455</strong>.</li>
                <li><strong>The W3C (World Wide Web Consortium):</strong> Standardized the <em>API</em>. This defines how JavaScript developers interact with the protocol (e.g., <code>new WebSocket()</code>, <code>onmessage</code>).</li>
            </ul>
          </div>

          <p>This separation ensured that a WebSocket client written in JavaScript could talk to a WebSocket server written in Python, Java, or C++.</p>
          
          <div className="diagram-container">
             {}
             <img 
                src="/images/polling-vs-socket.png" 
                alt="Comparison of HTTP Polling vs WebSockets" 
                style={{maxWidth: '100%'}}
             />
             <p><em>Fig 1: Notice how WebSockets keep the connection open versus the repeated open/close of Polling.</em></p>
          </div>
        </section>

        <section>
          <h2>3. Connection to SER421 Concepts</h2>
          <div className="note">
            <strong>SER421 Note:</strong> In class, we learned that HTTP headers are stateless. WebSockets rely on a "Protocol Upgrade" mechanism that uses specific headers to break this rule.
          </div>
          
          <p>A WebSocket connection begins its life as a standard HTTP 1.1 GET request. The client sends specific headers to request a protocol switch:</p>

          <pre>
{`GET /chat HTTP/1.1
Host: server.example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13`}
          </pre>

          <p>The <code>Sec-WebSocket-Key</code> is a critical security feature. The server takes this key, appends a specific "Magic String" (defined in the standard), hashes it with SHA-1, and sends it back in the response. This proves to the client that the server understands the WebSocket protocol and isn't just a confused HTTP server.</p>

          <p>If successful, the server returns:</p>
          <pre>
{`HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=`}
          </pre>
        </section>

        {}
        <section>
          <h2>4. References & Standards</h2>
          <p>For a deeper dive into the technical specifications discussed in this module, refer to the following official standards:</p>
          <ul>
            <li>
              <strong>RFC 6455 (The WebSocket Protocol):</strong> The official IETF definition of the wire protocol. <br/>
              <a href="https://datatracker.ietf.org/doc/html/rfc6455" target="_blank" rel="noreferrer">https://datatracker.ietf.org/doc/html/rfc6455</a>
            </li>
            <li>
              <strong>The WebSocket API (W3C):</strong> The official definition of the JavaScript API used in browsers. <br/>
              <a href="https://html.spec.whatwg.org/multipage/web-sockets.html" target="_blank" rel="noreferrer">https://html.spec.whatwg.org/multipage/web-sockets.html</a>
            </li>
            <li>
              <strong>High Performance Browser Networking (O'Reilly):</strong> An excellent deep dive by Ilya Grigorik (Google). <br/>
              <a href="https://hpbn.co/websocket/" target="_blank" rel="noreferrer">https://hpbn.co/websocket/</a>
            </li>
          </ul>
        </section>

        {}
        <Quiz 
          title="Module 1 Knowledge Check" 
          questions={module1Questions} 
        />

        <div className="nav-buttons">
          <Link to="/" className="nav-btn">← Back to Home</Link>
          <Link to="/module2" className="nav-btn next">Next: Analytical Component →</Link>
        </div>
      </main>
    </div>
  );
}

export default Module1;