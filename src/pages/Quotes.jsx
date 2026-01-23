import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { quoteAPI } from '@/services/api';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { StatusBadge, DateFilter } from '@/components/shared';
import { QuoteFilters } from '@/components/quote';
import { 
  Plus, 
  Search, 
  Loader2,
  Eye,
  Trash2,
  Download,
  Edit,
  Copy,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate, formatTime } from '@/utils/formatters';

// Simple cache for quotes data
const quotesCache = new Map();
const CACHE_TTL = 30000; // 30 seconds

const Quotes = () => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(['all']);
  const [dateFilter, setDateFilter] = useState('all');
  const [customDays, setCustomDays] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, quoteNumber: '' });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { isAdmin, isManager, isSalesExecutive, isAccountant } = useAuth();
  const abortControllerRef = useRef(null);

  // Debounce search to avoid excessive API calls
  const debouncedSearch = useDebounce(search, 400);

  // Calculate date range for filter type
  const getDateRange = useCallback((filterType) => {
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
  }, [customDays]);

  // Generate cache key for current query
  const getCacheKey = useCallback((params) => {
    return `quotes_${JSON.stringify(params)}`;
  }, []);

  const fetchQuotes = useCallback(async (forceRefresh = false) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const params = {
      page: pagination.page,
      limit: 20,
    };

    if (debouncedSearch) params.search = debouncedSearch;
    
    if (statusFilter.length > 0 && !statusFilter.includes('all')) {
      params.status = statusFilter.join(',');
    }
    
    // Add date filtering
    if (dateFilter && dateFilter !== 'all') {
      const dateRange = getDateRange(dateFilter);
      if (dateRange && dateRange.from) {
        params.dateFrom = dateRange.from;
        params.dateTo = dateRange.to;
      }
    }

    const cacheKey = getCacheKey(params);

    // Check cache if not forcing refresh
    if (!forceRefresh && quotesCache.has(cacheKey)) {
      const cached = quotesCache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        setQuotes(cached.data);
        setPagination(cached.pagination);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    try {
      const response = await quoteAPI.getAll(params, { signal: abortControllerRef.current.signal });
      const data = response.data.data || [];
      const paginationData = response.data.pagination || { page: 1, pages: 1, total: 0 };

      setQuotes(data);
      setPagination(paginationData);

      // Cache the results
      quotesCache.set(cacheKey, {
        data,
        pagination: paginationData,
        timestamp: Date.now(),
      });
    } catch (error) {
      if (error.name !== 'CanceledError' && error.name !== 'AbortError') {
        toast.error('Failed to load quotes');
      }
    } finally {
      setLoading(false);
    }
  }, [pagination.page, debouncedSearch, statusFilter, dateFilter, customDays, getCacheKey, getDateRange]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  // Real-time socket updates
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      quotesCache.clear();
      fetchQuotes(true);
    };

    socket.on('quote:created', handleUpdate);
    socket.on('quote:updated', handleUpdate);
    socket.on('quote:deleted', handleUpdate);
    socket.on('quote:approved', handleUpdate);
    socket.on('quote:rejected', handleUpdate);

    return () => {
      socket.off('quote:created', handleUpdate);
      socket.off('quote:updated', handleUpdate);
      socket.off('quote:deleted', handleUpdate);
      socket.off('quote:approved', handleUpdate);
      socket.off('quote:rejected', handleUpdate);
    };
  }, [socket, fetchQuotes]);

  const handleDelete = async () => {
    if (!deleteConfirm.id) return;

    setDeleteLoading(true);
    try {
      await quoteAPI.delete(deleteConfirm.id);
      toast.success('Quote deleted successfully');
      quotesCache.clear();
      fetchQuotes(true);
      setDeleteConfirm({ open: false, id: null, quoteNumber: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete quote');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDownloadPDF = async (id, quoteNumber) => {
    try {
      const response = await quoteAPI.downloadPDF(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${quoteNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('PDF downloaded successfully');
    } catch (error) {
      toast.error('Failed to download PDF');
    }
  };

  const handleStatusFilterChange = (newFilters) => {
    setStatusFilter(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDateFilterChange = (filter, days) => {
    setDateFilter(filter);
    setCustomDays(days);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const canDelete = (quote) => {
    return (isAdmin || isSalesExecutive) && 
           (quote.status === 'draft' || quote.status === 'manager_rejected' || quote.status === 'quote_rejected');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Quotes</h1>
          <p className="text-muted-foreground">Manage and track all quotations</p>
        </div>
        {!isAccountant && (
          <Button onClick={() => navigate('/quotes/new')}>
            <Plus size={18} className="mr-2" />
            Create Quote
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            {/* Search and Date Filter Row */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by client name, email, or quote number..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="pl-10"
                />
              </div>
              <Select value={dateFilter} onValueChange={(value) => handleDateFilterChange(value, customDays)}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Dates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="last_day">Last Day</SelectItem>
                  <SelectItem value="last_week">Last 7 Days</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="custom">Custom Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Filter Component (for custom days and badge) */}
            <DateFilter
              selectedFilter={dateFilter}
              customDays={customDays}
              onFilterChange={handleDateFilterChange}
            />

            {/* Status Filters */}
            <QuoteFilters
              selectedStatuses={statusFilter}
              onStatusChange={handleStatusFilterChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quotes Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : quotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <p className="text-lg font-medium">No quotes found</p>
              <p className="text-sm">Try adjusting your filters or create a new quote</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quote Number</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Quote Item Names</TableHead>
                      <TableHead>Order Type</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>MRP</TableHead>
                      <TableHead>Our Rate</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Quote Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotes.map((quote) => (
                      <TableRow key={quote._id}>
                        <TableCell>
                          <Link
                            to={`/quotes/${quote._id}`}
                            className="text-primary hover:underline font-medium"
                          >
                            {quote.quoteNumber}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{quote.clientName}</p>
                            <p className="text-xs text-muted-foreground">{quote.clientEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {quote.items?.length > 0 ? (
                              quote.items.map((item, index) => (
                                <span key={index} className="font-medium text-sm">
                                  {quote.items.length > 1 ? `${index + 1}. ` : ''}{item.brandName || item.name || 'N/A'}
                                </span>
                              ))
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {quote.items?.length > 0 ? (
                               quote.items.map((item, index) => (
                                 <span 
                                   key={index} 
                                   className={`badge badge-outline text-xs px-2 py-0.5 rounded-full border w-fit ${
                                     item.orderType === 'Repeat'
                                       ? 'bg-red-500/10 text-red-500 border-red-500'
                                       : 'bg-green-500/10 text-green-500 border-green-500'
                                   }`}
                                 >
                                   {item.orderType || 'New'}
                                 </span>
                               ))
                            ) : '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {quote.items?.length > 0 ? (
                               quote.items.map((item, index) => (
                                 <span key={index} className="text-sm">
                                   {quote.items.length > 1 ? `${index + 1}. ` : ''}{item.quantity || '-'}
                                 </span>
                               ))
                            ) : '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {quote.items?.length > 0 ? (
                               quote.items.map((item, index) => (
                                 <span key={index} className="text-sm">
                                   {quote.items.length > 1 ? `${index + 1}. ` : ''}₹{item.mrp || '0'}
                                 </span>
                               ))
                            ) : '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {quote.items?.length > 0 ? (
                               quote.items.map((item, index) => (
                                 <span key={index} className="text-sm">
                                   {quote.items.length > 1 ? `${index + 1}. ` : ''}₹{item.rate || '0'}
                                 </span>
                               ))
                            ) : '-'}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">{formatCurrency(quote.totalAmount)}</TableCell>
                        <TableCell>
                          <StatusBadge status={quote.status} type="quote" />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-muted-foreground">{formatDate(quote.createdAt)}</span>
                            <span className="text-xs text-muted-foreground">{formatTime(quote.createdAt)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/quotes/${quote._id}`)}
                            >
                              <Eye size={16} />
                            </Button>
                            {quote.status !== 'completed_quote' && (
                              (quote.status === 'draft' || quote.status === 'quote_rejected' || quote.status === 'manager_rejected') ||
                              isAdmin || 
                              isManager
                            ) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate(`/quotes/${quote._id}/edit`)}
                              >
                                <Edit size={16} />
                              </Button>
                            )}
                            {(isAdmin || isManager || isSalesExecutive) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate(`/quotes/new?repeat=${quote._id}`)}
                                title="Repeat Order"
                              >
                                <Copy size={16} />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDownloadPDF(quote._id, quote.quoteNumber)}
                            >
                              <Download size={16} />
                            </Button>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteConfirm({ open: true, id: quote._id, quoteNumber: quote.quoteNumber })}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 size={16} />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2 p-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: null, quoteNumber: '' })}
        onConfirm={handleDelete}
        title="Delete Quote"
        message={`Are you sure you want to delete quote ${deleteConfirm.quoteNumber}? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        loading={deleteLoading}
      />
    </div>
  );
};

export default Quotes;
