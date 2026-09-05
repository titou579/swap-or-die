const socket = io();
let currentRoom = '';

socket.on('checkGuestStatus', (data) => {
    const timeLeftHours = Math.ceil((data.expiresAt - Date.now()) / (1000 * 60 * 60));
    if (timeLeftHours > 0) {
        document.getElementById('guest-warning').style.display = 'block';
        document.getElementById('guest-warning').innerText = `Attention : Compte invité. Suppression de vos données dans ${timeLeftHours}h sans inscription !`;
    }
});

function joinGame(isPrivate) {
    const username = document.getElementById('username-input').value.trim();
    const roomCode = document.getElementById('room-input').value.trim() || 'salon_1';
    if (!username) {
        alert("Entre un pseudo valide !");
        return;
    }

    currentRoom = roomCode;
    document.getElementById('auth-box').style.display = 'none';
    document.getElementById('game-hud').style.display = 'flex';

    socket.emit('joinRoom', { roomCode, username, isPrivate });
}

function openAccountModal() {
    alert("Redirection sécurisée vers la création de compte (Google / Mail)...");
}

socket.on('tickTimer', (data) => {
    document.getElementById('hud-timer').innerText = `Swap dans : ${data.timer}s`;
});

socket.on('updateGame', (roomData) => {
    // Mise à jour de l'interface et des stats du joueur
    if (roomData.players[socket.id]) {
        const p = roomData.players[socket.id];
        document.getElementById('hud-hp').innerText = `PV : ${p.hp} / ${p.maxHp}`;
        document.getElementById('hud-totem').innerText = `Totems : ${p.totems}`;
    }
});

socket.on('playerDied', (data) => {
    if (data.diedAlone) {
        // Easter Egg ultime : Rickroll en cas de mort solitaire avant le 1er swap
        triggerEasterEgg(
            "Explosion Solitaire !", 
            "Perdre tout seul avant même le premier échange de position... C'est une œuvre d'art. Apprécie la danse !", 
            true
        );
    } else {
        alert("Tu as été éliminé par un adversaire !");
        location.reload();
    }
});

socket.on('globalSwapExecuted', (players) => {
    console.log("Swap global effectué !", players);
});

// 10 Easter Eggs Originaux intégrés dynamiquement
const easterEggsList = [
    "1. La solitude suprême (Rickroll sur mort en solo)",
    "2. Le Konami Code secret (Vitesse x2)",
    "3. Le pixel invisible du bord de map",
    "4. La malédiction des 42 défaites d'affilée",
    "5. Le clic frénétique du logo rétro",
    "6. Le piège de Schrödinger (S'auto-piéger)",
    "7. L'erreur 404 de franchissement de texture",
    "8. Le fantôme de minuit (Connexion à 03h00)",
    "9. Le Totem Doré de survie à 1 PV",
    "10. La déconnexion au millième de seconde"
];

function triggerEasterEgg(title, text, showRickroll = false) {
    document.getElementById('ee-title').innerText = title;
    document.getElementById('ee-text').innerText = text;
    document.getElementById('rickroll-container').style.display = showRickroll ? 'block' : 'none';
    document.getElementById('easter-egg-modal').style.display = 'flex';
}

function closeEasterEgg() {
    document.getElementById('easter-egg-modal').style.display = 'none';
}
