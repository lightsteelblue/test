#version 300 es

precision highp float;

uniform sampler2D divTex;
uniform sampler2D pressureTex;
uniform vec3 u_gridRes;
uniform vec4 u_tileRes;
uniform vec2 u_rcpTexRes;
uniform float omega;
uniform int red_black;

out vec4 o;

float type(float x) { return floor(x * 0.1); }

void main() {
    vec4 c = texture(divTex, gl_FragCoord.xy * u_rcpTexRes);

    o.x = 0.;

    if (type(c.w) == 2. || type(c.w) == 3. || type(c.w) == 4.) return;

    float old = texture(pressureTex, gl_FragCoord.xy * u_rcpTexRes).x;
    o.x = old;

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

    float p = c.y;
    float D = 0.;

    if ((int(c.x) & 1) == 1) { p += e; D += 1.; }
    if ((int(c.x / 2.) & 1) == 1) { p += w; D += 1.; }
    if ((int(c.x / 4.) & 1) == 1) { p += n; D += 1.; }
    if ((int(c.x / 8.) & 1) == 1) { p += s; D += 1.; }
    if ((int(c.x / 16.) & 1) == 1) { p += u; D += 1.; }
    if ((int(c.x / 32.) & 1) == 1) { p += d; D += 1.; }

    p = (1. - omega) * old + omega / max(D, 1.) * p;

    vec2 tile = floor(gl_FragCoord.xy / u_gridRes.xz);
    float y = tile.y * u_tileRes.x + tile.x;
    float x = floor(gl_FragCoord.x) - tile.x * u_gridRes.x;
    float z = floor(gl_FragCoord.y) - tile.y * u_gridRes.z;
    if (red_black == -1)
        o.x = p;
    else if ((int(x + y + z) & 1) == red_black)
        o.x = p;
}
