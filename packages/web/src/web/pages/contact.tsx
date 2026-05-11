import { useEffect, useRef, useState } from "react";
import { Navbar } from "../components/navbar";

export default function ContactPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const [hovered, setHovered] = useState(false);

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
    const cards = cardsRef.current?.querySelectorAll<HTMLDivElement>(".contact-card");
    if (!cards) return;
    cards.forEach((card, i) => {
      card.style.opacity = "0";
      card.style.transform = "translateY(24px)";
      setTimeout(() => {
        card.style.transition = `opacity 0.6s cubic-bezier(0.16,1,0.3,1) ${0.2 + i * 0.12}s, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${0.2 + i * 0.12}s`;
        card.style.opacity = "1";
        card.style.transform = "translateY(0)";
      }, 80);
    });
  }, []);

  // CTA entrance — delayed after cards
  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    el.style.opacity = "0";
    el.style.transform = "translateY(20px)";
    setTimeout(() => {
      el.style.transition = "opacity 0.65s cubic-bezier(0.16,1,0.3,1) 0.7s, transform 0.65s cubic-bezier(0.16,1,0.3,1) 0.7s";
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    }, 80);
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

      <main className="mx-auto max-w-xl px-6 lg:px-10 pt-36 pb-48 flex flex-col items-center text-center">
        {/* Heading */}
        <div ref={heroRef} className="mb-12">
          <p
            className="text-[11px] font-bold tracking-widest text-[#1a1aff]/50 uppercase mb-5"
            style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
          >
            Contact
          </p>
          <h1 className="leading-[1.1] mb-5">
            <span
              className="block text-5xl md:text-6xl text-[#1a1aff]"
              style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: "italic", fontWeight: 400 }}
            >
              Get in touch.
            </span>
          </h1>
          <p
            className="text-[15px] text-[#1a1aff]/50 leading-relaxed"
            style={{ fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 300 }}
          >
            Have a question or want to follow the build? Reach out directly.
          </p>
        </div>

        {/* Contact cards */}
        <div ref={cardsRef} className="flex flex-col gap-3 w-full">
          {/* Name */}
          <div className="contact-card border border-[#1a1aff]/15 bg-white/80 px-6 py-5 text-left flex flex-col gap-1">
            <span
              className="text-[10px] font-bold tracking-widest text-[#1a1aff]/40 uppercase"
              style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
            >
              Builder
            </span>
            <span
              className="text-2xl text-[#1a1aff]"
              style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: "italic", fontWeight: 400 }}
            >
              Atharv Gaur
            </span>
          </div>

          {/* Email card */}
          <div className="contact-card border border-[#1a1aff]/15 bg-white/80 px-6 py-5 text-left flex flex-col gap-1">
            <span
              className="text-[10px] font-bold tracking-widest text-[#1a1aff]/40 uppercase"
              style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
            >
              Email
            </span>
            <span
              className="text-2xl text-[#1a1aff]/60"
              style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: "italic", fontWeight: 400 }}
            >
              laatharv@gmail.com
            </span>
          </div>

          {/* GitHub card — correct url */}
          <div className="contact-card border border-[#1a1aff]/15 bg-white/80 px-6 py-5 text-left flex flex-col gap-1">
            <span
              className="text-[10px] font-bold tracking-widest text-[#1a1aff]/40 uppercase"
              style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
            >
              GitHub
            </span>
            <a
              href="https://github.com/athaxv"
              target="_blank"
              rel="noopener noreferrer"
              className="text-2xl text-[#1a1aff]/60 hover:text-[#1a1aff] transition-colors"
              style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: "italic", fontWeight: 400 }}
            >
              athaxv
            </a>
          </div>
        </div>

        {/* ── Email CTA ── */}
        <a
          ref={ctaRef}
          href="mailto:laatharv@gmail.com?subject=Hey%20Atharv%20👋&body=Hi%20Atharv%2C%0A%0AI%20found%20Logo.io%20and%20wanted%20to%20reach%20out..."
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="mt-10 w-full group relative overflow-hidden flex items-center justify-between px-7 py-5 border-2 border-[#1a1aff] bg-white"
          style={{
            transition: "background 0.35s cubic-bezier(0.16,1,0.3,1)",
            background: hovered ? "#1a1aff" : "white",
          }}
        >
          {/* sliding bg fill on hover */}
          <span
            className="pointer-events-none absolute inset-0 translate-x-[-101%] group-hover:translate-x-0"
            style={{
              background: "#1a1aff",
              transition: "transform 0.45s cubic-bezier(0.16,1,0.3,1)",
            }}
          />

          <span className="relative flex flex-col items-start gap-0.5">
            <span
              className="text-[10px] font-bold tracking-widest uppercase"
              style={{
                fontFamily: '"Inter", system-ui, sans-serif',
                color: hovered ? "rgba(255,255,255,0.55)" : "rgba(26,26,255,0.45)",
                transition: "color 0.3s ease",
              }}
            >
              Open your mail app
            </span>
            <span
              className="text-xl"
              style={{
                fontFamily: '"Instrument Serif", Georgia, serif',
                fontStyle: "italic",
                fontWeight: 400,
                color: hovered ? "#fff" : "#1a1aff",
                transition: "color 0.3s ease",
              }}
            >
              Send me a message →
            </span>
          </span>

          {/* Animated arrow */}
          <span
            className="relative flex items-center justify-center w-10 h-10 border rounded-full shrink-0"
            style={{
              borderColor: hovered ? "rgba(255,255,255,0.4)" : "rgba(26,26,255,0.25)",
              transition: "border-color 0.3s ease, transform 0.4s cubic-bezier(0.16,1,0.3,1)",
              transform: hovered ? "rotate(45deg)" : "rotate(0deg)",
            }}
          >
            <svg
              viewBox="0 0 12 12"
              fill="none"
              className="w-3.5 h-3.5"
              stroke={hovered ? "#fff" : "#1a1aff"}
              strokeWidth="1.8"
              style={{ transition: "stroke 0.3s ease" }}
            >
              <path d="M1 11 L11 1 M11 1 H4 M11 1 V8" />
            </svg>
          </span>
        </a>

        {/* Dotted hint below */}
        <p
          className="mt-4 text-[11px] text-[#1a1aff]/30 tracking-wide"
          style={{ fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 300 }}
        >
          Opens your default mail client · no forms, no middlemen
        </p>
      </main>
    </div>
  );
}
