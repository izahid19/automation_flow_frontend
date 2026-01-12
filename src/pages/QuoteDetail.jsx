import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  Edit
} from 'lucide-react';
import toast from 'react-hot-toast';
import QuotePreview from '@/components/QuotePreview';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { Label } from '../components/ui/label';

const QuoteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isSalesExecutive, isMD, isDesigner } = useAuth();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const hasSoftGelatin = quote?.items?.some(item => item.formulationType === 'Soft Gelatine');
  const hasBlister = quote?.items?.some(item => item.packagingType === 'Blister');
  const [actionLoading, setActionLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [comments, setComments] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const previewRef = useRef(null);
  const [companySettings, setCompanySettings] = useState({
    companyPhone: '+917696275527',
    companyEmail: 'user@gmail.com',
    invoiceLabel: 'QUOTATION'
  });

  useEffect(() => {
    fetchQuote();
    fetchCompanySettings();
  }, [id]);

  const fetchCompanySettings = async () => {
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
  };

  const fetchQuote = async () => {
    try {
      const response = await quoteAPI.getOne(id);
      setQuote(response.data.data);
    } catch (error) {
      toast.error('Failed to load quote');
      navigate('/quotes');
    } finally {
      setLoading(false);
    }
  };

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

  const getStatusBadge = (status) => {
    const statusMap = {
      draft: { label: 'Draft', class: 'badge-secondary' },
      pending_se_approval: { label: 'Pending SE Approval', class: 'badge-warning' },
      pending_md_approval: { label: 'Pending MD Approval', class: 'badge-warning' },
      approved: { label: 'Approved', class: 'badge-success' },
      rejected: { label: 'Rejected', class: 'badge-error' },
      design_pending: { label: 'Design Pending', class: 'badge-primary' },
      design_approved: { label: 'Design Approved', class: 'badge-success' },
      po_created: { label: 'PO Created', class: 'badge-success' },
    };
    const s = statusMap[status] || { label: status, class: 'badge-secondary' };
    return <span className={`badge ${s.class}`}>{s.label}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (!quote) return null;

  const canApproveSE = (isAdmin || isSalesExecutive) && quote.status === 'pending_se_approval';
  const canApproveMD = (isAdmin || isMD) && quote.status === 'pending_md_approval';
  const canSubmit = quote.status === 'draft';

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
            <p className="text-[var(--text-secondary)]">
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
                <User className="w-5 h-5 text-[var(--text-secondary)]" />
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">Name</p>
                  <p className="font-medium">{quote.clientName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[var(--text-secondary)]" />
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">Email</p>
                  <p className="font-medium">{quote.clientEmail}</p>
                </div>
              </div>
              {quote.clientPhone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-[var(--text-secondary)]" />
                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">Phone</p>
                    <p className="font-medium">{quote.clientPhone}</p>
                  </div>
                </div>
              )}
              {quote.clientAddress && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-[var(--text-secondary)]" />
                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">Address</p>
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

                        {/* Color of Soft Gelatin - Only for Soft Gelatine formulation */}
                        {item.formulationType === 'Soft Gelatine' && (
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-white uppercase tracking-wider">
                              Color of Soft Gelatin
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

                        {/* Packaging Type */}
                        <div className={`space-y-2 ${!showPackingField ? 'md:col-span-2' : ''}`}>
                          <Label className="text-xs font-medium text-white uppercase tracking-wider">
                            {['Syrup/Suspension', 'Dry Syrup'].includes(item.formulationType) ? 'Label Type' : 'Packaging Type'}
                          </Label>
                          <div className="h-10 px-3 py-2 bg-background border border-input rounded-md text-sm flex items-center">
                            {packagingValue}
                          </div>
                        </div>

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
          {(canApproveSE || canApproveMD) && (
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
                    onClick={canApproveSE ? handleApproveSE : handleApproveMD}
                    disabled={actionLoading}
                    className="btn btn-success flex-1"
                  >
                    {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check size={18} />}
                    Approve
                  </button>
                  <button
                    onClick={canApproveSE ? handleRejectSE : handleRejectMD}
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
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Summary */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Subtotal</span>
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
                        <span className="text-[var(--text-secondary)]">Tax on Subtotal ({taxPercent}%)</span>
                        <span>₹{taxOnSubtotal.toFixed(2)}</span>
                      </div>
                    )}
                    {(cylinderCharges || 0) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">Cylinder Charges</span>
                        <span>₹{quote.cylinderCharges?.toFixed(2)}</span>
                      </div>
                    )}
                    {(inventoryCharges || 0) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">Inventory Charges</span>
                        <span>₹{quote.inventoryCharges?.toFixed(2)}</span>
                      </div>
                    )}
                    {taxOnCharges > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">Tax on Cylinder & Inventory Charges (18%)</span>
                        <span>₹{taxOnCharges.toFixed(2)}</span>
                      </div>
                    )}
                    {totalTax > 0 && (
                      <div className="flex justify-between font-semibold">
                        <span className="text-[var(--text-secondary)]">Total Tax</span>
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
              <hr className="border-[var(--border)]" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-[var(--primary)]">₹{quote.totalAmount?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Approval Status */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Approval Status</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  quote.salesExecutiveApproval?.status === 'approved' 
                    ? 'bg-green-500' 
                    : quote.salesExecutiveApproval?.status === 'rejected'
                    ? 'bg-red-500'
                    : 'bg-[var(--surface-hover)]'
                }`}>
                  {quote.salesExecutiveApproval?.status === 'approved' ? (
                    <Check size={16} className="text-white" />
                  ) : quote.salesExecutiveApproval?.status === 'rejected' ? (
                    <X size={16} className="text-white" />
                  ) : (
                    <span className="text-xs">SE</span>
                  )}
                </div>
                <div>
                  <p className="font-medium">Sales Executive</p>
                  <p className="text-xs text-[var(--text-secondary)] capitalize">
                    {quote.salesExecutiveApproval?.status || 'Pending'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  quote.mdApproval?.status === 'approved' 
                    ? 'bg-green-500' 
                    : quote.mdApproval?.status === 'rejected'
                    ? 'bg-red-500'
                    : 'bg-[var(--surface-hover)]'
                }`}>
                  {quote.mdApproval?.status === 'approved' ? (
                    <Check size={16} className="text-white" />
                  ) : quote.mdApproval?.status === 'rejected' ? (
                    <X size={16} className="text-white" />
                  ) : (
                    <span className="text-xs">MD</span>
                  )}
                </div>
                <div>
                  <p className="font-medium">Managing Director</p>
                  <p className="text-xs text-[var(--text-secondary)] capitalize">
                    {quote.mdApproval?.status || 'Pending'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* Preview Panel - Always rendered for PDF generation, hidden when not toggled */}
      <div className={`card mt-6 border-2 border-[var(--primary)] ${showPreview ? '' : 'fixed left-[-9999px] top-0 w-[210mm]'}`}>
        <div className="p-4 bg-[var(--primary)]/10 border-b border-[var(--border)]">
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
