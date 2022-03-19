varying vec2 vUv;
uniform sampler2D uImage;
varying float vNoise;
uniform float hoverState;

void main() {
    vec2 newUV = vUv;

    vec2 p = newUV;
    float x = hoverState;
    x = smoothstep(.0,1.0,(x*2.0+p.y-1.0));

    vec4 f = mix(
        texture2D(uImage, (p-.5)*(1.-x)+.5), 
        texture2D(uImage, (p-.5)*x+.5), 
        x);

    vec4 imageView =  texture2D(uImage, newUV);
    
    gl_FragColor = imageView;
    gl_FragColor = f;
    gl_FragColor.rgb += vec3(vNoise / 7.0);
}