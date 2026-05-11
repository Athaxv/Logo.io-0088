import { useEffect, useRef } from "react";
import { Navbar } from "../components/navbar";

export default function AboutPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    el.style.opacity = "0";
    el.style.transform = "translateY(30px)";
    const t = setTimeout(() => {
      el.style.transition = "opacity 0.75s cubic-bezier(0.16,1,0.3,1), transform 0.75s cubic-bezier(0.16,1,0.3,1)";
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    }, 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    el.style.opacity = "0";
    el.style.transform = "translateY(20px)";
    const t = setTimeout(() => {
      el.style.transition = "opacity 0.75s cubic-bezier(0.16,1,0.3,1) 0.2s, transform 0.75s cubic-bezier(0.16,1,0.3,1) 0.2s";
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    }, 80);
    return () => clearTimeout(t);
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

      <main className="mx-auto max-w-2xl px-6 lg:px-10 pt-36 pb-48 flex flex-col items-center text-center">
        <div ref={heroRef}>
          <p
            className="text-[11px] font-bold tracking-widest text-[#1a1aff]/50 uppercase mb-5"
            style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
          >
            About
          </p>

          {/* Status badge */}
          <div className="inline-flex items-center gap-2 border border-[#1a1aff]/20 px-4 py-2 mb-8 bg-white/80">
            <span
              className="w-2 h-2 rounded-full bg-[#1a1aff] animate-pulse"
              style={{ animationDuration: "1.6s" }}
            />
            <span
              className="text-[11px] font-bold tracking-widest text-[#1a1aff] uppercase"
              style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
            >
              In Active Development
            </span>
          </div>

          <h1 className="leading-[1.1] mb-8">
            <span
              className="block text-5xl md:text-6xl text-[#1a1aff]"
              style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: "italic", fontWeight: 400 }}
            >
              Building Logo.io
            </span>
            <span
              className="block text-5xl md:text-6xl text-[#1a1aff]/25"
              style={{ fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 300 }}
            >
              currently.
            </span>
          </h1>
        </div>

        <div ref={bodyRef} className="flex flex-col items-center gap-6 max-w-lg">
          <p
            className="text-[15px] text-[#1a1aff]/55 leading-relaxed"
            style={{ fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 300 }}
          >
            Logo.io is currently being built from scratch — an AI-powered logo generator that turns plain text into production-ready vector marks.
          </p>
          <p
            className="text-[15px] text-[#1a1aff]/55 leading-relaxed"
            style={{ fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 300 }}
          >
            The goal is simple: make great branding accessible to everyone, without the friction of design tools or the cost of agencies.
          </p>

          <div className="w-12 h-px bg-[#1a1aff]/20 my-2" />

          <p
            className="text-[13px] text-[#1a1aff]/40 leading-relaxed"
            style={{ fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 300 }}
          >
            More coming soon. Follow the build on{" "}
            <a
              href="https://github.com/Athaxv"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1a1aff] underline underline-offset-2 hover:opacity-50 transition-opacity"
            >
              GitHub
            </a>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
