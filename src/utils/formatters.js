/**
 * Formatting utilities for consistent data display across the application
 */

/**
 * Format currency to INR with 2 decimal places
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '₹0.00';
  const num = parseFloat(amount);
  return `₹${num.toFixed(2)}`;
};

/**
 * Format currency without symbol
 * @param {number} amount - The amount to format
 * @returns {string} Formatted amount string
 */
export const formatAmount = (amount) => {
  if (amount === null || amount === undefined) return '0.00';
  const num = parseFloat(amount);
  return num.toFixed(2);
};

/**
 * Format date to DD/MM/YYYY
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Format date to long format (DD Month YYYY)
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string
 */
export const formatDateLong = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

/**
 * Format time to HH:MM AM/PM
 * @param {string|Date} date - The date/time to format
 * @returns {string} Formatted time string
 */
export const formatTime = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Format date and time together
 * @param {string|Date} date - The date/time to format
 * @returns {object} Object with separate date and time strings
 */
export const formatDateTime = (date) => {
  if (!date) return { date: '-', time: '-' };
  return {
    date: formatDate(date),
    time: formatTime(date),
  };
};

/**
 * Format phone number
 * @param {string} phone - The phone number to format
 * @returns {string} Formatted phone number
 */
export const formatPhone = (phone) => {
  if (!phone) return '-';
  return phone.trim();
};

/**
 * Format percentage
 * @param {number} value - The percentage value
 * @returns {string} Formatted percentage string
 */
export const formatPercent = (value) => {
  if (value === null || value === undefined) return '0%';
  return `${parseFloat(value).toFixed(2)}%`;
};

/**
 * Parse numeric string input, allowing decimals
 * @param {string} value - The input value
 * @returns {string} Sanitized numeric string
 */
export const parseNumericInput = (value) => {
  // Allow empty string, decimal point, or valid decimal numbers
  if (value === '' || value === '.' || /^\d*\.?\d*$/.test(value)) {
    return value;
  }
  return null; // Invalid input
};

/**
 * Convert numeric string to number safely
 * @param {string|number} value - The value to convert
 * @param {number} defaultValue - Default value if conversion fails
 * @returns {number} Converted number
 */
export const toNumber = (value, defaultValue = 0) => {
  const num = parseFloat(value);
  return isNaN(num) ? defaultValue : num;
};
