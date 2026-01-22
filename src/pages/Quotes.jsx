import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { quoteAPI } from '@/services/api';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { 
  Plus, 
  Search, 
  FileText,
  Loader2,
  Eye,
  Trash2,
  Download,
  Edit,
  Calendar,
  Check,
  Copy,
  X
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import toast from 'react-hot-toast';

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
  const { isAdmin, isManager, isSalesExecutive } = useAuth();
  const abortControllerRef = useRef(null);

  // Debounce search to avoid excessive API calls
  const debouncedSearch = useDebounce(search, 400);

  // Calculate date ranges for filters
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

  const getDateFilterLabel = (filterType) => {
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

    const params = { page: pagination.page, limit: 30 };
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

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = quotesCache.get(cacheKey);
      if (cached && Date.now() < cached.expiry) {
        setQuotes(cached.data);
        setPagination(cached.pagination);
        setLoading(false);
        return;
      }
    }

    try {
      setLoading(true);
      const response = await quoteAPI.getAll(params);
      
      // Cache the response
      quotesCache.set(cacheKey, {
        data: response.data.data,
        pagination: response.data.pagination,
        expiry: Date.now() + CACHE_TTL
      });

      setQuotes(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      if (error.name !== 'AbortError' && error.code !== 'ERR_CANCELED') {
        toast.error('Failed to load quotes');
      }
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, dateFilter, customDays, pagination.page, getDateRange, getCacheKey]);

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

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Listen for real-time quote updates
  useEffect(() => {
    if (!socket) return;

    const handleQuoteUpdate = () => {
      // Clear cache and refresh quotes list
      quotesCache.clear();
      fetchQuotes(true);
    };

    // All quote-related events
    socket.on('quote:created', handleQuoteUpdate);
    socket.on('quote:submitted', handleQuoteUpdate);
    socket.on('quote:approved', handleQuoteUpdate);
    socket.on('quote:rejected', handleQuoteUpdate);
    socket.on('quote:design-updated', handleQuoteUpdate);
    socket.on('quote:client-approved', handleQuoteUpdate);
    socket.on('quote:client-order-updated', handleQuoteUpdate);
    socket.on('quote:advance-payment-received', handleQuoteUpdate);
    socket.on('quote:completed', handleQuoteUpdate);
    socket.on('quote:client-design-approved', handleQuoteUpdate);

    return () => {
      socket.off('quote:created', handleQuoteUpdate);
      socket.off('quote:submitted', handleQuoteUpdate);
      socket.off('quote:approved', handleQuoteUpdate);
      socket.off('quote:rejected', handleQuoteUpdate);
      socket.off('quote:design-updated', handleQuoteUpdate);
      socket.off('quote:client-approved', handleQuoteUpdate);
      socket.off('quote:client-order-updated', handleQuoteUpdate);
      socket.off('quote:advance-payment-received', handleQuoteUpdate);
      socket.off('quote:completed', handleQuoteUpdate);
      socket.off('quote:client-design-approved', handleQuoteUpdate);
    };
  }, [socket, fetchQuotes]);

  const openDeleteConfirm = (quote) => {
    setDeleteConfirm({ open: true, id: quote._id, quoteNumber: quote.quoteNumber });
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await quoteAPI.delete(deleteConfirm.id);
      toast.success('Quote deleted');
      setDeleteConfirm({ open: false, id: null, quoteNumber: '' });
      // Clear cache and refetch
      quotesCache.clear();
      fetchQuotes(true);
    } catch (error) {
      toast.error('Failed to delete quote');
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
    } catch (error) {
      toast.error('Failed to download PDF');
    }
  };

  // Memoized status map to avoid recreation on every render
  const statusMap = useMemo(() => ({
    draft: { label: 'Draft', variant: 'secondary', className: '' },
    quote_submitted: { label: 'Quote Submitted', variant: 'outline', className: '' },
    pending_manager_approval: { label: 'Pending Manager Approval', variant: 'outline', className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500' },
    manager_approved: { label: 'Manager Approved', variant: 'default', className: 'bg-blue-500 text-white border-blue-500' },
    manager_rejected: { label: 'Manager Rejected', variant: 'destructive', className: 'bg-red-500 text-white border-red-500' },
    pending_accountant: { label: 'Pending Accountant', variant: 'outline', className: 'bg-orange-500/10 text-orange-500 border-orange-500' },
    pending_designer: { label: 'Pending Designer', variant: 'outline', className: 'bg-purple-500/10 text-purple-500 border-purple-500' },
    completed_quote: { label: 'Quote Completed', variant: 'default', className: 'bg-green-500 text-white border-green-500' },
  }), []);

  const getStatusBadge = useCallback((status) => {
    const s = statusMap[status] || { label: status, variant: 'secondary', className: '' };
    return <Badge variant={s.variant} className={s.className}>{s.label}</Badge>;
  }, [statusMap]);

  // Memoized quotes with computed values for table rendering
  const processedQuotes = useMemo(() => {
    return quotes.map(quote => ({
      ...quote,
      formattedDate: new Date(quote.createdAt).toLocaleDateString('en-GB'),
      formattedTime: new Date(quote.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      formattedTotal: quote.totalAmount?.toFixed(2) || '0.00'
    }));
  }, [quotes]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quotes</h1>
          <p className="text-muted-foreground">Manage all your quotations</p>
        </div>
        {(isAdmin || isManager || isSalesExecutive) && (
          <Button asChild>
            <Link to="/quotes/new">
              <Plus size={20} className="mr-2" />
              New Quote
            </Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by client name, email, or quote number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={dateFilter} onValueChange={setDateFilter}>
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
            
            {/* Custom Days Input */}
            {dateFilter === 'custom' && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <Label className="text-sm">Last</Label>
                <Input
                  type="text"
                  value={customDays}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setCustomDays(val);
                  }}
                  placeholder="e.g. 45"
                  className="w-20"
                />
                <Label className="text-sm">Days</Label>
              </div>
            )}
            
            {/* Active Date Filter Chip */}
            {dateFilter !== 'all' && (dateFilter !== 'custom' || (customDays && parseInt(customDays) > 0)) && (
              <div className="flex items-center gap-2 my-3">
                <Badge
                  variant="outline"
                  className="px-3 py-1.5 text-sm bg-green-500 text-white border-green-500 flex items-center gap-2"
                >
                  <Calendar className="w-3 h-3" />
                  {getDateFilterLabel(dateFilter)}
                  <button
                    onClick={() => {
                      setDateFilter('all');
                      setCustomDays('');
                    }}
                    className="ml-1 bg-red-500 hover:bg-red-600 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </Badge>
              </div>
            )}
            
            {/* Status Filter Chips */}
            <div className="flex flex-wrap gap-2 pt-2">
              {[
                { value: 'all', label: 'All Status' },
                { value: 'draft', label: 'Draft' },
                { value: 'quote_submitted', label: 'Quote Submitted' },
                { value: 'pending_manager_approval', label: 'Pending Manager Approval' },
                { value: 'manager_approved', label: 'Manager Approved' },
                { value: 'manager_rejected', label: 'Manager Rejected' },
                { value: 'pending_accountant', label: 'Pending Accountant' },
                { value: 'pending_designer', label: 'Pending Designer' },
                { value: 'completed_quote', label: 'Quote Completed' },
              ].map((status) => (
                <Badge
                  key={status.value}
                  variant="outline"
                  className={`cursor-pointer px-4 py-1.5 text-sm transition-all flex items-center ${
                    statusFilter.includes(status.value)
                      ? "bg-blue-400 text-white border-blue-400 hover:bg-blue-500" 
                      : "text-white border-white/50 hover:bg-white/10"
                  }`}
                  onClick={() => toggleStatus(status.value)}
                >
                  {statusFilter.includes(status.value) && <span className="w-5 h-5 mr-1.5 rounded-full bg-green-500 flex items-center justify-center"><Check className="w-3.5 h-3.5 text-white stroke-[3]" /></span>}
                  {status.label}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quotes List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : quotes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">No quotes found</p>
              <Button asChild>
                <Link to="/quotes/new">Create Quote</Link>
              </Button>
            </div>
          ) : (
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
                    <TableCell className="font-semibold">₹{quote.totalAmount?.toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(quote.status)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-muted-foreground">{new Date(quote.createdAt).toLocaleDateString('en-GB')}</span>
                        <span className="text-xs text-muted-foreground">{new Date(quote.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
                        {(quote.status === 'draft' || quote.status === 'rejected' || isAdmin) && (
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
                            onClick={() => openDeleteConfirm(quote)}
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
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
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
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.pages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: null, quoteNumber: '' })}
        onConfirm={handleDelete}
        title="Delete Quote?"
        message={`Are you sure you want to delete quote "${deleteConfirm.quoteNumber}"? This action cannot be undone.`}
        loading={deleteLoading}
      />
    </div>
  );
};

export default Quotes;
