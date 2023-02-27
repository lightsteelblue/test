import { loadTextFileAsync } from './load.js';
import { Vec2 } from './mathtype.js';
import * as GLU from './glutils.js';
import { ShaderProgram } from './shaderprogram.js';

let _gl;
let _canvas;

const _vertFilenames = [
    'pointsprite.vert',
    'show_grid.vert',
];
const _fragFilenames = [
    'pointsprite.frag'   ,
    'show_grid.frag',
];
let _vertSources;
let _fragSources;

let _pointSpriteProgram;
let _showGridProgram;

let _renderingArea = { min: Vec2.zero(), max: new Vec2(1) };

let _simToClip = { scale: new Vec2(1), move: Vec2.zero() };



export const loadShaderFilesAsync = async () => {
    let paths = [..._vertFilenames, ..._fragFilenames].map(n => './shaders/' + n);
    let sources = await loadTextFileAsync(...paths);
    _vertSources = sources.slice(0, _vertFilenames.length);
    _fragSources = sources.slice(_vertFilenames.length);
};

export const init = (gl, canvas) => {
    _gl         = gl;
    _canvas     = canvas;

    _createPrograms();
};

export const setRenderingSimulationArea = (min, max) => {
    _renderingArea = { min, max };
    _calcSimToClip();
};

export const clipPosToSimPos = (clipPos) => {
    return Vec2.div(Vec2.sub(clipPos, _simToClip.move), _simToClip.scale);
};

export const renderParticles = (particleCount=1, dp=1, posVBO, JVBO) => {
    _gl.bindFramebuffer(_gl.FRAMEBUFFER, null);
    _gl.viewport(0, 0, _canvas.width, _canvas.height);
    //_gl.clearColor(0.95, 0.95, 0.95, 1);
    //_gl.clear(_gl.COLOR_BUFFER_BIT);

    _showGridProgram.use();
    _gl.uniform4f(_showGridProgram.uniform('moveScale'), _simToClip.move.x, _simToClip.move.y, _simToClip.scale.x, _simToClip.scale.y);
    //_gl.drawArraysInstanced(_gl.LINES, 0, 2, 256*2);

    _pointSpriteProgram.use();
    GLU.setAttributes(_gl, [posVBO, JVBO], [0, 1], [4, 1]);
    _gl.vertexAttribDivisor(0, 1);
    _gl.uniform4f(_pointSpriteProgram.uniform('moveScale'), _simToClip.move.x, _simToClip.move.y, _simToClip.scale.x, _simToClip.scale.y);
    _gl.uniform1f(_pointSpriteProgram.uniform('particleRadius'), dp/2);
    _gl.drawArraysInstanced(_gl.TRIANGLE_STRIP, 0, 4, particleCount);
    _gl.vertexAttribDivisor(0, 0);
};

export const renderGrid = (gridTex) => {
    _gl.bindFramebuffer(_gl.FRAMEBUFFER, null);
    _gl.viewport(0, 0, _canvas.width, _canvas.height);
    _gl.clearColor(0.95, 0.95, 0.95, 1);
    _gl.clear(_gl.COLOR_BUFFER_BIT);

    _showGridProgram.use();
    _gl.uniform4f(_showGridProgram.uniform('moveScale'), _simToClip.move.x, _simToClip.move.y, _simToClip.scale.x, _simToClip.scale.y);
    _gl.drawArraysInstanced(_gl.LINES, 0, 2, 32*2);
};

const _createPrograms = () => {
    const create = (vs, fs, location = null, stride = null) => {
        return new ShaderProgram(_gl, vs, fs, location, stride);
    };
    _pointSpriteProgram     = create(_vertSources[0], _fragSources[0]);
    _showGridProgram = create(_vertSources[1], _fragSources[1]);
};

const _calcSimToClip = () => {
    let aspect = 1;//_canvas.width / _canvas.height;
    let tmp = aspect >= 1 ? new Vec2(1/aspect, 1) : new Vec2(1, aspect);
    _simToClip.scale = Vec2.mul(Vec2.div(tmp, Vec2.sub(_renderingArea.max, _renderingArea.min)), 2);
    _simToClip.move  = Vec2.minus(Vec2.add(Vec2.mul(_simToClip.scale, _renderingArea.min), tmp));
;}
