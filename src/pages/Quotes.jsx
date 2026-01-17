import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { quoteAPI } from '@/services/api';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
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
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

const Quotes = () => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, quoteNumber: '' });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { isAdmin } = useAuth();

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
        if (customDateFrom) {
          const toDate = customDateTo || today.toISOString().split('T')[0];
          return { from: customDateFrom, to: toDate };
        }
        return null;
      
      default:
        return null;
    }
  }, [customDateFrom, customDateTo]);

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

  const fetchQuotes = useCallback(async () => {
    try {
      const params = { page: pagination.page, limit: 10 };
      if (search) params.search = search;
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      
      // Add date filtering
      if (dateFilter && dateFilter !== 'all') {
        const dateRange = getDateRange(dateFilter);
        if (dateRange && dateRange.from) {
          params.dateFrom = dateRange.from;
          params.dateTo = dateRange.to;
        }
      }

      const response = await quoteAPI.getAll(params);
      setQuotes(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Failed to load quotes');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, dateFilter, customDateFrom, customDateTo, pagination.page, getDateRange]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  // Listen for real-time quote updates
  useEffect(() => {
    if (!socket) return;

    const handleQuoteUpdate = () => {
      // Refresh quotes list when any quote event occurs
      fetchQuotes();
    };

    socket.on('quote:created', handleQuoteUpdate);
    socket.on('quote:submitted', handleQuoteUpdate);
    socket.on('quote:approved', handleQuoteUpdate);
    socket.on('quote:rejected', handleQuoteUpdate);
    socket.on('quote:design-updated', handleQuoteUpdate);

    return () => {
      socket.off('quote:created', handleQuoteUpdate);
      socket.off('quote:submitted', handleQuoteUpdate);
      socket.off('quote:approved', handleQuoteUpdate);
      socket.off('quote:rejected', handleQuoteUpdate);
      socket.off('quote:design-updated', handleQuoteUpdate);
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
      fetchQuotes();
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

  const getStatusBadge = (status) => {
    const statusMap = {
      draft: { label: 'Draft', variant: 'secondary' },
      submitted: { label: 'Submitted', variant: 'outline' },
      pending_manager_approval: { label: 'Pending Manager', variant: 'outline' },
      approved: { label: 'Manager Approved', variant: 'default' },
      rejected: { label: 'Rejected', variant: 'destructive' },
      pending_accountant: { label: 'Pending Accountant', variant: 'outline' },
      pending_designer: { label: 'Pending Designer', variant: 'outline' },
      ready_for_po: { label: 'Ready for PO', variant: 'default' },
      po_created: { label: 'PO Created', variant: 'default' },
      completed: { label: 'Completed', variant: 'default' },
    };
    const s = statusMap[status] || { label: status, variant: 'secondary' };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quotes</h1>
          <p className="text-muted-foreground">Manage all your quotations</p>
        </div>
        <Button asChild>
          <Link to="/quotes/new">
            <Plus size={20} className="mr-2" />
            New Quote
          </Link>
        </Button>
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
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="pending_manager_approval">Pending Manager</SelectItem>
                  <SelectItem value="approved">Manager Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="pending_accountant">Pending Accountant</SelectItem>
                  <SelectItem value="pending_designer">Pending Designer</SelectItem>
                  <SelectItem value="ready_for_po">Ready for PO</SelectItem>
                  <SelectItem value="po_created">PO Created</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
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
            {dateFilter === 'custom' && (
              <div className="flex items-center gap-2 flex-wrap">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <Label className="text-sm">From Date:</Label>
                <Input
                  type="date"
                  value={customDateFrom}
                  onChange={(e) => {
                    setCustomDateFrom(e.target.value);
                    // If from date is after to date, reset to date
                    if (customDateTo && e.target.value > customDateTo) {
                      setCustomDateTo('');
                    }
                  }}
                  className="w-48"
                  max={customDateTo || new Date().toISOString().split('T')[0]}
                />
                <Label className="text-sm">To Date:</Label>
                <Input
                  type="date"
                  value={customDateTo}
                  onChange={(e) => setCustomDateTo(e.target.value)}
                  className="w-48"
                  min={customDateFrom}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            )}
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
                  <TableHead>Quote #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
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
                    <TableCell>{quote.items?.length || 0} items</TableCell>
                    <TableCell className="font-semibold">₹{quote.totalAmount?.toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(quote.status)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(quote.createdAt).toLocaleDateString('en-GB')} {new Date(quote.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
