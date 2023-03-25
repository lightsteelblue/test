#version 300 es

precision highp float;

uniform sampler2D u_gridTex;
uniform sampler2D u_isWallTex;
uniform vec3 u_gridRes;
uniform vec4 u_tileRes;
uniform vec2 u_rcpTexRes;
uniform vec3 u_gravity;
uniform float u_dt;

const float threshold = 0.5;

out vec4 o;

float mass(float x) { return fract(x * 0.1) * 10.; }

void main() {
    if (texture(u_isWallTex, gl_FragCoord.xy * u_rcpTexRes).x == 1.) {
        o = vec4(0, 0, 0, 40);
        return;
    }

    vec2 tc = (gl_FragCoord.xy + vec2(1, 0)) * u_rcpTexRes;
    float e = texture(u_gridTex, tc).w + texture(u_isWallTex, tc).x;

    tc = (gl_FragCoord.xy + vec2(-1, 0)) * u_rcpTexRes;
    float w = texture(u_gridTex, tc).w + texture(u_isWallTex, tc).x;

    tc = (gl_FragCoord.xy + vec2(0, 1)) * u_rcpTexRes;
    float n = texture(u_gridTex, tc).w + texture(u_isWallTex, tc).x;

    tc = (gl_FragCoord.xy + vec2(0, -1)) * u_rcpTexRes;
    float s = texture(u_gridTex, tc).w + texture(u_isWallTex, tc).x;

    if (gl_FragCoord.x < u_gridRes.x * (u_tileRes.x - 1.))
        tc = gl_FragCoord.xy + vec2(u_gridRes.x, 0);
    else
        tc = gl_FragCoord.xy - vec2(u_gridRes.x * (u_tileRes.x - 1.), -u_gridRes.z);
    tc *= u_rcpTexRes;
    float u = texture(u_gridTex, tc).w + texture(u_isWallTex, tc).x;

    if (gl_FragCoord.x > u_gridRes.x)
        tc = gl_FragCoord.xy - vec2(u_gridRes.x, 0);
    else
        tc = gl_FragCoord.xy + vec2(u_gridRes.x * (u_tileRes.x - 1.), -u_gridRes.z);
    tc *= u_rcpTexRes;
    float d = texture(u_gridTex, tc).w + texture(u_isWallTex, tc).x;

    float freeSurface
        = floor(e*0.1)
        * floor(w*0.1)
        * floor(n*0.1)
        * floor(s*0.1)
        * floor(u*0.1)
        * floor(d*0.1);
    float freeSurface2
        = step(fract(e*0.1)*10., threshold)
        + step(fract(w*0.1)*10., threshold)
        + step(fract(n*0.1)*10., threshold)
        + step(fract(s*0.1)*10., threshold)
        + step(fract(u*0.1)*10., threshold)
        + step(fract(d*0.1)*10., threshold);

    vec4 velMass = texture(u_gridTex, gl_FragCoord.xy * u_rcpTexRes);
    float cmass = fract(velMass.w * 0.1) * 10.;
    float count = floor(velMass.w * 0.1);

    bool isEmpty = (cmass == 0.)
        && (floor(e*0.1) == 0.) && mass(e) < threshold
        && (floor(w*0.1) == 0.) && mass(w) < threshold
        && (floor(n*0.1) == 0.) && mass(n) < threshold
        && (floor(s*0.1) == 0.) && mass(s) < threshold
        && (floor(u*0.1) == 0.) && mass(u) < threshold
        && (floor(d*0.1) == 0.) && mass(d) < threshold;

    if (cmass > threshold || count > 0.) o.w = 10.; // fluid cell
    else if (isEmpty) o.w = 20.; // empty cell 
    else if (freeSurface == 0. && freeSurface2 > 0.) o.w = 30.; // surface cell
    else o.w = 50.;

    if (cmass > 0.)
        o.xyz = velMass.xyz / cmass;

    if (o.w == 10. || o.w == 30. || o.w == 50.) { 
        o.xyz -= u_dt * u_gravity;
    }

    o.w += cmass;
}