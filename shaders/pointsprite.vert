#version 300 es

uniform vec4 moveScale;
uniform float particleRadius;

layout(location=0) in vec4 pos;
layout(location=1) in float J;

out vec4 vOut;

void main(void) {
    vec2[4] vertPos = vec2[](
        vec2(-1),
        vec2(1, -1),
        vec2(-1, 1),
        vec2(1)
    );

    vec2 _pos = pos.xy; 
    _pos += particleRadius * (vertPos[gl_VertexID & 3]);
    gl_Position = vec4(moveScale.zw * _pos + moveScale.xy, 0, 1);

    vOut = vec4(vertPos[gl_VertexID & 3], J, length(pos.zw) / 1.);
}
