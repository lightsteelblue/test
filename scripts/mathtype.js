//-------------------------------------------------------------------------------
// Vec2
//-------------------------------------------------------------------------------
export class Vec2 {
    constructor(x = null, y = null) {
        if (Number.isFinite(x) && Number.isFinite(y)) {
            this.x = x;
            this.y = y;
        } else if (Number.isFinite(x)) {
            this.x = x;
            this.y = x;
        } else if (x instanceof Vec2) {
            this.x = x.x;
            this.y = x.y;
        } else {
            this.x = 0;
            this.y = 0;
        }
    }

    static zero() {
        return new Vec2(0);
    }

    static add(a, b) {
        if (Number.isFinite(a) && b instanceof Vec2)
            return new Vec2(a + b.x, a + b.y);
        else if (a instanceof Vec2 && Number.isFinite(b))
            return new Vec2(a.x + b, a.y + b);
        else if (a instanceof Vec2 && b instanceof Vec2)
            return new Vec2(a.x + b.x, a.y + b.y);
    }

    sub(a) {
        if (Number.isFinite(a))
            return new Vec2(this.x - a, this.y - a);
        else if (a instanceof Vec2)
            return new Vec2(this.x - a.x, this.y - a.y);
    }

    static minus(a) {
        return new Vec2(-a.x, -a.y);
    }

    mul(a) {
        if (Number.isFinite(a))
            return new Vec2(this.x * a, this.y * a);
        else if (a instanceof Vec2)
            return new Vec2(this.x * a.x, this.y * a.y);
    }

    div(a) {
        if (Number.isFinite(a))
            return this.mul(1/a);
        else if (a instanceof Vec2)
            return this.mul(Vec2.reciprocal(a));
    }

    static reciprocal(a) {
        return new Vec2(1/a.x, 1/a.y);
    }

    static dot(a, b) {
        return a.x*b.x + a.y*b.y;
    }

    static normalize(a) {
        return Vec2.div(a, Vec2.length(a));
    }

    length() {
        return Math.sqrt(Vec2.dot(this, this));
    }
}

//-------------------------------------------------------------------------------
// Vec3
//-------------------------------------------------------------------------------
export class Vec3 {
    constructor(x = null, y = null, z = null) {
        if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
            this.x = x;
            this.y = y;
            this.z = z;
        } else if (Number.isFinite(x)) {
            this.x = x;
            this.y = x;
            this.z = x;
        } else if (x instanceof Vec3) {
            this.x = x.x;
            this.y = x.y;
            this.z = x.z;
        } else {
            this.x = 0;
            this.y = 0;
            this.z = 0;
        }
    }

    static zero() {
        return new Vec3(0);
    }

    add(a) {
        if (Number.isFinite(a))
            return new Vec3(this.x + a, this.y + a, this.z + a);
        else if (a instanceof Vec3)
            return new Vec3(this.x + a.x, this.y + a.y, this.z + a.z);
    }

    sub(a) {
        return this.add(a.minus());
    }

    minus() {
        return new Vec3(-this.x, -this.y, -this.z);
    }

    mul(a) {
        if (a instanceof Vec3)
            return new Vec3(this.x * a.x, this.y * a.y, this.z * a.z);
        else if (Number.isFinite(a))
            return new Vec3(this.x * a, this.y * a, this.z * a);
    }

    div(a) {
        if (Number.isFinite(a))
            return this.mul(1/a);
        else if (b instanceof Vec3)
            return this.mul(Vec3.reciprocal(a));
    }

    static reciprocal(a) {
        return new Vec3(1/a.x, 1/a.y, 1/a.z);
    }

    dot(a) {
        return this.x * a.x + this.y * a.y + this.z * a.z;
    }

    cross(a) {
        return new Vec3(this.y * a.z - this.z * a.y
            , -this.x * a.z + this.z * a.x
            , this.x * a.y - this.y * a.x);
    }

    normalized() {
        let l = this.length();
        return l < 1e-7 ? Vec3.zero() : this.div(l);
    }

    length() {
        return Math.sqrt(this.dot(this));
    }
}

//-------------------------------------------------------------------------------
// Quaternion
//-------------------------------------------------------------------------------
export class Quat {
    constructor(x = null, y = null, z = null, w = null) {
        if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z) && Number.isFinite(w)) {
            this.x = x;
            this.y = y;
            this.z = z;
            this.w = w;
        } else if (x instanceof Vec3 && y === null) {
            this.x = x.x;
            this.y = x.y;
            this.z = x.z;
            this.w = 0;
        } else if (x instanceof Vec3 && Number.isFinite(y)) {
            this.x = x.x;
            this.y = x.y;
            this.z = x.z;
            this.w = y;
        } else {
            this.x = 0;
            this.y = 0;
            this.z = 0;
            this.w = 0;
        }
    }

    mul(q) {
        return new Quat(
            this.x * q.w - this.y * q.z + this.z * q.y + this.w * q.x,
            this.x * q.z + this.y * q.w - this.z * q.x + this.w * q.y,
            -this.x * q.y + this.y * q.x + this.z * q.w + this.w * q.z,
            -this.x * q.x - this.y * q.y - this.z * q.z + this.w * q.w
        );
    }

    conjugate() {
        return new Quat(-this.x, -this.y, -this.z, this.w);
    }

    normalized() {
        let l = Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z + this.w*this.w);
        return new Quat(this.x/l, this.y/l, this.z/l, this.w/l);
    }

    vector() {
        return new Vec3(this.x, this.y, this.z);
    }

    static axisAngle(axis, degree) {
        let rad2 = degree * Math.PI / 180 / 2;
        return new Quat(axis.mul(Math.sin(rad2)), Math.cos(rad2));
    }

    static rotate(x, q) {
        let p = q.mul(new Quat(x)).mul(q.conjugate());
        return new Vec3(p.x, p.y, p.z);
    }
}

//-------------------------------------------------------------------------------
// Mat4
// WebGLに合わせて列優先
//-------------------------------------------------------------------------------
export class Mat4 {
    constructor(a = null) {
        this._m = new Float32Array(16);
        if (Array.isArray(a) && a.length === 16)
            this._m.forEach((_, i) => { this._m[i] = a[i]; });
    }

    get val() {
        return this._m;
    }

    static identity() {
        let ret = new Mat4();
        ret._m.forEach((_, i) => { ret._m[i] = i % 5 === 0 ? 1 : 0; });
        return ret;
    }

    mulMat4(a) {
        if (!(a instanceof Mat4)) throw Error("");

        let ret = new Mat4();
        ret._m.fill(0);

        for (let r = 0; r < 4; r++)
            for (let c = 0; c < 4; c++)
                for (let k = 0; k < 4; k++)
                    ret._m[r + 4*c] += this._m[r + 4*k] * a._m[k + 4*c];
        return ret; 
    }

    mulVec4(a) {
        let b = new Float32Array([a.x, a.y, a.z, a.w]);
        let ret = new Float32Array([0, 0, 0, 0]);

        for (let r = 0; r < 4; r++)
            for (let c = 0; c < 4; c++)
                    ret[r] += this._m[r + 4*c] * b[c];
        return { x: ret[0], y: ret[1], z: ret[2], w: ret[3]};
    }

    scale(v) {
        let ret = new Mat4();
        ret._m = Float32Array.from(this._m);
        for (let i = 0; i < 4; i++) ret._m[i] *= v.x;
        for (let i = 5; i < 8; i++) ret._m[i] *= v.y;
        for (let i = 9; i < 12; i++) ret._m[i] *= v.z;
        return ret;
    }

    translate(v) {
        let ret = new Mat4();
        ret._m = Float32Array.from(this._m);
        ret._m[12] += Vec3.dot(new Vec3(ret._m[0], ret._m[4], ret._m[8]), v);
        ret._m[13] += Vec3.dot(new Vec3(ret._m[1], ret._m[5], ret._m[9]), v);
        ret._m[14] += Vec3.dot(new Vec3(ret._m[2], ret._m[6], ret._m[10]), v);
        ret._m[15] += Vec3.dot(new Vec3(ret._m[3], ret._m[7], ret._m[11]), v);
        return ret;
    }

    static lookAt(eye, center, up) {
        let f = center.sub(eye).normalized();
        let s = f.cross(up).normalized();
        let u = s.cross(f);

        let ret = Mat4.identity();
        ret.val[0] = s.x; ret.val[1] = u.x; ret.val[2] = -f.x;
        ret.val[4] = s.y; ret.val[5] = u.y; ret.val[6] = -f.y;
        ret.val[8] = s.z; ret.val[9] = u.z; ret.val[10] = -f.z;
        ret.val[12] = -s.dot(eye);
        ret.val[13] = -u.dot(eye);
        ret.val[14] = f.dot(eye);
        return ret;
    }

    static perspective(fovy, aspect, near, far) {
        let f = 1 / Math.tan(fovy * Math.PI / 360 / 2);
        let ret = new Mat4();
        ret._m.fill(0);

        ret.val[0] = f / aspect;
        ret.val[5] = f;
        ret.val[10] = -(far + near) / (far - near);
        ret.val[11] = -1;
        ret.val[14] = -(far * near * 2) / (far - near);
        return ret;
    }

    inv() {
        let a = this._m[0],  b = this._m[1],  c = this._m[2],  d = this._m[3],
            e = this._m[4],  f = this._m[5],  g = this._m[6],  h = this._m[7],
            i = this._m[8],  j = this._m[9],  k = this._m[10], l = this._m[11],
            m = this._m[12], n = this._m[13], o = this._m[14], p = this._m[15],
            q = a * f - b * e, r = a * g - c * e,
            s = a * h - d * e, t = b * g - c * f,
            u = b * h - d * f, v = c * h - d * g,
            w = i * n - j * m, x = i * o - k * m,
            y = i * p - l * m, z = j * o - k * n,
            A = j * p - l * n, B = k * p - l * o,
            ivd = 1 / (q * B - r * A + s * z + t * y - u * x + v * w);

        let ret = new Mat4();
        ret._m[0]  = ( f * B - g * A + h * z) * ivd;
        ret._m[1]  = (-b * B + c * A - d * z) * ivd;
        ret._m[2]  = ( n * v - o * u + p * t) * ivd;
        ret._m[3]  = (-j * v + k * u - l * t) * ivd;
        ret._m[4]  = (-e * B + g * y - h * x) * ivd;
        ret._m[5]  = ( a * B - c * y + d * x) * ivd;
        ret._m[6]  = (-m * v + o * s - p * r) * ivd;
        ret._m[7]  = ( i * v - k * s + l * r) * ivd;
        ret._m[8]  = ( e * A - f * y + h * w) * ivd;
        ret._m[9]  = (-a * A + b * y - d * w) * ivd;
        ret._m[10] = ( m * u - n * s + p * q) * ivd;
        ret._m[11] = (-i * u + j * s - l * q) * ivd;
        ret._m[12] = (-e * z + f * x - g * w) * ivd;
        ret._m[13] = ( a * z - b * x + c * w) * ivd;
        ret._m[14] = (-m * t + n * r - o * q) * ivd;
        ret._m[15] = ( i * t - j * r + k * q) * ivd;
        return ret;
    }
}