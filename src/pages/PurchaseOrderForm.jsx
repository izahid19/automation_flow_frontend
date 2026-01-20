import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, Save, Send, Loader2, Eye, EyeOff, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/config';
import PurchaseOrderPreview from '@/components/PurchaseOrderPreview';
import { 
  PACKING_OPTIONS, 
  PACKAGING_OPTIONS, 
  CARTON_OPTIONS,
  FORMULATION_TYPES 
} from '@/constants/formulation.constants';
import { DEFAULT_ITEM } from '@/constants/quote.constants';
import { Checkbox } from '@/components/ui/checkbox';

const PurchaseOrderForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [manufacturers, setManufacturers] = useState([]);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // Get quoteId from URL query params
  const searchParams = new URLSearchParams(window.location.search);
  const quoteId = searchParams.get('quoteId');
  const targetItemIndex = searchParams.get('itemIndex');
  
  const [formData, setFormData] = useState({
    manufacturerId: '',
    quoteNumber: '', // Optional reference
    notes: '',
    hidePurchaseRate: false,
  });

  const [items, setItems] = useState([{ ...DEFAULT_ITEM, selected: true }]);

  useEffect(() => {
    fetchManufacturers();
    // If quoteId is provided, load the quote data
    if (quoteId) {
      loadQuoteData(quoteId);
    }
  }, [quoteId]);

  const loadQuoteData = async (id) => {
    setLoadingQuote(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/quotes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const quote = response.data.data;
      
      // Pre-populate form with quote data
      setFormData(prev => ({
        ...prev,
        quoteNumber: quote.quoteNumber,
      }));
      
      // Pre-populate items from quote
      // Pre-populate items from quote
      if (quote.items && quote.items.length > 0) {
        const taggedItems = quote.items.map((item, i) => ({ ...item, _originalIndex: i }));
        
        const itemsToLoad = targetItemIndex !== null 
          ? taggedItems.filter(item => item._originalIndex === parseInt(targetItemIndex))
          : taggedItems;

        setItems(itemsToLoad.map((item) => ({
          ...DEFAULT_ITEM,
          ...item,
          quantity: item.quantity?.toString() || '',
          rate: item.rate?.toString() || '',
          mrp: item.mrp?.toString() || '',
          selected: true,
          originalIndex: item._originalIndex,
        })));
      }
      
      toast.success('Quote data loaded');
    } catch (error) {
      console.error('Error loading quote:', error);
      toast.error('Failed to load quote data');
    } finally {
      setLoadingQuote(false);
    }
  };

  const fetchManufacturers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/manufacturers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setManufacturers(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load manufacturers');
    }
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    
    // For numeric fields
    if (field === 'quantity' || field === 'rate' || field === 'mrp') {
       if (value === '' || value === '.' || /^\d*\.?\d*$/.test(value)) {
        newItems[index][field] = value;
      }
    } else {
      newItems[index][field] = value;
    }

    // Reset dependent fields logic (similar to QuoteForm)
    if (field === 'formulationType') {
      newItems[index].packing = '';
      newItems[index].packagingType = '';
      newItems[index].cartonPacking = '';
      newItems[index].customCartonPacking = '';
      newItems[index].drySyrupWaterType = '';
      newItems[index].pvcType = '';
      newItems[index].customPvcType = '';
      newItems[index].softGelatinColor = '';
      newItems[index].injectionType = '';
      newItems[index].injectionBoxPacking = '';
      newItems[index].injectionPacking = '';
      newItems[index].customInjectionPacking = '';
      newItems[index].injectionPvcType = '';
      newItems[index].dryInjectionUnitPack = '';
      newItems[index].dryInjectionPackType = '';
      newItems[index].dryInjectionTrayPack = '';
    }
    
    if (field === 'injectionType') {
      newItems[index].injectionBoxPacking = '';
      newItems[index].injectionPacking = '';
      newItems[index].customInjectionPacking = '';
      newItems[index].injectionPvcType = '';
      newItems[index].dryInjectionUnitPack = '';
      newItems[index].dryInjectionPackType = '';
      newItems[index].dryInjectionTrayPack = '';
    }
    
    if (field === 'packagingType' && value !== 'Blister') {
      newItems[index].pvcType = '';
      newItems[index].customPvcType = '';
    }
    
    if (field === 'injectionPacking' && value !== 'Blister Packing') {
      newItems[index].injectionPvcType = '';
    }

    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { ...DEFAULT_ITEM, selected: true }]);
  };

  const copyItem = (index) => {
    const itemToCopy = { ...items[index] };
    setItems([...items, itemToCopy]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    } else {
      toast.error('At least one item is required');
    }
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      return sum + (qty * rate);
    }, 0);

    return { subtotal, total: subtotal };
  };

  const validateForm = () => {
    if (!formData.manufacturerId) {
      toast.error('Please select a manufacturer');
      return false;
    }

    if (items.length === 0) {
      toast.error('Please add at least one item');
      return false;
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.brandName || !item.quantity || !item.rate) {
        toast.error(`Item ${i + 1}: Brand name, quantity, and rate are required`);
        return false;
      }
    }

    return true;
  };

  const handleSaveAsDraft = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const { subtotal, total } = calculateTotals();
      
      await axios.post(`${API_URL}/purchase-orders/direct`, {
        ...formData,
        items: items,
        subtotal,
        totalAmount: total,
        status: 'draft',
        quoteId, // Pass quoteId if available
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Purchase Order saved as draft');
      navigate('/purchase-orders');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save draft');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const { subtotal, total } = calculateTotals();
      
      await axios.post(`${API_URL}/purchase-orders/direct`, {
        ...formData,
        items: items,
        subtotal,
        totalAmount: total,
        status: 'sent',
        quoteId, // Pass quoteId if available
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Purchase Order created and sent successfully');
      navigate('/purchase-orders');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create purchase order');
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, total } = calculateTotals();
  const selectedManufacturer = manufacturers.find(m => m._id === formData.manufacturerId);

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/purchase-orders')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Create New Purchase Order</h1>
            <p className="text-muted-foreground">Fill in the details to create a purchase order</p>
          </div>
        </div>
        <Button
          variant={showPreview ? "default" : "outline"}
          onClick={() => setShowPreview(!showPreview)}
          className="gap-2"
        >
          {showPreview ? <EyeOff size={18} /> : <Eye size={18} />}
          {showPreview ? 'Close Preview' : 'Preview PO'}
        </Button>
      </div>
      
      {loadingQuote && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground font-medium">Loading quote data...</p>
          </div>
        </div>
      )}

      {showPreview ? (
        <PurchaseOrderPreview 
          formData={formData}
          items={items}
          manufacturer={selectedManufacturer}
          totals={{ subtotal, total }}
        />
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Manufacturer Details */}
          <Card>
            <CardHeader>
              <CardTitle>Manufacturer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Manufacturer *</Label>
                  <select
                    id="manufacturer"
                    value={formData.manufacturerId}
                    onChange={(e) => handleFormChange('manufacturerId', e.target.value)}
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

                <div className="space-y-2">
                  <Label>Quote Number</Label>
                  <div className="text-sm font-medium px-3 py-2 bg-muted/30 rounded-md border border-border/20 min-h-[38px] flex items-center">
                    {formData.quoteNumber || '-'}
                  </div>
                </div>
              </div>

              {selectedManufacturer && (
                <div className="rounded-md bg-muted/40 p-3 border border-border/40 text-sm">
                  <div className="space-y-1">
                    <div className="font-semibold text-foreground text-base">
                      {selectedManufacturer.name}
                    </div>
                    {selectedManufacturer.email && (
                      <div className="text-muted-foreground flex items-center gap-2">
                        <span className="font-medium">Email:</span> {selectedManufacturer.email}
                      </div>
                    )}
                    {selectedManufacturer.address && (
                      <div className="text-muted-foreground flex items-start gap-2">
                         <span className="font-medium whitespace-nowrap">Address:</span> 
                         <span>{selectedManufacturer.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hidePurchaseRate"
                  checked={formData.hidePurchaseRate}
                  onChange={(e) => handleFormChange('hidePurchaseRate', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="hidePurchaseRate" className="cursor-pointer">
                  Hide purchase rate in PDF
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* PO Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Purchase Order Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => {
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
                          <span className="font-semibold text-foreground">
                            Product Details
                          </span>
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

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:col-span-2">
                            <ReadOnlyField label="Quantity" value={item.quantity} />
                            
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Rate (₹)
                              </Label>
                              <Input
                                type="text"
                                value={item.rate}
                                onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                                className="h-[38px]"
                                placeholder="0.00"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                MRP per strip/unit (₹)
                              </Label>
                              <Input
                                type="text"
                                value={item.mrp}
                                onChange={(e) => handleItemChange(index, 'mrp', e.target.value)}
                                className="h-[38px]"
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Amount
                            </Label>
                            <div className="text-sm font-medium px-3 py-2 bg-muted/50 rounded-md border border-border/20 min-h-[38px] flex items-center text-primary">
                              {`₹${((parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0)).toFixed(2)}`}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>PO Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-primary text-lg">₹{total.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleSaveAsDraft}
                  disabled={loading}
                >
                  <Save size={16} />
                  Save as Draft
                </Button>
                <Button
                  className="w-full gap-2"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  <Send size={16} />
                  {loading ? 'Creating...' : 'Create & Send PO'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      )}
    </div>
  );
};

export default PurchaseOrderForm;
