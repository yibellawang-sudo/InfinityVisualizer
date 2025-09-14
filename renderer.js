const canvas = document.getElementById('fractalCanvas');
const gl = canvas.getContext('webgl');
canvas.width = window.innerWidth * 0.9;
canvas.height = window.innerHeight * 0.7;

let fractalType = 'mandelbrot';
let zoom = 200.0;
let offsetX = -0.5;
let offsetY = 0.0;
let juliaCx = -0.7;
let juliaCy = -0.27015;

// Vertex Shader
const vertexShaderSrc = `
attribute vec2 a_position;
void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

// Fragment Shader
const fragmentShaderSrc = `
precision highp float;
uniform vec2 u_resolution;
uniform vec2 u_offset;
uniform float u_zoom;
uniform int u_fractalType;
uniform vec2 u_juliaC;

vec3 hsv2rgb(vec3 c){
    vec3 rgb = clamp(
        abs(mod(c.x*6.0 + vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,
        0.0, 1.0
    );
    return c.z * mix(vec3(1.0), rgb, c.y);
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5*u_resolution) / u_zoom + u_offset;
    vec2 z = (u_fractalType==0) ? vec2(0.0, 0.0) : uv;
    vec2 c = (u_fractalType==0) ? uv : u_juliaC;

    int maxIter = 500;
    int i;
    for (i = 0; i < maxIter; i++) {
        float x = z.x*z.x - z.y*z.y + c.x;
        float y = 2.0*z.x*z.y + c.y;
        z = vec2(x, y);
        if (dot(z,z) > 4.0) break;
    }

    float mu = float(i) - log2(log2(dot(z,z))) + 1.0;
    float t = mu / float(maxIter);

    // smoother palette
    vec3 color = hsv2rgb(vec3(0.7 + 0.3*sin(6.283*t), 0.6, 0.5+0.5*sin(3.1415*t)));
    gl_FragColor = vec4(color, 1.0);
}
`;

// Compile helper
function createShader(gl, type, src) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
    }
    return shader;
}

// Program helper
function createProgram(gl, vShader, fShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
    }
    return program;
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSrc);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSrc);
const program = createProgram(gl, vertexShader, fragmentShader);
gl.useProgram(program);

// Fullscreen quad
const positionLocation = gl.getAttribLocation(program, 'a_position');
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,  1, -1,  -1, 1,
    -1,  1,  1, -1,   1, 1
]), gl.STATIC_DRAW);
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

// Uniforms
const u_resolution = gl.getUniformLocation(program, 'u_resolution');
const u_offset = gl.getUniformLocation(program, 'u_offset');
const u_zoom = gl.getUniformLocation(program, 'u_zoom');
const u_fractalType = gl.getUniformLocation(program, 'u_fractalType');
const u_juliaC = gl.getUniformLocation(program, 'u_juliaC');

function render() {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(u_resolution, canvas.width, canvas.height);
    gl.uniform2f(u_offset, offsetX, offsetY);
    gl.uniform1f(u_zoom, zoom);
    gl.uniform1i(u_fractalType, fractalType === 'mandelbrot' ? 0 : 1);
    gl.uniform2f(u_juliaC, juliaCx, juliaCy);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

// Event Listeners
document.querySelectorAll('input[name="fractal"]').forEach(input => {
    input.addEventListener("change", e => { fractalType = e.target.value; render(); });
});
document.getElementById('zoom').addEventListener('input', e => { zoom = +e.target.value; render(); });
document.getElementById('juliaCx').addEventListener('input', e => { juliaCx = +e.target.value; render(); });
document.getElementById('juliaCy').addEventListener('input', e => { juliaCy = +e.target.value; render(); });

// Dragging
let isDragging = false;
let startX, startY;
canvas.addEventListener('mousedown', e => { isDragging = true; startX = e.clientX; startY = e.clientY; });
canvas.addEventListener('mouseup', () => isDragging = false);
canvas.addEventListener('mouseleave', () => isDragging = false);
canvas.addEventListener('mousemove', e => {
    if (isDragging) {
        offsetX += (startX - e.clientX) / zoom;
        offsetY -= (startY - e.clientY) / zoom;
        startX = e.clientX;
        startY = e.clientY;
        render();
    }
});

// Resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth * 0.9;
    canvas.height = window.innerHeight * 0.7;
    render();
});

render();
