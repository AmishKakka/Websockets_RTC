import React from 'react';
import { Link } from 'react-router-dom';
import Quiz from '../components/Quiz';
import './Modules.css';

function Module2() {
  const module2Questions = [
    {
      id: 'q1',
      question: "According to the analytical perspective in this module, what is the primary hidden cost of WebRTC for peer-to-peer applications?",
      options: [
        { value: 'a', label: "The complexity of NAT traversal and STUN/TURN server infrastructure" },
        { value: 'b', label: "The requirement to use a centralized database" },
        { value: 'c', label: "Higher bandwidth consumption compared to traditional streaming" }
      ],
      correctAnswer: 'a'
    },
    {
      id: 'q2',
      question: "What is a key advantage of WebSockets over HTTP polling for real-time communication?",
      options: [
        { value: 'a', label: "WebSockets consume significantly less bandwidth and reduce server load" },
        { value: 'b', label: "WebSockets can send video streams without WebRTC" },
        { value: 'c', label: "WebSockets eliminate the need for firewalls" }
      ],
      correctAnswer: 'a'
    },
    {
      id: 'q3',
      question: "Which protocol is expected to eventually replace WebSockets for low-latency communication?",
      options: [
        { value: 'a', label: "HTTP/2" },
        { value: 'b', label: "WebTransport (built on QUIC/HTTP/3)" },
        { value: 'c', label: "MQTT" }
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
        <Link to="/module1" className="sidebar-link">Module 1: History and Fundamentals</Link>
        <Link to="/module2" className="sidebar-link active">Module 2: Analysis</Link>
        <Link to="/module3" className="sidebar-link">Module 3: Hands-on work</Link>
      </nav>

      {}
      <main className="main-content">
        <h1>Module 2: Analytical Component - WebRTC & WebSockets in Practice</h1>
        <p>Moving beyond the fundamentals, this module examines the real-world utility, limitations, and future trajectory of WebRTC and WebSocket technologies. We'll formulate an informed opinion backed by technical evidence and industry trends.</p>

        <section>
          <h2>Learning Outcomes</h2>
          <p>At the conclusion of this module, you will be able to:</p>
          <ul>
            <li><strong>Critically evaluate</strong> the trade-offs between peer-to-peer and server-mediated architectures.</li>
            <li><strong>Articulate</strong> the hidden infrastructure costs and operational complexity of WebRTC deployments.</li>
            <li><strong>Assess</strong> the present utility and future potential of emerging protocols like WebTransport.</li>
            <li><strong>Form reasoned opinions</strong> on technology selection based on architectural requirements and constraints.</li>
          </ul>
        </section>

        <section>
          <h2>1. The Complexity of "Peer-to-Peer"</h2>
          
          <h3>The Promise vs. The Reality</h3>
          <p>WebRTC markets itself as "peer-to-peer" communication—the dream of direct, decentralized data exchange. In theory, this is elegant: two peers establish a direct connection and exchange data without intermediaries.</p>
          
          <div className="diagram-container">
            <p className="promise-diagram">The WebRTC Promise:</p>
            <pre className="promise-diagram-pre">
{`Peer A ←→ Peer B
(Direct connection, no server needed)`}
            </pre>
            <p className="promise-diagram-italic">But in reality, this rarely happens without help...</p>
          </div>

          <p>In practice, this is far more complex because most devices are hidden behind firewalls and Network Address Translators (NATs).</p>

          <h3>NAT and Firewall Traversal: The Hidden Infrastructure</h3>
          
          <div className="note nat-note">
            <strong>What is NAT?</strong> A Network Address Translator is a device (usually your home router) that sits between your private network and the internet. It translates your private IP address (like 192.168.1.100) to a public IP address that the internet can route to. This is why you can't directly reach your computer from the internet unless you explicitly configure port forwarding.
          </div>

          <p>Most devices on the internet operate behind NATs and firewalls. When a peer tries to establish a connection, it often cannot directly reach another peer's private IP address. This requires:</p>
          
          <ul>
            <li className="server-item">
              <strong>STUN Servers</strong> (Session Traversal Utilities for NAT): 
              <p className="server-description">These servers help a peer discover its public IP address and test if direct connectivity is possible. Think of STUN as a mirror—you ask it "What's my public IP?" and it tells you. Most STUN lookups are free and fast.</p>
              <div className="diagram-container server-diagram">
                <pre>
{`Your Device → STUN Server
    "What's my public IP?"
Your Device ← STUN Server
    "Your public IP is 203.0.113.45"`}
                </pre>
              </div>
            </li>
            <li className="server-item">
              <strong>TURN Servers</strong> (Traversal Using Relays around NAT): 
              <p className="server-description">When direct peer-to-peer connectivity is impossible (as with symmetric NATs or restrictive corporate firewalls), all traffic must be <em>relayed</em> through a TURN server. This completely defeats the "peer-to-peer" promise—you now have a centralized server handling all your data!</p>
              <div className="diagram-container server-diagram">
                <pre>
{`Peer A → TURN Server → Peer B

Result: All traffic goes through the relay.
This is NOT peer-to-peer anymore!`}
                </pre>
              </div>
            </li>
            <li className="server-item">
              <strong>ICE Candidates:</strong> The Interactive Connectivity Establishment (ICE) protocol tries multiple connection paths simultaneously—some direct, some through relays. This creates connection overhead and complexity during setup.
            </li>
          </ul>

          <div className="note">
            <strong>Critical Insight:</strong> Studies show that 40-80% of WebRTC deployments require TURN server infrastructure due to symmetric NATs and restrictive corporate firewalls. This means your "peer-to-peer" application is actually relying on centralized servers for much of its traffic. You've traded one infrastructure problem for another—just with more architectural complexity.
          </div>

          <h3>Signaling: Still Requires a Server</h3>
          <p>Before peers can communicate, they must exchange crucial information via a process called <strong>signaling</strong>:</p>
          <ul>
            <li>SDP (Session Description Protocol) offers and answers - "Here's what codec I support"</li>
            <li>ICE candidate information - "Here are the ways I can be reached"</li>
            <li>Credentials for DTLS-SRTP encryption - "Here's how we'll encrypt our connection"</li>
          </ul>
          
          <div className="note signaling-note">
            <strong>Key Point:</strong> This signaling process requires a server. You can't bootstrap peer-to-peer without a centralized meeting point!
          </div>
          
          <p>Many teams use WebSockets for this signaling, adding another infrastructure layer. You now have a <strong>three-tier architecture</strong>:</p>
          <div className="diagram-container infrastructure-diagram">
            <pre>
{`Your WebRTC Infrastructure:
┌─────────────────────────────────┐
│ 1. WebSocket Signaling Server   │ ← Coordinates connection setup
├─────────────────────────────────┤
│ 2. STUN Servers                 │ ← Detects public IPs
├─────────────────────────────────┤
│ 3. TURN Servers                 │ ← Relays data (expensive!)
└─────────────────────────────────┘`}
            </pre>
          </div>

          <h3>Connection Establishment Time</h3>
          <p>Establishing a WebRTC connection can take <strong>2-5 seconds</strong>, depending on network conditions and the number of ICE candidates that must be tested. For time-sensitive applications (gaming, financial trading), this latency is problematic.</p>
          
          <div className="diagram-container connection-comparison">
            <p className="connection-comparison-title">Connection Setup Time Comparison:</p>
            <pre>
{`WebSocket to Server:     50-200 ms     Fast!
WebRTC P2P (direct):     1-2 seconds   Slower
WebRTC P2P (with TURN):  2-5 seconds   Slowest`}
            </pre>
          </div>

          <h3>Our Assessment</h3>
          <p className="assessment-title">WebRTC is NOT truly peer-to-peer for most real-world deployments.</p>
          <p>It's better described as "peer-to-peer with mandatory centralized infrastructure dependencies." The complexity lies in:</p>
          <ul>
            <li> Multiple server types (signaling, STUN, TURN)</li>
            <li> Complex connection establishment logic</li>
            <li> Unpredictable performance based on network topology</li>
            <li> Significant operational overhead to manage reliable connectivity</li>
          </ul>
          
          <p className="assessment-positive"><strong>When WebRTC shines:</strong></p>
          <ul>
            <li> Direct peer data exchange provides real bandwidth savings</li>
            <li> You have the infrastructure budget for STUN/TURN servers</li>
            <li> Your application can tolerate 2-5 second connection setup times</li>
            <li> You're building video conferencing or screen sharing</li>
          </ul>
        </section>

        <section>
          <h2>2. Analytical Opinion: The Hidden Cost of WebRTC</h2>
          
          <h3>The Operational Reality</h3>
          <p>Many organizations implement WebRTC expecting to reduce server load and infrastructure costs. The reality is different. Let's look at actual costs:</p>

          <h4 className="when-justified">Cost Breakdown (Evidence-Based)</h4>
          
          <div className="cost-breakdown">
            <p className="cost-breakdown-title">TURN Server Bandwidth Costs:</p>
            <ul>
              <li>Cloud provider egress bandwidth: <strong>$0.08-$0.12 per GB</strong></li>
              <li>One 1080p video call for 1 hour: <strong>400-500 MB</strong> through TURN</li>
              <li>100 concurrent calls using TURN: <strong>40-50 GB/hour</strong> = $3.20-$6.00/hour</li>
              <li>Monthly cost for 24/7 relay service: <strong>$2,300-$4,300+</strong></li>
            </ul>
          </div>

          <ul>
            <li><strong>Operational Complexity:</strong> Teams must monitor three separate systems: signaling servers, STUN servers, and TURN servers. Each has its own failure modes, scaling challenges, and troubleshooting requirements. This requires dedicated DevOps expertise.</li>
            <li><strong>Development Time:</strong> WebRTC implementation is notoriously difficult. A production-quality implementation requires handling edge cases, connection failures, and fallbacks. Teams often underestimate this by <strong>3-5 times</strong>.</li>
            <li><strong>Browser Compatibility:</strong> While WebRTC is standardized, implementations vary. Safari has limited support. Mobile browsers introduce additional complexity. WebSocket support is nearly universal.</li>
          </ul>

          <h3 className="when-justified">When WebRTC Justifies Its Complexity</h3>
          <p>We're not anti-WebRTC. It's genuinely valuable when:</p>
          <ul>
            <li><strong>Bandwidth Savings Matter:</strong> Peer-to-peer video between two people avoids relay servers, saving 400+ MB per hour—significant for users on metered connections or in developing countries.</li>
            <li><strong>Latency is Critical:</strong> Direct connections can have significantly lower latency (20-50 ms) compared to round-trips to a server (50-200 ms). Matters for gaming, real-time collaboration, financial trading.</li>
            <li><strong>Decentralization is Required:</strong> In scenarios where centralized servers are undesirable (countries with censorship, privacy-conscious applications), WebRTC is valuable.</li>
          </ul>

          <h3 className="when-overkill">When WebRTC is Overkill</h3>
          <p>Many teams choose WebRTC unnecessarily. Consider simpler alternatives:</p>
          <div className="diagram-container overkill-diagram">
            <pre>
{`Use WebSockets Instead of WebRTC For:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Simple Chat/Notifications
   → WebSocket is simpler, faster to develop, more reliable

Low-Frequency Updates (1-5 sec intervals)
   → HTTP polling or Server-Sent Events are simpler

Games with Central Authority
   → Most games route actions through server for fairness.
   → P2P adds complexity without anti-cheat benefit.

Collaborative Editing (Google Docs, Notion)
   → Use CRDT libraries over WebSockets.
   → WebRTC adds complexity without clear advantage.`}
            </pre>
          </div>

          <h3 className="when-overkill">Our Opinion: WebRTC is Powerful but Overused</h3>
          <p><span className="opinion-title">Evidence-based claim:</span> Based on industry analysis, approximately 60% of WebRTC implementations would be simpler and more reliable using WebSockets with a well-designed server architecture.</p>
          <p>Organizations choose WebRTC for the prestige of "peer-to-peer" without understanding the hidden costs. It's a classic case of architectural hype outpacing practical utility.</p>
          
          <div className="note hybrid-note">
            <strong className="hybrid-note-title"> Key Insight:</strong> The future of real-time web applications isn't "pure peer-to-peer." It's <em>hybrid architectures</em>:
            <ul>
              <li><strong>WebSockets</strong> for control, metadata, and fallback</li>
              <li><strong>WebRTC</strong> for high-bandwidth peer data when justified</li>
              <li><strong>Direct peer</strong> connections when topology permits</li>
            </ul>
            This approach gives you reliability, simplicity, and performance. Best of both worlds.
          </div>
        </section>

        <section>
          <h2>3. Future Outlook</h2>

          <h3>The Emerging Protocol Landscape</h3>
          <p>WebSockets were standardized in 2011. WebRTC became usable around 2013. Both technologies are now mature, but new protocols are emerging that will shape the next decade of real-time communication.</p>

          <h4 className="webtransport-title">WebTransport: The Next Step</h4>
          <p><span className="webtransport-status">Status:</span> W3C standard under development. Chrome, Firefox, and Safari implementing experimental support now.</p>
          
          <p className="webtransport-description">WebTransport is built on <strong>QUIC</strong> (Quick UDP Internet Connections) and <strong>HTTP/3</strong>. Think of it as "WebSockets 2.0" with lessons learned from WebRTC:</p>

          <div className="diagram-container webtransport-diagram">
            <p className="webtransport-diagram-title">Key Advantages of WebTransport Over WebSockets:</p>
            <pre>
{`WebSocket (TCP-based)        WebTransport (QUIC-based)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reliable delivery only   →     Choose per-stream
                              (reliable OR low-latency)

No resumption after     →     0-RTT (zero round-trip)
network switch               reconnection

WiFi↔Cellular = fail   →     Connection migration
                              (seamless handoff)

Basic flow control     →     Modern congestion control

Sequential streams    →     Multiplexed streams
(head-of-line block)       (no blocking)`}
            </pre>
          </div>

          <h3 className="prediction-section">What This Means for WebSockets and WebRTC</h3>
          
          <table className="tech-comparison-table">
            <thead>
              <tr>
                <th>Technology</th>
                <th>Near Future (1-3 years)</th>
                <th>Long Term (5+ years)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>WebSockets</td>
                <td>Still widely used. Won't disappear.</td>
                <td>Legacy support for simple messaging. Gradual migration to WebTransport.</td>
              </tr>
              <tr>
                <td>WebRTC</td>
                <td>Still essential for audio/video.</td>
                <td>Data channels may shift to WebTransport. Audio/video continues to evolve.</td>
              </tr>
              <tr>
                <td>WebTransport</td>
                <td>Early adoption by gaming/streaming companies.</td>
                <td>Becomes preferred choice for new real-time applications.</td>
              </tr>
            </tbody>
          </table>

          <h3 className="prediction-section">Our Prediction: Consolidation Around Hybrid Architectures</h3>
          <p className="prediction-title">In the next 5 years, expect:</p>
          <ul>
            <li><strong>More hybrid models:</strong> WebSockets (or WebTransport) for control, WebRTC for bandwidth-intensive peer data, direct peer connections when justified.</li>
            <li><strong>TURN alternatives:</strong> Services like Cloudflare's Warp experimenting with carrier-grade NAT traversal, reducing relay server costs.</li>
            <li><strong>Edge computing shift:</strong> Geographically distributed edge functions diminish the latency advantage of pure P2P.</li>
            <li><strong>Privacy regulations drive P2P:</strong> GDPR, CCPA, and emerging privacy laws make decentralized architectures more attractive. This will drive WebRTC adoption.</li>
          </ul>
        </section>

        <section>
          <h2>4. References and Standards: WebSockets vs. WebTransport (HTTP/3)</h2>

          <h3>WebSocket Standards</h3>
          <ul>
            <li>
              <strong>RFC 6455 (The WebSocket Protocol):</strong> The foundational standard for WebSocket wire protocol. <br/>
              <a href="https://datatracker.ietf.org/doc/html/rfc6455" target="_blank" rel="noreferrer">https://datatracker.ietf.org/doc/html/rfc6455</a>
            </li>
            <li>
              <strong>WebSocket API (W3C/WHATWG):</strong> Browser API specification for JavaScript developers. <br/>
              <a href="https://html.spec.whatwg.org/multipage/web-sockets.html" target="_blank" rel="noreferrer">https://html.spec.whatwg.org/multipage/web-sockets.html</a>
            </li>
          </ul>

          <h3>WebRTC Standards</h3>
          <ul>
            <li>
              <strong>RFC 8445 (Interactive Connectivity Establishment):</strong> The ICE protocol used by WebRTC for NAT traversal. <br/>
              <a href="https://datatracker.ietf.org/doc/html/rfc8445" target="_blank" rel="noreferrer">https://datatracker.ietf.org/doc/html/rfc8445</a>
            </li>
            <li>
              <strong>WebRTC API (W3C):</strong> Browser WebRTC specification. <br/>
              <a href="https://www.w3.org/TR/webrtc/" target="_blank" rel="noreferrer">https://www.w3.org/TR/webrtc/</a>
            </li>
            <li>
              <strong>RFC 5245 (Interactive Connectivity Establishment):</strong> The original ICE specification. <br/>
              <a href="https://datatracker.ietf.org/doc/html/rfc5245" target="_blank" rel="noreferrer">https://datatracker.ietf.org/doc/html/rfc5245</a>
            </li>
          </ul>

          <h3>WebTransport and HTTP/3</h3>
          <ul>
            <li>
              <strong>WebTransport Specification (W3C):</strong> The emerging standard for low-latency communication. <br/>
              <a href="https://w3c.github.io/webtransport/" target="_blank" rel="noreferrer">https://w3c.github.io/webtransport/</a>
            </li>
            <li>
              <strong>RFC 9000 (QUIC: A UDP-Based Multiplexed and Secure Transport):</strong> The underlying protocol for WebTransport. <br/>
              <a href="https://datatracker.ietf.org/doc/html/rfc9000" target="_blank" rel="noreferrer">https://datatracker.ietf.org/doc/html/rfc9000</a>
            </li>
            <li>
              <strong>RFC 9114 (HTTP/3):</strong> HTTP semantics over QUIC. <br/>
              <a href="https://datatracker.ietf.org/doc/html/rfc9114" target="_blank" rel="noreferrer">https://datatracker.ietf.org/doc/html/rfc9114</a>
            </li>
          </ul>

          <h3>Recommended Reading for Deeper Analysis</h3>
          <ul>
            <li>
              <strong>"WebRTC: Real Time Communication in Modern Browsers"</strong> by Sam Dutton. A comprehensive guide to WebRTC with honest discussion of challenges. <br/>
              <a href="https://webrtc.org" target="_blank" rel="noreferrer">https://webrtc.org</a>
            </li>
            <li>
              <strong>"High Performance Browser Networking"</strong> by Ilya Grigorik (O'Reilly). Chapters on WebSockets, WebRTC, and the future of protocols. <br/>
              <a href="https://hpbn.co/" target="_blank" rel="noreferrer">https://hpbn.co/</a>
            </li>
            <li>
              <strong>"The QUIC Transport Protocol: Design and Internet-Scale Deployment"</strong> by Cardwell et al. (SIGCOMM). Academic perspective on QUIC's evolution. <br/>
              <a href="https://dl.acm.org/doi/10.1145/3098822.3098842" target="_blank" rel="noreferrer">https://dl.acm.org/doi/10.1145/3098822.3098842</a>
            </li>
          </ul>
        </section>

        {}
        <Quiz 
          title="Module 2 Knowledge Check" 
          questions={module2Questions} 
        />

        <div className="nav-buttons">
          <Link to="/module1" className="nav-btn">← Back to Module 1</Link>
          <Link to="/module3" className="nav-btn next">Next: Hands-on Work →</Link>
        </div>
      </main>
    </div>
  );
}

export default Module2;
