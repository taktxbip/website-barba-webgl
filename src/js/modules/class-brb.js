import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import imagesLoaded from 'imagesloaded';
import ASScroll from '@ashthornton/asscroll';
import FontFaceObserver from 'fontfaceobserver';
import gsap from 'gsap';
import dat from 'dat.gui';
import ocean from '../../images/ocean.jpeg';
import checker from '../../images/checker.png';
import barba from '@barba/core';

// import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

// Shaders
import fragment from '../shaders/fragment.glsl';
import vertex from '../shaders/vertex.glsl';

export default class Brb {
    constructor(options) {
        this.time = 0;
        this.dom = options.dom;
        this.materials = [];
        this.planeSegments = 100;

        this.width = this.dom.offsetWidth;
        this.height = this.dom.offsetHeight;

        this.geometry = new THREE.PlaneBufferGeometry(1, 1, this.planeSegments, this.planeSegments);
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                uImage: { value: new THREE.TextureLoader().load(checker) },
                uProgress: { value: 0 },
                uCorners: { value: new THREE.Vector4(0, 0, 0, 0) },
                uTextureSize: { value: new THREE.Vector2(2048, 2048) },
                uResolution: { value: new THREE.Vector2(this.width, this.height) }
                // uQuadSize: { value: new THREE.Vector2(500, 500) }
            },
            side: THREE.DoubleSide,
            vertexShader: vertex,
            fragmentShader: fragment
        });

        // setup
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(70, this.width / this.height, 100, 2000);
        this.camera.position.z = 600;
        this.updateCameraFOV();

        // collisions
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: false
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(this.width, this.height);
        this.dom.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);

        this.images = [...document.querySelectorAll('.js-image')];


        const fontCoustard = new Promise(resolve => {
            new FontFaceObserver("Coustard").load().then(() => {
                resolve();
            });
        });

        // Preload images
        const preloadImages = new Promise((resolve, reject) => {
            imagesLoaded(document.querySelectorAll("img"), { background: true }, resolve);
        });

        const allPromises = [fontCoustard, preloadImages];
        Promise.all(allPromises).then(() => {
            this.setupSettings();
            this.addImages();
            this.setPositions();
            // this.addObjects();
            this.resize();
            this.events();
            this.render();
        });
    }

    updateCameraFOV() {
        this.camera.fov = 2 * Math.atan((this.height / 2) / this.camera.position.z) * (180 / Math.PI);
    }

    setupSettings() {
        this.asscroll = new ASScroll({
            disableRaf: true
        });

        this.asscroll.enable({
            horizontalScroll: !document.body.classList.contains('b-inside')
        });

        // this.settings = {
        //     progress: 0
        // };

        // this.gui = new dat.GUI();
        // this.gui.add(this.settings, 'progress', 0, 1, 0.001);
    }

    addObjects() {
        console.log(this.width, this.height);


        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.mesh);
    }

    addImages() {
        this.imageStore = this.images.map(img => {
            const material = this.material.clone();
            const { top, left, height, width } = img.getBoundingClientRect();
            const texture = new THREE.TextureLoader().load(img.src);

            texture.needsUpdate = true;

            material.uniforms.uImage.value = texture;
            const mesh = new THREE.Mesh(this.geometry, material);

            this.materials.push(material);
            mesh.scale.set(width, height, 1);

            this.scene.add(mesh);

            img.addEventListener('mouseover', e => {
                this.tl = gsap.timeline()
                    .to(material.uniforms.uCorners.value, {
                        x: 1,
                        duration: 0.4
                    })
                    .to(material.uniforms.uCorners.value, {
                        y: 1,
                        duration: 0.4
                    }, 0.1)
                    .to(material.uniforms.uCorners.value, {
                        z: 1,
                        duration: 0.4
                    }, 0.2)
                    .to(material.uniforms.uCorners.value, {
                        w: 1,
                        duration: 0.4
                    }, 0.3);
            });

            img.addEventListener('mouseout', e => {
                this.tl = gsap.timeline()
                    .to(material.uniforms.uCorners.value, {
                        x: 0,
                        duration: 0.4
                    })
                    .to(material.uniforms.uCorners.value, {
                        y: 0,
                        duration: 0.4
                    }, 0.1)
                    .to(material.uniforms.uCorners.value, {
                        z: 0,
                        duration: 0.4
                    }, 0.2)
                    .to(material.uniforms.uCorners.value, {
                        w: 0,
                        duration: 0.4
                    }, 0.3);
            });

            return { img, mesh, top, left, width, height };
        });
    }

    setPositions() {
        this.imageStore.forEach(o => {
            // check if image is visible
            o.mesh.position.y = - o.top + this.height / 2 - o.height / 2;
            o.mesh.position.x = - this.asscroll.currentPos + o.left - this.width / 2 + o.width / 2;
        });
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

        this.updateCameraFOV();

        this.materials.forEach(m => {
            m.uniforms.uResolution.value.x = this.width;
            m.uniforms.uResolution.value.x = this.height;
        });
        this.imageStore.forEach(i => {
            const { width, height, top, left } = i.img.getBoundingClientRect();
            i.mesh.scale.set(width, height, 1);
            i.top = top;
            i.left = left + this.asscroll.currentPos;
            i.width = width;
            i.height = height;

            i.mesh.material.uniforms.uTextureSize.value.x = width;
            i.mesh.material.uniforms.uTextureSize.value.y = height;
        });
    }

    render() {
        this.time += 0.05;

        // this.asscroll.update();
        this.setPositions();

        this.material.uniforms.time.value = this.time;
        // this.tl.progress(this.settings.progress);
        // this.material.uniforms.uProgress.value = this.settings.progress;

        this.asscroll.update();
        this.renderer.render(this.scene, this.camera);
        // this.composer.render(this.scene, this.camera);
        window.requestAnimationFrame(this.render.bind(this));

    }
}