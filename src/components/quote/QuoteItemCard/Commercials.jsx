/**
 * Commercials Component
 * Renders commercial fields (quantity, MRP, rate, amount)
 */

import { Label } from '@/components/ui/label';
import { NumericInput } from '@/components/shared/NumericInput';
import { handleNumericKeyDown } from '@/utils/formHelpers';
import { formatCurrency } from '@/utils/formatters';
import { calculateItemTotal } from '@/utils/itemHelpers';

/**
 * Quantity Field
 */
export const QuantityField = ({ value, onChange, error }) => (
  <div className="space-y-2">
    <Label className="text-xs font-medium text-white uppercase tracking-wider">
      Quantity <span className="text-red-500">*</span>
    </Label>
    <NumericInput
      value={value || ''}
      onChange={onChange}
      placeholder="0"
      suffix="Units"
      className={`h-12 text-lg font-medium ${error ? 'border-destructive' : ''}`}
    />
    <div className="min-h-[16px]">
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  </div>
);

/**
 * MRP Field
 */
export const MrpField = ({ value, onChange, error }) => (
  <div className="space-y-2">
    <Label className="text-xs font-medium text-white uppercase tracking-wider">
      MRP (₹) <span className="text-red-500">*</span>
    </Label>
    <NumericInput
      value={value || ''}
      onChange={onChange}
      placeholder="0.00"
      className={`h-12 text-lg ${error ? 'border-destructive' : ''}`}
    />
    <div className="min-h-[16px]">
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  </div>
);

/**
 * Rate Field
 */
export const RateField = ({ value, onChange, error }) => (
  <div className="space-y-2">
    <Label className="text-xs font-medium text-white uppercase tracking-wider">
      Our Rate (₹) <span className="text-red-500">*</span>
    </Label>
    <NumericInput
      value={value || ''}
      onChange={onChange}
      placeholder="0.00"
      className={`h-12 text-xl font-bold text-primary border-primary/20 focus:border-primary ${error ? 'border-destructive' : ''}`}
    />
    <div className="min-h-[16px]">
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  </div>
);

/**
 * Amount Display (calculated field)
 */
export const AmountDisplay = ({ item }) => {
  const amount = calculateItemTotal(item);

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-white uppercase tracking-wider">
        Total Amount
      </Label>
      <div className="h-12 px-3 py-2 bg-primary/10 border border-primary/30 rounded-md text-lg font-bold text-primary flex items-center">
        {formatCurrency(amount)}
      </div>
    </div>
  );
};

/**
 * Commercials Section - All commercial fields together
 */
export const CommercialsSection = ({ item, onChange, getError }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-end">
    <QuantityField 
      value={item.quantity}
      onChange={(value) => onChange('quantity', value)}
      error={getError('quantity')}
    />

    <MrpField 
      value={item.mrp}
      onChange={(value) => onChange('mrp', value)}
      error={getError('mrp')}
    />

    <RateField 
      value={item.rate}
      onChange={(value) => onChange('rate', value)}
      error={getError('rate')}
    />

    <AmountDisplay item={item} />
  </div>
);

export default CommercialsSection;
