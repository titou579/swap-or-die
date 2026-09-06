const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0f);
scene.fog = new THREE.FogExp2(0x0a0a0f, 0.012);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
dirLight.position.set(40, 80, 40);
scene.add(dirLight);

// --- ARÈNE & COLLISIONS ---
const solidObjects = [];

const groundGeo = new THREE.BoxGeometry(160, 4, 160);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x1c3b1e });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.position.y = -2;
scene.add(ground);
solidObjects.push(ground);

// Lac de Lave mortelle (Inflige des dégâts)
const lavaGeo = new THREE.BoxGeometry(40, 4.2, 40);
const lavaMat = new THREE.MeshStandardMaterial({ color: 0xff4500, emissive: 0xff2200 });
const lavaLake = new THREE.Mesh(lavaGeo, lavaMat);
lavaLake.position.set(40, -1.9, 40);
scene.add(lavaLake);

// Murs de grottes / obstacles solides
const wallMat = new THREE.MeshStandardMaterial({ color: 0x3d3d3d });
for (let i = 0; i < 10; i++) {
    const w = 12, h = 12, d = 12;
    const block = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
    block.position.set((Math.random() - 0.5) * 100, h / 2 - 2, (Math.random() - 0.5) * 100);
    scene.add(block);
    solidObjects.push(block);
}

// --- COFFRES 3D SUR LA MAP ---
const chestMeshes = [];
const chestGeo = new THREE.BoxGeometry(1.5, 1.2, 1.5);
const chestMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.4 });

const chestDataList = [
    { id: 1, x: 20, z: 20 },
    { id: 2, x: -25, z: 30 },
    { id: 3, x: 10, z: -35 },
    { id: 4, x: -30, z: -20 }
];

chestDataList.forEach(data => {
    const chest = new THREE.Mesh(chestGeo, chestMat);
    chest.position.set(data.x, 0.6, data.z);
    chest.userData = { id: data.id };
    scene.add(chest);
    chestMeshes.push(chest);
});

// --- SKIN DU JOUEUR (Modèle Humanoïde Cubique Stylisé) ---
const playerGroup = new THREE.Group();

const bodyMat = new THREE.MeshStandardMaterial({ color: 0xe50914 });
const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdbac });
const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1111ff });

const torso = new THREE.Mesh(new THREE.BoxGeometry(1, 1.2, 0.6), bodyMat);
torso.position.y = 1.2;
playerGroup.add(torso);

const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), skinMat);
head.position.y = 2.0;
playerGroup.add(head);

const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1, 0.4), pantsMat);
leftLeg.position.set(-0.3, 0.5, 0);
playerGroup.add(leftLeg);

const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1, 0.4), pantsMat);
rightLeg.position.set(0.3, 0.5, 0);
playerGroup.add(rightLeg);

playerGroup.position.set(0, 0, 0);
scene.add(playerGroup);

// --- CAMÉRA & CONTRÔLES SOURIS ---
let cameraAngleX = 0, cameraAngleY = 0;
let isGameStarted = false;

window.addEventListener('mousemove', (e) => {
    if (isGameStarted && document.pointerLockElement === document.body) {
        cameraAngleX -= e.movementX * 0.003;
        cameraAngleY -= e.movementY * 0.003;
        cameraAngleY = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, cameraAngleY));
    }
});

const keys = { z: false, s: false, q: false, d: false, space: false };
window.addEventListener('keydown', (e) => {
    if (e.key === 'z' || e.key === 'Z') keys.z = true;
    if (e.key === 's' || e.key === 'S') keys.s = true;
    if (e.key === 'q' || e.key === 'Q') keys.q = true;
    if (e.key === 'd' || e.key === 'D') keys.d = true;
    if (e.key === ' ') keys.space = true;
});
window.addEventListener('keyup', (e) => {
    if (e.key === 'z' || e.key === 'Z') keys.z = false;
    if (e.key === 's' || e.key === 'S') keys.s = false;
    if (e.key === 'q' || e.key === 'Q') keys.q = false;
    if (e.key === 'd' || e.key === 'D') keys.d = false;
    if (e.key === ' ') keys.space = false;
});

let velocityY = 0;
const gravity = 0.02;

function animateGame() {
    requestAnimationFrame(animateGame);
    if (!isGameStarted) return;

    let speed = 0.15;
    let moveX = 0, moveZ = 0;
    if (keys.z) moveZ -= speed;
    if (keys.s) moveZ += speed;
    if (keys.q) moveX -= speed;
    if (keys.d) moveX += speed;

    let nextX = playerGroup.position.x + (moveX * Math.cos(cameraAngleX) - moveZ * Math.sin(cameraAngleX));
    let nextZ = playerGroup.position.z + (moveX * Math.sin(cameraAngleX) + moveZ * Math.cos(cameraAngleX));

    // Limites strictes de la map (Empêche de fly ou de sortir)
    nextX = Math.max(-75, Math.min(75, nextX));
    nextZ = Math.max(-75, Math.min(75, nextZ));

    playerGroup.position.x = nextX;
    playerGroup.position.z = nextZ;

    // Gravité & Sol
    velocityY -= gravity;
    playerGroup.position.y += velocityY;
    if (playerGroup.position.y < 0) {
        playerGroup.position.y = 0;
        velocityY = 0;
        if (keys.space) velocityY = 0.35;
    }

    // Dégâts si dans la lave
    if (playerGroup.position.x > 20 && playerGroup.position.x < 60 && playerGroup.position.z > 20 && playerGroup.position.z < 60) {
        if (window.sendDamage) window.sendDamage(2); // Dégâts continus dans la lave
    }

    // Positionnement Caméra TPS
    const dist = 7;
    camera.position.x = playerGroup.position.x + dist * Math.sin(cameraAngleX) * Math.cos(cameraAngleY);
    camera.position.y = playerGroup.position.y + 2 + dist * Math.sin(cameraAngleY);
    camera.position.z = playerGroup.position.z + dist * Math.cos(cameraAngleX) * Math.cos(cameraAngleY);
    camera.lookAt(playerGroup.position.x, playerGroup.position.y + 1.2, playerGroup.position.z);

    renderer.render(scene, camera);
}
animateGame();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
