#version 300 es

uniform vec4 moveScale;

void main() {
    vec2 pos;
    if (gl_InstanceID < 32) {
        pos = vec2(gl_InstanceID, (gl_VertexID & 1) * 31);
    } else {
        pos = vec2((gl_VertexID & 1) * 31, gl_InstanceID - 32);
    }
    gl_Position = vec4(moveScale.zw * (pos+0.5) + moveScale.xy, 0, 1);
}