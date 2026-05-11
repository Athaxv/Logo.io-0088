import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { LogoSpec, LogoElement } from "../../lib/logo-types";

interface SvgPreviewProps {
  svg: string;
  spec: LogoSpec;
  onSpecChange: (spec: LogoSpec) => void;
  className?: string;
}

export function SvgPreview({ svg, spec, onSpecChange, className }: SvgPreviewProps) {
  const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  return (
    <div className={cn("w-full h-full flex items-center justify-center", className)}>
      <img
        src={svgDataUrl}
        alt="Generated SVG logo"
        className="max-w-full max-h-full object-contain"
        style={{ imageRendering: "crisp-edges" }}
        draggable={false}
      />
    </div>
  );
}

// ── SVG Edit Panel ─────────────────────────────────────────────────────────────
interface SvgEditPanelProps {
  spec: LogoSpec;
  onSpecChange: (spec: LogoSpec) => void;
  onClose: () => void;
}

const LOGO_COLORS = [
  "#C8FF00", "#ffffff", "#000000", "#60a5fa", "#f472b6",
  "#fb923c", "#a78bfa", "#34d399", "#f87171", "#fbbf24",
  "#050505", "#0a0a0a", "#1a1a1a", "#f5f5f5", "#e5e7eb",
  "transparent",
];

export function SvgEditPanel({ spec, onSpecChange, onClose }: SvgEditPanelProps) {
  const textElements = spec.elements
    .map((el, i) => ({ el, i }))
    .filter(({ el }) => el.type === "text");

  function updateBackground(bg: string) {
    onSpecChange({ ...spec, background: bg });
  }

  function updateElement(idx: number, patch: Partial<LogoElement>) {
    const elements = spec.elements.map((el, i) => i === idx ? { ...el, ...patch } : el);
    onSpecChange({ ...spec, elements });
  }

  function updateAllFills(color: string) {
    const elements = spec.elements.map(el =>
      el.type !== "text" ? { ...el, fill: color } : el
    );
    onSpecChange({ ...spec, elements });
  }

  function updateAllStrokes(color: string) {
    const elements = spec.elements.map(el => ({ ...el, stroke: color === "none" ? undefined : color }));
    onSpecChange({ ...spec, elements });
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Background */}
      <Section label="Background">
        <ColorGrid
          colors={LOGO_COLORS}
          value={spec.background}
          onChange={updateBackground}
          allowTransparent
        />
        <CustomColor value={spec.background === "transparent" ? "#050505" : spec.background} onChange={updateBackground} />
      </Section>

      {/* Shape fill */}
      <Section label="Shape Fill">
        <ColorGrid
          colors={LOGO_COLORS.filter(c => c !== "transparent")}
          value={spec.elements.find(e => e.type !== "text")?.fill ?? "#ffffff"}
          onChange={updateAllFills}
        />
        <CustomColor
          value={spec.elements.find(e => e.type !== "text")?.fill ?? "#ffffff"}
          onChange={updateAllFills}
        />
      </Section>

      {/* Stroke */}
      <Section label="Stroke">
        <div className="flex items-center gap-2 mb-2">
          <ColorGrid
            colors={["none", ...LOGO_COLORS.filter(c => c !== "transparent")]}
            value={spec.elements[0]?.stroke ?? "none"}
            onChange={updateAllStrokes}
            allowNone
          />
        </div>
        {/* Stroke width slider */}
        <div className="flex items-center gap-3 mt-1">
          <input
            type="range" min={0} max={12} step={0.5}
            value={spec.elements.find(e => e.strokeWidth !== undefined)?.strokeWidth ?? 0}
            onChange={e => {
              const w = Number(e.target.value);
              const elements = spec.elements.map(el => ({ ...el, strokeWidth: w > 0 ? w : undefined }));
              onSpecChange({ ...spec, elements });
            }}
            className="flex-1 accent-lime"
          />
          <span className="text-xs text-[#737373] w-8 text-right">
            {spec.elements.find(e => e.strokeWidth !== undefined)?.strokeWidth ?? 0}px
          </span>
        </div>
      </Section>

      {/* Text elements */}
      {textElements.length > 0 && (
        <Section label="Text">
          {textElements.map(({ el, i }) => (
            <div key={i} className="mb-3">
              <input
                type="text"
                value={el.text ?? ""}
                onChange={e => updateElement(i, { text: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#525252] outline-none focus:border-lime/40 mb-2"
                placeholder="Logo text…"
              />
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#525252]">Size</span>
                <input
                  type="range" min={12} max={120} step={2}
                  value={el.fontSize ?? 48}
                  onChange={e => updateElement(i, { fontSize: Number(e.target.value) })}
                  className="flex-1 accent-lime"
                />
                <span className="text-[10px] text-[#737373] w-8 text-right">{el.fontSize ?? 48}</span>
              </div>
              <div className="mt-1">
                <ColorGrid
                  colors={LOGO_COLORS.filter(c => c !== "transparent")}
                  value={el.fill ?? "#ffffff"}
                  onChange={c => updateElement(i, { fill: c })}
                />
              </div>
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}

// ── Small primitives ───────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-[#525252] uppercase tracking-widest mb-2">{label}</p>
      {children}
    </div>
  );
}

function ColorGrid({
  colors, value, onChange, allowTransparent, allowNone,
}: {
  colors: string[];
  value: string;
  onChange: (c: string) => void;
  allowTransparent?: boolean;
  allowNone?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-1">
      {colors.map(c => {
        const isTransparent = c === "transparent";
        const isNone = c === "none";
        const isActive = value === c;
        return (
          <button
            key={c}
            onClick={() => onChange(c)}
            title={c}
            className={cn(
              "size-6 rounded-md border-2 transition-transform hover:scale-110 relative overflow-hidden",
              isActive ? "border-lime scale-110" : "border-white/10"
            )}
            style={!isTransparent && !isNone ? { background: c } : {}}
          >
            {(isTransparent || isNone) && (
              <span className="absolute inset-0 flex items-center justify-center text-[9px] text-[#737373] font-bold">
                {isNone ? "∅" : "◻"}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function CustomColor({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex items-center gap-2 mt-1">
      <span className="text-[10px] text-[#525252]">Custom</span>
      <input
        type="color"
        value={value.startsWith("#") ? value : "#050505"}
        onChange={e => onChange(e.target.value)}
        className="h-5 w-7 rounded cursor-pointer bg-transparent border border-white/10"
      />
      <span className="text-[10px] text-[#525252] font-mono">{value}</span>
    </div>
  );
}
