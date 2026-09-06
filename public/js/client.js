const socket = io();
let currentRoom = '';

socket.on('checkGuestStatus', (data) => {
    const timeLeftHours = Math.ceil((data.expiresAt - Date.now()) / (1000 * 60 * 60));
    if (timeLeftHours > 0) {
        const warningEl = document.getElementById('guest-warning');
        warningEl.style.display = 'block';
        warningEl.innerText = `⚠️ Compte invité : Vos données seront supprimées dans ${timeLeftHours}h sans inscription !`;
    }
});

function joinGame() {
    const username = document.getElementById('username-input').value.trim();
    const roomCode = document.getElementById('room-input').value.trim() || 'salon_1';
    if (!username) {
        alert("Entre ton pseudo avant de lancer !");
        return;
    }

    currentRoom = roomCode;
    document.getElementById('auth-box').style.display = 'none';
    document.getElementById('game-hud').style.display = 'block';

    socket.emit('joinRoom', { roomCode, username, isPrivate: false });
}

function openAccountModal() {
    triggerEasterEgg(
        "Connexion Sécurisée", 
        "L'authentification Google et Mail est prête pour lier ton compte 24h/24 et conserver tes cosmétiques !"
    );
}

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

socket.on('chestOpened', (data) => {
    alert(data.rewardMsg);
});

socket.on('globalSwapExecuted', (data) => {
    triggerEasterEgg("⚡ ALerte SWAP GLOBAL", data.message);
});

// --- LISTE DES 10 EASTER EGGS ORIGINAUX INTEGRABLES DANS LE GAMEPLAY ---
const easterEggsDescriptions = [
    "1. 🎭 La Solitude Suprême : Mourir seul avant le premier swap déclenche un Rickroll instantané.",
    "2. ⚡ Le Konami Code : Taper la séquence secrète double ta vitesse de déplacement.",
    "3. 🧱 Le Bug de la Matrice : Découvrir le pixel invisible au bout de la grande map cubique.",
    "4. 🏆 La Malédiction du 42 : Cumuler 42 éliminations ratées sans une seule victoire.",
    "5. 🎮 Le Clic Frénétique : Cliquer 10 fois sur le logo du menu principal réveille un son 8-bit.",
    "6. 🌀 Le Piège de Schrödinger : S'auto-piéger lors d'une inversion de position chaotique.",
    "7. 🚫 L'Erreur 404 : Essayer de traverser les limites physiques du relief souterrain.",
    "8. 🌙 Le Fantôme de Minuit : Rejoindre une partie secrète exactement à 03h00 du matin.",
    "9. ✨ Le Totem Doré : Survivre à un coup fatal avec exactement 1 point de vie restant.",
    "10. 🚀 La Déconnexion Divine : Quitter le jeu au millième de seconde précis du swap global."
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
