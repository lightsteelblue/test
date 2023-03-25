#version 300 es

layout(location = 0) in vec4 pos;
layout(location = 1) in vec4 velC3;
layout(location = 2) in vec4 C1;
layout(location = 3) in vec4 C2;

uniform vec3 u_gridRes;
uniform vec4 u_tileRes;

out vec4 v_pos;
out vec4 v_velC3;
out vec4 v_C1;
out vec4 v_C2;

void main() {
    v_pos = vec4(pos.xyz, gl_VertexID);
    v_velC3 = velC3;
    v_C1 = C1;
    v_C2 = C2;

    float y = floor(pos.y - 0.5) + float(gl_VertexID);
    float ty = floor(y * u_tileRes.z);
    float tx = y - ty * u_tileRes.x;
    vec2 g = (round(pos.xz)) / u_gridRes.xz + vec2(tx, ty);
    vec2 texcoord = 2. * g * u_tileRes.zw - 1.;

    gl_Position = vec4(texcoord, 0, 1);
    gl_PointSize = 2.0;
}
