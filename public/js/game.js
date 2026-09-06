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

// --- ARÈNE & DÉCORS ---
const groundGeo = new THREE.BoxGeometry(160, 4, 160);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x1c3b1e });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.position.y = -2;
scene.add(ground);

const lavaGeo = new THREE.BoxGeometry(40, 4.2, 40);
const lavaMat = new THREE.MeshStandardMaterial({ color: 0xff4500, emissive: 0xff2200 });
const lavaLake = new THREE.Mesh(lavaGeo, lavaMat);
lavaLake.position.set(40, -1.9, 40);
scene.add(lavaLake);

const wallMat = new THREE.MeshStandardMaterial({ color: 0x3d3d3d });
for (let i = 0; i < 10; i++) {
    const w = 12, h = 12, d = 12;
    const block = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
    block.position.set((Math.random() - 0.5) * 100, h / 2 - 2, (Math.random() - 0.5) * 100);
    scene.add(block);
}

// --- COFFRES 3D GLOBAUX ---
window.chestMeshes = [];
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
    chest.userData = { id: data.id, opened: false };
    scene.add(chest);
    window.chestMeshes.push(chest);
});

// --- SKIN DU JOUEUR ---
window.playerGroup = new THREE.Group();

const bodyMat = new THREE.MeshStandardMaterial({ color: 0xe50914 });
const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdbac });
const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1111ff });

const torso = new THREE.Mesh(new THREE.BoxGeometry(1, 1.2, 0.6), bodyMat);
torso.position.y = 1.2;
window.playerGroup.add(torso);

const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), skinMat);
head.position.y = 2.0;
window.playerGroup.add(head);

const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1, 0.4), pantsMat);
leftLeg.position.set(-0.3, 0.5, 0);
window.playerGroup.add(leftLeg);

const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1, 0.4), pantsMat);
rightLeg.position.set(0.3, 0.5, 0);
window.playerGroup.add(rightLeg);

window.playerGroup.position.set(0, 0, 0);
scene.add(window.playerGroup);

// --- CAMÉRA & CONTRÔLES ---
let cameraAngleX = 0, cameraAngleY = 0;
window.isGameStarted = false;

window.addEventListener('mousemove', (e) => {
    if (window.isGameStarted && document.pointerLockElement === document.body) {
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
    if (!window.isGameStarted) return;

    // Vecteurs de mouvement parfaitement alignés sur la caméra
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraAngleX);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraAngleX);

    const moveDir = new THREE.Vector3(0, 0, 0);
    if (keys.z) moveDir.add(forward);
    if (keys.s) moveDir.sub(forward);
    if (keys.q) moveDir.sub(right);
    if (keys.d) moveDir.add(right);
    moveDir.normalize();

    let speed = 0.15;
    let nextX = window.playerGroup.position.x + moveDir.x * speed;
    let nextZ = window.playerGroup.position.z + moveDir.z * speed;

    nextX = Math.max(-75, Math.min(75, nextX));
    nextZ = Math.max(-75, Math.min(75, nextZ));

    window.playerGroup.position.x = nextX;
    window.playerGroup.position.z = nextZ;

    if (moveDir.lengthSq() > 0) {
        window.playerGroup.rotation.y = Math.atan2(moveDir.x, moveDir.z);
    }

    velocityY -= gravity;
    window.playerGroup.position.y += velocityY;
    if (window.playerGroup.position.y < 0) {
        window.playerGroup.position.y = 0;
        velocityY = 0;
        if (keys.space) velocityY = 0.35;
    }

    if (window.playerGroup.position.x > 20 && window.playerGroup.position.x < 60 && window.playerGroup.position.z > 20 && window.playerGroup.position.z < 60) {
        if (window.sendDamage) window.sendDamage(2);
    }

    const dist = 7;
    camera.position.x = window.playerGroup.position.x + dist * Math.sin(cameraAngleX) * Math.cos(cameraAngleY);
    camera.position.y = window.playerGroup.position.y + 2 + dist * Math.sin(cameraAngleY);
    camera.position.z = window.playerGroup.position.z + dist * Math.cos(cameraAngleX) * Math.cos(cameraAngleY);
    camera.lookAt(window.playerGroup.position.x, window.playerGroup.position.y + 1.2, window.playerGroup.position.z);

    renderer.render(scene, camera);
}
animateGame();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
