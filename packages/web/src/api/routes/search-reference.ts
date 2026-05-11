import { Hono } from "hono";

const app = new Hono();

async function fetchImageAsBase64(url: string): Promise<{ base64: string; mime: string } | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const mime = res.headers.get("content-type")?.split(";")[0] ?? "image/jpeg";
    if (!mime.startsWith("image/")) return null;
    const buf = await res.arrayBuffer();
    // Skip if too large (>2MB) or too small (<1KB)
    if (buf.byteLength > 2_000_000 || buf.byteLength < 1_000) return null;
    const base64 = Buffer.from(buf).toString("base64");
    return { base64, mime };
  } catch {
    return null;
  }
}

app.post("/search-reference", async (c) => {
  try {
    const { prompt } = await c.req.json<{ prompt: string }>();
    if (!prompt?.trim()) return c.json({ error: "No prompt" }, 400);

    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) return c.json({ found: false, error: "No Tavily API key" }, 200);

    // Build a focused search query
    const searchQuery = `${prompt} logo brand identity`;

    // Tavily search — topic:"general", include_images: true
    const tavilyRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query: searchQuery,
        topic: "general",
        search_depth: "basic",
        include_images: true,
        include_image_descriptions: false,
        max_results: 5,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!tavilyRes.ok) {
      const err = await tavilyRes.text();
      console.error("Tavily error:", tavilyRes.status, err);
      return c.json({ found: false }, 200);
    }

    const data = await tavilyRes.json() as { images?: string[] };
    const imageUrls: string[] = (data.images ?? []).filter(Boolean).slice(0, 5);

    if (!imageUrls.length) return c.json({ found: false }, 200);

    // Try each image URL until one fetches successfully
    for (const url of imageUrls) {
      const img = await fetchImageAsBase64(url);
      if (img) {
        return c.json({
          found: true,
          base64: img.base64,
          mime: img.mime,
          sourceUrl: url,
          query: searchQuery,
        }, 200);
      }
    }

    return c.json({ found: false }, 200);
  } catch (err: any) {
    console.error("search-reference error:", err);
    return c.json({ found: false, error: err?.message }, 200); // soft fail
  }
});

export default app;
