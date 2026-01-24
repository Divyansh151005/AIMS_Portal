/**
 * Calculate credits (T, S, C) from lecture hours (L) and practical hours (P)
 * T = L / 3
 * S = 2L + P/2 - T
 * C = L + P/2
 */
export const calculateCredits = (L, P) => {
  const T = parseFloat((L / 3).toFixed(2));
  const S = parseFloat((2 * L + P / 2 - T).toFixed(2));
  const C = parseFloat((L + P / 2).toFixed(2));
  
  return { T, S, C };
};
