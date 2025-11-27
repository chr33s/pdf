import Arc from "../utils/elements/arc.js";
import Circle from "../utils/elements/circle.js";
import Ellipse from "../utils/elements/ellipse.js";
import Line from "../utils/elements/line.js";
import Plot from "../utils/elements/plot.js";
import Point from "../utils/elements/point.js";
import Rectangle from "../utils/elements/rectangle.js";
import Segment from "../utils/elements/segment.js";
export type { TransformationMatrix } from "./matrix.js";

export type Size = {
  width: number;
  height: number;
};

export type Coordinates = {
  x: number;
  y: number;
};

export type GraphicElement = Arc | Circle | Ellipse | Line | Plot | Point | Rectangle | Segment;

export type Space = {
  topLeft: Coordinates;
  topRight: Coordinates;
  bottomRight: Coordinates;
  bottomLeft: Coordinates;
};

export type LinkElement = Rectangle | Ellipse;
