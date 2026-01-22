import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { quoteAPI, settingsAPI } from '../services/api';
import { 
  ArrowLeft, 
  Download, 
  Send,
  Check,
  X,
  Loader2,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Eye,
  EyeOff,
  Edit,
  Mail as MailIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import QuotePreview from '@/components/QuotePreview';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { Label } from '../components/ui/label';

import ConfirmDialog from '@/components/ui/ConfirmDialog';

const QuoteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isSalesExecutive, isManager, isMD, isDesigner, isAccountant } = useAuth();
  const { socket } = useSocket();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const hasSoftGelatin = quote?.items?.some(item => item.formulationType === 'Soft Gelatine');
  const hasBlister = quote?.items?.some(item => item.packagingType === 'Blister');
  const [actionLoading, setActionLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [comments, setComments] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showVerifyConfirm, setShowVerifyConfirm] = useState(false);
  const previewRef = useRef(null);
  const [companySettings, setCompanySettings] = useState({
    companyPhone: '+917696275527',
    companyEmail: 'user@gmail.com',
    invoiceLabel: 'QUOTATION'
  });

  /* State for Client Order Status update */
  const [selectedClientStatus, setSelectedClientStatus] = useState('pending');
  const [advanceAmountInput, setAdvanceAmountInput] = useState('');

  // Sync state when quote loads
  useEffect(() => {
    if (quote) {
      setSelectedClientStatus(quote.clientOrderStatus || 'pending');
      if (quote.advanceAmount) setAdvanceAmountInput(quote.advanceAmount);
    }
  }, [quote]);

  const fetchCompanySettings = useCallback(async () => {
    try {
      const response = await settingsAPI.getAll();
      if (response.data.success) {
        setCompanySettings({
          companyPhone: response.data.data.companyPhone || '+917696275527',
          companyEmail: response.data.data.companyEmail || 'user@gmail.com',
          invoiceLabel: response.data.data.invoiceLabel || 'QUOTATION'
        });
      }
    } catch (error) {
      console.error('Failed to fetch company settings:', error);
    }
  }, []);

  const fetchQuote = useCallback(async () => {
    try {
      const response = await quoteAPI.getOne(id);
      setQuote(response.data.data);
    } catch (error) {
      toast.error('Failed to load quote');
      navigate('/quotes');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchQuote();
    fetchCompanySettings();
  }, [fetchQuote, fetchCompanySettings]);

  // Listen for real-time updates to this quote
  useEffect(() => {
    if (!socket || !id) return;

    const handleQuoteUpdate = (data) => {
      // Only refresh if the update is for this quote
      if (data.quote?._id === id || data.quote?.id === id) {
        fetchQuote();
      }
    };

    socket.on('quote:approved', handleQuoteUpdate);
    socket.on('quote:rejected', handleQuoteUpdate);
    socket.on('quote:design-updated', handleQuoteUpdate);
    socket.on('quote:client-approved', handleQuoteUpdate);
    socket.on('quote:client-order-updated', handleQuoteUpdate);
    socket.on('quote:advance-payment-received', handleQuoteUpdate);
    socket.on('quote:completed', handleQuoteUpdate);
    socket.on('quote:client-design-approved', handleQuoteUpdate);

    return () => {
      socket.off('quote:approved', handleQuoteUpdate);
      socket.off('quote:rejected', handleQuoteUpdate);
      socket.off('quote:design-updated', handleQuoteUpdate);
      socket.off('quote:client-approved', handleQuoteUpdate);
      socket.off('quote:client-order-updated', handleQuoteUpdate);
      socket.off('quote:advance-payment-received', handleQuoteUpdate);
      socket.off('quote:completed', handleQuoteUpdate);
      socket.off('quote:client-design-approved', handleQuoteUpdate);
    };
  }, [socket, id, fetchQuote]);

  const handleSubmit = async () => {
    setActionLoading(true);
    try {
      await quoteAPI.submit(id);
      toast.success('Quote submitted for approval');
      fetchQuote();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveSE = async () => {
    setActionLoading(true);
    try {
      await quoteAPI.approveSE(id, { comments });
      toast.success('Quote approved by Sales Executive');
      setComments('');
      fetchQuote();
    } catch (error) {
      toast.error('Failed to approve');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSE = async () => {
    if (!comments) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    setActionLoading(true);
    try {
      await quoteAPI.rejectSE(id, { comments });
      toast.success('Quote rejected');
      setComments('');
      fetchQuote();
    } catch (error) {
      toast.error('Failed to reject');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveManager = async () => {
    setActionLoading(true);
    try {
      await quoteAPI.approveManager(id, { comments });
      toast.success('Quote approved by Manager. Email sent to client with invoice.');
      setComments('');
      fetchQuote();
    } catch (error) {
      toast.error('Failed to approve');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateClientOrderStatus = async () => {
    if (selectedClientStatus === 'approved' && !advanceAmountInput) {
      toast.error('Please enter the advance amount received');
      return;
    }

    setActionLoading(true);
    try {
      await quoteAPI.updateClientOrderStatus(id, { 
        clientOrderStatus: selectedClientStatus,
        advanceAmount: selectedClientStatus === 'approved' ? Number(advanceAmountInput) : undefined
      });
      toast.success(`Client order status updated to ${selectedClientStatus}`);
      fetchQuote();
    } catch (error) {
      toast.error('Failed to update client order status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmAdvancePayment = async () => {
    setActionLoading(true);
    try {
      await quoteAPI.confirmAdvancePayment(id);
      toast.success('Advance payment confirmed. Sent to Designer.');
      fetchQuote();
    } catch (error) {
      toast.error('Failed to confirm advance payment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveMD = async () => {
    setActionLoading(true);
    try {
      await quoteAPI.approveMD(id, { comments });
      toast.success('Quote approved by MD');
      setComments('');
      fetchQuote();
    } catch (error) {
      toast.error('Failed to approve');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectManager = async () => {
    if (!comments) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    setActionLoading(true);
    try {
      await quoteAPI.rejectManager(id, { comments });
      toast.success('Quote rejected by Manager');
      setComments('');
      fetchQuote();
    } catch (error) {
      toast.error('Failed to reject');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectMD = async () => {
    if (!comments) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    setActionLoading(true);
    try {
      await quoteAPI.rejectMD(id, { comments });
      toast.success('Quote rejected');
      setComments('');
      fetchQuote();
    } catch (error) {
      toast.error('Failed to reject');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloadLoading(true);
    try {
      const response = await quoteAPI.downloadPDF(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${quote.quoteNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('PDF download error:', error);
      toast.error('Failed to download PDF');
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setActionLoading(true);
    try {
      await quoteAPI.resendEmail(id);
      toast.success('Email resent to client successfully');
      fetchQuote();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend email');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      draft: { label: 'Draft', class: 'badge-secondary' },
      quote_submitted: { label: 'Quote Submitted', class: 'badge-primary' },
      pending_manager_approval: { label: 'Pending Manager Approval', class: 'badge-warning' },
      manager_approved: { label: 'Manager Approved', class: 'badge-success' },
      manager_rejected: { label: 'Manager Rejected', class: 'badge-error' },
      pending_accountant: { label: 'Pending Accountant', class: 'badge-warning' },
      pending_designer: { label: 'Pending Designer', class: 'badge-primary' },
      completed_quote: { label: 'Quote Completed', class: 'badge-success' },
    };
    const s = statusMap[status] || { label: status, class: 'badge-secondary' };
    return <span className={`badge ${s.class}`}>{s.label}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!quote) return null;

  const canApproveManager = (isAdmin || isManager) && quote.status === 'pending_manager_approval';
  const canUpdateClientOrderStatus = (isAdmin || isSalesExecutive) && quote.status === 'manager_approved' && quote.clientOrderStatus === 'pending';
  const canConfirmAdvancePayment = (isAdmin || isAccountant || isManager) && quote.status === 'pending_accountant';
  const canUpdateDesign = (isAdmin || isDesigner || isManager) && quote.status === 'pending_designer';
  const canSubmit = quote.status === 'draft' || quote.status === 'manager_rejected';
  const canResendEmail = (isAdmin || isManager) && quote.status !== 'draft' && quote.status !== 'manager_rejected' && quote.status !== 'pending_manager_approval' && quote.clientEmail;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="btn btn-secondary p-2">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{quote.quoteNumber}</h1>
              {getStatusBadge(quote.status)}
            </div>
            <p className="text-muted-foreground">
              Created on {new Date(quote.createdAt).toLocaleDateString('en-GB')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {canSubmit && (
            <button 
              onClick={() => navigate(`/quotes/${id}/edit`)} 
              className="btn btn-secondary"
            >
              <Edit size={18} />
              Edit
            </button>
          )}
          <button 
            onClick={() => setShowPreview(!showPreview)} 
            className={`btn ${showPreview ? 'btn-primary' : 'btn-secondary'}`}
          >
            {showPreview ? <EyeOff size={18} /> : <Eye size={18} />}
            {showPreview ? 'Close Preview' : 'Preview'}
          </button>
          <button 
            onClick={handleDownloadPDF} 
            disabled={downloadLoading}
            className="btn btn-secondary"
          >
            {downloadLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download size={18} />
            )}
            Download PDF
          </button>
          {canResendEmail && (
            <button 
              onClick={handleResendEmail} 
              disabled={actionLoading}
              className="btn btn-secondary"
            >
              {actionLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <MailIcon size={18} />
              )}
              Resend Email
            </button>
          )}
          {canSubmit && (
            <button onClick={handleSubmit} disabled={actionLoading} className="btn btn-primary">
              {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send size={18} />}
              Submit
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Info */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Client Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{quote.clientName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{quote.clientEmail}</p>
                </div>
              </div>
              {quote.clientPhone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{quote.clientPhone}</p>
                  </div>
                </div>
              )}
              {quote.clientAddress && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">{quote.clientAddress}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Quote Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {quote.items?.map((item, index) => {
                const showPackingField = !['Injection', 'I.V/Fluid'].includes(item.formulationType);
                const packingValue = item.packing === 'Custom' ? (item.customPacking || '-') : (item.packing || '-');
                const packagingValue = item.packagingType === 'Custom' ? (item.customPackagingType || '-') : (item.packagingType || '-');
                const pvcValue = item.packagingType === 'Blister' 
                  ? (item.pvcType === 'Custom' ? (item.customPvcType || '-') : (item.pvcType || '-'))
                  : '-';
                const cartonValue = ['Syrup/Suspension', 'Dry Syrup'].includes(item.formulationType) 
                  ? (item.cartonPacking === 'Custom' ? (item.customCartonPacking || '-') : (item.cartonPacking || '-')) 
                  : '-';

                return (
                  <div key={index} className="p-5 border border-border/50 bg-card rounded-xl shadow-sm space-y-5 transition-all hover:border-border">
                    {/* Item Header */}
                    <div className="flex items-center justify-between border-b border-border/40 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                          {index + 1}
                        </span>
                        <div className="flex flex-col">
                          <span className="font-bold text-lg text-white">{item.brandName || 'Product Name'}</span>
                          <span className="font-semibold text-xs text-muted-foreground">Product Details</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {/* Product Specifications Section */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Brand Name */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-white uppercase tracking-wider">
                            Brand Name
                          </Label>
                          <div className="h-10 px-3 py-2 bg-background border border-input rounded-md text-sm flex items-center font-medium">
                            {item.brandName || '-'}
                          </div>
                        </div>

                        {/* Order Type */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-white uppercase tracking-wider">
                            Order Type
                          </Label>
                          <div className="h-10 px-3 py-2 bg-background border border-input rounded-md text-sm flex items-center">
                        <span className={`badge ${item.orderType === 'New' ? 'badge-success' : 'badge-secondary'}`}>
                          {item.orderType || '-'}
                        </span>
                          </div>
                        </div>
                        
                        {/* Category Type */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-white uppercase tracking-wider">
                            Category
                          </Label>
                          <div className="h-10 px-3 py-2 bg-background border border-input rounded-md text-sm flex items-center font-medium">
                            {item.categoryType || '-'}
                          </div>
                        </div>

                        {/* Formulation Type */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-white uppercase tracking-wider">
                            Formulation
                          </Label>
                          <div className="h-10 px-3 py-2 bg-background border border-input rounded-md text-sm flex items-center">
                            {item.formulationType || '-'}
                          </div>
                        </div>

                        {/* Colour of Soft Gelatin - Only for Soft Gelatine formulation */}
                        {item.formulationType === 'Soft Gelatine' && (
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-white uppercase tracking-wider">
                              Colour of Soft Gelatin
                            </Label>
                            <div className="h-10 px-3 py-2 bg-background border border-input rounded-md text-sm flex items-center">
                              {item.softGelatinColor || '-'}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Technical Specs Section */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Composition - taking full width */}
                        <div className="md:col-span-2 space-y-2">
                          <Label className="text-xs font-medium text-white uppercase tracking-wider">
                            Composition
                          </Label>
                          <div className="min-h-[40px] px-3 py-2 bg-background border border-input rounded-md text-sm flex items-center">
                            {item.composition || '-'}
                          </div>
                        </div>

                        {/* Packing (Box / Unit) - Conditional */}
                        {showPackingField && (
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-white uppercase tracking-wider">
                              {['Syrup/Suspension', 'Dry Syrup'].includes(item.formulationType) ? 'Unit Pack' : 'Box Packing'}
                            </Label>
                            <div className="h-10 px-3 py-2 bg-background border border-input rounded-md text-sm flex items-center">
                              {packingValue}
                            </div>
                          </div>
                        )}

                        {/* Packaging Type - Hide for Dry Injection */}
                        {!(item.formulationType === 'Injection' && item.injectionType === 'Dry Injection') && (
                          <div className={`space-y-2 ${!showPackingField ? 'md:col-span-2' : ''}`}>
                            <Label className="text-xs font-medium text-white uppercase tracking-wider">
                              {['Syrup/Suspension', 'Dry Syrup'].includes(item.formulationType) ? 'Label Type' : 'Packaging Type'}
                            </Label>
                            <div className="h-10 px-3 py-2 bg-background border border-input rounded-md text-sm flex items-center">
                              {packagingValue}
                            </div>
                          </div>
                        )}

                        {/* PVC Type Field - Only for Blister packaging */}
                        {item.packagingType === 'Blister' && (
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-white uppercase tracking-wider">
                              PVC Type
                            </Label>
                            <div className="h-10 px-3 py-2 bg-background border border-input rounded-md text-sm flex items-center">
                              {pvcValue}
                            </div>
                          </div>
                        )}

                        {/* Carton Field - Only for Syrup/Suspension and Dry Syrup */}
                        {['Syrup/Suspension', 'Dry Syrup'].includes(item.formulationType) && (
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-white uppercase tracking-wider">
                              Carton
                            </Label>
                            <div className="h-10 px-3 py-2 bg-background border border-input rounded-md text-sm flex items-center">
                              {cartonValue}
                            </div>
                          </div>
                        )}

                        {/* Specification - Optional */}
                        <div className="md:col-span-2 space-y-2">
                          <Label className="text-xs font-medium text-white uppercase tracking-wider">
                            Specification
                          </Label>
                          <div className="min-h-[40px] px-3 py-2 bg-background border border-input rounded-md text-sm flex items-center">
                            {item.specification || '-'}
                          </div>
                        </div>
                      </div>

                      <Separator className="bg-border/40" />

                      {/* Commercials Section */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-end">
                        {/* Quantity */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-white uppercase tracking-wider">
                            Quantity
                          </Label>
                          <div className="relative">
                            <div className="h-12 px-3 py-2 bg-background border border-input rounded-md text-lg font-medium flex items-center">
                              {item.quantity || 0}
                            </div>
                            <span className="absolute right-3 top-3.5 text-xs text-muted-foreground">Units</span>
                          </div>
                        </div>

                        {/* MRP */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-white uppercase tracking-wider">
                            MRP (₹)
                          </Label>
                          <div className="h-12 px-3 py-2 bg-background border border-input rounded-md text-lg flex items-center">
                            ₹{item.mrp?.toFixed(2) || '0.00'}
                          </div>
                        </div>

                        {/* Our Rate */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-white uppercase tracking-wider">
                            Our Rate (₹)
                          </Label>
                          <div className="h-12 px-3 py-2 bg-background border border-primary/20 rounded-md text-xl font-bold text-primary flex items-center">
                            ₹{item.rate?.toFixed(2) || '0.00'}
            </div>
          </div>

                        {/* Total Amount Display */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-white uppercase tracking-wider">
                            Total Amount
                          </Label>
                          <div className="h-12 px-3 py-2 bg-primary/10 border border-primary/30 rounded-md text-lg font-bold text-primary flex items-center">
                            ₹{((item.quantity || 0) * (item.rate || 0))?.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Approval Actions */}
          {canApproveManager && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Approval Action</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Comments</label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Add comments (required for rejection)"
                    className="input min-h-[80px]"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleApproveManager}
                    disabled={actionLoading}
                    className="btn btn-success flex-1"
                  >
                    {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check size={18} />}
                    Approve
                  </button>
                  <button
                    onClick={handleRejectManager}
                    disabled={actionLoading}
                    className="btn btn-danger flex-1"
                  >
                    {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <X size={18} />}
                    Reject
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Client Order Status (Manager) */}
          {canUpdateClientOrderStatus && (
        <div className="card">
              <h2 className="text-lg font-semibold mb-4">Client Order Status</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={selectedClientStatus}
                    onChange={(e) => setSelectedClientStatus(e.target.value)}
                    disabled={actionLoading}
                    className="input"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                  </select>
                </div>
                
                {selectedClientStatus === 'approved' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Advance Amount Received (₹)</label>
                    <input
                      type="number"
                      value={advanceAmountInput}
                      onChange={(e) => setAdvanceAmountInput(e.target.value)}
                      placeholder="Enter amount"
                      className="input"
                      disabled={actionLoading}
                    />
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleUpdateClientOrderStatus}
                    disabled={actionLoading}
                    className="btn btn-primary"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check size={16} className="mr-2" />}
                    Update Status
                  </button>
                </div>

                <p className="text-sm text-muted-foreground mt-2">
                  When set to "Approved", the quote will be sent to the Accountant for verification.
                </p>
              </div>
            </div>
          )}

          {/* Accountant Actions */}
          {canConfirmAdvancePayment && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Accountant Action</h2>
              <div className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Quote Total:</span>
                    <span className="font-semibold">₹{quote.totalAmount?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-primary">
                    <span className="font-medium">Advance Amount Reported:</span>
                    <span className="font-bold text-lg">₹{quote.advanceAmount?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="text-xs text-muted-foreground pt-1">
                    Received by Sales Executive/Admin
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  Confirm that the advance payment listed above has been received in the bank account.
                </p>
                <button
                  onClick={() => setShowVerifyConfirm(true)}
                  disabled={actionLoading}
                  className="btn btn-success w-full"
                >
                  {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check size={18} />}
                  Verify & Confirm Payment
                </button>
              </div>
            </div>
          )}

      <ConfirmDialog
        isOpen={showVerifyConfirm}
        onClose={() => setShowVerifyConfirm(false)}
        onConfirm={() => {
          setShowVerifyConfirm(false);
          handleConfirmAdvancePayment();
        }}
        title="Verify Advance Payment"
        message={`Are you sure you want to verify that ₹${quote.advanceAmount?.toFixed(2)} has been received? This will move the quote to the Designer.`}
        confirmText="Verify Payment"
        variant="default"
      />

          {/* Designer Actions */}
          {canUpdateDesign && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Design Status</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={quote.designStatus || 'pending'}
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      quoteAPI.updateDesign(id, { 
                        designStatus: newStatus,
                        designNotes: quote.designNotes || ''
                      }).then(() => {
                        toast.success('Design status updated');
                        fetchQuote();
                      }).catch(() => {
                        toast.error('Failed to update design status');
                      });
                    }}
                    disabled={actionLoading || quote.clientDesignApprovedAt}
                    className="input"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                  </select>
                </div>

                {/* Client Approval Button - Show when In Progress and not yet client approved */}
                {quote.designStatus === 'in_progress' && !quote.clientDesignApprovedAt && (
                  <div className="space-y-3">
                    <button
                      onClick={async () => {
                        setActionLoading(true);
                        try {
                          await quoteAPI.confirmClientDesignApproval(id);
                          toast.success('Client approval confirmed!');
                          fetchQuote();
                        } catch (error) {
                          toast.error('Failed to confirm client approval');
                        } finally {
                          setActionLoading(false);
                        }
                      }}
                      disabled={actionLoading}
                      className="btn btn-success w-full"
                    >
                      {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check size={18} />}
                      Client Approved
                    </button>
                  </div>
                )}

                {/* Show Client Approval Timestamp */}
                {quote.clientDesignApprovedAt && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <p className="text-sm text-green-500 font-semibold mb-1 flex items-center gap-2">
                      <Check size={16} />
                      Client Approved
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Approved on: {new Date(quote.clientDesignApprovedAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })} at {new Date(quote.clientDesignApprovedAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </p>
                  </div>
                )}

                {/* Manufacturer Approval Button - Show after client approval and not yet manufacturer approved */}
                {quote.clientDesignApprovedAt && !quote.manufacturerDesignApprovedAt && (
                  <div className="space-y-3">
                    <button
                      onClick={async () => {
                        setActionLoading(true);
                        try {
                          await quoteAPI.confirmManufacturerDesignApproval(id);
                          toast.success('Manufacturer approval confirmed! Quote is now completed.');
                          fetchQuote();
                        } catch (error) {
                          toast.error('Failed to confirm manufacturer approval');
                        } finally {
                          setActionLoading(false);
                        }
                      }}
                      disabled={actionLoading}
                      className="btn btn-success w-full"
                    >
                      {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check size={18} />}
                      Manufacture Approve
                    </button>
                  </div>
                )}

                {/* Show Manufacturer Approval Timestamp */}
                {quote.manufacturerDesignApprovedAt && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <p className="text-sm text-green-500 font-semibold mb-1 flex items-center gap-2">
                      <Check size={16} />
                      Manufacture Approved
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Approved on: {new Date(quote.manufacturerDesignApprovedAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })} at {new Date(quote.manufacturerDesignApprovedAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </p>
                  </div>
                )}

                {/* Final Status Message */}
                {quote.status === 'completed' && quote.manufacturerDesignApprovedAt && (
                  <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                    <p className="text-sm text-primary font-semibold">
                      🎉 Quote is completed and ready for Purchase Order creation!
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Design Notes</label>
                  <textarea
                    value={quote.designNotes || ''}
                    onChange={(e) => {
                      quoteAPI.updateDesign(id, { 
                        designStatus: quote.designStatus || 'pending',
                        designNotes: e.target.value
                      }).then(() => {
                        fetchQuote();
                      }).catch(() => {
                        toast.error('Failed to update design notes');
                      });
                    }}
                    placeholder="Add design notes..."
                    className="input min-h-[80px]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Summary */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{quote.subtotal?.toFixed(2)}</span>
              </div>
              {(() => {
                const subtotal = quote.subtotal || 0;
                const cylinderCharges = parseFloat(quote.cylinderCharges) || 0;
                const inventoryCharges = parseFloat(quote.inventoryCharges) || 0;
                const taxPercent = parseFloat(quote.taxPercent) || 0;
                const taxPercentOnCharges = 18; // Fixed at 18%
                const taxOnSubtotal = (subtotal * taxPercent) / 100;
                const chargesTotal = cylinderCharges + inventoryCharges;
                const taxOnCharges = (chargesTotal * taxPercentOnCharges) / 100;
                const totalTax = taxOnSubtotal + taxOnCharges;
                
                return (
                  <>
                    {taxOnSubtotal > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax on Subtotal ({taxPercent}%)</span>
                        <span>₹{taxOnSubtotal.toFixed(2)}</span>
                      </div>
                    )}
                    {(cylinderCharges || 0) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Cylinder Charges
                          {(quote.numberOfCylinders || 0) > 0 && (
                            <span className="text-xs ml-1">({quote.numberOfCylinders} Cylinder{quote.numberOfCylinders > 1 ? 's' : ''})</span>
                          )}
                        </span>
                        <span>₹{quote.cylinderCharges?.toFixed(2)}</span>
                      </div>
                    )}
                    {(inventoryCharges || 0) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Inventory Charges</span>
                        <span>₹{quote.inventoryCharges?.toFixed(2)}</span>
                      </div>
                    )}
                    {taxOnCharges > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax on Cylinder & Inventory Charges (18%)</span>
                        <span>₹{taxOnCharges.toFixed(2)}</span>
                      </div>
                    )}
                    {totalTax > 0 && (
                      <div className="flex justify-between font-semibold">
                        <span className="text-muted-foreground">Total Tax</span>
                        <span>₹{totalTax.toFixed(2)}</span>
                      </div>
                    )}
                  </>
                );
              })()}
              {quote.discount > 0 && (
                <div className="flex justify-between text-green-500">
                  <span>Discount ({quote.discountPercent}%)</span>
                  <span>-₹{quote.discount?.toFixed(2)}</span>
                </div>
              )}
              <hr className="border-border" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">₹{quote.totalAmount?.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between font-medium text-muted-foreground pt-2">
                <span>Advance Payment (35%)</span>
                <span>₹{((quote.totalAmount || 0) * 0.35).toFixed(2)}</span>
              </div>

              {quote.advanceAmount > 0 && (
                <div className="flex justify-between font-medium text-green-500">
                  <span>Advance Received</span>
                  <span>-₹{quote.advanceAmount.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Approval History */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Approval History</h2>
            <div className="space-y-3">
              {/* Quote Created */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-500">
                    <Check size={16} className="text-white" />
                  </div>
                  <div className="w-0.5 h-full bg-border mt-2" />
                </div>
                <div className="flex-1 pb-4">
                  <p className="font-medium">Quote Created</p>
                  <p className="text-xs text-muted-foreground">
                    Created by {quote.createdByName || 'Sales Person'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(quote.createdAt).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })} at {new Date(quote.createdAt).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </p>
                </div>
              </div>

              {/* Manager Approval */}
              {quote.managerApproval && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      quote.managerApproval?.status === 'approved' 
                        ? 'bg-green-500' 
                        : quote.managerApproval?.status === 'rejected'
                        ? 'bg-red-500'
                        : 'bg-gray-500'
                    }`}>
                      {quote.managerApproval?.status === 'approved' ? (
                        <Check size={16} className="text-white" />
                      ) : quote.managerApproval?.status === 'rejected' ? (
                        <X size={16} className="text-white" />
                      ) : (
                        <span className="text-xs text-white">M</span>
                      )}
                    </div>
                    <div className="w-0.5 h-full bg-border mt-2" />
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-medium">Manager Approval</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {quote.managerApproval?.status || 'Pending'}
                    </p>
                    {quote.managerApproval?.approvedAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(quote.managerApproval.approvedAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })} at {new Date(quote.managerApproval.approvedAt).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </p>
                    )}
                    {quote.managerApproval?.comments && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        Comments: {quote.managerApproval.comments}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Client Approval */}
              {(quote.status === 'approved' || quote.status === 'pending_accountant' || quote.status === 'pending_designer' || quote.status === 'completed') && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      quote.clientOrderStatus === 'approved' 
                        ? 'bg-green-500' 
                        : 'bg-gray-500'
                    }`}>
                      {quote.clientOrderStatus === 'approved' ? (
                        <Check size={16} className="text-white" />
                      ) : (
                        <span className="text-xs text-white">C</span>
                      )}
                    </div>
                    <div className="w-0.5 h-full bg-border mt-2" />
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-medium">Client Order Confirmation</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {quote.clientOrderStatus || 'Pending'}
                    </p>
                    {quote.clientOrderApprovedBy && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Approved by: {quote.clientOrderApprovedBy?.name || 'Unknown'}
                      </p>
                    )}
                    {quote.clientOrderApprovedAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(quote.clientOrderApprovedAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })} at {new Date(quote.clientOrderApprovedAt).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </p>
                    )}
                    {quote.advanceAmount && (
                      <p className="text-xs text-green-500 mt-1 font-medium">
                        Advance Received: ₹{quote.advanceAmount?.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Accountant Approval */}
              {(quote.status === 'pending_accountant' || quote.status === 'pending_designer' || quote.status === 'completed' || quote.accountantApproval) && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      quote.accountantApproval?.status === 'approved' 
                        ? 'bg-green-500' 
                        : quote.accountantApproval?.status === 'rejected'
                        ? 'bg-red-500'
                        : quote.status === 'pending_accountant'
                        ? 'bg-yellow-500 animate-pulse'
                        : 'bg-gray-500'
                    }`}>
                      {quote.accountantApproval?.status === 'approved' ? (
                        <Check size={16} className="text-white" />
                      ) : quote.accountantApproval?.status === 'rejected' ? (
                        <X size={16} className="text-white" />
                      ) : (
                        <span className="text-xs text-white">A</span>
                      )}
                    </div>
                    <div className="w-0.5 h-full bg-border mt-2" />
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-medium">
                      Accountant Approval
                      {quote.status === 'pending_accountant' && (
                        <span className="ml-2 text-xs text-yellow-500">(In Progress)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {quote.accountantApproval?.status || (quote.status === 'pending_accountant' ? 'Pending' : 'Not Started')}
                    </p>
                    {quote.accountantApproval?.approvedAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(quote.accountantApproval.approvedAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })} at {new Date(quote.accountantApproval.approvedAt).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </p>
                    )}
                    {quote.advancePaymentReceivedAt && (
                      <p className="text-xs text-green-500 mt-1">
                        ✓ Payment confirmed: {new Date(quote.advancePaymentReceivedAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })} at {new Date(quote.advancePaymentReceivedAt).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Designer Status */}
              {(quote.status === 'pending_designer' || quote.status === 'completed' || quote.designStatus !== 'pending') && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      quote.designStatus === 'approved' || quote.designStatus === 'quote_approved'
                        ? 'bg-green-500' 
                        : quote.designStatus === 'in_progress'
                        ? 'bg-blue-500'
                        : quote.status === 'pending_designer'
                        ? 'bg-yellow-500 animate-pulse'
                        : 'bg-gray-500'
                    }`}>
                      {quote.designStatus === 'in_progress' ? (
                        <span className="text-xs text-white">D</span>
                      ) : (
                        <span className="text-xs text-white">D</span>
                      )}
                    </div>
                    <div className="w-0.5 h-full bg-border mt-2" />
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-medium">
                      Designer Status
                      {quote.status === 'pending_designer' && (
                        <span className="ml-2 text-xs text-yellow-500">(In Progress)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {quote.designStatus || 'Pending'}
                    </p>
                    {quote.designNotes && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        Notes: {quote.designNotes}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Client Design Approval */}
              {quote.clientDesignApprovedAt && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-500">
                      <Check size={16} className="text-white" />
                    </div>
                    <div className="w-0.5 h-full bg-border mt-2" />
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-medium">Client Design Approved</p>
                    <p className="text-xs text-green-500">Approved</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(quote.clientDesignApprovedAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })} at {new Date(quote.clientDesignApprovedAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </p>
                  </div>
                </div>
              )}

              {/* Manufacturer Design Approval */}
              {quote.manufacturerDesignApprovedAt && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-500">
                      <Check size={16} className="text-white" />
                    </div>
                    {quote.status === 'completed' && <div className="w-0.5 h-full bg-border mt-2" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-medium">Manufacturer Design Approved</p>
                    <p className="text-xs text-green-500">Approved</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(quote.manufacturerDesignApprovedAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })} at {new Date(quote.manufacturerDesignApprovedAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </p>
                  </div>
                </div>
              )}

              {/* Completed Status */}
              {quote.status === 'completed' && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-500">
                      <Check size={16} className="text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-green-500">Order Completed</p>
                    <p className="text-xs text-muted-foreground">
                      All approvals received
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>



      {/* Preview Panel - Always rendered for PDF generation, hidden when not toggled */}
      <div className={`card mt-6 border-2 border-primary ${showPreview ? '' : 'fixed left-[-9999px] top-0 w-[210mm]'}`}>
        <div className="p-4 bg-primary/10 border-b border-border">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Eye size={20} />
            Quote Preview
          </h2>
        </div>
        
        <QuotePreview quote={quote} isDraft={false} />








        </div>
    </div>
  );
};

export default QuoteDetail;
