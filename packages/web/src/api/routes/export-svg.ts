import { Hono } from "hono";
import potrace from "potrace";

const app = new Hono();

app.post("/export-svg", async (c) => {
  try {
    const { imageDataUrl, fillColor } = await c.req.json<{
      imageDataUrl: string;
      fillColor?: string;
    }>();

    if (!imageDataUrl) return c.json({ error: "No image data" }, 400);

    const base64Match = imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!base64Match) return c.json({ error: "Invalid image data" }, 400);

    const buffer = Buffer.from(base64Match[2]!, "base64");

    const svg = await new Promise<string>((resolve, reject) => {
      potrace.trace(buffer, {
        background: fillColor ?? "#050505",
        color: "#ffffff",
        threshold: 128,
        turdSize: 2,
        optCurve: true,
        optTolerance: 0.2,
      }, (err: Error | null, svg: string) => {
        if (err) reject(err);
        else resolve(svg);
      });
    });

    return c.text(svg, 200, { "Content-Type": "image/svg+xml" });
  } catch (err: any) {
    console.error("SVG export error:", err);
    return c.json({ error: err?.message ?? "SVG export failed" }, 500);
  }
});

export default app;
