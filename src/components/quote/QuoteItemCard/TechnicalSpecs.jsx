/**
 * TechnicalSpecs Component
 * Renders technical specification fields (composition, packing, packaging, etc.)
 */

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PACKING_OPTIONS, PACKAGING_OPTIONS, CARTON_OPTIONS } from '@/constants/formulation.constants';
import { 
  shouldShowPackingField, 
  shouldShowPackagingTypeField,
  getPackingFieldLabel,
  getPackagingTypeFieldLabel 
} from '@/utils/itemHelpers';

/**
 * Composition Field
 */
export const CompositionField = ({ value, onChange, error }) => (
  <div className="md:col-span-2 space-y-2">
    <Label className="text-xs font-medium text-white uppercase tracking-wider">
      Composition <span className="text-red-500">*</span>
    </Label>
    <Input
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Enter product composition"
      className={`h-10 ${error ? 'border-destructive' : ''}`}
    />
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>
);

/**
 * Packing Field (Box/Unit)
 */
export const PackingField = ({ item, onChange, error }) => {
  const showField = shouldShowPackingField(item.formulationType);
  if (!showField) return null;

  const packingOptions = PACKING_OPTIONS[item.formulationType] || [];
  const label = getPackingFieldLabel(item.formulationType);

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-white uppercase tracking-wider">
        {label} <span className="text-red-500">*</span>
      </Label>
      <Select
        value={item.packing || ''}
        onValueChange={(value) => onChange('packing', value)}
      >
        <SelectTrigger className={`w-full h-10 ${error ? 'border-destructive' : ''}`}>
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          {packingOptions.concat(['Custom']).map(opt => (
            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {item.packing === 'Custom' && (
        <Input
          value={item.customPacking || ''}
          onChange={(e) => onChange('customPacking', e.target.value)}
          placeholder="Enter custom packing"
          className="h-10 mt-2"
        />
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
};

/**
 * Packaging Type Field
 */
export const PackagingTypeField = ({ item, onChange, error }) => {
  const showField = shouldShowPackagingTypeField(item.formulationType, item.injectionType);
  if (!showField) return null;

  const packagingOptions = PACKAGING_OPTIONS[item.formulationType];
  const label = getPackagingTypeFieldLabel(item.formulationType);
  const showPacking = shouldShowPackingField(item.formulationType);

  return (
    <div className={`space-y-2 ${!showPacking ? 'md:col-span-2' : ''}`}>
      <Label className="text-xs font-medium text-white uppercase tracking-wider">
        {label} <span className="text-red-500">*</span>
      </Label>
      {packagingOptions ? (
        <Select
          value={item.packagingType || ''}
          onValueChange={(value) => onChange('packagingType', value)}
        >
          <SelectTrigger className={`w-full h-10 ${error ? 'border-destructive' : ''}`}>
            <SelectValue placeholder="Select Type" />
          </SelectTrigger>
          <SelectContent>
            {packagingOptions.concat(['Custom']).map(opt => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          value={item.packagingType || ''}
          onChange={(e) => onChange('packagingType', e.target.value)}
          placeholder="Type"
          className={`h-10 ${error ? 'border-destructive' : ''}`}
        />
      )}
      {item.packagingType === 'Custom' && (
        <Input
          value={item.customPackagingType || ''}
          onChange={(e) => onChange('customPackagingType', e.target.value)}
          placeholder="Enter custom packaging type"
          className="h-10 mt-2"
        />
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
};

/**
 * PVC Type Field (for Blister packaging)
 */
export const PvcTypeField = ({ item, onChange }) => {
  if (item.packagingType !== 'Blister') return null;

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-white uppercase tracking-wider">
        PVC Type
      </Label>
      <Select
        value={item.pvcType || ''}
        onValueChange={(value) => onChange('pvcType', value)}
      >
        <SelectTrigger className="w-full h-10">
          <SelectValue placeholder="Select PVC Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Clear PVC">Clear PVC</SelectItem>
          <SelectItem value="Amber PVC">Amber PVC</SelectItem>
          <SelectItem value="Custom">Custom</SelectItem>
        </SelectContent>
      </Select>
      {item.pvcType === 'Custom' && (
        <Input
          value={item.customPvcType || ''}
          onChange={(e) => onChange('customPvcType', e.target.value)}
          placeholder="Enter custom PVC type"
          className="h-10 mt-2"
        />
      )}
    </div>
  );
};

/**
 * Carton Field (for Syrup/Suspension and Dry Syrup)
 */
export const CartonField = ({ item, onChange, error }) => {
  if (!['Syrup/Suspension', 'Dry Syrup'].includes(item.formulationType)) return null;

  const cartonOptions = CARTON_OPTIONS[item.formulationType] || [];
  const isRequired = item.formulationType === 'Dry Syrup';

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-white uppercase tracking-wider">
        Carton {isRequired && <span className="text-red-500">*</span>}
      </Label>
      <Select
        value={item.cartonPacking || ''}
        onValueChange={(value) => onChange('cartonPacking', value)}
      >
        <SelectTrigger className={`w-full h-10 ${error ? 'border-destructive' : ''}`}>
          <SelectValue placeholder="Select Carton" />
        </SelectTrigger>
        <SelectContent>
          {cartonOptions.concat(['Custom']).map(opt => (
            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {item.cartonPacking === 'Custom' && (
        <Input
          value={item.customCartonPacking || ''}
          onChange={(e) => onChange('customCartonPacking', e.target.value)}
          placeholder="Enter custom carton"
          className="h-10 mt-2"
        />
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
};

/**
 * Specification Field (optional)
 */
export const SpecificationField = ({ value, onChange }) => (
  <div className="md:col-span-2 space-y-2">
    <Label className="text-xs font-medium text-white uppercase tracking-wider">
      Specification
    </Label>
    <Input
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Enter specification (optional)"
      className="h-10"
    />
  </div>
);

export default {
  CompositionField,
  PackingField,
  PackagingTypeField,
  PvcTypeField,
  CartonField,
  SpecificationField,
};
