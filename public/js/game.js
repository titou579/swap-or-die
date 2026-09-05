const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0e0e0e);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Éclairage de l'arène
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(25, 50, 25);
scene.add(dirLight);

// Sol cubique de l'arène
const floorGeo = new THREE.BoxGeometry(50, 2, 50);
const floorMat = new THREE.MeshStandardMaterial({ color: 0x1e3f20 });
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.position.y = -1;
scene.add(floor);

// Joueur local 3D cubique
const playerGeo = new THREE.BoxGeometry(1, 2, 1);
const playerMat = new THREE.MeshStandardMaterial({ color: 0xe50914 });
const localPlayerMesh = new THREE.Mesh(playerGeo, playerMat);
localPlayerMesh.position.set(0, 1, 0);
scene.add(localPlayerMesh);

camera.position.set(0, 6, 12);
camera.lookAt(localPlayerMesh.position);

// Commandes de mouvement basiques
const keys = { z: false, s: false, q: false, d: false };
window.addEventListener('keydown', (e) => {
    if (e.key === 'z' || e.key === 'Z') keys.z = true;
    if (e.key === 's' || e.key === 'S') keys.s = true;
    if (e.key === 'q' || e.key === 'Q') keys.q = true;
    if (e.key === 'd' || e.key === 'D') keys.d = true;
});
window.addEventListener('keyup', (e) => {
    if (e.key === 'z' || e.key === 'Z') keys.z = false;
    if (e.key === 's' || e.key === 'S') keys.s = false;
    if (e.key === 'q' || e.key === 'Q') keys.q = false;
    if (e.key === 'd' || e.key === 'D') keys.d = false;
});

function animateGame() {
    requestAnimationFrame(animateGame);

    let speed = 0.15;
    if (keys.z) localPlayerMesh.position.z -= speed;
    if (keys.s) localPlayerMesh.position.z += speed;
    if (keys.q) localPlayerMesh.position.x -= speed;
    if (keys.d) localPlayerMesh.position.x += speed;

    camera.position.x = localPlayerMesh.position.x;
    camera.position.z = localPlayerMesh.position.z + 10;
    camera.lookAt(localPlayerMesh.position);

    renderer.render(scene, camera);
}
animateGame();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
