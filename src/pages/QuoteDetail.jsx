import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { quoteAPI } from '../services/api';
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
  EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';
import html2pdf from 'html2pdf.js';

const QuoteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isSalesExecutive, isMD, isDesigner } = useAuth();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [comments, setComments] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const previewRef = useRef(null);

  useEffect(() => {
    fetchQuote();
  }, [id]);

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
    // Generate PDF from preview on frontend
    if (!previewRef.current) {
      // If preview not visible, show it temporarily
      setShowPreview(true);
      // Wait for render
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const element = previewRef.current;
    if (!element) {
      toast.error('Unable to generate PDF');
      return;
    }

    const opt = {
      margin: 10,
      filename: `${quote.quoteNumber}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      await html2pdf().set(opt).from(element).save();
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to download PDF');
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
              Created on {new Date(quote.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowPreview(!showPreview)} 
            className={`btn ${showPreview ? 'btn-primary' : 'btn-secondary'}`}
          >
            {showPreview ? <EyeOff size={18} /> : <Eye size={18} />}
            {showPreview ? 'Close Preview' : 'Preview'}
          </button>
          <button onClick={handleDownloadPDF} className="btn btn-secondary">
            <Download size={18} />
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
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Quote Items</h2>
            <div className="overflow-x-auto">
              <table className="table" style={{ tableLayout: 'auto' }}>
                <thead>
                  <tr>
                    <th className="text-center whitespace-nowrap">#</th>
                    <th className="whitespace-nowrap">Brand Name</th>
                    <th className="whitespace-nowrap">Order Type</th>
                    <th className="whitespace-nowrap">Category</th>
                    <th className="whitespace-nowrap" style={{ minWidth: '200px' }}>Composition</th>
                    <th className="whitespace-nowrap">Formulation</th>
                    <th className="whitespace-nowrap">Packing</th>
                    <th className="text-center whitespace-nowrap">Qty</th>
                    <th className="text-right whitespace-nowrap">MRP</th>
                    <th className="text-right whitespace-nowrap">Rate</th>
                    <th className="text-right whitespace-nowrap">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.items?.map((item, index) => (
                    <tr key={index}>
                      <td className="text-center font-medium">{index + 1}</td>
                      <td className="font-medium">{item.brandName || '-'}</td>
                      <td>
                        <span className={`badge ${item.orderType === 'New' ? 'badge-success' : 'badge-secondary'}`}>
                          {item.orderType || '-'}
                        </span>
                      </td>
                      <td className="text-sm">{item.categoryType || '-'}</td>
                      <td className="text-sm">{item.composition || '-'}</td>
                      <td className="text-sm">{item.formulationType || '-'}</td>
                      <td className="text-sm">{item.packing || '-'}</td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-right">₹{item.mrp?.toFixed(2)}</td>
                      <td className="text-right">₹{item.rate?.toFixed(2)}</td>
                      <td className="text-right font-medium">
                        ₹{(item.quantity * item.rate)?.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

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
              {(quote.cylinderCharges || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Cylinder Charges</span>
                  <span>₹{quote.cylinderCharges?.toFixed(2)}</span>
                </div>
              )}
              {(quote.inventoryCharges || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Inventory Charges</span>
                  <span>₹{quote.inventoryCharges?.toFixed(2)}</span>
                </div>
              )}
              {quote.discount > 0 && (
                <div className="flex justify-between text-green-500">
                  <span>Discount ({quote.discountPercent}%)</span>
                  <span>-₹{quote.discount?.toFixed(2)}</span>
                </div>
              )}
              {quote.tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Tax ({quote.taxPercent}%)</span>
                  <span>₹{quote.tax?.toFixed(2)}</span>
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

      {/* Preview Panel */}
      {showPreview && (
        <div className="card mt-6 border-2 border-[var(--primary)]">
          <div className="p-4 bg-[var(--primary)]/10 border-b border-[var(--border)]">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Eye size={20} />
              Quote Preview (PDF Format)
            </h2>
          </div>
          
          <div ref={previewRef} className="bg-white text-black p-8 min-h-[600px]">
            {/* Header */}
            <div className="border-b-4 border-orange-500 pb-4 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">QUOTATION</h1>
                  <p className="text-gray-500 mt-1">Draft Preview</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Quote Number</p>
                  <p className="text-lg font-semibold text-gray-700">{quote.quoteNumber}</p>
                  <p className="text-sm text-gray-500 mt-2">Date: {new Date(quote.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
              </div>
            </div>

            {/* Client Details */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Bill To</h3>
                <p className="text-lg font-semibold text-gray-800">{quote.clientName}</p>
                <p className="text-gray-600">{quote.clientEmail}</p>
                <p className="text-gray-600">{quote.clientPhone}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Marketed By</h3>
                <p className="text-lg font-semibold text-gray-800">{quote.marketedBy || 'N/A'}</p>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Quote Items</h3>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">#</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Brand Name</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Composition</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Formulation</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Packing</th>
                    <th className="border border-gray-300 px-3 py-2 text-center text-xs font-semibold text-gray-700">Qty</th>
                    <th className="border border-gray-300 px-3 py-2 text-right text-xs font-semibold text-gray-700">MRP</th>
                    <th className="border border-gray-300 px-3 py-2 text-right text-xs font-semibold text-gray-700">Rate</th>
                    <th className="border border-gray-300 px-3 py-2 text-right text-xs font-semibold text-gray-700">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.items?.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-300 px-3 py-2 text-sm">{index + 1}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm font-medium">{item.brandName || '-'}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-gray-600">{item.composition || '-'}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm">{item.formulationType || '-'}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm">{item.packing || '-'}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-center">{item.quantity}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-right">₹{item.mrp?.toFixed(2)}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-right">₹{item.rate?.toFixed(2)}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-right font-medium">₹{(item.quantity * item.rate)?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-8">
              <div className="w-72">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₹{quote.subtotal?.toFixed(2)}</span>
                </div>
                {(quote.cylinderCharges || 0) > 0 && (
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Cylinder Charges</span>
                    <span>₹{quote.cylinderCharges?.toFixed(2)}</span>
                  </div>
                )}
                {(quote.inventoryCharges || 0) > 0 && (
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Inventory Charges</span>
                    <span>₹{quote.inventoryCharges?.toFixed(2)}</span>
                  </div>
                )}
                {quote.discount > 0 && (
                  <div className="flex justify-between py-2 border-b border-gray-200 text-green-600">
                    <span>Discount ({quote.discountPercent}%)</span>
                    <span>-₹{quote.discount?.toFixed(2)}</span>
                  </div>
                )}
                {quote.tax > 0 && (
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Tax ({quote.taxPercent}%)</span>
                    <span>₹{quote.tax?.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between py-3 text-lg font-bold">
                  <span>Total</span>
                  <span className="text-orange-600">₹{quote.totalAmount?.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Terms & Bank Details */}
            <div className="grid grid-cols-2 gap-8 pt-6 border-t border-gray-200">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Terms & Conditions</h3>
                <p className="text-sm text-gray-600 whitespace-pre-line">{quote.terms || 'No terms specified'}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Account Details</h3>
                <p className="text-sm text-gray-600 whitespace-pre-line">{quote.bankDetails || 'No account details specified'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuoteDetail;
