import * as THREE from 'three';

// Canvas and renderer
const canvas = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
// Ensure canvas can receive focus so keyboard events are captured reliably
canvas.tabIndex = 0;
// Focus the canvas on load and when clicked
window.addEventListener('load', () => { try { canvas.focus(); } catch (_) {} });
canvas.addEventListener('mousedown', () => { try { canvas.focus(); } catch (_) {} });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Scene and camera
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x090a0f);

const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
scene.add(camera);

// Sizing
function resizeRendererToDisplaySize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  if (canvas.width !== width || canvas.height !== height) {
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
}

// Simple hallway: a long box corridor with inner faces visible
function createHallway() {
  // Simple L-shaped hallway with shared materials
  const L1 = 120;            // Z segment length
  const L2 = 90;             // X segment length
  const corridorWidth = 6;
  const corridorHeight = 4;
  const thickness = 0.1;

  const materials = {
    wallMat: new THREE.MeshStandardMaterial({ color: 0x14151a, roughness: 0.95, metalness: 0.0 }),
    floorMat: new THREE.MeshStandardMaterial({ color: 0x0d0e12, roughness: 0.98, metalness: 0.0 }),
    ceilMat: new THREE.MeshStandardMaterial({ color: 0x16181f, roughness: 0.95, metalness: 0.0 }),
    edgeMat: new THREE.MeshStandardMaterial({ color: 'white', emissive: 'white', emissiveIntensity: 5.0, roughness: 0.2, metalness: 0.0 })
  };
  scene.userData.materials = materials;

  const halfW = corridorWidth / 2;
  const halfH = corridorHeight / 2;
  const edgeThickness = 0.08;

  // Only keep edge geometry; remove solid surfaces
  const floorGeoZ = new THREE.BoxGeometry(corridorWidth, thickness, L1);
  const ceilGeoZ = new THREE.BoxGeometry(corridorWidth, thickness, L1);
  const wallGeoZ = new THREE.BoxGeometry(thickness, corridorHeight, L1);
  const edgeGeoZ = new THREE.BoxGeometry(edgeThickness, edgeThickness, L1);

  const floorGeoX = new THREE.BoxGeometry(L2, thickness, corridorWidth);
  const ceilGeoX = new THREE.BoxGeometry(L2, thickness, corridorWidth);
  const wallGeoX = new THREE.BoxGeometry(L2, corridorHeight, thickness);
  const edgeGeoX = new THREE.BoxGeometry(L2, edgeThickness, edgeThickness);

  // Edge geometries for end caps
  const edgeGeoY = new THREE.BoxGeometry(edgeThickness, corridorHeight, edgeThickness);
  const edgeGeoCapX = new THREE.BoxGeometry(corridorWidth, edgeThickness, edgeThickness); // horizontal on Z-end
  const edgeGeoCapZ = new THREE.BoxGeometry(edgeThickness, edgeThickness, corridorWidth); // horizontal on X-end

  // Z segment centered from z=-L1/2 to 0 (edges only)
  const centerZ = new THREE.Vector3(0, 0, -L1 / 2);
  {
    const e1 = new THREE.Mesh(edgeGeoZ, materials.edgeMat);
    e1.position.set(centerZ.x - halfW + edgeThickness / 2, -halfH + edgeThickness / 2, centerZ.z);
    scene.add(e1);

    const e2 = new THREE.Mesh(edgeGeoZ, materials.edgeMat);
    e2.position.set(centerZ.x + halfW - edgeThickness / 2, -halfH + edgeThickness / 2, centerZ.z);
    scene.add(e2);

    const e3 = new THREE.Mesh(edgeGeoZ, materials.edgeMat);
    e3.position.set(centerZ.x - halfW + edgeThickness / 2, halfH - edgeThickness / 2, centerZ.z);
    scene.add(e3);

    const e4 = new THREE.Mesh(edgeGeoZ, materials.edgeMat);
    e4.position.set(centerZ.x + halfW - edgeThickness / 2, halfH - edgeThickness / 2, centerZ.z);
    scene.add(e4);
  }

  // X segment centered from x=L2/2 to 0 at z=0 (edges only)
  const centerX = new THREE.Vector3(L2 / 2, 0, 0);
  {
    const e5 = new THREE.Mesh(edgeGeoX, materials.edgeMat);
    e5.position.set(centerX.x, -halfH + edgeThickness / 2, centerX.z - halfW + edgeThickness / 2);
    scene.add(e5);

    const e6 = new THREE.Mesh(edgeGeoX, materials.edgeMat);
    e6.position.set(centerX.x, -halfH + edgeThickness / 2, centerX.z + halfW - edgeThickness / 2);
    scene.add(e6);

    const e7 = new THREE.Mesh(edgeGeoX, materials.edgeMat);
    e7.position.set(centerX.x, halfH - edgeThickness / 2, centerX.z - halfW + edgeThickness / 2);
    scene.add(e7);

    const e8 = new THREE.Mesh(edgeGeoX, materials.edgeMat);
    e8.position.set(centerX.x, halfH - edgeThickness / 2, centerX.z + halfW - edgeThickness / 2);
    scene.add(e8);
  }

  // End cap at the back of Z corridor (z = -L1)
  {
    const zEnd = -L1;
    // verticals (Y) at left/right
    const v1 = new THREE.Mesh(edgeGeoY, materials.edgeMat);
    v1.position.set(-halfW + edgeThickness / 2, 0, zEnd);
    scene.add(v1);

    const v2 = new THREE.Mesh(edgeGeoY, materials.edgeMat);
    v2.position.set(halfW - edgeThickness / 2, 0, zEnd);
    scene.add(v2);

    // horizontals (X) at top/bottom
    const h1 = new THREE.Mesh(edgeGeoCapX, materials.edgeMat);
    h1.position.set(0, halfH - edgeThickness / 2, zEnd);
    scene.add(h1);

    const h2 = new THREE.Mesh(edgeGeoCapX, materials.edgeMat);
    h2.position.set(0, -halfH + edgeThickness / 2, zEnd);
    scene.add(h2);
  }

  // End cap at the far end of X corridor (x = L2)
  {
    const xEnd = L2;
    // verticals (Y) at near/far z
    const v3 = new THREE.Mesh(edgeGeoY, materials.edgeMat);
    v3.position.set(xEnd, 0, -halfW + edgeThickness / 2);
    scene.add(v3);

    const v4 = new THREE.Mesh(edgeGeoY, materials.edgeMat);
    v4.position.set(xEnd, 0, halfW - edgeThickness / 2);
    scene.add(v4);

    // horizontals (Z) at top/bottom
    const h3 = new THREE.Mesh(edgeGeoCapZ, materials.edgeMat);
    h3.position.set(xEnd, halfH - edgeThickness / 2, 0);
    scene.add(h3);

    const h4 = new THREE.Mesh(edgeGeoCapZ, materials.edgeMat);
    h4.position.set(xEnd, -halfH + edgeThickness / 2, 0);
    scene.add(h4);
  }

  // Lights and fog not required for emissive edges; ensure no fog dims lines
  scene.fog = null;

  scene.userData.corridor = { L1, L2, width: corridorWidth, height: corridorHeight };
}

createHallway();

// Camera initial position (inside corridor)
const corridorCfg = scene.userData.corridor;
camera.position.set(-1.5, 0, -corridorCfg.L1 * 0.6);
camera.lookAt(0, 0, -corridorCfg.L1 * 0.6 + 1);

// Input handling (WASD + mouse drag look)
const pressed = new Set();
window.addEventListener('keydown', (e) => {
  pressed.add(e.key.toLowerCase());
});
window.addEventListener('keyup', (e) => {
  pressed.delete(e.key.toLowerCase());
});

let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;
let yaw = 0;   // rotation around Y
let pitch = 0; // rotation around X

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

canvas.addEventListener('mousedown', (e) => {
  isDragging = true;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
});
window.addEventListener('mouseup', () => {
  isDragging = false;
});
window.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  const dx = e.clientX - lastMouseX;
  const dy = e.clientY - lastMouseY;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;

  const sensitivity = 0.0025; // radians per pixel
  yaw -= dx * sensitivity;
  pitch -= dy * sensitivity;
  pitch = clamp(pitch, -Math.PI / 2 + 0.001, Math.PI / 2 - 0.001);
});

// Movement parameters
const movementSpeed = 10; // units per second
const strafeSpeedFactor = 1.0;
const damping = 0.85;
let velocityX = 0;
let velocityZ = 0;

// Keep camera constrained within hallway bounds (with small margin)
function constrainToCorridor(position) {
  const margin = 0.4;
  const corridor = scene.userData.corridor;
  const halfW = corridor.width / 2 - margin;
  const L1 = corridor.L1 - margin;
  const L2 = corridor.L2 - margin;

  // Region A (Z segment): x in [-halfW, halfW], z in [-L1, 0]
  const clampA = new THREE.Vector3(
    clamp(position.x, -halfW, halfW),
    position.y,
    clamp(position.z, -L1, 0)
  );
  // Region B (X segment): z in [-halfW, halfW], x in [0, L2]
  const clampB = new THREE.Vector3(
    clamp(position.x, 0, L2),
    position.y,
    clamp(position.z, -halfW, halfW)
  );
  // Choose whichever is closer to original position
  const dA = clampA.distanceToSquared(position);
  const dB = clampB.distanceToSquared(position);
  if (dA <= dB) {
    position.x = clampA.x; position.z = clampA.z;
  } else {
    position.x = clampB.x; position.z = clampB.z;
  }
}

// Fixed timestep at 15 FPS
const fps = 15;
const frameTime = 1 / fps; // seconds
let lastTime = performance.now() / 1000; // seconds
let accumulator = 0;
let lastRenderAt = 0; // seconds

function update(dt) {
  // Update camera orientation from yaw/pitch
  camera.rotation.order = 'YXZ';
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;

  // Forward vector from yaw (ignore pitch for movement)
  const forwardX = Math.sin(yaw);
  const forwardZ = Math.cos(yaw);
  const rightX = Math.cos(yaw);
  const rightZ = -Math.sin(yaw);

  let accelX = 0;
  let accelZ = 0;
  if (pressed.has('s')) {
    accelX += forwardX;
    accelZ += forwardZ;
  }
  if (pressed.has('w')) {
    accelX -= forwardX;
    accelZ -= forwardZ;
  }
  if (pressed.has('d')) {
    accelX -= rightX * strafeSpeedFactor;
    accelZ -= rightZ * strafeSpeedFactor;
  }
  if (pressed.has('a')) {
    accelX += rightX * strafeSpeedFactor;
    accelZ += rightZ * strafeSpeedFactor;
  }

  // Normalize acceleration to prevent faster diagonal speed
  const len = Math.hypot(accelX, accelZ);
  if (len > 0) {
    accelX /= len;
    accelZ /= len;
  }

  velocityX += accelX * movementSpeed * dt;
  velocityZ += accelZ * movementSpeed * dt;

  // Damping
  velocityX *= damping;
  velocityZ *= damping;

  camera.position.x += velocityX * dt;
  camera.position.z += velocityZ * dt;
  constrainToCorridor(camera.position);
}

function loop() {
  const now = performance.now() / 1000; // seconds
  let delta = now - lastTime;
  lastTime = now;

  // Avoid spiral of death if tab was inactive
  if (delta > 0.25) delta = 0.25;
  accumulator += delta;

  while (accumulator >= frameTime) {
    update(frameTime);
    accumulator -= frameTime;
  }

  // Render only at 15 FPS cadence
  if (now - lastRenderAt >= frameTime) {
    renderer.render(scene, camera);
    lastRenderAt = now;
  }

  requestAnimationFrame(loop);
}

// Initial size and start
resizeRendererToDisplaySize();
window.addEventListener('resize', resizeRendererToDisplaySize);
loop();


