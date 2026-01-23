import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { quoteAPI, authAPI } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge, DateFilter, Pagination } from '@/components/shared';
import { QuoteFilters } from '@/components/quote';
import { 
  Search, 
  Loader2,
  TrendingUp,
  Download,
  Filter,
  Check,
  User,
  Eye,
  Clock,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate, formatTime } from '@/utils/formatters';

// Simple cache for reports data
const reportsCache = new Map();
const CACHE_TTL = 30000; // 30 seconds

const Reports = () => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(['all']);
  const [dateFilter, setDateFilter] = useState('all');
  const [customDays, setCustomDays] = useState('');
  const [salesPersons, setSalesPersons] = useState([]);
  const [selectedSalesPerson, setSelectedSalesPerson] = useState('all');
  const [totalSales, setTotalSales] = useState(0);
  const [statusStats, setStatusStats] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const navigate = useNavigate();
  const { isAdmin, loading: authLoading } = useAuth();
  const abortControllerRef = useRef(null);

  // Generate cache key based on filters
  const getCacheKey = useCallback((params) => {
    return `reports_${JSON.stringify(params)}`;
  }, []);

  const debouncedSearch = useDebounce(search, 400);

  const fetchSalesPersons = useCallback(async () => {
    try {
      const response = await authAPI.getUsers();
      const users = response.data.data || [];
      // Filter for sales executives or just show everyone who is not admin?
      // Usually admins want to see reports for anyone who creates quotes.
      setSalesPersons(users.filter(u => u.role === 'sales_executive'));
    } catch (error) {
      console.error('Failed to fetch sales persons', error);
    }
  }, []);

  const getDateRange = useCallback((filterType) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    switch (filterType) {
      case 'last_day':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        return { from: yesterday.toISOString().split('T')[0], to: yesterday.toISOString().split('T')[0] };
      case 'last_week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        weekAgo.setHours(0, 0, 0, 0);
        return { from: weekAgo.toISOString().split('T')[0], to: today.toISOString().split('T')[0] };
      case 'last_month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        monthAgo.setHours(0, 0, 0, 0);
        return { from: monthAgo.toISOString().split('T')[0], to: today.toISOString().split('T')[0] };
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

  const fetchReports = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const params = {
      page: pagination.page,
      limit: 10,
    };

    if (debouncedSearch) params.search = debouncedSearch;
    if (statusFilter.length > 0 && !statusFilter.includes('all')) {
      params.status = statusFilter.join(',');
    }
    if (selectedSalesPerson && selectedSalesPerson !== 'all') {
      params.createdBy = selectedSalesPerson;
    } else if (selectedSalesPerson === 'all' && salesPersons.length > 0) {
      params.createdBy = salesPersons.map(p => p._id).join(',');
    }
    
    if (dateFilter && dateFilter !== 'all') {
      const dateRange = getDateRange(dateFilter);
      if (dateRange && dateRange.from) {
        params.dateFrom = dateRange.from;
        params.dateTo = dateRange.to;
      }
    }

    const cacheKey = getCacheKey(params);

    // Check cache
    if (reportsCache.has(cacheKey)) {
      const cached = reportsCache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        setQuotes(cached.data);
        setPagination(cached.pagination);
        setTotalSales(cached.totalSales);
        setStatusStats(cached.statusStats);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    try {
      const response = await quoteAPI.getAll(params, { signal: abortControllerRef.current.signal });
      const data = response.data.data || [];
      const paginationData = response.data.pagination || { page: 1, pages: 1, total: 0 };
      const totalAmount = response.data.totalFilteredAmount || 0;
      const stats = response.data.statusStats || [];

      setQuotes(data);
      setPagination(paginationData);
      setTotalSales(totalAmount);
      setStatusStats(stats);

      // Save to cache
      reportsCache.set(cacheKey, {
        data,
        pagination: paginationData,
        totalSales: totalAmount,
        statusStats: stats,
        timestamp: Date.now(),
      });
    } catch (error) {
      if (error.name !== 'CanceledError' && error.name !== 'AbortError') {
        toast.error('Failed to load reports');
      }
    } finally {
      setLoading(false);
    }
  }, [pagination.page, debouncedSearch, statusFilter, selectedSalesPerson, salesPersons, dateFilter, getDateRange, getCacheKey]);

  // Initial fetch: Load sales persons once
  useEffect(() => {
    if (isAdmin) {
      fetchSalesPersons();
    }
  }, [isAdmin, fetchSalesPersons]);

  // Data fetch: Load reports when filters or sales person list changes
  useEffect(() => {
    if (isAdmin) {
      fetchReports();
    }
  }, [isAdmin, fetchReports]);

  // Memoized Summary Calculations
  const summaryStats = useMemo(() => {
    const pendingCount = statusStats
      .filter(s => ['pending_manager_approval', 'pending_se_approval', 'pending_md_approval'].includes(s.status))
      .reduce((sum, s) => sum + s.count, 0);

    const completedCount = statusStats
      .filter(s => ['completed_quote', 'po_created', 'ready_for_po', 'manager_approved', 'design_approved', 'pending_accountant', 'pending_designer', 'design_pending'].includes(s.status))
      .reduce((sum, s) => sum + s.count, 0);

    return {
      pending: pendingCount,
      completed: completedCount
    };
  }, [statusStats]);

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

  if (authLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6 flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
          <X size={40} />
        </div>
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground text-center max-w-md">Only administrators can access the report section. Please contact your administrator if you believe this is an error.</p>
        <Button onClick={() => navigate('/dashboard')} variant="outline">Go to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Sales Report</h1>
          <p className="text-muted-foreground">Analyze sales performance and quotes</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-linear-to-br from-primary/10 to-transparent border-primary/20">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Sales</p>
              {loading ? (
                <Skeleton className="h-8 w-28 mt-1" />
              ) : (
                <h2 className="text-2xl font-bold">{formatCurrency(totalSales)}</h2>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Filter size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Quotes</p>
              {loading ? (
                <Skeleton className="h-8 w-20 mt-1" />
              ) : (
                <h2 className="text-2xl font-bold">{pagination.total}</h2>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Approval</p>
              {loading ? (
                <Skeleton className="h-8 w-16 mt-1" />
              ) : (
                <h2 className="text-2xl font-bold">{summaryStats.pending}</h2>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center">
              <Check size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completed Quotes</p>
              {loading ? (
                <Skeleton className="h-8 w-16 mt-1" />
              ) : (
                <h2 className="text-2xl font-bold">{summaryStats.completed}</h2>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 space-y-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search client, quote #, etc..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="pl-10"
                />
              </div>
              <Select value={dateFilter} onValueChange={(val) => {
                setDateFilter(val);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}>
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

            <DateFilter
              selectedFilter={dateFilter}
              customDays={customDays}
              onFilterChange={(f, d) => {
                setDateFilter(f);
                setCustomDays(d);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
            />

            {/* Sales Person Filter Chips */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider ml-1">
                <User size={14} />
                <span>Sales Person</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className={`cursor-pointer px-4 py-1.5 text-sm transition-all flex items-center gap-2 ${
                    selectedSalesPerson === 'all'
                      ? "bg-blue-400 text-white border-blue-400 hover:bg-blue-500"
                      : "text-white border-white/50 hover:bg-white/10"
                  }`}
                  onClick={() => {
                    setSelectedSalesPerson('all');
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                >
                  {selectedSalesPerson === 'all' && <Check size={14} />}
                  All Persons
                </Badge>
                {salesPersons.map((person) => (
                  <Badge
                    key={person._id}
                    variant="outline"
                    className={`cursor-pointer px-4 py-1.5 text-sm transition-all flex items-center gap-2 ${
                      selectedSalesPerson === person._id
                        ? "bg-blue-400 text-white border-blue-400 hover:bg-blue-500"
                        : "text-white border-white/50 hover:bg-white/10"
                    }`}
                    onClick={() => {
                      setSelectedSalesPerson(person._id);
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                  >
                    {selectedSalesPerson === person._id && <Check size={14} />}
                    {person.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Status Filters */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider ml-1">
                <Filter size={14} />
                <span>Quote Status</span>
              </div>
              <QuoteFilters
                selectedStatuses={statusFilter}
                onStatusChange={(filters) => {
                  setStatusFilter(filters);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Quote Number</TableHead>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Sales Person</TableHead>
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
                  {[...Array(8)].map((_, i) => (
                    <TableRow key={i} className="hover:bg-transparent">
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell>
                        <div className="space-y-1.5 py-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-40" />
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-6 w-28 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24 font-semibold" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-28 rounded-full" /></TableCell>
                      <TableCell>
                        <div className="space-y-1 py-1">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Skeleton className="h-9 w-9 rounded-md" />
                          <Skeleton className="h-9 w-9 rounded-md" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : quotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <p className="text-lg font-medium">No records found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quote Number</TableHead>
                      <TableHead>Client Name</TableHead>
                      <TableHead>Sales Person</TableHead>
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
                          <Badge variant="outline" className="bg-muted text-foreground">
                            {quote.createdByName || 'N/A'}
                          </Badge>
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
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDownloadPDF(quote._id, quote.quoteNumber)}
                            >
                              <Download size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.pages}
                totalItems={pagination.total}
                onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
                itemsPerPage={10}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
