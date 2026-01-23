import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderAPI } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { useDebounce } from '@/hooks/useDebounce';
import { invalidateCache } from '@/hooks/useApiCache';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Search,
  Package,
  Loader2,
  Eye,
  Download,
  Plus,
  Check,
  CheckCircle,
  Calendar,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

// Simple cache for order sheet data
const orderSheetCache = new Map();
const CACHE_TTL = 30000; // 30 seconds

const OrderSheet = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(['all']);
  const [dateFilter, setDateFilter] = useState('all');
  const [customDays, setCustomDays] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const navigate = useNavigate();
  const { isAdmin, isManager, isSalesExecutive, isDesigner } = useAuth();
  const { socket } = useSocket();
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
        currentMonth.setDate(1); // First day of current month
        currentMonth.setHours(0, 0, 0, 0);
        
        const lastMonthStart = new Date(currentMonth);
        lastMonthStart.setMonth(lastMonthStart.getMonth() - 1); // First day of previous month
        
        const lastMonthEnd = new Date(currentMonth);
        lastMonthEnd.setDate(0); // Last day of previous month (day 0 of current month)
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
    return `orderSheet_${JSON.stringify(params)}`;
  }, []);

  const fetchOrders = useCallback(async (forceRefresh = false) => {
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
      const cached = orderSheetCache.get(cacheKey);
      if (cached && Date.now() < cached.expiry) {
        setOrders(cached.data);
        setPagination(cached.pagination);
        setLoading(false);
        return;
      }
    }

    try {
      setLoading(true);
      const response = await orderAPI.getSheet(params);
      
      // Cache the response
      orderSheetCache.set(cacheKey, {
        data: response.data.data,
        pagination: response.data.pagination,
        expiry: Date.now() + CACHE_TTL
      });

      setOrders(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      if (error.name !== 'AbortError' && error.code !== 'ERR_CANCELED') {
        toast.error('Failed to load order sheet');
      }
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, pagination.page, statusFilter, dateFilter, customDays, getDateRange, getCacheKey]);

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
    fetchOrders();
  }, [fetchOrders]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Listen for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      // Clear cache and refetch
      orderSheetCache.clear();
      fetchOrders(true);
    };

    // Quote events that affect order sheet
    socket.on('quote:updated', handleUpdate);
    socket.on('quote:design-updated', handleUpdate);
    socket.on('quote:advance-payment-received', handleUpdate);
    socket.on('quote:completed', handleUpdate);
    socket.on('quote:client-design-approved', handleUpdate);

    // PO events
    socket.on('po:created', handleUpdate);
    socket.on('po:status-updated', handleUpdate);
    socket.on('po:payment-verified', handleUpdate);

    return () => {
      socket.off('quote:updated', handleUpdate);
      socket.off('quote:design-updated', handleUpdate);
      socket.off('quote:advance-payment-received', handleUpdate);
      socket.off('quote:completed', handleUpdate);
      socket.off('quote:client-design-approved', handleUpdate);
      socket.off('po:created', handleUpdate);
      socket.off('po:status-updated', handleUpdate);
      socket.off('po:payment-verified', handleUpdate);
    };
  }, [socket, fetchOrders]);

  const handleDownloadPDF = async (id, poNumber) => {
    try {
      const response = await orderAPI.downloadPDF(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${poNumber || 'purchase-order'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Failed to download PDF');
    }
  };

  const handleOpenPOModal = async (row) => {
    // Navigate to PO form with quote data and item index
    navigate(`/purchase-orders/new?quoteId=${row.quote._id}&itemIndex=${row.itemIndex}`);
  };

  // Memoized status maps to avoid recreation on every render
  const quoteStatusMap = useMemo(() => ({
    draft: { label: 'Draft', variant: 'secondary', className: '' },
    pending_accountant: { label: 'Pending Accountant', variant: 'outline', className: '' },
    manager_approved: { label: 'Manager Approved', variant: 'outline', className: '' },
    completed_quote: { label: 'Quote Completed', variant: 'default', className: 'bg-green-500 text-white border-green-500' },
  }), []);

  const orderStatusMap = useMemo(() => ({
    pending: { label: 'Pending', variant: 'outline', className: '' },
    ready_for_po: { label: 'Ready for PO', variant: 'default', className: 'bg-green-500 text-white border-green-500' },
    po_created: { label: 'PO Created', variant: 'default', className: 'bg-orange-500 text-white border-orange-500' },
    sent: { label: 'Sent to Client', variant: 'outline', className: '' },
    acknowledged: { label: 'Acknowledged', variant: 'outline', className: '' },
    in_production: { label: 'In Production', variant: 'default', className: '' },
    shipped: { label: 'Shipped', variant: 'default', className: '' },
    delivered: { label: 'Delivered', variant: 'default', className: '' },
    completed: { label: 'Completed', variant: 'default', className: '' },
    po_completed: { label: 'PO Completed', variant: 'default', className: 'bg-green-600 text-white border-green-600' },
  }), []);

  const getQuoteStatusBadge = useCallback((quote) => {
    if (!quote) return <Badge variant="secondary">Unknown</Badge>;
    
    const status = quote.status;
    
    // For pending_designer, show more specific status based on design workflow
    if (status === 'pending_designer') {
      if (quote.designStatus === 'in_progress') {
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500">Design In Progress</Badge>;
      } else if (quote.designStatus === 'pending') {
        return <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500">Pending Designer</Badge>;
      } else if (quote.designStatus === 'completed' && !quote.clientDesignApprovedAt) {
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500">Pending Client Approval</Badge>;
      } else if (quote.clientDesignApprovedAt && !quote.manufacturerDesignApprovedAt) {
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500">Pending Manufacturer Approval</Badge>;
      }
      return <Badge variant="outline">Design Pending</Badge>;
    }
    
    const s = quoteStatusMap[status] || { label: status, variant: 'secondary', className: '' };
    return <Badge variant={s.variant} className={s.className}>{s.label}</Badge>;
  }, [quoteStatusMap]);

  const getOrderStatusBadge = useCallback((status) => {
    const s = orderStatusMap[status] || { label: status, variant: 'secondary', className: '' };
    return <Badge variant={s.variant} className={s.className}>{s.label}</Badge>;
  }, [orderStatusMap]);

  // Memoized orders with computed values
  const processedOrders = useMemo(() => {
    return orders.map(row => ({
      ...row,
      itemAmount: row.item ? (row.item.quantity || 0) * (row.item.rate || 0) : 0
    }));
  }, [orders]);



  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Order Sheet</h1>
          <p className="text-muted-foreground">View all orders ready for Purchase Orders</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by PO number, client name, or quote number..."
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
                    // Only allow numbers
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
            <div className="space-y-5 pt-2">
              {/* All Status */}
              <div>
                <Badge
                  variant="outline"
                  className={`cursor-pointer px-4 py-1.5 text-sm transition-all inline-flex items-center ${
                    statusFilter.includes('all')
                      ? "bg-blue-400 text-white border-blue-400 hover:bg-blue-500" 
                      : "text-white border-white/50 hover:bg-white/10"
                  }`}
                  onClick={() => toggleStatus('all')}
                >
                  {statusFilter.includes('all') && <span className="w-5 h-5 mr-1.5 rounded-full bg-green-500 flex items-center justify-center"><Check className="w-3.5 h-3.5 text-white stroke-[3]" /></span>}
                  All Status
                </Badge>
              </div>



              {/* Quote Status */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Quote Status</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'pending_designer', label: 'Pending Designer' },
                    { value: 'design_in_progress', label: 'In Progress' },
                    { value: 'design_pending_client', label: 'Design Pending Client' },
                    { value: 'design_pending_manufacturer', label: 'Design Pending Manufacturer' },
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

              {/* Order Status */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Order Status</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'pending', label: 'Pending' },
                    { value: 'po_created', label: 'PO Created' },
                    { value: 'po_completed', label: 'PO Completed' },
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
            </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : processedOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">No orders found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {!isSalesExecutive && <TableHead>PO Number</TableHead>}
                  <TableHead>Quote Number</TableHead>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Order Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>MRP</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Quote Status</TableHead>
                  <TableHead>Order Status</TableHead>
                  <TableHead>Manufacturer</TableHead>
                  {!isSalesExecutive && <TableHead>Created Date</TableHead>}
                  <TableHead>Delivery Date</TableHead>
                  {!isSalesExecutive && !isDesigner && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedOrders.map((row) => (
                    <TableRow key={row._id}>
                      {!isSalesExecutive && (
                        <TableCell>
                          {row.purchaseOrder ? (
                            <span 
                              className="text-green-500 font-medium hover:underline cursor-pointer"
                              onClick={() => navigate(`/purchase-orders/${row.purchaseOrder._id}`)}
                            >
                              {row.poNumber}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        <span 
                          className="text-orange-500 hover:underline cursor-pointer"
                          onClick={() => navigate(`/quotes/${row.quote?._id}`)}
                        >
                          {row.quote?.quoteNumber || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[180px]">
                          <p className="font-medium truncate" title={row.quote?.clientName}>{row.quote?.clientName || 'N/A'}</p>
                          {row.quote?.clientEmail && (
                            <p className="text-xs text-muted-foreground truncate" title={row.quote.clientEmail}>{row.quote.clientEmail}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-sm">
                          {row.item?.brandName || row.item?.name || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span 
                           className={`badge badge-outline text-xs px-2 py-0.5 rounded-full border w-fit ${
                             row.item?.orderType === 'Repeat'
                               ? 'bg-red-500/10 text-red-500 border-red-500'
                               : 'bg-green-500/10 text-green-500 border-green-500'
                           }`}
                         >
                           {row.item?.orderType || 'New'}
                         </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {row.item?.quantity || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {row.item ? `₹${row.item.mrp || '0'}` : '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {row.item ? `₹${row.item.rate || '0'}` : '-'}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold">
                        ₹{row.itemAmount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {getQuoteStatusBadge(row.quote)}
                      </TableCell>
                      <TableCell>
                        {getOrderStatusBadge(row.orderStatus)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">
                          {row.manufacturer?.name || 'Not Assigned'}
                        </span>
                      </TableCell>
                      {!isSalesExecutive && (
                        <TableCell>
                          {row.purchaseOrder ? (
                            <div className="flex flex-col">
                              <span className="font-medium text-muted-foreground">
                                {new Date(row.purchaseOrder.createdAt).toLocaleDateString('en-GB')}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(row.purchaseOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        {row.purchaseOrder ? (() => {
                          const createdDate = new Date(row.purchaseOrder.createdAt || row.createdAt);
                          const deliveryDate = new Date(createdDate);
                          deliveryDate.setDate(deliveryDate.getDate() + 45);
                          return (
                            <span className="font-medium text-primary">
                              {deliveryDate.toLocaleDateString('en-GB')}
                            </span>
                          );
                        })() : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      {!isSalesExecutive && !isDesigner && (
                      <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (row.isPendingQuote) {
                                  navigate(`/quotes/${row.quote?._id}`);
                                } else {
                                  navigate(`/purchase-orders/${row.purchaseOrder?._id}`);
                                }
                              }}
                            >
                              <Eye size={16} />
                            </Button>
                            {(isAdmin || isManager) && (
                              row.purchaseOrder ? (
                                row.orderStatus === 'po_completed' ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled
                                    className="gap-1 bg-green-600 text-white border-green-600 opacity-100 disabled:opacity-100"
                                  >
                                    <CheckCircle size={14} className="text-white" />
                                    Completed
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled
                                    className="gap-1 bg-green-600 text-white border-green-600 opacity-100 disabled:opacity-100"
                                  >
                                    <CheckCircle size={14} className="text-white" />
                                    Created
                                  </Button>
                                )
                              ) : (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleOpenPOModal(row)}
                                  className="gap-1"
                                >
                                  <Plus size={14} />
                                  Create PO
                                </Button>
                              )
                            )}
                            {!row.isPendingQuote && row.pdfUrl && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDownloadPDF(row.purchaseOrder?._id, row.poNumber)}
                              >
                                <Download size={16} />
                              </Button>
                            )}
                          </div>
                      </TableCell>
                      )}
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
    </div>
  );
};

export default OrderSheet;
