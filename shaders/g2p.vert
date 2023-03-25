#version 300 es

layout(location = 0) in vec4 pos;
layout(location = 1) in vec4 velC3;
layout(location = 2) in vec4 C1;
layout(location = 3) in vec4 C2;

uniform sampler2D u_gridTex;
uniform vec3 u_gridRes;
uniform vec4 u_tileRes;
uniform float u_dt;

out vec4 o_pos;
out vec4 o_velC3;
out vec4 o_C1;
out vec4 o_C2;

void main() {
    vec3 cpos = floor(pos.xyz - 0.5);
    vec3 r = pos.xyz - cpos - 0.5;

    float ty = floor(cpos.y * u_tileRes.z);
    float tx = cpos.y - ty * u_tileRes.x;
    vec2 offset = vec2(tx, ty) * u_gridRes.xz;
    vec3 cVel = texelFetch(u_gridTex, ivec2(cpos.xz + offset), 0).xyz;

    vec3[2] N = vec3[](1. - r, r);

    vec3 vel = vec3(0);
    mat3 B = mat3(0);
    for (int cz = 0; cz <= 1; cz++)
        for (int cy = 0; cy <= 1; cy++)
            for (int cx = 0; cx <= 1; cx++) {
                ty = floor((cpos.y + float(cy)) * u_tileRes.z);
                tx = cpos.y + float(cy) - ty * u_tileRes.x;
                offset = vec2(tx, ty) * u_gridRes.xz;

                vec4 gvel = texelFetch(u_gridTex, ivec2(cpos.xz + offset) + ivec2(cx, cz), 0);

                if (floor(gvel.w*0.1) == 6. || floor(gvel.w*0.1) == 2.) gvel.xyz = vec3(0);

                vel += gvel.xyz * N[cx].x * N[cy].y * N[cz].z;
                vec3 gradw = vec3(N[cy].y * N[cz].z * (cx == 0 ? -1. : 1.)
                    , N[cx].x * N[cz].z * (cy == 0 ? -1. : 1.)
                    , N[cx].x * N[cy].y * (cz == 0 ? -1. : 1.));
                B += mat3(gvel.xyz * gradw.x, gvel.xyz * gradw.y, gvel.xyz * gradw.z);
            }
    B *= 0.8;

#if 0
    cpos = floor(pos.xyz);
    r = pos.xyz - cpos - 0.5;
    vec3[3] weights = vec3[](
        0.5 * (0.5 - r) * (0.5 - r)
        , 0.75 - r * r
        , 0.5 * (0.5 + r) * (0.5 + r));

    ty = floor(cpos.y * u_tileRes.z);
    tx = cpos.y - ty * u_tileRes.x;
    offset = vec2(tx, ty) * u_gridRes.xz;
    cVel = texelFetch(u_gridTex, ivec2(cpos.xz + offset), 0).xyz;
    B = mat3(0);
    for (float cz = -1.; cz <= 1.; cz += 1.)
        for (float cy = -1.; cy <= 1.; cy += 1.)
            for (float cx = -1.; cx <= 1.; cx += 1.) {
                float w = weights[int(cx + 1.)].x * weights[int(cy + 1.)].y * weights[int(cz + 1.)].z;

                ty = floor((cpos.y + cy) * u_tileRes.z);
                tx = cpos.y + cy - ty * u_tileRes.x;
                offset = vec2(tx, ty) * u_gridRes.xz;

                vec4 grid = texelFetch(u_gridTex, ivec2(cpos.xz + offset + vec2(cx, cz)), 0);

                if (floor(grid.w*0.1) == 6. || floor(grid.w*0.1) == 2. || floor(grid.w*0.1) == 4.) grid.xyz = cVel;

                grid *= w;
                vec3 r_ = -r + vec3(cx, cy, cz);  
                B += mat3(grid.xyz * r_.x, grid.xyz * r_.y, grid.xyz * r_.z);
            }

    B *= 4.;
#endif
    vec3 pos_ = pos.xyz + u_dt * vel;

    pos_ = clamp(pos_, vec3(1.001), u_gridRes - 1.001);

    o_pos = vec4(pos_, 0);
    o_velC3 = vec4(vel, B[2][2]);
    o_C1 = vec4(B[0], B[1][0]);
    o_C2 = vec4(B[1].yz, B[2].xy);
}
