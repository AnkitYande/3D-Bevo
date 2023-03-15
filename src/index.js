import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import Stats from 'three/examples/jsm/libs/stats.module'
import { GUI } from 'dat.gui'

const scene = new THREE.Scene()
scene.background= new THREE.Color( 'skyblue' )
// scene.add(new THREE.AxesHelper(5))

// const light = new THREE.PointLight()
// light.position.set(1000, 1000, 1000)
// scene.add(light)
const hemiLight = new THREE.HemisphereLight(0xeeeeee, 0x222222, 0.5);
scene.add(hemiLight);

const lightA = new THREE.AmbientLight(0xffffff, 1); // soft white light
scene.add(lightA);


const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    5000
)
camera.position.set(400, 200, 700)

const renderer = new THREE.WebGLRenderer({antialias: true})
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.target.set(0, 1, 0)

let mixers = []
let previousRAF = null;
let modelReady = false
const animationActions = []
let activeAction
let lastAction

function LoadAnimatedModel() {
    const loader = new FBXLoader();
    loader.load('../3D/beebo.fbx', (fbx) => {
        // fbx.scale.setScalar(0.001);
        fbx.traverse(c => {
            c.castShadow = true;
        });

        const anim = new FBXLoader();
        anim.load('../3D/beebo.fbx', (anim) => {
            const m = new THREE.AnimationMixer(fbx);
            mixers.push(m);
            
            const idle = m.clipAction(anim.animations[0]);
            animationActions.push(idle)
            animationsFolder.add(animations, 'idle')
            activeAction = animationActions[0]
            
            const walk = m.clipAction(anim.animations[2]);
            animationActions.push(walk)
            animationsFolder.add(animations, 'walk')

            const nod = m.clipAction(anim.animations[3]);
            animationActions.push(nod)
            animationsFolder.add(animations, 'nod')
            // idle.play();
        });
        fbx.translateY(-200)
        scene.add(fbx);
    });
}

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}

const stats = Stats()
document.body.appendChild(stats.dom)

const animations = {
    idle: function () {
        setAction(animationActions[0])
    },
    walk: function () {
        setAction(animationActions[1])
    },
    nod: function () {
        setAction(animationActions[2])
    }
}

const setAction = (toAction) => {
    console.log("selected")
    if (toAction != activeAction) {
        lastAction = activeAction
        activeAction = toAction
        lastAction.fadeOut(1)
        activeAction.reset()
        activeAction.fadeIn(1)
        toAction.play()
    }
}

function step(timeElapsed) {
    const timeElapsedS = timeElapsed * 0.001;
    if (mixers) {
        mixers.map(m => m.update(timeElapsedS));
    }

    controls.update()
}

function raf() {
    requestAnimationFrame((t) => {
        if (previousRAF === null) {
            previousRAF = t;
        }

        raf();

        renderer.render(scene, camera);
        stats.update()

        step(t - previousRAF);
        previousRAF = t;
    });
}
const gui = new GUI()
const animationsFolder = gui.addFolder('Animations')
animationsFolder.open()

const clock = new THREE.Clock()

LoadAnimatedModel()
raf()

// import * as THREE from 'three'
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
// import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
// import Stats from 'three/examples/jsm/libs/stats.module'
// import { GUI } from 'dat.gui'

// const scene = new THREE.Scene()
// scene.add(new THREE.AxesHelper(5))

// const light = new THREE.PointLight()
// light.position.set(2.5, 7.5, 15)
// scene.add(light)

// const camera = new THREE.PerspectiveCamera(
//     75,
//     window.innerWidth / window.innerHeight,
//     0.1,
//     1000
// )
// camera.position.set(5, 5, 1.0)

// const renderer = new THREE.WebGLRenderer()
// renderer.setSize(window.innerWidth, window.innerHeight)
// document.body.appendChild(renderer.domElement)

// const controls = new OrbitControls(camera, renderer.domElement)
// controls.enableDamping = true
// controls.target.set(0, 1, 0)

// let mixer
// let modelReady = false
// const animationActions = []
// let activeAction
// let lastAction
// const fbxLoader = new FBXLoader()

// fbxLoader.load('../3D/beebo.fbx',
//     (object) => {
//         object.scale.set(0.01, 0.01, 0.01)
//         mixer = new THREE.AnimationMixer(object)

//         const animationAction = mixer.clipAction(
//             (object).animations[0]
//         )
//         animationActions.push(animationAction)
//         animationsFolder.add(animations, 'default')
//         activeAction = animationActions[0]

//         scene.add(object)

//         //add an animation from another file
//         fbxLoader.load(
//             '../3D/beebo.fbx',
//             (object) => {
//                 console.log('loaded animations:')
//                 console.log(object.animations)
//                 // console.log(object.animations[2])

//                 // for(let idx in object.animations){
//                 //     let animation = object.animations[i]
//                 //     console.log(animation)
//                 //     if(animation.name == "headNod"){
//                 //         const animationAction = mixer.clipAction(animation)
//                 //         animationActions.push(animationAction)
//                 //         animationsFolder.add(animation, 'headNod')
//                 //     }
//                 // }

//                 const animationAction = mixer.clipAction(
//                     object.animations[3]
//                 )
//                 animationActions.push(animationAction)
//                 animationsFolder.add(animations, 'nod')

//             },
//             (xhr) => {
//                 console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
//             },
//             (error) => {
//                 console.log(error)
//             }
//         )
//     },
//     (xhr) => {
//         console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
//     },
//     (error) => {
//         console.log(error)
//     }
// )

// window.addEventListener('resize', onWindowResize, false)
// function onWindowResize() {
//     camera.aspect = window.innerWidth / window.innerHeight
//     camera.updateProjectionMatrix()
//     renderer.setSize(window.innerWidth, window.innerHeight)
//     render()
// }

// const stats = Stats()
// document.body.appendChild(stats.dom)

// const animations = {
//     "default": function () {
//         setAction(animationActions[0])
//     },
//     "nod": function () {
//         setAction(animationActions[1])
//     }
//     // 1: function () {
//     //     setAction(animationActions[1])
//     // },
//     // 2: function () {
//     //     setAction(animationActions[2])
//     // },
//     // 3: function () {
//     //     setAction(animationActions[3])
//     // },
// }

// const setAction = (toAction) => {
//     if (toAction != activeAction) {
//         lastAction = activeAction
//         activeAction = toAction
//         //lastAction.stop()
//         lastAction.fadeOut(1)
//         activeAction.reset()
//         activeAction.fadeIn(1)
//         activeAction.play()
//     }
// }

// const gui = new GUI()
// const animationsFolder = gui.addFolder('Animations')
// animationsFolder.open()

// const clock = new THREE.Clock()

// function animate() {
//     requestAnimationFrame(animate)

//     controls.update()

//     if (modelReady) mixer.update(clock.getDelta())

//     render()

//     stats.update()
// }

// function render() {
//     renderer.render(scene, camera)
// }

// animate()