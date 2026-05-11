import { useEffect, useRef } from "react";
import { Navbar } from "../components/navbar";

const FEATURES = [
  {
    title: "AI-Powered Generation",
    desc: "Describe your brand in plain words. Our model turns it into a polished vector logo in seconds.",
  },
  {
    title: "Fully Editable Specs",
    desc: "Every shape, color, and stroke is exposed as a live spec you can tweak without touching code.",
  },
  {
    title: "SVG & PNG Export",
    desc: "Download production-ready SVG or a crisp PNG — perfectly composed on a clean background.",
  },
  {
    title: "Sketch-to-Logo",
    desc: "Draw a rough idea on canvas and let the AI interpret your sketch into a refined mark.",
  },
  {
    title: "Instant Previews",
    desc: "See every edit reflected live. No re-generation needed — changes propagate in milliseconds.",
  },
  {
    title: "Zero Design Skills Needed",
    desc: "Guided prompts and one-click refinements make professional branding accessible to everyone.",
  },
];

export default function FeaturesPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    el.style.opacity = "0";
    el.style.transform = "translateY(28px)";
    const t = setTimeout(() => {
      el.style.transition = "opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)";
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    }, 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const cards = gridRef.current?.querySelectorAll<HTMLDivElement>(".feat-card");
    if (!cards) return;
    cards.forEach((card, i) => {
      card.style.opacity = "0";
      card.style.transform = "translateY(32px)";
      setTimeout(() => {
        card.style.transition = `opacity 0.6s cubic-bezier(0.16,1,0.3,1) ${0.15 + i * 0.08}s, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${0.15 + i * 0.08}s`;
        card.style.opacity = "1";
        card.style.transform = "translateY(0)";
      }, 80);
    });
  }, []);

  return (
    <div
      className="min-h-screen bg-white relative overflow-hidden"
      style={{
        backgroundImage: "url('/hero-bg.png')",
        backgroundSize: "100% auto",
        backgroundPosition: "bottom center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <Navbar />

      <main className="mx-auto max-w-5xl px-6 lg:px-10 pt-32 pb-40">
        {/* Heading */}
        <div ref={heroRef} className="mb-16 text-center">
          <p
            className="text-[11px] font-bold tracking-widest text-[#1a1aff]/50 uppercase mb-4"
            style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
          >
            What's Inside
          </p>
          <h1 className="leading-[1.1] mb-5">
            <span
              className="block text-5xl md:text-6xl text-[#1a1aff]"
              style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: "italic", fontWeight: 400 }}
            >
              Built for speed.
            </span>
            <span
              className="block text-5xl md:text-6xl text-[#1a1aff]/30"
              style={{ fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 300 }}
            >
              Designed for craft.
            </span>
          </h1>
          <p
            className="text-[15px] text-[#1a1aff]/50 max-w-xl mx-auto leading-relaxed"
            style={{ fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 300 }}
          >
            Everything you need to go from idea to brand mark — without the design agency price tag.
          </p>
        </div>

        {/* Grid */}
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#1a1aff]/10">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="feat-card bg-white p-8 hover:bg-[#f0f0ff] transition-colors duration-200"
            >
              <div className="w-1 h-6 bg-[#1a1aff] mb-5" />
              <h3
                className="text-xl text-[#1a1aff] mb-3 leading-snug"
                style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: "italic", fontWeight: 400 }}
              >
                {f.title}
              </h3>
              <p
                className="text-[13px] text-[#1a1aff]/50 leading-relaxed"
                style={{ fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 300 }}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
