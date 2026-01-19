import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderAPI } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search,
  Package,
  Loader2,
  Eye,
  Download,
  Plus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const CompletedOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [showPOModal, setShowPOModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [manufacturers, setManufacturers] = useState([]);
  const [selectedManufacturer, setSelectedManufacturer] = useState('');
  const [poNotes, setPONotes] = useState('');
  const [creatingPO, setCreatingPO] = useState(false);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const fetchOrders = useCallback(async () => {
    try {
      const params = { page: pagination.page, limit: 10 };
      if (search) params.search = search;

      const response = await orderAPI.getAll(params);
      setOrders(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Failed to load completed orders');
    } finally {
      setLoading(false);
    }
  }, [search, pagination.page]);

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

  const fetchManufacturers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/manufacturers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setManufacturers(response.data.data);
    } catch (error) {
      toast.error('Failed to load manufacturers');
    }
  };

  const handleOpenPOModal = async (quote) => {
    setSelectedQuote(quote);
    setShowPOModal(true);
    if (manufacturers.length === 0) {
      await fetchManufacturers();
    }
  };

  const handleCreatePO = async () => {
    if (!selectedManufacturer) {
      toast.error('Please select a manufacturer');
      return;
    }

    setCreatingPO(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/purchase-orders',
        {
          quoteId: selectedQuote._id,
          manufacturerId: selectedManufacturer,
          notes: poNotes,
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success('Purchase Order created and email sent successfully!');
      setShowPOModal(false);
      setSelectedQuote(null);
      setSelectedManufacturer('');
      setPONotes('');
      fetchOrders(); // Refresh the list
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create Purchase Order');
    } finally {
      setCreatingPO(false);
    }
  };

  const getStatusBadge = (status) => {
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
    const s = statusMap[status] || { label: status, variant: 'secondary' };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Completed Orders</h1>
          <p className="text-muted-foreground">View all completed purchase orders</p>
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
              <p className="text-muted-foreground mb-4">No completed orders found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Quote #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Manufacturer</TableHead>
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
                      {order.isPendingQuote ? (
                        <span className="text-muted-foreground italic">Pending</span>
                      ) : (
                        <span className="text-primary font-medium">
                          {order.poNumber}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">
                        {order.quote?.quoteNumber || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.quote?.clientName || 'N/A'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">
                        {order.manufacturer?.name || (order.isPendingQuote ? 'Not assigned' : 'N/A')}
                      </p>
                    </TableCell>
                    <TableCell className="font-semibold">₹{order.totalAmount?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString('en-GB')} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

      {/* Create Purchase Order Modal */}
      <Dialog open={showPOModal} onOpenChange={setShowPOModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
            <DialogDescription>
              Select a manufacturer and create a purchase order for quote {selectedQuote?.quote?.quoteNumber}
            </DialogDescription>
          </DialogHeader>

          {selectedQuote && (
            <div className="space-y-4">
              {/* Quote Summary */}
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Quote Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Quote Number:</span>
                    <span className="ml-2 font-medium">{selectedQuote.quote?.quoteNumber}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Client:</span>
                    <span className="ml-2 font-medium">{selectedQuote.quote?.clientName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Amount:</span>
                    <span className="ml-2 font-medium">₹{selectedQuote.totalAmount?.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Manufacturer Selection */}
              <div className="space-y-2">
                <Label htmlFor="manufacturer">Select Manufacturer *</Label>
                <select
                  id="manufacturer"
                  value={selectedManufacturer}
                  onChange={(e) => setSelectedManufacturer(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">-- Select Manufacturer --</option>
                  {manufacturers.map((manufacturer) => (
                    <option key={manufacturer._id} value={manufacturer._id}>
                      {manufacturer.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes for this purchase order..."
                  value={poNotes}
                  onChange={(e) => setPONotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPOModal(false);
                setSelectedQuote(null);
                setSelectedManufacturer('');
                setPONotes('');
              }}
              disabled={creatingPO}
            >
              Cancel
            </Button>
            <Button onClick={handleCreatePO} disabled={creatingPO || !selectedManufacturer}>
              {creatingPO ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>Create PO & Send Email</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompletedOrders;
