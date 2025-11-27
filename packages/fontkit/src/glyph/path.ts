import BBox from "./b-box.js";

type PathCommandName = "moveTo" | "lineTo" | "quadraticCurveTo" | "bezierCurveTo" | "closePath";

type PathCommand = {
  command: PathCommandName;
  args: number[];
};

type CoordinateMapper = (x: number, y: number) => [number, number];

const SVG_COMMANDS: Record<PathCommandName, string> = {
  moveTo: "M",
  lineTo: "L",
  quadraticCurveTo: "Q",
  bezierCurveTo: "C",
  closePath: "Z",
};

/**
 * Path objects are returned by glyphs and represent the actual
 * vector outlines for each glyph in the font. Paths can be converted
 * to SVG path data strings, or to functions that can be applied to
 * render the path to a graphics context.
 */
export default class Path {
  commands: PathCommand[];
  #bbox: Readonly<BBox> | null;
  #cbox: Readonly<BBox> | null;

  constructor() {
    this.commands = [];
    this.#bbox = null;
    this.#cbox = null;
  }

  #invalidateBounds(): void {
    this.#bbox = null;
    this.#cbox = null;
  }

  #addCommand(command: PathCommandName, args: number[]): this {
    this.#invalidateBounds();
    this.commands.push({ command, args });
    return this;
  }

  /**
   * Compiles the path to a JavaScript function that can be applied with
   * a graphics context in order to render the path.
   * @return {string}
   */
  toFunction(): (ctx: Record<string, (...args: number[]) => unknown>) => void {
    return (ctx) => this.commands.forEach((c) => ctx[c.command].apply(ctx, c.args));
  }

  /**
   * Converts the path to an SVG path data string
   * @return {string}
   */
  toSVG(): string {
    const cmds = this.commands.map((c) => {
      const args = c.args.map((arg) => Math.round(arg * 100) / 100);
      return `${SVG_COMMANDS[c.command]}${args.join(" ")}`;
    });

    return cmds.join("");
  }

  /**
   * Gets the "control box" of a path.
   * This is like the bounding box, but it includes all points including
   * control points of bezier segments and is much faster to compute than
   * the real bounding box.
   * @type {BBox}
   */
  get cbox(): Readonly<BBox> {
    if (!this.#cbox) {
      const cbox = new BBox();
      for (const command of this.commands) {
        for (let i = 0; i < command.args.length; i += 2) {
          cbox.addPoint(command.args[i], command.args[i + 1]);
        }
      }

      if (this.commands.length === 0) {
        // No content, put 0 instead of Infinity
        cbox.minX = 0;
        cbox.minY = 0;
        cbox.maxX = 0;
        cbox.maxY = 0;
      }

      this.#cbox = Object.freeze(cbox);
    }

    return this.#cbox;
  }

  /**
   * Gets the exact bounding box of the path by evaluating curve segments.
   * Slower to compute than the control box, but more accurate.
   * @type {BBox}
   */
  get bbox(): Readonly<BBox> {
    if (this.#bbox) {
      return this.#bbox;
    }

    const bbox = new BBox();
    let cx = 0;
    let cy = 0;

    for (const command of this.commands) {
      switch (command.command) {
        case "moveTo":
        case "lineTo": {
          const [x, y] = command.args;
          bbox.addPoint(x, y);
          cx = x;
          cy = y;
          break;
        }

        case "quadraticCurveTo":
        case "bezierCurveTo": {
          let cp1x: number;
          let cp1y: number;
          let cp2x: number;
          let cp2y: number;
          let p3x: number;
          let p3y: number;

          if (command.command === "quadraticCurveTo") {
            // http://fontforge.org/bezier.html
            const [qp1x, qp1y, qp3x, qp3y] = command.args;
            cp1x = cx + (2 / 3) * (qp1x - cx); // CP1 = QP0 + 2/3 * (QP1-QP0)
            cp1y = cy + (2 / 3) * (qp1y - cy);
            cp2x = qp3x + (2 / 3) * (qp1x - qp3x); // CP2 = QP2 + 2/3 * (QP1-QP2)
            cp2y = qp3y + (2 / 3) * (qp1y - qp3y);
            p3x = qp3x;
            p3y = qp3y;
          } else {
            [cp1x, cp1y, cp2x, cp2y, p3x, p3y] = command.args;
          }

          // http://blog.hackers-cafe.net/2009/06/how-to-calculate-bezier-curves-bounding.html
          bbox.addPoint(p3x, p3y);

          const p0 = [cx, cy];
          const p1 = [cp1x, cp1y];
          const p2 = [cp2x, cp2y];
          const p3 = [p3x, p3y];

          const cubic = (t: number, axis: 0 | 1) =>
            Math.pow(1 - t, 3) * p0[axis] +
            3 * Math.pow(1 - t, 2) * t * p1[axis] +
            3 * (1 - t) * Math.pow(t, 2) * p2[axis] +
            Math.pow(t, 3) * p3[axis];

          for (const axis of [0, 1] as const) {
            const b = 6 * p0[axis] - 12 * p1[axis] + 6 * p2[axis];
            const a = -3 * p0[axis] + 9 * p1[axis] - 9 * p2[axis] + 3 * p3[axis];
            const cCoef = 3 * p1[axis] - 3 * p0[axis];

            if (a === 0) {
              if (b === 0) {
                continue;
              }

              const t = -cCoef / b;
              if (t > 0 && t < 1) {
                if (axis === 0) {
                  bbox.addPoint(cubic(t, 0), bbox.maxY);
                } else {
                  bbox.addPoint(bbox.maxX, cubic(t, 1));
                }
              }

              continue;
            }

            const b2ac = Math.pow(b, 2) - 4 * cCoef * a;
            if (b2ac < 0) {
              continue;
            }

            const sqrt = Math.sqrt(b2ac);
            const roots: number[] = [(-b + sqrt) / (2 * a), (-b - sqrt) / (2 * a)];

            for (const t of roots) {
              if (t > 0 && t < 1) {
                if (axis === 0) {
                  bbox.addPoint(cubic(t, 0), bbox.maxY);
                } else {
                  bbox.addPoint(bbox.maxX, cubic(t, 1));
                }
              }
            }
          }

          cx = p3x;
          cy = p3y;
          break;
        }
      }
    }

    if (this.commands.length === 0) {
      // No content, put 0 instead of Infinity
      bbox.minX = 0;
      bbox.minY = 0;
      bbox.maxX = 0;
      bbox.maxY = 0;
    }

    this.#bbox = Object.freeze(bbox);
    return this.#bbox;
  }

  /**
   * Applies a mapping function to each point in the path.
   * @param {function} fn
   * @return {Path}
   */
  mapPoints(fn: CoordinateMapper): Path {
    const path = new Path();

    for (const command of this.commands) {
      const args: number[] = [];
      for (let i = 0; i < command.args.length; i += 2) {
        const [x, y] = fn(command.args[i], command.args[i + 1]);
        args.push(x, y);
      }

      path.#addCommand(command.command, args);
    }

    return path;
  }

  /**
   * Transforms the path by the given matrix.
   */
  transform(m0: number, m1: number, m2: number, m3: number, m4: number, m5: number): Path {
    return this.mapPoints((x, y) => {
      const newX = m0 * x + m2 * y + m4;
      const newY = m1 * x + m3 * y + m5;
      return [newX, newY];
    });
  }

  /**
   * Translates the path by the given offset.
   */
  translate(x: number, y: number): Path {
    return this.transform(1, 0, 0, 1, x, y);
  }

  /**
   * Rotates the path by the given angle (in radians).
   */
  rotate(angle: number): Path {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return this.transform(cos, sin, -sin, cos, 0, 0);
  }

  /**
   * Scales the path.
   */
  scale(scaleX: number, scaleY = scaleX): Path {
    return this.transform(scaleX, 0, 0, scaleY, 0, 0);
  }

  moveTo(x: number, y: number): this {
    return this.#addCommand("moveTo", [x, y]);
  }

  lineTo(x: number, y: number): this {
    return this.#addCommand("lineTo", [x, y]);
  }

  quadraticCurveTo(cp1x: number, cp1y: number, x: number, y: number): this {
    return this.#addCommand("quadraticCurveTo", [cp1x, cp1y, x, y]);
  }

  bezierCurveTo(
    cp1x: number,
    cp1y: number,
    cp2x: number,
    cp2y: number,
    x: number,
    y: number,
  ): this {
    return this.#addCommand("bezierCurveTo", [cp1x, cp1y, cp2x, cp2y, x, y]);
  }

  closePath(): this {
    return this.#addCommand("closePath", []);
  }
}
