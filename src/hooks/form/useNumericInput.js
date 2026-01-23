/**
 * Custom hook for handling numeric input fields
 * Provides validation and formatting for numeric inputs
 */

import { useState, useCallback } from 'react';
import { parseNumericInput } from '@/utils/formatters';
import { handleNumericKeyDown as keyDownHandler } from '@/utils/formHelpers';

/**
 * Hook for managing numeric input state and handlers
 * @param {number|string} initialValue - Initial value
 * @param {object} options - Configuration options
 * @returns {object} Numeric input state and handlers
 */
export const useNumericInput = (initialValue = '', options = {}) => {
  const {
    min,
    max,
    allowDecimals = true,
    allowNegative = false,
    onChange,
  } = options;

  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState(null);

  /**
   * Handle value change with validation
   */
  const handleChange = useCallback((newValue) => {
    // Parse the input
    const parsed = parseNumericInput(newValue);
    
    if (parsed === null) {
      return; // Invalid input, don't update
    }

    // Validate constraints
    if (parsed !== '' && parsed !== '.') {
      const num = parseFloat(parsed);
      
      if (!isNaN(num)) {
        if (!allowNegative && num < 0) {
          setError('Negative values not allowed');
          return;
        }
        if (min !== undefined && num < min) {
          setError(`Minimum value is ${min}`);
        } else if (max !== undefined && num > max) {
          setError(`Maximum value is ${max}`);
        } else {
          setError(null);
        }
      }
    } else {
      setError(null);
    }

    setValue(parsed);
    
    if (onChange) {
      onChange(parsed);
    }
  }, [min, max, allowNegative, onChange]);

  /**
   * Handle keyboard events
   */
  const handleKeyDown = useCallback((e) => {
    keyDownHandler(e);
  }, []);

  /**
   * Get numeric value (parsed as number)
   */
  const getNumericValue = useCallback(() => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  }, [value]);

  /**
   * Reset value
   */
  const reset = useCallback(() => {
    setValue(initialValue);
    setError(null);
  }, [initialValue]);

  /**
   * Set value programmatically
   */
  const setNumericValue = useCallback((newValue) => {
    const stringValue = String(newValue);
    handleChange(stringValue);
  }, [handleChange]);

  return {
    value,
    error,
    handleChange,
    handleKeyDown,
    getNumericValue,
    reset,
    setValue: setNumericValue,
  };
};

/**
 * Hook for managing multiple numeric fields
 * @param {object} initialValues - Object with initial values
 * @param {object} options - Configuration options per field
 * @returns {object} State and handlers for all numeric fields
 */
export const useNumericFields = (initialValues = {}, options = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});

  /**
   * Handle change for a specific field
   */
  const handleFieldChange = useCallback((fieldName, newValue) => {
    const parsed = parseNumericInput(newValue);
    
    if (parsed === null) {
      return; // Invalid input
    }

    const fieldOptions = options[fieldName] || {};
    const { min, max } = fieldOptions;

    // Validate
    let error = null;
    if (parsed !== '' && parsed !== '.') {
      const num = parseFloat(parsed);
      
      if (!isNaN(num)) {
        if (min !== undefined && num < min) {
          error = `Minimum value is ${min}`;
        } else if (max !== undefined && num > max) {
          error = `Maximum value is ${max}`;
        }
      }
    }

    setValues(prev => ({ ...prev, [fieldName]: parsed }));
    setErrors(prev => ({ ...prev, [fieldName]: error }));
  }, [options]);

  /**
   * Get numeric value for a field
   */
  const getNumericValue = useCallback((fieldName) => {
    const value = values[fieldName];
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  }, [values]);

  /**
   * Handle keyboard events (same for all fields)
   */
  const handleKeyDown = useCallback((e) => {
    keyDownHandler(e);
  }, []);

  /**
   * Reset all values
   */
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
  }, [initialValues]);

  return {
    values,
    errors,
    handleFieldChange,
    handleKeyDown,
    getNumericValue,
    reset,
  };
};

export default useNumericInput;
