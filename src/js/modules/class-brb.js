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
import perlinNoise from '../shaders/perlin-noise.glsl';

export default class Brb {
    constructor(options) {
        this.time = 0;
        this.dom = options.dom;
        this.materials = [];
        this.planeSegments = 100;
        this.cornerAnimationDuration = 0.4;

        this.width = this.dom.offsetWidth;
        this.height = this.dom.offsetHeight;

        this.geometry = new THREE.PlaneBufferGeometry(1, 1, this.planeSegments, this.planeSegments);

        this.material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                uImage: { value: new THREE.TextureLoader().load(checker) },
                uProgress: { value: 0 },
                uCorners: { value: new THREE.Vector4(0, 0, 0, 0) },
                uTextureSize: { value: new THREE.Vector2(500, 500) },
                uResolution: { value: new THREE.Vector2(this.width, this.height) },
                uQuadSize: { value: new THREE.Vector2(500, 500) }
            },
            side: THREE.DoubleSide,
            vertexShader: perlinNoise + vertex,
            fragmentShader: fragment,
            wireframe: false
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
            this.resize();
            this.events();
            this.render();
            this.barba();
        });
    }

    barba() {
        let that = this;
        barba.init({
            transitions: [{
                name: 'from-home',
                from: {
                    namespace: ['home']
                },
                leave(data) {
                    console.log('from-home');
                    that.asscroll.disable();
                    return gsap.timeline()
                        .to(data.current.container, {
                            opacity: 0
                        });
                },
                enter(data) {
                    that.asscroll = new ASScroll({
                        disableRaf: true,
                        containerElement: data.next.container.querySelector('[asscroll-container]')
                    });
                    that.asscroll.enable({
                        newScrollElements: data.next.container.querySelector('.scroll-wrap')
                    });
                    return gsap.timeline()
                        .from(data.next.container, {
                            opacity: 0,
                            onComplete: () => {
                                that.dom.style.display = 'none';
                            }
                        });
                }
            },
            {
                name: 'from-inside',
                from: {
                    namespace: ['inside']
                },
                leave(data) {
                    console.log('from-inside');
                    that.asscroll.disable();
                    return gsap.timeline()
                        .to('.curtain', {
                            duration: 0.3,
                            y: 0
                        })
                        .to(data.current.container, {
                            opacity: 0
                        });
                },
                enter(data) {
                    that.asscroll = new ASScroll({
                        disableRaf: true,
                        containerElement: data.next.container.querySelector('[asscroll-container]')
                    });
                    that.asscroll.enable({
                        horizontalScroll: true,
                        newScrollElements: data.next.container.querySelector('.scroll-wrap')
                    });

                    that.addImages();
                    that.resize();

                    return gsap.timeline()
                        .to('.curtain', {
                            duration: 0.3,
                            y: '-100%'
                        })
                        .from(data.next.container, {
                            opacity: 0,
                            onComplete: () => {
                                that.dom.style.display = 'none';
                            }
                        });
                }
            }
            ]
        });
    }

    updateCameraFOV() {
        this.camera.fov = 2 * Math.atan((this.height / 2) / this.camera.position.z) * (180 / Math.PI);
    }

    setupSettings() {
        this.asscroll = new ASScroll({
            disableRaf: true
        });

        const scrollSettings = {
            horizontalScroll: !document.body.classList.contains('b-inside')
        };
        this.asscroll.enable(scrollSettings);

        // this.settings = {
        //     progress: 0
        // };

        // this.gui = new dat.GUI();
        // this.gui.add(this.settings, 'progress', 0, 1, 0.001);
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
                        duration: this.cornerAnimationDuration,
                    })
                    .to(material.uniforms.uCorners.value, {
                        y: 1,
                        duration: this.cornerAnimationDuration,
                    }, 0.1)
                    .to(material.uniforms.uCorners.value, {
                        z: 1,
                        duration: this.cornerAnimationDuration,
                    }, 0.2)
                    .to(material.uniforms.uCorners.value, {
                        w: 1,
                        duration: this.cornerAnimationDuration,
                    }, 0.3);
            });

            img.addEventListener('mouseout', e => {
                this.tl = gsap.timeline()
                    .to(material.uniforms.uCorners.value, {
                        x: 0,
                        duration: this.cornerAnimationDuration,
                    })
                    .to(material.uniforms.uCorners.value, {
                        y: 0,
                        duration: this.cornerAnimationDuration,
                    }, 0.1)
                    .to(material.uniforms.uCorners.value, {
                        z: 0,
                        duration: this.cornerAnimationDuration,
                    }, 0.2)
                    .to(material.uniforms.uCorners.value, {
                        w: 0,
                        duration: this.cornerAnimationDuration,
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
            m.uniforms.uResolution.value.y = this.height;
        });

        this.imageStore.forEach(i => {
            const { width, height, top, left } = i.img.getBoundingClientRect();
            i.mesh.scale.set(width, height, 1);
            i.top = top;
            i.left = left + this.asscroll.currentPos;
            i.width = width;
            i.height = height;

            i.mesh.material.uniforms.uQuadSize.value.x = width;
            i.mesh.material.uniforms.uQuadSize.value.y = height;

            i.mesh.material.uniforms.uTextureSize.value.x = width;
            i.mesh.material.uniforms.uTextureSize.value.y = height;
        });
    }

    render() {
        this.time += 0.05;

        // this.asscroll.update();
        this.setPositions();

        // this.materials.forEach(m => {
        //     m.uniforms.time.value = this.time;
        // });

        // this.tl.progress(this.settings.progress);
        // console.log(this.imageStore[0]);
        // this.imageStore[0].mesh.material.uniforms.uProgress.value = this.settings.progress;

        this.asscroll.update();
        this.renderer.render(this.scene, this.camera);
        // this.composer.render(this.scene, this.camera);
        window.requestAnimationFrame(this.render.bind(this));

    }
}