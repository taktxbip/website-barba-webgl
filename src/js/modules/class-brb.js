import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import imagesLoaded from 'imagesloaded';
import FontFaceObserver from 'fontfaceobserver';
import gsap from 'gsap';
import Scroll from '../scroll';
import dat from 'dat.gui';
import ocean from '../../images/ocean.jpeg';

// import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

// Shaders
import fragment from '../shaders/fragment.glsl';
import vertex from '../shaders/vertex.glsl';

export default class Brb {
    constructor(options) {
        this.time = 0;
        this.dom = options.dom;
        this.currentScroll = 0;
        this.previousScroll = 0;
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                uImage: { value: 0 },
                hover: { value: new THREE.Vector2(0.5, 0.5) },
                hoverState: { value: 0 }
            },
            side: THREE.DoubleSide,
            fragmentShader: fragment,
            vertexShader: vertex,
            wireframe: false
        });
        this.materials = [];
        this.planeSegments = 40;

        this.width = this.dom.offsetWidth;
        this.height = this.dom.offsetHeight;

        // setup
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(70, this.width / this.height, 100, 2000);
        this.camera.position.z = 600;

        // this.camera.fov = 2 * Math.atan((this.height / 2) / this.camera.position.z) * (180 / Math.PI);

        // collisions
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: false,
            alpha: true
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(this.width, this.height);
        this.dom.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);

        this.images = [...document.querySelectorAll('img')];


        const fontRoboto = new Promise(resolve => {
            new FontFaceObserver("Roboto").load().then(() => {
                resolve();
            });
        });

        // Preload images
        const preloadImages = new Promise((resolve, reject) => {
            imagesLoaded(document.querySelectorAll("img"), { background: true }, resolve);
        });

        const allPromises = [fontRoboto, preloadImages];
        Promise.all(allPromises).then(() => {
            // this.scroll = new Scroll();
            this.setupSettings();
            this.addObjects();
            this.resize();
            this.events();
            this.render();
        });
    }

    setupSettings() {
        this.settings = {
            progress: 0
        };

        this.gui = new dat.GUI();
        this.gui.add(this.settings, 'progress', 0, 1, 0.001);
    }

    addObjects() {
        this.geometry = new THREE.BoxGeometry(500, 500, 0.2);
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                uImage: { value: new THREE.TextureLoader().load(ocean) },
                uProgress: { value: 0 },
                uResolution: { value: new THREE.Vector2(this.width, this.height) },
                uQuad: { value: new THREE.Vector2(500, 500) }
            },
            vertexShader: vertex,
            fragmentShader: fragment
        });

        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.rotation.z = 0.2;
        this.scene.add(this.mesh);
    }

    events() {
        window.addEventListener('resize', () => {
            this.resize();
        });
        window.addEventListener('mousemove', e => {
            this.mouse.x = (e.clientX / this.width) * 2 - 1;
            this.mouse.y = - (e.clientY / this.height) * 2 + 1;

            // this.raycaster.setFromCamera(this.mouse, this.camera);
            // // // calculate objects intersecting the picking ray
            // const intersects = this.raycaster.intersectObjects(this.scene.children);

            // if (intersects.length > 0) {
            //     let obj = intersects[0].object;
            //     obj.material.uniforms.hover.value = intersects[0].uv;
            // }

        }, false);
    }

    resize() {
        this.width = this.dom.offsetWidth;
        this.height = this.dom.offsetHeight;

        // Update camera
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();

        // Update renderer
        this.renderer.setSize(this.width, this.height);
    }

    render() {
        this.time += 0.05;

        this.previousScroll = this.currentScroll;

        this.material.uniforms.time.value = this.time;
        this.material.uniforms.uProgress.value = this.settings.progress;

        this.renderer.render(this.scene, this.camera);
        // this.composer.render(this.scene, this.camera);
        window.requestAnimationFrame(this.render.bind(this));

    }
}