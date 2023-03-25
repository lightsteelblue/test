#version 300 es

precision highp float;

uniform sampler2D u_gridTex;
uniform vec3 u_gridRes;
uniform vec4 u_tileRes;
uniform vec2 u_rcpTexRes;
uniform vec3 a;
uniform vec3 d;
uniform vec3 vel;

out vec4 o;

float type(float x) { return floor(x * 0.1); }

void main() {
    vec4 c = texture(u_gridTex, gl_FragCoord.xy * u_rcpTexRes);

    o = c;

    float ctype = type(c.w);
    if (ctype != 1. && ctype != 3. && ctype != 5.) {
        return;
    }

    vec2 tile = floor(gl_FragCoord.xy / u_gridRes.xz);
    float y = tile.y * u_tileRes.x + tile.x;
    vec2 xz = floor(gl_FragCoord.xy) - tile * u_gridRes.xz;
    vec3 center = vec3(xz.x, y, xz.y) + 0.5;

    vec3 q = center - a;
    vec3 n = q - dot(q, d) * d;
    float r = length(n);

    o.xyz += vel * max(7. - r, 0.);
}