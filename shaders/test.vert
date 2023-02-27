#version 300 es

layout(location = 0) in vec2 x;

out vec2 o;

void main() {
    o = x + vec2(0, 0.01);
}