import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '@/context/SocketContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Search,
  Package,
  Loader2,
  Eye,
  Download,
  Plus,
  Calendar,
  Check,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '@/config';

const CompletedOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const navigate = useNavigate();
  const { socket } = useSocket();

  const getDateRange = (filterType) => {
    const today = new Date();
    
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
        if (customDateFrom) {
          const toDate = customDateTo || today.toISOString().split('T')[0];
          return { from: customDateFrom, to: toDate };
        }
        return null;
      
      default:
        return null;
    }
  };

  const getDateFilterLabel = (filterType) => {
    const today = new Date();
    
    switch (filterType) {
      case 'last_day':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return `Last Day (${yesterday.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })})`;
      
      case 'last_week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoStr = weekAgo.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const todayStr = today.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
        return `Last Week (${weekAgoStr} to ${todayStr})`;
      
      case 'last_month':
        const currentMonth = new Date(today);
        currentMonth.setDate(1); // First day of current month
        const lastMonthStart = new Date(currentMonth);
        lastMonthStart.setMonth(lastMonthStart.getMonth() - 1); // First day of previous month
        const monthName = lastMonthStart.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
        return `Last Month (${monthName})`;
      
      case 'custom':
        if (customDateFrom) {
          const fromDate = new Date(customDateFrom);
          const fromStr = fromDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
          const toDate = customDateTo ? new Date(customDateTo) : today;
          const toStr = toDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
          return `Custom (${fromStr} to ${toStr})`;
        }
        return 'Custom Date';
      
      default:
        return 'All Dates';
    }
  };

  const fetchOrders = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: pagination.page,
        limit: 30,
        onlyPOs: 'true',
        ...(search && { search }),
      });

      // Add date filtering
      if (dateFilter && dateFilter !== 'all') {
        const dateRange = getDateRange(dateFilter);
        if (dateRange) {
          params.append('startDate', dateRange.from);
          params.append('endDate', dateRange.to);
        }
      }

      // Add status filtering
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await axios.get(`${API_URL}/purchase-orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setOrders(response.data.data || []);
      setPagination(response.data.pagination || { page: 1, pages: 1 });
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      toast.error('Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  }, [search, pagination.page, dateFilter, statusFilter, customDateFrom, customDateTo]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Listen for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchOrders();
    };

    // PO events
    socket.on('po:created', handleUpdate);
    socket.on('po:status-updated', handleUpdate);
    socket.on('po:payment-verified', handleUpdate);

    return () => {
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

  const getStatusBadge = (status) => {
    const statusMap = {
      draft: { label: 'Draft', variant: 'secondary', className: '' },
      sent: { label: 'PO Created', variant: 'default', className: 'bg-orange-500 text-white border-orange-500' },
      acknowledged: { label: 'Acknowledged', variant: 'outline', className: '' },
      in_production: { label: 'In Production', variant: 'default', className: 'bg-blue-500/10 text-blue-500 border-blue-500' },
      shipped: { label: 'Shipped', variant: 'default', className: 'bg-indigo-500/10 text-indigo-500 border-indigo-500' },
      delivered: { label: 'Delivered', variant: 'default', className: 'bg-purple-500/10 text-purple-500 border-purple-500' },
      completed: { label: 'Completed', variant: 'default', className: 'bg-green-500 text-white border-green-500' },
      po_completed: { label: 'PO Completed', variant: 'default', className: 'bg-green-600 text-white border-green-600' },
    };
    const s = statusMap[status] || { label: status, variant: 'secondary', className: '' };
    return <Badge variant={s.variant} className={s.className}>{s.label}</Badge>;
  };


  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Purchase Orders</h1>
          <p className="text-muted-foreground">View all created purchase orders</p>
        </div>

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
                  placeholder="Search by PO number, client name, or manufacturer..."
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
                  <SelectItem value="last_day">{getDateFilterLabel('last_day')}</SelectItem>
                  <SelectItem value="last_week">{getDateFilterLabel('last_week')}</SelectItem>
                  <SelectItem value="last_month">{getDateFilterLabel('last_month')}</SelectItem>
                  <SelectItem value="custom">{getDateFilterLabel('custom')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter Chips */}
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: 'All' },
                { value: 'sent', label: 'PO Created' },
                { value: 'po_completed', label: 'PO Completed' },
              ].map((status) => (
                <Badge
                  key={status.value}
                  variant="outline"
                  className={`cursor-pointer px-4 py-1.5 text-sm transition-all flex items-center ${
                    statusFilter === status.value
                      ? "border-primary text-primary bg-transparent hover:bg-primary/10" 
                      : "text-white border-white/50 hover:bg-white/10"
                  }`}
                  onClick={() => setStatusFilter(status.value)}
                >
                  {statusFilter === status.value && <Check className="w-3 h-3 mr-1 text-emerald-500" />}
                  {status.label}
                </Badge>
              ))}
            </div>
            {dateFilter === 'custom' && (
              <div className="flex items-center gap-2 flex-wrap">
                <Calendar className="w-4 h-4 text-muted-foreground mr-1" />
                <Label className="text-sm font-medium">From:</Label>
                <div className="relative group">
                  <Input
                    type="text"
                    placeholder="dd/mm/yyyy"
                    onFocus={(e) => (e.target.type = "date")}
                    onBlur={(e) => (e.target.type = "text")}
                    value={customDateFrom}
                    onChange={(e) => {
                      setCustomDateFrom(e.target.value);
                      if (customDateTo && e.target.value > customDateTo) {
                        setCustomDateTo('');
                      }
                    }}
                    className="w-[140px] sm:w-[160px] uppercase text-transparent focus:text-foreground z-10 relative bg-transparent"
                    max={customDateTo || new Date().toISOString().split('T')[0]}
                  />
                  {/* Overlay text for non-empty value when type is text to show formatted date */}
                  {customDateFrom && (
                     <div 
                       className="absolute inset-0 flex items-center pl-3 text-sm pointer-events-none bg-background rounded-md border border-input text-foreground group-focus-within:hidden"
                     >
                       {new Date(customDateFrom).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                     </div>
                  )}
                </div>
                
                <Label className="text-sm font-medium">To:</Label>
                <div className="relative group">
                  <Input
                    type="text"
                    placeholder="dd/mm/yyyy"
                    onFocus={(e) => (e.target.type = "date")}
                    onBlur={(e) => (e.target.type = "text")}
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                    className="w-[140px] sm:w-[160px] uppercase text-transparent focus:text-foreground z-10 relative bg-transparent"
                    min={customDateFrom}
                    max={new Date().toISOString().split('T')[0]}
                  />
                   {customDateTo && (
                     <div 
                       className="absolute inset-0 flex items-center pl-3 text-sm pointer-events-none bg-background rounded-md border border-input text-foreground group-focus-within:hidden"
                     >
                        {new Date(customDateTo).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                     </div>
                  )}
                </div>
              </div>
            )}
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
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">No purchase orders found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Quote Number</TableHead>
                  <TableHead>Manufacturer</TableHead>
                  <TableHead>Quote Item Name</TableHead>
                  <TableHead>Order Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Order Status</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead>Delivery Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell>
                      <span 
                        className="text-primary font-medium cursor-pointer hover:underline"
                        onClick={() => navigate(`/purchase-orders/${order._id}`)}
                      >
                        {order.poNumber}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">
                        {order.quoteNumber || order.quote?.quoteNumber || 'N/A'}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div>
                        <p className="font-medium">{order.manufacturer?.name || 'N/A'}</p>
                        {order.manufacturer?.email && (
                          <p className="text-xs text-muted-foreground">{order.manufacturer.email}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {order.items?.length > 0 ? (
                          order.items.map((item, index) => (
                            <span key={index} className="font-medium text-sm">
                              {order.items.length > 1 ? `${index + 1}. ` : ''}
                              {item.brandName || item.name || item.itemName || 'N/A'}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {order.items?.length > 0 && (
                        <span 
                           className={`badge badge-outline text-xs px-2 py-0.5 rounded-full border w-fit ${
                             order.items[0].orderType === 'Repeat'
                               ? 'bg-red-500/10 text-red-500 border-red-500'
                               : 'bg-green-500/10 text-green-500 border-green-500'
                           }`}
                         >
                           {order.items[0].orderType || 'New'}
                         </span>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold">₹{order.totalAmount?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const createdDate = new Date(order.createdAt);
                        const deliveryDate = new Date(createdDate);
                        deliveryDate.setDate(deliveryDate.getDate() + 45);
                        return (
                          <span className="font-medium text-primary">
                            {deliveryDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </span>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/purchase-orders/${order._id}`)}
                          title="View Details"
                        >
                          <Eye size={16} />
                        </Button>
                        {order.pdfUrl && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadPDF(order._id, order.poNumber)}
                            title="Download PDF"
                          >
                            <Download size={16} />
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
    </div>
  );
};

export default CompletedOrders;
