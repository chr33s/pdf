import { StandardEncoding } from "../cff/cff-encodings.js";
import CFFStandardStrings from "../cff/cff-standard-strings.js";
import Glyph from "./glyph.js";
import Path from "./path.js";

class OperandStack extends Array<number> {
  shift(): number {
    const value = super.shift();
    if (value == null) {
      throw new Error("CFF stack underflow");
    }

    return value;
  }

  pop(): number {
    const value = super.pop();
    if (value == null) {
      throw new Error("CFF stack underflow");
    }

    return value;
  }
}

type UsedSubroutineMap = Record<number, boolean>;

type SubroutineRecord = {
  offset: number;
  length: number;
};

/**
 * Represents an OpenType PostScript glyph, in the Compact Font Format.
 */
export default class CFFGlyph extends Glyph {
  _usedGsubrs: UsedSubroutineMap = {};
  _usedSubrs: UsedSubroutineMap = {};

  _getName() {
    if (this._font.CFF2) {
      return super._getName();
    }

    return this._font["CFF "].getGlyphName(this.id);
  }

  bias(s: ArrayLike<unknown>) {
    if (s.length < 1240) {
      return 107;
    } else if (s.length < 33900) {
      return 1131;
    } else {
      return 32768;
    }
  }

  _getPath(): Path {
    const { stream } = this._font;

    const cff = this._font.CFF2 || this._font["CFF "];
    const str = cff.topDict.CharStrings[this.id];
    let end = str.offset + str.length;
    stream.pos = str.offset;

    const path = new Path();
    const stack = new OperandStack();
    const trans: number[] = [];

    let width: number | null = null;
    let nStems = 0;
    let x = 0;
    let y = 0;
    let open = false;
    let phase = false;

    const usedGsubrs: UsedSubroutineMap = {};
    const usedSubrs: UsedSubroutineMap = {};
    this._usedGsubrs = usedGsubrs;
    this._usedSubrs = usedSubrs;

    const gsubrs = (cff.globalSubrIndex || []) as SubroutineRecord[];
    const gsubrsBias = this.bias(gsubrs);

    const privateDict = cff.privateDictForGlyph(this.id) || {};
    const subrs = (privateDict.Subrs || []) as SubroutineRecord[];
    const subrsBias = this.bias(subrs);

    const vstore = cff.topDict.vstore && cff.topDict.vstore.itemVariationStore;
    let vsindex = privateDict.vsindex;
    const variationProcessor = this._font._variationProcessor;

    let encodingVector: string[] | undefined;
    const font = this._font;

    const checkWidth = (): void => {
      if (width == null) {
        width = stack.shift() + privateDict.nominalWidthX;
      }
    };

    function glyphForName(name: string) {
      if (!encodingVector) {
        encodingVector = cff.topDict.charset.glyphs.map((g: number) => CFFStandardStrings[g]);
      }
      const glyphId = Math.max(0, encodingVector!.indexOf(name) + 1); // .notdef is not included, hence + 1
      return font.getGlyph(glyphId);
    }

    const parseStems = (): void => {
      if (stack.length % 2 !== 0) {
        checkWidth();
      }

      nStems += stack.length >> 1;
      stack.length = 0;
    };

    const moveTo = (nextX: number, nextY: number): void => {
      if (open) {
        path.closePath();
      }

      path.moveTo(nextX, nextY);
      open = true;
    };

    const runSubroutine = (
      rawIndex: number,
      bias: number,
      subroutineList: SubroutineRecord[] | undefined,
      usage: UsedSubroutineMap,
    ): void => {
      const list = subroutineList || [];
      const index = rawIndex + bias;
      const record = list[index];
      if (!record) {
        return;
      }

      usage[index] = true;
      const savedPos = stream.pos;
      const savedEnd = end;
      stream.pos = record.offset;
      end = record.offset + record.length;
      parse();
      stream.pos = savedPos;
      end = savedEnd;
    };

    const parse = (): void => {
      while (stream.pos < end) {
        let op = stream.readUInt8();
        if (op < 32) {
          switch (op) {
            case 1: // hstem
            case 3: // vstem
            case 18: // hstemhm
            case 23: // vstemhm
              parseStems();
              break;

            case 4: {
              // vmoveto
              if (stack.length > 1) {
                checkWidth();
              }

              y += stack.shift();
              moveTo(x, y);
              break;
            }

            case 5: {
              // rlineto
              while (stack.length >= 2) {
                x += stack.shift();
                y += stack.shift();
                path.lineTo(x, y);
              }
              break;
            }

            case 6:
            case 7: {
              // hlineto / vlineto
              phase = op === 6;
              while (stack.length >= 1) {
                if (phase) {
                  x += stack.shift();
                } else {
                  y += stack.shift();
                }

                path.lineTo(x, y);
                phase = !phase;
              }
              break;
            }

            case 8: {
              // rrcurveto
              while (stack.length > 0) {
                const c1x = x + stack.shift();
                const c1y = y + stack.shift();
                const c2x = c1x + stack.shift();
                const c2y = c1y + stack.shift();
                x = c2x + stack.shift();
                y = c2y + stack.shift();
                path.bezierCurveTo(c1x, c1y, c2x, c2y, x, y);
              }
              break;
            }

            case 10: {
              // callsubr
              runSubroutine(stack.pop(), subrsBias, subrs, usedSubrs);
              break;
            }

            case 11: {
              // return
              if (cff.version >= 2) {
                break;
              }
              return;
            }

            case 14: // endchar
              if (cff.version >= 2) {
                break;
              }

              if (stack.length >= 4) {
                // Type 2 Charstring Format Appendix C
                // treat like Type 1 seac command (standard encoding accented character)
                const acharName = StandardEncoding?.[stack.pop()];
                const bcharName = StandardEncoding?.[stack.pop()];
                const ady = stack.pop();
                const adx = stack.pop();
                // const asb = stack.pop(); // ignored for Type 2

                const achar = glyphForName(acharName);
                const bchar = glyphForName(bcharName);

                const aPathShifted = achar.path.translate(adx, ady);
                path.commands = [...bchar.path.commands, ...aPathShifted.commands];

                open = false;
              } else if (stack.length > 0) {
                checkWidth();
              }

              if (open) {
                path.closePath();
                open = false;
              }
              break;

            case 15: {
              // vsindex
              if (cff.version < 2) {
                throw new Error("vsindex operator not supported in CFF v1");
              }

              vsindex = stack.pop();
              break;
            }

            case 16: {
              // blend
              if (cff.version < 2) {
                throw new Error("blend operator not supported in CFF v1");
              }

              if (!variationProcessor) {
                throw new Error("blend operator in non-variation font");
              }

              const blendVector = variationProcessor.getBlendVector(vstore, vsindex);
              const numBlends = stack.pop();
              const numOperands = numBlends * blendVector.length;
              let deltaIndex = stack.length - numOperands;
              const base = deltaIndex - numBlends;

              for (let i = 0; i < numBlends; i++) {
                let sum = stack[base + i];
                for (let j = 0; j < blendVector.length; j++) {
                  sum += blendVector[j] * stack[deltaIndex++];
                }

                stack[base + i] = sum;
              }

              for (let i = 0; i < numOperands; i++) {
                stack.pop();
              }

              break;
            }

            case 19: // hintmask
            case 20: // cntrmask
              parseStems();
              stream.pos += (nStems + 7) >> 3;
              break;

            case 21: {
              // rmoveto
              if (stack.length > 2) {
                checkWidth();
              }

              x += stack.shift();
              y += stack.shift();
              moveTo(x, y);
              break;
            }

            case 22: {
              // hmoveto
              if (stack.length > 1) {
                checkWidth();
              }

              x += stack.shift();
              moveTo(x, y);
              break;
            }

            case 24: {
              // rcurveline
              while (stack.length >= 8) {
                const c1x = x + stack.shift();
                const c1y = y + stack.shift();
                const c2x = c1x + stack.shift();
                const c2y = c1y + stack.shift();
                x = c2x + stack.shift();
                y = c2y + stack.shift();
                path.bezierCurveTo(c1x, c1y, c2x, c2y, x, y);
              }

              x += stack.shift();
              y += stack.shift();
              path.lineTo(x, y);
              break;
            }

            case 25: {
              // rlinecurve
              while (stack.length >= 8) {
                x += stack.shift();
                y += stack.shift();
                path.lineTo(x, y);
              }

              const c1x = x + stack.shift();
              const c1y = y + stack.shift();
              const c2x = c1x + stack.shift();
              const c2y = c1y + stack.shift();
              x = c2x + stack.shift();
              y = c2y + stack.shift();
              path.bezierCurveTo(c1x, c1y, c2x, c2y, x, y);
              break;
            }

            case 26: {
              // vvcurveto
              if (stack.length % 2) {
                x += stack.shift();
              }

              while (stack.length >= 4) {
                const c1x = x;
                const c1y = y + stack.shift();
                const c2x = c1x + stack.shift();
                const c2y = c1y + stack.shift();
                x = c2x;
                y = c2y + stack.shift();
                path.bezierCurveTo(c1x, c1y, c2x, c2y, x, y);
              }
              break;
            }

            case 27: {
              // hhcurveto
              if (stack.length % 2) {
                y += stack.shift();
              }

              while (stack.length >= 4) {
                const c1x = x + stack.shift();
                const c1y = y;
                const c2x = c1x + stack.shift();
                const c2y = c1y + stack.shift();
                x = c2x + stack.shift();
                y = c2y;
                path.bezierCurveTo(c1x, c1y, c2x, c2y, x, y);
              }
              break;
            }

            case 28: // shortint
              stack.push(stream.readInt16BE());
              break;

            case 29: {
              // callgsubr
              runSubroutine(stack.pop(), gsubrsBias, gsubrs, usedGsubrs);
              break;
            }

            case 30:
            case 31: {
              // vhcurveto / hvcurveto
              phase = op === 31;
              while (stack.length >= 4) {
                if (phase) {
                  const c1x = x + stack.shift();
                  const c1y = y;
                  const c2x = c1x + stack.shift();
                  const c2y = c1y + stack.shift();
                  y = c2y + stack.shift();
                  x = c2x + (stack.length === 1 ? stack.shift() : 0);
                  path.bezierCurveTo(c1x, c1y, c2x, c2y, x, y);
                } else {
                  const c1x = x;
                  const c1y = y + stack.shift();
                  const c2x = c1x + stack.shift();
                  const c2y = c1y + stack.shift();
                  x = c2x + stack.shift();
                  y = c2y + (stack.length === 1 ? stack.shift() : 0);
                  path.bezierCurveTo(c1x, c1y, c2x, c2y, x, y);
                }

                phase = !phase;
              }
              break;
            }

            case 12: {
              const escapedOp = stream.readUInt8();
              switch (escapedOp) {
                case 3: {
                  const a = stack.pop();
                  const b = stack.pop();
                  stack.push(a && b ? 1 : 0);
                  break;
                }

                case 4: {
                  const a = stack.pop();
                  const b = stack.pop();
                  stack.push(a || b ? 1 : 0);
                  break;
                }

                case 5: {
                  const value = stack.pop();
                  stack.push(value ? 0 : 1);
                  break;
                }

                case 9: {
                  const value = stack.pop();
                  stack.push(Math.abs(value));
                  break;
                }

                case 10: {
                  const a = stack.pop();
                  const b = stack.pop();
                  stack.push(a + b);
                  break;
                }

                case 11: {
                  const a = stack.pop();
                  const b = stack.pop();
                  stack.push(a - b);
                  break;
                }

                case 12: {
                  const a = stack.pop();
                  const b = stack.pop();
                  stack.push(a / b);
                  break;
                }

                case 14: {
                  const value = stack.pop();
                  stack.push(-value);
                  break;
                }

                case 15: {
                  const a = stack.pop();
                  const b = stack.pop();
                  stack.push(a === b ? 1 : 0);
                  break;
                }

                case 18: {
                  stack.pop();
                  break;
                }

                case 20: {
                  const val = stack.pop();
                  const idx = stack.pop();
                  trans[idx] = val;
                  break;
                }

                case 21: {
                  const idx = stack.pop();
                  stack.push(trans[idx] || 0);
                  break;
                }

                case 22: {
                  const s1 = stack.pop();
                  const s2 = stack.pop();
                  const v1 = stack.pop();
                  const v2 = stack.pop();
                  stack.push(v1 <= v2 ? s1 : s2);
                  break;
                }

                case 23: {
                  stack.push(Math.random());
                  break;
                }

                case 24: {
                  const a = stack.pop();
                  const b = stack.pop();
                  stack.push(a * b);
                  break;
                }

                case 26: {
                  const value = stack.pop();
                  stack.push(Math.sqrt(value));
                  break;
                }

                case 27: {
                  const value = stack.pop();
                  stack.push(value, value);
                  break;
                }

                case 28: {
                  const a = stack.pop();
                  const b = stack.pop();
                  stack.push(b, a);
                  break;
                }

                case 29: {
                  let idx = stack.pop();
                  if (idx < 0) {
                    idx = 0;
                  } else if (idx > stack.length - 1) {
                    idx = stack.length - 1;
                  }

                  stack.push(stack[idx]);
                  break;
                }

                case 30: {
                  const count = stack.pop();
                  let shift = stack.pop();

                  if (count <= 0) {
                    break;
                  }

                  shift %= count;
                  if (shift > 0) {
                    for (let rotation = 0; rotation < shift; rotation++) {
                      const last = stack[count - 1];
                      for (let i = count - 1; i > 0; i--) {
                        stack[i] = stack[i - 1];
                      }
                      stack[0] = last;
                    }
                  } else if (shift < 0) {
                    for (let rotation = 0; rotation > shift; rotation--) {
                      const first = stack[0];
                      for (let i = 0; i < count - 1; i++) {
                        stack[i] = stack[i + 1];
                      }
                      stack[count - 1] = first;
                    }
                  }
                  break;
                }

                case 34: {
                  const c1x = x + stack.shift();
                  const c1y = y;
                  const c2x = c1x + stack.shift();
                  const c2y = c1y + stack.shift();
                  const c3x = c2x + stack.shift();
                  const c3y = c2y;
                  const c4x = c3x + stack.shift();
                  const c4y = c3y;
                  const c5x = c4x + stack.shift();
                  const c5y = c4y;
                  const c6x = c5x + stack.shift();
                  const c6y = c5y;
                  x = c6x;
                  y = c6y;

                  path.bezierCurveTo(c1x, c1y, c2x, c2y, c3x, c3y);
                  path.bezierCurveTo(c4x, c4y, c5x, c5y, c6x, c6y);
                  break;
                }

                case 35: {
                  const pts: number[] = [];

                  for (let i = 0; i <= 5; i++) {
                    x += stack.shift();
                    y += stack.shift();
                    pts.push(x, y);
                  }

                  const [c1x, c1y, c2x, c2y, c3x, c3y, c4x, c4y, c5x, c5y, c6x, c6y] = pts as [
                    number,
                    number,
                    number,
                    number,
                    number,
                    number,
                    number,
                    number,
                    number,
                    number,
                    number,
                    number,
                  ];

                  path.bezierCurveTo(c1x, c1y, c2x, c2y, c3x, c3y);
                  path.bezierCurveTo(c4x, c4y, c5x, c5y, c6x, c6y);
                  stack.shift(); // fd
                  break;
                }

                case 36: {
                  const c1x = x + stack.shift();
                  const c1y = y + stack.shift();
                  const c2x = c1x + stack.shift();
                  const c2y = c1y + stack.shift();
                  const c3x = c2x + stack.shift();
                  const c3y = c2y;
                  const c4x = c3x + stack.shift();
                  const c4y = c3y;
                  const c5x = c4x + stack.shift();
                  const c5y = c4y + stack.shift();
                  const c6x = c5x + stack.shift();
                  const c6y = c5y;
                  x = c6x;
                  y = c6y;

                  path.bezierCurveTo(c1x, c1y, c2x, c2y, c3x, c3y);
                  path.bezierCurveTo(c4x, c4y, c5x, c5y, c6x, c6y);
                  break;
                }

                case 37: {
                  const startX = x;
                  const startY = y;

                  const pts: number[] = [];
                  for (let i = 0; i <= 4; i++) {
                    x += stack.shift();
                    y += stack.shift();
                    pts.push(x, y);
                  }

                  if (Math.abs(x - startX) > Math.abs(y - startY)) {
                    x += stack.shift();
                    y = startY;
                  } else {
                    x = startX;
                    y += stack.shift();
                  }

                  pts.push(x, y);
                  const [f1x, f1y, f2x, f2y, f3x, f3y, f4x, f4y, f5x, f5y, f6x, f6y] = pts as [
                    number,
                    number,
                    number,
                    number,
                    number,
                    number,
                    number,
                    number,
                    number,
                    number,
                    number,
                    number,
                  ];

                  path.bezierCurveTo(f1x, f1y, f2x, f2y, f3x, f3y);
                  path.bezierCurveTo(f4x, f4y, f5x, f5y, f6x, f6y);
                  break;
                }

                default:
                  throw new Error(`Unknown op: 12 ${escapedOp}`);
              }
              break;
            }

            default:
              throw new Error(`Unknown op: ${op}`);
          }
        } else if (op < 247) {
          stack.push(op - 139);
        } else if (op < 251) {
          const b1 = stream.readUInt8();
          stack.push((op - 247) * 256 + b1 + 108);
        } else if (op < 255) {
          const b1 = stream.readUInt8();
          stack.push(-(op - 251) * 256 - b1 - 108);
        } else {
          stack.push(stream.readInt32BE() / 65536);
        }
      }
    };

    parse();

    if (open) {
      path.closePath();
    }

    return path;
  }
}
