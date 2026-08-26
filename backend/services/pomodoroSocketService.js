/**
 * @fileoverview Server-authoritative timer clock broadcasting sync ticks and state transitions.
 * Prevents client clock drift for study squads.
 */
const activeTimers = new Map();

/**
 * Initializes Pomodoro socket event listeners.
 * @param {Object} io - Socket.IO server instance
 */
const initializePomodoroSockets = (io) => {
    io.on('connection', (socket) => {
        console.log(`[Pomodoro] User connected: ${socket.id}`);

        socket.on('pomodoro:join', ({ squadId, userId, username }) => {
            socket.join(`squad_${squadId}`);
            socket.data = { squadId, userId, username };

            // If timer doesn't exist, initialize it
            if (!activeTimers.has(squadId)) {
                activeTimers.set(squadId, {
                    mode: 'focus', // 'focus', 'shortBreak', 'longBreak'
                    timeLeft: 25 * 60,
                    isRunning: false,
                    startedAt: null,
                });
            }

            // Send current state to joining user
            socket.emit('pomodoro:sync', activeTimers.get(squadId));
        });

        socket.on('pomodoro:start', () => {
            const { squadId } = socket.data;
            const timer = activeTimers.get(squadId);
            if (timer && !timer.isRunning) {
                timer.isRunning = true;
                timer.startedAt = Date.now();
                io.to(`squad_${squadId}`).emit('pomodoro:state-changed', timer);
            }
        });

        socket.on('pomodoro:pause', () => {
            const { squadId } = socket.data;
            const timer = activeTimers.get(squadId);
            if (timer && timer.isRunning) {
                timer.isRunning = false;
                // Calculate exact time left to prevent drift
                const elapsed = Math.floor((Date.now() - timer.startedAt) / 1000);
                timer.timeLeft = Math.max(0, timer.timeLeft - elapsed);
                io.to(`squad_${squadId}`).emit('pomodoro:state-changed', timer);
            }
        });

        socket.on('pomodoro:reset', () => {
            const { squadId } = socket.data;
            const timer = activeTimers.get(squadId);
            if (timer) {
                timer.isRunning = false;
                timer.timeLeft = timer.mode === 'focus' ? 25 * 60 : timer.mode === 'shortBreak' ? 5 * 60 : 15 * 60;
                io.to(`squad_${squadId}`).emit('pomodoro:state-changed', timer);
            }
        });

        socket.on('disconnect', () => {
            console.log(`[Pomodoro] User disconnected: ${socket.id}`);
        });
    });

    // Global tick interval for drift correction
    setInterval(() => {
        activeTimers.forEach((timer, squadId) => {
            if (timer.isRunning) {
                const elapsed = Math.floor((Date.now() - timer.startedAt) / 1000);
                const currentLeft = Math.max(0, timer.timeLeft - elapsed);

                if (currentLeft === 0) {
                    // Auto-transition logic could go here
                    timer.isRunning = false;
                    io.to(`squad_${squadId}`).emit('pomodoro:session-complete');
                } else {
                    // Broadcast tick every 5 seconds to reduce traffic
                    if (currentLeft % 5 === 0) {
                        io.to(`squad_${squadId}`).emit('pomodoro:tick', { timeLeft: currentLeft });
                    }
                }
            }
        });
    }, 1000);
};

module.exports = {
    initializePomodoroSockets,
};
