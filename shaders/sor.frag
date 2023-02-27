#version 300 es

precision highp float;

uniform sampler2D tex; // .x:P, .y:b
uniform vec2 N;
uniform int red_black;

const float omega = 1.9;

out vec4 o;

void main() {
    vec4 c = texture(tex, gl_FragCoord.xy / N);
    float e = texture(tex, (gl_FragCoord.xy + vec2(1, 0)) / N).x;
    float w = texture(tex, (gl_FragCoord.xy + vec2(-1, 0)) / N).x;
    float n = texture(tex, (gl_FragCoord.xy + vec2(0, 1)) / N).x;
    float s = texture(tex, (gl_FragCoord.xy + vec2(0, -1)) / N).x;

    float p = (1. - omega) * c.x + omega * 0.25 * (c.y + e + w + n + s);
    
    if (c.z <= 1.) p = 0.;

    if (gl_FragCoord.x < 2.) p = e;
    if (gl_FragCoord.x > N.x - 2.) p = w;
    if (gl_FragCoord.y < 2.) p = n + 0.;
    if (gl_FragCoord.y > N.y - 2.) p = s;
  
    if (gl_FragCoord.x < 2. && gl_FragCoord.y < 2.) p = 0.5 * (e + n);
    if (gl_FragCoord.x < 2. && gl_FragCoord.y > N.y - 2.) p = 0.5 * (e + s);
    if (gl_FragCoord.x > N.x - 2. && gl_FragCoord.y < 2.) p = 0.5 * (w + n);
    if (gl_FragCoord.x > N.x - 2. && gl_FragCoord.y > N.y - 2.) p = 0.5 * (w + s);

    ivec2 q = ivec2(floor(gl_FragCoord.xy));
    if (((q.x + q.y) & 1) == red_black)
        o = vec4(c.xy, c.z, 1);
    else
        o = vec4(p, c.y, c.z, 1);
}