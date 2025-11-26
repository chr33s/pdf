export class CRC {
  static table: Uint32Array = (function () {
    const tab = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        if (c & 1) c = 0xedb88320 ^ (c >>> 1);
        else c = c >>> 1;
      }
      tab[n] = c;
    }
    return tab;
  })();

  static update(c: number, buf: Uint8Array, off: number, len: number) {
    for (let i = 0; i < len; i++)
      c = CRC.table[(c ^ buf[off + i]) & 0xff] ^ (c >>> 8);
    return c;
  }

  static crc(b: Uint8Array, o: number, l: number) {
    return CRC.update(0xffffffff, b, o, l) ^ 0xffffffff;
  }
}
