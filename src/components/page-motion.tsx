"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Content is visible by default, including before hydration and without JavaScript. */
export function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || !window.matchMedia || !("IntersectionObserver" in window)) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches) return;
    const bounds = element.getBoundingClientRect();
    if (bounds.top < window.innerHeight && bounds.bottom > 0) return;
    let revealed = false;
    const observer = new window.IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting || revealed) continue;
        revealed = true;
        // Animate only on arrival, never hide content while waiting for an observer.
        if (!motion.matches) element.classList.add("reveal-arrived");
        observer.unobserve(element);
      }
    }, { threshold: 0.12 });
    observer.observe(element);
    const stopMotion = () => { if (motion.matches) element.classList.remove("reveal-arrived"); };
    motion.addEventListener?.("change", stopMotion);
    return () => { observer.disconnect(); motion.removeEventListener?.("change", stopMotion); };
  }, []);
  return <div ref={ref} className={className} style={{ animationDelay: `${Math.min(160, Math.max(0, delay))}ms` }}>{children}</div>;
}

const features = ["Estimate your EMI", "Request a loan callback", "For salaried applicants", "Enquiries across India"];

export function DiagramSequence({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const played = useRef(false);
  useEffect(() => {
    if (!window.matchMedia) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const element = ref.current;
    const sync = () => {
      if (query.matches) element?.classList.remove("diagram-sequence");
      else if (!played.current) {
        played.current = true;
        element?.classList.add("diagram-sequence");
      }
    };
    sync();
    query.addEventListener?.("change", sync);
    return () => query.removeEventListener?.("change", sync);
  }, []);
  return <div ref={ref} className="financial-grid" aria-label="From your profile to a conversation">{children}</div>;
}

function useDesktopMotion() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!window.matchMedia) return;
    const query = window.matchMedia("(min-width: 861px) and (prefers-reduced-motion: no-preference)");
    if (!query.addEventListener) return;
    const syncMedia = () => setEnabled(query.matches);
    syncMedia();
    query.addEventListener("change", syncMedia);
    return () => query.removeEventListener("change", syncMedia);
  }, []);

  return enabled;
}

export function BankMarquee({ children }: { children: ReactNode }) {
  const enabled = useDesktopMotion();
  return <div className="bank-marquee" data-motion={enabled}>
    <div className="bank-track">
      <div className="bank-grid">{children}</div>
      {enabled && <div className="bank-grid bank-copy" aria-hidden="true">{children}</div>}
    </div>
  </div>;
}

export function FeatureStrip() {
  const enabled = useDesktopMotion();
  return <section className="feature-strip" aria-label="Enquiry at a glance" data-motion={enabled}>
    <div className="feature-strip-inner container">
      <div className="feature-window">
        <div className="feature-track" style={{ animationPlayState: enabled ? "running" : "paused" }}>
          <ul className="feature-list">{features.map(text => <li key={text}>{text}</li>)}</ul>
          {enabled && <ul className="feature-list feature-copy" aria-hidden="true">{features.map(text => <li key={text}>{text}</li>)}</ul>}
        </div>
      </div>
    </div>
  </section>;
}
