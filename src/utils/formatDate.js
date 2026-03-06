import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";

/**
 * Parse value to Date object.
 * Accepts: Date, ISO string, timestamp number.
 */
const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return isValid(value) ? value : null;
  if (typeof value === "number") return new Date(value);
  if (typeof value === "string") {
    const parsed = parseISO(value);
    return isValid(parsed) ? parsed : null;
  }
  return null;
};

/**
 * Format date to "01 Jan 2025"
 * @param {Date|string|number} value
 * @returns {string}
 */
export const formatDate = (value) => {
  const date = toDate(value);
  if (!date) return "-";
  return format(date, "dd MMM yyyy");
};

/**
 * Format date + time to "01 Jan 2025, 14:30"
 * @param {Date|string|number} value
 * @returns {string}
 */
export const formatDateTime = (value) => {
  const date = toDate(value);
  if (!date) return "-";
  return format(date, "dd MMM yyyy, HH:mm");
};

/**
 * Relative format: "2 days ago"
 * @param {Date|string|number} value
 * @returns {string}
 */
export const formatRelative = (value) => {
  const date = toDate(value);
  if (!date) return "-";
  return formatDistanceToNow(date, { addSuffix: true });
};

/**
 * Month + year: "Jan 2025"
 * Used for monitoring activity column.
 * @param {Date|string|number} value
 * @returns {string}
 */
export const formatMonth = (value) => {
  const date = toDate(value);
  if (!date) return "-";
  return format(date, "MMM yyyy");
};
