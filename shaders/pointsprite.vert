#version 300 es

uniform mat4 view;
uniform mat4 projection;
uniform vec3 a;
uniform vec3 d;
uniform float particleRadius;

layout(location = 0) in vec4 pos;
layout(location = 1) in vec4 vel;

out vec4 vOut;

void main(void) {
    vec2[4] vertPos = vec2[](
        vec2(-1),
        vec2(1, -1),
        vec2(-1, 1),
        vec2(1)
    );

    vec4 _pos = view * vec4(pos.xyz, 1) + vec4(particleRadius * (vertPos[gl_VertexID & 3]), 0, 0);
    gl_Position = projection * _pos;

    vec3 q = pos.xyz - a;
    vec3 n = q - dot(q, d) * d;
    float r = length(n);

    vOut = vec4(vertPos[gl_VertexID & 3], r, length(vel.xyz) / 2.);
}
