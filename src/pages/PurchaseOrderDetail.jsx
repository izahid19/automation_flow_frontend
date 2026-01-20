import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderAPI } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
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
} from 'lucide-react';
import toast from 'react-hot-toast';
import PurchaseOrderPreview from '@/components/PurchaseOrderPreview';
import { Label } from '@/components/ui/label';

const PurchaseOrderDetail = () => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const response = await orderAPI.getOne(id);
      setOrder(response.data.data);
    } catch (error) {
      toast.error('Failed to load purchase order');
      navigate('/purchase-orders');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (order?.pdfUrl) {
      window.open(order.pdfUrl, '_blank');
    } else {
      toast.error('PDF not available');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      draft: { label: 'Draft', variant: 'secondary' },
      sent: { label: 'Sent', variant: 'outline' },
      acknowledged: { label: 'Acknowledged', variant: 'outline' },
      in_production: { label: 'In Production', variant: 'default' },
      shipped: { label: 'Shipped', variant: 'default' },
      delivered: { label: 'Delivered', variant: 'default' },
      completed: { label: 'Completed', variant: 'default' },
    };
    const s = statusMap[status] || { label: status, variant: 'secondary' };
    return <Badge variant={s.variant}>{s.label}</Badge>;
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

        <div className="flex gap-2">
          <Button
            variant={showPreview ? "default" : "outline"}
            onClick={() => setShowPreview(!showPreview)}
            className="gap-2"
          >
            {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
            {showPreview ? 'Close Preview' : 'Preview PO'}
          </Button>
          {order.pdfUrl && (
            <Button onClick={handleDownloadPDF} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
          )}
        </div>
      </div>

      {showPreview ? (
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
      ) : (
        <div className="space-y-6">
          {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">PO Number</p>
              <p className="font-semibold text-primary">{order.poNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Quote Number</p>
              <p className="font-semibold">{order.quoteNumber || order.quote?.quoteNumber || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              {getStatusBadge(order.status)}
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
              <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
              <p className="font-semibold text-lg">₹{order.totalAmount?.toFixed(2) || '0.00'}</p>
            </div>
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
          </div>
        </CardContent>
      </Card>

      {/* Quote Details (When goes to Accountant/Designer) */}
      {quote && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Quote Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Quote Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4 border-b">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Quote Number</p>
                <p className="font-semibold text-primary">{quote.quoteNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Quote Status</p>
                {getQuoteStatusBadge(quote.status)}
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Client Name</p>
                <p className="font-semibold">{quote.clientName}</p>
              </div>
              {quote.clientEmail && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Client Email</p>
                  <p className="font-medium">{quote.clientEmail}</p>
                </div>
              )}
              {quote.clientPhone && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Client Phone</p>
                  <p className="font-medium">{quote.clientPhone}</p>
                </div>
              )}
              {quote.marketedBy && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Marketed By</p>
                  <p className="font-medium">{quote.marketedBy}</p>
                </div>
              )}
            </div>

            {/* Quote Items */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Quote Items</h3>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8">#</TableHead>
                      <TableHead>Brand Name</TableHead>
                      <TableHead>Formulation</TableHead>
                      <TableHead>Packing</TableHead>
                      <TableHead>Composition</TableHead>
                      <TableHead className="text-center">Quantity</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quote.items?.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell className="font-medium">{item.brandName}</TableCell>
                        <TableCell>{item.formulationType}</TableCell>
                        <TableCell>
                          {item.packing === 'Custom' 
                            ? item.customPacking || '-' 
                            : item.packing || '-'}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {item.composition || '-'}
                        </TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">₹{item.rate?.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          ₹{(item.quantity * item.rate).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Quote Pricing Summary */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-semibold">₹{quote.subtotal?.toFixed(2)}</span>
              </div>
              {quote.cylinderCharges > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Cylinder Charges ({quote.numberOfCylinders} cylinders):
                  </span>
                  <span className="font-semibold">₹{quote.cylinderCharges?.toFixed(2)}</span>
                </div>
              )}
              {quote.inventoryCharges > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Inventory Charges:</span>
                  <span className="font-semibold">₹{quote.inventoryCharges?.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Tax {quote.taxPercent > 0 ? `(${quote.taxPercent}%)` : ''}:
                </span>
                <span className="font-semibold">₹{quote.tax?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-lg font-bold">Total Amount:</span>
                <span className="text-lg font-bold text-primary">
                  ₹{quote.totalAmount?.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Accountant & Designer Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Accountant Approval */}
              {quote.accountantApproval && (
                <Card>
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Accountant Status
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge variant={
                          quote.accountantApproval.status === 'approved' ? 'default' :
                          quote.accountantApproval.status === 'rejected' ? 'destructive' :
                          'outline'
                        }>
                          {quote.accountantApproval.status}
                        </Badge>
                      </div>
                      {quote.accountantApproval.approvedAt && (
                        <div>
                          <p className="text-sm text-muted-foreground">Approved At</p>
                          <p className="text-sm font-medium">
                            {new Date(quote.accountantApproval.approvedAt).toLocaleDateString('en-GB')} {' '}
                            {new Date(quote.accountantApproval.approvedAt).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      )}
                      {quote.accountantApproval.comments && (
                        <div>
                          <p className="text-sm text-muted-foreground">Comments</p>
                          <p className="text-sm">{quote.accountantApproval.comments}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Designer Status */}
              {quote.designStatus && (
                <Card>
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Designer Status
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge variant={
                          quote.designStatus === 'approved' ? 'default' :
                          quote.designStatus === 'completed' ? 'default' :
                          'outline'
                        }>
                          {quote.designStatus}
                        </Badge>
                      </div>
                      {quote.designApprovedAt && (
                        <div>
                          <p className="text-sm text-muted-foreground">Approved At</p>
                          <p className="text-sm font-medium">
                            {new Date(quote.designApprovedAt).toLocaleDateString('en-GB')} {' '}
                            {new Date(quote.designApprovedAt).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      )}
                      {quote.designNotes && (
                        <div>
                          <p className="text-sm text-muted-foreground">Notes</p>
                          <p className="text-sm">{quote.designNotes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Order Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {order.items?.map((item, index) => {
             const showPackingField = !['Injection', 'I.V/Fluid', 'Lotion', 'Soap'].includes(item.formulationType);
             
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
                       <ReadOnlyField label="Formulation" value={item.formulationType} />

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
                       
                       {!order.hidePurchaseRate && (
                         <>
                         <ReadOnlyField label="Rate (₹)" value={item.rate} />
                         <ReadOnlyField label="MRP per strip/unit (₹)" value={item.mrp} />
                         
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

          {!order.hidePurchaseRate && (
            <div className="mt-4 flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-semibold">₹{order.subtotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-bold">Total:</span>
                  <span className="font-bold text-lg text-primary">
                    ₹{order.totalAmount?.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
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
      )}
    </div>
  );
};

export default PurchaseOrderDetail;
