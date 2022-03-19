varying vec2 vUv;
uniform float time;
uniform vec2 hover;
uniform float hoverState;
varying float vNoise;
 
void main() {
    vec3 newPosition = position;

    float dist = distance(uv, hover);

    newPosition.z += hoverState * 10.0 * sin(dist * 5. + time / 5.);

    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4( newPosition, 1.0 );

    vNoise = hoverState* sin(dist * 5. - time / 5.);
    vUv = uv;
} 