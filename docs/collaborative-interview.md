# Live Collaborative Coding Interview Room

The **Live Collaborative Coding Interview Room** provides a real-time pair-programming workspace designed for technical coding interviews between candidates and interviewers.

## Features

- **Shared Monaco Code Editor**: Real-time collaborative code editor with syntax highlighting, line numbers, automatic layout, and multi-language support (JavaScript, TypeScript, Python, C++, Java, Go).
- **Multi-Cursor Presence**: Displays live positions, selections, and remote cursors for candidates and interviewers with role-based badges and colors.
- **Instant Code Runner Sandbox**: Executes code safely in isolated backend environments with live console output capturing (`stdout`, `stderr`, execution time, pass/fail status).
- **Redux & Socket.io Architecture**: Synchronizes editor state, room join/leave lifecycle, language updates, and execution status using a dedicated `/interview` Socket.io namespace.
- **State Persistence**: Room state (code, language, active participants, chat history, output) is stored temporarily in Redis (with TTL) and backed up in memory.
- **Side Panel**: Tabbed sidebar featuring:
  - **Peers List**: Real-time view of active participants, roles (Interviewer vs. Candidate), and cursor colors.
  - **Text Chat**: Real-time text messaging between interviewer and candidate with timestamps.
  - **WebRTC Video Chat**: Video stream placeholders and peer-to-peer WebRTC signaling overlay.

---

## How to Start a Collaborative Interview

1. **Launch the Application**:
   ```bash
   npm run dev
   ```

2. **Access the Interview Room**:
   - Navigate to `/interview` in your web browser.
   - Enter your name and pick your role (**Candidate** or **Interviewer**).
   - Enter an existing **Interview Room Code** or click **Generate New Code**.
   - Click **Enter Collaborative Room**.

3. **Pair-Programming Session**:
   - Share the room URL (`/interview/<room-code>`) or room code with the candidate/interviewer.
   - Edit code together in real time and select your target programming language.
   - Click **Run Code** to execute solutions and view instant console output.
   - Chat via the **Chat** tab or view video feeds via the **Video** tab.
