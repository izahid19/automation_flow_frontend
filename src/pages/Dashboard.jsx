import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { quoteAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  TrendingUp,
  Plus,
  ArrowRight,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentQuotes, setRecentQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, quotesRes] = await Promise.all([
        quoteAPI.getStats(),
        quoteAPI.getAll({ limit: 5 }),
      ]);
      setStats(statsRes.data.data);
      setRecentQuotes(quotesRes.data.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
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
      value: getStatusCount('pending_se_approval') + getStatusCount('pending_md_approval'),
      icon: Clock,
      gradient: 'from-amber-500 to-orange-500',
    },
    {
      title: 'Approved',
      value: getStatusCount('approved') + getStatusCount('design_approved'),
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

  const getStatusBadge = (status) => {
    const statusMap = {
      draft: { label: 'Draft', variant: 'secondary' },
      pending_se_approval: { label: 'Pending SE', variant: 'outline' },
      pending_md_approval: { label: 'Pending MD', variant: 'outline' },
      approved: { label: 'Approved', variant: 'default' },
      rejected: { label: 'Rejected', variant: 'destructive' },
      design_pending: { label: 'Design Pending', variant: 'outline' },
      design_approved: { label: 'Design Done', variant: 'default' },
      po_created: { label: 'PO Created', variant: 'default' },
    };
    const s = statusMap[status] || { label: status, variant: 'secondary' };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

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
        <Button asChild>
          <Link to="/quotes/new">
            <Plus size={20} className="mr-2" />
            New Quote
          </Link>
        </Button>
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
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
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
              <Button asChild>
                <Link to="/quotes/new">Create Your First Quote</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote #</TableHead>
                  <TableHead>Client</TableHead>
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
                    <TableCell className="font-semibold">₹{quote.totalAmount?.toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(quote.status)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(quote.createdAt).toLocaleDateString()}
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
