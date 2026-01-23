/**
 * NumericInput Component
 * Input field optimized for numeric values with built-in validation
 */

import { Input } from '@/components/ui/input';
import { handleNumericKeyDown } from '@/utils/formHelpers';
import { parseNumericInput } from '@/utils/formatters';

/**
 * NumericInput - Reusable numeric input component
 * @param {object} props - Component props
 * @param {string|number} props.value - Current value
 * @param {function} props.onChange - Change handler
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.disabled - Disabled state
 * @param {string} props.id - Input ID
 * @param {string} props.suffix - Text to display after input (e.g., "Units")
 * @param {object} props.inputProps - Additional input props
 * @returns {JSX.Element} Numeric input field
 */
export const NumericInput = ({
  value,
  onChange,
  placeholder = '0',
  className = '',
  disabled = false,
  id,
  suffix,
  ...inputProps
}) => {
  const handleChange = (e) => {
    const newValue = e.target.value;
    
    // Validate numeric input
    const parsed = parseNumericInput(newValue);
    if (parsed !== null) {
      onChange(newValue);
    }
  };

  return (
    <div className="relative">
      <Input
        id={id}
        type="text"
        inputMode="decimal"
        value={value}
        onChange={handleChange}
        onKeyDown={handleNumericKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        {...inputProps}
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
  );
};

export default NumericInput;
