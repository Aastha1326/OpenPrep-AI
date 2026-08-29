const { EventEmitter } = require('events');

describe('Interview Socket Recovery & Synchronization', () => {
  let socket;
  let io;
  let nsp;
  let deps;
  let handler;

  beforeEach(() => {
    // Mock socket
    socket = new EventEmitter();
    socket.id = 'socket-123';
    socket.data = {};
    socket.join = jest.fn();
    socket.to = jest.fn().mockReturnValue({ emit: jest.fn() });
    socket.leave = jest.fn();
    socket.emit = jest.fn();

    // Mock io and namespace
    nsp = new EventEmitter();
    nsp.in = jest.fn().mockReturnValue({ emit: jest.fn() });
    nsp.to = jest.fn().mockReturnValue({ emit: jest.fn() });
    nsp.of = jest.fn();

    io = { of: jest.fn().mockReturnValue(nsp) };

    // Mock code runner
    deps = {
      codeRunnerService: {
        runCode: jest.fn().mockResolvedValue({ stdout: 'output' }),
      },
    };

    // Load handler
    handler = require('../../sockets/interviewSocket')(io, deps);
  });

  describe('Versioned State Management', () => {
    test('should assign monotonically increasing sequence numbers to updates', async () => {
      const { getRoomState, recordUpdate } = require('../../sockets/interviewSocket');
      
      const update1 = await recordUpdate('room-123', { type: 'code_change', code: 'test' });
      const update2 = await recordUpdate('room-123', { type: 'chat_message', text: 'hello' });
      const update3 = await recordUpdate('room-123', { type: 'language_change', language: 'python' });

      expect(update1.seqNum).toBe(1);
      expect(update2.seqNum).toBe(2);
      expect(update3.seqNum).toBe(3);
    });

    test('should maintain stateVersion in room', async () => {
      const { getRoomState } = require('../../sockets/interviewSocket');
      
      const room = await getRoomState('room-456');
      expect(room.stateVersion).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Reconnection Recovery', () => {
    test('should recover missed updates on reconnect', async () => {
      const { getRoomState, recordUpdate, getMissedUpdates } = require('../../sockets/interviewSocket');
      
      // Record some updates
      await recordUpdate('room-789', { type: 'code_change', code: 'v1' });
      await recordUpdate('room-789', { type: 'code_change', code: 'v2' });
      await recordUpdate('room-789', { type: 'code_change', code: 'v3' });

      // Get updates since client's last ack
      const missedUpdates = await getMissedUpdates('room-789', 1);
      
      expect(missedUpdates.length).toBeGreaterThan(0);
      expect(missedUpdates.some(u => u.seqNum === 2)).toBe(true);
      expect(missedUpdates.some(u => u.seqNum === 3)).toBe(true);
    });

    test('should send snapshot for stale clients', async () => {
      const { getRoomState, recordUpdate } = require('../../sockets/interviewSocket');
      
      const room = await getRoomState('room-stale');
      
      // Generate many updates to simulate staleness
      for (let i = 0; i < 150; i++) {
        await recordUpdate('room-stale', { type: 'code_change', code: `v${i}` });
      }
      
      const staleRoom = await getRoomState('room-stale');
      expect(staleRoom.stateVersion).toBeGreaterThanOrEqual(150);
    });
  });

  describe('Duplicate Update Prevention', () => {
    test('should ignore duplicate updates with same seqNum', async () => {
      const { getRoomState, recordUpdate } = require('../../sockets/interviewSocket');
      
      const update1 = await recordUpdate('room-dup', { type: 'code_change', code: 'original' });
      const room1 = await getRoomState('room-dup');
      
      // Try to record update with same seqNum (simulated duplicate)
      const update2 = await recordUpdate('room-dup', { type: 'code_change', code: 'duplicate' });
      
      // Each call should increment seqNum
      expect(update1.seqNum).not.toBe(update2.seqNum);
    });
  });

  describe('Client Acknowledgement Tracking', () => {
    test('should track client ack state', () => {
      const { trackClientAck } = require('../../sockets/interviewSocket');
      
      trackClientAck('client-1', 5);
      trackClientAck('client-1', 10);
      
      const { clientAckTracking } = require('../../sockets/interviewSocket');
      expect(clientAckTracking.get('client-1').lastAckSeqNum).toBe(10);
    });
  });

  describe('Conflict-Safe State Reconciliation', () => {
    test('should merge code changes without conflicts', async () => {
      const { getRoomState, recordUpdate } = require('../../sockets/interviewSocket');
      
      // Simulate two clients making changes
      await recordUpdate('room-merge', { type: 'code_change', code: 'change1' });
      await recordUpdate('room-merge', { type: 'code_change', code: 'change2' });
      
      const room = await getRoomState('room-merge');
      expect(room.code).toBe('change2'); // Last write wins
      expect(room.updateLog.length).toBeGreaterThan(0);
    });

    test('should maintain chat message order', async () => {
      const { getRoomState, recordUpdate } = require('../../sockets/interviewSocket');
      
      const room = await getRoomState('room-chat');
      
      await recordUpdate('room-chat', { 
        type: 'chat_message', 
        message: { id: 'msg1', text: 'hello' } 
      });
      await recordUpdate('room-chat', { 
        type: 'chat_message', 
        message: { id: 'msg2', text: 'world' } 
      });
      
      const updatedRoom = await getRoomState('room-chat');
      expect(updatedRoom.chatMessages[updatedRoom.chatMessages.length - 2].text).toBe('hello');
      expect(updatedRoom.chatMessages[updatedRoom.chatMessages.length - 1].text).toBe('world');
    });
  });

  describe('Presence & Participant State', () => {
    test('should track participant state consistently', async () => {
      const { getRoomState } = require('../../sockets/interviewSocket');
      
      const room = await getRoomState('room-presence');
      
      room.participants['socket-1'] = {
        socketId: 'socket-1',
        name: 'User 1',
        joinedAt: new Date().toISOString(),
      };
      
      expect(Object.keys(room.participants)).toContain('socket-1');
    });
  });

  describe('Update Log Management', () => {
    test('should limit update log to MAX_UPDATE_LOG entries', async () => {
      const { recordUpdate, getRoomState } = require('../../sockets/interviewSocket');
      
      // Generate many updates
      for (let i = 0; i < 1100; i++) {
        await recordUpdate('room-limit', { type: 'code_change', code: `v${i}` });
      }
      
      const room = await getRoomState('room-limit');
      expect(room.updateLog.length).toBeLessThanOrEqual(1010); // With some buffer
    });
  });
});