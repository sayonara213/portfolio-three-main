"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { I18N, LANGS, type Lang } from "@/lib/content/i18n";
import { setUserProps, track, trackOnce } from "@/lib/analytics";
import { setLang, useLang } from "@/lib/content/lang-store";
import { PROJECTS, placeholderCover } from "@/lib/content/projects";
import { TECH_FLAT, colorOf } from "@/lib/content/tech";
import type { HeroAction } from "@/lib/content/glyphs";
import { GlassButton } from "@/components/glass/GlassButton";
import { StackLegend, activeTech } from "@/components/StackLegend";
import { GlassOrb } from "@/components/glass/GlassOrb";
import { GlassSegmented } from "@/components/glass/GlassSegmented";
import { Glass } from "@/components/glass/Glass";
import { listen } from "@/lib/dom";
import { GLASS, OVER_CANVAS } from "@/lib/glass/params";
import { supportsSvgBackdrop, useSvgBackdrop } from "@/lib/glass/support";
import { createLiquid } from "@/lib/liquid/liquid";
import { LIQUID, POPOVER, REST, SHEET } from "@/lib/liquid/motion";
import { useLiquidPresence } from "@/lib/liquid/use-liquid";
import { KeyboardScene, createNullScene, type Key } from "@/lib/three/keyboard-scene";
import { SCROLL_LENGTH, buildTimeline, type Section } from "@/lib/timeline";

const EMAIL = "maxsai567@gmail.com";
const GITHUB = "https://github.com/sayonara213";
const LINKEDIN = "https://linkedin.com/in/maksym-sai";

const LANG_TRACK = { ...GLASS.clear, ...OVER_CANVAS };
const LANG_BLOB = { ...GLASS.primary, ...OVER_CANVAS };
const LANG_OPTIONS = LANGS.map((l) => ({ id: l.id, label: l.label, lang: l.id }));

const KEY_GLASS = { radius: 8, bezel: 10 };

const USED = PROJECTS.map((p) => TECH_FLAT.map((t) => (p.tech.includes(t.name) ? 1 : 0)));

const nextLang = (l: string) => LANGS[(LANGS.findIndex((x) => x.id === l) + 1) % LANGS.length];
const langLabel = (l: string) => LANGS.find((x) => x.id === l)?.label ?? "EN";


export default function Portfolio() {
  const lang = useLang();
  const t = I18N[lang];
  const name = `${t.nameA} ${t.nameB}`;
  const [splashDone, setSplashDone] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [orbOpen, setOrbOpen] = useState(false);
  const glassFx = useSvgBackdrop();
  const orbOpenRef = useRef(orbOpen);
  useEffect(() => void (orbOpenRef.current = orbOpen), [orbOpen]);
  const [copied, setCopied] = useState(false);
  const [idx, setIdx] = useState(0);
  const idxRef = useRef(0);
  const swipeX = useRef<number | null>(null);
  const goRef = useRef<(n: number, via?: string) => void>(() => {});

  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dogRef = useRef<HTMLElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const tipBodyRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLButtonElement>(null);
  const langRef = useRef(lang);
  const openContact = (via: string) => {
    track("contact_open", { via });
    setContactOpen(true);
  };
  const closeContact = (via: string) => {
    track("contact_close", { via });
    setContactOpen(false);
  };
  const changeLang = (to: Lang, via: string) => {
    track("language_change", { language: to, from: lang, via });
    setLang(to);
  };
  const contactRef = useRef(contactOpen);
  const contactShown = useLiquidPresence(sheetRef, contactOpen, SHEET);
  const toggleDogRef = useRef<(on: boolean, via?: string) => void>(() => {});
  const sceneRef = useRef<KeyboardScene | null>(null);

  useEffect(() => {
    langRef.current = lang;
    document.documentElement.lang = lang;
    setUserProps({ language: lang });
    document.title = I18N[lang].metaTitle;
    document.querySelector('meta[name="description"]')?.setAttribute("content", I18N[lang].metaDesc);
    const scene = sceneRef.current;
    scene?.setLangLabel(langLabel(lang));
    if (scene?.hovered?.action === "lang") scene.onHoverChange?.(scene.hovered);
  }, [lang]);

  const openerRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    contactRef.current = contactOpen;
    if (!contactOpen) return;
    // Off-board pointer: no key hover behind the dialog
    sceneRef.current?.setPointer(1e6, 0, "mouse");
    openerRef.current = document.activeElement as HTMLElement | null;
    copyRef.current?.focus();
    const html = document.documentElement;
    html.classList.add("modal-open");
    return () => {
      html.classList.remove("modal-open");
      openerRef.current?.focus?.({ preventScroll: true });
    };
  }, [contactOpen]);

  useEffect(() => {
    const root = rootRef.current!, canvas = canvasRef.current!, tip = tipRef.current!, tipBody = tipBodyRef.current!, dog = dogRef.current!;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const legendFont = getComputedStyle(document.documentElement).getPropertyValue("--font-unbounded").trim() || "system-ui";

    // A reload mid-page would otherwise restore a scroll position under the splash and jump the timeline.
    history.scrollRestoration = "manual";
    scrollTo(0, 0);

    let scene: KeyboardScene;
    let hasGL = true;
    try {
      scene = new KeyboardScene(canvas, { legendFont, reducedMotion: reduced, used: USED, omitActions: supportsSvgBackdrop() ? [] : ["glass"] });
    } catch {
      hasGL = false;
      scene = createNullScene();
      canvas.hidden = true;
      track("webgl_unavailable");
    }
    sceneRef.current = scene;
    scene.setLangLabel(langLabel(langRef.current));
    setUserProps({ reduced_motion: reduced, pointer: matchMedia("(pointer: coarse)").matches ? "touch" : "mouse", layout: innerWidth >= 768 ? "desktop" : "mobile" });
    const showKey = (k: Key) => {
      if (k.state === "tech") activeTech.set({ slug: k.slug, name: k.name, color: k.color, note: k.note, r: k.r });
    };
    let pointer = [0, 0];
    const placeTip = () => {
      const x = Math.min(Math.max(pointer[0], 130), innerWidth - 130);
      tip.style.transform = `translate(${x}px, ${pointer[1] - 18}px) translate(-50%,-100%)`;
    };
    const tipLiquid = createLiquid(tip, POPOVER, POPOVER.labelFollow);
    let tipOn = false;
    const showTip = (...content: Node[]) => {
      tipBody.replaceChildren(...content);
      placeTip();
      if (tipOn) return tipLiquid.kick(POPOVER.change);
      tipOn = true;
      tip.dataset.presence = "open";
      tipLiquid.snap(POPOVER.appear);
      tipLiquid.to(REST);
    };
    const hideTip = () => {
      tipOn = false;
      tip.dataset.presence = "closing";
    };
    let hoverTimer = 0;
    scene.onHoverChange = (k) => {
      clearTimeout(hoverTimer);
      const label = k && (k.state === "tech" ? k.name : k.state === "hero" ? k.action : undefined);
      if (k && label) hoverTimer = window.setTimeout(() => trackOnce("key_hover", label, { key_name: label, key_state: k.state ?? undefined }), 450);
      document.body.style.cursor = k && (k.action || k.state === "tech") ? "pointer" : "";
      if (k && k.state === "hero" && k.action) {
        const d = I18N[langRef.current];
        const sub = k.action === "lang" ? `${langLabel(langRef.current)} → ${nextLang(langRef.current).label}` : "";
        showTip(
          Object.assign(document.createElement("strong"), { textContent: d.keys[k.action] }),
          ...(sub ? [Object.assign(document.createElement("span"), { textContent: sub })] : []),
        );
      } else if (k && k.state === "tech") {
        showKey(k);
        showTip(
          Object.assign(document.createElement("strong"), { textContent: k.name }),
          Object.assign(document.createElement("span"), { textContent: I18N[langRef.current].cats[k.r] }),
        );
      } else hideTip();
    };

    let section: Section = "hero";
    const mm = buildTimeline({
      scene,
      root,
      reduced,
      onSection: (s) => {
        section = s;
        trackOnce("section_view", s, { section: s });
      },
      onProgress: (p) => {
        scene.scroll = p;
        for (const d of [25, 50, 75, 100]) if (p * 100 >= d - 0.5) trackOnce("scroll_depth", String(d), { percent: d });
        if (progressRef.current) progressRef.current.style.transform = `scaleX(${p})`;
      },
    });

    const slides = gsap.utils.toArray<HTMLElement>(".slide", root);
    gsap.set(slides.slice(1), { autoAlpha: 0 });
    const go = (to: number, via = "button") => {
      const from = idxRef.current;
      if (to < 0 || to >= slides.length || to === from) return;
      const dir = to > from ? 1 : -1, d = reduced ? 0 : 1;
      idxRef.current = to;
      setIdx(to);
      track("project_view", { project: PROJECTS[to].title, index: to + 1, via });
      slides.forEach((sl, i) => i !== from && i !== to && gsap.set(sl, { autoAlpha: 0 }));
      gsap.to(slides[from], { autoAlpha: 0, x: -dir * 32, duration: 0.28 * d, ease: "power2.in", overwrite: true });
      gsap.fromTo(slides[to], { autoAlpha: 0, x: dir * 32 }, { autoAlpha: 1, x: 0, duration: 0.5 * d, delay: 0.2 * d, ease: "power2.out", overwrite: true });
      gsap.to(scene.kb, { proj: to, duration: 0.9 * d, ease: "power2.inOut", overwrite: "auto" });
    };
    goRef.current = go;

    const onResize = () => scene.resize();
    const onPointerMove = (e: PointerEvent) => {
      if (contactRef.current || (e.target as Element).closest?.("#orb,.tuner")) return scene.setPointer(1e6, 0, e.pointerType);
      scene.setPointer(e.clientX, e.clientY, e.pointerType);
      pointer = [e.clientX, e.clientY];
      if (scene.hovered) placeTip();
    };
    const onPointerDown = (e: PointerEvent) => {
      if ((e.target as Element).closest("button,a,#contact,#dog,#orb,.tuner,.exp,.footer-inner")) return;
      scene.setPointer(e.clientX, e.clientY, e.pointerType);
      const k = scene.pick();
      if (k) {
        k.press = 1;
        showKey(k);
        track("key_press", { key_name: k.state === "tech" ? k.name : k.state === "name" ? k.nameCh : (k.action ?? k.hero), key_state: k.state ?? undefined, via: "pointer" });
      }
    };
    const toggleDog = (on: boolean, via = "unknown") => {
      const d = reduced ? 0 : 1;
      if (on) {
        if (dog.hidden) track("easter_egg", { name: "dog", via });
        dog.hidden = false;
        gsap.fromTo(dog, { yPercent: 110, rotate: 14 }, { yPercent: -4, rotate: -6, duration: 0.7 * d, ease: "back.out(1.6)" });
      } else if (!dog.hidden) {
        track("easter_egg_close", { name: "dog" });
        gsap.to(dog, { yPercent: 110, rotate: 10, duration: 0.4 * d, ease: "power2.in", onComplete: () => void (dog.hidden = true) });
      }
    };
    toggleDogRef.current = toggleDog;
    const toggleOrb = (via: string) => {
      if (!supportsSvgBackdrop()) return;
      const on = !orbOpenRef.current;
      if (on) track("easter_egg", { name: "glass_orb", via });
      orbOpenRef.current = on; // so a quick second toggle flips back before React re-renders
      setOrbOpen(on);
    };

    // Hero function keys (top row). Runs on click, not pointerdown: touch pointerdown doesn't count as a user gesture for window.open.
    const runAction = (a: HeroAction) => {
      track("hero_key_action", { action: a });
      if (a === "lang") {
        const next = nextLang(langRef.current).id;
        track("language_change", { language: next, from: langRef.current, via: "hero_key" });
        langRef.current = next; // so a quick second click moves on again before React re-renders
        setLang(next);
      }
      else if (a === "linkedin" || a === "github") {
        const url = a === "linkedin" ? LINKEDIN : GITHUB;
        track("link_click", { link_url: url, link_text: a, link_location: "hero_key", outbound: true });
        window.open(url, "_blank", "noopener");
      }
      else if (a === "contact") {
        track("contact_open", { via: "hero_key" });
        setContactOpen(true);
      }
      else if (a === "glass") toggleOrb("hero_key");
      else toggleDog(dog.hidden, "hero_key");
    };
    const onClick = (e: MouseEvent) => {
      if (contactRef.current || (e.target as Element).closest("button,a,#contact,#dog,#orb,.tuner,.exp,.footer-inner")) return;
      const k = scene.pickAt(e.clientX, e.clientY);
      if (k?.state === "hero" && k.action) runAction(k.action);
    };
    let typed = "";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Topmost layer only
        if (contactRef.current) {
          track("contact_close", { via: "escape" });
          setContactOpen(false);
        } else {
          toggleDog(false);
          setOrbOpen(false);
        }
      }
      if ((e.target as Element).closest?.("input,textarea,select")) return;
      if ((e.key === "ArrowRight" || e.key === "ArrowLeft") && !contactRef.current && section === "experience") go(idxRef.current + (e.key === "ArrowRight" ? 1 : -1), "key");
      if (e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1 || contactRef.current) return;
      typed = (typed + e.key.toLowerCase()).slice(-5);
      if (typed.endsWith("dog") && dog.hidden) toggleDog(true, "typed_dog");
      if (typed === "glass") {
        toggleOrb("typed_glass");
        typed = "";
      }
      const pressed = scene.pressLetter(e.key.toUpperCase());
      if (pressed.length) trackOnce("key_type", e.key.toUpperCase(), { letter: e.key.toUpperCase() });
      const hit = pressed.find((k) => k.state === "tech");
      if (hit) showKey(hit);
    };
    const unlisten = [
      listen<WindowEventMap>(window, { resize: onResize, pointerdown: onPointerDown, click: onClick, keydown: onKeyDown }),
      listen<WindowEventMap>(window, { pointermove: onPointerMove }, { passive: true }),
    ];

    const onLinkClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.getAttribute("href") === "#") return;
      const url = new URL(a.href, location.href);
      track("link_click", {
        link_url: a.href,
        link_text: (a.textContent ?? "").trim().slice(0, 60),
        link_domain: url.hostname,
        outbound: url.origin !== location.origin,
        link_location: a.closest("#contact") ? "contact_sheet" : a.closest("header") ? "header" : (a.closest("[id^='p-']")?.id ?? "page"),
        project: a.closest(".slide")?.querySelector("h3")?.textContent ?? undefined,
      });
    };
    let errors = 0;
    const onError = (e: ErrorEvent) => {
      if (errors++ < 5) track("js_error", { message: (e.message ?? "").slice(0, 100), source: e.filename?.split("/").pop() });
    };
    unlisten.push(listen<WindowEventMap>(window, { click: onLinkClick, error: onError }));

    let hudRaf = 0;
    const hud = location.hash === "#debug" ? document.body.appendChild(Object.assign(document.createElement("div"), { id: "hud" })) : null;
    if (hud) {
      const kb = scene.kb, f = (n: number) => n.toFixed(2);
      const tick = () => {
        hud.textContent =
          `section  ${section}\nscrolled ${f(scene.scroll * SCROLL_LENGTH)} vh\n` +
          `flip     ${f(kb.flip)}  flip2 ${f(kb.flip2)}\nexp      ${f(kb.exp)}  proj ${f(kb.proj)}\nmotion   ${f(kb.motion)}\n` +
          `pos      ${f(kb.x)}, ${f(kb.y)}, ${f(kb.z)}\nrot      ${f(kb.rx)}, ${f(kb.ry)}, ${f(kb.rz)}\nscale    ${f(kb.s)}`;
        hudRaf = requestAnimationFrame(tick);
      };
      tick();
    }

    let cancelled = false; // strict mode unmounts once before the fonts resolve
    const ctx = gsap.context(() => {
      const count = root.querySelector<HTMLElement>(".splash-count")!, bar = root.querySelector<HTMLElement>(".splash-bar i")!;
      const load = { v: 0 };
      const paint = () => {
        count.textContent = String(Math.round(load.v)).padStart(3, "0");
        bar.style.transform = `scaleX(${load.v / 100})`;
      };
      gsap.from(".splash-name", { opacity: 0, y: 12, duration: 0.8, ease: "power2.out" });
      gsap.to(load, { v: 90, duration: 1.3, ease: "power2.out", onUpdate: paint });
      gsap.set(canvas, { opacity: 0 });

      const fontsReady = Promise.race([
        Promise.all([document.fonts.load(`700 100px ${legendFont}`), document.fonts.ready]).catch(() => {}),
        new Promise((r) => setTimeout(r, 2500)),
      ]);
      Promise.all([fontsReady, new Promise((r) => setTimeout(r, hasGL ? 1300 : 300))]).then(() => {
        if (cancelled) return;
        scene.buildTextures();
        scene.start();
        ctx.add(() => {
          const out = gsap.timeline({
            onComplete: () => {
              document.body.classList.remove("is-loading");
              track("intro_complete", { ms: Math.round(performance.now()) });
              setSplashDone(true);
              ScrollTrigger.refresh();
            },
          });
          out.to(load, { v: 100, duration: 0.35, ease: "power1.out", onUpdate: paint })
            .to("#splash", { opacity: 0, duration: 0.8, ease: "power2.inOut" }, "+=0.15")
            .to(canvas, { opacity: 1, duration: 1.2, ease: "power2.out" }, "<0.1")
            .to(scene.kb, { intro: 1, duration: 1.6, ease: "power3.out" }, "<")
            .fromTo(".hero-name, .hero-meta", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.9, ease: "power2.out", stagger: 0.12 }, "-=0.9");
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
      unlisten.forEach((off) => off());
      clearTimeout(hoverTimer);
      tipLiquid.destroy();
      document.body.style.cursor = "";
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  const copiedTimer = useRef(0);
  useEffect(() => () => clearTimeout(copiedTimer.current), []);
  const mailRef = useRef<HTMLSpanElement>(null);
  const copyMail = () => {
    const done = () => {
      setCopied(true);
      clearTimeout(copiedTimer.current);
      copiedTimer.current = window.setTimeout(() => setCopied(false), 1600);
    };
    const fallback = () => {
      track("email_copy", { ok: false });
      const el = mailRef.current;
      if (el) getSelection()?.selectAllChildren(el);
    };
    if (!navigator.clipboard) return fallback();
    navigator.clipboard.writeText(EMAIL).then(() => {
      track("email_copy", { ok: true });
      done();
    }, fallback);
  };
  // Keeps Tab inside the contact sheet (inert covers clicks and AT; this covers the browser chrome wrap-around).
  const trapFocus = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key !== "Tab") return;
    const f = e.currentTarget.querySelectorAll<HTMLElement>("button, a[href]");
    const first = f[0], last = f[f.length - 1];
    const to = e.shiftKey ? (document.activeElement === first ? last : null) : document.activeElement === last ? first : null;
    if (!to) return;
    e.preventDefault();
    to.focus();
  };
  const toTop = (e: React.MouseEvent) => {
    e.preventDefault();
    track("back_to_top", { via: (e.currentTarget as HTMLElement).classList.contains("brand") ? "brand" : "footer" });
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <div ref={rootRef}>
      {!splashDone && (
        <div id="splash" role="status">
          <div className="splash-inner">
            <h2 className="splash-name">{name}</h2>
            <div className="splash-meta" aria-hidden="true">
              <div className="splash-bar"><i /></div>
              <span className="splash-count">000</span>
            </div>
            <div className="eyebrow">{t.splash}</div>
          </div>
        </div>
      )}

      <canvas id="gl" ref={canvasRef} aria-hidden="true" />
      <div id="scrim" aria-hidden="true" />

      <header className="site-header" inert={contactOpen}>
        <a className="brand" href="#" onClick={toTop}>
          {name}<span>{t.brand}</span>
        </a>
        <div className="header-actions">
          <GlassButton variant="primary" glass={OVER_CANVAS} className="btn-contact" onClick={() => openContact("header")}>
            {t.contact}
          </GlassButton>
          <GlassSegmented className="lang" track={LANG_TRACK} blob={LANG_BLOB} aria-label={t.aria.lang} options={LANG_OPTIONS} value={lang} onChange={(id) => changeLang(id, "header")} />
        </div>
        <div className="progress" ref={progressRef} aria-hidden="true" />
      </header>

      <main inert={contactOpen}>
        <section className="panel" id="p-hero" data-state="hero" aria-label={t.aria.intro}>
          <p className="eyebrow hero-meta">{t.eyebrow}</p>
          <h1 className="hero-name" aria-label={name}>
            <span className="line">{t.nameA}</span> <span className="line">{t.nameB}</span>
          </h1>
          <p className="hero-hint hero-meta">
            {[...(glassFx ? "GLASS" : "SAI")].map((ch, i) => (
              <kbd key={i} aria-hidden="true">{ch}</kbd>
            ))}
            <span>{t.hint}</span>
            <kbd className="rgb" aria-hidden="true">↓</kbd>
          </p>
        </section>

        <section className="panel" id="p-stack" data-state="stack" aria-labelledby="stack-title">
          <div className="stack-copy live">
            <p className="eyebrow">{t.stackEyebrow}</p>
            <h2 id="stack-title">
              <span>{t.titleA}</span> <span className="rainbow-text">{t.titleB}</span>
            </h2>
            <p>{t.stackBody}</p>
            <StackLegend t={t} />
          </div>
        </section>

        <section className="panel" id="p-exp" data-state="experience" aria-label={t.aria.exp}>
          <div
            className="exp"
            role="group"
            aria-roledescription="carousel"
            aria-label={t.expEyebrow}
            onPointerDown={(e) => void (swipeX.current = e.isPrimary ? e.clientX : null)}
            onPointerCancel={() => void (swipeX.current = null)}
            onPointerUp={(e) => {
              const x0 = swipeX.current;
              swipeX.current = null;
              if (x0 === null) return;
              const dx = e.clientX - x0;
              if (Math.abs(dx) > 50) goRef.current(idxRef.current + (dx < 0 ? 1 : -1), "swipe");
            }}
          >
            <div className="meta">
              <p className="eyebrow">{t.expEyebrow}</p>
              <span className="count" aria-live="polite" aria-atomic="true">
                0{idx + 1} / 0{PROJECTS.length}
              </span>
            </div>
            <div className="slides">
              {PROJECTS.map((p, i) => (
                <article className="slide" key={p.title} role="group" aria-roledescription="slide" aria-label={`${i + 1} / ${PROJECTS.length}: ${p.title}`}>
                  <figure className="cover">
                    <Image
                      src={p.cover ?? placeholderCover(p, i)}
                      alt={`${p.title} cover`}
                      width={1280}
                      height={800}
                      sizes="(max-width: 767px) 104px, 480px"
                      unoptimized={!p.cover}
                      // Eager: Safari may never start a lazy load inside the fixed carousel that fades in without moving
                      loading="eager"
                      draggable={false}
                    />
                  </figure>
                  <h3>{p.title}</h3>
                  <p className="desc">{p.descI18n?.[lang] ?? p.desc}</p>
                  <ul className="chips">
                    {p.tech.map((n) => (
                      <li key={n}>
                        <b style={{ "--c": colorOf(n) } as React.CSSProperties} />
                        {n}
                      </li>
                    ))}
                  </ul>
                  {(p.live || p.code) && (
                    <div className="links">
                      {p.live && (
                        <GlassButton variant="primary" href={p.live} target="_blank" rel="noopener">
                          {t.live} <span aria-hidden="true">↗</span>
                        </GlassButton>
                      )}
                      {p.code && (
                        <GlassButton href={p.code} target="_blank" rel="noopener">
                          {t.code} <span aria-hidden="true">↗</span>
                        </GlassButton>
                      )}
                    </div>
                  )}
                  {p.sample && <p className="sample">{t.sample}</p>}
                </article>
              ))}
            </div>
            <div className="exp-nav">
              <GlassButton aria-label={t.prev} disabled={idx === 0} onClick={() => goRef.current(idx - 1)}>
                <span aria-hidden="true">←</span>
              </GlassButton>
              <div className="dots">
                {PROJECTS.map((p, i) => (
                  <button key={p.title} type="button" aria-label={`${i + 1} / ${PROJECTS.length}: ${p.title}`} aria-current={i === idx ? "true" : undefined} onClick={() => goRef.current(i, "dots")} />
                ))}
              </div>
              <GlassButton aria-label={t.next} disabled={idx === PROJECTS.length - 1} onClick={() => goRef.current(idx + 1)}>
                <span aria-hidden="true">→</span>
              </GlassButton>
            </div>
          </div>
        </section>

        <section className="panel" id="p-footer" data-state="footer" aria-labelledby="footer-title">
          <div className="footer-inner">
            <p className="eyebrow">{t.footerEyebrow}</p>
            <h2 className="footer-title" id="footer-title">
              <span>{t.footerA}</span> <span className="rainbow-text">{t.footerB}</span>
            </h2>
            <div className="cta-row">
              <GlassButton variant="primary" onClick={() => openContact("footer")}>
                <span>{t.footerCta}</span> <span aria-hidden="true">→</span>
              </GlassButton>
              <span className="mail">{EMAIL}</span>
            </div>
            <div className="links">
              <GlassButton href={LINKEDIN} target="_blank" rel="noopener">
                LinkedIn <span aria-hidden="true">↗</span>
              </GlassButton>
              <GlassButton href={GITHUB} target="_blank" rel="noopener">
                GitHub <span aria-hidden="true">↗</span>
              </GlassButton>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 {name} · Next.js, three.js, GSAP</span>
            <span className="right">
              <GlassButton className="keybtn" glass={KEY_GLASS} motion={LIQUID.subtle} aria-label={t.aria.egg} onClick={() => toggleDogRef.current(!!dogRef.current?.hidden, "psst_button")}>
                psst
              </GlassButton>
              <GlassButton onClick={toTop}>
                <span>{t.toTop}</span> <span aria-hidden="true">↑</span>
              </GlassButton>
            </span>
          </div>
        </section>
      </main>
      <div id="track" aria-hidden="true" />

      <div id="tip" ref={tipRef} data-presence="closing" aria-hidden="true">
        <Glass params={GLASS.popover} />
        <div className="tip-body" ref={tipBodyRef} />
      </div>

      <figure id="dog" ref={dogRef} hidden inert={contactOpen}>
        <Image src="/dog.jpg" alt={t.dogAlt} width={372} height={512} />
        <figcaption>{t.dog}</figcaption>
        <GlassButton variant="dark" className="dog-close" aria-label={t.close} onClick={() => toggleDogRef.current(false)}>
          ×
        </GlassButton>
      </figure>

      {glassFx && <GlassOrb open={orbOpen} inert={contactOpen} />}

      <div id="contact" hidden={!contactShown} data-state={contactOpen ? "open" : "closing"} inert={!contactOpen} onClick={(e) => e.target === e.currentTarget && closeContact("backdrop")}>
        <div className="sheet glass-card" ref={sheetRef} data-presence={contactOpen ? "open" : "closing"} role="dialog" aria-modal="true" aria-labelledby="contact-title" onKeyDown={trapFocus}>
          <Glass params={GLASS.sheet} />
          <h3 id="contact-title">{t.contactTitle}</h3>
          <div className="row">
            <span ref={mailRef}>{EMAIL}</span>
            <GlassButton motion={LIQUID.subtle} ref={copyRef} onClick={copyMail}>
              {copied ? t.copied : t.copy}
            </GlassButton>
          </div>
          <div className="row">
            <a href={GITHUB} target="_blank" rel="noopener">github.com/sayonara213</a>
            <span aria-hidden="true">↗</span>
          </div>
          <div className="row">
            <a href={LINKEDIN} target="_blank" rel="noopener">linkedin.com/in/maksym-sai</a>
            <span aria-hidden="true">↗</span>
          </div>
          <GlassButton className="close" onClick={() => closeContact("button")}>
            {t.close}
          </GlassButton>
        </div>
      </div>
    </div>
  );
}
