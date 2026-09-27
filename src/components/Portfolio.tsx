"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ICONS } from "@/lib/content/icons";
import { I18N, LANGS } from "@/lib/content/i18n";
import { setLang, useLang } from "@/lib/content/lang-store";
import { PROJECTS, placeholderCover } from "@/lib/content/projects";
import { COLS, ROWS, TECH, TECH_FLAT, colorOf, inkFor, type Tech } from "@/lib/content/tech";
import { KeyboardScene, type Key } from "@/lib/three/keyboard-scene";
import { LABELS, SEG, buildTimeline } from "@/lib/timeline";

const EMAIL = "maxsai567@gmail.com";
const GITHUB = "https://github.com/sayonara213";
const LINKEDIN = "https://linkedin.com/in/maksym-sai";

/** USED[project][keyIndex] = 1 when the project uses that key's technology. */
const USED = PROJECTS.map((p) => TECH_FLAT.map((t) => (p.tech.includes(t.name) ? 1 : 0)));

type Active = Tech & { r: number };

/** One span per character, so GSAP can stagger letters in the splash and the hero name. */
const Chars = ({ text }: { text: string }) => (
  <>
    {[...text].map((ch, i) => (
      <span className="ch" key={i}>
        {ch}
      </span>
    ))}
  </>
);

const Logo = ({ slug, fill }: { slug: string; fill: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path fill={fill} d={ICONS[slug]} />
  </svg>
);

export default function Portfolio() {
  const lang = useLang();
  const t = I18N[lang];
  const [splashDone, setSplashDone] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [active, setActive] = useState<Active | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dogRef = useRef<HTMLElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLButtonElement>(null);
  const langRef = useRef(lang);
  const contactRef = useRef(contactOpen);
  const toggleDogRef = useRef<(on: boolean) => void>(() => {});

  useEffect(() => {
    langRef.current = lang;
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    contactRef.current = contactOpen;
    if (contactOpen) copyRef.current?.focus();
  }, [contactOpen]);

  useEffect(() => {
    const root = rootRef.current!, canvas = canvasRef.current!, tip = tipRef.current!, dog = dogRef.current!;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const legendFont = getComputedStyle(document.documentElement).getPropertyValue("--font-unbounded").trim() || "system-ui";

    const scene = new KeyboardScene(canvas, { legendFont, reducedMotion: reduced, used: USED });
    const showKey = (k: Key) => {
      if (k.state === "tech") setActive({ slug: k.slug, name: k.name, color: k.color, note: k.note, r: k.r });
    };
    let pointer = [0, 0];
    const placeTip = () => {
      const x = Math.min(Math.max(pointer[0], 130), innerWidth - 130);
      tip.style.transform = `translate(${x}px, ${pointer[1] - 18}px) translate(-50%,-100%)`;
    };
    scene.onHoverChange = (k) => {
      document.body.style.cursor = k ? "pointer" : "";
      if (k && k.state === "tech") {
        showKey(k);
        tip.replaceChildren(
          Object.assign(document.createElement("strong"), { textContent: k.name }),
          Object.assign(document.createElement("span"), { textContent: I18N[langRef.current].cats[k.r] }),
        );
        placeTip();
        tip.style.opacity = "1";
      } else tip.style.opacity = "0";
    };

    const mm = buildTimeline({
      scene,
      root,
      reduced,
      onProgress: (p) => {
        scene.scroll = p;
        if (progressRef.current) progressRef.current.style.transform = `scaleX(${p})`;
      },
    });

    // ---------- interaction ----------
    const onResize = () => scene.resize();
    const onPointerMove = (e: PointerEvent) => {
      scene.setPointer(e.clientX, e.clientY, e.pointerType);
      pointer = [e.clientX, e.clientY];
      if (scene.hovered) placeTip();
    };
    const onPointerDown = (e: PointerEvent) => {
      if ((e.target as Element).closest("button,a,#contact,#dog,.project,.footer-inner")) return;
      scene.setPointer(e.clientX, e.clientY, e.pointerType);
      const k = scene.pick();
      if (k) {
        k.press = 1;
        showKey(k);
      }
    };
    const toggleDog = (on: boolean) => {
      const d = reduced ? 0 : 1;
      if (on) {
        dog.hidden = false;
        gsap.fromTo(dog, { yPercent: 110, rotate: 14 }, { yPercent: -4, rotate: -6, duration: 0.7 * d, ease: "back.out(1.6)" });
      } else if (!dog.hidden) {
        gsap.to(dog, { yPercent: 110, rotate: 10, duration: 0.4 * d, ease: "power2.in", onComplete: () => void (dog.hidden = true) });
      }
    };
    toggleDogRef.current = toggleDog;
    let typed = "";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setContactOpen(false);
        toggleDog(false);
      }
      if (e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1 || contactRef.current) return;
      // Easter egg: type D-O-G anywhere.
      typed = (typed + e.key.toLowerCase()).slice(-3);
      if (typed === "dog" && dog.hidden) toggleDog(true);
      const hit = scene.pressLetter(e.key.toUpperCase()).find((k) => k.state === "tech");
      if (hit) showKey(hit);
    };
    addEventListener("resize", onResize);
    addEventListener("pointermove", onPointerMove, { passive: true });
    addEventListener("pointerdown", onPointerDown);
    addEventListener("keydown", onKeyDown);

    // ---------- debug HUD: add #debug to the URL ----------
    let hudRaf = 0;
    const hud = location.hash === "#debug" ? document.body.appendChild(Object.assign(document.createElement("div"), { id: "hud" })) : null;
    if (hud) {
      const kb = scene.kb, f = (n: number) => n.toFixed(2);
      const tick = () => {
        const time = scene.scroll * SEG.end;
        let label = "hero";
        for (const [n, v] of Object.entries(LABELS)) if (time >= v - 0.4) label = n;
        hud.textContent =
          `section  ${label}\ntl time  ${f(time)}\nscroll   ${scene.scroll.toFixed(3)}\n` +
          `flip     ${f(kb.flip)}  flip2 ${f(kb.flip2)}\nexp      ${f(kb.exp)}  proj ${f(kb.proj)}\nmotion   ${f(kb.motion)}\n` +
          `pos      ${f(kb.x)}, ${f(kb.y)}, ${f(kb.z)}\nrot      ${f(kb.rx)}, ${f(kb.ry)}, ${f(kb.rz)}\nscale    ${f(kb.s)}`;
        hudRaf = requestAnimationFrame(tick);
      };
      tick();
    }

    // ---------- splash → hero ----------
    let cancelled = false; // strict mode unmounts once before the fonts resolve
    const ctx = gsap.context(() => {
      const count = root.querySelector<HTMLElement>(".splash-count")!, bar = root.querySelector<HTMLElement>(".splash-bar i")!;
      const load = { v: 0 };
      const paint = () => {
        count.textContent = String(Math.round(load.v)).padStart(3, "0");
        bar.style.transform = `scaleX(${load.v / 100})`;
      };
      gsap.from(".splash-name .ch", { yPercent: 110, duration: 0.8, ease: "expo.out", stagger: 0.035 });
      gsap.to(load, { v: 90, duration: 1.3, ease: "power2.out", onUpdate: paint });
      gsap.set(".hero-name .ch", { yPercent: 110 });

      const fontsReady = Promise.race([
        Promise.all([document.fonts.load(`700 100px ${legendFont}`), document.fonts.ready]).catch(() => {}), // a failed font never blocks the intro
        new Promise((r) => setTimeout(r, 2500)),
      ]);
      Promise.all([fontsReady, new Promise((r) => setTimeout(r, 1300))]).then(() => {
        if (cancelled) return;
        scene.buildTextures();
        scene.start();
        ctx.add(() => {
          const out = gsap.timeline({
            onComplete: () => {
              document.body.classList.remove("is-loading");
              setSplashDone(true);
              ScrollTrigger.refresh();
            },
          });
          out.to(load, { v: 100, duration: 0.35, ease: "power1.out", onUpdate: paint })
            .to(".splash-name .ch", { yPercent: -110, duration: 0.6, ease: "expo.in", stagger: 0.025 }, "+=0.1")
            .to(".splash-meta, #splash .eyebrow", { opacity: 0, duration: 0.3 }, "<")
            .to("#splash", { clipPath: "inset(0 0 100% 0)", duration: 0.9, ease: "expo.inOut" }, "-=0.15")
            .to(".hero-name .ch", { yPercent: 0, duration: 1, ease: "expo.out", stagger: 0.03 }, "-=0.45")
            .from(".hero-meta", { opacity: 0, y: 12, duration: 0.6, immediateRender: false }, "-=0.7")
            .to(scene.kb, { introY: 0, duration: 1.4, ease: "expo.out" }, "-=1.1")
            .to(scene.keys, { drop: 0, duration: 0.9, ease: "back.out(1.6)", stagger: { each: 0.018, from: "center", grid: [ROWS, COLS] } }, "-=1.1");
          if (reduced) out.progress(1);
        });
      });
    }, root);

    return () => {
      cancelled = true;
      ctx.revert();
      mm.revert();
      cancelAnimationFrame(hudRaf);
      hud?.remove();
      removeEventListener("resize", onResize);
      removeEventListener("pointermove", onPointerMove);
      removeEventListener("pointerdown", onPointerDown);
      removeEventListener("keydown", onKeyDown);
      document.body.style.cursor = "";
      scene.dispose();
    };
  }, []);

  const copyMail = () => {
    const done = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    };
    navigator.clipboard?.writeText(EMAIL).then(done, () => {});
  };
  const toTop = (e: React.MouseEvent) => {
    e.preventDefault();
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <div ref={rootRef}>
      {!splashDone && (
        <div id="splash" aria-live="polite">
          <div className="splash-inner">
            <h2 className="splash-name" aria-label="Maksym Sai">
              <span className="word"><Chars text="Maksym" /></span>
              <span className="word"><Chars text="Sai" /></span>
            </h2>
            <div className="splash-meta">
              <div className="splash-bar"><i /></div>
              <span className="splash-count">000</span>
            </div>
            <div className="eyebrow">{t.splash}</div>
          </div>
        </div>
      )}

      <canvas id="gl" ref={canvasRef} aria-hidden="true" />
      <div id="scrim" aria-hidden="true" />

      <header className="site-header">
        <a className="brand" href="#" onClick={toTop}>
          Maksym Sai<span>{t.brand}</span>
        </a>
        <div className="header-actions">
          <div className="lang" role="group" aria-label="Language">
            {LANGS.map((l) => (
              <button type="button" key={l.id} aria-pressed={lang === l.id} onClick={() => setLang(l.id)}>
                {l.label}
              </button>
            ))}
          </div>
          <button type="button" className="btn-contact" onClick={() => setContactOpen(true)}>
            {t.contact}
          </button>
        </div>
        <div className="progress" ref={progressRef} aria-hidden="true" />
      </header>

      {/* Panels are fixed; the scroll timeline (lib/timeline.ts) shows and hides them. */}
      <main>
        <section className="panel" id="p-hero" data-state="hero" aria-label="Intro">
          <p className="eyebrow hero-meta">{t.eyebrow}</p>
          <h1 className="hero-name" aria-label="Maksym Sai">
            <span className="line"><Chars text="Maksym" /></span> <span className="line"><Chars text="Sai" /></span>
          </h1>
          <p className="hero-hint hero-meta">
            <kbd>S</kbd><kbd>A</kbd><kbd>I</kbd>
            <span>{t.hint}</span>
            <kbd className="rgb">↓</kbd>
          </p>
        </section>

        <section className="panel" id="p-stack" data-state="stack" aria-labelledby="stack-title">
          <div className="stack-copy live">
            <p className="eyebrow">{t.stackEyebrow}</p>
            <h2 id="stack-title">
              <span>{t.titleA}</span> <span className="rainbow-text">{t.titleB}</span>
            </h2>
            <p>{t.stackBody}</p>
            <ul className="cats">
              {t.cats.map((c, r) => (
                <li key={r} className={active?.r === r ? "is-active" : undefined}>
                  <i>
                    {TECH[r].slice(0, 4).map((x) => (
                      <b key={x.name} style={{ "--c": x.color } as React.CSSProperties} />
                    ))}
                  </i>
                  {c}
                  <span>0{r + 1}</span>
                </li>
              ))}
            </ul>
            <div className="readout" aria-live="polite">
              {active ? (
                <>
                  <span className="chip" style={{ background: active.color }}>
                    <Logo slug={active.slug} fill={inkFor(active.color)} />
                  </span>
                  <span className="txt">
                    <strong>{active.name}</strong>
                    <small>{active.note}</small>
                  </span>
                </>
              ) : (
                <>
                  <span className="chip">?</span>
                  <span className="txt">
                    <strong>{t.readoutTitle}</strong>
                    <small>{t.readoutSub}</small>
                  </span>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="panel" id="p-exp" data-state="experience" aria-label="Experience">
          {PROJECTS.map((p, i) => (
            <article className="project" key={p.title} data-side={i % 2 === 0 ? "right" : "left"} aria-label={p.title}>
              <div className="meta">
                <p className="eyebrow">{t.expEyebrow}</p>
                <span className="count">
                  0{i + 1} / 0{PROJECTS.length}
                </span>
              </div>
              <figure className="cover">
                <Image src={p.cover ?? placeholderCover(p, i)} alt={`${p.title} cover`} width={640} height={400} unoptimized />
              </figure>
              <h3>{p.title}</h3>
              <p className="desc">{p.desc}</p>
              <ul className="chips">
                {p.tech.map((n) => (
                  <li key={n}>
                    <b style={{ "--c": colorOf(n) } as React.CSSProperties} />
                    {n}
                  </li>
                ))}
              </ul>
              <div className="links">
                <a className="btn-primary" href={p.live} target="_blank" rel="noopener">
                  {t.live} ↗
                </a>
                {p.gh && (
                  <a className="btn-ghost" href={p.gh} target="_blank" rel="noopener">
                    GitHub ↗
                  </a>
                )}
              </div>
              {p.sample && <p className="sample">{t.sample}</p>}
            </article>
          ))}
        </section>

        <section className="panel" id="p-footer" data-state="footer" aria-labelledby="footer-title">
          <div className="footer-inner">
            <p className="eyebrow">{t.footerEyebrow}</p>
            <h2 className="footer-title" id="footer-title">
              <span>{t.footerA}</span> <span className="rainbow-text">{t.footerB}</span>
            </h2>
            <div className="cta-row">
              <button type="button" className="btn-primary" onClick={() => setContactOpen(true)}>
                <span>{t.footerCta}</span> <span aria-hidden="true">→</span>
              </button>
              <span className="mail">{EMAIL}</span>
            </div>
            <div className="links">
              <a className="btn-ghost" href={LINKEDIN} target="_blank" rel="noopener">
                LinkedIn ↗
              </a>
              <a className="btn-ghost" href={GITHUB} target="_blank" rel="noopener">
                GitHub ↗
              </a>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 Maksym Sai · Next.js, three.js, GSAP</span>
            <span className="right">
              <button type="button" className="keybtn" aria-label="Easter egg" onClick={() => toggleDogRef.current(!!dogRef.current?.hidden)}>
                psst
              </button>
              <button type="button" className="btn-ghost" onClick={toTop}>
                <span>{t.toTop}</span> ↑
              </button>
            </span>
          </div>
        </section>
      </main>
      {/* 7 viewports of scroll + 1 for the last screen; timeline time is measured in viewports. */}
      <div id="track" aria-hidden="true" />

      <div id="tip" ref={tipRef} role="status" />

      <figure id="dog" ref={dogRef} hidden>
        <Image src="/dog.jpg" alt="Maksym's small white dog lying on its back, one paw up" width={372} height={512} />
        <figcaption>{t.dog}</figcaption>
        <button type="button" aria-label={t.close} onClick={() => toggleDogRef.current(false)}>
          ×
        </button>
      </figure>

      <div id="contact" hidden={!contactOpen} onClick={(e) => e.target === e.currentTarget && setContactOpen(false)}>
        <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="contact-title">
          <h3 id="contact-title">{t.contactTitle}</h3>
          <div className="row">
            <span>{EMAIL}</span>
            <button type="button" ref={copyRef} onClick={copyMail}>
              {copied ? t.copied : t.copy}
            </button>
          </div>
          <div className="row">
            <a href={GITHUB} target="_blank" rel="noopener">github.com/sayonara213</a>
            <span aria-hidden="true">↗</span>
          </div>
          <div className="row">
            <a href={LINKEDIN} target="_blank" rel="noopener">linkedin.com/in/maksym-sai</a>
            <span aria-hidden="true">↗</span>
          </div>
          <button type="button" className="close" onClick={() => setContactOpen(false)}>
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
}
