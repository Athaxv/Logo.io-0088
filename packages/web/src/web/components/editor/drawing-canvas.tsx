import {
  useRef, useEffect, useImperativeHandle, forwardRef, useCallback, useState,
} from "react";
import type { ToolType, ShapeType } from "./editor-toolbar";
import { cn } from "@/lib/utils";

export interface DrawingCanvasHandle {
  getDataURL: () => string;
  getUsedColors: () => string[];
  clear: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  downloadSVG: () => Promise<void>;
  floodFill: (x: number, y: number, fillColor: string) => void;
}

interface DrawingCanvasProps {
  activeTool: ToolType;
  shapeType: ShapeType;
  strokeColor: string;
  strokeWidth: number;
  eraserSize: number;
  fillColor: string;
  logoUrl: string | null;
  onHistoryChange: (canUndo: boolean, canRedo: boolean) => void;
  onExportStart?: () => void;
  onExportEnd?: () => void;
  className?: string;
  // When set, pointer-down does flood fill instead of drawing
  floodFillColor?: string | null;
}

const MAX_HISTORY = 30;

// ── Flood fill (scanline) ──────────────────────────────────────────────────────
function hexToRgba(hex: string): [number, number, number, number] {
  const c = hex.replace("#", "");
  if (c.length === 3) {
    return [
      parseInt(c[0]! + c[0]!, 16),
      parseInt(c[1]! + c[1]!, 16),
      parseInt(c[2]! + c[2]!, 16),
      255,
    ];
  }
  return [
    parseInt(c.slice(0, 2), 16),
    parseInt(c.slice(2, 4), 16),
    parseInt(c.slice(4, 6), 16),
    255,
  ];
}

function colorsMatch(
  data: Uint8ClampedArray,
  idx: number,
  r: number, g: number, b: number, a: number,
  tolerance = 32,
): boolean {
  return (
    Math.abs(data[idx]! - r) <= tolerance &&
    Math.abs(data[idx + 1]! - g) <= tolerance &&
    Math.abs(data[idx + 2]! - b) <= tolerance &&
    Math.abs(data[idx + 3]! - a) <= tolerance
  );
}

function floodFillCanvas(
  canvas: HTMLCanvasElement,
  startX: number,
  startY: number,
  fillHex: string,
) {
  const ctx = canvas.getContext("2d")!;
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const sx = Math.floor(startX);
  const sy = Math.floor(startY);
  if (sx < 0 || sy < 0 || sx >= width || sy >= height) return;

  const startIdx = (sy * width + sx) * 4;
  const targetR = data[startIdx]!;
  const targetG = data[startIdx + 1]!;
  const targetB = data[startIdx + 2]!;
  const targetA = data[startIdx + 3]!;

  // Don't fill transparent/background areas — only fill drawn strokes
  if (targetA < 32) return;

  const [fillR, fillG, fillB, fillA] = hexToRgba(fillHex);

  // Already same color
  if (
    colorsMatch(data, startIdx, fillR, fillG, fillB, fillA, 4)
  ) return;

  const visited = new Uint8Array(width * height);
  const stack: number[] = [sy * width + sx];

  while (stack.length > 0) {
    const pos = stack.pop()!;
    const x = pos % width;
    const y = (pos - x) / width;

    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    if (visited[pos]) continue;
    const idx = pos * 4;
    // Never spread into transparent pixels
    if (data[idx + 3]! < 32) continue;
    if (!colorsMatch(data, idx, targetR, targetG, targetB, targetA)) continue;

    visited[pos] = 1;
    data[idx] = fillR;
    data[idx + 1] = fillG;
    data[idx + 2] = fillB;
    data[idx + 3] = fillA;

    stack.push(pos - 1, pos + 1, pos - width, pos + width);
  }

  ctx.putImageData(imageData, 0, 0);
}

export const DrawingCanvas = forwardRef<DrawingCanvasHandle, DrawingCanvasProps>(
  ({
    activeTool, shapeType, strokeColor, strokeWidth, eraserSize, fillColor,
    logoUrl, onHistoryChange, onExportStart, onExportEnd, className,
    floodFillColor,
  }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDrawing = useRef(false);
    const lastPoint = useRef<{ x: number; y: number } | null>(null);
    const shapeStart = useRef<{ x: number; y: number } | null>(null);
    const snapshotRef = useRef<ImageData | null>(null);
    const historyRef = useRef<ImageData[]>([]);
    const historyIndexRef = useRef(-1);
    const [hasStrokes, setHasStrokes] = useState(false);
    const usedColorsRef = useRef<Set<string>>(new Set());

    // ── When logoUrl arrives, draw it onto the canvas ──────────────────────
    useEffect(() => {
      if (!logoUrl) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d")!;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = fillColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (canvas.width - w) / 2;
        const y = (canvas.height - h) / 2;
        ctx.drawImage(img, x, y, w, h);
      };
      img.src = logoUrl;
    }, [logoUrl, fillColor]);

    const initCanvas = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
      ctx.clearRect(0, 0, w, h);
    }, []);

    useEffect(() => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const observer = new ResizeObserver(() => {
        const { width, height } = container.getBoundingClientRect();
        const ctx = canvas.getContext("2d")!;
        const saved = ctx.getImageData(0, 0, canvas.width, canvas.height);
        canvas.width = width;
        canvas.height = height;
        initCanvas(ctx, width, height);
        if (saved.width > 0 && saved.height > 0) ctx.putImageData(saved, 0, 0);
      });
      observer.observe(container);
      return () => observer.disconnect();
    }, [initCanvas]);

    // ── history ────────────────────────────────────────────────────────────
    const saveSnapshot = useCallback(() => {
      const canvas = canvasRef.current; if (!canvas) return;
      const data = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height);
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
      historyRef.current.push(data);
      if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift();
      else historyIndexRef.current++;
      onHistoryChange(historyIndexRef.current > 0, historyIndexRef.current < historyRef.current.length - 1);
    }, [onHistoryChange]);

    const undo = useCallback(() => {
      if (historyIndexRef.current <= 0) return;
      historyIndexRef.current--;
      const canvas = canvasRef.current; if (!canvas) return;
      canvas.getContext("2d")!.putImageData(historyRef.current[historyIndexRef.current]!, 0, 0);
      if (historyIndexRef.current === 0) setHasStrokes(false);
      onHistoryChange(historyIndexRef.current > 0, historyIndexRef.current < historyRef.current.length - 1);
    }, [onHistoryChange]);

    const redo = useCallback(() => {
      if (historyIndexRef.current >= historyRef.current.length - 1) return;
      historyIndexRef.current++;
      const canvas = canvasRef.current; if (!canvas) return;
      canvas.getContext("2d")!.putImageData(historyRef.current[historyIndexRef.current]!, 0, 0);
      setHasStrokes(true);
      onHistoryChange(historyIndexRef.current > 0, historyIndexRef.current < historyRef.current.length - 1);
    }, [onHistoryChange]);

    const clear = useCallback(() => {
      const canvas = canvasRef.current; if (!canvas) return;
      canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
      setHasStrokes(false);
      saveSnapshot();
    }, [saveSnapshot]);

    const getDataURL = useCallback((): string => {
      const src = canvasRef.current!;
      const off = document.createElement("canvas");
      off.width = src.width; off.height = src.height;
      const ctx = off.getContext("2d")!;
      ctx.fillStyle = fillColor;
      ctx.fillRect(0, 0, off.width, off.height);
      ctx.drawImage(src, 0, 0);
      return off.toDataURL("image/png");
    }, [fillColor]);

    const floodFill = useCallback((x: number, y: number, color: string) => {
      const canvas = canvasRef.current; if (!canvas) return;
      floodFillCanvas(canvas, x, y, color);
      usedColorsRef.current.add(color);
      setHasStrokes(true);
      saveSnapshot();
    }, [saveSnapshot]);

    const downloadSVG = useCallback(async (): Promise<void> => {
      onExportStart?.();
      try {
        const dataUrl = getDataURL();
        const base64 = dataUrl.split(",")[1]!;
        const res = await fetch("/api/export-svg", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64 }),
        });
        if (!res.ok) throw new Error("Export failed");
        const svgText = await res.text();
        const blob = new Blob([svgText], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "logo.svg";
        a.click();
        URL.revokeObjectURL(url);
      } finally {
        onExportEnd?.();
      }
    }, [getDataURL, onExportStart, onExportEnd]);

    useImperativeHandle(ref, () => ({
      getDataURL,
      getUsedColors: () => Array.from(usedColorsRef.current),
      clear: () => { clear(); usedColorsRef.current.clear(); },
      undo, redo,
      canUndo: () => historyIndexRef.current > 0,
      canRedo: () => historyIndexRef.current < historyRef.current.length - 1,
      downloadSVG,
      floodFill,
    }));

    // ── pointer helpers ────────────────────────────────────────────────────
    const getPos = (e: React.PointerEvent) => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height),
      };
    };

    const drawShape = useCallback(
      (ctx: CanvasRenderingContext2D, start: { x: number; y: number }, end: { x: number; y: number }, live = false) => {
        if (live && snapshotRef.current) ctx.putImageData(snapshotRef.current, 0, 0);
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.globalCompositeOperation = "source-over";
        ctx.beginPath();
        const w = end.x - start.x, h = end.y - start.y;
        const cx = start.x + w / 2, cy = start.y + h / 2;
        const rx = Math.abs(w) / 2, ry = Math.abs(h) / 2;

        if (shapeType === "rect") {
          ctx.strokeRect(start.x, start.y, w, h);
        } else if (shapeType === "rounded-rect") {
          const r = Math.min(Math.abs(w), Math.abs(h)) * 0.15;
          ctx.roundRect(start.x, start.y, w, h, r);
          ctx.stroke();
        } else if (shapeType === "circle") {
          const r = Math.sqrt(w * w + h * h) / 2;
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();
        } else if (shapeType === "oval") {
          ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
          ctx.stroke();
        } else if (shapeType === "triangle") {
          ctx.moveTo(cx, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.lineTo(start.x, end.y);
          ctx.closePath();
          ctx.stroke();
        } else if (shapeType === "right-triangle") {
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(start.x, end.y);
          ctx.lineTo(end.x, end.y);
          ctx.closePath();
          ctx.stroke();
        } else if (shapeType === "diamond") {
          ctx.moveTo(cx, start.y);
          ctx.lineTo(end.x, cy);
          ctx.lineTo(cx, end.y);
          ctx.lineTo(start.x, cy);
          ctx.closePath();
          ctx.stroke();
        } else if (shapeType === "pentagon") {
          const pts = 5;
          for (let i = 0; i < pts; i++) {
            const a = (i * 2 * Math.PI) / pts - Math.PI / 2;
            const px = cx + rx * Math.cos(a), py = cy + ry * Math.sin(a);
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
          }
          ctx.closePath(); ctx.stroke();
        } else if (shapeType === "hexagon") {
          for (let i = 0; i < 6; i++) {
            const a = (i * Math.PI) / 3 - Math.PI / 6;
            const px = cx + rx * Math.cos(a), py = cy + ry * Math.sin(a);
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
          }
          ctx.closePath(); ctx.stroke();
        } else if (shapeType === "octagon") {
          for (let i = 0; i < 8; i++) {
            const a = (i * Math.PI) / 4 + Math.PI / 8;
            const px = cx + rx * Math.cos(a), py = cy + ry * Math.sin(a);
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
          }
          ctx.closePath(); ctx.stroke();
        } else if (shapeType === "star") {
          const spikes = 5, outerR = Math.min(rx, ry), innerR = outerR * 0.4;
          for (let i = 0; i < spikes * 2; i++) {
            const a = (i * Math.PI) / spikes - Math.PI / 2;
            const r2 = i % 2 === 0 ? outerR : innerR;
            const px = cx + (rx / outerR) * r2 * Math.cos(a);
            const py = cy + (ry / outerR) * r2 * Math.sin(a);
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
          }
          ctx.closePath(); ctx.stroke();
        } else if (shapeType === "arrow") {
          const headLen = Math.min(Math.abs(w) * 0.35, Math.abs(h) * 0.8);
          const bodyH = Math.abs(h) * 0.35;
          const dir = w >= 0 ? 1 : -1;
          const top = start.y, bottom = end.y, mid = cy;
          const bodyLeft = start.x, bodyRight = end.x - dir * headLen;
          ctx.moveTo(bodyLeft, mid - bodyH / 2);
          ctx.lineTo(bodyRight, mid - bodyH / 2);
          ctx.lineTo(bodyRight, top);
          ctx.lineTo(end.x, mid);
          ctx.lineTo(bodyRight, bottom);
          ctx.lineTo(bodyRight, mid + bodyH / 2);
          ctx.lineTo(bodyLeft, mid + bodyH / 2);
          ctx.closePath(); ctx.stroke();
        } else if (shapeType === "cross") {
          const tw = Math.abs(w) * 0.33, th = Math.abs(h) * 0.33;
          ctx.moveTo(cx - tw / 2, start.y); ctx.lineTo(cx + tw / 2, start.y);
          ctx.lineTo(cx + tw / 2, cy - th / 2); ctx.lineTo(end.x, cy - th / 2);
          ctx.lineTo(end.x, cy + th / 2); ctx.lineTo(cx + tw / 2, cy + th / 2);
          ctx.lineTo(cx + tw / 2, end.y); ctx.lineTo(cx - tw / 2, end.y);
          ctx.lineTo(cx - tw / 2, cy + th / 2); ctx.lineTo(start.x, cy + th / 2);
          ctx.lineTo(start.x, cy - th / 2); ctx.lineTo(cx - tw / 2, cy - th / 2);
          ctx.closePath(); ctx.stroke();
        } else if (shapeType === "heart") {
          // Bezier heart scaled to bounding box
          const x0 = start.x, y0 = start.y;
          ctx.moveTo(cx, end.y);
          ctx.bezierCurveTo(start.x, cy, x0, y0, cx, start.y + ry * 0.5);
          ctx.bezierCurveTo(end.x, y0, end.x, cy, cx, end.y);
          ctx.stroke();
        } else {
          // line
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();
        }
      },
      [shapeType, strokeColor, strokeWidth]
    );

    const onPointerDown = useCallback((e: React.PointerEvent) => {
      if (logoUrl) return;
      const pos = getPos(e);

      // Flood fill mode — single click fills, no drag
      if (floodFillColor) {
        floodFillCanvas(canvasRef.current!, pos.x, pos.y, floodFillColor);
        usedColorsRef.current.add(floodFillColor);
        setHasStrokes(true);
        saveSnapshot();
        return;
      }

      canvasRef.current!.setPointerCapture(e.pointerId);
      isDrawing.current = true;
      lastPoint.current = pos;
      const ctx = canvasRef.current!.getContext("2d")!;

      if (activeTool === "shapes") {
        shapeStart.current = pos;
        snapshotRef.current = ctx.getImageData(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      } else if (activeTool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = eraserSize;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, eraserSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = strokeColor;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, strokeWidth / 2, 0, Math.PI * 2);
        ctx.fill();
        setHasStrokes(true);
      }
    }, [activeTool, strokeColor, strokeWidth, eraserSize, logoUrl, floodFillColor, saveSnapshot]);

    const onPointerMove = useCallback((e: React.PointerEvent) => {
      if (!isDrawing.current || logoUrl || floodFillColor) return;
      const ctx = canvasRef.current!.getContext("2d")!;
      const pos = getPos(e);

      if (activeTool === "shapes" && shapeStart.current) {
        drawShape(ctx, shapeStart.current, pos, true);
      } else {
        const last = lastPoint.current ?? pos;
        if (activeTool === "eraser") {
          ctx.globalCompositeOperation = "destination-out";
          ctx.lineWidth = eraserSize;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.beginPath();
          ctx.moveTo(last.x, last.y);
          ctx.lineTo(pos.x, pos.y);
          ctx.stroke();
          ctx.globalCompositeOperation = "source-over";
        } else {
          ctx.globalCompositeOperation = "source-over";
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = strokeWidth;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.beginPath();
          ctx.moveTo(last.x, last.y);
          ctx.lineTo(pos.x, pos.y);
          ctx.stroke();
          setHasStrokes(true);
        }
      }
      lastPoint.current = pos;
    }, [activeTool, strokeColor, strokeWidth, eraserSize, drawShape, logoUrl, floodFillColor]);

    const onPointerUp = useCallback((e: React.PointerEvent) => {
      if (!isDrawing.current) return;
      isDrawing.current = false;
      if (activeTool === "shapes" && shapeStart.current) {
        const ctx = canvasRef.current!.getContext("2d")!;
        drawShape(ctx, shapeStart.current, getPos(e), true);
        shapeStart.current = null;
        snapshotRef.current = null;
        setHasStrokes(true);
      }
      if (activeTool !== "eraser") usedColorsRef.current.add(strokeColor);
      saveSnapshot();
      lastPoint.current = null;
    }, [activeTool, strokeColor, drawShape, saveSnapshot]);

    const cursor = floodFillColor
      ? "crosshair"
      : logoUrl
        ? "default"
        : activeTool === "eraser"
          ? "cell"
          : "crosshair";

    return (
      <div ref={containerRef} className={cn("absolute inset-0", className)} style={{ background: "transparent" }}>

        <canvas
          ref={canvasRef}
          className={cn("absolute inset-0 w-full h-full")}
          style={{ cursor }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        />

        {/* fill mode overlay hint */}
        {floodFillColor && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
            <div
              className="flex items-center gap-2 px-3 py-1.5 border-2 border-[#1a1aff]/30 text-xs text-[#1a1aff]/70 bg-white"
              style={{ fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 700, letterSpacing: '0.1em' }}
            >
              <span className="size-3 rounded border border-[#1a1aff]/30 shrink-0" style={{ background: floodFillColor }} />
              CLICK TO FLOOD FILL
            </div>
          </div>
        )}


      </div>
    );
  }
);

DrawingCanvas.displayName = "DrawingCanvas";
