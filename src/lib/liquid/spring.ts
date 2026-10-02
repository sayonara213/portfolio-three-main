export interface SpringConfig {
  stiffness: number;
  damping: number;
  mass: number;
}

const STEP = 1 / 240;
const REST = 1e-4;

export class Spring {
  velocity = 0;
  target: number;

  constructor(
    public value: number,
    public config: SpringConfig,
  ) {
    this.target = value;
  }

  step(dt: number) {
    const { stiffness, damping, mass } = this.config;
    for (let t = dt; t > 0; t -= STEP) {
      const h = Math.min(STEP, t);
      const force = -stiffness * (this.value - this.target) - damping * this.velocity;
      this.velocity += (force / mass) * h;
      this.value += this.velocity * h;
    }
    if (this.settled) {
      this.value = this.target;
      this.velocity = 0;
    }
  }

  get settled() {
    return Math.abs(this.velocity) < REST && Math.abs(this.value - this.target) < REST;
  }
}

export interface SpringGroup<K extends string> {
  springs: Record<K, Spring>;
  to(v: Partial<Record<K, number>>): void;
  snap(v: Partial<Record<K, number>>): void;
  kick(v: Partial<Record<K, number>>): void;
  destroy(): void;
}

export function createSprings<K extends string>(
  configs: Record<K, SpringConfig>,
  initial: Record<K, number>,
  onFrame: (v: Record<K, number>) => void,
): SpringGroup<K> {
  const keys = Object.keys(configs) as K[];
  const springs = Object.fromEntries(keys.map((k) => [k, new Spring(initial[k], configs[k])])) as Record<K, Spring>;
  let raf = 0, last = 0;

  const emit = () => onFrame(Object.fromEntries(keys.map((k) => [k, springs[k].value])) as Record<K, number>);
  const tick = (now: number) => {
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;
    keys.forEach((k) => springs[k].step(dt));
    emit();
    raf = keys.every((k) => springs[k].settled) ? 0 : requestAnimationFrame(tick);
  };
  const run = () => {
    if (raf) return;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  };
  const each = (v: Partial<Record<K, number>>, fn: (s: Spring, n: number) => void) =>
    keys.forEach((k) => v[k] !== undefined && fn(springs[k], v[k]!));

  return {
    springs,
    to(v) {
      each(v, (s, n) => (s.target = n));
      run();
    },
    snap(v) {
      each(v, (s, n) => {
        s.value = s.target = n;
        s.velocity = 0;
      });
      emit();
    },
    kick(v) {
      each(v, (s, n) => (s.velocity += n));
      run();
    },
    destroy() {
      cancelAnimationFrame(raf);
    },
  };
}
