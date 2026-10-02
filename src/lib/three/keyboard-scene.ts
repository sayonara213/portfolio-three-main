import * as THREE from "three";
import { GLYPHS, HERO_ACTIONS, RAINBOW, type HeroAction } from "@/lib/content/glyphs";
import { ICONS } from "@/lib/content/icons";
import { COLS, HERO_ROWS, NAME_ROWS, ROWS, TECH, inkFor } from "@/lib/content/tech";
import type { KeyboardState } from "./state";

export const PITCH = 1.08;
const CAP = 0.8;
const CAP_TOP = 0.3;
export const CASE_W = COLS * PITCH + 0.62;
export const CASE_H = ROWS * PITCH + 0.62;

const WHITE = new THREE.Color("#eeeef0");
const GREY = new THREE.Color("#3a3a3f");
const GRAPHITE = new THREE.Color("#2b2b2f");

type LegendState = "hero" | "tech" | "name";

export type Key = {
  i: number;
  r: number;
  c: number;
  hero: string;
  action?: HeroAction;
  nameCh: string;
  slug: string;
  name: string;
  color: string;
  note: string;
  techColor: THREE.Color;
  footColor: THREE.Color;
  pivot: THREE.Group;
  cap: THREE.Mesh;
  mat: THREE.MeshPhysicalMaterial;
  legend: THREE.Mesh;
  legendMat: THREE.MeshStandardMaterial;
  state: LegendState | null;
  tex: Partial<Record<LegendState, THREE.Texture | null>>;
  hover: number;
  press: number;
  rainbow?: RainbowUniforms & { lit: number };
};

const PAL = 8;

const DRIFT = { y: 0.05, rx: 0.08, ry: 0.05 };

const RAINBOW_CAP = { idle: 0.04, hover: 0.55, press: 2.5, glow: 0.18, density: 0.55 };

type RainbowUniforms = { uFlow: { value: number }; uMix: { value: number }; uGlow: { value: number }; uStops: { value: THREE.Color[] } };

function rainbowCap(mat: THREE.MeshPhysicalMaterial): RainbowUniforms {
  const uniforms: RainbowUniforms = {
    uFlow: { value: 0 },
    uMix: { value: 1 },
    uGlow: { value: 0 },
    uStops: { value: RAINBOW.map((c) => new THREE.Color(c)) },
  };
  const n = RAINBOW.length;
  mat.customProgramCacheKey = () => "rainbow-cap";
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vRb;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvRb = position;");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
varying vec3 vRb;
uniform float uFlow, uMix, uGlow;
uniform vec3 uStops[${n}];
vec3 rainbow(float t) {
  float s = fract(t) * ${n}.0;
  int i = int(floor(s));
  return mix(uStops[i], uStops[(i + 1) % ${n}], smoothstep(0.0, 1.0, fract(s)));
}`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
vec3 rb = rainbow((vRb.x - vRb.y) * ${RAINBOW_CAP.density} + vRb.z * 0.3 - uFlow) * (1.0 + uGlow);
diffuseColor.rgb = mix(diffuseColor.rgb, vColor.rgb * rb, uMix);`,
      );
  };
  mat.needsUpdate = true;
  return uniforms;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (t: number) => t * t * (3 - 2 * t);

function roundedRect(w: number, h: number, r: number) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

// Normals are left as extruded: recomputing them on this non-indexed geometry makes it faceted.
function capGeometry() {
  const g = new THREE.ExtrudeGeometry(roundedRect(CAP, CAP, 0.16), {
    depth: 0.4, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.07, bevelSegments: 6, curveSegments: 10,
  });
  const p = g.attributes.position, zMin = -0.1, zMax = 0.5, col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const t = (p.getZ(i) - zMin) / (zMax - zMin), f = 1 - 0.14 * t;
    p.setX(i, p.getX(i) * f); p.setY(i, p.getY(i) * f);
    const ao = 0.38 + 0.62 * smooth(clamp01(t / 0.8));
    col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = ao;
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  g.translate(0, 0, -0.2); // pivot at the cap's centre so it can spin in place
  return g;
}

export type SceneOptions = {
  legendFont: string;
  reducedMotion: boolean;
  used: number[][];
  omitActions?: HeroAction[];
};

export class KeyboardScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  readonly keys: Key[] = [];
  readonly kb: KeyboardState = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1, flip: 0, flip2: 0, exp: 0, proj: 0, glow: 0, motion: 0, intro: 0 };
  scroll = 0;
  /** Owned by timeline.ts */
  drift = 0;
  hovered: Key | null = null;
  onHoverChange?: (k: Key | null) => void;
  private langLabel = "EN";
  private texturesBuilt = false;

  private scene = new THREE.Scene();
  private board = new THREE.Group();
  private sun: THREE.DirectionalLight;
  private glowMat: THREE.ShaderMaterial;
  private palettes: THREE.Color[][] = [];
  private stars: THREE.Points;
  private caps: THREE.Mesh[] = [];
  private ray = new THREE.Raycaster();
  private ndc = new THREE.Vector2(9, 9);
  private pointerType = "mouse";
  private pointerDirty = false;
  private frameNo = 0;
  private w = 1;
  private h = 1;
  private par = { x: 0, y: 0 };
  private timer = new THREE.Timer();
  private raf = 0;
  private disposables: { dispose(): void }[] = [];

  constructor(canvas: HTMLCanvasElement, private opts: SceneOptions) {
    const lite = matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;
    const r = (this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" }));
    r.setPixelRatio(Math.min(window.devicePixelRatio, lite ? 1.5 : 2));
    r.toneMapping = THREE.NoToneMapping; // ACES desaturates the brand colours; keep them true
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFShadowMap;
    this.camera.position.set(0, 0, 18);
    this.resize();

    this.buildEnvironment();
    // Physically based light units: intensities are the tuned prototype values × π.
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x0a0a0a, 0.2 * Math.PI));
    const sun = (this.sun = new THREE.DirectionalLight(0xffffff, 1.35 * Math.PI));
    sun.castShadow = true;
    sun.shadow.mapSize.setScalar(lite ? 1024 : 2048);
    Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 50 });
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.025;
    sun.shadow.radius = 5;
    this.scene.add(sun, sun.target);
    const rim = new THREE.DirectionalLight(0xdfe3ea, 0.7 * Math.PI);
    rim.position.set(-8, 4, -8);
    this.scene.add(rim);

    this.scene.add(this.board);
    this.buildCase();
    this.glowMat = this.buildRim();
    this.stars = this.buildStars();
    this.buildKeys();
    this.palettes = this.buildPalettes();
  }

  // Near-black brands (Three.js, AWS, MCP, Express) are skipped: as rim light they'd read as a gap.
  private buildPalettes() {
    return this.opts.used.map((row) => {
      const lum = (c: THREE.Color) => c.getHSL({ h: 0, s: 0, l: 0 }, THREE.SRGBColorSpace).l;
      const cols = this.keys.filter((k) => row[k.i] && lum(k.techColor) > 0.2).map((k) => k.techColor);
      if (!cols.length) cols.push(WHITE);
      // the rim shader writes gl_FragColor as-is (like its rainbow), so hand it display-space (sRGB) values
      return Array.from({ length: PAL }, (_, j) => cols[j % cols.length].clone().convertLinearToSRGB());
    });
  }

  private buildEnvironment() {
    const env = new THREE.Scene();
    env.add(new THREE.Mesh(new THREE.BoxGeometry(30, 30, 30), new THREE.MeshBasicMaterial({ color: 0x0c0c0e, side: THREE.BackSide })));
    const box = (w: number, h: number, pos: [number, number, number], strength: number, hex: number) => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(strength), side: THREE.DoubleSide }),
      );
      m.position.set(...pos);
      m.lookAt(0, 0, 0);
      env.add(m);
    };
    box(14, 5, [0, 10, 6], 2.6, 0xffffff);
    box(4, 10, [-11, 2, 4], 1.1, 0xe6ebff);
    box(4, 10, [11, 0, 5], 0.9, 0xfff0e4);
    box(16, 2, [0, -6, 10], 0.35, 0xffffff);
    const pm = new THREE.PMREMGenerator(this.renderer);
    const rt = pm.fromScene(env, 0.035);
    this.scene.environment = rt.texture;
    this.disposables.push(rt);
    pm.dispose();
  }

  private buildCase() {
    const caseMesh = new THREE.Mesh(
      new THREE.ExtrudeGeometry(roundedRect(CASE_W, CASE_H, 0.42), { depth: 0.5, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 6, curveSegments: 12 }),
      new THREE.MeshStandardMaterial({ color: 0x1e1e21, roughness: 0.42, metalness: 0.55, envMapIntensity: 0.9 }),
    );
    caseMesh.position.z = -0.58;
    caseMesh.castShadow = caseMesh.receiveShadow = true;
    this.board.add(caseMesh);

    const plate = new THREE.Mesh(
      new THREE.ShapeGeometry(roundedRect(COLS * PITCH + 0.06, ROWS * PITCH + 0.06, 0.2)),
      new THREE.MeshStandardMaterial({ color: 0x09090a, roughness: 0.85, metalness: 0.2 }),
    );
    plate.position.z = 0.005;
    plate.receiveShadow = true;
    this.board.add(plate);

    // Soft drop shadow behind the case. shadowBlur works everywhere; ctx.filter does not in Safari.
    const c = document.createElement("canvas");
    c.width = 512; c.height = 300;
    const g = c.getContext("2d")!;
    g.shadowColor = "rgba(0,0,0,1)"; g.shadowBlur = 36; g.shadowOffsetX = 1000; g.fillStyle = "#000";
    g.fillRect(70 - 1000, 60, 372, 180);
    const dropTex = new THREE.CanvasTexture(c);
    this.disposables.push(dropTex);
    const drop = new THREE.Mesh(
      new THREE.PlaneGeometry(CASE_W + 2.6, CASE_H + 2.2),
      new THREE.MeshBasicMaterial({ map: dropTex, transparent: true, opacity: 0.9, depthWrite: false, toneMapped: false }),
    );
    drop.position.set(0, -0.35, -0.7);
    this.board.add(drop);
  }

  private buildRim() {
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.SrcAlphaFactor,
      blendDst: THREE.OneFactor,
      blendSrcAlpha: THREE.ZeroFactor,
      blendDstAlpha: THREE.OneFactor,
      uniforms: {
        uTime: { value: 0 },
        uGlow: { value: 0 },
        uPal: { value: Array.from({ length: PAL }, () => new THREE.Color()) },
        uPw: { value: 0 },
        uWhite: { value: 0 },
        uSize: { value: new THREE.Vector2(CASE_W + 2, CASE_H + 2) },
        uHalf: { value: new THREE.Vector2(CASE_W / 2, CASE_H / 2) },
      },
      vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: /* glsl */ `#define PAL ${PAL}
        uniform float uTime,uGlow,uPw,uWhite; uniform vec2 uSize,uHalf; uniform vec3 uPal[PAL]; varying vec2 vUv;
        vec3 hue(float h){ return clamp(abs(mod(h*6.+vec3(0.,4.,2.),6.)-3.)-1.,0.,1.); }
        vec3 pal(float h){
          float f=fract(h)*float(PAL); int i=int(f);
          return mix(uPal[i],uPal[(i+1)%PAL],smoothstep(0.,1.,fract(f)));
        }
        void main(){
          vec2 p=(vUv-.5)*uSize; vec2 q=abs(p)-uHalf+.42;
          float d=length(max(q,0.))+min(max(q.x,q.y),0.)-.42;
          float a=exp(-max(d,0.)*4.5)*smoothstep(-.12,.02,d);
          vec2 e=abs(vUv-.5); a*=smoothstep(.5,.4,max(e.x,e.y));
          float ang=atan(p.y,p.x)/6.2831853+uTime*.05;
          vec3 c=mix(mix(hue(ang),pal(ang),uPw),vec3(1.),uWhite);
          gl_FragColor=vec4(c,a*uGlow);
        }`,
    });
    const rim = new THREE.Mesh(new THREE.PlaneGeometry(CASE_W + 2, CASE_H + 2), mat);
    rim.position.z = -0.62;
    this.board.add(rim);
    return mat;
  }

  private buildStars() {
    const n = 320, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 44;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 2] = -Math.random() * 18 - 2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const stars = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x9a9aa0, size: 0.05, transparent: true, opacity: 0.6, depthWrite: false }));
    this.scene.add(stars);
    return stars;
  }

  private buildKeys() {
    const capGeo = capGeometry();
    const legendGeo = new THREE.PlaneGeometry(0.6, 0.6);
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        const t = TECH[r][c];
        const hero = HERO_ROWS[r][c].trim(), nameCh = NAME_ROWS[r][c].trim();
        const pivot = new THREE.Group();
        pivot.position.set((c - (COLS - 1) / 2) * PITCH, ((ROWS - 1) / 2 - r) * PITCH, 0.32);
        const mat = new THREE.MeshPhysicalMaterial({
          color: WHITE.clone(), vertexColors: true, roughness: 0.4, metalness: 0,
          clearcoat: 0.35, clearcoatRoughness: 0.3, envMapIntensity: 0.55,
        });
        const cap = new THREE.Mesh(capGeo, mat);
        cap.castShadow = cap.receiveShadow = true;
        pivot.add(cap);
        const legendMat = new THREE.MeshStandardMaterial({ transparent: true, roughness: 0.4, polygonOffset: true, polygonOffsetFactor: -2, depthWrite: false });
        const legend = new THREE.Mesh(legendGeo, legendMat);
        legend.position.z = CAP_TOP + 0.004;
        pivot.add(legend);
        this.board.add(pivot);
        const k: Key = {
          i: r * COLS + c, r, c, hero, action: this.heroAction(r * COLS + c), nameCh, ...t,
          techColor: new THREE.Color(t.color), footColor: nameCh ? WHITE : GRAPHITE,
          pivot, cap, mat, legend, legendMat, state: null, tex: {}, hover: 0, press: 0,
        };
        if (k.action && GLYPHS[k.action].rainbow) k.rainbow = { ...rainbowCap(mat), lit: 0 };
        cap.userData.k = k;
        this.caps.push(cap);
        this.keys.push(k);
      }
  }

  private heroAction(i: number) {
    const a = HERO_ACTIONS[i];
    return a && !this.opts.omitActions?.includes(a) ? a : undefined;
  }

  private canvasTex(draw: (g: CanvasRenderingContext2D) => void) {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    draw(c.getContext("2d")!);
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 8;
    t.colorSpace = THREE.SRGBColorSpace;
    this.disposables.push(t);
    return t;
  }
  private letterTex(ch: string) {
    return this.canvasTex((g) => {
      g.fillStyle = "#141416"; g.textAlign = "center"; g.textBaseline = "middle";
      g.font = `700 150px ${this.opts.legendFont}, system-ui, sans-serif`;
      g.fillText(ch, 128, 136);
    });
  }
  private logoTex(slug: string, color: string) {
    return this.canvasTex((g) => {
      const size = 168, o = (256 - size) / 2;
      g.translate(o, o); g.scale(size / 24, size / 24);
      g.fillStyle = color;
      g.fill(new Path2D(ICONS[slug]));
    });
  }
  private glyphTex(action: HeroAction) {
    return this.canvasTex((g) => {
      const gl = GLYPHS[action], ink = "#141416";
      const globe = action === "lang";
      const size = (globe ? 108 : 136) * (gl.scale ?? 1);
      const [cx, cy] = globe ? [88, 168] : [128, 128];
      g.save();
      g.translate(cx - size / 2, cy - size / 2);
      g.scale(size / 24, size / 24);
      g.strokeStyle = g.fillStyle = ink;
      g.lineWidth = 1.7;
      g.lineCap = g.lineJoin = "round";
      if (gl.stroke) g.stroke(new Path2D(gl.stroke));
      if (gl.fill) g.fill(new Path2D(gl.fill));
      g.restore();
      if (globe) {
        g.fillStyle = ink; g.textAlign = "right"; g.textBaseline = "alphabetic";
        g.font = `600 ${this.langLabel.length > 2 ? 46 : 60}px -apple-system, "SF Pro Text", system-ui, sans-serif`;
        g.fillText(this.langLabel, 226, 88);
      }
    });
  }
  private heroTex(k: Key) {
    return k.action ? this.glyphTex(k.action) : k.hero ? this.letterTex(k.hero) : null;
  }
  setLangLabel(label: string) {
    if (label === this.langLabel) return;
    this.langLabel = label;
    if (!this.texturesBuilt) return;
    for (const k of this.keys) {
      if (k.action !== "lang") continue;
      const old = k.tex.hero;
      k.tex.hero = this.heroTex(k);
      if (old) {
        old.dispose();
        this.disposables = this.disposables.filter((d) => d !== old);
      }
      k.state = null; // the render loop re-applies the legend next frame
    }
  }
  buildTextures() {
    this.texturesBuilt = true;
    for (const k of this.keys) {
      k.tex = { hero: this.heroTex(k), tech: this.logoTex(k.slug, inkFor(k.color)), name: k.nameCh ? this.letterTex(k.nameCh) : null };
      k.state = null;
      this.setLegend(k, "hero");
    }
  }
  private setLegend(k: Key, s: LegendState) {
    if (k.state === s) return;
    k.state = s;
    k.legendMat.map = k.tex[s] ?? null;
    k.legend.visible = !!k.legendMat.map;
    k.legendMat.needsUpdate = true;
  }

  view() {
    const h = 2 * this.camera.position.z * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    return { w: h * this.camera.aspect, h };
  }

  /**
   * Sizes to the canvas box, not innerHeight. The canvas is 100lvh tall (globals.css), so the mobile URL bar
   * showing and hiding doesn't change it, and the keyboard doesn't jump or rescale mid-scroll.
   */
  resize() {
    const el = this.renderer.domElement;
    const w = el.clientWidth || window.innerWidth, h = el.clientHeight || window.innerHeight;
    if (w === this.w && h === this.h) return;
    this.w = w;
    this.h = h;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  setPointer(clientX: number, clientY: number, pointerType: string) {
    this.pointerType = pointerType;
    this.ndc.set((clientX / this.w) * 2 - 1, -(clientY / this.h) * 2 + 1);
    this.pointerDirty = true;
  }

  pick(ndc = this.ndc): Key | null {
    this.ray.setFromCamera(ndc, this.camera);
    const hit = this.ray.intersectObjects(this.caps, false)[0];
    return hit ? (hit.object.userData.k as Key) : null;
  }

  pickAt(clientX: number, clientY: number) {
    return this.pick(new THREE.Vector2((clientX / this.w) * 2 - 1, -(clientY / this.h) * 2 + 1));
  }

  pressLetter(ch: string) {
    const hits: Key[] = [];
    for (const k of this.keys) {
      const legend = k.state === "tech" ? k.name[0].toUpperCase() : k.state === "name" ? k.nameCh : k.hero;
      if (legend === ch) { k.press = 1; hits.push(k); }
    }
    return hits;
  }

  start() {
    const loop = (time: number) => {
      this.frame(time);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  private frame(time: number) {
    this.timer.update(time);
    const t = this.timer.getElapsed(), dt = Math.min(this.timer.getDelta(), 0.1);
    const { kb, opts } = this;
    const reduced = opts.reducedMotion;
    const desk = window.innerWidth >= 768, m = reduced ? 0 : kb.motion;
    this.par.x += ((desk && this.ndc.x < 2 ? this.ndc.x : 0) - this.par.x) * 0.05;
    this.par.y += ((desk && this.ndc.x < 2 ? this.ndc.y : 0) - this.par.y) * 0.05;

    const dr = reduced ? 0 : this.drift, vh = this.view().h;

    const b = this.board;
    b.position.set(kb.x, kb.y + Math.sin(t * 0.9) * 0.06 * m + dr * DRIFT.y * vh, kb.z);
    b.rotation.set(kb.rx - this.par.y * 0.06 * m + dr * DRIFT.rx, kb.ry + this.par.x * 0.1 * m + dr * DRIFT.ry, kb.rz);
    b.scale.setScalar(kb.s * (0.82 + 0.18 * kb.intro));
    this.sun.position.set(b.position.x + 3, b.position.y + 9, b.position.z + 11);
    this.sun.target.position.copy(b.position);
    this.glowMat.uniforms.uTime.value = t;
    const gu = this.glowMat.uniforms;
    gu.uGlow.value = kb.glow;
    // footer: exp falls back to 0 while flip2 rises, so hold the palette until white has taken over (no rainbow flash)
    gu.uPw.value = clamp01(kb.exp + kb.flip2 * 2);
    gu.uWhite.value = smooth(clamp01(kb.flip2));
    this.stars.rotation.y = t * 0.004;
    this.stars.position.y = this.scroll * 4;

    // Raycasting 32 bevelled caps is the priciest CPU work per frame: redo it when the pointer moves,
    // otherwise every 4th frame to follow the board as it floats and scrolls under a still pointer.
    const canHover = this.pointerType !== "touch" && this.ndc.x < 2 && kb.flip2 < 0.5;
    const hk = !canHover ? null : this.pointerDirty || this.frameNo++ % 4 === 0 ? this.pick() : this.hovered;
    this.pointerDirty = false;
    if (hk !== this.hovered) {
      this.hovered = hk;
      this.onHoverChange?.(hk);
    }

    const used = opts.used, last = used.length - 1;
    const i0 = Math.min(last, Math.floor(kb.proj)), i1 = Math.min(last, i0 + 1), fr = smooth(clamp01(kb.proj - i0));
    const pa = this.palettes[i0], pb = this.palettes[i1], upal = gu.uPal.value as THREE.Color[];
    for (let j = 0; j < PAL; j++) upal[j].copy(pa[j]).lerp(pb[j], fr);
    for (const k of this.keys) {
      const w = (k.c + k.r) / (COLS - 1 + ROWS - 1);
      const p1 = reduced ? clamp01(kb.flip) : smooth(clamp01((kb.flip - w * 0.55) / 0.45));
      const p2 = reduced ? clamp01(kb.flip2) : smooth(clamp01((kb.flip2 - (1 - w) * 0.55) / 0.45));
      this.setLegend(k, p2 >= 0.5 ? "name" : p1 >= 0.5 ? "tech" : "hero");
      const u = used[i0][k.i] + (used[i1][k.i] - used[i0][k.i]) * fr;
      const grey = kb.exp * (1 - u);
      k.mat.color.copy(WHITE).lerp(k.techColor, p1).lerp(GREY, grey * 0.9).lerp(k.footColor, p2);
      k.legendMat.opacity = 1 - grey * 0.7;
      const target = k === this.hovered ? (k.state === "tech" ? 1 : -0.6) : 0;
      k.hover += (target - k.hover) * 0.18;
      k.press *= 0.86;
      k.pivot.rotation.x = reduced ? 0 : (p1 + p2) * Math.PI * 2;
      k.pivot.position.z =
        0.32 + (reduced ? 0 : (Math.sin(p1 * Math.PI) + Math.sin(p2 * Math.PI)) * 1.3) +
        k.hover * 0.16 - k.press * 0.16 - grey * 0.2 + kb.exp * u * 0.06;
      k.legend.rotation.z = kb.rz < -1 ? Math.PI / 2 : 0;
      const rb = k.rainbow;
      if (rb) {
        rb.lit += ((k === this.hovered ? 1 : 0) - rb.lit) * 0.12;
        if (!reduced) rb.uFlow.value += dt * (RAINBOW_CAP.idle + rb.lit * RAINBOW_CAP.hover + k.press * RAINBOW_CAP.press);
        rb.uGlow.value = rb.lit * RAINBOW_CAP.glow;
        rb.uMix.value = (1 - p1) * (1 - p2);
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      mesh.geometry?.dispose();
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else mat?.dispose();
    });
    this.disposables.forEach((d) => d.dispose());
    this.renderer.dispose();
    // No forceContextLoss(): a lost context stays lost for its canvas, and React remounts onto the same <canvas>
    // (strict mode in dev, fast refresh), so the next renderer would fail and the no-WebGL fallback would kick in.
  }
}

export function createNullScene(): KeyboardScene {
  const noop = () => {};
  return {
    kb: { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1, flip: 0, flip2: 0, exp: 0, proj: 0, glow: 0, motion: 0, intro: 1 },
    keys: [],
    scroll: 0,
    drift: 0,
    hovered: null,
    view: () => ({ w: 16, h: 9 }),
    resize: noop,
    setPointer: noop,
    pick: () => null,
    pickAt: () => null,
    pressLetter: () => [],
    setLangLabel: noop,
    buildTextures: noop,
    start: noop,
    dispose: noop,
  } as unknown as KeyboardScene;
}
