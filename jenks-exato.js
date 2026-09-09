"use strict";
/* Jenks exato: programação dinâmica com otimização divide-and-conquer.
   Valores repetidos são representados por pesos, sem alterar a variância. */
function jenksExato(input, requestedClasses = 5) {
  const data = input.filter(Number.isFinite).sort((a, b) => a - b);
  if (!data.length) return [0, 1];
  const values = [], weights = [];
  for (const value of data) {
    if (values.length && value === values[values.length - 1]) weights[weights.length - 1]++;
    else { values.push(value); weights.push(1); }
  }
  const n = values.length;
  if (n === 1) return [values[0], values[0]];
  const k = Math.min(Math.max(1, Math.floor(requestedClasses)), n);
  if (k === 1) return [values[0], values[n - 1]];
  const origin = values[0];
  const w = new Float64Array(n + 1);
  const s = new Float64Array(n + 1);
  const q = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) {
    const x = values[i] - origin;
    w[i + 1] = w[i] + weights[i];
    s[i + 1] = s[i] + weights[i] * x;
    q[i + 1] = q[i] + weights[i] * x * x;
  }
  function cost(a, b) {
    const weight = w[b] - w[a];
    const sum = s[b] - s[a];
    return Math.max(0, q[b] - q[a] - sum * sum / weight);
  }
  let previous = new Float64Array(n + 1).fill(Infinity);
  previous[0] = 0;
  for (let i = 1; i <= n; i++) previous[i] = cost(0, i);
  const splits = Array.from({length: k + 1}, () => new Int32Array(n + 1));
  for (let classes = 2; classes <= k; classes++) {
    const current = new Float64Array(n + 1).fill(Infinity);
    const split = splits[classes];
    function solve(left, right, optLeft, optRight) {
      if (left > right) return;
      const mid = (left + right) >> 1;
      let best = Infinity, bestJ = -1;
      const start = Math.max(classes - 1, optLeft);
      const end = Math.min(mid - 1, optRight);
      for (let j = start; j <= end; j++) {
        const candidate = previous[j] + cost(j, mid);
        if (candidate < best || (candidate === best && j < bestJ)) {
          best = candidate; bestJ = j;
        }
      }
      current[mid] = best;
      split[mid] = bestJ;
      solve(left, mid - 1, optLeft, bestJ);
      solve(mid + 1, right, bestJ, optRight);
    }
    solve(classes, n, classes - 1, n - 1);
    previous = current;
  }
  const breaks = new Array(k + 1);
  breaks[0] = values[0];
  breaks[k] = values[n - 1];
  let end = n;
  for (let classes = k; classes >= 2; classes--) {
    const j = splits[classes][end];
    breaks[classes - 1] = values[j - 1];
    end = j;
  }
  return breaks;
}
if (typeof module !== 'undefined' && module.exports) module.exports = jenksExato;
