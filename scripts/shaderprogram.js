import { createProgram, createProgramTF, getUniformLocations } from './glutils.js';

export class ShaderProgram {
    #gl;
    #program;
    #uniforms;
    constructor(gl, vsSource, fsSource, location, stride) {
        this.#gl       = gl;
        this.#program  = createProgram(this.#gl, vsSource, fsSource);
        this.#uniforms = getUniformLocations(this.#gl, this.#program);
        this.location  = location;
        this.stride    = stride;
    }

    use() {
        this.#gl.useProgram(this.#program);
    }

    uniform(name) {
        if (name in this.#uniforms)
            return this.#uniforms[name];
        else // debug
            console.error(`Uniform '${name}' does not exist.`);
    }
}

export class ShaderProgramTF {
    #gl;
    #program;
    #uniforms;
    constructor(gl, vsSource, fsSource, varyingNames, location, stride) {
        this.#gl       = gl;
        this.#program  = createProgramTF(this.#gl, vsSource, fsSource, varyingNames);
        this.#uniforms = getUniformLocations(this.#gl, this.#program);
        this.location  = location;
        this.stride    = stride;
    }

    use() {
        this.#gl.useProgram(this.#program);
    }

    uniform(name) {
        if (name in this.#uniforms)
            return this.#uniforms[name];
        else // debug
            console.error(`Uniform '${name}' does not exist.`);
    }
}