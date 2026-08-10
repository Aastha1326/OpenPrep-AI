**# 📑 ADR 0003: Real-Time Multiplayer Architecture via WebSockets**



**\*\*Status:\*\* Accepted**



**\*\*Date:\*\* 2026-08-08**



**---**



**## 🎯 Context**



**OpenPrep AI includes real-time collaborative features such as multiplayer quiz battles, chat, and live notifications. These features require low-latency, bidirectional communication between clients and the server.**



**Traditional HTTP request-response communication would require frequent polling, resulting in higher latency and unnecessary network traffic.**



**---**



**## ✅ Decision**



**The application adopts a WebSocket-based communication architecture using Socket.IO for all real-time features.**



**### Socket.IO Server**



**The backend initializes a dedicated Socket.IO server alongside the Express application.**



**Dedicated socket handlers manage individual real-time modules such as:**



**- Quiz battles**

**- Real-time chat**

**- Live notifications**

**- Multiplayer events**



**### Event-Based Communication**



**Communication follows an event-driven model where clients emit events and the server broadcasts updates to connected participants.**



**Examples include:**



**- Player joins**

**- Battle starts**

**- Answer submission**

**- Score updates**

**- Chat messages**

**- Session completion**



**### Connection Management**



**The server configures heartbeat intervals and connection timeouts to improve reliability on unstable networks while reducing unnecessary disconnects.**



**### Separation of Responsibilities**



**Business logic remains within backend services and controllers, while Socket.IO is responsible only for delivering real-time events between connected clients.**



**---**



**## 📈 Consequences**



**### Benefits**



**- Low-latency communication.**

**- Reduced network overhead compared to HTTP polling.**

**- Scalable event-driven architecture.**

**- Better user experience for multiplayer interactions.**

**- Clear separation between REST APIs and real-time communication.**



**### Trade-offs**



**- Requires persistent client-server connections.**

**- Increases backend infrastructure complexity.**

**- Requires reconnection handling for unreliable network conditions.**



**---**



**## 📚 Related Documentation**



**- `docs/websocket-protocol.md`**

**- `docs/backend-architecture.md`**

**- `backend/server.js`**

**- `backend/sockets/`**

