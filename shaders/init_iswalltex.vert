#version 300 es

uniform vec3 u_gridRes;
uniform vec4 u_tileRes;

out float v_isWall;

void main() {
    float z = floor(float(gl_VertexID) / (u_gridRes.x * u_gridRes.y));
    float y = floor((float(gl_VertexID) - z * u_gridRes.x * u_gridRes.y) / u_gridRes.x);
    float x = float(gl_VertexID) - u_gridRes.x * (z * u_gridRes.y + y);

    if (x == 0. || x == u_gridRes.x - 1. || y == 0. || y == u_gridRes.y - 1. || z == 0. || z == u_gridRes.z - 1.)
        v_isWall = 1.;
    else
        v_isWall = 0.;

    float ty = floor(y * u_tileRes.z);
    float tx = y - ty * u_tileRes.x;
    vec2 g = (vec2(x, z) + 0.5) / u_gridRes.xz + vec2(tx, ty);
    vec2 texcoord = 2. * g * u_tileRes.zw - 1.;

    gl_Position = vec4(texcoord, 0, 1);
    gl_PointSize = 1.0;
}