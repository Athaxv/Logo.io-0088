import { useState, useEffect, useRef } from "react";
import { Wand2, Loader2, Sparkles, Globe, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditorPromptBarProps {
  onGenerate: (prompt: string) => void;
  onDownloadSVG: () => void;
  onDownloadPNG: () => void;
  onEditAgain: () => void;
  isGenerating: boolean;
  isSearchingRef?: boolean;
  referenceFound?: { url: string; query: string } | null;
  isExporting: boolean;
  hasDrawing: boolean;
  logoUrl: string | null;
  hasSvg: boolean;
}

const HINTS = [
  "A minimalist bear head for a coffee shop…",
  "Bold letter mark for a tech startup…",
  "Geometric mountain logo for an outdoor brand…",
  "Simple leaf icon for an eco company…",
  "Abstract flame for a fitness brand…",
];

export function EditorPromptBar({
  onGenerate,
  isGenerating,
  isSearchingRef,
  referenceFound,
}: EditorPromptBarProps) {
  const [prompt, setPrompt]   = useState("");
  const [hintIdx]             = useState(() => Math.floor(Math.random() * HINTS.length));
  const barRef                = useRef<HTMLDivElement>(null);
  const hintRef               = useRef<HTMLParagraphElement>(null);
  const badgeRef              = useRef<HTMLDivElement>(null);

  // Remotion-style slide-up entrance
  useEffect(() => {
    const items = [
      { ref: barRef,  delay: 0.15 },
      { ref: hintRef, delay: 0.32 },
    ];
    items.forEach(({ ref, delay }) => {
      const el = ref.current;
      if (!el) return;
      el.style.opacity = "0";
      el.style.transform = "translateY(24px)";
      const t = setTimeout(() => {
        el.style.transition = `opacity 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}s`;
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
      }, 30);
      return () => clearTimeout(t);
    });
  }, []);

  // Animate reference badge in when found
  useEffect(() => {
    const el = badgeRef.current;
    if (!el) return;
    if (referenceFound) {
      el.style.opacity = "0";
      el.style.transform = "translateY(6px) scale(0.95)";
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.transition = "opacity 0.5s cubic-bezier(0.16,1,0.3,1), transform 0.5s cubic-bezier(0.16,1,0.3,1)";
          el.style.opacity = "1";
          el.style.transform = "translateY(0) scale(1)";
        });
      });
    }
  }, [referenceFound]);

  const handleSubmit  = () => { if (isGenerating) return; onGenerate(prompt.trim()); };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); handleSubmit(); }
  };

  // Dynamic hint text based on state
  const hintText = isSearchingRef
    ? "Searching the web for a visual reference…"
    : isGenerating
    ? "AI is reading your sketch and building your SVG logo…"
    : "Sketch above · Describe below · Press Generate";

  return (
    <>
      <style>{`
        @keyframes promptGlow {
          0%, 100% { box-shadow: 0 0 0 2px rgba(26,26,255,0.12), 0 8px 40px rgba(26,26,255,0.10); }
          50%       { box-shadow: 0 0 0 3px rgba(26,26,255,0.25), 0 8px 50px rgba(26,26,255,0.18); }
        }
        .prompt-generating { animation: promptGlow 2s ease infinite; }

        @keyframes globeSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .globe-spin { animation: globeSpin 1.8s linear infinite; }

        @keyframes refBadgePulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.6; }
        }
        .ref-badge-searching { animation: refBadgePulse 1.4s ease infinite; }
      `}</style>

      <div className="flex flex-col items-center gap-2">

        {/* Reference badge — shown while searching or after found */}
        {(isSearchingRef || referenceFound) && (
          <div
            ref={badgeRef}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-bold tracking-widest uppercase",
              isSearchingRef
                ? "border-[#1a1aff]/30 bg-white/90 text-[#1a1aff]/60 ref-badge-searching"
                : "border-[#1a1aff]/20 bg-[#f0f0ff] text-[#1a1aff]"
            )}
            style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
          >
            {isSearchingRef ? (
              <>
                <Globe className="size-3 globe-spin" />
                Searching web for reference…
              </>
            ) : referenceFound ? (
              <>
                <CheckCircle2 className="size-3 text-[#1a1aff]" />
                Reference found · {referenceFound.query}
              </>
            ) : null}
          </div>
        )}

        <div
          ref={barRef}
          className={cn(
            "w-full flex items-center gap-3 rounded-2xl border-2 px-4 py-0 h-14 bg-white transition-all duration-200",
            isGenerating
              ? "border-[#1a1aff] prompt-generating"
              : "border-[#1a1aff]/30 hover:border-[#1a1aff]/60 focus-within:border-[#1a1aff] focus-within:shadow-[0_0_0_2px_rgba(26,26,255,0.12),0_8px_40px_rgba(26,26,255,0.10)]"
          )}
        >
          {/* Icon — globe when searching ref, sparkles otherwise */}
          {isSearchingRef ? (
            <Globe className="size-4 shrink-0 text-[#1a1aff] globe-spin" />
          ) : (
            <Sparkles className={cn(
              "size-4 shrink-0 transition-colors",
              isGenerating ? "text-[#1a1aff] animate-pulse" : "text-[#1a1aff]/30"
            )} />
          )}

          <input
            type="text"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isGenerating}
            placeholder={HINTS[hintIdx]}
            className="flex-1 h-full bg-transparent text-sm text-[#1a1aff] placeholder:text-[#1a1aff]/30 outline-none disabled:opacity-40 min-w-0"
            style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
          />

          <button
            onClick={handleSubmit}
            disabled={isGenerating}
            className={cn(
              "shrink-0 h-9 px-5 rounded-xl border-2 font-bold text-[11px] tracking-widest uppercase gap-2 transition-all duration-200 flex items-center",
              isGenerating
                ? "border-[#1a1aff]/30 text-[#1a1aff]/50 cursor-not-allowed bg-[#1a1aff]/5"
                : "border-[#1a1aff] bg-[#1a1aff] text-white hover:bg-white hover:text-[#1a1aff] shadow-[0_0_20px_rgba(26,26,255,0.20)] hover:shadow-[0_0_32px_rgba(26,26,255,0.30)] active:scale-95"
            )}
            style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
          >
            {isSearchingRef
              ? <><Globe className="size-4 globe-spin" />Searching…</>
              : isGenerating
              ? <><Loader2 className="size-4 animate-spin" />Generating…</>
              : <><Wand2 className="size-4" />Generate</>}
          </button>
        </div>

        <p
          ref={hintRef}
          className="text-[11px] text-[#1a1aff]/40 text-center tracking-widest font-bold uppercase"
          style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
        >
          {hintText}
        </p>
      </div>
    </>
  );
}
