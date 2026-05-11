import { Link } from "wouter";
import { Button } from "./ui/button";
import { useEffect, useRef } from "react";

export function Hero() {
  const lineRef = useRef<HTMLSpanElement>(null);

  // Animate the dotted divider expanding from 0 width
  useEffect(() => {
    const el = lineRef.current;
    if (!el) return;
    el.style.transform = "scaleX(0)";
    el.style.opacity = "0";
    const t = setTimeout(() => {
      el.style.transition = "transform 0.7s cubic-bezier(0.16,1,0.3,1) 0.55s, opacity 0.3s ease 0.55s";
      el.style.transform = "scaleX(1)";
      el.style.opacity = "1";
    }, 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <section
      className="min-h-screen bg-white flex flex-col items-center justify-start text-center px-6 pt-24 relative overflow-hidden"
      style={{
        backgroundImage: "url('/hero-bg.png')",
        backgroundSize: "100% auto",
        backgroundPosition: "bottom center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Headline */}
      <h1 className="text-[#1a1aff] leading-[1.1] max-w-2xl">
        <span
          className="block text-4xl sm:text-5xl md:text-[58px] hero-line-1"
          style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: "italic", fontWeight: 400 }}
        >
          The AI Logo Maker
        </span>
        <span
          className="block text-4xl sm:text-5xl md:text-[58px] hero-line-2"
          style={{ fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 300 }}
        >
          for founders &amp; builders!
        </span>
      </h1>

      {/* Dotted divider */}
      <div className="mt-8 mb-7 flex items-center justify-center gap-[5px] overflow-hidden">
        <span ref={lineRef} className="flex items-center gap-[5px]" style={{ transformOrigin: "left center" }}>
          {Array.from({ length: 22 }).map((_, i) => (
            <span key={i} className="block size-[5px] rounded-full bg-[#1a1aff] shrink-0" />
          ))}
        </span>
      </div>

      {/* Subtitle */}
      <p
        className="font-body text-[#1a1aff]/60 text-sm sm:text-base max-w-sm leading-relaxed hero-subtitle"
        style={{ fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 300 }}
      >
        Sketch an idea or describe your brand — our AI turns it into a
        sleek, scalable vector logo in seconds.
      </p>

      {/* CTA row */}
      <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4 hero-cta">
        <Link to="/editor">
          <Button className="font-body rounded-none bg-[#1a1aff] text-white hover:bg-[#1a1aff]/90 text-[11px] font-bold tracking-widest h-11 px-7 shadow-none">
            GET STARTED →
          </Button>
        </Link>
        <button
          className="font-body flex items-center gap-2.5 text-[11px] font-bold tracking-widest text-[#1a1aff] hover:opacity-50 transition-opacity"
          style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
        >
          <span className="flex size-8 items-center justify-center rounded-full border-2 border-[#1a1aff]">
            <svg viewBox="0 0 10 12" fill="currentColor" className="size-2.5 translate-x-[1px]">
              <path d="M0 0l10 6-10 6V0z" />
            </svg>
          </span>
          SEE HOW IT WORKS
        </button>
      </div>

      <style>{`
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-line-1 {
          opacity: 0;
          animation: heroFadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.05s forwards;
        }
        .hero-line-2 {
          opacity: 0;
          animation: heroFadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.18s forwards;
        }
        .hero-subtitle {
          opacity: 0;
          animation: heroFadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.72s forwards;
        }
        .hero-cta {
          opacity: 0;
          animation: heroFadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.88s forwards;
        }
      `}</style>
    </section>
  );
}
