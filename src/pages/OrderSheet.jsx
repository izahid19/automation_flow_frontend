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
  CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

const OrderSheet = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(['all']);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const navigate = useNavigate();
  const { isAdmin, isManager } = useAuth();

  const fetchOrders = useCallback(async () => {
    try {
      const params = { page: pagination.page, limit: 30 };
      if (search) params.search = search;
      if (statusFilter.length > 0 && !statusFilter.includes('all')) {
        params.status = statusFilter.join(',');
      }

      const response = await orderAPI.getSheet(params);
      setOrders(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Failed to load order sheet');
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

  const handleOpenPOModal = async (row) => {
    // Navigate to PO form with quote data and item index
    navigate(`/purchase-orders/new?quoteId=${row.quote._id}&itemIndex=${row.itemIndex}`);
  };

  const getQuoteStatusBadge = (quote) => {
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
    
    const statusMap = {
      draft: { label: 'Draft', variant: 'secondary', className: '' },
      pending_accountant: { label: 'Pending Accountant', variant: 'outline', className: '' },
      manager_approved: { label: 'Manager Approved', variant: 'outline', className: '' },
      completed_quote: { label: 'Quote Completed', variant: 'default', className: 'bg-green-500 text-white border-green-500' },
    };
    const s = statusMap[status] || { label: status, variant: 'secondary', className: '' };
    return <Badge variant={s.variant} className={s.className}>{s.label}</Badge>;
  };

  const getOrderStatusBadge = (status) => {
    const statusMap = {
      pending: { label: 'Pending', variant: 'outline', className: '' },
      ready_for_po: { label: 'Ready for PO', variant: 'default', className: 'bg-green-500 text-white border-green-500' },
      po_created: { label: 'PO Created', variant: 'default', className: 'bg-orange-500 text-white border-orange-500' },
      sent: { label: 'Sent to Client', variant: 'outline', className: '' },
      acknowledged: { label: 'Acknowledged', variant: 'outline', className: '' },
      in_production: { label: 'In Production', variant: 'default', className: '' },
      shipped: { label: 'Shipped', variant: 'default', className: '' },
      delivered: { label: 'Delivered', variant: 'default', className: '' },
      completed: { label: 'Completed', variant: 'default', className: '' },
    };
    const s = statusMap[status] || { label: status, variant: 'secondary', className: '' };
    return <Badge variant={s.variant} className={s.className}>{s.label}</Badge>;
  };



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
            </div>
            
            {/* Status Filter Chips */}
            <div className="space-y-5 pt-2">
              {/* All Status */}
              <div>
                <Badge
                  variant="outline"
                  className={`cursor-pointer px-4 py-1.5 text-sm transition-all inline-flex items-center ${
                    statusFilter.includes('all')
                      ? "border-primary text-primary bg-transparent hover:bg-primary/10" 
                      : "text-muted-foreground hover:bg-muted/50"
                  }`}
                  onClick={() => toggleStatus('all')}
                >
                  {statusFilter.includes('all') && <Check className="w-3 h-3 mr-1 text-emerald-500" />}
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
              </div>

              {/* Order Status */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Order Status</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'pending', label: 'Pending' },
                    { value: 'po_created', label: 'PO Created' },
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
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">No orders found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">S.No</TableHead>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Quote Number</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>MRP</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Quote Status</TableHead>
                  <TableHead>Order Status</TableHead>
                  <TableHead>Manufacturer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((row, index) => {
                  const itemAmount = row.item ? (row.item.quantity || 0) * (row.item.rate || 0) : 0;
                  
                  return (
                    <TableRow key={row._id}>
                      <TableCell className="font-medium text-muted-foreground">
                        {index + 1}
                      </TableCell>
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
                      <TableCell>
                        <span 
                          className="text-orange-500 hover:underline cursor-pointer"
                          onClick={() => navigate(`/quotes/${row.quote?._id}`)}
                        >
                          {row.quote?.quoteNumber || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{row.quote?.clientName || 'N/A'}</p>
                          {row.quote?.clientEmail && (
                            <p className="text-xs text-muted-foreground">{row.quote.clientEmail}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-sm">
                          {row.item?.brandName || row.item?.name || '-'}
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
                        ₹{itemAmount.toFixed(2)}
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
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-muted-foreground">{new Date(row.createdAt).toLocaleDateString('en-GB')}</span>
                          <span className="text-xs text-muted-foreground">{new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </TableCell>
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
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled
                                  className="gap-1 bg-green-100 text-green-700 border-green-200 opacity-100 disabled:opacity-100"
                                >
                                  <CheckCircle size={14} className="text-green-600" />
                                  Created
                                </Button>
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
                    </TableRow>
                  );
                })}
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
