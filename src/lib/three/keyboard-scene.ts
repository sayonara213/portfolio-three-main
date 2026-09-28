import * as THREE from "three";
import { ICONS } from "@/lib/content/icons";
import { COLS, HERO_ROWS, NAME_ROWS, ROWS, TECH, inkFor } from "@/lib/content/tech";
import type { KeyboardState } from "./state";

// World units. One key pitch = 1.08.
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
};

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

/**
 * Sculpted keycap: rounded, bevelled extrusion with the top tapered to 86%.
 * Vertex colours darken the skirt toward the plate (baked ambient occlusion).
 * Normals are left as extruded: recomputing them on this non-indexed geometry makes it faceted.
 */
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
  /** CSS font-family for key letters (the loaded Unbounded face) */
  legendFont: string;
  reducedMotion: boolean;
  /** USED[project][keyIndex] = 1 when the project uses that key's tech */
  used: number[][];
};

export class KeyboardScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  readonly keys: Key[] = [];
  /** Single source of truth for the board. GSAP writes it, the render loop reads it. */
  readonly kb: KeyboardState = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1, flip: 0, flip2: 0, exp: 0, proj: 0, glow: 0, motion: 0, intro: 0 };
  /** 0..1 page scroll progress, used for the star drift */
  scroll = 0;
  hovered: Key | null = null;
  onHoverChange?: (k: Key | null) => void;

  private scene = new THREE.Scene();
  private board = new THREE.Group();
  private sun: THREE.DirectionalLight;
  private glowMat: THREE.ShaderMaterial;
  private stars: THREE.Points;
  private caps: THREE.Mesh[] = [];
  private ray = new THREE.Raycaster();
  private ndc = new THREE.Vector2(9, 9);
  private pointerType = "mouse";
  private par = { x: 0, y: 0 };
  private timer = new THREE.Timer();
  private raf = 0;
  private disposables: { dispose(): void }[] = [];

  constructor(canvas: HTMLCanvasElement, private opts: SceneOptions) {
    const r = (this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }));
    r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
    sun.shadow.mapSize.set(2048, 2048);
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
  }

  /** Dark room with four soft boxes, prefiltered for reflections: this is what stops the caps reading flat. */
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
    const drop = new THREE.Mesh(
      new THREE.PlaneGeometry(CASE_W + 2.6, CASE_H + 2.2),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, opacity: 0.9, depthWrite: false, toneMapped: false }),
    );
    drop.position.set(0, -0.35, -0.7);
    this.board.add(drop);
  }

  /** Thin RGB stripe hugging the case edge. Adds light without writing alpha, so no halo over the page. */
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
        uSize: { value: new THREE.Vector2(CASE_W + 2, CASE_H + 2) },
        uHalf: { value: new THREE.Vector2(CASE_W / 2, CASE_H / 2) },
      },
      vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: /* glsl */ `uniform float uTime,uGlow; uniform vec2 uSize,uHalf; varying vec2 vUv;
        vec3 hue(float h){ return clamp(abs(mod(h*6.+vec3(0.,4.,2.),6.)-3.)-1.,0.,1.); }
        void main(){
          vec2 p=(vUv-.5)*uSize; vec2 q=abs(p)-uHalf+.42;
          float d=length(max(q,0.))+min(max(q.x,q.y),0.)-.42;
          float a=exp(-max(d,0.)*4.5)*smoothstep(-.12,.02,d);
          vec2 e=abs(vUv-.5); a*=smoothstep(.5,.4,max(e.x,e.y));
          float ang=atan(p.y,p.x)/6.2831853+uTime*.05;
          gl_FragColor=vec4(hue(ang),a*uGlow);
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
          i: r * COLS + c, r, c, hero, nameCh, ...t,
          techColor: new THREE.Color(t.color), footColor: nameCh ? WHITE : GRAPHITE,
          pivot, cap, mat, legend, legendMat, state: null, tex: {}, hover: 0, press: 0,
        };
        cap.userData.k = k;
        this.caps.push(cap);
        this.keys.push(k);
      }
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
  /** Call once the display font has loaded, so letters render in Unbounded. */
  buildTextures() {
    for (const k of this.keys) {
      k.tex = { hero: k.hero ? this.letterTex(k.hero) : null, tech: this.logoTex(k.slug, inkFor(k.color)), name: k.nameCh ? this.letterTex(k.nameCh) : null };
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

  /** Visible world size at z = 0. All poses are expressed relative to this. */
  view() {
    const h = 2 * this.camera.position.z * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    return { w: h * this.camera.aspect, h };
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  setPointer(clientX: number, clientY: number, pointerType: string) {
    this.pointerType = pointerType;
    this.ndc.set((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1);
  }

  pick(): Key | null {
    this.ray.setFromCamera(this.ndc, this.camera);
    const hit = this.ray.intersectObjects(this.caps, false)[0];
    return hit ? (hit.object.userData.k as Key) : null;
  }

  /** Presses every cap whose visible legend matches the typed letter. */
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
    const t = this.timer.getElapsed();
    const { kb, opts } = this;
    const reduced = opts.reducedMotion;
    const desk = window.innerWidth >= 768, m = reduced ? 0 : kb.motion;
    this.par.x += ((desk && this.ndc.x < 2 ? this.ndc.x : 0) - this.par.x) * 0.05;
    this.par.y += ((desk && this.ndc.x < 2 ? this.ndc.y : 0) - this.par.y) * 0.05;

    const b = this.board;
    b.position.set(kb.x, kb.y + Math.sin(t * 0.9) * 0.06 * m, kb.z);
    b.rotation.set(kb.rx - this.par.y * 0.06 * m, kb.ry + this.par.x * 0.1 * m, kb.rz);
    b.scale.setScalar(kb.s * (0.82 + 0.18 * kb.intro));
    // keep the shadow light fixed relative to the board so its shadow frustum stays tight
    this.sun.position.set(b.position.x + 3, b.position.y + 9, b.position.z + 11);
    this.sun.target.position.copy(b.position);
    this.glowMat.uniforms.uTime.value = t;
    this.glowMat.uniforms.uGlow.value = kb.glow;
    this.stars.rotation.y = t * 0.004;
    this.stars.position.y = this.scroll * 4;

    const hk = this.pointerType !== "touch" && this.ndc.x < 2 && kb.flip2 < 0.5 ? this.pick() : null;
    if (hk !== this.hovered) {
      this.hovered = hk;
      this.onHoverChange?.(hk);
    }

    // which techs are lit in the Experience section: blend neighbouring projects
    const used = opts.used, last = used.length - 1;
    const i0 = Math.min(last, Math.floor(kb.proj)), i1 = Math.min(last, i0 + 1), fr = smooth(clamp01(kb.proj - i0));
    for (const k of this.keys) {
      const w = (k.c + k.r) / (COLS - 1 + ROWS - 1);
      const p1 = reduced ? clamp01(kb.flip) : smooth(clamp01((kb.flip - w * 0.55) / 0.45));
      const p2 = reduced ? clamp01(kb.flip2) : smooth(clamp01((kb.flip2 - (1 - w) * 0.55) / 0.45)); // second wave runs the other way
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
      k.legend.rotation.z = kb.rz < -1 ? Math.PI / 2 : 0; // keep legends upright when the board is portrait (mobile stack)
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
  }
}
