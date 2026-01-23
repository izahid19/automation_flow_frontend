/**
 * DateFilter Component
 * Provides date range filtering with preset and custom options
 */

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, X } from 'lucide-react';

/**
 * Get date range for filter type
 * @param {string} filterType - Filter type
 * @param {string} customDays - Custom days value
 * @returns {object|null} Date range object or null
 */
const getDateRange = (filterType, customDays) => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  switch (filterType) {
    case 'last_day':
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const yesterdayEnd = new Date(yesterday);
      yesterdayEnd.setHours(23, 59, 59, 999);
      return { from: yesterday.toISOString().split('T')[0], to: yesterdayEnd.toISOString().split('T')[0] };
    
    case 'last_week':
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);
      return { from: weekAgo.toISOString().split('T')[0], to: today.toISOString().split('T')[0] };
    
    case 'last_month':
      const currentMonth = new Date(today);
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);
      
      const lastMonthStart = new Date(currentMonth);
      lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
      
      const lastMonthEnd = new Date(currentMonth);
      lastMonthEnd.setDate(0);
      lastMonthEnd.setHours(23, 59, 59, 999);
      
      return { 
        from: lastMonthStart.toISOString().split('T')[0], 
        to: lastMonthEnd.toISOString().split('T')[0] 
      };
    
    case 'custom':
      if (customDays && parseInt(customDays) > 0) {
        const daysAgo = new Date(today);
        daysAgo.setDate(daysAgo.getDate() - parseInt(customDays));
        daysAgo.setHours(0, 0, 0, 0);
        return { from: daysAgo.toISOString().split('T')[0], to: today.toISOString().split('T')[0] };
      }
      return null;
    
    default:
      return null;
  }
};

/**
 * Get date filter label
 * @param {string} filterType - Filter type
 * @param {string} customDays - Custom days value
 * @returns {string} Filter label
 */
const getDateFilterLabel = (filterType, customDays) => {
  const today = new Date();
  
  switch (filterType) {
    case 'last_day':
      return 'Last Day';
    
    case 'last_week':
      return 'Last 7 Days';
    
    case 'last_month':
      const currentMonth = new Date(today);
      currentMonth.setDate(1);
      const lastMonthStart = new Date(currentMonth);
      lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
      const monthName = lastMonthStart.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
      return monthName;
    
    case 'custom':
      if (customDays && parseInt(customDays) > 0) {
        return `Last ${customDays} Days`;
      }
      return 'Custom Days';
    
    default:
      return 'All Dates';
  }
};

/**
 * DateFilter - Date range filter component
 * @param {object} props - Component props
 * @param {string} props.selectedFilter - Current filter value
 * @param {string} props.customDays - Custom days value
 * @param {function} props.onFilterChange - Change handler (filter, days)
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} Date filter component
 */
export const DateFilter = ({
  selectedFilter = 'all',
  customDays = '',
  onFilterChange,
  className = '',
}) => {
  const handleFilterChange = (newFilter) => {
    if (onFilterChange) {
      onFilterChange(newFilter, customDays);
    }
  };

  const handleCustomDaysChange = (newDays) => {
    if (onFilterChange) {
      onFilterChange(selectedFilter, newDays);
    }
  };

  return (
    <div className={className}>
      {/* Custom Days Input */}
      {selectedFilter === 'custom' && (
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <Label className="text-sm">Last</Label>
          <Input
            type="text"
            value={customDays}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              handleCustomDaysChange(val);
            }}
            placeholder="e.g. 45"
            className="w-20"
          />
          <Label className="text-sm">Days</Label>
        </div>
      )}

      {/* Active Filter Display */}
      {selectedFilter !== 'all' && (selectedFilter !== 'custom' || (selectedFilter === 'custom' && customDays)) && (
        <div className="flex items-center gap-2 my-3">
          <Badge
            variant="outline"
            className="px-3 py-1.5 text-sm bg-green-500 text-white border-green-500 flex items-center gap-2"
          >
            <Calendar className="w-3 h-3" />
            {getDateFilterLabel(selectedFilter, customDays)}
            <button
              onClick={() => {
                handleFilterChange('all');
                if (onFilterChange) {
                  onFilterChange('all', '');
                }
              }}
              className="ml-1 bg-red-500 hover:bg-red-600 rounded-full p-0.5"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </Badge>
        </div>
      )}
    </div>
  );
};

/**
 * DateFilterChip - Active date filter chip/badge
 * @param {object} props - Component props
 * @param {string} props.filterType - Filter type
 * @param {string} props.customDays - Custom days value
 * @param {function} props.onClear - Clear handler
 * @returns {JSX.Element|null} Filter chip or null
 */
export const DateFilterChip = ({ filterType, customDays, onClear }) => {
  if (filterType === 'all' || (filterType === 'custom' && !customDays)) {
    return null;
  }

  const label = getDateFilterLabel(filterType, customDays);

  return (
    <Badge
      variant="outline"
      className="px-3 py-1.5 text-sm bg-green-500 text-white border-green-500 flex items-center gap-2"
    >
      <Calendar className="w-3 h-3" />
      {label}
      <button
        onClick={onClear}
        className="ml-1 bg-red-500 hover:bg-red-600 rounded-full p-0.5"
      >
        <X className="w-3 h-3 text-white" />
      </button>
    </Badge>
  );
};

/**
 * Hook for managing date filter state
 * @param {string} initialFilter - Initial filter value
 * @param {string} initialCustomDays - Initial custom days
 * @returns {object} Date filter state and handlers
 */
export const useDateFilter = (initialFilter = 'all', initialCustomDays = '') => {
  const [dateFilter, setDateFilter] = useState(initialFilter);
  const [customDays, setCustomDays] = useState(initialCustomDays);

  const clearFilter = () => {
    setDateFilter('all');
    setCustomDays('');
  };

  const getDateRangeParams = () => {
    if (dateFilter === 'all') return null;
    
    const range = getDateRange(dateFilter, customDays);
    if (range && range.from) {
      return {
        dateFrom: range.from,
        dateTo: range.to,
      };
    }
    return null;
  };

  const getFilterLabel = () => {
    return getDateFilterLabel(dateFilter, customDays);
  };

  return {
    dateFilter,
    customDays,
    setDateFilter,
    setCustomDays,
    clearFilter,
    getDateRangeParams,
    getFilterLabel,
  };
};

export default DateFilter;
