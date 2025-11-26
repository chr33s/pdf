const createInflatorTables = () => {
  const Uint16Ctor = Uint16Array;
  const Uint32Ctor = Uint32Array;

  const tables: InflatorTables = {
    m: new Uint16Ctor(16),
    v: new Uint16Ctor(16),
    d: [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15],
    o: [
      3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131,
      163, 195, 227, 258, 999, 999, 999,
    ],
    z: [
      0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, 0, 0,
      0,
    ],
    B: new Uint16Ctor(32),
    p: [
      1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537,
      2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577, 65535, 65535,
    ],
    w: [
      0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13,
      13, 0, 0,
    ],
    h: new Uint32Ctor(32),
    g: new Uint16Ctor(512),
    s: [],
    A: new Uint16Ctor(32),
    t: [],
    k: new Uint16Ctor(32768),
    c: [],
    a: [],
    n: new Uint16Ctor(32768),
    e: [],
    C: new Uint16Ctor(512),
    b: [],
    i: new Uint16Ctor(1 << 15),
    r: new Uint32Ctor(286),
    f: new Uint32Ctor(30),
    l: new Uint32Ctor(19),
    u: new Uint32Ctor(15e3),
    q: new Uint16Ctor(1 << 16),
    j: new Uint16Ctor(1 << 15),
  };

  const assignCanonicalCodes = (values: number[], maxBits: number) => {
    const len = values.length;
    const counts = tables.v;
    let acc = 0;

    for (let idx = 0; idx <= maxBits; idx++) counts[idx] = 0;
    for (let idx = 1; idx < len; idx += 2) counts[values[idx]]++;

    const starts = tables.m;
    counts[0] = 0;
    for (let bit = 1; bit <= maxBits; bit++) {
      acc = (acc + counts[bit - 1]) << 1;
      starts[bit] = acc;
    }

    for (let idx = 0; idx < len; idx += 2) {
      const bitLength = values[idx + 1];
      if (bitLength != 0) {
        values[idx] = starts[bitLength];
        starts[bitLength]++;
      }
    }
  };

  const buildLookupTable = (values: number[], bits: number, target: Uint16Array) => {
    const len = values.length;
    const bitReverse = tables.i;

    for (let idx = 0; idx < len; idx += 2) {
      const bitLength = values[idx + 1];
      if (bitLength != 0) {
        const symbol = idx >> 1;
        const packed = (symbol << 4) | bitLength;
        const remaining = bits - bitLength;
        const start = values[idx] << remaining;
        const end = start + (1 << remaining);

        for (let code = start; code < end; code++) {
          const mapped = bitReverse[code] >>> (15 - bits);
          target[mapped] = packed;
        }
      }
    }
  };

  const remapCodes = (values: number[], bits: number) => {
    const bitReverse = tables.i;
    const shift = 15 - bits;

    for (let idx = 0; idx < values.length; idx += 2) {
      const mapped = values[idx] << (bits - values[idx + 1]);
      values[idx] = bitReverse[mapped] >>> shift;
    }
  };

  const appendPairs = (target: number[], count: number, bitLength: number) => {
    for (let idx = 0; idx < count; idx++) {
      target.push(0, bitLength);
    }
  };

  const tableSize = 1 << 15;
  for (let idx = 0; idx < tableSize; idx++) {
    let value = idx;
    value = ((value & 2863311530) >>> 1) | ((value & 1431655765) << 1);
    value = ((value & 3435973836) >>> 2) | ((value & 858993459) << 2);
    value = ((value & 4042322160) >>> 4) | ((value & 252645135) << 4);
    value = ((value & 4278255360) >>> 8) | ((value & 16711935) << 8);
    tables.i[idx] = ((value >>> 16) | (value << 16)) >>> 17;
  }

  for (let idx = 0; idx < 32; idx++) {
    tables.B[idx] = (tables.o[idx] << 3) | tables.z[idx];
    tables.h[idx] = (tables.p[idx] << 4) | tables.w[idx];
  }

  appendPairs(tables.s, 144, 8);
  appendPairs(tables.s, 255 - 143, 9);
  appendPairs(tables.s, 279 - 255, 7);
  appendPairs(tables.s, 287 - 279, 8);
  assignCanonicalCodes(tables.s, 9);
  buildLookupTable(tables.s, 9, tables.g);
  remapCodes(tables.s, 9);

  appendPairs(tables.t, 32, 5);
  assignCanonicalCodes(tables.t, 5);
  buildLookupTable(tables.t, 5, tables.A);
  remapCodes(tables.t, 5);

  appendPairs(tables.b, 19, 0);
  appendPairs(tables.c, 286, 0);
  appendPairs(tables.e, 30, 0);
  appendPairs(tables.a, 320, 0);

  return tables;
};

export class Inflator {
  static readonly D: InflatorTables = createInflatorTables();

  static inflateRaw(o: Uint8Array, j?: Uint8Array) {
    const D = Inflator.D;
    function F(o: Uint8Array, j: number, I: number) {
      return ((o[j >>> 3] | (o[(j >>> 3) + 1] << 8)) >>> (j & 7)) & ((1 << I) - 1);
    }
    function s(o: Uint8Array, j: number, I: number) {
      return (
        ((o[j >>> 3] | (o[(j >>> 3) + 1] << 8) | (o[(j >>> 3) + 2] << 16)) >>> (j & 7)) &
        ((1 << I) - 1)
      );
    }
    function w(o: Uint8Array, j: number) {
      return (o[j >>> 3] | (o[(j >>> 3) + 1] << 8) | (o[(j >>> 3) + 2] << 16)) >>> (j & 7);
    }
    const I = Uint8Array;
    let r = 0;
    let i = 0;
    let y = 0;
    let G = 0;
    let f = 0;
    let a = 0;
    let k = 0;
    let N = 0;
    let x = 0;
    let P: any;
    let J: any;
    if (o[0] == 3 && o[1] == 0) return j ? j : new I(0);
    const A = j == null;
    if (A) j = new I((o.length >>> 2) << 3);

    let j_arr = j as Uint8Array;

    while (r == 0) {
      r = s(o, x, 1);
      i = s(o, x + 1, 2);
      x += 3;
      if (i == 0) {
        if ((x & 7) != 0) x += 8 - (x & 7);
        const K = (x >>> 3) + 4;
        const m = o[K - 4] | (o[K - 3] << 8);
        if (A) j_arr = Inflator.H(j_arr, N + m);
        j_arr.set(new I(o.buffer, o.byteOffset + K, m), N);
        x = (K + m) << 3;
        N += m;
        continue;
      }
      if (A) j_arr = Inflator.H(j_arr, N + (1 << 17));
      if (i == 1) {
        P = D.g;
        J = D.A;
        a = (1 << 9) - 1;
        k = (1 << 5) - 1;
      }
      if (i == 2) {
        y = F(o, x, 5) + 257;
        G = F(o, x + 5, 5) + 1;
        f = F(o, x + 10, 4) + 4;
        x += 14;
        let Q = 1;
        for (let p = 0; p < 38; p += 2) {
          D.b[p] = 0;
          D.b[p + 1] = 0;
        }
        for (let p = 0; p < f; p++) {
          const l = F(o, x + p * 3, 3);
          D.b[(D.d[p] << 1) + 1] = l;
          if (l > Q) Q = l;
        }
        x += 3 * f;
        Inflator.C_inner(D.b, Q);
        Inflator.t_inner(D.b, Q, D.C);
        P = D.k;
        J = D.n;
        x = Inflator.B(D.C, (1 << Q) - 1, y + G, o, x, D.a);
        const u = Inflator.d(D.a, 0, y, D.c);
        a = (1 << u) - 1;
        const n = Inflator.d(D.a, y, G, D.e);
        k = (1 << n) - 1;
        Inflator.C_inner(D.c, u);
        Inflator.t_inner(D.c, u, P);
        Inflator.C_inner(D.e, n);
        Inflator.t_inner(D.e, n, J);
      }
      for (;;) {
        const h = P[w(o, x) & a];
        x += h & 15;
        const L = h >>> 4;
        if (L >>> 8 == 0) {
          j_arr[N++] = L;
        } else if (L == 256) {
          break;
        } else {
          let M = N + L - 254;
          if (L > 264) {
            const z = D.B[L - 257];
            M = N + (z >>> 3) + F(o, x, z & 7);
            x += z & 7;
          }
          const e = J[w(o, x) & k];
          x += e & 15;
          const E = e >>> 4;
          const c = D.h[E];
          const q = (c >>> 4) + s(o, x, c & 15);
          x += c & 15;
          if (A) j_arr = Inflator.H(j_arr, N + (1 << 17));
          while (N < M) {
            j_arr[N] = j_arr[N++ - q];
            j_arr[N] = j_arr[N++ - q];
            j_arr[N] = j_arr[N++ - q];
            j_arr[N] = j_arr[N++ - q];
          }
          N = M;
        }
      }
    }
    return j_arr.length == N ? j_arr : j_arr.slice(0, N);
  }

  static C_inner(o: number[], j: number) {
    const D = Inflator.D;
    const I = o.length;
    const f = D.v;
    let A;
    let r;
    let i;
    let y;
    let G;
    for (y = 0; y <= j; y++) f[y] = 0;
    for (y = 1; y < I; y += 2) f[o[y]]++;
    const a = D.m;
    A = 0;
    f[0] = 0;
    for (r = 1; r <= j; r++) {
      A = (A + f[r - 1]) << 1;
      a[r] = A;
    }
    for (i = 0; i < I; i += 2) {
      G = o[i + 1];
      if (G != 0) {
        o[i] = a[G];
        a[G]++;
      }
    }
  }
  static t_inner(o: number[], j: number, I: Uint16Array) {
    const D = Inflator.D;
    const A = o.length;
    const r = D.i;
    for (let i = 0; i < A; i += 2)
      if (o[i + 1] != 0) {
        let y = i >> 1;
        let G = o[i + 1];
        let f = (y << 4) | G;
        let a = j - G;
        let k = o[i] << a;
        const N = k + (1 << a);
        while (k != N) {
          const x = r[k] >>> (15 - j);
          I[x] = f;
          k++;
        }
      }
  }
  static H(o: Uint8Array, j: number) {
    const I = o.length;
    if (j <= I) return o;
    const A = new Uint8Array(Math.max(I << 1, j));
    A.set(o, 0);
    return A;
  }
  static B(o: Uint16Array, j: number, I: number, A: Uint8Array, r: number, i: number[]) {
    function w(o: Uint8Array, j: number) {
      return (o[j >>> 3] | (o[(j >>> 3) + 1] << 8) | (o[(j >>> 3) + 2] << 16)) >>> (j & 7);
    }
    function F(o: Uint8Array, j: number, I: number) {
      return ((o[j >>> 3] | (o[(j >>> 3) + 1] << 8)) >>> (j & 7)) & ((1 << I) - 1);
    }
    let y = 0;
    while (y < I) {
      const G = o[w(A, r) & j];
      r += G & 15;
      const f = G >>> 4;
      if (f <= 15) {
        i[y] = f;
        y++;
      } else {
        let a = 0;
        let k = 0;
        if (f == 16) {
          k = 3 + F(A, r, 2);
          r += 2;
          a = i[y - 1];
        } else if (f == 17) {
          k = 3 + F(A, r, 3);
          r += 3;
        } else if (f == 18) {
          k = 11 + F(A, r, 7);
          r += 7;
        }
        const N = y + k;
        while (y < N) {
          i[y] = a;
          y++;
        }
      }
    }
    return r;
  }
  static d(o: number[], j: number, I: number, A: number[]) {
    let r = 0;
    let i = 0;
    const y = A.length >>> 1;
    while (i < I) {
      const G = o[i + j];
      A[i << 1] = 0;
      A[(i << 1) + 1] = G;
      if (G > r) r = G;
      i++;
    }
    while (i < y) {
      A[i << 1] = 0;
      A[(i << 1) + 1] = 0;
      i++;
    }
    return r;
  }
}

interface InflatorTables {
  m: Uint16Array;
  v: Uint16Array;
  d: number[];
  o: number[];
  z: number[];
  B: Uint16Array;
  p: number[];
  w: number[];
  h: Uint32Array;
  g: Uint16Array;
  s: number[];
  A: Uint16Array;
  t: number[];
  k: Uint16Array;
  c: number[];
  a: number[];
  n: Uint16Array;
  e: number[];
  C: Uint16Array;
  b: number[];
  i: Uint16Array;
  r: Uint32Array;
  f: Uint32Array;
  l: Uint32Array;
  u: Uint32Array;
  q: Uint16Array;
  j: Uint16Array;
}
