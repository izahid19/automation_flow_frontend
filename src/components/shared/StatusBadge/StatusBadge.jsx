/**
 * StatusBadge Component
 * Displays status badges with consistent styling across the application
 */

import { Badge } from '@/components/ui/badge';
import { getQuoteStatusConfig, getPOStatusConfig } from '@/utils/statusHelpers';

/**
 * StatusBadge - Reusable status badge component
 * @param {object} props - Component props
 * @param {string} props.status - Status key
 * @param {string} props.type - Type of status ('quote' or 'po')
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} Status badge
 */
export const StatusBadge = ({ status, type = 'quote', className = '' }) => {
  if (!status) return null;

  const config = type === 'po' 
    ? getPOStatusConfig(status) 
    : getQuoteStatusConfig(status);

  return (
    <Badge 
      variant={config.variant} 
      className={`${config.className} ${className}`}
    >
      {config.label}
    </Badge>
  );
};

export default StatusBadge;
