/**
 * SVG sanitizer — strips unsafe tags, attributes, and external references.
 * Runs server-side (no DOM) using regex-based cleaning.
 */

const BANNED_TAGS = [
  "script", "foreignObject", "iframe", "object", "embed",
  "use", "image", "video", "audio", "canvas", "link", "style",
  "meta", "base", "input", "form", "button",
];

const BANNED_ATTR_PREFIXES = ["on"]; // onclick, onload, etc.
const BANNED_ATTRS = [
  "href", "xlink:href", "action", "formaction", "src",
  "data", "dynsrc", "lowsrc",
];
const SAFE_PROTOCOLS = /^(#|data:image\/)/i;

export function sanitizeSVG(svg: string): string {
  // Remove banned tags and their contents
  for (const tag of BANNED_TAGS) {
    const re = new RegExp(`<${tag}[\\s\\S]*?(?:</${tag}>|/>)`, "gi");
    svg = svg.replace(re, "");
  }

  // Remove event handler attributes
  svg = svg.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");

  // Remove href / xlink:href that point to external URLs
  svg = svg.replace(
    /\s+(?:xlink:)?href\s*=\s*(?:"([^"]*)"|'([^']*)')/gi,
    (match, d, s) => {
      const val = d ?? s ?? "";
      return SAFE_PROTOCOLS.test(val) ? match : "";
    }
  );

  // Remove other banned attrs
  for (const attr of BANNED_ATTRS) {
    if (attr === "href") continue; // handled above
    const re = new RegExp(`\\s+${attr}\\s*=\\s*(?:"[^"]*"|'[^']*'|[^\\s>]+)`, "gi");
    svg = svg.replace(re, "");
  }

  // Remove javascript: protocol anywhere
  svg = svg.replace(/javascript:/gi, "");

  return svg;
}
