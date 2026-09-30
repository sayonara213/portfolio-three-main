# portfolio-three

One-page portfolio. A 3D keyboard sits in a fixed WebGL canvas and changes state as you scroll: the hero spells SOFTWARE ENGINEER, the Stack section flips every cap to a coloured tech logo, Experience lights only the techs each project used, and the footer pushes the board into the background spelling the name.

Next.js (App Router) · three.js · GSAP ScrollTrigger.

## Run

```bash
npm install
npm run dev     # http://localhost:3000
npm run build && npm start
npm run lint
```

Add `#debug` to the URL for a HUD with the current section, timeline time and keyboard pose.

## How it works

- One scrubbed GSAP timeline, one unit of time per viewport of scroll (`#track` is 800svh). No snapping.
- The timeline tweens a single plain object, `KeyboardState` (`src/lib/three/state.ts`), and fades fixed copy panels in and out. The render loop in `KeyboardScene` reads that object every frame. React never re-renders on scroll.
- Poses are functions of the visible world size, with separate desktop and mobile sets (`src/lib/three/poses.ts`), rebuilt on resize by `gsap.matchMedia`.

| File                              | What it holds                                                           |
| --------------------------------- | ----------------------------------------------------------------------- |
| `src/lib/timeline.ts`             | section windows (`SEG`), resting labels (`LABELS`), the master timeline |
| `src/lib/three/keyboard-scene.ts` | renderer, studio lighting, case, RGB rim, keys, legends, render loop    |
| `src/lib/content/tech.ts`         | the 4 × 8 tech map, hero and name legends                               |
| `src/lib/content/projects.ts`     | Experience projects (placeholders for now)                              |
| `src/lib/content/i18n.ts`         | EN / UA / 日本語 strings                                                |
| `src/components/Portfolio.tsx`    | all markup and the effect that wires scene, timeline and interaction    |
| `docs/design-spec.md`             | full design spec: poses, timings, colours, acceptance checks            |

## Editing content

- **Projects**: edit `PROJECTS` in `src/lib/content/projects.ts`. `tech` names must match names in `tech.ts`; those keys stay lit. Put real covers in `public/projects/` and set `cover`.
- **Keys**: edit `TECH` in `tech.ts`. Logos come from Simple Icons (CC0); add new paths to `icons.ts`.
- **A new section**: see "Adding a section later" in `docs/design-spec.md`.
