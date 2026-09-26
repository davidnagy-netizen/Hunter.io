export const RESTING_Y = 0;
export const COIN_SCALE = 0.15;

export interface CoinPlacement {
  x: number;
  y: number;
  z: number;
  restRotationY: number;
  restTiltX: number;
  restTiltZ: number;
  dropsIn: boolean;
  dropOrder: number;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MOUND_X = 0.75;
const MOUND_Z = 0;

const RINGS: { count: number; radius: number; y: number; dropsIn: boolean }[] = [
  { count: 9, radius: 0.85, y: 0, dropsIn: false },
  { count: 7, radius: 0.6, y: 0.085, dropsIn: false },
  { count: 5, radius: 0.4, y: 0.17, dropsIn: true },
  { count: 3, radius: 0.22, y: 0.255, dropsIn: true },
  { count: 1, radius: 0, y: 0.34, dropsIn: true },
];

function buildMound(): CoinPlacement[] {
  const rand = mulberry32(20260926);
  let dropOrder = 0;
  return RINGS.flatMap((ring) =>
    Array.from({ length: ring.count }, (_, i) => {
      const angle = ((i + rand() * 0.7) / Math.max(ring.count, 1)) * Math.PI * 2;
      const r = ring.radius * (0.75 + rand() * 0.25);
      return {
        x: MOUND_X + Math.cos(angle) * r,
        y: RESTING_Y + ring.y,
        z: MOUND_Z + Math.sin(angle) * r,
        restRotationY: rand() * Math.PI * 2,
        restTiltX: 0.2 + rand() * 0.3,
        restTiltZ: (rand() - 0.5) * 0.5,
        dropsIn: ring.dropsIn,
        dropOrder: ring.dropsIn ? dropOrder++ : -1,
      };
    }),
  );
}

export const COIN_LAYOUT: CoinPlacement[] = buildMound();

export function dropStartY(coin: CoinPlacement): number {
  const order = coin.dropOrder >= 0 ? coin.dropOrder : 0;
  return coin.y + 4 + order * 0.35;
}
