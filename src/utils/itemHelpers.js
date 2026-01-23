/**
 * Item manipulation utilities for quote and PO items
 */

import { DEFAULT_ITEM } from '@/constants/quote.constants';

/**
 * Reset dependent fields when formulation type changes
 * @param {object} item - Current item
 * @returns {object} Item with reset dependent fields
 */
export const resetFormulationDependentFields = (item) => {
  return {
    ...item,
    packing: '',
    packagingType: '',
    cartonPacking: '',
    customCartonPacking: '',
    drySyrupWaterType: '',
    pvcType: '',
    customPvcType: '',
    softGelatinColor: '',
    injectionType: '',
    injectionBoxPacking: '',
    injectionPacking: '',
    customInjectionPacking: '',
    injectionPvcType: '',
    dryInjectionUnitPack: '',
    dryInjectionPackType: '',
    dryInjectionTrayPack: '',
    customFormulationType: '',
  };
};

/**
 * Reset injection type dependent fields
 * @param {object} item - Current item
 * @returns {object} Item with reset injection fields
 */
export const resetInjectionDependentFields = (item) => {
  return {
    ...item,
    injectionBoxPacking: '',
    injectionPacking: '',
    customInjectionPacking: '',
    injectionPvcType: '',
    dryInjectionUnitPack: '',
    dryInjectionPackType: '',
    dryInjectionTrayPack: '',
  };
};

/**
 * Reset PVC type fields when packaging changes away from Blister
 * @param {object} item - Current item
 * @returns {object} Item with reset PVC fields
 */
export const resetPvcTypeFields = (item) => {
  return {
    ...item,
    pvcType: '',
    customPvcType: '',
  };
};

/**
 * Reset injection PVC type when packing changes away from Blister
 * @param {object} item - Current item
 * @returns {object} Item with reset injection PVC field
 */
export const resetInjectionPvcType = (item) => {
  return {
    ...item,
    injectionPvcType: '',
  };
};

/**
 * Handle item field change with proper dependency management
 * @param {object} item - Current item
 * @param {string} field - Field name that changed
 * @param {any} value - New value
 * @returns {object} Updated item
 */
export const updateItemField = (item, field, value) => {
  let updatedItem = { ...item, [field]: value };
  
  // Handle dependent field resets
  if (field === 'formulationType') {
    updatedItem = resetFormulationDependentFields(updatedItem);
  } else if (field === 'injectionType') {
    updatedItem = resetInjectionDependentFields(updatedItem);
  } else if (field === 'packagingType' && value !== 'Blister') {
    updatedItem = resetPvcTypeFields(updatedItem);
  } else if (field === 'injectionPacking' && value !== 'Blister Packing') {
    updatedItem = resetInjectionPvcType(updatedItem);
  }
  
  return updatedItem;
};

/**
 * Create a new default item
 * @returns {object} New default item
 */
export const createNewItem = () => {
  return { ...DEFAULT_ITEM };
};

/**
 * Duplicate an existing item
 * @param {object} item - Item to duplicate
 * @returns {object} Duplicated item
 */
export const duplicateItem = (item) => {
  return { ...item };
};

/**
 * Check if packing field should be shown for formulation type
 * @param {string} formulationType - Formulation type
 * @returns {boolean} True if packing field should be shown
 */
export const shouldShowPackingField = (formulationType) => {
  return !['Injection', 'I.V/Fluid', 'Lotion', 'Soap', 'Custom'].includes(formulationType);
};

/**
 * Check if packaging type field should be shown for formulation type
 * @param {string} formulationType - Formulation type
 * @param {string} injectionType - Injection type (if applicable)
 * @returns {boolean} True if packaging type field should be shown
 */
export const shouldShowPackagingTypeField = (formulationType, injectionType) => {
  return !(formulationType === 'Injection' && injectionType === 'Dry Injection');
};

/**
 * Get packing field label based on formulation type
 * @param {string} formulationType - Formulation type
 * @returns {string} Field label
 */
export const getPackingFieldLabel = (formulationType) => {
  if (['Syrup/Suspension', 'Dry Syrup'].includes(formulationType)) {
    return 'Unit Pack';
  }
  return 'Box Packing';
};

/**
 * Get packaging type field label based on formulation type
 * @param {string} formulationType - Formulation type
 * @returns {string} Field label
 */
export const getPackagingTypeFieldLabel = (formulationType) => {
  if (['Syrup/Suspension', 'Dry Syrup'].includes(formulationType)) {
    return 'Label Type';
  }
  return 'Packaging Type';
};

/**
 * Calculate item total amount
 * @param {object} item - Item with quantity and rate
 * @returns {number} Total amount
 */
export const calculateItemTotal = (item) => {
  const quantity = parseFloat(item.quantity) || 0;
  const rate = parseFloat(item.rate) || 0;
  return quantity * rate;
};

/**
 * Get display value for custom fields
 * @param {string} value - Field value
 * @param {string} customValue - Custom field value
 * @returns {string} Display value
 */
export const getDisplayValue = (value, customValue) => {
  if (value === 'Custom' && customValue) {
    return customValue;
  }
  return value || '-';
};

/**
 * Map order sheet item to form item structure
 * @param {object} sheetItem - Order sheet item
 * @returns {object} Mapped form item
 */
export const mapSheetItemToFormItem = (sheetItem) => {
  const quoteItem = sheetItem?.quote?.items?.[sheetItem.itemIndex] || {};
  const sheetItemDetails = sheetItem?.item || sheetItem?.itemDetails || {};
  
  const sourceItem = {
    ...quoteItem,
    ...sheetItemDetails,
  };
  
  return {
    ...DEFAULT_ITEM,
    ...sourceItem,
    quantity: sourceItem.quantity?.toString() || '',
    rate: sourceItem.rate?.toString() || '',
    mrp: sourceItem.mrp?.toString() || '',
    selected: true,
    originalIndex: sheetItem?.itemIndex,
    sourceSheetId: sheetItem?._id,
    sourceQuoteId: sheetItem?.quote?._id,
  };
};

/**
 * Check if two items are the same (for duplicate detection)
 * @param {object} item1 - First item
 * @param {object} item2 - Second item
 * @returns {boolean} True if items match
 */
export const isSameItem = (item1, item2) => {
  if (item1.sourceSheetId && item2._id) {
    return item1.sourceSheetId === item2._id;
  }
  if (item1.sourceQuoteId && item2.quote?._id) {
    return (
      String(item1.sourceQuoteId) === String(item2.quote._id) &&
      item1.originalIndex === item2.itemIndex
    );
  }
  return item1.originalIndex === item2.itemIndex;
};
