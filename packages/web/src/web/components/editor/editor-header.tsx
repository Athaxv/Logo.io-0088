import { useLocation } from "wouter";
import { useEffect, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import { EditorToolbar, type EditorToolbarProps } from "./editor-toolbar";

interface EditorHeaderProps extends EditorToolbarProps {
  isGenerating: boolean;
}

export function EditorHeader({
  isGenerating,
  activeTool, shapeType, strokeColor, strokeWidth, eraserSize, fillColor,
  onToolChange, onShapeChange, onColorChange, onStrokeWidthChange, onEraserSizeChange, onFillColorChange,
  onUndo, onRedo, onClear, canUndo, canRedo,
  zoom, onZoomIn, onZoomOut,
  hasSvg, svgSpec, onSpecChange,
  activePaintColor, onActivePaintColorChange, onColorPanelToggle,
  selectedElementIndex, onSelectElement,
}: EditorHeaderProps) {
  const [, setLocation] = useLocation();
  const backRef    = useRef<HTMLButtonElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Staggered entrance
  useEffect(() => {
    const items = [
      { ref: backRef,    delay: 0.08 },
      { ref: toolbarRef, delay: 0.22 },
    ];
    items.forEach(({ ref, delay }) => {
      const el = ref.current;
      if (!el) return;
      el.style.opacity = "0";
      el.style.transform = "translateY(-10px)";
      const t = setTimeout(() => {
        el.style.transition = `opacity 0.55s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.55s cubic-bezier(0.16,1,0.3,1) ${delay}s`;
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
      }, 20);
      return () => clearTimeout(t);
    });
  }, []);

  return (
    <>
      <style>{`
        @keyframes generatingPulse {
          0%, 100% { box-shadow: 0 0 0 2px rgba(26,26,255,0.15); }
          50%       { box-shadow: 0 0 0 3px rgba(26,26,255,0.30); }
        }
        .toolbar-generating { animation: generatingPulse 2s ease infinite; }
      `}</style>

      {/* Back button — top-left, floating */}
      <button
        ref={backRef}
        onClick={() => setLocation("/")}
        className="absolute top-4 left-5 z-50 flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-[#1a1aff] uppercase hover:opacity-50 transition-opacity"
        style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
      >
        <ArrowLeft className="size-3.5" />
        Back
      </button>

      {/* Floating toolbar pill — top-center */}
      <div
        ref={toolbarRef}
        className="absolute top-4 left-1/2 -translate-x-1/2 z-50"
        style={{ display: "inline-block" }}
      >
        <div
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full border-2 border-[#1a1aff]/20 bg-white/90 backdrop-blur-sm shadow-[0_4px_24px_rgba(26,26,255,0.10)] transition-all duration-300 ${isGenerating ? "toolbar-generating" : ""}`}
        >
          <EditorToolbar
            activeTool={activeTool} shapeType={shapeType} strokeColor={strokeColor}
            strokeWidth={strokeWidth} eraserSize={eraserSize} fillColor={fillColor}
            onToolChange={onToolChange} onShapeChange={onShapeChange}
            onColorChange={onColorChange} onStrokeWidthChange={onStrokeWidthChange}
            onEraserSizeChange={onEraserSizeChange} onFillColorChange={onFillColorChange}
            onUndo={onUndo} onRedo={onRedo} onClear={onClear}
            canUndo={canUndo} canRedo={canRedo}
            zoom={zoom} onZoomIn={onZoomIn} onZoomOut={onZoomOut}
            hasSvg={hasSvg} svgSpec={svgSpec} onSpecChange={onSpecChange}
            activePaintColor={activePaintColor}
            onActivePaintColorChange={onActivePaintColorChange}
            onColorPanelToggle={onColorPanelToggle}
            selectedElementIndex={selectedElementIndex}
            onSelectElement={onSelectElement}
          />
          {isGenerating && (
            <>
              <div className="w-px h-4 bg-[#1a1aff]/20 mx-1" />
              <div
                className="flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-[#1a1aff] pr-1"
                style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
              >
                <div className="size-1.5 rounded-full bg-[#1a1aff] animate-ping" />
                GENERATING…
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
