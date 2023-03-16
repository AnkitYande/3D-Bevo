import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import Stats from 'three/examples/jsm/libs/stats.module'
import { GUI } from 'dat.gui'

const scene = new THREE.Scene()
scene.background = new THREE.Color('skyblue')
// scene.add(new THREE.AxesHelper(5))

const hemiLight = new THREE.HemisphereLight(0xeeeeee, 0x222222, 0.75);
scene.add(hemiLight);

const lightA = new THREE.AmbientLight(0xffffff, 0.75); // soft white light
scene.add(lightA);


const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
)
camera.position.set(4, 4, 8)

const renderer = new THREE.WebGLRenderer({ antialias: false })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio * 2); //fixes anti aliesing
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.target.set(0, 1, 0)

let mixers = []
let mixer;
let animationActions = []
let activeAction
let lastAction

function LoadAnimatedModel() {

    // const loader = new FBXLoader();
    const gltfLoader = new GLTFLoader()

    gltfLoader.load('./3DBevo/3D/beebo.gltf', (gltf) => {
        mixer = new THREE.AnimationMixer(gltf.scene)
        mixers.push(mixer)
        console.log("animations:", gltf.animations)

        const idle = mixer.clipAction((gltf).animations[0])
        animationActions.push(idle)
        animationsFolder.add(animations, 'idle')

        const nod = mixer.clipAction((gltf).animations[1])
        animationActions.push(nod)
        animationsFolder.add(animations, 'nod')

        const walk = mixer.clipAction((gltf).animations[2])
        animationActions.push(walk)
        animationsFolder.add(animations, 'walk')

        const jump = mixer.clipAction((gltf).animations[3])
        animationActions.push(jump)
        animationsFolder.add(animations, 'jump')

        activeAction = animationActions[0]
        idle.play()
        gltf.scene.translateY(-1)
        scene.add(gltf.scene);
    },
        (xhr) => {
            animate()
            console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
        },
        (error) => {
            console.log(error)
        }
    )
}

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.render(scene, camera);
}

const stats = Stats()
document.body.appendChild(stats.dom)

let animations = {
    idle: function () {
        setAction(animationActions[0])
    },
    nod: function () {
        setAction(animationActions[1])
    },
    walk: function () {
        setAction(animationActions[2])
    },
    jump: function () {
        setAction(animationActions[3])
    }
}

const setAction = (toAction) => {
    if (toAction != activeAction) {
        console.log("selected: ", toAction._clip.name)
        lastAction = activeAction
        activeAction = toAction
        lastAction.fadeOut(1)
        activeAction.reset()
        activeAction.fadeIn(1)
        toAction.play()
    }
}

const clock = new THREE.Clock()
function animate() {
    requestAnimationFrame(animate)
    mixers.map(m => m.update(clock.getDelta()));

    renderer.render(scene, camera);
    stats.update()
    controls.update()
}

const gui = new GUI()
const animationsFolder = gui.addFolder('Animations')
animationsFolder.open()

LoadAnimatedModel()
