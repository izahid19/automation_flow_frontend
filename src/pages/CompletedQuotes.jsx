import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderAPI } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
} from 'lucide-react';
import toast from 'react-hot-toast';

const CompletedQuotes = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(['all']);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const fetchOrders = useCallback(async () => {
    try {
      const params = { page: pagination.page, limit: 10 };
      if (search) params.search = search;
      if (statusFilter.length > 0 && !statusFilter.includes('all')) {
        params.status = statusFilter.join(',');
      }

      const response = await orderAPI.getAll(params);
      setOrders(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Failed to load completed quotes');
    } finally {
      setLoading(false);
    }
  }, [search, pagination.page, statusFilter]);

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

  const handleDownloadPDF = async (id, poNumber) => {
    try {
      const response = await orderAPI.getOne(id);
      if (response.data.data.pdfUrl) {
        window.open(response.data.data.pdfUrl, '_blank');
      } else {
        toast.error('PDF not available');
      }
    } catch (error) {
      toast.error('Failed to download PDF');
    }
  };

  const handleOpenPOModal = async (quote) => {
    // Navigate to PO form with quote data
    navigate(`/purchase-orders/new?quoteId=${quote._id}`);
  };

  const statusMap = {
    draft: { label: 'Draft', variant: 'secondary' },
    sent: { label: 'Sent to Client', variant: 'outline' },
    acknowledged: { label: 'Acknowledged', variant: 'outline' },
    in_production: { label: 'In Production', variant: 'default' },
    shipped: { label: 'Shipped', variant: 'default' },
    delivered: { label: 'Delivered', variant: 'default' },
    completed: { label: 'Ready for PO', variant: 'default' },
    pending_accountant: { label: 'Payment Pending', variant: 'outline' },
    pending_designer: { label: 'Design Pending', variant: 'outline' },
  };

  const getStatusBadge = (status) => {
    const s = statusMap[status] || { label: status, variant: 'secondary' };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Completed Quotes</h1>
          <p className="text-muted-foreground">View all completed quotes ready for Purchase Orders</p>
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
            </div>
            
            {/* Status Filter Chips */}
            <div className="flex flex-wrap gap-2 pt-2">
              {[
                { value: 'all', label: 'All Status' },
                { value: 'completed', label: 'Ready for PO' },
                { value: 'pending_accountant', label: 'Payment Pending' },
                { value: 'pending_designer', label: 'Design Pending' },
              ].map((status) => (
                <Badge
                  key={status.value}
                  variant="outline"
                  className={`cursor-pointer px-4 py-1.5 text-sm transition-all flex items-center ${
                    statusFilter.includes(status.value)
                      ? "border-primary text-primary bg-transparent hover:bg-primary/10" 
                      : "text-muted-foreground hover:bg-muted/50"
                  }`}
                  onClick={() => toggleStatus(status.value)}
                >
                  {statusFilter.includes(status.value) && <Check className="w-3 h-3 mr-1 text-emerald-500" />}
                  {status.label}
                </Badge>
              ))}
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
              <p className="text-muted-foreground mb-4">No completed quotes found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote Number</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Quote Item Names</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell>
                      <span 
                        className="text-muted-foreground hover:text-primary hover:underline cursor-pointer"
                        onClick={() => navigate(`/quotes/${order.quote?._id}`)}
                      >
                        {order.quote?.quoteNumber || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.quote?.clientName || 'N/A'}</p>
                        {order.quote?.clientEmail && (
                          <p className="text-xs text-muted-foreground">{order.quote.clientEmail}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                         {order.quote?.items?.length > 0 ? (
                           order.quote.items.map((item, index) => (
                             <span key={index} className="font-medium text-sm">
                               {order.quote.items.length > 1 ? `${index + 1}. ` : ''}{item.brandName || item.name || 'N/A'}
                             </span>
                           ))
                         ) : (
                           <span className="text-muted-foreground text-sm">-</span>
                         )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {order.quote?.items?.length > 0 ? (
                           order.quote.items.map((item, index) => (
                             <span key={index} className="text-sm">
                               {order.quote.items.length > 1 ? `${index + 1}. ` : ''}{item.quantity || '-'}
                             </span>
                           ))
                        ) : '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {order.quote?.items?.length > 0 ? (
                           order.quote.items.map((item, index) => (
                             <span key={index} className="text-sm">
                               {order.quote.items.length > 1 ? `${index + 1}. ` : ''}₹{item.rate || '0'}
                             </span>
                           ))
                        ) : '-'}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">₹{order.totalAmount?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-muted-foreground">{new Date(order.createdAt).toLocaleDateString('en-GB')}</span>
                        <span className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (order.isPendingQuote) {
                              // Navigate to quote detail page for pending quotes
                              navigate(`/quotes/${order._id}`);
                            } else {
                              // Navigate to purchase order detail page
                              navigate(`/purchase-orders/${order._id}`);
                            }
                          }}
                        >
                          <Eye size={16} />
                        </Button>
                        {order.needsPO && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleOpenPOModal(order)}
                            className="gap-1"
                          >
                            <Plus size={14} />
                            Create PO
                          </Button>
                        )}
                        {!order.isPendingQuote && order.pdfUrl && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadPDF(order._id, order.poNumber)}
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

export default CompletedQuotes;
