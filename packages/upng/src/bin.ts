export class Bin {
  static nextZero(data: Uint8Array, p: number) {
    while (data[p] != 0) p++;
    return p;
  }
  static readUshort(buff: Uint8Array, p: number) {
    return (buff[p] << 8) | buff[p + 1];
  }
  static writeUshort(buff: Uint8Array, p: number, n: number) {
    buff[p] = (n >> 8) & 255;
    buff[p + 1] = n & 255;
  }
  static readUint(buff: Uint8Array, p: number) {
    return buff[p] * (256 * 256 * 256) + ((buff[p + 1] << 16) | (buff[p + 2] << 8) | buff[p + 3]);
  }
  static writeUint(buff: Uint8Array, p: number, n: number) {
    buff[p] = (n >> 24) & 255;
    buff[p + 1] = (n >> 16) & 255;
    buff[p + 2] = (n >> 8) & 255;
    buff[p + 3] = n & 255;
  }
  static readASCII(buff: Uint8Array, p: number, l: number) {
    let s = "";
    for (let i = 0; i < l; i++) s += String.fromCharCode(buff[p + i]);
    return s;
  }
  static writeASCII(data: Uint8Array, p: number, s: string) {
    for (let i = 0; i < s.length; i++) data[p + i] = s.charCodeAt(i);
  }
  static readBytes(buff: Uint8Array, p: number, l: number) {
    const arr = [];
    for (let i = 0; i < l; i++) arr.push(buff[p + i]);
    return arr;
  }
  static pad(n: string) {
    return n.length < 2 ? "0" + n : n;
  }
  static readUTF8(buff: Uint8Array, p: number, l: number) {
    let s = "";
    let ns;
    for (let i = 0; i < l; i++) s += "%" + Bin.pad(buff[p + i].toString(16));
    try {
      ns = decodeURIComponent(s);
    } catch {
      return Bin.readASCII(buff, p, l);
    }
    return ns;
  }
}
