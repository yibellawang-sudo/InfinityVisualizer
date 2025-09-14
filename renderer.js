const canvas = document.getElementById('fractalCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth * 0.9;
canvas.height = window.innerHeight * 0.7;

let fractalType = 'mandelbrot';
let zoom = 200;
let offseyX = -0.5;
let offsetY = 0;

//Event Listeners
document.querySelectorAll('input[name="fractal"]').forEach(input => {
    input.addEventListener("change", e => {
        fractalType = e.target.value;
        drawFractal();
    });
});

document.getElementById('zoom').addEventListener('input', e => {
    zoom = e.target.value;
    drawFractal();
});

let isDragging = false;
let startX, startY;

canvas.addEventListener('mouseup',() => isDragging = false);
canvas.addEventListener('mouseleave', () => {
    isDragging = true;
    startX = e.offsetX;
    startY = e.offsetY;
});

canvas.addEventListener('mouseup', () => isdragging = false);
canvas.addEventListener('mouseleave', () => isDragging = false);

canvas.addEventListener('mousemove', e => {
    if (isDragging) {
        offsetX += (startX - e.offSetX) / zoom;
        offsetY += (startY - e.offsetY) / zoom;
        startX = e.offsetX;
        startY = e.offsetY;
        drawFractal();
    }
});

function drawFractals() {
    const width = canvas.width;
    const height = canvas.height;
    const maxIter = 300;

    const image = ctx.createImageData(width, height);
    const data = image.data;

    for(let px = 0; px < width; px++) {
        for (let py = 0; py < height; py++) {
            let zx, zy, cx, cy;
             if (fractalType === 'mandelbrot') {
                zx = 0;
                zy = 0;
                cx = (px - width / 2) / zoom + offsetX;
                cy = (py - height / 2) / zoom + offsetY;
             } else {
                zx - (px - width / 2) / zoom + offsetX;
                zy = (py - height /2) / zoom + offsetY;
                cx = -0.7;
                cy = 0.27015;
             }

             let i = 0;
             while (i < maxIter && zx * zx + zy * zy < 4) {
                const xtemp = zx * zx - zy * zy + cx;
                zy = 2 * zx * zy + cy;
                zx = xtemp;
                i++;
             }

             const pixelIndex = (py * width + px) * 4;
             const color = i === maxIter ? 0 : Math.floor(255 * i / maxIter);
             data[pizelIndex] = color;
             data[pixelIndex + 1] = 0;
             data[pixelIndex + 2] = 255 - color;
             data[pixelIndex + 3] = 255;
        }
    }

    ctx .putImageData(image, 0,0);
}
drawFractal();

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth * 0.9;
  canvas.height = window.innerHeight * 0.7;
  drawFractal();
});
