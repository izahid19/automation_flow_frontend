/**
 * Validation utilities for form fields
 */

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export const validateEmail = (email) => {
  if (!email) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Validate phone number (optional field)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid or empty
 */
export const validatePhone = (phone) => {
  if (!phone) return true; // optional field
  const re = /^[+]?[\d\s-]{10,15}$/;
  return re.test(phone);
};

/**
 * Validate required field
 * @param {string} value - Value to validate
 * @returns {boolean} True if not empty
 */
export const validateRequired = (value) => {
  return value !== null && value !== undefined && String(value).trim() !== '';
};

/**
 * Validate numeric field
 * @param {string|number} value - Value to validate
 * @param {object} options - Validation options
 * @returns {boolean} True if valid number
 */
export const validateNumber = (value, options = {}) => {
  const { min, max, required = false } = options;
  
  if (!required && (value === '' || value === null || value === undefined)) {
    return true;
  }
  
  const num = parseFloat(value);
  if (isNaN(num)) return false;
  
  if (min !== undefined && num < min) return false;
  if (max !== undefined && num > max) return false;
  
  return true;
};

/**
 * Validate item fields based on formulation type
 * @param {object} item - Item object to validate
 * @returns {object} Object with field errors
 */
export const validateQuoteItem = (item) => {
  const errors = {};
  
  // Check formulation-specific requirements
  const isPharma = !['Injection', 'I.V/Fluid', 'Lotion', 'Soap', 'Custom'].includes(item.formulationType);
  const isSoftGelatin = item.formulationType === 'Soft Gelatine';
  const isLiquidInjection = item.formulationType === 'Injection' && item.injectionType === 'Liquid Injection';
  const isDryInjection = item.formulationType === 'Injection' && item.injectionType === 'Dry Injection';
  const isDrySyrup = item.formulationType === 'Dry Syrup';
  const isCustomFormulation = item.formulationType === 'Custom';
  
  // Required fields for all items
  if (!validateRequired(item.brandName)) {
    errors.brandName = 'Brand name is required';
  }
  if (!validateRequired(item.composition)) {
    errors.composition = 'Composition is required';
  }
  if (!validateNumber(item.quantity, { required: true, min: 1 })) {
    errors.quantity = 'Quantity is required';
  }
  if (!validateNumber(item.rate, { required: true, min: 0 })) {
    errors.rate = 'Rate is required';
  }
  if (!validateNumber(item.mrp, { required: true, min: 0 })) {
    errors.mrp = 'MRP is required';
  }
  if (!validateRequired(item.packagingType)) {
    errors.packagingType = 'Packaging type is required';
  }
  
  // Conditional validations
  if (isCustomFormulation && !validateRequired(item.customFormulationType)) {
    errors.customFormulationType = 'Custom formulation is required';
  }
  if (isPharma && !validateRequired(item.packing)) {
    errors.packing = 'Packing is required';
  }
  if (isSoftGelatin && !validateRequired(item.softGelatinColor)) {
    errors.softGelatinColor = 'Colour is required';
  }
  if (isLiquidInjection && !validateRequired(item.injectionBoxPacking)) {
    errors.injectionBoxPacking = 'Box packing is required';
  }
  if (isLiquidInjection && !validateRequired(item.injectionPacking)) {
    errors.injectionPacking = 'Injection packing is required';
  }
  if (isDryInjection && !validateRequired(item.dryInjectionUnitPack)) {
    errors.dryInjectionUnitPack = 'Unit pack is required';
  }
  if (isDryInjection && !validateRequired(item.dryInjectionPackType)) {
    errors.dryInjectionPackType = 'Pack type is required';
  }
  if (isDryInjection && !validateRequired(item.dryInjectionTrayPack)) {
    errors.dryInjectionTrayPack = 'Tray pack is required';
  }
  if (isDrySyrup && !validateRequired(item.cartonPacking)) {
    errors.cartonPacking = 'Carton is required';
  }
  if (isDrySyrup && !validateRequired(item.drySyrupWaterType)) {
    errors.drySyrupWaterType = 'Water type is required';
  }
  
  return errors;
};

/**
 * Validate entire quote form
 * @param {object} formData - Form data to validate
 * @returns {object} Object with form errors and item errors
 */
export const validateQuoteForm = (formData) => {
  const errors = {};
  const itemErrors = [];
  
  // Client details validation
  if (!validateRequired(formData.partyName)) {
    errors.partyName = 'Party name is required';
  }
  if (!validateRequired(formData.marketedBy)) {
    errors.marketedBy = 'Marketed by is required';
  }
  if (!validateRequired(formData.clientEmail)) {
    errors.clientEmail = 'Email is required';
  } else if (!validateEmail(formData.clientEmail)) {
    errors.clientEmail = 'Please enter a valid email address';
  }
  if (formData.clientPhone && !validatePhone(formData.clientPhone)) {
    errors.clientPhone = 'Please enter a valid phone number';
  }
  
  // Validate items
  formData.items?.forEach((item) => {
    const itemError = validateQuoteItem(item);
    itemErrors.push(itemError);
  });
  
  // Add items error if any item has errors
  if (itemErrors.some((errs) => Object.keys(errs).length > 0)) {
    errors.items = 'Please fill in all mandatory item fields';
  }
  
  return { errors, itemErrors };
};

/**
 * Validate purchase order form
 * @param {object} formData - Form data to validate
 * @param {array} items - PO items
 * @returns {object} Object with errors
 */
export const validatePOForm = (formData, items) => {
  const errors = {};
  
  if (!validateRequired(formData.manufacturerId)) {
    errors.manufacturer = 'Please select a manufacturer';
  }
  
  if (!items || items.length === 0) {
    errors.items = 'Please add at least one item';
  } else {
    // Basic item validation
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!validateRequired(item.brandName)) {
        errors.items = `Item ${i + 1}: Brand name is required`;
        break;
      }
      if (!validateNumber(item.quantity, { required: true, min: 1 })) {
        errors.items = `Item ${i + 1}: Quantity is required`;
        break;
      }
      if (!validateNumber(item.rate, { required: true, min: 0 })) {
        errors.items = `Item ${i + 1}: Rate is required`;
        break;
      }
    }
  }
  
  return errors;
};
