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
            expiresAt: Date.now() + (72 * 60 * 60 * 1000),
            warned: false
        };
    }

    socket.emit('checkGuestStatus', { expiresAt: guestIps[clientIp].expiresAt });

    socket.on('joinRoom', ({ roomCode, username, isPrivate }) => {
        if (!rooms[roomCode]) {
            rooms[roomCode] = {
                players: {},
                chests: [],
                gameStarted: false,
                firstSwapDone: false,
                timerSeconds: 90
            };
            startRoomLoop(roomCode);
        }

        const room = rooms[roomCode];
        const playerCount = Object.keys(room.players).length;
        const maxPlayers = 15;
        const minPlayers = isPrivate ? 3 : 5;

        if (playerCount >= maxPlayers) {
            socket.emit('errorMsg', "Salon complet !");
            return;
        }

        room.players[socket.id] = {
            id: socket.id,
            username: username || "Joueur_" + Math.floor(Math.random()*1000),
            x: (Math.random() - 0.5) * 40,
            y: 1,
            z: (Math.random() - 0.5) * 40,
            hp: 100,
            maxHp: 100,
            totems: 0,
            skin: 'cube_jungle',
            hasAgro: false,
            firstSpawnTime: Date.now(),
            pingQuality: Math.random() // Simulation de qualité de connexion
        };

        socket.join(roomCode);
        io.to(roomCode).emit('updateGame', room);
    });

    socket.on('playerMove', (data) => {
        for (let code in rooms) {
            if (rooms[code].players[socket.id]) {
                rooms[code].players[socket.id].x = data.x;
                rooms[code].players[socket.id].z = data.z;
            }
        }
    });

    socket.on('playerDamage', ({ roomCode, targetId, damage }) => {
        const room = rooms[roomCode];
        if (room && room.players[targetId]) {
            room.players[targetId].hasAgro = true;
            room.players[targetId].hp -= damage;
            if (room.players[targetId].hp <= 0) {
                if (room.players[targetId].totems > 0) {
                    room.players[targetId].totems--;
                    room.players[targetId].hp = 50; // Revive avec totem
                } else {
                    // Vérification de la mort solitaire avant premier swap pour Easter Egg Rickroll
                    const diedAlone = !room.firstSwapDone && !room.players[targetId].hasAgro;
                    io.to(targetId).emit('playerDied', { diedAlone });
                    delete room.players[targetId];
                }
            }
            io.to(roomCode).emit('updateGame', room);
        }
    });

    socket.on('disconnect', () => {
        for (let code in rooms) {
            if (rooms[code].players[socket.id]) {
                delete rooms[code].players[socket.id];
                io.to(code).emit('updateGame', rooms[code]);
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
            room.timerSeconds = Math.floor(Math.random() * 60) + 60; // 60 à 120 sec
        }

        io.to(roomCode).emit('tickTimer', { timer: room.timerSeconds });
    }, 1000);
}

function triggerGlobalSwap(roomCode) {
    const room = rooms[roomCode];
    const pIds = Object.keys(room.players);
    if (pIds.length < 2) return;

    // Logique d'immunité au swap (50-75% pour les connexions instables / basées sur le ping)
    const activePlayers = pIds.filter(id => {
        const p = room.players[id];
        const immunityChance = p.pingQuality > 0.5 ? 0.75 : 0.5;
        return Math.random() > immunityChance;
    });

    if (activePlayers.length >= 2) {
        // Permutation circulaire des identités (Skin, Caméra, Contrôles)
        const firstSkin = room.players[activePlayers[0]].skin;
        for (let i = 0; i < activePlayers.length - 1; i++) {
            room.players[activePlayers[i]].skin = room.players[activePlayers[i+1]].skin;
        }
        room.players[activePlayers[activePlayers.length - 1]].skin = firstSkin;
    }

    io.to(roomCode).emit('globalSwapExecuted', room.players);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur Swap or Die lancé sur le port ${PORT}`);
});
