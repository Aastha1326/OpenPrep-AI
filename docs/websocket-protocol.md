# WebSocket Real-Time Event Protocol & Architecture Guide

This document outlines the WebSocket connection protocols, event structures, and reconnect policies used for real-time features such as live quiz battles and notifications in OpenPrep-AI.

## 1. Connection Handshake

All WebSocket connections are established over `wss://` for production and `ws://` for local development.

### Endpoint
`wss://api.openprep-ai.com/v1/ws`

### Authentication
Authentication is required during the connection handshake. The client must pass the authentication token via the `Authorization` header or query string if headers are not supported by the client environment.

```javascript
const ws = new WebSocket('wss://api.openprep-ai.com/v1/ws?token=YOUR_JWT_TOKEN');
```

## 2. Event Message Payload Structure

All messages exchanged between the client and the server must adhere to a standardized JSON schema.

### 2.1 Client to Server (Requests / Events)
Clients send events using the following structure:

```json
{
  "type": "event_type",
  "payload": {
    // Event specific data
  },
  "timestamp": "2026-08-06T12:00:00.000Z"
}
```

### 2.2 Server to Client (Responses / Broadcasts)
The server responds or broadcasts using the following structure:

```json
{
  "type": "event_type",
  "payload": {
    // Event specific data
  },
  "error": null // Will contain error details if the event failed
}
```

## 3. Real-Time Quiz Battles

Live quiz battles rely on WebSockets for real-time synchronization between participants.

### Subscribing to a Battle
To join a battle room, the client sends a `battle:join` event.

**Client Request:**
```json
{
  "type": "battle:join",
  "payload": {
    "battleId": "b-12345"
  }
}
```

**Server Acknowledgment:**
```json
{
  "type": "battle:joined",
  "payload": {
    "battleId": "b-12345",
    "participants": ["user1", "user2"],
    "status": "waiting"
  }
}
```

### Battle Events
- `battle:start` - Broadcasted when the battle begins.
- `battle:answer` - Client submits an answer.
- `battle:score_update` - Broadcasted to all participants when a user scores.
- `battle:end` - Broadcasted when the battle finishes.

## 4. Heartbeats and Keep-Alive

To prevent idle connections from dropping and to detect disconnected clients, a ping/pong heartbeat mechanism is implemented.

### Client Ping
The client should send a `ping` event every 30 seconds.
```json
{
  "type": "ping",
  "timestamp": "..."
}
```

### Server Pong
The server will respond immediately with a `pong` event.
```json
{
  "type": "pong",
  "timestamp": "..."
}
```

## 5. Reconnection Policies

Mobile devices and unstable networks frequently drop connections. Clients must implement a reconnection strategy with **Exponential Backoff**.

1. **First reconnect attempt**: After 1 second.
2. **Subsequent attempts**: Double the delay (2s, 4s, 8s, 16s).
3. **Max delay**: Cap at 30 seconds.
4. **Jitter**: Add a randomized jitter (±10%) to prevent thundering herd problems when many clients disconnect simultaneously.

## 6. Error Codes

If an operation fails or a connection drops unexpectedly, the server may send an error event before closing the socket.

| Code | Meaning | Description |
|---|---|---|
| `4000` | Unauthorized | Missing or invalid JWT token. |
| `4001` | Rate Limited | Too many messages sent in a short period. |
| `4004` | Room Not Found | The requested battle or room ID does not exist. |
| `4005` | Internal Error | Unexpected server error. |
| `4009` | Idle Timeout | Connection closed due to lack of ping heartbeats. |
