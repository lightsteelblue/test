#version 300 es

precision highp float;

in vec4 v_pos;
in vec4 v_velC3;
in vec4 v_C1;
in vec4 v_C2;

uniform float mass0;

out vec4 o_gVelMass;

void main() {
    vec3 loc;
    loc.xz = round(gl_PointCoord);
    loc.y = v_pos.w;
    loc.z = 1. - loc.z;

    vec3 r = fract(v_pos.xyz - 0.5);

    vec3[2] N = vec3[](1. - r, r);

    float w = N[int(loc.x)].x * N[int(loc.y)].y * N[int(loc.z)].z;

    r = loc - r;

    mat3 C = mat3(v_C1.xyz, vec3(v_C1.w, v_C2.x, v_C2.y), vec3(v_C2.zw, v_velC3.w));
    vec3 Q = C * r;

    bool isNearest = round(fract(v_pos.xyz - 0.5)) == loc;
    o_gVelMass.w = mass0 * w + (isNearest ? 10. : 0.);
    o_gVelMass.xyz = mass0 * w * (v_velC3.xyz + Q);
}

