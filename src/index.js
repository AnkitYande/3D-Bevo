import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import Stats from 'three/examples/jsm/libs/stats.module';
import { GUI } from 'dat.gui';

// Scene, Camera, and Renderer Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color('skyblue');

const hemiLight = new THREE.HemisphereLight(0x888888, 0x444444, 0.6);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
dirLight.position.set(40, 40, 60);
scene.add(dirLight);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 4, 12);

const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio * 2);
document.body.appendChild(renderer.domElement);

// OrbitControls for mouse control
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false; // Disable panning so camera only orbits

// Ground (Grass Texture)
const textureLoader = new THREE.TextureLoader();
const grassTexture = textureLoader.load('./grass.png');
grassTexture.wrapS = THREE.RepeatWrapping;
grassTexture.wrapT = THREE.RepeatWrapping;
grassTexture.repeat.set(50, 50);

const groundMaterial = new THREE.MeshPhongMaterial({ map: grassTexture });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -1;
scene.add(ground);

// Animation Mixers and Actions
let mixer, activeAction, lastAction;
let animations = {}; // To store animation actions

let movement = { forward: false, backward: false, left: false, right: false };
let isJumping = false;
let cameraOffset = new THREE.Vector3(0, 4, 10);  // Initial offset from the character
let targetCameraPosition = camera.position.clone();  // Camera position to move towards

// Load Model
function LoadAnimatedModel() {
    const gltfLoader = new GLTFLoader();
    gltfLoader.load('./3D/beebo.gltf', (gltf) => {
        mixer = new THREE.AnimationMixer(gltf.scene);

        animations = {
            idle: mixer.clipAction(gltf.animations[0]),
            walk: mixer.clipAction(gltf.animations[2]),
            jump: mixer.clipAction(gltf.animations[3]),
            nod: mixer.clipAction(gltf.animations[1]),
        };

        // Set nod animation to play once
        animations.nod.setLoop(THREE.LoopOnce, 1);
        animations.nod.clampWhenFinished = true;

        activeAction = animations.idle;
        activeAction.play();

        gltf.scene.name = 'Bevo';
        gltf.scene.translateY(-1);
        scene.add(gltf.scene);

        // Listen for when an animation ends
        mixer.addEventListener('finished', (event) => {
            if (event.action === animations.nod) {
                if (movement.forward || movement.backward) {
                    setAction(animations.walk);  // Resume walking if moving
                } else {
                    setAction(animations.idle);  // Return to idle state
                }
            }
        });
    });
}

// Action Handler
function setAction(toAction) {
    if (toAction !== activeAction) {
        lastAction?.fadeOut(1);
        activeAction = toAction.reset().fadeIn(1).play();
        lastAction = activeAction;
    }
}

// Handle Walking/Jumping Together
function handleJumpAndWalk() {
    const bevo = scene.getObjectByName('Bevo');
    if (!bevo) return;

    const moveSpeed = 0.1;
    const rotateSpeed = 0.05;

    if (movement.forward) bevo.translateZ(moveSpeed);  // Forward
    if (movement.backward) bevo.translateZ(-moveSpeed);  // Backward
    if (movement.left) bevo.rotation.y += rotateSpeed;  // Rotate left
    if (movement.right) bevo.rotation.y -= rotateSpeed;  // Rotate right

    // Update the target camera position to maintain the offset from the character
    targetCameraPosition.copy(bevo.position).add(cameraOffset);
}

// Keyboard Event Handlers
document.addEventListener('keydown', (event) => {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            movement.forward = true;
            if (!isJumping) setAction(animations.walk);
            break;
        case 'ArrowDown':
        case 'KeyS':
            movement.backward = true;
            if (!isJumping) setAction(animations.walk);
            break;
        case 'ArrowLeft':
        case 'KeyA':
            movement.left = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            movement.right = true;
            break;
        case 'Space':
            if (!isJumping) {
                isJumping = true;
                const bevo = scene.getObjectByName('Bevo');
                if (bevo) {
                    setAction(animations.jump);

                    setTimeout(() => {
                        // Move model up by 0.5 units
                        // bevo.position.y += 0.5;
                        // setTimeout(() => {
                        //     // Move model back to original position
                        //     bevo.position.y -= 0.5;
                        // }, 250)
                        isJumping = false;
                        if (movement.forward || movement.backward) {
                            setAction(animations.walk);  // Resume walking after jump
                        } else {
                            setAction(animations.idle);  // Go back to idle if not walking
                        }
                    }, 400)
                }
            }
            break;
    }
});

document.addEventListener('keyup', (event) => {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
        case 'ArrowDown':
        case 'KeyS':
            movement.forward = movement.backward = false;
            if (!isJumping) setAction(animations.idle);
            break;
        case 'ArrowLeft':
        case 'KeyA':
            movement.left = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            movement.right = false;
            break;
    }
});

// Click Handler for Nod Animation
document.addEventListener('click', (event) => {
    const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const bevo = scene.getObjectByName('Bevo');
    if (bevo) {
        const intersects = raycaster.intersectObject(bevo, true);
        if (intersects.length > 0) {
            setAction(animations.nod);
        }
    }
});

// Update Character Movement
function updateMovement() {
    handleJumpAndWalk();  // Handle walking and jumping together
}

// Update Camera to Follow Character
function updateCamera() {
    // Smoothly move the camera towards the target position
    // camera.position.lerp(targetCameraPosition, 0.1);
    controls.target.lerp(scene.getObjectByName('Bevo').position, 0.1);  // Follow the character smoothly
    controls.update();
}

// Stats and GUI
const stats = Stats();
document.body.appendChild(stats.dom);

// const gui = new GUI();
// const animationsFolder = gui.addFolder('Animations');
// animationsFolder.open();

// Window Resize Handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation Loop
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);

    mixer?.update(clock.getDelta());
    updateMovement();
    updateCamera();  // Update the camera's position

    renderer.render(scene, camera);
    stats.update();
    controls.update();
}

// Load the Model and Start the Animation Loop
LoadAnimatedModel();
animate();
