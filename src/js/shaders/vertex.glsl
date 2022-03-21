uniform float time;
uniform vec2 uResolution;
uniform vec2 uQuadSize;
uniform float uProgress;

uniform vec4 uCorners;
varying vec2 vUv;
varying vec2 vSize;
 
void main() {
    vUv = uv;

    float PI = 3.1415926;


    vec4 defaultState = modelMatrix * vec4( position, 1.0 );
    vec4 fullScreenState = vec4( position, 1.0 );

    fullScreenState.x = fullScreenState.x * uResolution.x;
    fullScreenState.y = fullScreenState.y * uResolution.y;
    fullScreenState.z += uCorners.x;
    
    float cornersProgress = mix(
        mix(uCorners.z, uCorners.w, uv.x),
        mix(uCorners.x, uCorners.y, uv.x),
        uv.y
        );

    vSize = mix(vec2(1., 1.), uResolution, cornersProgress);

    float sine = sin(PI * 0.);
    float waves = sine * 0.1 * sin(5. * length(uv) + time);

    vec4 finalState = mix(defaultState, fullScreenState, cornersProgress + waves);

    gl_Position = projectionMatrix * viewMatrix * finalState;

} 