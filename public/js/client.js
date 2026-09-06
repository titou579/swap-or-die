const socket = io();
let currentRoom = '';

socket.on('checkGuestStatus', (data) => {
    const timeLeftHours = Math.ceil((data.expiresAt - Date.now()) / (1000 * 60 * 60));
    if (timeLeftHours > 0) {
        const warn = document.getElementById('guest-warning');
        warn.style.display = 'block';
        warn.innerText = `⚠️ Compte invité : Suppression dans ${timeLeftHours}h sans inscription !`;
    }
});

function enterGame() {
    const username = document.getElementById('username-input').value.trim();
    const roomCode = document.getElementById('room-input').value.trim() || 'salon_1';
    if (!username) {
        alert("Entre un pseudo !");
        return;
    }

    currentRoom = roomCode;
    document.getElementById('menu-overlay').style.display = 'none';
    document.getElementById('game-hud').style.display = 'block';
    window.isGameStarted = true;
    document.body.requestPointerLock();

    socket.emit('joinRoom', { roomCode, username });
}

function openSettings() {
    alert("Paramètres graphiques, Niveaux et Cosmétiques disponibles prochainement !");
}

window.sendDamage = function(dmg) {
    socket.emit('takeDamage', { roomCode: currentRoom, damage: dmg });
};

// Ouverture des coffres avec la touche [E]
window.addEventListener('keydown', (e) => {
    if (e.key === 'e' || e.key === 'E') {
        if (typeof window.playerGroup !== 'undefined' && typeof window.chestMeshes !== 'undefined') {
            window.chestMeshes.forEach(chest => {
                const dist = window.playerGroup.position.distanceTo(chest.position);
                if (dist < 4 && !chest.userData.opened) {
                    socket.emit('tryOpenChest', { roomCode: currentRoom, chestId: chest.userData.id });
                    chest.material.color.setHex(0x333333);
                    chest.userData.opened = true;
                }
            });
        }
    }
});

socket.on('tickTimer', (data) => {
    document.getElementById('hud-timer').innerText = `Swap dans : ${data.timer}s`;
});

socket.on('updateGameState', (roomData) => {
    if (roomData.players[socket.id]) {
        const p = roomData.players[socket.id];
        document.getElementById('hud-hp').innerText = `PV : ${p.hp} / ${p.maxHp}`;
        document.getElementById('hud-totem').innerText = `Totems : ${p.totems}`;
        document.getElementById('hud-weapon').innerText = `Arme : ${p.weapon}`;
    }
});

socket.on('notification', (msg) => {
    alert(msg);
});

socket.on('playerDied', (data) => {
    if (data.diedAlone) {
        triggerEasterEgg("Mort Solitaire !", "Tu es mort tout seul avant le premier swap... Apprécie le spectacle !", true);
    } else {
        alert("Tu as été éliminé ! Réapparition...");
    }
});

socket.on('globalSwapExecuted', (data) => {
    triggerEasterEgg("⚡ SWAP GLOBAL", data.message);
});

function triggerEasterEgg(title, text, showRickroll = false) {
    document.getElementById('ee-title').innerText = title;
    document.getElementById('ee-text').innerText = text;
    document.getElementById('rickroll-container').style.display = showRickroll ? 'block' : 'none';
    document.getElementById('easter-egg-modal').style.display = 'flex';
}

function closeEasterEgg() {
    document.getElementById('easter-egg-modal').style.display = 'none';
}
