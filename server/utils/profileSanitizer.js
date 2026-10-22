/**
 * Normalizes arrays of strings or skill objects for consistent storage:
 * - Trims and collapses internal whitespace
 * - Drops empty strings
 * - Case-insensitive de-duplication (keeps first occurrence, preserves original case)
 * - Caps to the provided max length
 *
 * Used before saving to DB so matching modules can rely on clean data.
 */

/**
 * Normalizes a plain string array (interests, learningGoals, expertise).
 * @param {string[]} arr
 * @param {number} max
 * @returns {string[]}
 */
const normalizeStringArray = (arr, max) => {
  if (!Array.isArray(arr)) return [];
  const seen = new Set();
  const result = [];
  for (const item of arr) {
    if (typeof item !== 'string') continue;
    const clean = item.trim().replace(/\s+/g, ' ');
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(clean);
    if (result.length >= max) break;
  }
  return result;
};

/**
 * Normalizes a skills array: {name, level} objects.
 * De-duplicates by skill name (case-insensitive).
 * @param {{ name: string, level: string }[]} arr
 * @param {number} max
 * @returns {{ name: string, level: string }[]}
 */
const normalizeSkills = (arr, max) => {
  if (!Array.isArray(arr)) return [];
  const seen = new Set();
  const result = [];
  for (const item of arr) {
    if (!item || typeof item !== 'object') continue;
    const name = (item.name || '').trim().replace(/\s+/g, ' ');
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ name, level: item.level });
    if (result.length >= max) break;
  }
  return result;
};

/**
 * Removes duplicate day+slot pairs from availability array.
 * @param {{ day: string, slot: string }[]} arr
 * @returns {{ day: string, slot: string }[]}
 */
const normalizeAvailability = (arr) => {
  if (!Array.isArray(arr)) return [];
  const seen = new Set();
  return arr.filter((item) => {
    if (!item || !item.day || !item.slot) return false;
    const key = `${item.day}:${item.slot}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

module.exports = { normalizeStringArray, normalizeSkills, normalizeAvailability };
