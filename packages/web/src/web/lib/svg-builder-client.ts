import type { LogoSpec, LogoElement } from "./logo-types";

function esc(v: string | number) {
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function attrs(obj: Record<string, string | number | undefined>): string {
  return Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}="${esc(v!)}"`)
    .join(" ");
}

export function buildSVGClient(spec: LogoSpec): string {
  const vb = spec.viewBox ?? "0 0 512 512";
  const bg = spec.background ?? "transparent";

  const elementMarkup = spec.elements
    .map((el: LogoElement) => {
      const common: Record<string, string | number | undefined> = {
        fill: el.fill ?? "none",
        "fill-rule": el.fillRule,
        stroke: el.stroke,
        "stroke-width": el.strokeWidth,
        "stroke-linecap": el.strokeLinecap,
        "stroke-linejoin": el.strokeLinejoin,
        opacity: el.opacity,
        transform: el.transform,
      };

      switch (el.type) {
        case "path":
          return `<path ${attrs({ ...common, d: el.d })} />`;
        case "circle":
          return `<circle ${attrs({ ...common, cx: el.cx ?? 256, cy: el.cy ?? 256, r: el.r ?? 100 })} />`;
        case "rect":
          return `<rect ${attrs({ ...common, x: el.x ?? 0, y: el.y ?? 0, width: el.width ?? 100, height: el.height ?? 100, rx: el.rx, ry: el.ry })} />`;
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
            "letter-spacing": el.letterSpacing,
          })}>${esc(el.text ?? "")}</text>`;
        default:
          return "";
      }
    })
    .filter(Boolean)
    .join("\n  ");

  const bgRect =
    bg === "transparent"
      ? ""
      : `<rect width="512" height="512" fill="${esc(bg)}" />`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="512" height="512">
  ${bgRect}
  ${elementMarkup}
</svg>`;
}

/** Download an SVG string as a file */
export function downloadSVGString(svg: string, filename = "logo.svg") {
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Export SVG as PNG via an offscreen canvas */
export async function exportSVGAsPNG(svg: string, size = 1024, filename = "logo.png"): Promise<void> {
  return new Promise((resolve, reject) => {
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      canvas.toBlob(blob => {
        if (!blob) return reject(new Error("PNG export failed"));
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        resolve();
      }, "image/png");
    };
    img.onerror = () => reject(new Error("SVG render failed"));
    img.src = dataUrl;
  });
}
