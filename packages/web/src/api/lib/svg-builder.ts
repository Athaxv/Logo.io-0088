/**
 * Converts a LogoSpec into valid SVG markup.
 * viewBox is always 0 0 512 512.
 */

export interface LogoElement {
  type: "path" | "circle" | "rect" | "ellipse" | "polygon" | "polyline" | "line" | "text";
  // common
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
  // circle
  cx?: number; cy?: number; r?: number;
  // rect
  x?: number; y?: number; width?: number; height?: number; rx?: number; ry?: number;
  // ellipse — rx/ry reused from rect intentionally
  // polygon / polyline
  points?: string;
  // line
  x1?: number; y1?: number; x2?: number; y2?: number;
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

function esc(v: string | number) {
  return String(v).replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function attrs(obj: Record<string, string | number | undefined>): string {
  return Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null && v !== "" && v !== 0 || v === 0 && true)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}="${esc(v!)}"`)
    .join(" ");
}

export function buildSVG(spec: LogoSpec): string {
  const vb = spec.viewBox ?? "0 0 512 512";
  const bg = spec.background ?? "transparent";

  const elementMarkup = spec.elements.map(el => {
    const common: Record<string, string | number | undefined> = {
      fill: el.fill ?? "none",
      "fill-rule": el.fillRule,
      stroke: el.stroke && el.stroke !== "none" ? el.stroke : undefined,
      "stroke-width": el.strokeWidth && el.strokeWidth > 0 ? el.strokeWidth : undefined,
      "stroke-linecap": el.strokeLinecap,
      "stroke-linejoin": el.strokeLinejoin,
      opacity: el.opacity !== undefined && el.opacity !== 1 ? el.opacity : undefined,
      transform: el.transform || undefined,
    };

    switch (el.type) {
      case "path":
        return `<path ${attrs({ ...common, d: el.d })} />`;

      case "circle":
        return `<circle ${attrs({ ...common, cx: el.cx ?? 256, cy: el.cy ?? 256, r: el.r ?? 100 })} />`;

      case "rect":
        return `<rect ${attrs({ ...common, x: el.x ?? 0, y: el.y ?? 0, width: el.width ?? 100, height: el.height ?? 100, rx: el.rx || undefined, ry: el.ry || undefined })} />`;

      case "ellipse":
        return `<ellipse ${attrs({ ...common, cx: el.cx ?? 256, cy: el.cy ?? 256, rx: el.rx ?? 100, ry: el.ry ?? 60 })} />`;

      case "polygon":
        return `<polygon ${attrs({ ...common, points: el.points })} />`;

      case "polyline":
        return `<polyline ${attrs({ ...common, points: el.points })} />`;

      case "line":
        return `<line ${attrs({ ...common, x1: el.x1, y1: el.y1, x2: el.x2, y2: el.y2 })} />`;

      case "text":
        return `<text ${attrs({
          ...common,
          x: el.x ?? 256,
          y: el.y ?? 256,
          "font-size": el.fontSize ?? 48,
          "font-family": el.fontFamily ?? "Arial, sans-serif",
          "font-weight": el.fontWeight ?? "bold",
          "text-anchor": el.textAnchor ?? "middle",
          "dominant-baseline": el.dominantBaseline ?? "central",
          "letter-spacing": el.letterSpacing || undefined,
        })}>${esc(el.text ?? "")}</text>`;

      default:
        return "";
    }
  }).filter(Boolean).join("\n  ");

  const bgRect = bg === "transparent"
    ? ""
    : `<rect width="512" height="512" fill="${esc(bg)}" />\n  `;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="512" height="512">
  ${bgRect}${elementMarkup}
</svg>`;
}
