import { useRef, useState, useCallback, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { AlertCircle, Copy, Download, Globe } from "lucide-react";
import { EditorHeader } from "../components/editor/editor-header";
import { DrawingCanvas, type DrawingCanvasHandle } from "../components/editor/drawing-canvas";
import { EditorPromptBar } from "../components/editor/editor-prompt-bar";
import type { ToolType, ShapeType } from "../components/editor/editor-toolbar";

interface SketchContext {
  strokeColor: string;
  backgroundColor: string;
  usedColors: string[];
  activeTool: ToolType;
  shapeType?: ShapeType;
}
import type { LogoSpec, LogoElement } from "../lib/logo-types";
import { buildSVGClient, downloadSVGString, exportSVGAsPNG } from "../lib/svg-builder-client";

interface GenerateSVGResponse {
  svg?: string;
  spec?: LogoSpec;
  error?: string;
}

const TOOLBAR_HEIGHT = 0;

// ─── Remotion-style keyframes injected once ────────────────────────────────────
const EDITOR_STYLES = `
  @keyframes editorFadeUp {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes editorScaleIn {
    from { opacity: 0; transform: scale(0.88) translateY(24px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes editorFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes errorSlideDown {
    from { opacity: 0; transform: translateX(-50%) translateY(-12px); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
  @keyframes svgReveal {
    from { opacity: 0; transform: scale(0.88) translateY(24px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes actionBarIn {
    from { opacity: 0; transform: translateY(12px) scale(0.95); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes canvasIn {
    from { opacity: 0; transform: scale(0.97); }
    to   { opacity: 1; transform: scale(1); }
  }
  .editor-canvas-enter { animation: canvasIn 0.65s cubic-bezier(0.16,1,0.3,1) 0.1s both; }
  .editor-svg-reveal   { animation: svgReveal 0.6s cubic-bezier(0.34,1.56,0.64,1) both; }
  .editor-action-bar   { animation: actionBarIn 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.22s both; }
  .editor-error-in     { animation: errorSlideDown 0.45s cubic-bezier(0.16,1,0.3,1) both; }
  .editor-prompt-in    { animation: editorFadeUp 0.65s cubic-bezier(0.16,1,0.3,1) 0.18s both; }
`;

export default function EditorPage() {
  const [activeTool,   setActiveTool]   = useState<ToolType>("pen");
  const [shapeType,    setShapeType]    = useState<ShapeType>("rect");
  const [strokeColor,  setStrokeColor]  = useState("#1a1aff");
  const [strokeWidth,  setStrokeWidth]  = useState(3);
  const [eraserSize,   setEraserSize]   = useState(20);
  const [fillColor,    setFillColor]    = useState("#ffffff");
  const [canUndo,      setCanUndo]      = useState(false);
  const [canRedo,      setCanRedo]      = useState(false);

  const [logoUrl,   setLogoUrl]   = useState<string | null>(null);
  const [svgResult, setSvgResult] = useState<string | null>(null);
  const [svgSpec,   setSvgSpec]   = useState<LogoSpec | null>(null);
  const [error,     setError]     = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const [activePaintColor,    setActivePaintColor]    = useState<string>("#1a1aff");
  const [selectedElementIndex, setSelectedElementIndex] = useState<number | null>(null);
  const [isColorPanelOpen,    setIsColorPanelOpen]    = useState(false);
  const [svgVisible,          setSvgVisible]          = useState(false);
  const [zoom,                setZoom]                = useState(1);

  const handleZoomIn  = useCallback(() => setZoom(z => Math.min(3, Math.round((z + 0.25) * 100) / 100)), []);
  const handleZoomOut = useCallback(() => setZoom(z => Math.max(0.25, Math.round((z - 0.25) * 100) / 100)), []);

  const canvasRef = useRef<DrawingCanvasHandle>(null);
  const [liveSvg, setLiveSvg] = useState<string | null>(null);
  const [isSearchingRef, setIsSearchingRef] = useState(false);
  const [referenceFound, setReferenceFound] = useState<{ url: string; query: string } | null>(null);

  useEffect(() => {
    if (svgSpec) setLiveSvg(buildSVGClient(svgSpec));
  }, [svgSpec]);

  const currentSvg = liveSvg ?? svgResult;

  useEffect(() => {
    if (currentSvg) {
      setSvgVisible(false);
      const t = setTimeout(() => setSvgVisible(true), 60);
      return () => clearTimeout(t);
    } else {
      setSvgVisible(false);
    }
  }, [!!currentSvg]);

  const { mutate: generateSVG, isPending: isGeneratingSVG } = useMutation<
    GenerateSVGResponse, Error, { sketchDataUrl: string; prompt: string; currentSvg?: string; sketchContext?: SketchContext; referenceImageBase64?: string; referenceImageMime?: string; }
  >({
    mutationFn: async ({ sketchDataUrl, prompt, currentSvg, sketchContext, referenceImageBase64, referenceImageMime }) => {
      const res = await fetch("/api/generate-svg-logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sketchDataUrl, prompt, currentSvg, sketchContext, referenceImageBase64, referenceImageMime }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.error) {
        setError(data.error);
      } else if (data.svg && data.spec) {
        setSvgResult(data.svg);
        setSvgSpec(data.spec);
        setLiveSvg(null);
        setLogoUrl(null);
        setSelectedElementIndex(null);
        setError(null);
      }
    },
    onError: (err) => setError(err.message ?? "Generation failed. Try again."),
  });

  const isGenerating = isGeneratingSVG || isSearchingRef;

  const handleGenerate = useCallback(async (prompt: string) => {
    if (!canvasRef.current) return;
    const svgToRefine = currentSvg ?? undefined;

    const usedColors = canvasRef.current.getUsedColors();
    const sketchContext: SketchContext = {
      strokeColor,
      backgroundColor: fillColor,
      usedColors: usedColors.length > 0 ? usedColors : [strokeColor],
      activeTool,
      shapeType: activeTool === "shapes" ? shapeType : undefined,
    };

    setError(null);
    setSvgResult(null);
    setSvgSpec(null);
    setLiveSvg(null);
    setSelectedElementIndex(null);
    setReferenceFound(null);

    // ── Web search: fetch a reference image to ground the generation ──
    let referenceImageBase64: string | undefined;
    let referenceImageMime: string | undefined;
    try {
      setIsSearchingRef(true);
      const refRes = await fetch("/api/search-reference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const refData = await refRes.json();
      if (refData.found && refData.base64) {
        referenceImageBase64 = refData.base64;
        referenceImageMime = refData.mime;
        setReferenceFound({ url: refData.sourceUrl, query: refData.query });
      }
    } catch {
      // silently continue without reference
    } finally {
      setIsSearchingRef(false);
    }

    generateSVG({
      sketchDataUrl: canvasRef.current.getDataURL(),
      prompt,
      currentSvg: svgToRefine,
      sketchContext,
      referenceImageBase64,
      referenceImageMime,
    });
  }, [generateSVG, currentSvg, strokeColor, fillColor, activeTool, shapeType]);

  const handleEditAgain = useCallback(() => {
    setLogoUrl(null);
    setSvgResult(null);
    setSvgSpec(null);
    setLiveSvg(null);
    setError(null);
    setSelectedElementIndex(null);
    canvasRef.current?.clear();
  }, []);

  const handleDownloadSVG = useCallback(async () => {
    const svg = liveSvg ?? svgResult;
    if (!svg) return;
    setIsExporting(true);
    try { downloadSVGString(svg, "logo.svg"); }
    finally { setIsExporting(false); }
  }, [liveSvg, svgResult]);

  const handleDownloadPNG = useCallback(async () => {
    const svg = liveSvg ?? svgResult;
    if (!svg) return;
    setIsExporting(true);
    try { await exportSVGAsPNG(svg, 1024, "logo.png"); }
    catch { setError("PNG export failed. Try again."); }
    finally { setIsExporting(false); }
  }, [liveSvg, svgResult]);

  const handleUndo  = useCallback(() => canvasRef.current?.undo(), []);
  const handleRedo  = useCallback(() => canvasRef.current?.redo(), []);
  const handleClear = useCallback(() => {
    canvasRef.current?.clear();
    setLogoUrl(null);
    setSvgResult(null);
    setSvgSpec(null);
    setLiveSvg(null);
    setError(null);
    setSelectedElementIndex(null);
  }, []);

  const handlePaintColorChange = useCallback((color: string) => {
    setActivePaintColor(color);
    setStrokeColor(color);
    setIsColorPanelOpen(true);
  }, []);

  const handleColorPanelToggle = useCallback((open: boolean) => {
    setIsColorPanelOpen(open);
  }, []);

  const hasSvgOutput       = !!currentSvg;
  const canvasFloodFillColor = !hasSvgOutput && isColorPanelOpen ? activePaintColor : null;

  return (
    <>
      <style>{EDITOR_STYLES}</style>

      <div
        className="relative bg-white"
        style={{
          height: "100dvh",
          backgroundImage: "radial-gradient(circle, rgba(26,26,255,0.18) 1.5px, transparent 1.5px)",
          backgroundSize: "24px 24px",
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <EditorHeader
          activeTool={activeTool} shapeType={shapeType} strokeColor={strokeColor}
          strokeWidth={strokeWidth} eraserSize={eraserSize} fillColor={fillColor}
          onToolChange={setActiveTool} onShapeChange={setShapeType}
          onColorChange={setStrokeColor} onStrokeWidthChange={setStrokeWidth}
          onEraserSizeChange={setEraserSize} onFillColorChange={setFillColor}
          onUndo={handleUndo} onRedo={handleRedo} onClear={handleClear}
          canUndo={canUndo} canRedo={canRedo}
          zoom={zoom} onZoomIn={handleZoomIn} onZoomOut={handleZoomOut}
          isGenerating={isGenerating}
          hasSvg={hasSvgOutput}
          svgSpec={svgSpec}
          onSpecChange={setSvgSpec}
          activePaintColor={activePaintColor}
          onActivePaintColorChange={handlePaintColorChange}
          onColorPanelToggle={handleColorPanelToggle}
          selectedElementIndex={selectedElementIndex}
          onSelectElement={setSelectedElementIndex}
        />

        {/* ── Canvas area ───────────────────────────────────────────── */}
        <div className="absolute inset-0 overflow-hidden" style={{ top: TOOLBAR_HEIGHT }}>
          {/* Zoom wrapper */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "center center",
              transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1)",
            }}
          >

          {/* Drawing canvas — slide-scale in */}
          <div className="editor-canvas-enter absolute inset-0">
            <DrawingCanvas
              ref={canvasRef}
              activeTool={activeTool} shapeType={shapeType}
              strokeColor={strokeColor} strokeWidth={strokeWidth} eraserSize={eraserSize}
              fillColor={fillColor}
              logoUrl={logoUrl}
              onHistoryChange={(u, r) => { setCanUndo(u); setCanRedo(r); }}
              className={hasSvgOutput ? "opacity-0 pointer-events-none" : ""}
              floodFillColor={canvasFloodFillColor}
            />
          </div>

          {/* SVG preview with spec — spring scale-in */}
          {hasSvgOutput && currentSvg && svgSpec && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <InteractiveSvgCanvas
                svgSpec={svgSpec}
                onSpecChange={setSvgSpec}
                selectedIndex={selectedElementIndex}
                onSelectIndex={(idx) => {
                  setSelectedElementIndex(idx);
                  if (idx !== null) {
                    setSvgSpec(prev => {
                      if (!prev) return prev;
                      return {
                        ...prev,
                        elements: prev.elements.map((e, i) =>
                          i === idx ? { ...e, fill: activePaintColor } : e
                        ),
                      };
                    });
                  }
                }}
                visible={svgVisible}
                currentSvg={currentSvg}
                onDownloadSVG={handleDownloadSVG}
                onDownloadPNG={handleDownloadPNG}
                activePaintColor={activePaintColor}
              />
            </div>
          )}

          {/* Fallback: SVG without spec */}
          {hasSvgOutput && currentSvg && !svgSpec && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
              <img
                src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(currentSvg)}`}
                alt="Generated SVG logo"
                className="max-w-[min(80vw,480px)] max-h-[min(55vh,480px)] object-contain editor-svg-reveal"
                draggable={false}
              />
              <CopyDownloadBar currentSvg={currentSvg} onDownloadPNG={handleDownloadPNG} visible />
            </div>
          )}
          </div>{/* end zoom wrapper */}
        </div>

        {/* ── Error banner — slides down from top ──────────────────── */}
        {error && (
          <div
            key={error}
            className="editor-error-in absolute left-1/2 z-40 flex items-center gap-2 px-4 py-2.5 border-2 border-red-400/60 bg-white text-red-500 text-xs max-w-sm w-full"
            style={{
              top: TOOLBAR_HEIGHT + 12,
              fontFamily: '"Inter", system-ui, sans-serif',
              transform: "translateX(-50%)",
            }}
          >
            <AlertCircle className="size-3.5 shrink-0" />
            <span className="flex-1 font-bold tracking-wide uppercase text-[11px]">{error}</span>
            <button
              className="text-red-400/60 hover:text-red-500 text-base leading-none font-bold transition-opacity"
              onClick={() => setError(null)}
            >×</button>
          </div>
        )}

        {/* ── Prompt bar — slide up from bottom ────────────────────── */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-10 px-4 pointer-events-none z-20">
          <div className="pointer-events-auto w-full max-w-2xl editor-prompt-in">
            <EditorPromptBar
              onGenerate={handleGenerate}
              onDownloadSVG={handleDownloadSVG}
              onDownloadPNG={handleDownloadPNG}
              onEditAgain={handleEditAgain}
              isGenerating={isGenerating}
              isSearchingRef={isSearchingRef}
              referenceFound={referenceFound}
              isExporting={isExporting}
              hasDrawing={canUndo}
              logoUrl={hasSvgOutput ? "__svg__" : logoUrl}
              hasSvg={hasSvgOutput}
            />
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Interactive SVG canvas ────────────────────────────────────────────────────

function InteractiveSvgCanvas({
  svgSpec, onSpecChange, selectedIndex, onSelectIndex, visible, currentSvg, onDownloadSVG, onDownloadPNG, activePaintColor,
}: {
  svgSpec: LogoSpec;
  onSpecChange: (s: LogoSpec) => void;
  selectedIndex: number | null;
  onSelectIndex: (i: number | null) => void;
  visible: boolean;
  currentSvg: string;
  onDownloadSVG: () => void;
  onDownloadPNG: () => void;
  activePaintColor: string;
}) {
  const vb = svgSpec.viewBox ?? "0 0 512 512";
  const svgSize = Math.min(
    typeof window !== "undefined" ? window.innerWidth * 0.75 : 400,
    420
  );

  function renderElement(el: LogoElement, idx: number) {
    const isSelected = idx === selectedIndex;
    const common = {
      fill: el.fill ?? "none",
      fillRule: el.fillRule as "nonzero" | "evenodd" | undefined,
      stroke: el.stroke,
      strokeWidth: el.strokeWidth,
      strokeLinecap: el.strokeLinecap as "butt" | "round" | "square" | undefined,
      strokeLinejoin: el.strokeLinejoin as "miter" | "round" | "bevel" | undefined,
      opacity: el.opacity,
      transform: el.transform,
      onClick: (e: React.MouseEvent) => { e.stopPropagation(); onSelectIndex(idx); },
      style: {
        cursor: "crosshair",
        transition: "filter 0.15s",
        filter: isSelected
          ? "drop-shadow(0 0 5px rgba(26,26,255,0.6))"
          : "none",
      } as React.CSSProperties,
    };

    switch (el.type) {
      case "path":     return <path     key={idx} {...common} d={el.d} />;
      case "circle":   return <circle   key={idx} {...common} cx={el.cx ?? 256} cy={el.cy ?? 256} r={el.r ?? 100} />;
      case "rect":     return <rect     key={idx} {...common} x={el.x ?? 0} y={el.y ?? 0} width={el.width ?? 100} height={el.height ?? 100} rx={el.rx} ry={el.ry} />;
      case "ellipse":  return <ellipse  key={idx} {...common} cx={el.cx ?? 256} cy={el.cy ?? 256} rx={el.rx ?? 100} ry={el.ry ?? 60} />;
      case "polygon":  return <polygon  key={idx} {...common} points={el.points} />;
      case "polyline": return <polyline key={idx} {...common} points={el.points} />;
      case "line":     return <line     key={idx} {...common} x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} />;
      case "text":
        return (
          <text
            key={idx} {...common}
            x={el.x ?? 256} y={el.y ?? 256}
            fontSize={el.fontSize ?? 48}
            fontFamily={el.fontFamily ?? "Arial, sans-serif"}
            fontWeight={el.fontWeight ?? "bold"}
            textAnchor={el.textAnchor ?? "middle"}
            dominantBaseline={el.dominantBaseline ?? "central"}
            letterSpacing={el.letterSpacing}
          >
            {el.text ?? ""}
          </text>
        );
      default: return null;
    }
  }

  return (
    <div
      className="flex flex-col items-center gap-0"
      style={{
        transition: "opacity 0.5s cubic-bezier(0.34,1.56,0.64,1), transform 0.5s cubic-bezier(0.34,1.56,0.64,1)",
        opacity:   visible ? 1 : 0,
        transform: visible ? "scale(1) translateY(0)" : "scale(0.88) translateY(24px)",
      }}
    >
      {/* Floating action buttons — above the SVG */}
      <CopyDownloadBar
        currentSvg={currentSvg}
        onDownloadPNG={onDownloadPNG}
        visible={visible}
      />

      {/* SVG canvas — rounded-none border-2 matching hero buttons */}
      <div
        className="relative overflow-hidden border-2 border-[#1a1aff]/20 bg-white"
        style={{
          boxShadow: "0 0 60px rgba(26,26,255,0.08), 0 24px 60px rgba(26,26,255,0.06)",
          transition: "box-shadow 0.3s ease",
        }}
      >
        {/* Active paint indicator */}
        <div
          className="absolute top-2 right-2 z-10 flex items-center gap-1.5 px-2 py-1 border-2 border-[#1a1aff]/20 text-[10px] text-[#1a1aff]/60 pointer-events-none bg-white"
          style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
        >
          <span className="size-2.5 border border-[#1a1aff]/20" style={{ background: activePaintColor }} />
          <span className="font-bold tracking-widest uppercase text-[9px]">active</span>
        </div>

        <svg
          viewBox={vb}
          width={svgSize}
          height={svgSize}
          xmlns="http://www.w3.org/2000/svg"
          onClick={() => onSelectIndex(null)}
          style={{ display: "block", cursor: "crosshair" }}
        >
          {svgSpec.background && svgSpec.background !== "transparent" && (
            <rect width="512" height="512" fill={svgSpec.background} />
          )}
          {svgSpec.elements.map((el, idx) => renderElement(el, idx))}
        </svg>
      </div>

    </div>
  );
}

function elementLabel(el: LogoElement, idx: number): string {
  if (el.type === "text") return `Text "${(el.text ?? "").slice(0, 12)}"`;
  return `${el.type.charAt(0).toUpperCase() + el.type.slice(1)} ${idx + 1}`;
}

// ─── Floating action buttons ──────────────────────────────────────────────────

function CopyDownloadBar({ currentSvg, onDownloadPNG, visible }: {
  currentSvg: string;
  onDownloadPNG: () => void;
  visible: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(currentSvg);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* silent */ }
  }

  return (
    <div
      className="mb-3 flex items-center gap-2"
      style={{
        transition: "opacity 0.45s cubic-bezier(0.16,1,0.3,1) 0.1s, transform 0.45s cubic-bezier(0.16,1,0.3,1) 0.1s",
        opacity:   visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(10px)",
      }}
    >
      {/* Copy SVG */}
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 h-8 px-4 rounded-full border-2 border-[#1a1aff]/25 bg-white/90 backdrop-blur-sm text-[11px] font-bold tracking-widest uppercase text-[#1a1aff]/70 hover:border-[#1a1aff] hover:text-[#1a1aff] hover:bg-white shadow-[0_2px_12px_rgba(26,26,255,0.10)] transition-all duration-150 active:scale-95"
        style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
      >
        <Copy className="size-3" />
        {copied ? "Copied!" : "Copy SVG"}
      </button>

      {/* Download PNG */}
      <button
        onClick={onDownloadPNG}
        className="flex items-center gap-1.5 h-8 px-4 rounded-full border-2 border-[#1a1aff] bg-[#1a1aff] text-white text-[11px] font-bold tracking-widest uppercase hover:bg-white hover:text-[#1a1aff] shadow-[0_2px_16px_rgba(26,26,255,0.25)] transition-all duration-150 active:scale-95"
        style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
      >
        <Download className="size-3" />
        Download PNG
      </button>
    </div>
  );
}
