import { Server } from 'socket.io';

let io = null;

export function initSocket(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: (origin, callback) => callback(null, true),
            credentials: true,
        },
    });

    io.on('connection', (socket) => {
        console.log(`🔌 Client connected: ${socket.id}`);
        socket.on('disconnect', () => {
            console.log(`🔌 Client disconnected: ${socket.id}`);
        });
    });

    return io;
}

export function getIO() {
    if (!io) throw new Error('Socket.IO not initialised — call initSocket first');
    return io;
}
