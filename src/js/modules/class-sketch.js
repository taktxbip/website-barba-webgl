import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import imagesLoaded from 'imagesloaded';
import FontFaceObserver from 'fontfaceobserver';
import gsap from 'gsap';
import Scroll from '../scroll';

// Postprocessing
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
// import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

// Shaders
import fragment from '../shaders/fragment.glsl';
import vertex from '../shaders/vertex.glsl';
import vertexDistortion from '../shaders/vertex-distortion.glsl';
import fragmentDistortion from '../shaders/fragment-distortion.glsl';

export default class Sketch {
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
        this.loadingManager = new THREE.LoadingManager();
        this.textureLoader = new THREE.TextureLoader(this.loadingManager);

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(70, this.width / this.height, 100, 2000);
        this.camera.position.z = 600;

        this.camera.fov = 2 * Math.atan((this.height / 2) / this.camera.position.z) * (180 / Math.PI);

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
            this.scroll = new Scroll();
            this.addImages();
            this.setPositions();
            this.resize();
            this.events();
            this.composerPass();
            this.render();
        });
    }

    setPositions() {
        this.imageStore.forEach(o => {
            // check if image is visible
            o.mesh.position.y = this.currentScroll - o.top + this.height / 2 - o.height / 2;
            o.mesh.position.x = o.left - this.width / 2 + o.width / 2;
        });
    }

    composerPass() {
        this.composer = new EffectComposer(this.renderer);
        this.renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(this.renderPass);

        //custom shader pass
        var counter = 0.0;
        this.myEffect = {
            uniforms: {
                time: { value: 0 },
                tDiffuse: { value: 0 },
                scrollSpeed: { value: 0 }
            },
            vertexShader: vertexDistortion,
            fragmentShader: fragmentDistortion
        };

        this.customPass = new ShaderPass(this.myEffect);
        this.customPass.renderToScreen = true;

        this.composer.addPass(this.customPass);
    }

    addImages() {
        this.imageStore = this.images.map(img => {
            const bounds = img.getBoundingClientRect();

            const { top, left, height, width } = bounds;
            const geometry = new THREE.PlaneBufferGeometry(1, 1, this.planeSegments, this.planeSegments);
            const texture = new THREE.TextureLoader().load(img.src);
            texture.needsUpdate = true;

            const material = this.material.clone();
            material.uniforms.uImage.value = texture;

            img.addEventListener('mouseenter', () => {
                gsap.to(material.uniforms.hoverState, {
                    duration: 1,
                    value: 1
                });
            });

            img.addEventListener('mouseout', () => {
                gsap.to(material.uniforms.hoverState, {
                    duration: 1,
                    value: 0
                });
            });

            this.materials.push(material);

            const mesh = new THREE.Mesh(geometry, material);
            mesh.scale.set(width, height, 1);

            this.scene.add(mesh);

            return {
                img, mesh, top, left, width, height
            };
        });
    }

    events() {
        window.addEventListener('resize', () => {
            this.resize();
            this.setPositions();
        });
        window.addEventListener('mousemove', e => {
            this.mouse.x = (e.clientX / this.width) * 2 - 1;
            this.mouse.y = - (e.clientY / this.height) * 2 + 1;

            this.raycaster.setFromCamera(this.mouse, this.camera);
            // // calculate objects intersecting the picking ray
            const intersects = this.raycaster.intersectObjects(this.scene.children);

            if (intersects.length > 0) {
                let obj = intersects[0].object;
                obj.material.uniforms.hover.value = intersects[0].uv;
            }

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

        this.scroll.render();
        this.previousScroll = this.currentScroll;
        this.currentScroll = this.scroll.scrollToRender;

        // Optimizations
        // if (Math.round(this.previousScroll) !== Math.round(this.currentScroll)) {
        this.setPositions();

        this.customPass.uniforms.scrollSpeed.value = this.scroll.speedTarget;
        this.customPass.uniforms.time.value = this.time;

        this.materials.forEach(m => {
            m.uniforms.time.value = this.time;
        });

        // this.renderer.render(this.scene, this.camera);
        // }
        this.composer.render(this.scene, this.camera);
        window.requestAnimationFrame(this.render.bind(this));

    }
}