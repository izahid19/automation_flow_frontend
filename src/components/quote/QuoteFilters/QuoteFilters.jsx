/**
 * QuoteFilters Component
 * Status filter chips for Quotes list page
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { QUOTE_STATUS_FILTERS } from '@/utils/statusHelpers';

/**
 * StatusFilterChip - Single status filter chip
 * @param {object} props - Component props
 * @param {string} props.value - Status value
 * @param {string} props.label - Status label
 * @param {boolean} props.active - Is active/selected
 * @param {function} props.onClick - Click handler
 * @returns {JSX.Element} Status filter chip
 */
const StatusFilterChip = ({ value, label, active, onClick }) => (
  <Badge
    variant="outline"
    className={`cursor-pointer px-4 py-1.5 text-sm transition-all flex items-center ${
      active
        ? "bg-blue-400 text-white border-blue-400 hover:bg-blue-500" 
        : "text-white border-white/50 hover:bg-white/10"
    }`}
    onClick={() => onClick(value)}
  >
    {active && (
      <span className="w-5 h-5 mr-1.5 rounded-full bg-green-500 flex items-center justify-center">
        <Check className="w-3.5 h-3.5 text-white stroke-3" />
      </span>
    )}
    {label}
  </Badge>
);

/**
 * QuoteFilters - Status filter chips UI
 * @param {object} props - Component props
 * @param {array} props.selectedStatuses - Array of selected status values
 * @param {function} props.onToggle - Toggle handler (value) => void
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} Status filters
 */
export const QuoteFilters = ({
  selectedStatuses = ['all'],
  onStatusChange,
  className = '',
}) => {
  const handleToggle = (value) => {
    if (!onStatusChange) return;

    let newStatuses;
    if (value === 'all') {
      newStatuses = ['all'];
    } else {
      const currentFiltered = selectedStatuses.filter(s => s !== 'all');
      if (currentFiltered.includes(value)) {
        newStatuses = currentFiltered.filter(s => s !== value);
        if (newStatuses.length === 0) newStatuses = ['all'];
      } else {
        newStatuses = [...currentFiltered, value];
      }
    }
    onStatusChange(newStatuses);
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {QUOTE_STATUS_FILTERS.map((status) => (
        <StatusFilterChip
          key={status.value}
          value={status.value}
          label={status.label}
          active={selectedStatuses.includes(status.value)}
          onClick={handleToggle}
        />
      ))}
    </div>
  );
};

/**
 * Hook for managing status filter state
 * @param {array} initialStatuses - Initial selected statuses
 * @returns {object} Status filter state and handlers
 */
export const useStatusFilter = (initialStatuses = ['all']) => {
  const [statusFilter, setStatusFilter] = React.useState(initialStatuses);

  const toggleStatus = (value) => {
    setStatusFilter(prev => {
      if (value === 'all') {
        return ['all'];
      }
      
      const newStatus = prev.filter(s => s !== 'all');
      
      if (newStatus.includes(value)) {
        const filtered = newStatus.filter(s => s !== value);
        return filtered.length === 0 ? ['all'] : filtered;
      } else {
        return [...newStatus, value];
      }
    });
  };

  const clearFilters = () => {
    setStatusFilter(['all']);
  };

  const getFilterParams = () => {
    if (statusFilter.length === 0 || statusFilter.includes('all')) {
      return null;
    }
    return {
      status: statusFilter.join(','),
    };
  };

  return {
    statusFilter,
    toggleStatus,
    clearFilters,
    getFilterParams,
  };
};

export default QuoteFilters;
