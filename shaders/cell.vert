#version 300 es

void main() {
    const int res = 8;
    vec2 pos = vec2(gl_VertexID % res, gl_VertexID / res) / float(res);
    gl_Position = vec4(2. * (pos+1./float(res)/2.) - 1., 0., 1.);
    gl_PointSize = 1.;
}