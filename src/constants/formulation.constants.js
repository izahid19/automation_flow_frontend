// Packing options for different formulation types
export const PACKING_OPTIONS = {
  'Tablet': ['10x10', '10x1x10', '10x15', '20x10', '10x3', '10x5', '10x6', '10x7'],
  'Capsule': ['10x10', '10x1x10', '10x15', '20x10', '10x3', '10x5', '10x6', '10x7'],
  'Soft Gelatine': ['10x10', '10x1x10', '10x15', '20x10', '10x3', '10x5', '10x6', '10x7'],
  'Syrup/Suspension': ['2ml', '4ml', '4x5ml', '10ml', '15ml', '30ml', '50ml', '60ml', '100ml', '110ml', '120ml', '150ml', '170ml', '200ml', '220ml', '250ml', '300ml', '450ml'],
  'Dry Syrup': ['2ml', '4ml', '4x5ml', '10ml', '15ml', '30ml', '50ml', '60ml', '100ml', '110ml', '120ml', '150ml', '170ml', '200ml', '220ml', '250ml', '300ml', '450ml'],
  'Ointment/Cream': ['5gm', '10gm', '15gm', '20gm', '30gm', '50gm'],
  'Sachet': ['10x1gm', '20x1gm', '25x1gm', '30x1gm', '50x1gm', '10x3gm', '20x3gm', '10x5gm', '20x5gm', '10x7.5gm', '20x7.5gm', '10x1x8gm', '20x1x8gm'],
};

// Packaging type options for different formulation types
export const PACKAGING_OPTIONS = {
  'Tablet': ['Alu Alu', 'Blister', 'Aluminium'],
  'Capsule': ['Alu Alu', 'Blister', 'Aluminium'],
  'Soft Gelatine': ['Alu Alu', 'Blister', 'Aluminium'],
  'Syrup/Suspension': ['Only label', 'Sticker label', 'Metallic label', 'Vinyl label'],
  'Dry Syrup': ['Only label', 'Sticker label', 'Metallic label', 'Vinyl label'],
  'Ointment/Cream': ['With carton', 'With metalic carton', 'With flap'],
  'Sachet': ['With carton'],
};

// Carton options for specific formulation types
export const CARTON_OPTIONS = {
  'Syrup/Suspension': ['With carton', 'With metallic carton', 'With leafing carton', 'With matt carton'],
  'Dry Syrup': ['With carton', 'With metallic carton', 'With leafing carton', 'With matt carton'],
};

// All available formulation types
export const FORMULATION_TYPES = [
  ...Object.keys(PACKING_OPTIONS),
  'Injection',
  'I.V/Fluid',
  'Lotion',
  'Soap'
];

// Formulations that don't require packing field
export const NO_PACKING_FORMULATIONS = ['Injection', 'I.V/Fluid', 'Lotion', 'Soap'];
