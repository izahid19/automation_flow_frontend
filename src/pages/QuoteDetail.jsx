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
  Eye,
  EyeOff,
  Edit,
  Mail as MailIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import QuotePreview from '@/components/QuotePreview';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '@/components/ui/button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { StatusBadge, ApprovalHistory } from '@/components/shared';
import { QuoteItemDetail } from '@/components/quote';
import { formatCurrency, formatDate, formatTime } from '@/utils/formatters';

const QuoteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isSalesExecutive, isManager, isMD, isDesigner, isAccountant } = useAuth();
  const { socket } = useSocket();
  
  // State
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [comments, setComments] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showVerifyConfirm, setShowVerifyConfirm] = useState(false);
  const [selectedClientStatus, setSelectedClientStatus] = useState('pending');
  const [advanceAmountInput, setAdvanceAmountInput] = useState('');
  const previewRef = useRef(null);
  
  const [companySettings, setCompanySettings] = useState({
    companyPhone: '+917696275527',
    companyEmail: 'user@gmail.com',
    invoiceLabel: 'QUOTATION'
  });

  // Sync client status when quote loads
  useEffect(() => {
    if (quote) {
      setSelectedClientStatus(quote.clientOrderStatus || 'pending');
      if (quote.advanceAmount) setAdvanceAmountInput(quote.advanceAmount);
    }
  }, [quote]);

  // Fetch company settings
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

  // Fetch quote
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

  // Real-time socket updates
  useEffect(() => {
    if (!socket || !id) return;

    const handleQuoteUpdate = (data) => {
      if (data.quote?._id === id || data.quote?.id === id) {
        fetchQuote();
      }
    };

    const events = [
      'quote:updated', 'quote:approved', 'quote:rejected',
      'quote:design-updated', 'quote:client-approved',
      'quote:client-order-updated', 'quote:advance-payment-received',
      'quote:completed', 'quote:client-design-approved'
    ];

    events.forEach(event => socket.on(event, handleQuoteUpdate));
    return () => events.forEach(event => socket.off(event, handleQuoteUpdate));
  }, [socket, id, fetchQuote]);

  // Action handlers
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

  const handleUpdateDesignStatus = async (newStatus) => {
    try {
      await quoteAPI.updateDesign(id, { 
        designStatus: newStatus,
        designNotes: quote.designNotes || ''
      });
      toast.success('Design status updated');
      fetchQuote();
    } catch (error) {
      toast.error('Failed to update design status');
    }
  };

  const handleUpdateDesignNotes = async (notes) => {
    try {
      await quoteAPI.updateDesign(id, { 
        designStatus: quote.designStatus || 'pending',
        designNotes: notes
      });
      fetchQuote();
    } catch (error) {
      toast.error('Failed to update design notes');
    }
  };

  const handleConfirmClientDesignApproval = async () => {
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
  };

  const handleConfirmManufacturerDesignApproval = async () => {
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
  };

  // Calculate summary totals
  const calculateTotals = () => {
    if (!quote) return {};
    
    const subtotal = quote.subtotal || 0;
    const cylinderCharges = parseFloat(quote.cylinderCharges) || 0;
    const inventoryCharges = parseFloat(quote.inventoryCharges) || 0;
    const taxPercent = parseFloat(quote.taxPercent) || 0;
    const taxPercentOnCharges = 18;
    
    const taxOnSubtotal = (subtotal * taxPercent) / 100;
    const chargesTotal = cylinderCharges + inventoryCharges;
    const taxOnCharges = (chargesTotal * taxPercentOnCharges) / 100;
    const totalTax = taxOnSubtotal + taxOnCharges;
    
    return { taxOnSubtotal, taxOnCharges, totalTax };
  };

  const { taxOnSubtotal, taxOnCharges, totalTax } = calculateTotals();

  // Permission checks
  const permissions = {
    canApproveManager: (isAdmin || isManager) && quote?.status === 'pending_manager_approval',
    canUpdateClientOrderStatus: (isAdmin || isSalesExecutive) && quote?.status === 'manager_approved' && quote?.clientOrderStatus === 'pending',
    canConfirmAdvancePayment: (isAdmin || isAccountant || isManager) && quote?.status === 'pending_accountant',
    canUpdateDesign: (isAdmin || isDesigner || isManager) && quote?.status === 'pending_designer',
    canEdit: quote?.status === 'draft' || quote?.status === 'manager_rejected' || quote?.status === 'quote_rejected' || (isSalesExecutive && quote?.status !== 'completed_quote'),
    canSubmit: quote?.status === 'draft' || quote?.status === 'manager_rejected' || quote?.status === 'quote_rejected',
    canResendEmail: (isAdmin || isManager) && quote?.status !== 'draft' && quote?.status !== 'manager_rejected' && quote?.status !== 'pending_manager_approval' && quote?.clientEmail,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!quote) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{quote.quoteNumber}</h1>
              <StatusBadge status={quote.status} type="quote" />
            </div>
            <p className="text-muted-foreground">
              Created on {formatDate(quote.createdAt)}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {permissions.canEdit && (
            <Button variant="secondary" onClick={() => navigate(`/quotes/${id}/edit`)}>
              <Edit size={18} />
              Edit
            </Button>
          )}
          <Button 
            variant={showPreview ? "default" : "secondary"}
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? <EyeOff size={18} /> : <Eye size={18} />}
            {showPreview ? 'Close Preview' : 'Preview'}
          </Button>
          <Button 
            variant="secondary"
            onClick={handleDownloadPDF} 
            disabled={downloadLoading}
          >
            {downloadLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download size={18} />
            )}
            Download PDF
          </Button>
          {permissions.canResendEmail && (
            <Button 
              variant="secondary"
              onClick={handleResendEmail} 
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <MailIcon size={18} />
              )}
              Resend Email
            </Button>
          )}
          {permissions.canSubmit && (
            <Button onClick={handleSubmit} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send size={18} />}
              Submit
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Info */}
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Quote Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {quote.items?.map((item, index) => (
                <QuoteItemDetail key={index} item={item} index={index} />
              ))}
            </CardContent>
          </Card>

          {/* Manager Approval Actions */}
          {permissions.canApproveManager && (
            <Card>
              <CardHeader>
                <CardTitle>Approval Action</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  <Button
                    variant="default"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={handleApproveManager}
                    disabled={actionLoading}
                  >
                    {actionLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Check size={18} className="mr-2" />}
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleRejectManager}
                    disabled={actionLoading}
                  >
                    {actionLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <X size={18} className="mr-2" />}
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Client Order Status (Sales Executive) */}
          {permissions.canUpdateClientOrderStatus && (
            <Card>
              <CardHeader>
                <CardTitle>Client Order Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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

                <Button
                  className="w-full"
                  onClick={handleUpdateClientOrderStatus}
                  disabled={actionLoading}
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check size={16} className="mr-2" />}
                  Update Status
                </Button>

                <p className="text-sm text-muted-foreground">
                  When set to "Approved", the quote will be sent to the Accountant for verification.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Accountant Actions */}
          {permissions.canConfirmAdvancePayment && (
            <Card>
              <CardHeader>
                <CardTitle>Accountant Action</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Quote Total:</span>
                    <span className="font-semibold">{formatCurrency(quote.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-primary">
                    <span className="font-medium">Advance Amount Reported:</span>
                    <span className="font-bold text-lg">{formatCurrency(quote.advanceAmount || 0)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground pt-1">
                    Received by Sales Executive/Admin
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  Confirm that the advance payment listed above has been received in the bank account.
                </p>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => setShowVerifyConfirm(true)}
                  disabled={actionLoading}
                >
                  {actionLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Check size={18} className="mr-2" />}
                  Verify & Confirm Payment
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Designer Actions */}
          {permissions.canUpdateDesign && (
            <Card>
              <CardHeader>
                <CardTitle>Design Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={quote.designStatus || 'pending'}
                    onChange={(e) => handleUpdateDesignStatus(e.target.value)}
                    disabled={actionLoading || quote.clientDesignApprovedAt}
                    className="input"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                  </select>
                </div>

                {/* Client Approval Button */}
                {quote.designStatus === 'in_progress' && !quote.clientDesignApprovedAt && (
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={handleConfirmClientDesignApproval}
                    disabled={actionLoading}
                  >
                    {actionLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Check size={18} className="mr-2" />}
                    Client Approved
                  </Button>
                )}

                {/* Client Approval Timestamp */}
                {quote.clientDesignApprovedAt && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <p className="text-sm text-green-500 font-semibold mb-1 flex items-center gap-2">
                      <Check size={16} />
                      Client Approved
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Approved on: {formatDate(quote.clientDesignApprovedAt)} at {formatTime(quote.clientDesignApprovedAt)}
                    </p>
                  </div>
                )}

                {/* Manufacturer Approval Button */}
                {quote.clientDesignApprovedAt && !quote.manufacturerDesignApprovedAt && (
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={handleConfirmManufacturerDesignApproval}
                    disabled={actionLoading}
                  >
                    {actionLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Check size={18} className="mr-2" />}
                    Manufacture Approve
                  </Button>
                )}

                {/* Manufacturer Approval Timestamp */}
                {quote.manufacturerDesignApprovedAt && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <p className="text-sm text-green-500 font-semibold mb-1 flex items-center gap-2">
                      <Check size={16} />
                      Manufacture Approved
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Approved on: {formatDate(quote.manufacturerDesignApprovedAt)} at {formatTime(quote.manufacturerDesignApprovedAt)}
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
                    onChange={(e) => handleUpdateDesignNotes(e.target.value)}
                    placeholder="Add design notes..."
                    className="input min-h-[80px]"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(quote.subtotal)}</span>
              </div>
              
              {taxOnSubtotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax on Subtotal ({quote.taxPercent}%)</span>
                  <span>{formatCurrency(taxOnSubtotal)}</span>
                </div>
              )}
              
              {(quote.cylinderCharges || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Cylinder Charges
                    {(quote.numberOfCylinders || 0) > 0 && (
                      <span className="text-xs ml-1">({quote.numberOfCylinders} Cylinder{quote.numberOfCylinders > 1 ? 's' : ''})</span>
                    )}
                  </span>
                  <span>{formatCurrency(quote.cylinderCharges)}</span>
                </div>
              )}
              
              {(quote.inventoryCharges || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Inventory Charges</span>
                  <span>{formatCurrency(quote.inventoryCharges)}</span>
                </div>
              )}
              
              {taxOnCharges > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax on Cylinder & Inventory Charges (18%)</span>
                  <span>{formatCurrency(taxOnCharges)}</span>
                </div>
              )}
              
              {totalTax > 0 && (
                <div className="flex justify-between font-semibold">
                  <span className="text-muted-foreground">Total Tax</span>
                  <span>{formatCurrency(totalTax)}</span>
                </div>
              )}
              
              {quote.discount > 0 && (
                <div className="flex justify-between text-green-500">
                  <span>Discount ({quote.discountPercent}%)</span>
                  <span>-{formatCurrency(quote.discount)}</span>
                </div>
              )}
              
              <hr className="border-border" />
              
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(quote.totalAmount)}</span>
              </div>
              
              <div className="flex justify-between font-medium text-muted-foreground pt-2">
                <span>Advance Payment (35%)</span>
                <span>{formatCurrency((quote.totalAmount || 0) * 0.35)}</span>
              </div>

              {quote.advanceAmount > 0 && (
                <div className="flex justify-between font-medium text-green-500">
                  <span>Advance Received</span>
                  <span>-{formatCurrency(quote.advanceAmount)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Approval History */}
          <ApprovalHistory 
            history={quote.history} 
            quote={quote}
            type="quote"
          />
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showVerifyConfirm}
        onClose={() => setShowVerifyConfirm(false)}
        onConfirm={() => {
          setShowVerifyConfirm(false);
          handleConfirmAdvancePayment();
        }}
        title="Verify Advance Payment"
        message={`Are you sure you want to verify that ${formatCurrency(quote.advanceAmount)} has been received? This will move the quote to the Designer.`}
        confirmText="Verify Payment"
        variant="default"
      />

      {/* Preview Panel - Hidden when not toggled */}
      <div className={`mt-6 ${showPreview ? '' : 'fixed left-[-9999px] top-0 w-[210mm]'}`}>
        <Card className="border-2 border-primary overflow-hidden shadow-xl">
          <CardHeader className="bg-primary/5 py-4 border-b border-primary/10">
            <CardTitle className="text-lg font-semibold flex items-center gap-2 text-primary">
              <Eye size={20} />
              Quote Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 bg-secondary/10">
            <div className="w-full h-[850px] overflow-auto p-4 md:p-8 custom-scrollbar">
              <div className="min-w-[1000px] max-w-[1000px] mx-auto bg-white shadow-[0_0_50px_-12px_rgba(0,0,0,0.3)] ring-1 ring-border rounded-sm">
                <QuotePreview quote={quote} isDraft={false} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QuoteDetail;
