import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Button } from "./ui/button";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "FEATURES", href: "/features" },
  { label: "ABOUT", href: "/about" },
  { label: "CONTACT", href: "/contact" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  // Scroll-aware shadow/border — mirrors Remotion interpolate pattern
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Staggered entrance: slide nav down from -100% on mount
  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    el.style.transform = "translateY(-100%)";
    el.style.opacity = "0";
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = "transform 0.7s cubic-bezier(0.16,1,0.3,1), opacity 0.4s ease";
        el.style.transform = "translateY(0)";
        el.style.opacity = "1";
      });
    });
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <>
      <style>{`
        @keyframes navLinkIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .nav-link { opacity: 0; animation: navLinkIn 0.5s cubic-bezier(0.16,1,0.3,1) forwards; }
        .nav-link-0 { animation-delay: 0.25s; }
        .nav-link-1 { animation-delay: 0.32s; }
        .nav-link-2 { animation-delay: 0.39s; }
        .nav-link-3 { animation-delay: 0.46s; }
        .nav-link-4 { animation-delay: 0.53s; }
        .nav-logo  { opacity: 0; animation: navLinkIn 0.5s cubic-bezier(0.16,1,0.3,1) 0.18s forwards; }
        .nav-cta   { opacity: 0; animation: navLinkIn 0.5s cubic-bezier(0.16,1,0.3,1) 0.60s forwards; }
      `}</style>

      <nav
        ref={navRef}
        className="fixed top-0 left-0 right-0 z-50 bg-white"
        style={{
          boxShadow: scrolled ? "0 1px 0 0 rgba(26,26,255,0.10)" : "none",
          transition: "box-shadow 0.3s ease",
        }}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="relative flex h-14 items-center justify-between">

            {/* Logo */}
            <Link to="/" className="nav-logo">
              <img src="/brand-logo.png" alt="Logo" className="h-8 w-auto" />
            </Link>

            {/* Desktop nav links — centered absolutely */}
            <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
              {navLinks.map((link, i) => (
                <Link
                  key={link.label}
                  to={link.href}
                  className={`nav-link nav-link-${i} text-[11px] font-bold tracking-widest text-[#1a1aff] hover:opacity-40 transition-opacity`}
                  style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* CTA */}
            <div className="hidden md:block nav-cta">
              <Link to="/editor">
                <Button
                  variant="outline"
                  className="rounded-none border-2 border-[#1a1aff] text-[#1a1aff] bg-white hover:bg-[#1a1aff] hover:text-white text-[11px] font-bold tracking-widest h-9 px-5 shadow-none transition-colors duration-200"
                  style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
                >
                  GET STARTED →
                </Button>
              </Link>
            </div>

            {/* Mobile toggle */}
            <button
              className="md:hidden text-[#1a1aff] p-1"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <span
                style={{
                  display: "block",
                  transition: "transform 0.3s cubic-bezier(0.16,1,0.3,1), opacity 0.2s ease",
                  transform: mobileOpen ? "rotate(90deg)" : "rotate(0deg)",
                }}
              >
                {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile menu — slides down */}
        <div
          style={{
            overflow: "hidden",
            maxHeight: mobileOpen ? "400px" : "0px",
            transition: "max-height 0.45s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <div className="border-t border-[#1a1aff]/10 bg-white px-6 py-5 flex flex-col gap-5">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="text-[11px] font-bold tracking-widest text-[#1a1aff]"
                style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link to="/editor">
              <Button
                variant="outline"
                className="rounded-none border-2 border-[#1a1aff] text-[#1a1aff] bg-white hover:bg-[#1a1aff] hover:text-white text-[11px] font-bold tracking-widest w-full mt-1"
                style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
              >
                GET STARTED →
              </Button>
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
}
