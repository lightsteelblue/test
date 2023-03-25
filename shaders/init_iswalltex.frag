#version 300 es

precision mediump float;

in float v_isWall;
out float o;

void main() {
    o = v_isWall;
}