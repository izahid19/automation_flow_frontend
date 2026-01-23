import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { quoteAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/shared';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  TrendingUp,
  Plus,
  ArrowRight,
  Loader2,
  FileSpreadsheet
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate, formatTime } from '@/utils/formatters';

const Dashboard = () => {
  const { user, isAdmin, isManager, isSalesExecutive } = useAuth();
  const { socket } = useSocket();
  const [stats, setStats] = useState(null);
  const [recentQuotes, setRecentQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [statsRes, quotesRes] = await Promise.all([
        quoteAPI.getStats(),
        quoteAPI.getAll({ limit: 10 }),
      ]);
      setStats(statsRes.data.data);
      setRecentQuotes(quotesRes.data.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Real-time socket updates
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchDashboardData();
    };

    const events = [
      'quote:created', 'quote:submitted', 'quote:approved', 'quote:rejected',
      'quote:design-updated', 'quote:client-approved', 'quote:client-order-updated',
      'quote:advance-payment-received', 'quote:completed',
      'po:created', 'po:status-updated', 'po:payment-verified'
    ];

    events.forEach(event => socket.on(event, handleUpdate));
    return () => events.forEach(event => socket.off(event, handleUpdate));
  }, [socket, fetchDashboardData]);

  const handleExportExcel = async () => {
    setExportLoading(true);
    try {
      const response = await quoteAPI.exportExcel();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const filename = `Quotes_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Excel file downloaded successfully!');
    } catch (error) {
      toast.error('Failed to export data to Excel');
    } finally {
      setExportLoading(false);
    }
  };

  const getStatusCount = (status) => {
    return stats?.byStatus?.find((s) => s._id === status)?.count || 0;
  };

  const statCards = [
    {
      title: 'Total Quotes',
      value: stats?.totalQuotes || 0,
      icon: FileText,
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Pending Approval',
      value: getStatusCount('pending_manager_approval') + getStatusCount('pending_se_approval') + getStatusCount('pending_md_approval'),
      icon: Clock,
      gradient: 'from-amber-500 to-orange-500',
    },
    {
      title: 'Approved',
      value: getStatusCount('manager_approved') + 
             getStatusCount('design_approved') + 
             getStatusCount('pending_accountant') + 
             getStatusCount('pending_designer') + 
             getStatusCount('design_pending') + 
             getStatusCount('ready_for_po') + 
             getStatusCount('po_created') + 
             getStatusCount('completed_quote'),
      icon: CheckCircle2,
      gradient: 'from-emerald-500 to-green-500',
    },
    {
      title: 'Total Value',
      value: `₹${((stats?.totalValue || 0) / 1000).toFixed(1)}K`,
      icon: TrendingUp,
      gradient: 'from-purple-500 to-violet-500',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="text-muted-foreground">Here's what's happening with your quotes</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button 
              variant="outline" 
              onClick={handleExportExcel}
              disabled={exportLoading}
            >
              {exportLoading ? (
                <Loader2 size={20} className="mr-2 animate-spin" />
              ) : (
                <FileSpreadsheet size={20} className="mr-2" />
              )}
              {exportLoading ? 'Exporting...' : 'Export Excel'}
            </Button>
          )}
          {(isAdmin || isManager || isSalesExecutive) && (
            <Button asChild>
              <Link to="/quotes/new">
                <Plus size={20} className="mr-2" />
                New Quote
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card 
            key={index} 
            className="hover:border-primary/50 transition-colors"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${stat.gradient} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {isAdmin && stats?.poStats && (
          <>
            <Card className="hover:border-primary/50 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">PO Pending</p>
                    <p className="text-2xl font-bold mt-1">{stats.poStats.pending}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-linear-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:border-primary/50 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">PO Created</p>
                    <p className="text-2xl font-bold mt-1">{stats.poStats.created}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-linear-to-br from-blue-400 to-indigo-600 flex items-center justify-center">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:border-primary/50 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">PO Completed</p>
                    <p className="text-2xl font-bold mt-1">{stats.poStats.completed}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-linear-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Recent Quotes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Recent Quotes</CardTitle>
            <CardDescription>Your latest quotations</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/quotes" className="flex items-center gap-1">
              View All <ArrowRight size={16} />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentQuotes.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">No quotes yet</p>
              {(isAdmin || isManager || isSalesExecutive) && (
                <Button asChild>
                  <Link to="/quotes/new">Create Your First Quote</Link>
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote Number</TableHead>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Quote Item Names</TableHead>
                  <TableHead>Order Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>MRP</TableHead>
                  <TableHead>Our Rate</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentQuotes.map((quote) => (
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
                      <div className="flex flex-col gap-1 max-w-[200px]">
                        {quote.items && quote.items.length > 0 ? (
                          quote.items.map((item, index) => (
                            <span key={index} className="text-sm font-medium">
                              {quote.items.length > 1 ? `${index + 1}. ` : ''}{item.brandName || item.name}
                            </span>
                          ))
                        ) : '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {quote.items && quote.items.length > 0 ? (
                           quote.items.map((item, index) => (
                             <Badge 
                               key={index} 
                               variant="outline"
                               className={`text-xs w-fit ${
                                 item.orderType === 'Repeat'
                                   ? 'bg-red-500/10 text-red-500 border-red-500'
                                   : 'bg-green-500/10 text-green-500 border-green-500'
                               }`}
                             >
                               {item.orderType || 'New'}
                             </Badge>
                           ))
                        ) : '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {quote.items && quote.items.length > 0 ? (
                          quote.items.map((item, index) => (
                            <span key={index} className="text-sm">
                              {quote.items.length > 1 ? `${index + 1}. ` : ''}{item.quantity}
                            </span>
                          ))
                        ) : '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {quote.items && quote.items.length > 0 ? (
                          quote.items.map((item, index) => (
                            <span key={index} className="text-sm">
                              {quote.items.length > 1 ? `${index + 1}. ` : ''}{item.mrp ? formatCurrency(item.mrp) : '-'}
                            </span>
                          ))
                        ) : '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {quote.items && quote.items.length > 0 ? (
                          quote.items.map((item, index) => (
                            <span key={index} className="text-sm">
                              {quote.items.length > 1 ? `${index + 1}. ` : ''}{item.rate ? formatCurrency(item.rate) : '-'}
                            </span>
                          ))
                        ) : '-'}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">{formatCurrency(quote.totalAmount)}</TableCell>
                    <TableCell><StatusBadge status={quote.status} type="quote" /></TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex flex-col">
                        <span className="font-medium">{formatDate(quote.createdAt)}</span>
                        <span className="text-xs text-muted-foreground">{formatTime(quote.createdAt)}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
