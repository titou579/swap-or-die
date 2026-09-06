const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const rooms = {};
const guestIps = {};

io.on('connection', (socket) => {
    const clientIp = socket.handshake.headers['x-forwarded-for'] || socket.conn.remoteAddress;

    if (!guestIps[clientIp]) {
        guestIps[clientIp] = {
            createdAt: Date.now(),
            expiresAt: Date.now() + (72 * 60 * 60 * 1000)
        };
    }
    socket.emit('checkGuestStatus', { expiresAt: guestIps[clientIp].expiresAt });

    socket.on('joinRoom', ({ roomCode, username, isPrivate }) => {
        if (!rooms[roomCode]) {
            rooms[roomCode] = {
                players: {},
                chests: [
                    { id: 1, x: 25, z: 25, type: 'totem' },
                    { id: 2, x: -30, z: 40, type: 'weapon' },
                    { id: 3, x: 0, z: -50, type: 'health' },
                    { id: 4, x: 45, z: -20, type: 'trap' }
                ],
                timerSeconds: 90,
                firstSwapDone: false
            };
            startRoomLoop(roomCode);
        }

        const room = rooms[roomCode];
        if (Object.keys(room.players).length >= 15) {
            socket.emit('errorMsg', "Salon complet !");
            return;
        }

        room.players[socket.id] = {
            id: socket.id,
            username: username || "Explorateur_" + Math.floor(Math.random()*1000),
            x: (Math.random() - 0.5) * 60,
            y: 2,
            z: (Math.random() - 0.5) * 60,
            hp: 100,
            maxHp: 100,
            totems: 1,
            weapon: 'Poings',
            hasAgro: false,
            pingQuality: Math.random()
        };

        socket.join(roomCode);
        io.to(roomCode).emit('updateGameState', room);
    });

    socket.on('playerMove', (pos) => {
        for (let code in rooms) {
            if (rooms[code].players[socket.id]) {
                rooms[code].players[socket.id].x = pos.x;
                rooms[code].players[socket.id].y = pos.y;
                rooms[code].players[socket.id].z = pos.z;
                socket.to(code).emit('playerMoved', { id: socket.id, ...pos });
            }
        }
    });

    socket.on('openChest', ({ roomCode, chestId }) => {
        const room = rooms[roomCode];
        if (!room) return;
        const chestIndex = room.chests.findIndex(c => c.id === chestId);
        if (chestIndex !== -1) {
            const chest = room.chests[chestIndex];
            room.chests.splice(chestIndex, 1); // Disparition du coffre ouvert
            
            const player = room.players[socket.id];
            let rewardMsg = "";
            if (chest.type === 'totem') {
                player.totems++;
                rewardMsg = "🎁 Tu as trouvé un Totem d'inversion rare !";
            } else if (chest.type === 'weapon') {
                player.weapon = 'Épée Cubique';
                rewardMsg = "⚔️ Tu as trouvé une Épée (+ de dégâts) !";
            } else if (chest.type === 'health') {
                player.hp = Math.min(player.maxHp, player.hp + 50);
                rewardMsg = "❤️ Bonus de soin récupéré (+50 PV) !";
            } else {
                rewardMsg = "📦 Un kit de pièges tactiques récupéré !";
            }
            socket.emit('chestOpened', { rewardMsg });
            io.to(roomCode).emit('updateGameState', room);
        }
    });

    socket.on('disconnect', () => {
        for (let code in rooms) {
            if (rooms[code].players[socket.id]) {
                delete rooms[code].players[socket.id];
                io.to(code).emit('updateGameState', rooms[code]);
            }
        }
    });
});

function startRoomLoop(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;

    setInterval(() => {
        if (!rooms[roomCode]) return;
        room.timerSeconds--;

        if (room.timerSeconds <= 0) {
            room.firstSwapDone = true;
            triggerGlobalSwap(roomCode);
            room.timerSeconds = Math.floor(Math.random() * 60) + 60;
        }

        io.to(roomCode).emit('tickTimer', { timer: room.timerSeconds });
    }, 1000);
}

function triggerGlobalSwap(roomCode) {
    const room = rooms[roomCode];
    const pIds = Object.keys(room.players);
    if (pIds.length < 2) return;

    // Permutation des identités et positions simulées
    io.to(roomCode).emit('globalSwapExecuted', { message: "⚡ SWAP GLOBAL ! Vos positions, skins et caméras viennent de s'inverser !" });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Swap or Die Server v3.0 actif sur le port ${PORT}`);
});
