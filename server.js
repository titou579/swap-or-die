const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// Route pour le fichier rickroll à la racine
app.get('/rickroll', (req, res) => {
    res.sendFile(path.join(__dirname, 'rickroll.html'));
});

const rooms = {};
const guestIps = {};

io.on('connection', (socket) => {
    const clientIp = socket.handshake.headers['x-forwarded-for'] || socket.conn.remoteAddress;

    if (!guestIps[clientIp]) {
        guestIps[clientIp] = { expiresAt: Date.now() + (72 * 60 * 60 * 1000) };
    }
    socket.emit('checkGuestStatus', { expiresAt: guestIps[clientIp].expiresAt });

    socket.on('joinRoom', ({ roomCode, username }) => {
        if (!rooms[roomCode]) {
            rooms[roomCode] = {
                players: {},
                chests: [
                    { id: 1, x: 20, z: 20, opened: false },
                    { id: 2, x: -25, z: 30, opened: false },
                    { id: 3, x: 10, z: -35, opened: false },
                    { id: 4, x: -30, z: -20, opened: false }
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
            username: username || "Joueur",
            x: 0, y: 1.2, z: 0,
            hp: 100, maxHp: 100,
            totems: 0,
            weapon: 'Poings',
            hasAgro: false
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

    socket.on('takeDamage', ({ roomCode, damage }) => {
        const room = rooms[roomCode];
        if (!room || !room.players[socket.id]) return;
        const player = room.players[socket.id];
        
        player.hp -= damage;
        if (player.hp <= 0) {
            if (player.totems > 0) {
                player.totems--;
                player.hp = 50;
                socket.emit('notification', "✨ Ton totem t'a sauvé la vie d'justesse !");
            } else {
                const diedAlone = !room.firstSwapDone && !player.hasAgro;
                socket.emit('playerDied', { diedAlone });
                player.hp = 100;
                player.x = 0; player.z = 0;
            }
        }
        io.to(roomCode).emit('updateGameState', room);
    });

    socket.on('tryOpenChest', ({ roomCode, chestId }) => {
        const room = rooms[roomCode];
        if (!room) return;
        const chest = room.chests.find(c => c.id === chestId && !c.opened);
        if (chest) {
            chest.opened = true;
            const player = room.players[socket.id];
            
            const rand = Math.random();
            if (rand < 0.20) {
                player.totems++;
                socket.emit('notification', "🎉 Incroyable ! Tu as trouvé un Totem rare dans le coffre !");
            } else if (rand < 0.60) {
                player.weapon = 'Épée Légère';
                socket.emit('notification', "⚔️ Tu as trouvé une arme de mêlée !");
            } else {
                player.hp = Math.min(player.maxHp, player.hp + 40);
                socket.emit('notification', "❤️ Tu as trouvé une potion de soin (+40 PV) !");
            }
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
            io.to(roomCode).emit('globalSwapExecuted', { message: "⚡ SWAP GLOBAL ! Inversion des positions et des rôles !" });
            room.timerSeconds = 90;
        }
        io.to(roomCode).emit('tickTimer', { timer: room.timerSeconds });
    }, 1000);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Serveur actif sur le port ${PORT}`));
