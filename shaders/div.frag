#version 300 es

precision highp float;

uniform sampler2D tex;
uniform vec3 u_gridRes;
uniform vec4 u_tileRes;
uniform vec2 u_rcpTexRes;

out vec4 o;

float type(float x) { return floor(x * 0.1); }

void main() {
    vec4 c = texture(tex, gl_FragCoord.xy * u_rcpTexRes);

    float ctype = type(c.w);
    if (ctype != 1. && ctype != 5.) {
        o = vec4(0, 0, 0, c.w);
        return;
    }

    vec2 e = texture(tex, (gl_FragCoord.xy + vec2(1, 0)) * u_rcpTexRes).xw;
    vec2 w = texture(tex, (gl_FragCoord.xy + vec2(-1, 0)) * u_rcpTexRes).xw;
    vec2 n = texture(tex, (gl_FragCoord.xy + vec2(0, 1)) * u_rcpTexRes).zw;
    vec2 s = texture(tex, (gl_FragCoord.xy + vec2(0, -1)) * u_rcpTexRes).zw;

    vec2 tc;
    if (gl_FragCoord.x < u_gridRes.x * (u_tileRes.x - 1.))
        tc = gl_FragCoord.xy + vec2(u_gridRes.x, 0);
    else
        tc = gl_FragCoord.xy - vec2(u_gridRes.x * (u_tileRes.x - 1.), -u_gridRes.z);
    vec2 u = texture(tex, tc * u_rcpTexRes).yw;

    if (gl_FragCoord.x > u_gridRes.x)
        tc = gl_FragCoord.xy - vec2(u_gridRes.x, 0);
    else
        tc = gl_FragCoord.xy + vec2(u_gridRes.x * (u_tileRes.x - 1.), -u_gridRes.z);
    vec2 d = texture(tex, tc * u_rcpTexRes).yw;

    vec3 D = vec3(-0.5);
    if (type(e.y) == 2. || type(e.y) == 3.) { e.x = c.x; D.x = -1.; }
    if (type(w.y) == 2. || type(w.y) == 3.) { w.x = c.x; D.x = -1.; }
    if (type(n.y) == 2. || type(n.y) == 3.) { n.x = c.z; D.z = -1.; }
    if (type(s.y) == 2. || type(s.y) == 3.) { s.x = c.z; D.z = -1.; }
    if (type(u.y) == 2. || type(u.y) == 3.) { u.x = c.y; D.y = -1.; }
    if (type(d.y) == 2. || type(d.y) == 3.) { d.x = c.y; D.y = -1.; }

    if (type(e.y) == 4.) { D.x = -1.; }
    if (type(w.y) == 4.) { D.x = -1.; }
    if (type(n.y) == 4.) { D.z = -1.; }
    if (type(s.y) == 4.) { D.z = -1.; }
    if (type(u.y) == 4.) { D.y = -1.; }
    if (type(d.y) == 4.) { D.y = -1.; }
    
    float div = dot(D, vec3(e.x - w.x, u.x - d.x, n.x - s.x));
    float mass = fract(c.w * 0.1) * 10.;
    if (ctype == 1.) div += clamp(mass - 1., 0., 0.5);
    if (ctype == 5.) div += min(mass - 0.5, 0.);

    float info = 0.;
    if (type(e.y) == 1. || type(e.y) == 3. || type(e.y) == 5.) info += 1.;
    if (type(w.y) == 1. || type(w.y) == 3. || type(w.y) == 5.) info += 2.;
    if (type(n.y) == 1. || type(n.y) == 3. || type(n.y) == 5.) info += 4.;
    if (type(s.y) == 1. || type(s.y) == 3. || type(s.y) == 5.) info += 8.;
    if (type(u.y) == 1. || type(u.y) == 3. || type(u.y) == 5.) info += 16.;
    if (type(d.y) == 1. || type(d.y) == 3. || type(d.y) == 5.) info += 32.;

    if (type(e.y) == 2. || type(e.y) == 3. || type(e.y) == 4.) info += 64.;
    if (type(w.y) == 2. || type(w.y) == 3. || type(w.y) == 4.) info += 128.;
    if (type(n.y) == 2. || type(n.y) == 3. || type(n.y) == 4.) info += 256.;
    if (type(s.y) == 2. || type(s.y) == 3. || type(s.y) == 4.) info += 512.;
    if (type(u.y) == 2. || type(u.y) == 3. || type(u.y) == 4.) info += 1024.;
    if (type(d.y) == 2. || type(d.y) == 3. || type(d.y) == 4.) info += 2048.;

    o = vec4(info, div, 0, c.w);
}
