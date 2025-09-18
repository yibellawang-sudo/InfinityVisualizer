const canvas = document.getElementById('fractalCanvas');
const gl = canvas.getContext('webgl');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let offsetX = -0.5;
let offsetY = 0;
let zoom = 2.5;
let fractalType = 0; 
let juliaCx = -0.7;
let juliaCy = 0.27015;
let power = 2.0;

// --- Vertex Shader ---
const vertexShaderSrc = `
attribute vec2 a_position;
void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
}`;

// --- Fragment Shader ---
const fragmentShaderSrc = `
precision highp float;
uniform vec2 u_resolution;
uniform vec2 u_offset;
uniform float u_zoom;
uniform int u_type;
uniform vec2 u_julia;
uniform float u_power;

void main() {
    vec2 uv = (gl_FragCoord.xy / u_resolution) * 2.0 - 1.0;
    uv.x *= u_resolution.x / u_resolution.y;

    vec2 c;
    vec2 z;

    if(u_type == 0) { //Mandelbrot or Multibrot
        c = uv * u_zoom + u_offset;
        z = vec2(0.0, 0.0);
    } else if(u_type == 1) { //julia
        c = u_julia;
        z = uv * u_zoom + u_offset;
    } else { //burning ship
        c = uv * u_zoom + u_offset;
        z = vec2(0.0, 0.0);
    }

    const int maxIter = 400;
    int i = 0;

    for(int n = 0; n < maxIter; n++) {
        if(u_type == 2) { //burning ship
            z = vec2(abs(z.x), abs(z.y));
            z = vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y) + c;
        } else if (u_type == 0) { //mandelbrot or multibrot
            float r = length(z);
            float theta = atan(z.y, z.x);
            if (r > 0.0) {
                z = pow(r, u_power) * vec2(cos(u_power*theta),sin(u_power*theta)) + c;
            } else {
                z = c;
            }
        } else { // julia
            z = vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y) + c;
        }

        if(dot(z,z) > 4.0) {
            i = n;
            break;
        }
    }

    float normIter = float(i) -log2(log2(dot(z,z))) + 4.0;
    float t = normIter / float(maxIter);

    float freq = 36.0;

    vec3 color = 0.5 + 0.5*cos(6.2831*(freq*t + vec3(0.0, 0.33, 0.67)));
    color = pow(color, vec3(0.6));

    gl_FragColor = vec4(color, 1.0);
}`;

// --- WebGL Helpers ---
function createShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
    }
    return shader;
}

function createProgram(vs, fs) {
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
    }
    return program;
}

const sections = document.querySelectorAll('.section');

sections.forEach(section => {
    const box = section.querySelector('.box');
    const closeBtn = box.querySelector('.close-btn');

    box.addEventListener('click', e => {
        e.stopPropagation();
        // Collapse all other sections first
        sections.forEach(s => s.classList.remove('expanded'));
        section.classList.add('expanded');
    });

    closeBtn.addEventListener('click', e => {
        e.stopPropagation();
        section.classList.remove('expanded');
    });
});

document.body.addEventListener('click', () => {
    sections.forEach(s => s.classList.remove('expanded'));
});

const fractalInfo = {
    0:`
    <b>Mandelbrot / Multibrot Set</b><br>
    The Mandelbrot set is defined by iterating:
    <code>z -> z^2 + c</code>, starting with z=0.<br><br>
    The <b>Multibrot</b> generalizes this to:
    <code>z -> z^p + c</code>, where p is any power (2, 3, 4...).<br>
    <br>
    These sets reveal self-similar, infinitely detailed boundaries.
    `,
    1: `
    <b>Julia Set</b><br>
    For each point z, iterate:
    <code>z -> z^2 + c</code> with a fixed complex constant c.<br><br>
    Julia sets are closely related to Mandelbrot: every point in the mandelrot set corresponds to a connected Julia set.
    `,
    2: `
    <b>Burning Ship Fractal</b><br>
    This fractal is definied by <code>z -> (|Re(z)| + i|Im(z)|)^2 + c</code><br><br>
    The absolute values create sharp, ship-like structures unlike the smooth Mandelbrot/Julia boundaries.
    `
};
const infoBox = document.getElementById("infoBox");
const description = document.getElementById("fractalDescription");

document.getElementById('fractalType').addEventListener('change', e => {
    fractalType = parseInt(e.target.value);
    description.innerHTML= fractalInfo[fractalType] || "No info found";
    render();
});
description.innerHTML = fractalInfo[0];

let isDraggingBox = false;
let offsetXBox, offsetYBox;
infoBox.addEventListener('mousedown', (e) => {
    isDraggingBox = true;
    offsetXBox = e.clientX - infoBox.offsetLeft;
    offsetYBox = e.clientY - infoBox.offsetTop;
});
infoBox.addEventListener('mousemove', (e) =>{
    if(isDraggingBox) {
        infoBox.style.left = (e.clientX - offsetXBox) + "px";
        infoBox.style.top = (e.clientY - offsetYBox) + "px";
    }
});
document.addEventListener('mouseup', () => isDraggingBox=false);

const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSrc);
const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentShaderSrc);
const program = createProgram(vertexShader, fragmentShader);
gl.useProgram(program);

// Fullscreen rectangle
const positionLocation = gl.getAttribLocation(program, 'a_position');
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
   -1,-1, 1,-1, -1,1,
   -1,1, 1,-1, 1,1
]), gl.STATIC_DRAW);

gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

// Uniforms
const u_resolution = gl.getUniformLocation(program,'u_resolution');
const u_offset = gl.getUniformLocation(program,'u_offset');
const u_zoom = gl.getUniformLocation(program,'u_zoom');
const u_type = gl.getUniformLocation(program,'u_type');
const u_julia = gl.getUniformLocation(program,'u_julia');
const u_power = gl.getUniformLocation(program,'u_power');

function render() {
    gl.viewport(0,0,canvas.width, canvas.height);
    gl.uniform2f(u_resolution, canvas.width, canvas.height);
    gl.uniform2f(u_offset, offsetX, offsetY);
    gl.uniform1f(u_zoom, zoom);
    gl.uniform1i(u_type, fractalType);
    gl.uniform2f(u_julia, juliaCx, juliaCy);
    gl.uniform1f(u_power, power);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

// --- Interaction ---
let isDragging = false, startX, startY;
canvas.addEventListener('mousedown', e => { 
    isDragging = true; 
    startX=e.clientX; 
    startY=e.clientY; 
});
canvas.addEventListener('mousemove', e => {
    if(isDragging) {
        offsetX -= (e.clientX-startX) / (canvas.height*0.5) * zoom;
        offsetY += (e.clientY-startY) / (canvas.height*0.5) * zoom;
        startX = e.clientX; startY = e.clientY;
        render();
    }
});
canvas.addEventListener('mouseup', () => isDragging=false);
canvas.addEventListener('mouseleave', () => isDragging=false);


canvas.addEventListener('wheel', e => {
    zoom *= (e.deltaY>0)?1.1:0.9;
    render();
});

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    render();
});

//controls
document.getElementById('fractalType').addEventListener('change', e=> {
    fractalType = parseInt(e.target.value);

    let displayType = fractalType === 2 ? 0 : fractalType;
/*
    document.getElementById('fractalDescription').innerHTML = 
        fractalInfo[displayType] || "Fractal description not available."; */
    render();
});
document.getElementById('juliaCx').addEventListener('input', e => {
    juliaCx = parseFloat(e.target.value);
    render();
});
document.getElementById('juliaCy').addEventListener('input', e => {
    juliaCy = parseFloat(e.target.value);
    render();
});
document.getElementById('power').addEventListener('input', e => {
    power = parseFloat(e.target.value);
    render();
});

render();

//info boxes on homescreen still doesn't expand
//add actual info text