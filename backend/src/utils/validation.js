// Validaciones pequeñas y reutilizables para los datos que llegan en el body.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_KM = 2000000;

const isNonEmptyString = (v, maxLen) =>
  typeof v === 'string' && v.trim().length > 0 && (!maxLen || v.trim().length <= maxLen);

const isValidEmail = (v) => typeof v === 'string' && v.length <= 150 && EMAIL_RE.test(v.trim());

// Acepta números o strings numéricos ("45000"); devuelve el entero o null.
const toInt = (v) => {
  if (typeof v === 'number' && Number.isInteger(v)) return v;
  if (typeof v === 'string' && /^\d+$/.test(v.trim())) return parseInt(v.trim(), 10);
  return null;
};

const isValidKm = (v) => {
  const n = toInt(v);
  return n !== null && n >= 0 && n <= MAX_KM;
};

const isValidDate = (v) => {
  if (typeof v !== 'string' || !DATE_RE.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(v);
};

const isValidYear = (v) => {
  const n = toInt(v);
  const max = new Date().getFullYear() + 1;
  return n !== null && n >= 1950 && n <= max;
};

module.exports = { isNonEmptyString, isValidEmail, toInt, isValidKm, isValidDate, isValidYear, MAX_KM };
