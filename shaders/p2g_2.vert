#version 300 es

layout(location = 0) in vec4 pPosVel;
layout(location = 1) in vec4 pC;

uniform sampler2D u_gridTex;
uniform vec2 u_gridRes;
uniform float u_P0;
uniform float u_dt;

out vec4 v_pPosVel;
out mat2 v_pC;
out float v_pMomentum;

void main() {
    v_pPosVel = pPosVel;
    v_pC = mat2(pC); // (xy,zw)=(c0,c1)

    vec2 cpos = floor(pPosVel.xy);
    vec2 r = pPosVel.xy - cpos - 0.5;

    vec2[3] weights = vec2[](
        0.5 * (0.5 - r) * (0.5 - r)
        , 0.75 - r * r
        , 0.5 * (0.5 + r) * (0.5 + r));

    float rho = 0.;
    for (int cy = 0; cy < 3; ++cy)
        for (int cx = 0; cx < 3; ++cx) {
            float w = weights[cx].x * weights[cy].y;
            vec4 grid = texelFetch(u_gridTex, ivec2(cpos) + ivec2(cx, cy) - 1, 0);
            rho += grid.z * w;
        }

    float vol =1./rho;

    float pressure = max(0., u_P0 * (pow(rho*0.25, 4.) - 1.));
    v_pMomentum = 4. * vol * pressure * u_dt;

    gl_Position = vec4(2. * ((floor(pPosVel.xy) + 0.5) / u_gridRes) - 1., 0., 1.);
    gl_PointSize = 3.0;
}
