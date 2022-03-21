varying vec2 vUv;
uniform sampler2D uImage;
uniform vec2 uTextureSize;
varying vec2 vSize;

vec2 getUV(vec2 uv, vec2 textureSize, vec2 quadSize) {
    float quadAspect = quadSize.x / quadSize.y;
    float textureAspect = textureSize.x / textureSize.y;

    vec2 tempUv = uv - vec2(0.5);
    if (quadAspect < textureAspect) {
        tempUv = tempUv * vec2(quadAspect/textureAspect, 1.);
    }
    else {
        tempUv = tempUv * vec2(1., textureAspect/quadAspect);
    }
    tempUv += vec2(0.5);
    return tempUv;
}

void main() {
    vec2 correctUv = getUV(vUv, uTextureSize, vSize);

    vec4 imageView = texture2D(uImage, correctUv);

    gl_FragColor = imageView;
}