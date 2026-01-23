/**
 * QuoteItemDetail Component
 * Read-only item card for QuoteDetail
 */

import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ReadOnlyField } from '@/components/shared/ReadOnlyField';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/formatters';
import { calculateItemTotal, getDisplayValue } from '@/utils/itemHelpers';

/**
 * QuoteItemDetail - Read-only item card
 * @param {object} props - Component props
 * @param {object} props.item - Item data
 * @param {number} props.index - Item index
 * @returns {JSX.Element} Read-only item card
 */
export const QuoteItemDetail = ({ item, index }) => {
  const showPackingField = !['Injection', 'I.V/Fluid', 'Lotion', 'Soap', 'Custom'].includes(item.formulationType);

  return (
    <div className="p-5 border border-border/50 bg-card rounded-xl shadow-sm space-y-5 transition-all hover:border-border">
      {/* Item Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
            {index + 1}
          </span>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-white">{item.brandName || 'Product Name'}</span>
            <span className="font-semibold text-xs text-muted-foreground">Product Details</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Product Specifications Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <ReadOnlyField label="Brand Name" value={item.brandName} />

          <div className="space-y-2">
            <Label className="text-xs font-medium text-white uppercase tracking-wider">
              Order Type
            </Label>
            <div className="h-10 px-3 py-2 bg-background border border-input rounded-md text-sm flex items-center">
              <Badge className={`${item.orderType === 'New' ? 'bg-green-500' : 'bg-red-500'} text-white`}>
                {item.orderType || 'New'}
              </Badge>
            </div>
          </div>

          <ReadOnlyField label="Category" value={item.categoryType} />

          <ReadOnlyField 
            label="Formulation" 
            value={
              item.formulationType === 'Custom'
                ? (item.customFormulationType || 'Custom')
                : item.formulationType
            }
          />

          {/* Conditional Fields */}
          {item.formulationType === 'Soft Gelatine' && (
            <ReadOnlyField label="Colour of Soft Gelatin" value={item.softGelatinColor} />
          )}

          {item.formulationType === 'Injection' && (
            <ReadOnlyField label="Injection Type" value={item.injectionType} />
          )}

          {item.formulationType === 'Injection' && item.injectionType === 'Dry Injection' && (
            <>
              <ReadOnlyField label="Unit Pack" value={item.dryInjectionUnitPack} />
              <ReadOnlyField label="Pack Type" value={item.dryInjectionPackType} />
              <ReadOnlyField label="Tray Pack" value={item.dryInjectionTrayPack} />
            </>
          )}
        </div>

        {/* Technical Specs Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Composition - Spans 2 cols */}
          <div className="md:col-span-2">
            <ReadOnlyField label="Composition" value={item.composition} />
          </div>

          {/* Packing */}
          {showPackingField && (
            <ReadOnlyField 
              label={['Syrup/Suspension', 'Dry Syrup'].includes(item.formulationType) ? 'Unit Pack' : 'Box Packing'}
              value={getDisplayValue(item.packing, item.customPacking)}
            />
          )}

          {/* Packaging Type */}
          {!(item.formulationType === 'Injection' && item.injectionType === 'Dry Injection') && (
            <div className={!showPackingField ? 'md:col-span-2' : ''}>
              <ReadOnlyField 
                label={['Syrup/Suspension', 'Dry Syrup'].includes(item.formulationType) ? 'Label Type' : 'Packaging Type'}
                value={getDisplayValue(item.packagingType, item.customPackagingType)}
              />
            </div>
          )}

          {/* PVC Type */}
          {item.packagingType === 'Blister' && (
            <div className="md:col-span-2">
              <ReadOnlyField 
                label="PVC Type"
                value={getDisplayValue(item.pvcType, item.customPvcType)}
              />
            </div>
          )}

          {/* Liquid Injection Fields */}
          {item.formulationType === 'Injection' && item.injectionType === 'Liquid Injection' && (
            <>
              <ReadOnlyField label="Box Packing" value={item.injectionBoxPacking} />
              <ReadOnlyField 
                label="Injection Packing" 
                value={getDisplayValue(item.injectionPacking, item.customInjectionPacking)}
              />
              {item.injectionPacking === 'Blister Packing' && (
                <ReadOnlyField label="PVC Type" value={item.injectionPvcType} />
              )}
            </>
          )}

          {/* Carton */}
          {['Syrup/Suspension', 'Dry Syrup'].includes(item.formulationType) && (
            <ReadOnlyField 
              label="Carton"
              value={getDisplayValue(item.cartonPacking, item.customCartonPacking)}
            />
          )}

          {/* Water Type */}
          {item.formulationType === 'Dry Syrup' && (
            <ReadOnlyField label="Water Type" value={item.drySyrupWaterType} />
          )}

          {/* Specification */}
          <div className="md:col-span-2">
            <ReadOnlyField label="Specification" value={item.specification} />
          </div>
        </div>

        <Separator className="bg-border/40" />

        {/* Commercials Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-end">
          {/* Quantity */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-white uppercase tracking-wider">
              Quantity
            </Label>
            <div className="relative">
              <div className="h-12 px-3 py-2 bg-background border border-input rounded-md text-lg font-medium flex items-center">
                {item.quantity || 0}
              </div>
              <span className="absolute right-3 top-3.5 text-xs text-muted-foreground">Units</span>
            </div>
          </div>

          {/* MRP */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-white uppercase tracking-wider">
              MRP (₹)
            </Label>
            <div className="h-12 px-3 py-2 bg-background border border-input rounded-md text-lg flex items-center">
              {formatCurrency(item.mrp || 0)}
            </div>
          </div>

          {/* Our Rate */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-white uppercase tracking-wider">
              Our Rate (₹)
            </Label>
            <div className="h-12 px-3 py-2 bg-background border border-primary/20 rounded-md text-xl font-bold text-primary flex items-center">
              {formatCurrency(item.rate || 0)}
            </div>
          </div>

          {/* Total Amount */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-white uppercase tracking-wider">
              Total Amount
            </Label>
            <div className="h-12 px-3 py-2 bg-primary/10 border border-primary/30 rounded-md text-lg font-bold text-primary flex items-center">
              {formatCurrency(calculateItemTotal(item))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteItemDetail;
