import { Hono } from "hono";
import { generateText, streamText } from "ai";
import { gateway } from "../lib/gateway";
import { buildSVG, type LogoSpec } from "../lib/svg-builder";
import { sanitizeSVG } from "../lib/svg-sanitize";

const app = new Hono();

app.post("/generate-svg-logo", async (c) => {
  try {
    const { sketchDataUrl, prompt, currentSvg, sketchContext, referenceImageBase64, referenceImageMime } = await c.req.json<{
      sketchDataUrl: string;
      prompt: string;
      currentSvg?: string;
      referenceImageBase64?: string;
      referenceImageMime?: string;
      sketchContext?: {
        strokeColor: string;
        backgroundColor: string;
        usedColors: string[];
        activeTool: string;
        shapeType?: string;
      };
    }>();

    if (!sketchDataUrl) return c.json({ error: "No sketch provided" }, 400);
    if (!prompt?.trim()) return c.json({ error: "No prompt provided" }, 400);

    const base64Match = sketchDataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!base64Match) return c.json({ error: "Invalid sketch image" }, 400);

    const mimeType = base64Match[1]!;
    const base64Data = base64Match[2]!;

    // ── Step 1: Analyze sketch + prompt → logo spec JSON ─────────────────
    const specPrompt = `You are a world-class SVG logo designer with deep expertise in brand identity, geometric construction, and vector illustration. Your task: analyze the hand-drawn sketch and the text prompt, then output a precise logo spec as JSON.

TEXT PROMPT: "${prompt}"
${referenceImageBase64 ? `
━━━ WEB REFERENCE IMAGE ━━━
A reference image has been fetched from the web for "${prompt}". The SECOND image provided is this reference.
Study it carefully: extract its color palette, visual style, geometry, and overall aesthetic.
Use these as your primary design source — the logo you generate should feel visually related to this reference.
Do NOT copy it exactly, but capture its essence: colors, proportions, shape language, and brand feel.
` : ""}
${sketchContext ? `
━━━ SKETCH CONTEXT (exact metadata from the drawing tool) ━━━
The user drew this sketch using the following settings — treat these as ground truth for the logo's color palette and shape language:

• Stroke / drawing color: ${sketchContext.strokeColor}
• Canvas background color: ${sketchContext.backgroundColor}
• All colors used in this sketch: ${sketchContext.usedColors.join(", ")}
• Drawing tool: ${sketchContext.activeTool}${sketchContext.shapeType ? `\n• Shape drawn: ${sketchContext.shapeType}` : ""}

COLOR RULES from sketch context:
- The PRIMARY color of the logo MUST be: ${sketchContext.usedColors[0]}
- If multiple colors were used (${sketchContext.usedColors.join(", ")}), use them as the logo's palette in that order
- The background of the canvas was ${sketchContext.backgroundColor} — if it's dark (#000 or similar), design for a dark background; if light/white, design for light background
- Do NOT invent colors that contradict what was drawn — the sketch colors ARE the brand colors
${sketchContext.shapeType ? `
SHAPE RULES from sketch context:
- The user explicitly drew a "${sketchContext.shapeType}" shape — the logo's primary visual element MUST be or incorporate a ${sketchContext.shapeType}
- Use the exact vertex coordinates from the SHAPE CONSTRUCTION RULES section for this shape type` : ""}
` : ""}
${currentSvg ? `
CURRENT SVG TO REFINE:
${currentSvg}

Refine the above SVG — preserve its structure and composition, only apply what the new prompt/sketch requests.
` : ""}

━━━ DESIGN PRINCIPLES ━━━
Think like a professional logo designer. The best logos have:
• BOLD FILLED SHAPES — solid filled paths, not thin strokes. Think Nike swoosh, Apple logo, FedEx arrow.
• NEGATIVE SPACE — use cutouts and compound paths to create clever hidden shapes within filled areas.
• GEOMETRIC PRECISION — use exact coordinates and math. Triangles: calculate all 3 vertices exactly. Stars: outer radius / inner radius with exact angle math. Polygons: evenly spaced vertices on a circle.
• ORGANIC CURVES — use cubic bezier curves (C commands) for smooth, flowing, professional shapes. Avoid jagged or boxy paths.
• OPTICAL BALANCE — center of visual mass at (256,256). Symmetric shapes must be truly symmetric.
• MINIMAL ELEMENTS — 3-8 elements max. Every element must be essential. Quality over quantity.
• DEPTH & DIMENSION — use 2-3 tones of the same hue (light, mid, dark) to create 3D/isometric illusions when relevant.

━━━ SHAPE CONSTRUCTION RULES ━━━
TRIANGLES (pointing UP):
  Top point: (256, 80), Bottom-left: (100, 400), Bottom-right: (412, 400)
  Path: "M 256 80 L 412 400 L 100 400 Z"
  
TRIANGLES (pointing DOWN):
  Top-left: (100, 112), Top-right: (412, 112), Bottom point: (256, 430)
  Path: "M 100 112 L 412 112 L 256 430 Z"

TRIANGLES (pointing RIGHT):
  Left-top: (80, 112), Left-bottom: (80, 400), Right point: (430, 256)
  Path: "M 80 112 L 80 400 L 430 256 Z"

TRIANGLES (pointing LEFT):
  Right-top: (430, 112), Right-bottom: (430, 400), Left point: (80, 256)
  Path: "M 430 112 L 430 400 L 80 256 Z"

5-POINT STAR (centered 256,256, outer r=200, inner r=80):
  Outer points at angles: -90°, -18°, 54°, 126°, 198° (from top, clockwise)
  Outer vertices: (256,56), (446,201), (370,432), (142,432), (66,201)
  Inner vertices (midway angles, r=80): (256,176), (332,208), (308,304), (204,304), (180,208)
  Path: "M 256 56 L 332 208 L 446 201 L 308 304 L 370 432 L 256 336 L 142 432 L 204 304 L 66 201 L 180 208 Z"

HEXAGON (centered 256,256, r=200):
  Points: (256,56), (429,156), (429,356), (256,456), (83,356), (83,156)
  Polygon points: "256,56 429,156 429,356 256,456 83,356 83,156"

DIAMOND: (256,60), (452,256), (256,452), (60,256)

ARROW (pointing right, bold filled):
  Body rect + triangle head as compound path:
  "M 60 220 L 320 220 L 320 160 L 452 256 L 320 352 L 320 292 L 60 292 Z"

COMPOUND PATHS (negative space / cutouts):
  Use "fill-rule": "evenodd" to punch holes. First subpath = outer shape, second subpath = hole.
  Example ring: "M 256 56 A 200 200 0 1 1 256 456 A 200 200 0 1 1 256 56 Z M 256 156 A 100 100 0 1 1 256 356 A 100 100 0 1 1 256 156 Z"

ORGANIC/FLOWING LOGOS (like lettermarks, abstract marks):
  Use cubic bezier curves heavily: C x1 y1, x2 y2, x y
  For rounded/organic shapes, chain multiple C and S commands.
  Example flowing shape: "M 200 100 C 150 50, 80 120, 100 200 C 120 280, 200 300, 256 280 C 320 260, 380 200, 360 130 C 340 60, 270 80, 200 100 Z"

ISOMETRIC / 3D CUBE:
  Front face: "M 256 180 L 356 236 L 356 348 L 256 404 L 156 348 L 156 236 Z"
  Top face (lighter): "M 256 68 L 356 124 L 256 180 L 156 124 Z"
  Right face (darker): "M 356 124 L 456 180 L 456 292 L 356 348 L 356 236 L 356 124 Z"

━━━ OUTPUT FORMAT ━━━
Output ONLY a valid JSON object — no markdown fences, no explanation, no trailing commas.

{
  "prompt": "${prompt}",
  "logoType": "icon|lettermark|wordmark|combination|abstract|emblem",
  "style": "minimalist|geometric|bold|organic|tech|elegant|isometric|3d",
  "composition": "one-sentence description of the layout and visual idea",
  "palette": ["#primaryHex", "#secondaryHex", "#accentHex"],
  "background": "transparent",
  "elements": [
    {
      "type": "path",
      "d": "M ... Z",
      "fill": "#hex",
      "fillRule": "evenodd",
      "stroke": "none",
      "strokeWidth": 0,
      "opacity": 1,
      "transform": ""
    }
  ]
}

━━━ CRITICAL RULES ━━━
1. viewBox is ALWAYS "0 0 512 512". Center designs at (256, 256).
2. ALWAYS use "type": "path" for complex shapes — never polygon/polyline for anything that has curves or compound shapes.
3. ALL path "d" values must be 100% valid SVG path syntax. Use only: M, L, H, V, C, S, Q, T, A, Z commands.
4. FILLED logos: use solid fills, set stroke to "none" unless it's a stroke-based design.
5. For 3D/isometric logos: use 3 tones of one hue (e.g. #4A90E2, #2F6DC4, #1A4A8A for top/front/side faces).
6. For organic/abstract logos: use bezier curves (C S commands), not just L (straight lines).
7. Negative space / cutouts: use fillRule "evenodd" and compound paths (multiple M...Z subpaths in one "d").
8. Keep element count between 2–8 for a clean, professional logo.
9. NEVER output a logo that is just a single circle or single rectangle — always compose meaningful shapes.
10. Interpret the sketch's SPATIAL INTENT: if you see a triangle, determine which direction it points (up/down/left/right) and use the correct vertex coordinates from the rules above.`;

    // ── Step 1: Stream spec from AI (streaming keeps connection alive, avoids timeout) ──
    // Build content array — always include sketch, optionally include web reference image
    const userContent: any[] = [
      {
        type: "image",
        image: base64Data,
        mimeType: mimeType as "image/png" | "image/jpeg" | "image/webp",
      },
    ];

    // Inject reference image as second image if we have one
    if (referenceImageBase64 && referenceImageMime) {
      userContent.push({
        type: "image",
        image: referenceImageBase64,
        mimeType: referenceImageMime as "image/png" | "image/jpeg" | "image/webp",
      });
    }

    userContent.push({
      type: "text",
      text: specPrompt,
    });

    const stream = streamText({
      model: gateway("google/gemini-2.5-flash"),
      messages: [{ role: "user", content: userContent }],
    });

    // Collect all streamed chunks into full text
    let specText = "";
    for await (const chunk of (await stream).textStream) {
      specText += chunk;
    }
    specText = specText.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();

    // ── Step 2: Parse spec JSON ────────────────────────────────────────────
    let spec: LogoSpec;
    try {
      spec = JSON.parse(specText);
    } catch {
      const fixResult = await generateText({
        model: gateway("google/gemini-2.5-flash"),
        messages: [
          {
            role: "user",
            content: `The following is invalid JSON. Fix ALL syntax errors (trailing commas, unquoted keys, etc.) and return ONLY the corrected JSON object, nothing else:\n\n${specText}`,
          },
        ],
      });
      let fixed = fixResult.text.trim();
      fixed = fixed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
      spec = JSON.parse(fixed);
    }

    // ── Step 3: Build SVG from spec ───────────────────────────────────────
    let svg = buildSVG(spec);

    // ── Step 4: Sanitize ──────────────────────────────────────────────────
    svg = sanitizeSVG(svg);

    return c.json({ svg, spec }, 200);
  } catch (err: any) {
    console.error("SVG logo generation error:", err);
    return c.json({ error: err?.message ?? "Generation failed" }, 500);
  }
});

export default app;
