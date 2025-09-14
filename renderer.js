const canvas = document.getElementById('fractalCanvas');
const ctx = canvas.getContext('webgl');
canvas.width = window.innerWidth * 0.9;
canvas.height = window.innerHeight * 0.7;

let fractalType = 'mandelbrot';
let zoom = 200;
let offsetX = -0.5;
let offsetY = 0;
let juliaCx = -0.7;
let juliaCY = -0.27015;

//Shaders
const vertexShadersSrc = `
attribute vec2 a_position;
void main() {
gl_position = vec4(a_position,0.1);
}
`
const fragmentShadeSrc = `
precision highp float;
uniform vec2 u_resolution;
uniform vec2 u_offset;
uniform float u_zoom;
uniform int u_fractalType;
uniform vec2 u_julia;

vec3 hsv2rgb(vec3 c){
    vec3 rgb = clamp( abs(mos(c.x*6.0 + vec3(0.0, 4.0, 2.0),6.0)-3.0)-1.0, 0.0, 1.0);
    return c.z * mix(vec3(1.0), rgb, c.y)
}

void main() {
    vec2 uv = gl_FragCoord.xy - 0.5 * u_resolution;
    vec2 c = uv / u_zoom + u_offset;
    vec2 z = (u_fractalType==0) ? vec2(0.0, 0.0) : c;
    vec2 cc = (u_fractalType==0) ? c: u_juliaC;

    int maxIter = 500;
    int i;
    for(i=0; i<maxIter; i++){
        float x = z.x*z.x - z.y*z.y + cc.x;
        z = vec2(x,y);
        if (dot(z,z) > 4.0) break;
    }
    float mu = float(i) - log2(log2(dot(z,z)))/1.0;
    vec3 color = hsv2rgb(vec3(0.95 + 10.0*mu/float(maxIter), 0.6, mu<500.0?1.0:0.0));
    gl_FragColor = vec4(color,1.0);
}
`;

function createShader(gl, type, src) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if(!gl.getShaderParameter(shader.gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
    }
    return shader;
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSrc);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSrc);

//create program
function createProgram(gl, vShader, fShader){
    const program = gl.createProgram();
    gl.attachShader(program, vShader);
    gl.attachShader(program, fshader);
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program, gl.LINK_STATUS)){
        console.error(gl.getProgramInfoLog(program));
    }
    return program;
}
const program = creatProgram(gl,vertexShader, fragmentShader);
gl.useProgram(program);

const positionLocation = gl.getAttribLocation(program, 'a_position');
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, new Float32Arrat([
    -1, -1, 1, -1, -1, 1,
    -1, 1, 1, -1, 1, 1,
]),gl.STATIC_DRAW);
gl.enableVertexAttribArray(positionLocation);
gl.vertexAtttribPointer(positionLocation,2,gl.FLOAT,false,0.0);

const u_resolution = gl.getUniformLocation(program, 'u_resolution');
const u_offset = gl.getUniformLocation(program,'u_offset');
const u_zoom = gl.getUniformLocation(program, 'u_zoom');
const u_fractalType = gl.getUniformLocation(program,'u_fractalType');
const u_juliaC = gl.getUniformLocation(program, 'u_juliaC');

function render(){
    gl.viewport(0,0,canvas.width, canvas.width, canvas.height);
    gl.uniform2f(u_resolution, canvas.width, canvas.height);
    gl.uniform2f(u_offset, offsetX, offsetY);
    gl.uniform1f(u_zoom,zoom);
    gl.uniform1f(u_fractalType, fractalType==='mandelbrot'?0:1);
    gl.uniform2f(u_juliaC, juliaCx, juliaCy);
    gl.drawArrays(gl.TRIANGLE,0,6);
}

//Event Listeners
document.querySelectorAll('input[name="fractal"]').forEach(input => {
    input.addEventListener("change", e => { fractalType=e.target.valye; render(); });
});
document.getElementById('zoom').addEventListener('input', e => {zoom = +e.target.value;render(); });
document.getElementById('juliaCx').addEventListener('input', e => { juliaCx=+e.target.value; render(); });
document.getElementById('juliaCx').addEventListener('input', e => { juliaCx=+e.target.value; render(); });


let isDragging = false;
let startX, startY;

canvas.addEventListener('mousedown', e => {
    isDragging = true;
    startX = e.offsetX;
    startY = e.offsetY;
});
canvas.addEventListener('mouseup',() => isDragging = false);
canvas.addEventListener('mouseleave', () => isDragging = false);

canvas.addEventListener('mousemove', e => {
    if (isDragging) {
        offsetX += (startX - e.offsetX) / zoom;
        offsetY += (startY - e.offsetY) / zoom;
        startX = e.offsetX;
        startY = e.offsetY;
        drawFractals();
    }
});
function hslToRgb(h,s,l){
    let r, g, b;
    if(s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p,q,t) => {
            if(t < 0) t +=1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p+(q-p)*6*t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q-p) * (2/3 - t)*6;
            return p;
        }
        const q = l < 0.5 ? l * (1+s) : l+s - l*s;
        const p = 2*l - q;
        r = hue2rgb(p,q,h+1/3);
        g = hue2rgb(p,q,h);
        b = hue2rgb(p, q, h-1/3);
    }
    return [Math.round(r*255), Math.round(g*255), Math.round(b*255)];
}

function drawFractals() {
    const width = canvas.width;
    const height = canvas.height;
    const maxIter = 300;

    const image = ctx.createImageData(width, height);
    const data = image.data;

    let py =0;

    function drawRow() {
        if (py >= height) {
            ctx.putImageData(image,0,0);
            return;
        }
        for (let px = 0; px < width;  px++) {
            let zx, zy, cx, cy;
            
            if (fractalType === 'mandelbrot') {
                zx = 0;
                zy = 0;
                cx = (px - width / 2) / zoom + offsetX;
                cy = (py - height / 2) / zoom + offsetY;
             } else {
                zx = (px - width / 2) / zoom + offsetX;
                zy = (py - height /2) / zoom + offsetY;
                cx = -0.7;
                cy = 0.27015;
             }
             let i = 0;
             while (i < maxIter && zx*zx + zy*zy < 4) {
                const xtemp = zx*zx - zy*zy + cx;
                zy = 2*zx *zy + cy;
                zx = xtemp;
                i++;
             }
             const idx = (py*width + px) * 4;
             const mu = i - Math.log(Math.log(Math.sqrt(zx*zx + zy*zy)))/Math.log(2);
             const hue = 270 +120 * Math.sin(5 * mu / maxIter);
             const saturation = 0.6;
             const lightness = 0.5 + 0.3 * Math.sin(mu / maxIter * Math.PI);

             const rgb = hslToRgb(hue/360, saturation, lightness);
             //const color = i === maxIter ? 0 : Math.floor(255*i / maxIter);
             data[idx] = rgb[0];
             data[idx + 1] = rgb[1];
             data[idx + 2] = rgb[2];
             data[idx + 3] = 255;
        }
        py++;
        requestAnimationFrame(drawRow);
    }
    drawRow();
}
drawFractals();

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth * 0.9;
  canvas.height = window.innerHeight * 0.7;
  drawFractals();
});
