/**
 * Form helper utilities for common form operations
 */

/**
 * Check for deep equality between two objects (handles nested structures)
 * Uses loose equality for primitives to handle string/number differences
 * @param {any} obj1 - First object
 * @param {any} obj2 - Second object
 * @returns {boolean} True if deeply equal
 */
export const isDeepEqual = (obj1, obj2) => {
  // Use loose equality for primitives to handle string/number differences (e.g. "5" vs 5)
  if (obj1 == obj2) return true;
  
  if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
    return false;
  }
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (let key of keys1) {
    if (!keys2.includes(key) || !isDeepEqual(obj1[key], obj2[key])) {
      return false;
    }
  }
  
  return true;
};

/**
 * Handle numeric keyboard input, allowing only numbers and control keys
 * @param {KeyboardEvent} e - The keyboard event
 * @returns {void}
 */
export const handleNumericKeyDown = (e) => {
  // Allow: backspace, delete, tab, escape, enter, decimal point
  if (
    [46, 8, 9, 27, 13, 110, 190].indexOf(e.keyCode) !== -1 ||
    // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    (e.keyCode === 65 && e.ctrlKey === true) ||
    (e.keyCode === 67 && e.ctrlKey === true) ||
    (e.keyCode === 86 && e.ctrlKey === true) ||
    (e.keyCode === 88 && e.ctrlKey === true) ||
    // Allow: home, end, left, right
    (e.keyCode >= 35 && e.keyCode <= 39)
  ) {
    return;
  }
  // Ensure that it is a number and stop the keypress
  if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
    e.preventDefault();
  }
};

/**
 * Safely parse numeric input from form fields
 * @param {string|number} value - Input value
 * @param {number} defaultValue - Default value if parsing fails
 * @returns {number} Parsed number
 */
export const parseNumeric = (value, defaultValue = 0) => {
  if (value === '' || value === null || value === undefined) {
    return defaultValue;
  }
  const num = parseFloat(value);
  return isNaN(num) ? defaultValue : num;
};

/**
 * Create deep copy of an object using JSON serialization
 * @param {any} obj - Object to clone
 * @returns {any} Cloned object
 */
export const deepClone = (obj) => {
  if (obj === null || obj === undefined) return obj;
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (error) {
    console.error('Failed to deep clone object:', error);
    return obj;
  }
};

/**
 * Check if form has unsaved changes
 * @param {object} currentData - Current form data
 * @param {object} initialData - Initial form data
 * @returns {boolean} True if form has changes
 */
export const hasFormChanges = (currentData, initialData) => {
  if (!initialData) return true; // New form
  return !isDeepEqual(currentData, initialData);
};

/**
 * Sanitize form data before submission
 * @param {object} formData - Form data to sanitize
 * @returns {object} Sanitized form data
 */
export const sanitizeFormData = (formData) => {
  const sanitized = { ...formData };
  
  // Convert string numbers to actual numbers for numeric fields
  const numericFields = ['discountPercent', 'taxPercent', 'taxPercentOnCharges', 'cylinderCharges', 'numberOfCylinders', 'inventoryCharges'];
  
  numericFields.forEach(field => {
    if (sanitized[field] !== undefined) {
      sanitized[field] = parseNumeric(sanitized[field], 0);
    }
  });
  
  // Sanitize items
  if (sanitized.items && Array.isArray(sanitized.items)) {
    sanitized.items = sanitized.items.map(item => ({
      ...item,
      quantity: parseNumeric(item.quantity, 0),
      rate: parseNumeric(item.rate, 0),
      mrp: parseNumeric(item.mrp, 0),
    }));
  }
  
  return sanitized;
};

/**
 * Get field error from errors object
 * @param {object} errors - Errors object
 * @param {string} fieldName - Field name
 * @returns {string|null} Error message or null
 */
export const getFieldError = (errors, fieldName) => {
  return errors?.[fieldName] || null;
};

/**
 * Get item field error from item errors array
 * @param {array} itemErrors - Array of item errors
 * @param {number} index - Item index
 * @param {string} fieldName - Field name
 * @returns {string|null} Error message or null
 */
export const getItemFieldError = (itemErrors, index, fieldName) => {
  return itemErrors?.[index]?.[fieldName] || null;
};

/**
 * Clear field error
 * @param {object} errors - Errors object
 * @param {string} fieldName - Field name to clear
 * @returns {object} Updated errors object
 */
export const clearFieldError = (errors, fieldName) => {
  const { [fieldName]: _, ...rest } = errors;
  return rest;
};
