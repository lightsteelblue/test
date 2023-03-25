#version 300 es

precision highp float;

uniform sampler2D tex;
uniform sampler2D gridTex;
uniform sampler2D divTex;
uniform sampler2D isWallTex;
uniform vec2 canvasSize;
out vec4 o;

void main() {
    vec4 a = texture(tex, gl_FragCoord.xy / canvasSize);
    vec4 g = texture(gridTex, gl_FragCoord.xy / canvasSize);
    vec4 d = texture(divTex, gl_FragCoord.xy / canvasSize);
    float w = texture(isWallTex, gl_FragCoord.xy / canvasSize).x;
    o = vec4(pow(a.x / 5.,1.), abs(a.y*2.), a.z, 1);
    if (a.w == 0.) o = vec4(0.3, 0.5, 1, 1);
    if (a.w == 1.) o = vec4(0, 0, 0, 1);
    if (a.w == 2.) o = vec4(0.2, 0.9, 0.2, 1);
    if (a.w == 3.) o = vec4(0.5, 0.2, 0.2, 1);

    o = vec4(g.w==2.?0.8:0., g.w==2.?0.8:0., g.w == 1. ? 0.5 : 0., 1);
    o = vec4(a.x/40., g.w == 4. ? 0.8: 0., g.w == 2. || g.w == 5. ? 0.8 : 0., 1);
    //if (g.w == 0.) o.yz = vec2(1);
    //o = vec4(a.x/50.,g.w == 2.? 1:0,0, 1);
    //o = vec4(a.x*4.,0,0, 1);
    //o = vec4(g.w != 1. ? g.y*100. : 0., 0, g.w / 5., 1);
    //o = vec4(abs(d.y), floor(g.w*0.1) == 1. ? 1:0, floor(g.w*0.1) == 3. ? 1 : 0, 1);
    o = vec4(-(g.xyz)*2., 1);
    // = vec4(a.x/7., (floor(g.w * 0.1)-1.) / 5., 0, 1);
    //o = vec4(floor(g.w * 0.1) == 1. || floor(g.w * 0.1) == 5.? 0.5*(g.y + 1.):0., 0, 0, 1);
    //o = vec4(fract(g.w*0.1)*10., 0,0,1);
    //o = vec4(-d.y*5., (floor(g.w * 0.1)-1.)/5., 0, 1);
}