/**
 * ReadOnlyField Component
 * Displays a label and read-only value in a consistent format
 */

import { Label } from '@/components/ui/label';

/**
 * ReadOnlyField - Display-only field component
 * @param {object} props - Component props
 * @param {string} props.label - Field label
 * @param {string|number|JSX.Element} props.value - Field value
 * @param {boolean} props.required - Show required indicator
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.valueClassName - Additional CSS classes for value
 * @returns {JSX.Element} Read-only field
 */
export const ReadOnlyField = ({
  label,
  value,
  required = false,
  className = '',
  valueClassName = '',
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <div className={`text-sm font-medium px-3 py-2 bg-muted/30 rounded-md border border-border/20 min-h-[38px] flex items-center ${valueClassName}`}>
        {value || '-'}
      </div>
    </div>
  );
};

/**
 * ReadOnlyFieldInline - Inline read-only field (no background)
 * @param {object} props - Component props
 * @param {string} props.label - Field label
 * @param {string|number|JSX.Element} props.value - Field value
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} Inline read-only field
 */
export const ReadOnlyFieldInline = ({ label, value, className = '' }) => {
  return (
    <div className={`space-y-1 ${className}`}>
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </Label>
      <div className="text-sm font-medium">
        {value || '-'}
      </div>
    </div>
  );
};

export default ReadOnlyField;
