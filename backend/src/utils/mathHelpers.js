/**
 * Math utility functions
 */

/**
 * Calcola media di un array di numeri
 * @param {number[]} array
 * @returns {number}
 */
export function average(array) {
  if (!array || array.length === 0) return 0;
  const sum = array.reduce((acc, val) => acc + val, 0);
  return sum / array.length;
}

/**
 * Arrotonda numero a N decimali
 * @param {number} number
 * @param {number} decimals
 * @returns {number}
 */
export function round(number, decimals = 0) {
  const factor = Math.pow(10, decimals);
  return Math.round(number * factor) / factor;
}

/**
 * Limita valore tra min e max
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calcola percentuale di variazione
 * @param {number} oldValue
 * @param {number} newValue
 * @returns {number} Percentuale (es: -5.2 per -5.2%)
 */
export function percentChange(oldValue, newValue) {
  if (!oldValue || oldValue === 0) return 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

export default {
  average,
  round,
  clamp,
  percentChange
};
