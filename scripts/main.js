'use strict'

import { Vec2, Vec3 } from './mathtype.js';
import * as Renderer from './renderer.js';
import * as MPM from './mpm.js';

let canvas = document.getElementById('canvas');

let pointerCanvasPos = new Vec2(0);
let rotationStartPos = new Vec2(0);
let isRotation = false;

const canvasPos = (e, x, y) => {
    let rect = e.target.getBoundingClientRect();
    return new Vec2(x - rect.left, y - rect.top - 1);
};

canvas.addEventListener('mousedown', e => {
    rotationStartPos = canvasPos(e, e.clientX, e.clientY);
    isRotation = true;
}, false);
canvas.addEventListener('mouseup', _ => isRotation = false, false);
canvas.addEventListener('mousemove', e => pointerCanvasPos = canvasPos(e, e.clientX, e.clientY), false);
canvas.addEventListener('mouseleave', _ => isRotation = false);
canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if (e.changedTouches.length === 1)
        pointerCanvasPos = canvasPos(e, e.changedTouches[0].pageX, e.changedTouches[0].pageY);
    }, 
    { passive: false }
);
//canvas.addEventListener('touchend', _ => {});

(async () => {
    let gl = canvas.getContext('webgl2', {antialias: false});

    if (!gl) {
        document.getElementById('message').textContent = 'WebGL2 unsupported.';
        return;
    }
    if (!gl.getExtension('EXT_color_buffer_float')) {
        document.getElementById('message').textContent = 'WebGL2-extention "EXT_color_buffer_float" unsupported.';
        return;
    }

    try {
        let m = MPM.loadShaderFilesAsync();
        let r = Renderer.loadShaderFilesAsync();
        await Promise.all([m, r]);
        MPM.init(gl);
        Renderer.init(gl, canvas);

    } catch (e) {
        console.error(e);
        return;
    }

    let timestampCache = [performance.now()];

    let fpsText = document.getElementById('fps');
    fpsText.textContent = `-- FPS`;
    let fpsLastUpdate = timestampCache[0];

    Renderer.setRenderingSimulationArea(Vec3.zero(), MPM.gridRes);

    let oldPointerPos = rotationStartPos;

    let oldE2PDir = Renderer.setPointerPos(pointerCanvasPos).d;

    const loop = () => {
        timestampCache.push(performance.now());
        if (timestampCache.length > 60)
           timestampCache.shift();

        let pointerMove = pointerCanvasPos.sub(oldPointerPos);

        if (isRotation) {
            Renderer.RotateEye(pointerMove);
        } else {
            let ad = Renderer.setPointerPos(pointerCanvasPos);
            let moveDirSim = ad.d.sub(oldE2PDir).normalized();
            oldE2PDir = ad.d;
            let vel = moveDirSim.mul(-7*pointerMove.div(canvas.width).length());
    
            MPM.setPointerMove(ad.a, ad.d, vel);
        }
        oldPointerPos = pointerCanvasPos;


        for (let i = 0; i < 1; i++)
            MPM.step();
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0.2, 0.2, 0.2, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        MPM.render(Renderer);

        let latest = timestampCache[timestampCache.length - 1];
        if (latest - fpsLastUpdate > 1000) {
            let ave = (latest - timestampCache[0]) / (timestampCache.length - 1) / 1000;
            fpsText.textContent = `${Math.round(1/ave)} FPS`;
            fpsLastUpdate = latest;
        }

        requestAnimationFrame(loop);
    };

    loop();

})();
