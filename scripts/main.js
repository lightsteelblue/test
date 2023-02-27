'use strict'

import { Vec2 } from './mathtype.js';
import * as Renderer from './renderer.js';
import * as MPM from './mpm.js';
import * as GLU from './glutils.js';

let canvas = document.getElementById('canvas');

let pointerCanvasPos;

const canvasPos = (e, x, y) => {
    let rect = e.target.getBoundingClientRect();
    pointerCanvasPos = new Vec2(x - rect.left, y - rect.top - 1);
};

canvas.addEventListener('mousemove', e => canvasPos(e, e.clientX, e.clientY), false);
canvas.addEventListener('mouseleave', _ => pointerCanvasPos = undefined);
canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if (e.changedTouches.length === 1)
        canvasPos(e, e.changedTouches[0].pageX, e.changedTouches[0].pageY);
    }, 
    { passive: false }
);
canvas.addEventListener('touchend', _ => pointerCanvasPos = undefined);

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

    //let lastPointerCanvasPos;
    //let timestampCache = [performance.now()];

    const calcPointerSimPos = () => {
        if (!pointerCanvasPos)
            return new Vec2(1000);//Vec2.zero();
        let clip = Vec2.div(pointerCanvasPos, new Vec2(canvas.width, canvas.height));
        clip = Vec2.sub(Vec2.mul(clip, 2), 1);
        clip.y *= -1;
        return Renderer.clipPosToSimPos(clip);
    };

    // const calcPointerSimVel = () => {
    //     let elapse = timestampCache[timestampCache.length - 1]
    //                - timestampCache[timestampCache.length - 2];
    //     if (!pointerCanvasPos || !lastPointerCanvasPos || elapse === 0)
    //         return Vec2.zero();

    //     let vel = Vec2.div(Vec2.sub(pointerCanvasPos, lastPointerCanvasPos), elapse);
    //     vel = Vec2.mul(vel, 0.01 * fluidDomainR);
    //     vel.y *= -1;
    //     return vel;
    // };

    let fpsText = document.getElementById('fps');
    fpsText.textContent = `-- FPS`;
    //let fpsLastUpdate = timestampCache[0];


    const loop = () => {
        //timestampCache.push(performance.now());
        //if (timestampCache.length > 60)
        //    timestampCache.shift();
        let pointerSimPos = calcPointerSimPos();
        //let pointerSimVel = calcPointerSimVel();
        //lastPointerCanvasPos = pointerCanvasPos;

        //SPH.setPointerPos(pointerSimPos);
        //SPH.setPointerVel(pointerSimVel);

        MPM.setPointerPos(pointerSimPos);

        for (let i = 0; i < 1; i++)
            MPM.step();
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0.2, 0.2, 0.2, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        //MPM.renderCell();
        MPM.render(Renderer);

        // let latest = timestampCache[timestampCache.length - 1];
        // if (latest - fpsLastUpdate > 1000) {
        //     let ave = (latest - timestampCache[0]) / (timestampCache.length - 1) / 1000;
        //     fpsText.textContent = `${Math.round(1/ave)} FPS`;
        //     fpsLastUpdate = latest;
        // }

        requestAnimationFrame(loop);
    };

    loop();

})();
