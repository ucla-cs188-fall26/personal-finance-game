// Mulberry32; the updated seed is explicit so saved runs resume deterministically.
export function rng(state) {
  const seed = ((state.rngSeed >>> 0) + 0x6D2B79F5) >>> 0;
  let t = seed;
  t = Math.imul(t ^ t >>> 15, t | 1);
  t ^= t + Math.imul(t ^ t >>> 7, t | 61);
  return { value: ((t ^ t >>> 14) >>> 0) / 4294967296, state: { ...state, rngSeed: seed } };
}
export function pickWeighted(state, items) {
  if (!items.length) return { value: null, state };
  const result = rng(state);
  let cursor = result.value * items.reduce((sum, item) => sum + Math.max(0, item.weight ?? 1), 0);
  for (const item of items) {
    cursor -= Math.max(0, item.weight ?? 1);
    if (cursor < 0) return { value: item, state: result.state };
  }
  return { value: items.at(-1), state: result.state };
}
