/**
 * Central export for all utility functions
 */

// Formatters
export {
  formatCurrency,
  formatAmount,
  formatDate,
  formatDateLong,
  formatTime,
  formatDateTime,
  formatPhone,
  formatPercent,
  parseNumericInput,
  toNumber,
} from './formatters';

// Validators
export {
  validateEmail,
  validatePhone,
  validateRequired,
  validateNumber,
  validateQuoteItem,
  validateQuoteForm,
  validatePOForm,
} from './validators';

// Form Helpers
export {
  isDeepEqual,
  handleNumericKeyDown,
  parseNumeric,
  deepClone,
  hasFormChanges,
  sanitizeFormData,
  getFieldError,
  getItemFieldError,
  clearFieldError,
} from './formHelpers';

// Item Helpers
export {
  resetFormulationDependentFields,
  resetInjectionDependentFields,
  resetPvcTypeFields,
  resetInjectionPvcType,
  updateItemField,
  createNewItem,
  duplicateItem,
  shouldShowPackingField,
  shouldShowPackagingTypeField,
  getPackingFieldLabel,
  getPackagingTypeFieldLabel,
  calculateItemTotal,
  getDisplayValue,
  mapSheetItemToFormItem,
  isSameItem,
} from './itemHelpers';

// Status Helpers
export {
  QUOTE_STATUS_CONFIG,
  PO_STATUS_CONFIG,
  ORDER_TYPE_CONFIG,
  QUOTE_STATUS_FILTERS,
  getQuoteStatusConfig,
  getPOStatusConfig,
  getOrderTypeConfig,
  getApprovalActionLabel,
  getApprovalActionColor,
  getPendingApprovalsCount,
  getApprovedCount,
} from './statusHelpers';

// Quote Calculations (existing)
export { calculateQuoteTotals, requiresPacking } from './quoteCalculations';
