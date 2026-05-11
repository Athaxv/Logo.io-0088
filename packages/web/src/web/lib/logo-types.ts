/**
 * Shared logo spec types — used on frontend for editing / preview.
 * Mirror of the server-side type in api/lib/svg-builder.ts
 */

export interface LogoElement {
  type: "path" | "circle" | "rect" | "ellipse" | "polygon" | "polyline" | "line" | "text";
  fill?: string;
  fillRule?: "nonzero" | "evenodd";
  stroke?: string;
  strokeWidth?: number;
  strokeLinecap?: "butt" | "round" | "square";
  strokeLinejoin?: "miter" | "round" | "bevel";
  opacity?: number;
  transform?: string;
  // path
  d?: string;
  // circle / ellipse
  cx?: number;
  cy?: number;
  r?: number;
  rx?: number;
  ry?: number;
  // rect
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  // polygon / polyline
  points?: string;
  // line
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  // text
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string | number;
  textAnchor?: "start" | "middle" | "end";
  letterSpacing?: number;
  dominantBaseline?: string;
}

export interface LogoSpec {
  prompt: string;
  logoType: string;
  style: string;
  composition: string;
  viewBox?: string;
  palette: string[];
  background: string;
  elements: LogoElement[];
}
