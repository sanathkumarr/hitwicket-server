const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
const server = http.createServer(app);
const io = socketIo(server, {
    transports: ['websocket'],
    upgrade: false,
});
let gameState = {
    board: [
        ['A-P1', 'A-H1', 'A-H2', 'A-H1', 'A-P1'],
        ['', '', '', '', ''],
        ['', '', '', '', ''],
        ['', '', '', '', ''],
        ['B-P1', 'B-H1', 'B-H2', 'B-H1', 'B-P1'],
    ],
    currentPlayer: 'A',
    winner: null,
    history: [],
    chat: [],
    players: {}, 
};
const addPlayer = (socket) => {
    const playerId = socket.id;
    const username = `Player${Object.keys(gameState.players).length + 1}`;
    gameState.players[playerId] = { id: playerId, username };
    return username;
};
io.on('connection', (socket) => {
    socket.on('join-game', () => {
        const username = addPlayer(socket);
        socket.emit('update-game', gameState);
        socket.emit('player-joined', username);
        socket.broadcast.emit('player-joined', username); // Notify others
    });

    socket.on('join-spectator', () => {
        socket.join('spectator-room');
        socket.emit('update-game', gameState);
    });

    socket.on('move', (newGameState) => {
        gameState = newGameState;
        io.emit('update-game', gameState);
    });

    socket.on('restart-game', () => {
        gameState = {
            board: [
                ['A-P1', 'A-H1', 'A-H2', 'A-H1', 'A-P1'],
                ['', '', '', '', ''],
                ['', '', '', '', ''],
                ['', '', '', '', ''],
                ['B-P1', 'B-H1', 'B-H2', 'B-H1', 'B-P1'],
            ],
            currentPlayer: 'A',
            winner: null,
            history: [],
            chat: [],
            players: {},
        };
        io.emit('update-game', gameState);
    });

    socket.on('chat-message', (message) => {
        const timestamp = new Date().toLocaleTimeString();
        gameState.chat.push({ player: gameState.players[socket.id]?.username || 'Spectator', text: message, timestamp });
        io.emit('chat-update', gameState.chat);
    });

    socket.on('disconnect', () => {
        delete gameState.players[socket.id]; 
        io.emit('player-left', socket.id); 
        console.log('A user disconnected');
    });
});
server.listen(5000, () => {
    console.log('Server is running on port 5000');
});
