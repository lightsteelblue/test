#version 300 es

precision highp float;

uniform sampler2D pressureTex; // .x:P, .y:b
uniform sampler2D divTex;
uniform vec3 u_gridRes;
uniform vec4 u_tileRes;
uniform vec2 u_rcpTexRes;

out vec4 o;

float type(float x) { return floor(x * 0.1); }

void main() {
    vec4 c = texture(divTex, gl_FragCoord.xy * u_rcpTexRes);

    if (type(c.w) != 1. && type(c.w) != 5.) {
        o = vec4(0);
        return;
    }

    float p = texture(pressureTex, gl_FragCoord.xy * u_rcpTexRes).x;
    float e = texture(pressureTex, (gl_FragCoord.xy + vec2(1, 0)) * u_rcpTexRes).x;
    float w = texture(pressureTex, (gl_FragCoord.xy + vec2(-1, 0)) * u_rcpTexRes).x;
    float n = texture(pressureTex, (gl_FragCoord.xy + vec2(0, 1)) * u_rcpTexRes).x;
    float s = texture(pressureTex, (gl_FragCoord.xy + vec2(0, -1)) * u_rcpTexRes).x;

    vec2 tc;
    if (gl_FragCoord.x < u_gridRes.x * (u_tileRes.x - 1.))
        tc = gl_FragCoord.xy + vec2(u_gridRes.x, 0);
    else
        tc = gl_FragCoord.xy - vec2(u_gridRes.x * (u_tileRes.x - 1.), -u_gridRes.z);
    float u = texture(pressureTex, tc * u_rcpTexRes).x;

    if (gl_FragCoord.x > u_gridRes.x)
        tc = gl_FragCoord.xy - vec2(u_gridRes.x, 0);
    else
        tc = gl_FragCoord.xy + vec2(u_gridRes.x * (u_tileRes.x - 1.), -u_gridRes.z);
    float d = texture(pressureTex, tc * u_rcpTexRes).x;

    vec3 D = vec3(0.5);

    if ((int(c.x / 64.) & 1) == 1) { e = p; D.x = 1.; }
    if ((int(c.x / 128.) & 1) == 1) { w = p; D.x = 1.; }
    if ((int(c.x / 256.) & 1) == 1) { n = p; D.z = 1.; }
    if ((int(c.x / 512.) & 1) == 1) { s = p; D.z = 1.; }
    if ((int(c.x / 1024.) & 1) == 1) { u = p; D.y = 1.; }
    if ((int(c.x / 2048.) & 1) == 1) { d = p; D.y = 1.; }

    vec3 vel = -vec3(D.x * (e - w), D.y * (u - d), D.z * (n - s));

    o = vec4(vel, 0);
}