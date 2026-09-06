const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0f);
scene.fog = new THREE.FogExp2(0x0a0a0f, 0.015);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Éclairage dynamique
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
dirLight.position.set(40, 80, 40);
scene.add(dirLight);

// --- CREATION DE LA GRANDE ARENE AVEC PROFONDEUR (Grottes, Eau, Lave) ---
const groundGeo = new THREE.BoxGeometry(160, 4, 160);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x1c3b1e, roughness: 0.8 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.position.y = -2;
scene.add(ground);

// Rivières d'eau (MLG / amortissement)
const waterGeo = new THREE.BoxGeometry(40, 4.2, 160);
const waterMat = new THREE.MeshStandardMaterial({ color: 0x1e90ff, transparent: true, opacity: 0.7 });
const waterRiver = new THREE.Mesh(waterGeo, waterMat);
waterRiver.position.set(-30, -1.9, 0);
scene.add(waterRiver);

// Lac de Lave mortelle
const lavaGeo = new THREE.BoxGeometry(40, 4.2, 40);
const lavaMat = new THREE.MeshStandardMaterial({ color: 0xff4500, emissive: 0xff2200 });
const lavaLake = new THREE.Mesh(lavaGeo, lavaMat);
lavaLake.position.set(40, -1.9, 40);
scene.add(lavaLake);

// Grottes et décors cubiques en relief
const wallMat = new THREE.MeshStandardMaterial({ color: 0x3d3d3d });
for (let i = 0; i < 12; i++) {
    const height = Math.random() * 10 + 5;
    const blockGeo = new THREE.BoxGeometry(12, height, 12);
    const blockMesh = new THREE.Mesh(blockGeo, wallMat);
    blockMesh.position.set((Math.random() - 0.5) * 120, height / 2 - 2, (Math.random() - 0.5) * 120);
    scene.add(blockMesh);
}

// Joueur local 3D
const playerGeo = new THREE.BoxGeometry(1.2, 2.4, 1.2);
const playerMat = new THREE.MeshStandardMaterial({ color: 0xe50914 });
const localPlayerMesh = new THREE.Mesh(playerGeo, playerMat);
localPlayerMesh.position.set(0, 1.2, 0);
scene.add(localPlayerMesh);

// Gestion de la caméra subjective / TPS avec la souris
let mouseX = 0, mouseY = 0;
let cameraAngleX = 0, cameraAngleY = 0;

window.addEventListener('click', () => {
    document.body.requestPointerLock();
});

window.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === document.body) {
        cameraAngleX -= e.movementX * 0.003;
        cameraAngleY -= e.movementY * 0.003;
        cameraAngleY = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, cameraAngleY));
    }
});

// Contrôles Clavier
const keys = { z: false, s: false, q: false, d: false, space: false };
window.addEventListener('keydown', (e) => {
    if (e.key === 'z' || e.key === 'Z' || e.key === 'ArrowUp') keys.z = true;
    if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') keys.s = true;
    if (e.key === 'q' || e.key === 'Q' || e.key === 'ArrowLeft') keys.q = true;
    if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') keys.d = true;
    if (e.key === ' ') keys.space = true;
});
window.addEventListener('keyup', (e) => {
    if (e.key === 'z' || e.key === 'Z' || e.key === 'ArrowUp') keys.z = false;
    if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') keys.s = false;
    if (e.key === 'q' || e.key === 'Q' || e.key === 'ArrowLeft') keys.q = false;
    if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') keys.d = false;
    if (e.key === ' ') keys.space = false;
});

let velocityY = 0;
const gravity = 0.015;

function animateGame() {
    requestAnimationFrame(animateGame);

    let speed = 0.18;
    let moveX = 0, moveZ = 0;

    if (keys.z) { moveZ -= speed; }
    if (keys.s) { moveZ += speed; }
    if (keys.q) { moveX -= speed; }
    if (keys.d) { moveX += speed; }

    // Rotation selon l'angle de la caméra
    localPlayerMesh.position.x += moveX * Math.cos(cameraAngleX) - moveZ * Math.sin(cameraAngleX);
    localPlayerMesh.position.z += moveX * Math.sin(cameraAngleX) + moveZ * Math.cos(cameraAngleX);

    // Gravité et saut
    if (keys.space && localPlayerMesh.position.y <= 1.2) {
        velocityY = 0.3;
    }
    velocityY -= gravity;
    localPlayerMesh.position.y += velocityY;
    if (localPlayerMesh.position.y < 1.2) {
        localPlayerMesh.position.y = 1.2;
        velocityY = 0;
    }

    // Positionnement de la caméra derrière le joueur
    const dist = 8;
    camera.position.x = localPlayerMesh.position.x + dist * Math.sin(cameraAngleX) * Math.cos(cameraAngleY);
    camera.position.y = localPlayerMesh.position.y + 3 + dist * Math.sin(cameraAngleY);
    camera.position.z = localPlayerMesh.position.z + dist * Math.cos(cameraAngleX) * Math.cos(cameraAngleY);
    camera.lookAt(localPlayerMesh.position.x, localPlayerMesh.position.y + 1, localPlayerMesh.position.z);

    renderer.render(scene, camera);
}
animateGame();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
