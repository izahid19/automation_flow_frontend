/**
 * Calculate quote totals
 * @param {Array} items - Quote items
 * @param {Object} charges - Additional charges and discounts
 * @returns {Object} Calculated totals
 */
export const calculateQuoteTotals = (items = [], charges = {}) => {
  const {
    discountPercent = 0,
    taxPercent = 0,
    cylinderCharges = 0,
    inventoryCharges = 0,
  } = charges;

  // Calculate subtotal from items
  const subtotal = items.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.rate || 0),
    0
  );

  // Calculate discount
  const discount = (subtotal * discountPercent) / 100;

  // Calculate amount after discount
  const afterDiscount = subtotal - discount;

  // Calculate tax on discounted amount
  const tax = (afterDiscount * taxPercent) / 100;

  // Calculate final total
  const total =
    afterDiscount +
    tax +
    (parseFloat(cylinderCharges) || 0) +
    (parseFloat(inventoryCharges) || 0);

  return {
    subtotal: Number(subtotal.toFixed(2)),
    discount: Number(discount.toFixed(2)),
    afterDiscount: Number(afterDiscount.toFixed(2)),
    tax: Number(tax.toFixed(2)),
    total: Number(total.toFixed(2)),
  };
};

/**
 * Check if a formulation type requires packing field
 * @param {String} formulationType 
 * @returns {Boolean}
 */
export const requiresPacking = (formulationType) => {
  return !['Injection', 'I.V/Fluid'].includes(formulationType);
};
