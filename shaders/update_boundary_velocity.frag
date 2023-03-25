#version 300 es

precision highp float;

uniform sampler2D u_gridTex;
uniform sampler2D u_isWallTex;
uniform vec3 u_gridRes;
uniform vec4 u_tileRes;
uniform vec2 u_rcpTexRes;

out vec4 o;

float type(float x) { return floor(x * 0.1); }

void main() {
    vec4 c = texture(u_gridTex, gl_FragCoord.xy * u_rcpTexRes);

    o = c;

    if (type(c.w) == 1. || type(c.w) == 2. || type(c.w) == 5.) return;

    o.xyz = vec3(0);

    vec4 e = texture(u_gridTex, (gl_FragCoord.xy + vec2(1, 0)) * u_rcpTexRes);
    vec4 w = texture(u_gridTex, (gl_FragCoord.xy + vec2(-1, 0)) * u_rcpTexRes);
    vec4 n = texture(u_gridTex, (gl_FragCoord.xy + vec2(0, 1)) * u_rcpTexRes);
    vec4 s = texture(u_gridTex, (gl_FragCoord.xy + vec2(0, -1)) * u_rcpTexRes);

    vec2 tc;
    if (gl_FragCoord.x < u_gridRes.x * (u_tileRes.x - 1.))
        tc = gl_FragCoord.xy + vec2(u_gridRes.x, 0);
    else
        tc = gl_FragCoord.xy - vec2(u_gridRes.x * (u_tileRes.x - 1.), -u_gridRes.z);
    vec4 u = texture(u_gridTex, tc * u_rcpTexRes);

    if (gl_FragCoord.x > u_gridRes.x)
        tc = gl_FragCoord.xy - vec2(u_gridRes.x, 0);
    else
        tc = gl_FragCoord.xy + vec2(u_gridRes.x * (u_tileRes.x - 1.), -u_gridRes.z);
    vec4 d = texture(u_gridTex, tc * u_rcpTexRes);

    if (type(c.w) == 3.) {
        float D = 0.;
        if (type(e.w) == 1. || type(e.w) == 5.) { o.xyz += e.xyz; D += 1.; }
        if (type(w.w) == 1. || type(w.w) == 5.) { o.xyz += w.xyz; D += 1.; }
        if (type(n.w) == 1. || type(n.w) == 5.) { o.xyz += n.xyz; D += 1.; }
        if (type(s.w) == 1. || type(s.w) == 5.) { o.xyz += s.xyz; D += 1.; }
        if (type(u.w) == 1. || type(u.w) == 5.) { o.xyz += u.xyz; D += 1.; }
        if (type(d.w) == 1. || type(d.w) == 5.) { o.xyz += d.xyz; D += 1.; }

        if (D > 0.)
            o.xyz /= D;
        else
            o.w = 60.;
    }

    if (type(c.w) == 4.) {
        float D = 0.;
        if (texture(u_isWallTex, gl_FragCoord.xy * u_rcpTexRes).x == 1.) {
            if (type(e.w) == 1. || type(e.w) == 5.) { o.xyz = vec3(0, e.y, e.z); D += 1.; }
            if (type(w.w) == 1. || type(w.w) == 5.) { o.xyz = vec3(0, w.y, w.z); D += 1.; }
            if (type(n.w) == 1. || type(n.w) == 5.) { o.xyz = vec3(n.x, n.y, 0); D += 1.; }
            if (type(s.w) == 1. || type(s.w) == 5.) { o.xyz = vec3(s.x, s.y, 0); D += 1.; }
            if (type(u.w) == 1. || type(u.w) == 5.) { o.xyz = vec3(u.x, 0, u.z); D += 1.; }
            if (type(d.w) == 1. || type(d.w) == 5.) { o.xyz = vec3(d.x, 0, d.z); D += 1.; }
        }

        if (D > 0.)
            o.xyz /= D;
        else
            o.w = 60.;
    }
}
