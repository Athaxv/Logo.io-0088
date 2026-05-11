import { useRef, useEffect, useState, useCallback } from "react";
import {
  Pen, Eraser, Undo2, Redo2, Trash2,
  Square, Circle, Minus, Triangle, Shapes, ChevronDown, Sliders,
  ZoomIn, ZoomOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LogoSpec, LogoElement } from "../../lib/logo-types";

export type ToolType = "pen" | "eraser" | "shapes";
export type ShapeType =
  | "rect" | "rounded-rect" | "circle" | "oval" | "triangle" | "right-triangle"
  | "diamond" | "pentagon" | "hexagon" | "octagon" | "star" | "arrow"
  | "cross" | "heart" | "line";

export interface EditorToolbarProps {
  activeTool: ToolType;
  shapeType: ShapeType;
  strokeColor: string;
  strokeWidth: number;
  eraserSize: number;
  fillColor: string;
  onToolChange: (t: ToolType) => void;
  onShapeChange: (s: ShapeType) => void;
  onColorChange: (c: string) => void;
  onStrokeWidthChange: (w: number) => void;
  onEraserSizeChange: (s: number) => void;
  onFillColorChange: (c: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  canUndo: boolean;
  canRedo: boolean;
  zoom?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  // SVG edit
  hasSvg?: boolean;
  svgSpec?: LogoSpec | null;
  onSpecChange?: (spec: LogoSpec) => void;
  // active paint color — shared between SVG fill and canvas flood fill
  activePaintColor?: string;
  onActivePaintColorChange?: (color: string) => void;
  // called when the fill/paint panel opens or closes
  onColorPanelToggle?: (open: boolean) => void;
  // which SVG element is selected (from canvas click)
  selectedElementIndex?: number | null;
  onSelectElement?: (idx: number | null) => void;
}

type PanelKey = "pen" | "shapes" | "eraser" | "svgEdit" | null;

const SHAPES: { id: ShapeType; label: string; icon: React.ReactNode }[] = [
  { id: "rect",          label: "Rectangle",   icon: <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="3" width="14" height="10" /></svg> },
  { id: "rounded-rect",  label: "Rounded",     icon: <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="3" width="14" height="10" rx="3" /></svg> },
  { id: "circle",        label: "Circle",      icon: <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6" /></svg> },
  { id: "oval",          label: "Oval",        icon: <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5"><ellipse cx="8" cy="8" rx="7" ry="4.5" /></svg> },
  { id: "triangle",      label: "Triangle",    icon: <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="8,2 15,14 1,14" /></svg> },
  { id: "right-triangle",label: "Right Tri",   icon: <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="2,14 2,2 14,14" /></svg> },
  { id: "diamond",       label: "Diamond",     icon: <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="8,1 15,8 8,15 1,8" /></svg> },
  { id: "pentagon",      label: "Pentagon",    icon: <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="8,1 15,6 12.5,14 3.5,14 1,6" /></svg> },
  { id: "hexagon",       label: "Hexagon",     icon: <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="8,1 14.2,4.5 14.2,11.5 8,15 1.8,11.5 1.8,4.5" /></svg> },
  { id: "octagon",       label: "Octagon",     icon: <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="5,1 11,1 15,5 15,11 11,15 5,15 1,11 1,5" /></svg> },
  { id: "star",          label: "Star",        icon: <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="8,1 10,6 15,6 11,9.5 12.5,15 8,11.5 3.5,15 5,9.5 1,6 6,6" /></svg> },
  { id: "arrow",         label: "Arrow",       icon: <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="2,8 14,8" /><polyline points="9,3 14,8 9,13" /></svg> },
  { id: "cross",         label: "Cross",       icon: <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="8" y1="2" x2="8" y2="14" /><line x1="2" y1="8" x2="14" y2="8" /></svg> },
  { id: "heart",         label: "Heart",       icon: <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8,13 C8,13 2,9 2,5.5 C2,3.5 3.5,2 5.5,2 C6.8,2 7.7,2.8 8,3.5 C8.3,2.8 9.2,2 10.5,2 C12.5,2 14,3.5 14,5.5 C14,9 8,13 8,13Z" /></svg> },
  { id: "line",          label: "Line",        icon: <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="2" y1="14" x2="14" y2="2" /></svg> },
];

const PALETTE = [
  "#1a1aff", "#000000", "#ffffff", "#60a5fa", "#f472b6",
  "#fb923c", "#a78bfa", "#34d399", "#f87171", "#fbbf24",
  "#1a1a1a", "#3a3a3a", "#f5f5f5", "#e5e7eb", "#737373",
];

export function EditorToolbar({
  activeTool, shapeType, strokeColor, strokeWidth, eraserSize, fillColor,
  onToolChange, onShapeChange, onColorChange, onStrokeWidthChange, onEraserSizeChange, onFillColorChange,
  onUndo, onRedo, onClear, canUndo, canRedo,
  zoom = 1, onZoomIn, onZoomOut,
  hasSvg, svgSpec, onSpecChange,
  activePaintColor, onActivePaintColorChange, onColorPanelToggle,
  selectedElementIndex, onSelectElement,
}: EditorToolbarProps) {
  const [openPanel, setOpenPanel] = useState<PanelKey>(null);
  const ref = useRef<HTMLDivElement>(null);

  const setPanel = useCallback((next: PanelKey | ((p: PanelKey) => PanelKey)) => {
    setOpenPanel(prev => {
      const value = typeof next === "function" ? next(prev) : next;
      const fillOpen = value === "svgEdit";
      onColorPanelToggle?.(fillOpen);
      return value;
    });
  }, [onColorPanelToggle]);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setPanel(null);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [setPanel]);

  useEffect(() => {
    if (selectedElementIndex != null) setPanel("svgEdit");
  }, [selectedElementIndex]);

  function toggle(key: PanelKey) {
    setPanel(prev => prev === key ? null : key);
  }

  function handleToolClick(tool: ToolType) {
    if (tool === activeTool) toggle(tool as PanelKey);
    else { onToolChange(tool); setPanel(tool as PanelKey); }
  }

  const paintColor = activePaintColor ?? strokeColor;

  return (
    <div ref={ref} className="relative flex items-center gap-1">

      {/* ── Drawing tools ─────────────────────────────────────────────── */}
      <ToolGroup>
        <TBtn label="Pen" active={activeTool === "pen"} onClick={() => handleToolClick("pen")}>
          <Pen className="size-3.5" />
        </TBtn>
        <TBtn
          label="Shapes" active={activeTool === "shapes"}
          onClick={() => handleToolClick("shapes")}
          suffix={<ChevronDown className="size-2.5 opacity-40" />}
        >
          <Shapes className="size-3.5" />
        </TBtn>
        <TBtn label="Eraser" active={activeTool === "eraser"} onClick={() => handleToolClick("eraser")}>
          <Eraser className="size-3.5" />
        </TBtn>
      </ToolGroup>

      <div className="w-px h-4 bg-[#1a1aff]/15 mx-1" />

      {/* ── History + Clear ───────────────────────────────────────────── */}
      <ToolGroup>
        <TBtn label="Undo" disabled={!canUndo} onClick={onUndo}><Undo2 className="size-3.5" /></TBtn>
        <TBtn label="Redo" disabled={!canRedo} onClick={onRedo}><Redo2 className="size-3.5" /></TBtn>
        <div className="w-px h-4 bg-[#1a1aff]/15 mx-0.5" />
        <TBtn label="Clear canvas" onClick={onClear} danger><Trash2 className="size-3.5" /></TBtn>
      </ToolGroup>

      {/* ── Zoom ─────────────────────────────────────────────────────── */}
      <div className="w-px h-4 bg-[#1a1aff]/15 mx-1" />
      <ToolGroup>
        <TBtn label="Zoom out" disabled={zoom <= 0.25} onClick={() => onZoomOut?.()}>
          <ZoomOut className="size-3.5" />
        </TBtn>
        <span className="text-[10px] font-bold text-[#1a1aff]/50 w-8 text-center tabular-nums select-none" style={{ fontFamily: '"Inter", system-ui, sans-serif' }}>
          {Math.round(zoom * 100)}%
        </span>
        <TBtn label="Zoom in" disabled={zoom >= 3} onClick={() => onZoomIn?.()}>
          <ZoomIn className="size-3.5" />
        </TBtn>
      </ToolGroup>

      {/* ── Fill / color button ───────────────────────────────────────── */}
      <>
        <div className="w-px h-4 bg-[#1a1aff]/15 mx-1" />
        <ToolGroup>
          <button
            title="Fill color"
            onClick={() => toggle("svgEdit")}
            className={cn(
              "relative flex items-center gap-1.5 h-8 px-2 rounded-lg transition-all duration-150",
              openPanel === "svgEdit"
                ? "bg-[#1a1aff]/10 ring-1 ring-[#1a1aff]/40"
                : "hover:bg-[#1a1aff]/[0.06]"
            )}
          >
            <Sliders className={cn("size-3.5", openPanel === "svgEdit" ? "text-[#1a1aff]" : "text-[#1a1aff]/50")} />
            <span
              className="size-3.5 rounded border border-[#1a1aff]/30 shrink-0"
              style={{ background: paintColor }}
            />
          </button>
        </ToolGroup>
      </>

      {/* ── Panels ────────────────────────────────────────────────────── */}

      {openPanel === "pen" && (
        <DropPanel title="Stroke width" side="right">
          <div className="flex items-center gap-3 mb-3">
            <input type="range" min={1} max={20} value={strokeWidth}
              onChange={e => onStrokeWidthChange(Number(e.target.value))}
              className="flex-1 accent-[#1a1aff]" />
            <span className="text-xs text-[#1a1aff]/60 w-8 text-right">{strokeWidth}px</span>
          </div>
          <div className="flex gap-1.5">
            {[1, 3, 6, 10, 16].map(w => (
              <button key={w} onClick={() => onStrokeWidthChange(w)}
                className={cn(
                  "flex-1 flex items-center justify-center h-7 rounded-lg border-2 transition-colors",
                  strokeWidth === w
                    ? "border-[#1a1aff] bg-[#1a1aff]/10"
                    : "border-[#1a1aff]/20 hover:border-[#1a1aff]/50"
                )}>
                <div className="rounded-full bg-[#1a1aff]" style={{ width: Math.min(w * 1.4, 14), height: Math.min(w * 1.4, 14) }} />
              </button>
            ))}
          </div>
        </DropPanel>
      )}

      {openPanel === "shapes" && (
        <DropPanel title="Shapes" side="right" wide>
          <div className="grid grid-cols-5 gap-1">
            {SHAPES.map(s => {
              const active = shapeType === s.id && activeTool === "shapes";
              return (
                <button
                  key={s.id}
                  onClick={() => { onShapeChange(s.id); onToolChange("shapes"); setPanel(null); }}
                  title={s.label}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 p-2 rounded-xl border-2 transition-all duration-150",
                    active
                      ? "border-[#1a1aff] bg-[#1a1aff]/10 text-[#1a1aff]"
                      : "border-transparent text-[#1a1aff]/50 hover:border-[#1a1aff]/30 hover:bg-[#1a1aff]/[0.05] hover:text-[#1a1aff]"
                  )}
                >
                  {s.icon}
                  <span
                    className="text-[8px] font-bold tracking-wide uppercase leading-none text-center"
                    style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
                  >
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>
        </DropPanel>
      )}

      {openPanel === "eraser" && (
        <DropPanel title="Eraser size" side="right">
          <div className="flex items-center gap-3">
            <input type="range" min={5} max={60} value={eraserSize}
              onChange={e => onEraserSizeChange(Number(e.target.value))}
              className="flex-1 accent-[#1a1aff]" />
            <span className="text-xs text-[#1a1aff]/60 w-8 text-right">{eraserSize}px</span>
          </div>
        </DropPanel>
      )}

      {openPanel === "svgEdit" && (
        <DropPanel title="Fill Color" side="right" wide>
          <FillPanel
            paintColor={paintColor}
            onPaintColorChange={c => {
              onActivePaintColorChange?.(c);
              onColorChange(c);
            }}
            svgSpec={svgSpec ?? null}
            onSpecChange={onSpecChange}
            selectedIndex={selectedElementIndex ?? null}
            onSelectIndex={idx => onSelectElement?.(idx)}
            hasSvg={!!hasSvg}
          />
        </DropPanel>
      )}
    </div>
  );
}

// ─── Unified fill panel ───────────────────────────────────────────────────────

function FillPanel({
  paintColor, onPaintColorChange,
  svgSpec, onSpecChange,
  selectedIndex, onSelectIndex,
  hasSvg,
}: {
  paintColor: string;
  onPaintColorChange: (c: string) => void;
  svgSpec: LogoSpec | null;
  onSpecChange?: (s: LogoSpec) => void;
  selectedIndex: number | null;
  onSelectIndex: (i: number | null) => void;
  hasSvg: boolean;
}) {
  const safePaint = paintColor.startsWith("#") ? paintColor : "#1a1aff";

  return (
    <div className="flex flex-col gap-4">
      {/* Active paint color */}
      <div className="flex items-center gap-3">
        <div
          className="size-10 rounded-xl border-2 border-[#1a1aff]/30 shrink-0"
          style={{ background: paintColor }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-[#1a1aff]/50 uppercase tracking-widest" style={{ fontFamily: '"Inter", system-ui, sans-serif' }}>Active color</p>
          <p className="text-xs text-[#1a1aff] font-mono mt-0.5 truncate">{paintColor}</p>
          <p className="text-[10px] text-[#1a1aff]/40 mt-0.5">
            {hasSvg ? "Click any shape to fill it" : "Click canvas to flood fill"}
          </p>
        </div>
        <input
          type="color"
          value={safePaint}
          onChange={e => onPaintColorChange(e.target.value)}
          className="h-8 w-8 rounded-lg cursor-pointer bg-transparent border-2 border-[#1a1aff]/30 shrink-0"
          title="Custom color"
        />
      </div>

      {/* Palette */}
      <div>
        <p className="text-[10px] font-bold text-[#1a1aff]/50 uppercase tracking-widest mb-2" style={{ fontFamily: '"Inter", system-ui, sans-serif' }}>Palette</p>
        <div className="flex flex-wrap gap-1.5">
          {PALETTE.map(c => (
            <button
              key={c}
              onClick={() => onPaintColorChange(c)}
              title={c}
              className={cn(
                "size-6 rounded-lg border-2 transition-all hover:scale-110 shrink-0",
                paintColor === c
                  ? "border-[#1a1aff] scale-110 shadow-[0_0_8px_rgba(26,26,255,0.35)]"
                  : "border-[#1a1aff]/20 hover:border-[#1a1aff]/50"
              )}
              style={{ background: c }}
            />
          ))}
          <button
            onClick={() => onPaintColorChange("transparent")}
            title="transparent"
            className={cn(
              "size-6 rounded-lg border-2 transition-all hover:scale-110 shrink-0 relative overflow-hidden",
              paintColor === "transparent"
                ? "border-[#1a1aff] scale-110"
                : "border-[#1a1aff]/20 hover:border-[#1a1aff]/50"
            )}
          >
            <span className="absolute inset-0 flex items-center justify-center text-[9px] text-[#1a1aff]/60 font-bold">∅</span>
          </button>
        </div>
      </div>

      {hasSvg && svgSpec && onSpecChange && (
        <>
          <div className="h-px bg-[#1a1aff]/10" />
          <div>
            <p className="text-[10px] font-bold text-[#1a1aff]/50 uppercase tracking-widest mb-2" style={{ fontFamily: '"Inter", system-ui, sans-serif' }}>
              Elements — click to fill
            </p>
            <div className="flex flex-col gap-1">
              {svgSpec.elements.map((el, i) => {
                const isSelected = i === selectedIndex;
                const elFill = el.fill && el.fill !== "none" && el.fill !== "transparent"
                  ? el.fill : null;
                return (
                  <button
                    key={i}
                    onClick={() => {
                      onSelectIndex(i);
                      onSpecChange({
                        ...svgSpec,
                        elements: svgSpec.elements.map((e, idx) =>
                          idx === i ? { ...e, fill: paintColor } : e
                        ),
                      });
                    }}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg border-2 text-xs transition-all text-left",
                      isSelected
                        ? "border-[#1a1aff] bg-[#1a1aff]/10 text-[#1a1aff]"
                        : "border-[#1a1aff]/15 text-[#1a1aff]/60 hover:border-[#1a1aff]/40 hover:text-[#1a1aff]"
                    )}
                  >
                    <span
                      className="size-3.5 rounded border border-[#1a1aff]/30 shrink-0"
                      style={{ background: elFill ?? "transparent" }}
                    />
                    <span className="flex-1 truncate font-bold tracking-widest text-[10px] uppercase" style={{ fontFamily: '"Inter", system-ui, sans-serif' }}>{elementLabel(el, i)}</span>
                    <span className="flex items-center gap-1 shrink-0 opacity-50">
                      <span className="text-[9px]">→</span>
                      <span
                        className="size-3 rounded border border-[#1a1aff]/30"
                        style={{ background: paintColor }}
                      />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedIndex != null && svgSpec.elements[selectedIndex] && (
            <>
              <div className="h-px bg-[#1a1aff]/10" />
              <StrokeSection
                el={svgSpec.elements[selectedIndex]!}
                onUpdate={patch => onSpecChange({
                  ...svgSpec,
                  elements: svgSpec.elements.map((e, i) =>
                    i === selectedIndex ? { ...e, ...patch } : e
                  ),
                })}
              />
            </>
          )}
        </>
      )}

      {!hasSvg && (
        <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg border-2 border-[#1a1aff]/15 bg-[#1a1aff]/[0.03]">
          <span className="text-[10px] text-[#1a1aff]/50" style={{ fontFamily: '"Inter", system-ui, sans-serif' }}>
            Click anywhere on your drawing to flood fill that region with the active color.
          </span>
        </div>
      )}
    </div>
  );
}

function StrokeSection({
  el, onUpdate,
}: {
  el: LogoElement;
  onUpdate: (patch: Partial<LogoElement>) => void;
}) {
  if (el.type === "text") return null;
  return (
    <div>
      <p className="text-[10px] font-bold text-[#1a1aff]/50 uppercase tracking-widest mb-2" style={{ fontFamily: '"Inter", system-ui, sans-serif' }}>Stroke width</p>
      <div className="flex items-center gap-3">
        <input type="range" min={0} max={12} step={0.5}
          value={el.strokeWidth ?? 0}
          onChange={e => onUpdate({ strokeWidth: Number(e.target.value) || undefined })}
          className="flex-1 accent-[#1a1aff]" />
        <span className="text-[10px] text-[#1a1aff]/60 w-5 text-right">{el.strokeWidth ?? 0}</span>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function elementLabel(el: LogoElement, idx: number): string {
  if (el.type === "text") return `Text "${(el.text ?? "").slice(0, 14)}${(el.text?.length ?? 0) > 14 ? "…" : ""}"`;
  return `${el.type.charAt(0).toUpperCase() + el.type.slice(1)} ${idx + 1}`;
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function ToolGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-0.5 rounded-xl px-0.5 py-0.5">{children}</div>;
}

function TBtn({
  children, label, active = false, disabled = false, onClick, danger = false, suffix,
}: {
  children: React.ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  danger?: boolean;
  suffix?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={cn(
        "relative flex items-center justify-center gap-0.5 w-8 h-8 rounded-lg transition-all duration-150 text-[#1a1aff]/50",
        active && "bg-[#1a1aff]/15 text-[#1a1aff] ring-1 ring-[#1a1aff]/30",
        !active && !danger && "hover:bg-[#1a1aff]/[0.07] hover:text-[#1a1aff]",
        danger && "hover:bg-red-500/10 hover:text-red-500",
        disabled && "opacity-25 cursor-not-allowed pointer-events-none"
      )}
    >
      {children}
      {suffix}
    </button>
  );
}

function DropPanel({
  title, children, side, wide,
}: {
  title: string;
  children: React.ReactNode;
  side: "left" | "center" | "right";
  wide?: boolean;
}) {
  const alignment =
    side === "left" ? "left-0" :
    side === "right" ? "right-0" :
    "left-1/2 -translate-x-1/2";

  return (
    <div
      className={cn(
        "absolute top-full mt-3 rounded-2xl border-2 border-[#1a1aff]/20 bg-white",
        "shadow-[0_8px_40px_rgba(26,26,255,0.12)] p-4 z-50 overflow-y-auto",
        wide ? "w-72" : "w-60",
        alignment
      )}
      style={{ maxHeight: "calc(100vh - 120px)" }}
    >
      <p className="text-[10px] font-bold text-[#1a1aff]/50 uppercase tracking-widest mb-3" style={{ fontFamily: '"Inter", system-ui, sans-serif' }}>{title}</p>
      {children}
    </div>
  );
}
