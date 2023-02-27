#version 300 es

precision highp float;

in vec4 v_pPosVel;
in mat2 v_pC;
in float v_pMomentum;

//uniform sampler2D u_gridTex_;
//uniform vec2 u_gridRes_;

out vec4 o_gVelMass;

float calcWeight() {
    vec2 gi = floor(v_pPosVel.xy);
    vec2 r = v_pPosVel.xy - gi - 0.5;

    vec2[3] weights = vec2[](0.5 * (0.5 - r) * (0.5 - r)
                , 0.75 - r * r
                , 0.5 * (0.5 + r) * (0.5 + r));

    vec2 dg = round(3. * (gl_PointCoord - 0.5)) * vec2(1, -1);
    return weights[int(dg.x + 1.)].x * weights[int(dg.y + 1.)].y;
}

void main() {
    float w = calcWeight();
    vec2 cpos = floor(v_pPosVel.xy) + round(3. * (gl_PointCoord - 0.5)) * vec2(1, -1);
    vec2 r = cpos - v_pPosVel.xy + 0.5;
    vec2 Q = v_pC * r;

    vec2 momentum = w * v_pMomentum * r;

    o_gVelMass.zw = vec2(w);
    o_gVelMass.xy = w * (v_pPosVel.zw + Q) + momentum;
}
