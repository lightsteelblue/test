import { loadTextFileAsync } from './load.js';
import { Vec2, Vec3, Quat, Mat4 } from './mathtype.js';
import * as GLU from './glutils.js';
import { ShaderProgram } from './shaderprogram.js';

let _gl;
let _canvas;

const _vertFilenames = [
    'pointsprite.vert',
];
const _fragFilenames = [
    'pointsprite.frag'   ,
];
let _vertSources;
let _fragSources;

let _pointSpriteProgram;

let _renderingArea = { min: Vec3.zero(), max: new Vec3(1) };

const _fovy = 60;
const _up = new Vec3(0, 1, 0);

let _eye;
let _eyeInit;
let _center = new Vec3(0);

let _pitchDeg = 10;
let _yawDeg = 0;

let _viewMat;
let _projectionMat;

let _pointerPosNDC;
let a = new Vec3(0);
let d = new Vec3(0);


export const loadShaderFilesAsync = async () => {
    let paths = [..._vertFilenames, ..._fragFilenames].map(n => './shaders/' + n);
    let sources = await loadTextFileAsync(...paths);
    _vertSources = sources.slice(0, _vertFilenames.length);
    _fragSources = sources.slice(_vertFilenames.length);
};

export const init = (gl, canvas) => {
    _gl         = gl;
    _canvas     = canvas;

    _projectionMat = Mat4.perspective(_fovy, _canvas.width / _canvas.height, 10, 1000);

    _createPrograms();
};

export const getViewMat = () => {
    return _viewMat;
};

export const getProjectionMat = () => {
    return _projectionMat;
};

export const setPointerPos = (pointerPos) => {
    _pointerPosNDC = pointerPos.div(new Vec2(canvas.width, canvas.height)).mul(2).sub(1).mul(new Vec2(1, -1));
    let x = _projectionMat.mulMat4(_viewMat).inv().mulVec4({x: _pointerPosNDC.x, y: _pointerPosNDC.y, z: -1, w: 1});
    a = new Vec3(x.x, x.y, x.z).div(x.w);
    d = _eye.sub(a).normalized();
    return { a: a, d: d };
};

export const RotateEye = (pointerMove) => {
    let move = pointerMove.div(Math.max(_canvas.width, _canvas.height));
    _pitchDeg += 200 * move.y;
    _pitchDeg = Math.max(Math.min(_pitchDeg, 89.9), -10);

    _yawDeg += 200 * move.x;
    
    let pitchQuat = Quat.axisAngle(new Vec3(1, 0, 0), _pitchDeg);
    let yawQuat = Quat.axisAngle(new Vec3(0, 1, 0), _yawDeg);

    _eye = Quat.rotate(_eyeInit, yawQuat.mul(pitchQuat)).add(_center);
    _viewMat = Mat4.lookAt(_eye, _center, _up);
};

export const setRenderingSimulationArea = (min, max) => {
    _renderingArea = { min, max };

    let shift = 0.5;
    _center = _renderingArea.max.div(2).sub(new Vec3(0, shift * _center.y, 0));

    let f = 1 / Math.tan(_fovy * Math.PI / 360 / 2);
    let eye2CenterDist = _center.y * (1 + shift) *1.0 * f;
    let pitchAxis = new Vec3(1, 0, 0);
    let pitchQuat = Quat.axisAngle(pitchAxis, _pitchDeg);
    _eyeInit = new Vec3(0, 0, 1).mul(eye2CenterDist);
    _eye = Quat.rotate(_eyeInit, pitchQuat).add(_center);
    _viewMat = Mat4.lookAt(_eye, _center, _up);
};

export const renderParticles = (particleCount=1, dp=1, posVBO, velVBO) => {
    _gl.bindFramebuffer(_gl.FRAMEBUFFER, null);
    _gl.viewport(0, 0, _canvas.width, _canvas.height);

    _gl.enable(_gl.DEPTH_TEST);

    _pointSpriteProgram.use();
    GLU.setAttributes(_gl, [posVBO, velVBO], [0, 1], [4, 4]);
    _gl.vertexAttribDivisor(0, 1);
    _gl.vertexAttribDivisor(1, 1);
    _gl.uniformMatrix4fv(_pointSpriteProgram.uniform('view'), false, _viewMat.val);
    _gl.uniformMatrix4fv(_pointSpriteProgram.uniform('projection'), false, _projectionMat.val);
    _gl.uniform3f(_pointSpriteProgram.uniform('a'), a.x, a.y, a.z);
    _gl.uniform3f(_pointSpriteProgram.uniform('d'), d.x, d.y, d.z);
    _gl.uniform1f(_pointSpriteProgram.uniform('particleRadius'), dp/2);
    _gl.drawArraysInstanced(_gl.TRIANGLE_STRIP, 0, 4, particleCount);
    _gl.vertexAttribDivisor(0, 0);
    _gl.vertexAttribDivisor(1, 0);

    _gl.disable(_gl.DEPTH_TEST);
};

const _createPrograms = () => {
    const create = (vs, fs, location = null, stride = null) => {
        return new ShaderProgram(_gl, vs, fs, location, stride);
    };
    _pointSpriteProgram     = create(_vertSources[0], _fragSources[0]);
};
