/**
 * Date utility functions
 */

/**
 * Formatta data in formato ISO (YYYY-MM-DD)
 * @param {Date|string} date
 * @returns {string}
 */
export function formatDate(date) {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

/**
 * Formatta data/ora in formato italiano
 * @param {Date|string} date
 * @returns {string} es: "06/02/2026 14:30"
 */
export function formatDateTime(date) {
  const d = new Date(date);
  return d.toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Ottieni range settimana (lunedì-domenica) per una data
 * @param {Date|string} date
 * @returns {Object} { start: Date, end: Date }
 */
export function getWeekRange(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday

  const monday = new Date(d.setDate(diff));
  const sunday = new Date(d.setDate(diff + 6));

  return {
    start: monday,
    end: sunday
  };
}

/**
 * Check se data è entro N giorni da oggi
 * @param {Date|string} date
 * @param {number} days
 * @returns {boolean}
 */
export function isWithinDays(date, days) {
  const d = new Date(date);
  const now = new Date();
  const diffTime = now - d;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= days;
}

/**
 * Ottieni data N giorni fa
 * @param {number} days
 * @returns {Date}
 */
export function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

export default {
  formatDate,
  formatDateTime,
  getWeekRange,
  isWithinDays,
  daysAgo
};
