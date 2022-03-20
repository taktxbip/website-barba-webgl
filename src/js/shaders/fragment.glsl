varying vec2 vUv;
uniform sampler2D uImage;

void main() {

    vec4 imageView = texture2D(uImage, vUv);

    gl_FragColor = imageView;
    // gl_FragColor = vec4(.2, 0.,0., 1.);
}