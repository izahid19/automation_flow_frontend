/**
 * QuoteItemCard Component
 * Editable item card for QuoteForm
 */

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Copy, Trash2 } from 'lucide-react';
import { FORMULATION_TYPES } from '@/constants/formulation.constants';
import { CommercialsSection } from './Commercials';
import {
  CompositionField,
  PackingField,
  PackagingTypeField,
  PvcTypeField,
  CartonField,
  SpecificationField,
} from './TechnicalSpecs';
import {
  SoftGelatinColorField,
  InjectionTypeField,
  DryInjectionFields,
  LiquidInjectionFields,
  DrySyrupWaterTypeField,
} from './FormulationFields';

/**
 * QuoteItemCard - Editable item card
 * @param {object} props - Component props
 * @param {object} props.item - Item data
 * @param {number} props.index - Item index
 * @param {function} props.onChange - Change handler (index, field, value)
 * @param {function} props.onCopy - Copy handler
 * @param {function} props.onRemove - Remove handler
 * @param {boolean} props.canRemove - Whether item can be removed
 * @param {function} props.getError - Error getter function (field) => error
 * @returns {JSX.Element} Editable item card
 */
export const QuoteItemCard = ({
  item,
  index,
  onChange,
  onCopy,
  onRemove,
  canRemove = true,
  getError = () => null,
}) => {
  const handleFieldChange = (field, value) => {
    onChange(index, field, value);
  };

  return (
    <div className="p-5 border border-border/50 bg-card rounded-xl shadow-sm space-y-5 transition-all hover:border-border">
      {/* Item Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
            {index + 1}
          </span>
          <span className="font-semibold text-white">Product Details</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onCopy(index)}
            className="text-muted-foreground hover:text-foreground h-8 px-2"
            title="Copy Item"
          >
            <Copy size={16} className="mr-2" />
            <span className="text-xs">Duplicate</span>
          </Button>
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemove(index)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2"
              title="Remove Item"
            >
              <Trash2 size={16} />
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Product Specifications Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Brand Name */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-white uppercase tracking-wider">
              Brand Name <span className="text-red-500">*</span>
            </Label>
            <Input
              value={item.brandName || ''}
              onChange={(e) => handleFieldChange('brandName', e.target.value)}
              placeholder="Enter Brand Name"
              className={`h-10 ${getError('brandName') ? 'border-destructive' : ''}`}
            />
            {getError('brandName') && (
              <p className="text-xs text-destructive">{getError('brandName')}</p>
            )}
          </div>

          {/* Order Type */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-white uppercase tracking-wider">
              Order Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={item.orderType || 'New'}
              onValueChange={(value) => handleFieldChange('orderType', value)}
            >
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="New">New Order</SelectItem>
                <SelectItem value="Repeat">Repeat Order</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category Type */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-white uppercase tracking-wider">
              Category <span className="text-red-500">*</span>
            </Label>
            <Select
              value={item.categoryType || 'Drug'}
              onValueChange={(value) => handleFieldChange('categoryType', value)}
            >
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Drug">Drug</SelectItem>
                <SelectItem value="Nutraceutical">Nutraceutical</SelectItem>
                <SelectItem value="Cosmetics">Cosmetics</SelectItem>
                <SelectItem value="Ayurvedic">Ayurvedic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Formulation Type */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-white uppercase tracking-wider">
              Formulation <span className="text-red-500">*</span>
            </Label>
            <Select
              value={item.formulationType || 'Tablet'}
              onValueChange={(value) => handleFieldChange('formulationType', value)}
            >
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder="Select Formulation" />
              </SelectTrigger>
              <SelectContent>
                {FORMULATION_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {item.formulationType === 'Custom' && (
              <>
                <Input
                  value={item.customFormulationType || ''}
                  onChange={(e) => handleFieldChange('customFormulationType', e.target.value)}
                  placeholder="Enter custom formulation"
                  className={`h-10 mt-2 ${getError('customFormulationType') ? 'border-destructive' : ''}`}
                />
                {getError('customFormulationType') && (
                  <p className="text-xs text-destructive">{getError('customFormulationType')}</p>
                )}
              </>
            )}
          </div>

          {/* Conditional Fields based on Formulation Type */}
          {item.formulationType === 'Soft Gelatine' && (
            <SoftGelatinColorField
              value={item.softGelatinColor}
              onChange={(value) => handleFieldChange('softGelatinColor', value)}
              error={getError('softGelatinColor')}
            />
          )}

          {item.formulationType === 'Injection' && (
            <InjectionTypeField
              value={item.injectionType}
              onChange={(value) => handleFieldChange('injectionType', value)}
            />
          )}

          {item.formulationType === 'Injection' && item.injectionType === 'Dry Injection' && (
            <DryInjectionFields
              item={item}
              onChange={handleFieldChange}
              getError={getError}
            />
          )}
        </div>

        {/* Technical Specs Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <CompositionField
            value={item.composition}
            onChange={(value) => handleFieldChange('composition', value)}
            error={getError('composition')}
          />

          <PackingField
            item={item}
            onChange={handleFieldChange}
            error={getError('packing')}
          />

          <PackagingTypeField
            item={item}
            onChange={handleFieldChange}
            error={getError('packagingType')}
          />

          <PvcTypeField
            item={item}
            onChange={handleFieldChange}
          />

          {item.formulationType === 'Injection' && item.injectionType === 'Liquid Injection' && (
            <LiquidInjectionFields
              item={item}
              onChange={handleFieldChange}
              getError={getError}
            />
          )}

          <CartonField
            item={item}
            onChange={handleFieldChange}
            error={getError('cartonPacking')}
          />

          {item.formulationType === 'Dry Syrup' && (
            <DrySyrupWaterTypeField
              value={item.drySyrupWaterType}
              onChange={(value) => handleFieldChange('drySyrupWaterType', value)}
              error={getError('drySyrupWaterType')}
            />
          )}

          <SpecificationField
            value={item.specification}
            onChange={(value) => handleFieldChange('specification', value)}
          />
        </div>

        <Separator className="bg-border/40" />

        {/* Commercials Section */}
        <CommercialsSection
          item={item}
          onChange={handleFieldChange}
          getError={getError}
        />
      </div>
    </div>
  );
};

export default QuoteItemCard;
