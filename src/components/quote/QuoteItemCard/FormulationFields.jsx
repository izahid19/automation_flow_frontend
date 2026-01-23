/**
 * FormulationFields Component
 * Renders conditional formulation-specific fields
 */

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/**
 * Soft Gelatin Color Field
 */
export const SoftGelatinColorField = ({ value, onChange, error }) => (
  <div className="space-y-2">
    <Label className="text-xs font-medium text-white uppercase tracking-wider">
      Colour of Soft Gelatin <span className="text-red-500">*</span>
    </Label>
    <Input
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Enter colour"
      className={`h-10 ${error ? 'border-destructive' : ''}`}
    />
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>
);

/**
 * Injection Type Field
 */
export const InjectionTypeField = ({ value, onChange }) => (
  <div className="space-y-2">
    <Label className="text-xs font-medium text-white uppercase tracking-wider">
      Injection Type <span className="text-red-500">*</span>
    </Label>
    <Select value={value || ''} onValueChange={onChange}>
      <SelectTrigger className="w-full h-10">
        <SelectValue placeholder="Select Injection Type" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Dry Injection">Dry Injection</SelectItem>
        <SelectItem value="Liquid Injection">Liquid Injection</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

/**
 * Dry Injection Fields
 */
export const DryInjectionFields = ({ item, onChange, getError }) => (
  <>
    {/* Unit Pack */}
    <div className="space-y-2">
      <Label className="text-xs font-medium text-white uppercase tracking-wider">
        Unit Pack <span className="text-red-500">*</span>
      </Label>
      <Input
        value={item.dryInjectionUnitPack || ''}
        onChange={(e) => onChange('dryInjectionUnitPack', e.target.value)}
        placeholder="Enter unit pack"
        className={`h-10 ${getError('dryInjectionUnitPack') ? 'border-destructive' : ''}`}
      />
      {getError('dryInjectionUnitPack') && (
        <p className="text-xs text-destructive">{getError('dryInjectionUnitPack')}</p>
      )}
    </div>

    {/* Pack Type */}
    <div className="space-y-2">
      <Label className="text-xs font-medium text-white uppercase tracking-wider">
        Pack Type <span className="text-red-500">*</span>
      </Label>
      <Select
        value={item.dryInjectionPackType || ''}
        onValueChange={(value) => onChange('dryInjectionPackType', value)}
      >
        <SelectTrigger className={`w-full h-10 ${getError('dryInjectionPackType') ? 'border-destructive' : ''}`}>
          <SelectValue placeholder="Select Pack Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Water (WFI)">Water (WFI)</SelectItem>
          <SelectItem value="Without Water">Without Water</SelectItem>
        </SelectContent>
      </Select>
      {getError('dryInjectionPackType') && (
        <p className="text-xs text-destructive">{getError('dryInjectionPackType')}</p>
      )}
    </div>

    {/* Tray Pack */}
    <div className="space-y-2">
      <Label className="text-xs font-medium text-white uppercase tracking-wider">
        Tray Pack <span className="text-red-500">*</span>
      </Label>
      <Select
        value={item.dryInjectionTrayPack || ''}
        onValueChange={(value) => onChange('dryInjectionTrayPack', value)}
      >
        <SelectTrigger className={`w-full h-10 ${getError('dryInjectionTrayPack') ? 'border-destructive' : ''}`}>
          <SelectValue placeholder="Select Tray Pack" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Required">Required</SelectItem>
          <SelectItem value="Not Required">Not Required</SelectItem>
        </SelectContent>
      </Select>
      {getError('dryInjectionTrayPack') && (
        <p className="text-xs text-destructive">{getError('dryInjectionTrayPack')}</p>
      )}
    </div>
  </>
);

/**
 * Liquid Injection Fields
 */
export const LiquidInjectionFields = ({ item, onChange, getError }) => (
  <>
    {/* Box Packing */}
    <div className="space-y-2">
      <Label className="text-xs font-medium text-white uppercase tracking-wider">
        Box Packing <span className="text-red-500">*</span>
      </Label>
      <Input
        value={item.injectionBoxPacking || ''}
        onChange={(e) => onChange('injectionBoxPacking', e.target.value)}
        placeholder="Enter box packing"
        className={`h-10 ${getError('injectionBoxPacking') ? 'border-destructive' : ''}`}
      />
      {getError('injectionBoxPacking') && (
        <p className="text-xs text-destructive">{getError('injectionBoxPacking')}</p>
      )}
    </div>

    {/* Injection Packing */}
    <div className="space-y-2">
      <Label className="text-xs font-medium text-white uppercase tracking-wider">
        Injection Packing <span className="text-red-500">*</span>
      </Label>
      <Select
        value={item.injectionPacking || ''}
        onValueChange={(value) => onChange('injectionPacking', value)}
      >
        <SelectTrigger className={`w-full h-10 ${getError('injectionPacking') ? 'border-destructive' : ''}`}>
          <SelectValue placeholder="Select Injection Packing" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Tray Packing">Tray Packing</SelectItem>
          <SelectItem value="Blister Packing">Blister Packing</SelectItem>
          <SelectItem value="Custom">Custom</SelectItem>
        </SelectContent>
      </Select>
      {item.injectionPacking === 'Custom' && (
        <Input
          value={item.customInjectionPacking || ''}
          onChange={(e) => onChange('customInjectionPacking', e.target.value)}
          placeholder="Enter custom injection packing"
          className="h-10 mt-2"
        />
      )}
    </div>

    {/* PVC Type - Only for Blister Packing */}
    {item.injectionPacking === 'Blister Packing' && (
      <div className="space-y-2">
        <Label className="text-xs font-medium text-white uppercase tracking-wider">
          PVC Type
        </Label>
        <Input
          value={item.injectionPvcType || ''}
          onChange={(e) => onChange('injectionPvcType', e.target.value)}
          placeholder="Enter PVC type (optional)"
          className="h-10"
        />
      </div>
    )}
  </>
);

/**
 * Dry Syrup Water Type Field
 */
export const DrySyrupWaterTypeField = ({ value, onChange, error }) => (
  <div className="space-y-2">
    <Label className="text-xs font-medium text-white uppercase tracking-wider">
      Water Type <span className="text-red-500">*</span>
    </Label>
    <Select value={value || ''} onValueChange={onChange}>
      <SelectTrigger className={`w-full h-10 ${error ? 'border-destructive' : ''}`}>
        <SelectValue placeholder="Select Water Type" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Water">Water</SelectItem>
        <SelectItem value="Without Water">Without Water</SelectItem>
      </SelectContent>
    </Select>
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>
);

export default {
  SoftGelatinColorField,
  InjectionTypeField,
  DryInjectionFields,
  LiquidInjectionFields,
  DrySyrupWaterTypeField,
};
