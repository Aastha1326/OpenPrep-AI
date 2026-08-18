const roomManager = require('../../utils/roomManager')

const {
  rooms,
  DISCONNECT_GRACE_MS,
  normalizeRoomCode,
  createRoom,
  getRoom,
  removeRoom,
  addPlayer,
  removePlayer,
  setPlayerReady,
  checkAllReady,
  getRoomScores,
} = roomManager

/** Number of pending timers held by the process — the leak signal. */
const activeTimers = () =>
  process.getActiveResourcesInfo().filter((resource) => resource === 'Timeout').length

describe('roomManager', () => {
  beforeEach(() => {
    for (const key of Object.keys(rooms)) {
      removeRoom(key)
      delete rooms[key]
    }
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  describe('normalizeRoomCode', () => {
    it('upper-cases and trims', () => {
      expect(normalizeRoomCode('  abc123 ')).toBe('ABC123')
      expect(normalizeRoomCode('AbC123')).toBe('ABC123')
    })

    it('returns null for unusable input', () => {
      expect(normalizeRoomCode('')).toBeNull()
      expect(normalizeRoomCode('   ')).toBeNull()
      expect(normalizeRoomCode(null)).toBeNull()
      expect(normalizeRoomCode(undefined)).toBeNull()
      expect(normalizeRoomCode(42)).toBeNull()
    })
  })

  describe('room code casing', () => {
    // The original bug: createRoom stored rooms[roomCode] verbatim while
    // getRoom/removeRoom read rooms[roomCode.toUpperCase()], so a room created
    // with a lowercase code was unreachable and could never be deleted.
    it('stores a lowercase code under its canonical key', () => {
      createRoom('abc123', 'host-user')
      expect(Object.keys(rooms)).toEqual(['ABC123'])
    })

    it('finds a room created with a lowercase code', () => {
      createRoom('abc123', 'host-user')
      expect(getRoom('abc123')).toBeTruthy()
      expect(getRoom('ABC123')).toBeTruthy()
      expect(getRoom(' AbC123 ')).toBeTruthy()
    })

    it('returns the same room object regardless of the casing used', () => {
      const created = createRoom('abc123', 'host-user')
      expect(getRoom('ABC123')).toBe(created)
      expect(getRoom('abc123')).toBe(created)
    })

    it('removes a room created with a lowercase code', () => {
      createRoom('abc123', 'host-user')
      removeRoom('abc123')
      expect(Object.keys(rooms)).toEqual([])
      expect(getRoom('abc123')).toBeUndefined()
    })

    it('reports the canonical code on the room itself', () => {
      const room = createRoom('abc123', 'host-user')
      expect(room.roomCode).toBe('ABC123')
    })

    it('lets players join a room created with a lowercase code', () => {
      createRoom('abc123', 'host-user')
      const player = addPlayer('ABC123', 'socket-1', 'host-user', 'Host')
      expect(player).toBeTruthy()
      expect(player.username).toBe('Host')
    })
  })

  describe('invalid room codes', () => {
    it('does not create a room for an unusable code', () => {
      expect(createRoom('', 'host-user')).toBeNull()
      expect(createRoom('   ', 'host-user')).toBeNull()
      expect(createRoom(null, 'host-user')).toBeNull()
      expect(Object.keys(rooms)).toEqual([])
    })

    it('returns null rather than throwing on lookup', () => {
      expect(getRoom(null)).toBeNull()
      expect(getRoom(undefined)).toBeNull()
      expect(getRoom('')).toBeNull()
    })

    it('is a no-op when removing an unusable or unknown code', () => {
      expect(() => removeRoom(null)).not.toThrow()
      expect(() => removeRoom('NOPE')).not.toThrow()
    })
  })

  describe('createRoom defaults', () => {
    it('applies defaults when no options are given', () => {
      const room = createRoom('ROOM1', 'host-user')
      expect(room).toMatchObject({
        roomName: 'Battle Room',
        password: '',
        questionCount: 5,
        timePerQuestion: 15,
        status: 'waiting',
        currentQuestionIndex: 0,
        questionActive: false,
        answersReceived: 0,
        quiz: null,
      })
      expect(room.players).toEqual({})
    })

    it('honours supplied options', () => {
      const quiz = { id: 'quiz-1' }
      const room = createRoom('ROOM1', 'host-user', {
        roomName: 'Physics Sprint',
        password: 'secret',
        questionCount: 10,
        timePerQuestion: 30,
        quiz,
      })
      expect(room.roomName).toBe('Physics Sprint')
      expect(room.password).toBe('secret')
      expect(room.questionCount).toBe(10)
      expect(room.timeRemaining).toBe(30)
      expect(room.quiz).toBe(quiz)
    })
  })

  describe('addPlayer', () => {
    it('returns null for an unknown room', () => {
      expect(addPlayer('NOPE', 'socket-1', 'user-1', 'Player')).toBeNull()
    })

    it('marks the creator as host when they join', () => {
      const room = createRoom('ROOM1', 'host-user')
      addPlayer('ROOM1', 'socket-1', 'host-user', 'Host')
      expect(room.hostSocketId).toBe('socket-1')
    })

    it('defaults a missing username to Anonymous', () => {
      createRoom('ROOM1', 'host-user')
      expect(addPlayer('ROOM1', 'socket-1', 'user-2', undefined).username).toBe('Anonymous')
    })

    it('moves an existing player to the new socket id on reconnect', () => {
      const room = createRoom('ROOM1', 'host-user')
      addPlayer('ROOM1', 'socket-1', 'user-2', 'Player')
      room.players['socket-1'].score = 40

      addPlayer('ROOM1', 'socket-2', 'user-2', 'Player')

      expect(room.players['socket-1']).toBeUndefined()
      expect(room.players['socket-2'].score) .toBe(40)
      expect(room.players['socket-2'].online).toBe(true)
    })

    it('cancels a pending disconnect timer when the player reconnects', () => {
      const room = createRoom('ROOM1', 'host-user')
      addPlayer('ROOM1', 'socket-1', 'user-2', 'Player')
      removePlayer('ROOM1', 'socket-1')

      addPlayer('ROOM1', 'socket-2', 'user-2', 'Player')
      expect(room.players['socket-2'].disconnectTimer).toBeNull()

      // The grace period elapsing must not drop the reconnected player.
      vi.advanceTimersByTime(DISCONNECT_GRACE_MS * 2)
      expect(room.players['socket-2']).toBeTruthy()
    })

    it('follows the host to a new socket id', () => {
      const room = createRoom('ROOM1', 'host-user')
      addPlayer('ROOM1', 'socket-1', 'host-user', 'Host')
      addPlayer('ROOM1', 'socket-9', 'host-user', 'Host')
      expect(room.hostSocketId).toBe('socket-9')
    })
  })

  describe('removePlayer', () => {
    it('returns null for an unknown room or socket', () => {
      createRoom('ROOM1', 'host-user')
      expect(removePlayer('NOPE', 'socket-1')).toBeNull()
      expect(removePlayer('ROOM1', 'missing-socket')).toBeNull()
    })

    it('marks the player offline immediately but keeps them for the grace period', () => {
      const room = createRoom('ROOM1', 'host-user')
      addPlayer('ROOM1', 'socket-1', 'user-2', 'Player')

      removePlayer('ROOM1', 'socket-1')
      expect(room.players['socket-1'].online).toBe(false)

      vi.advanceTimersByTime(DISCONNECT_GRACE_MS - 1)
      expect(room.players['socket-1']).toBeTruthy()
    })

    it('drops the player once the grace period elapses', () => {
      const room = createRoom('ROOM1', 'host-user')
      addPlayer('ROOM1', 'socket-1', 'host-user', 'Host')
      addPlayer('ROOM1', 'socket-2', 'user-2', 'Player')

      removePlayer('ROOM1', 'socket-2')
      vi.advanceTimersByTime(DISCONNECT_GRACE_MS)

      expect(room.players['socket-2']).toBeUndefined()
    })

    it('hands the host role to a remaining active player', () => {
      const room = createRoom('ROOM1', 'host-user')
      addPlayer('ROOM1', 'socket-1', 'host-user', 'Host')
      addPlayer('ROOM1', 'socket-2', 'user-2', 'Player')

      const onHandoff = vi.fn()
      removePlayer('ROOM1', 'socket-1', onHandoff)
      vi.advanceTimersByTime(DISCONNECT_GRACE_MS)

      expect(onHandoff).toHaveBeenCalledWith('socket-2', 'Player')
      expect(room.hostSocketId).toBe('socket-2')
      expect(room.hostUserId).toBe('user-2')
    })

    it('destroys the room once the last player is dropped', () => {
      createRoom('ROOM1', 'host-user')
      addPlayer('ROOM1', 'socket-1', 'host-user', 'Host')

      const onDestroy = vi.fn()
      removePlayer('ROOM1', 'socket-1', undefined, onDestroy)
      vi.advanceTimersByTime(DISCONNECT_GRACE_MS)

      expect(onDestroy).toHaveBeenCalled()
      expect(getRoom('ROOM1')).toBeUndefined()
    })

    it('does not stack timers when a flapping socket disconnects repeatedly', () => {
      createRoom('ROOM1', 'host-user')
      addPlayer('ROOM1', 'socket-1', 'host-user', 'Host')

      const before = vi.getTimerCount()
      for (let i = 0; i < 5; i += 1) removePlayer('ROOM1', 'socket-1')

      expect(vi.getTimerCount()).toBe(before + 1)
    })

    it('does not touch an orphaned room when the timer fires after removal', () => {
      createRoom('ROOM1', 'host-user')
      addPlayer('ROOM1', 'socket-1', 'host-user', 'Host')

      const onDestroy = vi.fn()
      removePlayer('ROOM1', 'socket-1', undefined, onDestroy)
      removeRoom('ROOM1')

      expect(() => vi.advanceTimersByTime(DISCONNECT_GRACE_MS * 2)).not.toThrow()
      expect(onDestroy).not.toHaveBeenCalled()
    })
  })

  describe('removeRoom timer cleanup', () => {
    it('clears the question interval', () => {
      const room = createRoom('ROOM1', 'host-user')
      room.timerInterval = setInterval(() => {}, 1000)

      removeRoom('ROOM1')
      expect(vi.getTimerCount()).toBe(0)
    })

    it('clears every pending player disconnect timer', () => {
      createRoom('ROOM1', 'host-user')
      addPlayer('ROOM1', 'socket-1', 'host-user', 'Host')
      addPlayer('ROOM1', 'socket-2', 'user-2', 'Player')
      addPlayer('ROOM1', 'socket-3', 'user-3', 'Third')

      removePlayer('ROOM1', 'socket-1')
      removePlayer('ROOM1', 'socket-2')
      removePlayer('ROOM1', 'socket-3')
      expect(vi.getTimerCount()).toBe(3)

      removeRoom('ROOM1')
      expect(vi.getTimerCount()).toBe(0)
    })

    it('leaves no room entry behind', () => {
      createRoom('room1', 'host-user')
      addPlayer('ROOM1', 'socket-1', 'host-user', 'Host')
      removePlayer('ROOM1', 'socket-1')
      removeRoom('room1')

      expect(Object.keys(rooms)).toEqual([])
    })
  })

  describe('readiness', () => {
    it('returns false for an unknown or empty room', () => {
      expect(checkAllReady('NOPE')).toBe(false)
      createRoom('ROOM1', 'host-user')
      expect(checkAllReady('ROOM1')).toBe(false)
    })

    it('is true only once every player is ready', () => {
      createRoom('ROOM1', 'host-user')
      addPlayer('ROOM1', 'socket-1', 'host-user', 'Host')
      addPlayer('ROOM1', 'socket-2', 'user-2', 'Player')

      setPlayerReady('ROOM1', 'socket-1', true)
      expect(checkAllReady('ROOM1')).toBe(false)

      setPlayerReady('ROOM1', 'socket-2', true)
      expect(checkAllReady('ROOM1')).toBe(true)
    })

    it('coerces the ready flag to a boolean', () => {
      createRoom('ROOM1', 'host-user')
      addPlayer('ROOM1', 'socket-1', 'host-user', 'Host')
      expect(setPlayerReady('ROOM1', 'socket-1', 'yes').isReady).toBe(true)
      expect(setPlayerReady('ROOM1', 'socket-1', 0).isReady).toBe(false)
    })

    it('returns null for an unknown room or socket', () => {
      expect(setPlayerReady('NOPE', 'socket-1', true)).toBeNull()
      createRoom('ROOM1', 'host-user')
      expect(setPlayerReady('ROOM1', 'missing', true)).toBeNull()
    })
  })

  describe('getRoomScores', () => {
    it('returns an empty object for an unknown room', () => {
      expect(getRoomScores('NOPE')).toEqual({})
    })

    it('keys scores by user id and reports online state', () => {
      const room = createRoom('ROOM1', 'host-user')
      addPlayer('ROOM1', 'socket-1', 'host-user', 'Host')
      addPlayer('ROOM1', 'socket-2', 'user-2', 'Player')
      room.players['socket-1'].score = 30
      room.players['socket-1'].correctCount = 3
      room.players['socket-2'].online = false

      expect(getRoomScores('room1')).toEqual({
        'host-user': { username: 'Host', score: 30, correctCount: 3, online: true },
        'user-2': { username: 'Player', score: 0, correctCount: 0, online: false },
      })
    })
  })
})

describe('roomManager timer leaks (real timers)', () => {
  beforeEach(() => {
    for (const key of Object.keys(rooms)) {
      removeRoom(key)
      delete rooms[key]
    }
  })

  it('holds no pending timers once a room with disconnected players is removed', () => {
    const before = activeTimers()

    createRoom('LEAK01', 'host-user')
    addPlayer('LEAK01', 'socket-1', 'host-user', 'Host')
    addPlayer('LEAK01', 'socket-2', 'user-2', 'Player')
    removePlayer('LEAK01', 'socket-1')
    removePlayer('LEAK01', 'socket-2')

    expect(activeTimers()).toBe(before + 2)

    removeRoom('LEAK01')
    expect(activeTimers()).toBe(before)
  })
})
