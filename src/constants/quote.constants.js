// Default structure for a new quote item
export const DEFAULT_ITEM = {
  brandName: '',
  orderType: 'New',
  categoryType: 'Drug',
  formulationType: 'Tablet',
  composition: '',
  packing: '',
  customPacking: '',
  packagingType: '',
  customPackagingType: '',
  cartonPacking: '',
  customCartonPacking: '',
  specification: '',
  softGelatinColor: '',
  quantity: 1,
  mrp: 0,
  rate: 0,
};

// Order type options
export const ORDER_TYPES = ['New', 'Repeat'];

// Category type options  
export const CATEGORY_TYPES = ['Drug', 'Nutraceutical', 'Cosmetics'];

// Default quote form data
export const DEFAULT_QUOTE_FORM = {
  partyName: '',
  marketedBy: '',
  clientEmail: '',
  clientPhone: '',
  clientAddress: '',
  items: [{ ...DEFAULT_ITEM }],
  discountPercent: 0,
  taxPercent: 0,
  cylinderCharges: 0,
  inventoryCharges: 0,
  terms: 'Payment due within 30 days. All prices in INR.',
  bankDetails: '',
};
