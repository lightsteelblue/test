#version 300 es

precision highp float;

uniform sampler2D tex;
uniform vec2 u_gridRes;
uniform float u_dt;

out vec4 o;

void main() {
    vec2 e = texture(tex, (gl_FragCoord.xy + vec2(1, 0)) / u_gridRes).xz;
    vec2 w = texture(tex, (gl_FragCoord.xy + vec2(-1, 0)) / u_gridRes).xz;
    vec2 n = texture(tex, (gl_FragCoord.xy + vec2(0, 1)) / u_gridRes).yz;
    vec2 s = texture(tex, (gl_FragCoord.xy + vec2(0, -1)) / u_gridRes).yz;
    vec2 c = texture(tex, gl_FragCoord.xy / u_gridRes).zw;

    float div = -0.5 * (e.x - w.x + n.x - s.x) / u_dt;

    float a = 0.25*0.25*abs(c.x - 4.)*0.25*(c.x - 4.)/(u_dt*u_dt);

    //div += a;
    if (a > 0.) div += a;
    else if (a < 0. && div > 0.)div = max(div+a, 0.);

    //if (e.y * w.y * n.y *s.y == 0.) div = 0.;
    if (c.y <= 1.) div = 0.;

    o = vec4(0,div,c.x,c.y);
}