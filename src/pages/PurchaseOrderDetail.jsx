import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderAPI } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ArrowLeft,
  Package,
  Loader2,
  Download,
  Building2,
  User,
  Calendar,
  FileText,
  Eye,
  EyeOff,
  Check,
  X,
  Clock,
  History,
  Send,
} from 'lucide-react';
import toast from 'react-hot-toast';
import PurchaseOrderPreview from '@/components/PurchaseOrderPreview';
import { Label } from '@/components/ui/label';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

const PurchaseOrderDetail = () => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, isAccountant, isDesigner, isManager } = useAuth();
  const { socket } = useSocket();

  const fetchOrder = useCallback(async () => {
    try {
      const response = await orderAPI.getOne(id);
      setOrder(response.data.data);
    } catch (error) {
      toast.error('Failed to load purchase order');
      navigate('/purchase-orders');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Listen for real-time updates to this PO
  useEffect(() => {
    if (!socket || !id) return;

    const handlePOUpdate = (data) => {
      // Only refresh if the update is for this PO
      if (data.purchaseOrder?._id === id || data.purchaseOrder?.id === id) {
        fetchOrder();
      }
    };

    socket.on('po:status-updated', handlePOUpdate);
    socket.on('po:payment-verified', handlePOUpdate);

    return () => {
      socket.off('po:status-updated', handlePOUpdate);
      socket.off('po:payment-verified', handlePOUpdate);
    };
  }, [socket, id, fetchOrder]);

  const handleDownloadPDF = async () => {
    setDownloadLoading(true);
    try {
      const response = await orderAPI.downloadPDF(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${order?.poNumber || 'purchase-order'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Failed to download PDF');
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setResendLoading(true);
    try {
      await orderAPI.send(id);
      toast.success('Purchase order email resent');
      fetchOrder();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend email');
    } finally {
      setResendLoading(false);
    }
  };

  const getStatusBadge = (status) => {
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
      po_completed: { label: 'PO Completed', variant: 'default', className: 'bg-green-600 text-white border-green-600' },
      draft: { label: 'Draft', variant: 'secondary', className: '' },
    };
    const s = statusMap[status] || { label: status, variant: 'secondary', className: '' };
    return <Badge variant={s.variant} className={s.className}>{s.label}</Badge>;
  };

  // Permission checks
  const canVerifyPayment = (isAdmin || isAccountant) && order?.status === 'sent';
  const canResendEmail = (isAdmin || isManager) && order?.status !== 'draft';

  const handleVerifyFullPayment = async () => {
    setShowPaymentConfirm(false);
    setActionLoading(true);
    try {
      await orderAPI.verifyFullPayment(id);
      toast.success('Full payment verified. PO is now completed!');
      fetchOrder();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to verify payment');
    } finally {
      setActionLoading(false);
    }
  };

  const getQuoteStatusBadge = (status) => {
    const statusMap = {
      pending_accountant: { label: 'Pending Accountant', variant: 'outline' },
      pending_designer: { label: 'Pending Designer', variant: 'outline' },
      design_pending: { label: 'Design Pending', variant: 'outline' },
      design_approved: { label: 'Design Approved', variant: 'default' },
      completed: { label: 'Completed', variant: 'default' },
    };
    const s = statusMap[status] || { label: status, variant: 'secondary' };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const quote = order.quote;

  return (
  <>
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/purchase-orders')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Purchase Order Details</h1>
            <p className="text-muted-foreground">{order.poNumber}</p>
          </div>
        </div>

        {!isDesigner && (
        <div className="flex gap-2">
          <Button
            variant={showPreview ? "default" : "outline"}
            onClick={() => setShowPreview(!showPreview)}
            className="gap-2"
          >
            {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
            {showPreview ? 'Close Preview' : 'Preview PO'}
          </Button>
          {canResendEmail && (
            <Button
              onClick={handleResendEmail}
              variant="outline"
              className="gap-2"
              disabled={resendLoading}
            >
              {resendLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send size={16} />}
              {resendLoading ? 'Resending...' : 'Resend Email'}
            </Button>
          )}
          <Button
            onClick={handleDownloadPDF}
            variant="outline"
            className="gap-2"
            disabled={downloadLoading}
          >
            {downloadLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {downloadLoading ? 'Downloading...' : 'Download PDF'}
          </Button>
        </div>
        )}
      </div>

      {showPreview ? (
        <Card className="border-2 border-primary overflow-hidden shadow-xl">
          <CardHeader className="bg-primary/5 py-4 border-b border-primary/10">
            <CardTitle className="text-lg font-semibold flex items-center gap-2 text-primary">
              <Eye size={20} />
              Purchase Order Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 bg-secondary/10">
            <div className="w-full h-[850px] overflow-auto p-4 md:p-8 custom-scrollbar">
              <div className="min-w-[1000px] max-w-[1000px] mx-auto bg-white shadow-[0_0_50px_-12px_rgba(0,0,0,0.3)] ring-1 ring-border rounded-sm">
                <PurchaseOrderPreview
                  formData={{
                    quoteNumber: order.quoteNumber || order.quote?.quoteNumber,
                    notes: order.notes,
                    hidePurchaseRate: order.hidePurchaseRate
                  }}
                  items={order.items}
                  manufacturer={order.manufacturer}
                  totals={{
                    subtotal: order.subtotal || 0,
                    total: order.totalAmount || 0
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">PO Number</p>
                    <p className="font-semibold text-green-500">{order.poNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                    {getStatusBadge(order.orderSheetStatus || order.status)}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Created Date</p>
                    <p className="font-medium">
                      {new Date(order.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Delivery Date</p>
                    <p className="font-medium">
                      {(() => {
                        const deliveryDate = order.deliveryDate 
                          ? new Date(order.deliveryDate)
                          : (() => {
                              const d = new Date(order.createdAt);
                              d.setDate(d.getDate() + 45);
                              return d;
                            })();
                        return deliveryDate.toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        });
                      })()}
                    </p>
                  </div>
                  {!isDesigner && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                    <p className="font-semibold text-lg">₹{order.totalAmount?.toFixed(2) || '0.00'}</p>
                  </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Manufacturer Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Manufacturer Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-semibold text-lg">{order.manufacturer?.name}</p>
                  {order.manufacturer?.email && (
                    <p className="text-muted-foreground">
                      Email: {order.manufacturer.email}
                    </p>
                  )}
                  {order.manufacturer?.phone && (
                    <p className="text-muted-foreground">
                      Phone: {order.manufacturer.phone}
                    </p>
                  )}
                  {order.manufacturer?.ccEmails && order.manufacturer.ccEmails.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      <span className="text-sm font-medium text-muted-foreground">CC:</span>
                      <div className="flex flex-wrap gap-1">
                        {order.manufacturer.ccEmails.map((email, idx) => (
                          <span key={idx} className="bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded text-sm border border-orange-500/20">
                            {email}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {order.manufacturer?.bccEmails && order.manufacturer.bccEmails.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      <span className="text-sm font-medium text-muted-foreground">BCC:</span>
                      <div className="flex flex-wrap gap-1">
                        {order.manufacturer.bccEmails.map((email, idx) => (
                          <span key={idx} className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded text-sm border border-blue-500/20">
                            {email}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>


            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Purchase Order Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.items?.map((item, index) => {
                   const showPackingField = !['Injection', 'I.V/Fluid', 'Lotion', 'Soap', 'Custom'].includes(item.formulationType);
                   
                   // Helper to render read-only field
                   const ReadOnlyField = ({ label, value }) => (
                     <div className="space-y-1.5">
                       <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                         {label}
                       </Label>
                       <div className="text-sm font-medium px-3 py-2 bg-muted/30 rounded-md border border-border/20 min-h-[38px] flex items-center">
                         {value || '-'}
                       </div>
                     </div>
                   );

                   return (
                     <Card key={index} className="relative border border-border/50 bg-card">
                       <CardContent className="pt-6 space-y-6">
                         {/* Item Header */}
                         <div className="flex items-center justify-between border-b border-border/40 pb-3">
                           <div className="flex items-center gap-3">
                             <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                               {index + 1}
                             </span>
                             <span className="font-semibold text-foreground">Product Details</span>
                           </div>
                         </div>

                         <div className="space-y-6">
                           {/* Product Specifications Section */}
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                             <ReadOnlyField label="Brand Name" value={item.brandName} />
                             <ReadOnlyField label="Order Type" value={item.orderType} />
                             <ReadOnlyField label="Category" value={item.categoryType} />
                            <ReadOnlyField
                              label="Formulation"
                              value={
                                item.formulationType === 'Custom'
                                  ? (item.customFormulationType || 'Custom')
                                  : item.formulationType
                              }
                            />

                             {/* Colour of Soft Gelatin */}
                             {item.formulationType === 'Soft Gelatine' && (
                               <ReadOnlyField label="Colour of Soft Gelatin" value={item.softGelatinColor} />
                             )}

                             {/* Injection Type */}
                             {item.formulationType === 'Injection' && (
                               <ReadOnlyField label="Injection Type" value={item.injectionType} />
                             )}

                             {/* Dry Injection fields */}
                             {item.formulationType === 'Injection' && item.injectionType === 'Dry Injection' && (
                               <>
                                 <ReadOnlyField label="Unit Pack" value={item.dryInjectionUnitPack} />
                                 <ReadOnlyField label="Pack Type" value={item.dryInjectionPackType} />
                                 <ReadOnlyField label="Tray Pack" value={item.dryInjectionTrayPack} />
                               </>
                             )}
                           </div>

                           {/* Technical Specs Section */}
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                             {/* Composition - Spans 2 cols */}
                             <div className="md:col-span-2">
                                <ReadOnlyField label="Composition" value={item.composition} />
                             </div>

                             {/* Packing */}
                             {showPackingField && (
                               <ReadOnlyField 
                                 label={['Syrup/Suspension', 'Dry Syrup'].includes(item.formulationType) ? 'Unit Pack' : 'Box Packing'}
                                 value={item.packing === 'Custom' ? item.customPacking : item.packing}
                               />
                             )}

                             {/* Packaging Type */}
                             {!(item.formulationType === 'Injection' && item.injectionType === 'Dry Injection') && (
                               <div className={!showPackingField ? 'md:col-span-2' : ''}>
                                 <ReadOnlyField 
                                   label={['Syrup/Suspension', 'Dry Syrup'].includes(item.formulationType) ? 'Label Type' : 'Packaging Type'}
                                   value={item.packagingType === 'Custom' ? item.customPackagingType : item.packagingType}
                                 />
                               </div>
                             )}

                             {/* PVC Type */}
                             {item.packagingType === 'Blister' && (
                               <div className="md:col-span-2">
                                 <ReadOnlyField 
                                   label="PVC Type"
                                   value={item.pvcType === 'Custom' ? item.customPvcType : item.pvcType}
                                 />
                               </div>
                             )}
                             
                             {/* Specification */}
                             <div className="md:col-span-2">
                                <ReadOnlyField label="Specification" value={item.specification} />
                             </div>

                             <ReadOnlyField label="Quantity" value={item.quantity} />
                             
                             <ReadOnlyField label="MRP per strip/unit (₹)" value={item.mrp} />
                             
                             {!order.hidePurchaseRate && !isDesigner && (
                               <>
                               <ReadOnlyField label="Rate (₹)" value={item.rate} />
                               
                               <div className="space-y-1.5">
                                 <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                   Amount
                                 </Label>
                                 <div className="text-sm font-medium px-3 py-2 bg-muted/50 rounded-md border border-border/20 min-h-[38px] flex items-center text-primary">
                                   {`₹${((parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0)).toFixed(2)}`}
                                 </div>
                               </div>
                               </>
                             )}
                           </div>
                         </div>
                       </CardContent>
                     </Card>
                   );
                })}
              </CardContent>
            </Card>

            {/* Additional Notes */}
            {order.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{order.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Right Side */}
          <div className="space-y-4">
            {/* Payment Verification Action - For Admin/Accountant */}
            {(isAdmin || isAccountant) && order.status !== 'po_completed' && (
              <Card className="border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Check className="w-5 h-5" />
                    Verify Full Payment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Verify that full payment has been received for this Purchase Order to mark it as completed.
                  </p>
                  <Button
                    onClick={() => setShowPaymentConfirm(true)}
                    disabled={actionLoading}
                    className="w-full gap-2 bg-green-600 hover:bg-green-700"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check size={16} />}
                    Confirm Full Payment Received
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Payment Verified Info */}
            {order.fullPaymentReceived && (
              <Card className="border-green-500/30 bg-green-500/5">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-green-600 font-semibold mb-2">
                    <Check size={18} />
                    Full Payment Verified
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Verified by: {order.fullPaymentVerifiedByName || 'Unknown'}
                  </p>
                  {order.fullPaymentReceivedAt && (
                    <p className="text-xs text-muted-foreground">
                      On: {new Date(order.fullPaymentReceivedAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })} at {new Date(order.fullPaymentReceivedAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* PO History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  PO History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(() => {
                    // Build full history with PO Created always first
                    const getStatusConfig = (status) => {
                      const statusConfigs = {
                        created: { color: 'bg-blue-500', icon: <Check size={16} className="text-white" />, label: 'PO Created' },
                        draft: { color: 'bg-gray-500', icon: <Clock size={16} className="text-white" />, label: 'Draft' },
                        sent: { color: 'bg-green-500', icon: <Check size={16} className="text-white" />, label: 'Sent to Manufacturer' },
                        acknowledged: { color: 'bg-blue-500', icon: <Check size={16} className="text-white" />, label: 'Acknowledged' },
                        in_production: { color: 'bg-amber-500', icon: <Clock size={16} className="text-white" />, label: 'In Production' },
                        shipped: { color: 'bg-purple-500', icon: <Package size={16} className="text-white" />, label: 'Shipped' },
                        delivered: { color: 'bg-green-500', icon: <Check size={16} className="text-white" />, label: 'Delivered' },
                        completed: { color: 'bg-green-500', icon: <Check size={16} className="text-white" />, label: 'Completed' },
                        po_completed: { color: 'bg-green-600', icon: <Check size={16} className="text-white" />, label: 'PO Completed' },
                      };
                      return statusConfigs[status] || { color: 'bg-gray-500', icon: <Clock size={16} className="text-white" />, label: status };
                    };

                    // Start with PO Created entry
                    let fullHistory = [];
                    
                    // Check if statusHistory already has a 'created' entry
                    const hasCreatedEntry = order.statusHistory?.some(h => h.status === 'created');
                    
                    if (!hasCreatedEntry) {
                      // Add synthetic PO Created entry at the beginning
                      fullHistory.push({
                        status: 'created',
                        changedByName: order.createdBy?.name || 'System',
                        changedAt: order.createdAt,
                        notes: 'Purchase Order created',
                        isSynthetic: true,
                      });
                    }
                    
                    // Add actual status history entries
                    if (order.statusHistory && order.statusHistory.length > 0) {
                      fullHistory = [...fullHistory, ...order.statusHistory];
                    }

                    // Sort by date (oldest first)
                    fullHistory.sort((a, b) => new Date(a.changedAt) - new Date(b.changedAt));

                    return fullHistory.map((historyItem, index) => {
                      const config = getStatusConfig(historyItem.status);
                      const isLast = index === fullHistory.length - 1;

                      return (
                        <div key={index} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config.color}`}>
                              {config.icon}
                            </div>
                            {!isLast && <div className="w-0.5 h-full bg-border mt-2" />}
                          </div>
                          <div className="flex-1 pb-4">
                            <p className="font-medium">{config.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {historyItem.changedByName || historyItem.changedBy?.name || 'System'}
                            </p>
                            {historyItem.changedAt && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(historyItem.changedAt).toLocaleDateString('en-GB', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })} at {new Date(historyItem.changedAt).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </p>
                            )}
                            {historyItem.notes && (
                              <p className="text-xs text-muted-foreground mt-1 italic">
                                {historyItem.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>

    {/* Payment Verification Confirmation Modal */}
    <ConfirmDialog
      isOpen={showPaymentConfirm}
      onClose={() => setShowPaymentConfirm(false)}
      onConfirm={handleVerifyFullPayment}
      title="Verify Full Payment"
      message={`Are you sure you want to verify that full payment has been received for ${order?.poNumber}? This will mark the Purchase Order as completed.`}
      confirmText="Verify Payment"
      variant="default"
    />
  </>
  );
};

export default PurchaseOrderDetail;
