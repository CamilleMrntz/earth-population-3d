import type { SpeciesId } from "./speciesIds";

/**
 * Visual instance budget: proportional to real population scale, but never equal to real counts.
 * Uses one **global** scale so a more numerous species always gets visibly more dots than a rarer one
 * (same solo budget: humans ≫ cattle ≫ pigeons when populations differ).
 */

const BUDGET_ONE = 10_000;
const BUDGET_TWO = 12_000;
const PER_LAYER_MIN = 200;
const PER_LAYER_MAX_SOLO = BUDGET_ONE;
const PER_LAYER_MAX_PAIR = 9000;

/** Order-of-magnitude anchors; also defines the global ceiling for cross-species comparison. */
export const REF_POP: Record<SpeciesId, number> = {
  humans: 8_000_000_000,
  cattle: 950_000_000,
  chickens: 33_000_000_000,
  pigeons: 500_000_000,
};

/** Largest reference population — denominates everyone so shares stay comparable across species. */
const GLOBAL_REF_POP = Math.max(...Object.values(REF_POP));

/**
 * Gamma < 1 stretches the low end so rare species still get a visible cloud, while keeping strong
 * separation (e.g. humans vs cattle).
 */
const VISUAL_GAMMA = 0.62;

export function populationForScale(id: SpeciesId, value: number | null | undefined): number {
  if (value != null && Number.isFinite(value)) return value;
  return REF_POP[id];
}

/** [0, ~1] — comparable across species using the same world scale (not per-species normalization). */
function globalVisualShare(population: number): number {
  const ratio = Math.max(1e-12, population) / GLOBAL_REF_POP;
  const capped = Math.min(ratio, 1.25);
  return capped ** VISUAL_GAMMA;
}

export function computeVizInstanceCounts(
  active: { id: SpeciesId; population: number }[],
): Map<SpeciesId, number> {
  const out = new Map<SpeciesId, number>();
  if (active.length === 0) return out;

  if (active.length === 1) {
    const a = active[0]!;
    const share = globalVisualShare(a.population);
    const n = Math.round(BUDGET_ONE * share);
    out.set(a.id, clamp(n, PER_LAYER_MIN, PER_LAYER_MAX_SOLO));
    return out;
  }

  const [a, b] = active;
  const wa = globalVisualShare(a.population);
  const wb = globalVisualShare(b.population);
  const denom = wa + wb || 1;
  let na = Math.round((BUDGET_TWO * wa) / denom);
  let nb = BUDGET_TWO - na;
  na = clamp(na, PER_LAYER_MIN, PER_LAYER_MAX_PAIR);
  nb = clamp(nb, PER_LAYER_MIN, PER_LAYER_MAX_PAIR);
  if (na + nb > BUDGET_TWO) {
    const scale = BUDGET_TWO / (na + nb);
    na = Math.max(PER_LAYER_MIN, Math.floor(na * scale));
    nb = Math.max(PER_LAYER_MIN, BUDGET_TWO - na);
  } else if (na + nb < BUDGET_TWO) {
    const slack = BUDGET_TWO - na - nb;
    if (wa >= wb) na += slack;
    else nb += slack;
  }
  out.set(a.id, na);
  out.set(b.id, nb);
  return out;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}
