import { loadTextFileAsync } from './load.js';
import { Vec2, Vec3 } from './mathtype.js';
import * as GLU from './glutils.js';
import { ShaderProgram, ShaderProgramTF } from './shaderprogram.js';
import { FramebufferObject } from './framebufferobject.js';

let _gl;

export const gridRes = new Vec3(2, 1, 1).mul(32);
const _dp = 0.45;
let _tileRes = new Vec2(1, 1);
let _rcplTileRes = new Vec2(1, 1);

let _texRes;

const _gravity = new Vec3(0, 1, 0);
const _rho0 = 1;

const _vertFilenames = [
    'p2g.vert',
    'fullscreen.vert',
    'g2p.vert',
    'init_iswalltex.vert',
];
const _fragFilenames = [
    'p2g.frag',
    'grid_update.frag',
    'tf_dummy.frag',
    'div.frag',
    'sor.frag',
    'velocity.frag',
    'draw_pressure.frag',
    'update_boundary_velocity.frag',
    'init_iswalltex.frag',
    'external_force.frag',
];

let _vertSources;
let _fragSources;

let _P2GProgram;
let _G2PProgram;
let _gridUpdateProgram;
let _divProgram;
let _SORProgram;
let _velProgram;
let _updateBoundaryVelocityProgram;
let _initIsWallTexProgram;
let _externalForceProgram;

let _drawProgram;

let _gridFBO_r;
let _gridFBO_w;
let _pressureFBO_r;
let _pressureFBO_w;
let _divFBO;
let _isWallFBO;

let _posVBO_r;
let _velC3VBO_r;
let _C1VBO_r;
let _C2VBO_r;
let _posVBO_w;
let _velC3VBO_w;
let _C1VBO_w;
let _C2VBO_w;

let _particleCount;
let _dt;
let _volume0;
let _mass0;

let _step;

let _a = Vec3.zero();
let _d = Vec3.zero();
let _vel = Vec3.zero();

export const loadShaderFilesAsync = async () => {
    let paths = [..._vertFilenames, ..._fragFilenames].map(n => './shaders/' + n);
    let sources = await loadTextFileAsync(...paths);
    _vertSources = sources.slice(0, _vertFilenames.length);
    _fragSources = sources.slice(_vertFilenames.length);
};

export const init = (gl) => {
    _gl = gl;
    _step = 0;
    
    _dt = 0.3;
    _volume0 = _dp**3;
    _mass0 = _rho0 * _volume0;

    const maxTexSize = 2048;
    if (true) {
        _tileRes.x = gridRes.x * gridRes.y <= maxTexSize ? gridRes.y : Math.floor(maxTexSize / gridRes.x);
        _tileRes.y = Math.ceil(gridRes.y / _tileRes.x);
    } else {
        _tileRes.x = Math.ceil(Math.sqrt(gridRes.y * gridRes.z / gridRes.x));
        _tileRes.y = Math.ceil(gridRes.y / _tileRes.x);
    }

    let tx = Math.ceil(Math.sqrt(gridRes.y * gridRes.z / gridRes.x));
    let ty = Math.ceil(gridRes.y / tx);
    console.log(tx, ty);

    _rcplTileRes = new Vec2(1/_tileRes.x, 1/_tileRes.y);

    console.log(_tileRes);

    _texRes = new Vec2(gridRes.x * _tileRes.x, gridRes.z * _tileRes.y);
    _texRes = new Vec2(2**Math.ceil(Math.log2(_texRes.x)), 2**Math.ceil(Math.log2(_texRes.y)));
    console.log(_texRes);

    _P2GProgram = new ShaderProgram(_gl, _vertSources[0], _fragSources[0], [0, 1, 2, 3], [4, 4, 4, 4]);
    _G2PProgram = new ShaderProgramTF(_gl, _vertSources[2], _fragSources[2], ['o_pos', 'o_velC3', 'o_C1', 'o_C2'], [0, 1, 2, 3], [4, 4, 4, 4]);
    _divProgram = new ShaderProgram(_gl, _vertSources[1], _fragSources[3], null, null);
    _SORProgram = new ShaderProgram(_gl, _vertSources[1], _fragSources[4], null, null);
    _velProgram = new ShaderProgram(_gl, _vertSources[1], _fragSources[5], null, null);
    _drawProgram = new ShaderProgram(_gl, _vertSources[1], _fragSources[6], null, null);
    _updateBoundaryVelocityProgram = new ShaderProgram(_gl, _vertSources[1], _fragSources[7], null, null);
    _initIsWallTexProgram = new ShaderProgram(_gl, _vertSources[3], _fragSources[8], null, null);
    _externalForceProgram = new ShaderProgram(_gl, _vertSources[1], _fragSources[9], null, null);

    _gridUpdateProgram = new ShaderProgram(_gl, _vertSources[1], _fragSources[1], null, null);

    _gridFBO_r = new FramebufferObject(_gl, _texRes.x, _texRes.y, [['tex', 'RGBA32F']]);
    _gridFBO_w = new FramebufferObject(_gl, _texRes.x, _texRes.y, [['tex', 'RGBA32F']]);
    _pressureFBO_r = new FramebufferObject(_gl, _texRes.x, _texRes.y, [['tex', 'R32F']]);
    _pressureFBO_w = new FramebufferObject(_gl, _texRes.x, _texRes.y, [['tex', 'R32F']]);
    _divFBO = new FramebufferObject(_gl, _texRes.x, _texRes.y, [['tex', 'RGBA32F']]);
    _isWallFBO = new FramebufferObject(_gl, _texRes.x, _texRes.y, [['tex', 'R8']]);

    _initIsWallTexProgram.use();
    _isWallFBO.bind();
    _gl.uniform3f(_initIsWallTexProgram.uniform('u_gridRes'), gridRes.x, gridRes.y, gridRes.z);
    _gl.uniform4f(_initIsWallTexProgram.uniform('u_tileRes'), _tileRes.x, _tileRes.y, _rcplTileRes.x, _rcplTileRes.y);
    _gl.drawArrays(_gl.POINTS, 0, gridRes.x*gridRes.y*gridRes.z);

    _gl.clearColor(0, 0, 0, 0);
    _pressureFBO_r.bind();
    _gl.clear(_gl.COLOR_BUFFER_BIT);

    let pos = [];
    if (false) {
        pos = [15, 12, 0, 0, 16, 12, 0, 0];
    } else {
        for (let z = 1.25; z < gridRes.z-1; z+=_dp) {
            for (let y = 1.25; y < gridRes.y/2; y+=_dp) {
                for (let x = 1.25; x < gridRes.x/3; x+=_dp) {
                    pos.push(x + Math.random()*0.25);
                    pos.push(y + Math.random()*0.25);
                    pos.push(z + Math.random()*0.25);
                    pos.push(0);
                }
            }
        }
    }

    _particleCount = pos.length / 4;

    console.log(_particleCount);

    let vel = new Array(pos.length).fill(0);
    let C = new Array(_particleCount * 4).fill(0);

    [_posVBO_r, _velC3VBO_r, _C1VBO_r, _C2VBO_r] = [pos, vel, C, C].map(x => GLU.createVBO(_gl, x));
    [_posVBO_w, _velC3VBO_w, _C1VBO_w, _C2VBO_w] = [pos, vel, C, C].map(x => GLU.createVBO(_gl, x));
};

export const step = () => {
    _clearGrid();
    _P2G();
    _updateGrid(_step == 0 ? 100 : 20);
    _G2P();

    _step++;
};

export const setPointerMove = (a, d, vel) => {
    _a = a;
    _d = d;
    _vel = vel;
};

export const render = (renderer) => {
    _gl.bindFramebuffer(_gl.FRAMEBUFFER, null);
    _drawProgram.use();
    GLU.bindTextureUniform(_gl, 0, _drawProgram.uniform('tex'), _pressureFBO_r.texture('tex'));
    GLU.bindTextureUniform(_gl, 1, _drawProgram.uniform('gridTex'), _gridFBO_r.texture('tex'));
    GLU.bindTextureUniform(_gl, 2, _drawProgram.uniform('divTex'), _divFBO.texture('tex'));
    GLU.bindTextureUniform(_gl, 3, _drawProgram.uniform('isWallTex'), _isWallFBO.texture('tex'));
    _gl.uniform2f(_drawProgram.uniform('canvasSize'), canvas.width, canvas.height);
    //_gl.drawArrays(_gl.TRIANGLES, 0, 3);

    renderer.renderParticles(_particleCount, _dp*0.8, _posVBO_r, _velC3VBO_r);
};

const _clearGrid = () => {
    _gl.clearColor(0, 0, 0, 0);

    _gridFBO_w.bind();
    _gl.clear(_gl.COLOR_BUFFER_BIT);
};

const _updateGrid = (pressureIter) => {
    _gridFBO_w.bind();
    _gridUpdateProgram.use();
    GLU.bindTextureUniform(_gl, 0, _gridUpdateProgram.uniform('u_gridTex'), _gridFBO_r.texture('tex'));
    GLU.bindTextureUniform(_gl, 1, _gridUpdateProgram.uniform('u_isWallTex'), _isWallFBO.texture('tex'));
    _gl.uniform3f(_gridUpdateProgram.uniform('u_gridRes'), gridRes.x, gridRes.y, gridRes.z);
    _gl.uniform4f(_gridUpdateProgram.uniform('u_tileRes'), _tileRes.x, _tileRes.y, _rcplTileRes.x, _rcplTileRes.y);
    _gl.uniform2f(_gridUpdateProgram.uniform('u_rcpTexRes'), 1/_texRes.x, 1/_texRes.y);
    _gl.uniform3f(_gridUpdateProgram.uniform('u_gravity'), _gravity.x, _gravity.y, _gravity.z);
    _gl.uniform1f(_gridUpdateProgram.uniform('u_dt'), _dt);
    _gl.drawArrays(_gl.TRIANGLES, 0, 3);

    [_gridFBO_r, _gridFBO_w] = [_gridFBO_w, _gridFBO_r];

    _gridFBO_w.bind();
    _externalForceProgram.use();
    GLU.bindTextureUniform(_gl, 0, _externalForceProgram.uniform('u_gridTex'), _gridFBO_r.texture('tex'));
    _gl.uniform3f(_externalForceProgram.uniform('u_gridRes'), gridRes.x, gridRes.y, gridRes.z);
    _gl.uniform4f(_externalForceProgram.uniform('u_tileRes'), _tileRes.x, _tileRes.y, _rcplTileRes.x, _rcplTileRes.y);
    _gl.uniform2f(_externalForceProgram.uniform('u_rcpTexRes'), 1/_texRes.x, 1/_texRes.y);
    _gl.uniform3f(_externalForceProgram.uniform('a'), _a.x, _a.y, _a.z);
    _gl.uniform3f(_externalForceProgram.uniform('d'), _d.x, _d.y, _d.z);
    _gl.uniform3f(_externalForceProgram.uniform('vel'), _vel.x, _vel.y, _vel.z);
    _gl.drawArrays(_gl.TRIANGLES, 0, 3);

    _divFBO.bind();
    _divProgram.use();
    GLU.bindTextureUniform(_gl, 0, _divProgram.uniform('tex'), _gridFBO_w.texture('tex'));
    _gl.uniform3f(_divProgram.uniform('u_gridRes'), gridRes.x, gridRes.y, gridRes.z);
    _gl.uniform4f(_divProgram.uniform('u_tileRes'), _tileRes.x, _tileRes.y, _rcplTileRes.x, _rcplTileRes.y);
    _gl.uniform2f(_divProgram.uniform('u_rcpTexRes'), 1/_texRes.x, 1/_texRes.y);
    _gl.drawArrays(_gl.TRIANGLES, 0, 3);

    _SORProgram.use();
    GLU.bindTextureUniform(_gl, 0, _SORProgram.uniform('divTex'), _divFBO.texture('tex'));
    _gl.uniform3f(_SORProgram.uniform('u_gridRes'), gridRes.x, gridRes.y, gridRes.z);
    _gl.uniform4f(_SORProgram.uniform('u_tileRes'), _tileRes.x, _tileRes.y, _rcplTileRes.x, _rcplTileRes.y);
    _gl.uniform2f(_SORProgram.uniform('u_rcpTexRes'), 1/_texRes.x, 1/_texRes.y);
    _gl.uniform1f(_SORProgram.uniform('omega'), 1.9);
    for (let i = 0; i < pressureIter; i++) {
        _pressureFBO_w.bind();
        GLU.bindTextureUniform(_gl, 1, _SORProgram.uniform('pressureTex'), _pressureFBO_r.texture('tex'));
        _gl.uniform1i(_SORProgram.uniform('red_black'), 0);
        _gl.drawArrays(_gl.TRIANGLES, 0, 3);

        _pressureFBO_r.bind();
        GLU.bindTextureUniform(_gl, 1, _SORProgram.uniform('pressureTex'), _pressureFBO_w.texture('tex'));
        _gl.uniform1i(_SORProgram.uniform('red_black'), 1);
        _gl.drawArrays(_gl.TRIANGLES, 0, 3);
    }


    _gl.uniform1f(_SORProgram.uniform('omega'), 1);
    _gl.uniform1i(_SORProgram.uniform('red_black'), -1);
    for (let i = 0; i < 0; i++) {
        _pressureFBO_w.bind();
        GLU.bindTextureUniform(_gl, 1, _SORProgram.uniform('pressureTex'), _pressureFBO_r.texture('tex'));
        _gl.drawArrays(_gl.TRIANGLES, 0, 3);
        [_pressureFBO_r, _pressureFBO_w] = [_pressureFBO_w, _pressureFBO_r];
    }

    //[_gridFBO_r, _gridFBO_w] = [_gridFBO_w, _gridFBO_r];
    //return;


    _gridFBO_w.bind();
    _velProgram.use();
    _gl.enable(_gl.BLEND);
    _gl.blendFunc(_gl.ONE, _gl.ONE);
    GLU.bindTextureUniform(_gl, 0, _velProgram.uniform('pressureTex'), _pressureFBO_r.texture('tex'));
    GLU.bindTextureUniform(_gl, 1, _velProgram.uniform('divTex'), _divFBO.texture('tex'));
    _gl.uniform3f(_velProgram.uniform('u_gridRes'), gridRes.x, gridRes.y, gridRes.z);
    _gl.uniform4f(_velProgram.uniform('u_tileRes'), _tileRes.x, _tileRes.y, _rcplTileRes.x, _rcplTileRes.y);
    _gl.uniform2f(_velProgram.uniform('u_rcpTexRes'), 1/_texRes.x, 1/_texRes.y);
    _gl.drawArrays(_gl.TRIANGLES, 0, 3);
    _gl.disable(_gl.BLEND);

    [_gridFBO_r, _gridFBO_w] = [_gridFBO_w, _gridFBO_r];

    _gridFBO_w.bind();
    _updateBoundaryVelocityProgram.use();
    GLU.bindTextureUniform(_gl, 0, _updateBoundaryVelocityProgram.uniform('u_gridTex'), _gridFBO_r.texture('tex'));
    GLU.bindTextureUniform(_gl, 1, _updateBoundaryVelocityProgram.uniform('u_isWallTex'), _isWallFBO.texture('tex'));
    _gl.uniform3f(_updateBoundaryVelocityProgram.uniform('u_gridRes'), gridRes.x, gridRes.y, gridRes.z);
    _gl.uniform4f(_updateBoundaryVelocityProgram.uniform('u_tileRes'), _tileRes.x, _tileRes.y, _rcplTileRes.x, _rcplTileRes.y);
    _gl.uniform2f(_updateBoundaryVelocityProgram.uniform('u_rcpTexRes'), 1/_texRes.x, 1/_texRes.y);
    _gl.drawArrays(_gl.TRIANGLES, 0, 3);

    [_gridFBO_r, _gridFBO_w] = [_gridFBO_w, _gridFBO_r];
};

const _P2G = () => {
    _gridFBO_w.bind();
    _P2GProgram.use();
    _gl.enable(_gl.BLEND);
    _gl.blendFunc(_gl.ONE, _gl.ONE);

    GLU.setAttributes(_gl, [_posVBO_r, _velC3VBO_r, _C1VBO_r, _C2VBO_r], _P2GProgram.location, _P2GProgram.stride);
    _gl.uniform3f(_P2GProgram.uniform('u_gridRes'), gridRes.x, gridRes.y, gridRes.z);
    _gl.uniform4f(_P2GProgram.uniform('u_tileRes'), _tileRes.x, _tileRes.y, _rcplTileRes.x, _rcplTileRes.y);
    _gl.uniform1f(_P2GProgram.uniform('mass0'), _mass0);

    _P2GProgram.location.forEach(l => _gl.vertexAttribDivisor(l, 1));
    _gl.drawArraysInstanced(_gl.POINTS, 0, 2, _particleCount);
    _P2GProgram.location.forEach(l => _gl.vertexAttribDivisor(l, 0));

    _gl.disable(_gl.BLEND);

    [_gridFBO_r, _gridFBO_w] = [_gridFBO_w, _gridFBO_r];
};

const _G2P = () => {
    _gl.bindFramebuffer(_gl.FRAMEBUFFER, null);
    _G2PProgram.use();
    
    let vbos_r = [_posVBO_r, _velC3VBO_r, _C1VBO_r, _C2VBO_r];
    let vbos_w = [_posVBO_w, _velC3VBO_w, _C1VBO_w, _C2VBO_w];

    GLU.setAttributes(_gl, vbos_r, _G2PProgram.location, _G2PProgram.stride);

    GLU.bindTextureUniform(_gl, 0, _G2PProgram.uniform('u_gridTex'), _gridFBO_r.texture('tex'));
    _gl.uniform3f(_G2PProgram.uniform('u_gridRes'), gridRes.x, gridRes.y, gridRes.z);
    _gl.uniform4f(_G2PProgram.uniform('u_tileRes'), _tileRes.x, _tileRes.y, _rcplTileRes.x, _rcplTileRes.y);
    _gl.uniform1f(_G2PProgram.uniform('u_dt'), _dt);

    _G2PProgram.location.forEach((l, i) => _gl.bindBufferBase(_gl.TRANSFORM_FEEDBACK_BUFFER, l, vbos_w[i]));

    _gl.enable(_gl.RASTERIZER_DISCARD);
    _gl.beginTransformFeedback(_gl.POINTS);

    _gl.drawArrays(_gl.POINTS, 0, _particleCount);

    _gl.disable(_gl.RASTERIZER_DISCARD);
    _gl.endTransformFeedback();

    _G2PProgram.location.forEach(l => _gl.bindBufferBase(_gl.TRANSFORM_FEEDBACK_BUFFER, l, null));

    [_posVBO_r, _posVBO_w] = [_posVBO_w, _posVBO_r];
    [_velC3VBO_r, _velC3VBO_w] = [_velC3VBO_w, _velC3VBO_r];
    [_C1VBO_r, _C1VBO_w] = [_C1VBO_w, _C1VBO_r];
    [_C2VBO_r, _C2VBO_w] = [_C2VBO_w, _C2VBO_r];
};
