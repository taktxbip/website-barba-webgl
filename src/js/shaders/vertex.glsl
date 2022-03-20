varying vec2 vUv;
uniform float time;
uniform vec2 hover;
uniform vec2 uResolution;
uniform vec2 uQuad;
uniform float uProgress;
varying float vNoise;
 
void main() {
    vec3 newPosition = position;

    // newPosition.x += uProgress * 100.;

    vec4 defaultState = modelMatrix * vec4( newPosition, 1.0 );
    vec4 fullScreenState =  vec4( newPosition, 1.0 );
    fullScreenState.x *= uResolution.x / uQuad.x;
    fullScreenState.y *= uResolution.y / uQuad.y;

    vec4 finalState = mix(fullScreenState, defaultState, uProgress);

    gl_Position = projectionMatrix * viewMatrix * finalState;

    vUv = uv;
} 