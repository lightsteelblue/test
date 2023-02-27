#version 300 es

precision highp float;

uniform sampler2D u_gridTex;
uniform vec2 u_gridRes;
uniform vec2 u_gravity;
uniform float u_dt;

out vec4 o;

void main() {
    vec4 velMass = texture(u_gridTex, gl_FragCoord.xy / u_gridRes);
    if (velMass.z == 0.) {
        //o = vec4(u_dt * u_gravity, 0, 0);
        o = vec4(0);
        return;
    }

    velMass.xy /= velMass.z;
    velMass.xy -= u_dt * u_gravity;

    vec2 cpos = floor(gl_FragCoord.xy);
    if (cpos.x < 2.)
        velMass = vec4(0, 0.9*velMass.y, velMass.z, 1);
    if (cpos.x >= u_gridRes.x - 2.)
        velMass = vec4(0, 0.9*velMass.y, velMass.z, 1);
    if (cpos.y < 2.)
        velMass = vec4(0.9*velMass.x, 0, velMass.z, 1);
    if (cpos.y > u_gridRes.y - 2.)
        velMass = vec4(0.9*velMass.x, 0, velMass.z, 1);

    o = velMass;
}