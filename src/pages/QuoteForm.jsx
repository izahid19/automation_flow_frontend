import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { quoteAPI, settingsAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save,
  Send,
  Loader2,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import QuotePreview from '@/components/QuotePreview';
import { 
  PACKING_OPTIONS, 
  PACKAGING_OPTIONS, 
  CARTON_OPTIONS,
  FORMULATION_TYPES 
} from '@/constants/formulation.constants';
import { DEFAULT_ITEM } from '@/constants/quote.constants';
import { useQuoteForm } from '@/hooks/useQuoteForm';
import { useQuoteValidation } from '@/hooks/useQuoteValidation';
import { calculateQuoteTotals } from '@/utils/quoteCalculations';
import { 
  ClientDetailsSection, 
  QuoteSummaryCard, 
  AdditionalInfoSection 
} from '@/components/quote';

const QuoteForm = () => {
  // Helper function to only allow numeric input in text fields
  const handleNumericKeyDown = (e) => {
    // Allow: backspace, delete, tab, escape, enter, decimal point
    if (
      [46, 8, 9, 27, 13, 110, 190].indexOf(e.keyCode) !== -1 ||
      // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      (e.keyCode === 65 && e.ctrlKey === true) ||
      (e.keyCode === 67 && e.ctrlKey === true) ||
      (e.keyCode === 86 && e.ctrlKey === true) ||
      (e.keyCode === 88 && e.ctrlKey === true) ||
      // Allow: home, end, left, right
      (e.keyCode >= 35 && e.keyCode <= 39)
    ) {
      return;
    }
    // Ensure that it is a number and stop the keypress
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
  };

  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const repeatQuoteId = searchParams.get('repeat');
  const isEditMode = !!id;
  const isRepeatMode = !!repeatQuoteId;
  const [loading, setLoading] = useState(false);
  const [loadingQuote, setLoadingQuote] = useState(isEditMode || isRepeatMode);
  const [errors, setErrors] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    partyName: '',
    marketedBy: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: '',
    items: [{ ...DEFAULT_ITEM }],
    discountPercent: 0,
    taxPercent: 5, // Changed default from 0 to 5%
    taxPercentOnCharges: 18,
    cylinderCharges: 0,
    numberOfCylinders: 2, // Changed default from 0 to 2
    inventoryCharges: 0,
    terms: 'Payment due within 30 days. All prices in INR.',
    bankDetails: '',
  });
  const [companySettings, setCompanySettings] = useState({
    companyPhone: '+917696275527',
    companyEmail: 'user@gmail.com',
    invoiceLabel: 'QUOTATION'
  });

  // Fetch quote data if in edit mode
  useEffect(() => {
    const fetchQuote = async () => {
      if (!isEditMode) return;
      
      try {
        setLoadingQuote(true);
        const response = await quoteAPI.getOne(id);
        const quote = response.data.data;
        
        // Map quote data to form data structure
        setFormData({
          partyName: quote.clientName || '',
          marketedBy: quote.marketedBy || '',
          clientEmail: quote.clientEmail || '',
          clientPhone: quote.clientPhone || '',
          clientAddress: quote.clientAddress || '',
          items: quote.items && quote.items.length > 0 ? quote.items : [{ ...DEFAULT_ITEM }],
          discountPercent: quote.discountPercent || 0,
          taxPercent: quote.taxPercent || 0,
          taxPercentOnCharges: 18, // Fixed at 18%, cannot be changed
          cylinderCharges: quote.cylinderCharges || 0,
          numberOfCylinders: quote.numberOfCylinders || 0,
          inventoryCharges: quote.inventoryCharges || 0,
          terms: quote.terms || 'Payment due within 30 days. All prices in INR.',
          bankDetails: quote.bankDetails || '',
        });
      } catch (error) {
        toast.error('Failed to load quote');
        navigate('/quotes');
      } finally {
        setLoadingQuote(false);
      }
    };
    
    fetchQuote();
  }, [id, isEditMode, navigate]);

  // Fetch quote data if in repeat mode (to pre-populate form)
  useEffect(() => {
    const fetchRepeatQuote = async () => {
      if (!isRepeatMode) return;
      
      try {
        setLoadingQuote(true);
        const response = await quoteAPI.getOne(repeatQuoteId);
        const quote = response.data.data;
        
        // Map quote data to form data structure, setting orderType to 'Repeat'
        const repeatItems = quote.items && quote.items.length > 0 
          ? quote.items.map(item => ({
              ...item,
              orderType: 'Repeat', // Set order type to Repeat for all items
            }))
          : [{ ...DEFAULT_ITEM, orderType: 'Repeat' }];
        
        setFormData({
          partyName: quote.clientName || '',
          marketedBy: quote.marketedBy || '',
          clientEmail: quote.clientEmail || '',
          clientPhone: quote.clientPhone || '',
          clientAddress: quote.clientAddress || '',
          items: repeatItems,
          discountPercent: quote.discountPercent || 0,
          taxPercent: quote.taxPercent || 5,
          taxPercentOnCharges: 18, // Fixed at 18%
          cylinderCharges: quote.cylinderCharges || 0,
          numberOfCylinders: quote.numberOfCylinders || 2,
          inventoryCharges: quote.inventoryCharges || 0,
          terms: quote.terms || 'Payment due within 30 days. All prices in INR.',
          bankDetails: quote.bankDetails || '',
        });
        toast.success('Quote data loaded for repeat order');
      } catch (error) {
        toast.error('Failed to load quote for repeat order');
        navigate('/quotes');
      } finally {
        setLoadingQuote(false);
      }
    };
    
    fetchRepeatQuote();
  }, [repeatQuoteId, isRepeatMode, navigate]);

  // Fetch default settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await settingsAPI.getAll();
        if (response.data.success) {
          setFormData(prev => ({
            ...prev,
            terms: response.data.data.terms || prev.terms,
            bankDetails: response.data.data.bankDetails || prev.bankDetails,
          }));
          setCompanySettings({
            companyPhone: response.data.data.companyPhone || '+917696275527',
            companyEmail: response.data.data.companyEmail || 'user@gmail.com',
            invoiceLabel: response.data.data.invoiceLabel || 'QUOTATION'
          });
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };
    fetchSettings();
  }, []);

  // Validation functions
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone) => {
    if (!phone) return true; // optional field
    const re = /^[+]?[\d\s-]{10,15}$/;
    return re.test(phone);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.partyName.trim()) {
      newErrors.partyName = 'Party name is required';
    }

    if (!formData.marketedBy.trim()) {
      newErrors.marketedBy = 'Marketed by is required';
    }

    if (!formData.clientEmail.trim()) {
      newErrors.clientEmail = 'Email is required';
    } else if (!validateEmail(formData.clientEmail)) {
      newErrors.clientEmail = 'Please enter a valid email address';
    }

    if (formData.clientPhone && !validatePhone(formData.clientPhone)) {
      newErrors.clientPhone = 'Please enter a valid phone number';
    }

    const itemValidation = formData.items.some((item) => {
      const isPharma = !['Injection', 'I.V/Fluid', 'Lotion', 'Soap'].includes(item.formulationType);
      const isSoftGelatin = item.formulationType === 'Soft Gelatine';
      const isLiquidInjection = item.formulationType === 'Injection' && item.injectionType === 'Liquid Injection';
      const isDryInjection = item.formulationType === 'Injection' && item.injectionType === 'Dry Injection';
      const isDrySyrup = item.formulationType === 'Dry Syrup';
      return (
        !item.brandName ||
        !item.composition ||
        !item.quantity ||
        !item.rate ||
        !item.mrp ||
        !item.packagingType ||
        (isPharma && !item.packing) ||
        (isSoftGelatin && !item.softGelatinColor?.trim()) ||
        (isLiquidInjection && !item.injectionBoxPacking?.trim()) ||
        (isLiquidInjection && !item.injectionPacking) ||
        (isDryInjection && !item.dryInjectionUnitPack?.trim()) ||
        (isDryInjection && !item.dryInjectionPackType) ||
        (isDryInjection && !item.dryInjectionTrayPack) ||
        (isDrySyrup && !item.cartonPacking) ||
        (isDrySyrup && !item.drySyrupWaterType)
      );
    });

    if (itemValidation) {
      newErrors.items = 'Please fill in all mandatory item fields (Brand, Composition, Packing, etc.)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // For numeric fields, allow decimal input
    if (name === 'taxPercent' || name === 'cylinderCharges' || name === 'numberOfCylinders' || name === 'inventoryCharges') {
      // Allow empty string, numbers, and decimal point
      if (value === '' || value === '.' || /^\d*\.?\d*$/.test(value)) {
        setFormData({ ...formData, [name]: value });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    
    // For numeric fields, allow decimal input by keeping as string until blur or calculation
    if (field === 'quantity' || field === 'rate' || field === 'mrp') {
      // Allow empty string, numbers, and decimal point
      if (value === '' || value === '.' || /^\d*\.?\d*$/.test(value)) {
        newItems[index][field] = value;
      } else {
        // If invalid, keep previous value
        return;
      }
    } else {
      newItems[index][field] = value;
    }

    // Reset dependent fields if formulation changes
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
    
    // Reset injection fields if injection type changes
    if (field === 'injectionType') {
      // Reset Liquid Injection fields
      newItems[index].injectionBoxPacking = '';
      newItems[index].injectionPacking = '';
      newItems[index].customInjectionPacking = '';
      newItems[index].injectionPvcType = '';
      // Reset Dry Injection fields
      newItems[index].dryInjectionUnitPack = '';
      newItems[index].dryInjectionPackType = '';
      newItems[index].dryInjectionTrayPack = '';
    }
    
    // Reset PVC Type fields if packaging type changes away from Blister
    if (field === 'packagingType' && value !== 'Blister') {
      newItems[index].pvcType = '';
      newItems[index].customPvcType = '';
    }
    
    // Reset injection PVC type if injection packing changes away from Blister Packing
    if (field === 'injectionPacking' && value !== 'Blister Packing') {
      newItems[index].injectionPvcType = '';
    }

    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { ...DEFAULT_ITEM }],
    });
  };

  const copyItem = (index) => {
    const itemToCopy = { ...formData.items[index] };
    setFormData({
      ...formData,
      items: [...formData.items, itemToCopy],
    });
  };

  const removeItem = (index) => {
    if (formData.items.length === 1) return;
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      return sum + (qty * rate);
    }, 0);
    const cylinderCharges = parseFloat(formData.cylinderCharges) || 0;
    const inventoryCharges = parseFloat(formData.inventoryCharges) || 0;
    const taxPercent = parseFloat(formData.taxPercent) || 0;
    const taxPercentOnCharges = 18; // Fixed at 18%
    
    // Tax on subtotal only
    const taxOnSubtotal = (subtotal * taxPercent) / 100;
    
    // Tax on cylinder charges and inventory charges (using separate tax percent)
    const chargesTotal = cylinderCharges + inventoryCharges;
    const taxOnCharges = (chargesTotal * taxPercentOnCharges) / 100;
    
    // Total tax
    const totalTax = taxOnSubtotal + taxOnCharges;
    
    // Total includes subtotal + charges + total tax
    const total = subtotal + cylinderCharges + inventoryCharges + totalTax;
    
    // Advance Payment is 35% of Total
    const advancePayment = total * 0.35;

    return { 
      subtotal, 
      taxOnSubtotal, 
      taxOnCharges, 
      totalTax, 
      total, 
      advancePayment 
    };
  };

  const handleSubmit = async (submitForApproval = false) => {
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);
    try {
      // Map partyName to clientName for backend compatibility
      const submitData = {
        ...formData,
        clientName: formData.partyName,
      };
      
      let quoteId = id;
      
      if (isEditMode) {
        // Update existing quote
        await quoteAPI.update(id, submitData);
        toast.success('Quote updated successfully!');
        
        if (submitForApproval) {
          await quoteAPI.submit(quoteId);
          toast.success('Quote submitted for approval!');
        }
      } else {
        // Create new quote
        const response = await quoteAPI.create(submitData);
        quoteId = response.data.data._id;

        if (submitForApproval) {
          await quoteAPI.submit(quoteId);
          toast.success('Quote created and submitted for approval!');
        } else {
          toast.success('Quote saved as draft!');
        }
      }

      navigate(`/quotes/${quoteId}`);
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'save'} quote`);
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, taxOnSubtotal, taxOnCharges, totalTax, total, advancePayment } = calculateTotals();

  if (loadingQuote) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{isEditMode ? 'Edit Quote' : isRepeatMode ? 'Repeat Order' : 'Create New Quote'}</h1>
            <p className="text-muted-foreground">{isEditMode ? 'Update the quote details' : isRepeatMode ? 'Create a new quote based on previous order' : 'Fill in the details to create a quotation'}</p>
          </div>
        </div>
        <Button
          variant={showPreview ? "default" : "outline"}
          onClick={() => setShowPreview(!showPreview)}
        >
          {showPreview ? <EyeOff size={18} className="mr-2" /> : <Eye size={18} className="mr-2" />}
          {showPreview ? 'Close Preview' : 'Preview Quote'}
        </Button>
      </div>

      {/* Show form OR preview based on toggle */}
      {!showPreview ? (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Details */}
          <Card>
            <CardHeader>
              <CardTitle>Client Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="partyName">Party Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="partyName"
                    name="partyName"
                    value={formData.partyName}
                    onChange={handleChange}
                    placeholder="Party / Client Name"
                    className={errors.partyName ? 'border-destructive' : ''}
                  />
                  {errors.partyName && (
                    <p className="text-xs text-destructive">{errors.partyName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="marketedBy">Marketed By <span className="text-red-500">*</span></Label>
                  <Input
                    id="marketedBy"
                    name="marketedBy"
                    value={formData.marketedBy}
                    onChange={handleChange}
                    placeholder="Sales person name"
                    className={errors.marketedBy ? 'border-destructive' : ''}
                  />
                  {errors.marketedBy && (
                    <p className="text-xs text-destructive">{errors.marketedBy}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientEmail">Email <span className="text-red-500">*</span></Label>
                  <Input
                    id="clientEmail"
                    name="clientEmail"
                    type="email"
                    value={formData.clientEmail}
                    onChange={handleChange}
                    placeholder="client@email.com"
                    className={errors.clientEmail ? 'border-destructive' : ''}
                  />
                  {errors.clientEmail && (
                    <p className="text-xs text-destructive">{errors.clientEmail}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientPhone">Phone Number</Label>
                  <Input
                    id="clientPhone"
                    name="clientPhone"
                    value={formData.clientPhone}
                    onChange={handleChange}
                    placeholder="+91 XXXXX XXXXX"
                    className={errors.clientPhone ? 'border-destructive' : ''}
                  />
                  {errors.clientPhone && (
                    <p className="text-xs text-destructive">{errors.clientPhone}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Quote Items</CardTitle>
              <Button variant="outline" size="sm" onClick={addItem}>
                <Plus size={16} className="mr-2" /> Add Item
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.items.map((item, index) => {
                const showPackingField = !['Injection', 'I.V/Fluid', 'Lotion', 'Soap'].includes(item.formulationType);
                const packingOptions = PACKING_OPTIONS[item.formulationType] || [];
                const packagingOptions = PACKAGING_OPTIONS[item.formulationType];

                return (
                  <div key={index} className="p-5 border border-border/50 bg-card rounded-xl shadow-sm space-y-5 transition-all hover:border-border">
                    {/* Item Header */}
                    <div className="flex items-center justify-between border-b border-border/40 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                          {index + 1}
                        </span>
                        <span className="font-semibold text-white">Product Details</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyItem(index)}
                          className="text-muted-foreground hover:text-foreground h-8 px-2"
                          title="Copy Item"
                        >
                          <Copy size={16} className="mr-2" />
                          <span className="text-xs">Duplicate</span>
                        </Button>
                        {formData.items.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2"
                            title="Remove Item"
                          >
                            <Trash2 size={16} />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-6">
                      {/* Product Specifications Section */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                         {/* Brand Name */}
                         <div className="space-y-2">
                          <Label className="text-xs font-medium text-white uppercase tracking-wider">
                            Brand Name <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            value={item.brandName}
                            onChange={(e) => handleItemChange(index, 'brandName', e.target.value)}
                            placeholder="Enter Brand Name"
                            className="h-10"
                          />
                        </div>

                        {/* Order Type */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-white uppercase tracking-wider">
                            Order Type <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={item.orderType}
                            onValueChange={(value) => handleItemChange(index, 'orderType', value)}
                          >
                            <SelectTrigger className="w-full h-10">
                              <SelectValue placeholder="Select Type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="New">New Order</SelectItem>
                              <SelectItem value="Repeat">Repeat Order</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Category Type */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-white uppercase tracking-wider">
                            Category <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={item.categoryType}
                            onValueChange={(value) => handleItemChange(index, 'categoryType', value)}
                          >
                            <SelectTrigger className="w-full h-10">
                              <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Drug">Drug</SelectItem>
                              <SelectItem value="Nutraceutical">Nutraceutical</SelectItem>
                              <SelectItem value="Cosmetics">Cosmetics</SelectItem>
                              <SelectItem value="Ayurvedic">Ayurvedic</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                         {/* Formulation Type */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-white uppercase tracking-wider">
                            Formulation <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={item.formulationType}
                            onValueChange={(value) => handleItemChange(index, 'formulationType', value)}
                          >
                            <SelectTrigger className="w-full h-10">
                              <SelectValue placeholder="Select Formulation" />
                            </SelectTrigger>
                            <SelectContent>
                              {FORMULATION_TYPES.map(type => (
                                   <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Colour of Soft Gelatin - Only for Soft Gelatine formulation */}
                        {item.formulationType === 'Soft Gelatine' && (
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-white uppercase tracking-wider">
                              Colour of Soft Gelatin <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              value={item.softGelatinColor || ''}
                              onChange={(e) => handleItemChange(index, 'softGelatinColor', e.target.value)}
                              placeholder="Enter colour"
                              className="h-10"
                            />
                          </div>
                        )}

                        {/* Injection Type - Only for Injection formulation */}
                        {item.formulationType === 'Injection' && (
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-white uppercase tracking-wider">
                              Injection Type <span className="text-red-500">*</span>
                            </Label>
                            <Select
                              value={item.injectionType || ''}
                              onValueChange={(value) => handleItemChange(index, 'injectionType', value)}
                            >
                              <SelectTrigger className="w-full h-10">
                                <SelectValue placeholder="Select Injection Type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Dry Injection">Dry Injection</SelectItem>
                                <SelectItem value="Liquid Injection">Liquid Injection</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* Dry Injection Fields - Unit Pack */}
                        {item.formulationType === 'Injection' && item.injectionType === 'Dry Injection' && (
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-white uppercase tracking-wider">
                              Unit Pack <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              value={item.dryInjectionUnitPack || ''}
                              onChange={(e) => handleItemChange(index, 'dryInjectionUnitPack', e.target.value)}
                              placeholder="Enter unit pack"
                              className="h-10"
                            />
                          </div>
                        )}

                        {/* Dry Injection Fields - Pack Type */}
                        {item.formulationType === 'Injection' && item.injectionType === 'Dry Injection' && (
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-white uppercase tracking-wider">
                              Pack Type <span className="text-red-500">*</span>
                            </Label>
                            <Select
                              value={item.dryInjectionPackType || ''}
                              onValueChange={(value) => handleItemChange(index, 'dryInjectionPackType', value)}
                            >
                              <SelectTrigger className="w-full h-10">
                                <SelectValue placeholder="Select Pack Type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Water (WFI)">Water (WFI)</SelectItem>
                                <SelectItem value="Without Water">Without Water</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* Dry Injection Fields - Tray Pack */}
                        {item.formulationType === 'Injection' && item.injectionType === 'Dry Injection' && (
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-white uppercase tracking-wider">
                              Tray Pack <span className="text-red-500">*</span>
                            </Label>
                            <Select
                              value={item.dryInjectionTrayPack || ''}
                              onValueChange={(value) => handleItemChange(index, 'dryInjectionTrayPack', value)}
                            >
                              <SelectTrigger className="w-full h-10">
                                <SelectValue placeholder="Select Tray Pack" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Required">Required</SelectItem>
                                <SelectItem value="Not Required">Not Required</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>

                      {/* Technical Specs Section */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                         {/* Composition - taking full width */}
                         <div className="md:col-span-2 space-y-2">
                          <Label className="text-xs font-medium text-white uppercase tracking-wider">
                            Composition <span className="text-red-500">*</span>
                          </Label>
                           <Input
                              value={item.composition}
                              onChange={(e) => handleItemChange(index, 'composition', e.target.value)}
                              placeholder="Enter product composition"
                              className="h-10"
                          />
                        </div>

                        {/* Packing (Box / Unit) - Conditional */}
                        {showPackingField && (
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-white uppercase tracking-wider">
                              {['Syrup/Suspension', 'Dry Syrup'].includes(item.formulationType) ? 'Unit Pack' : 'Box Packing'} <span className="text-red-500">*</span>
                            </Label>
                             <Select
                                value={item.packing}
                                onValueChange={(value) => handleItemChange(index, 'packing', value)}
                            >
                                <SelectTrigger className="w-full h-10">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {packingOptions.concat(['Custom']).map(opt => (
                                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {item.packing === 'Custom' && (
                              <Input
                                value={item.customPacking || ''}
                                onChange={(e) => handleItemChange(index, 'customPacking', e.target.value)}
                                placeholder="Enter custom packing"
                                className="h-10 mt-2"
                              />
                            )}
                          </div>
                        )}

                        {/* Packaging Type - Spanning remaining - Hide for Dry Injection */}
                        {!(item.formulationType === 'Injection' && item.injectionType === 'Dry Injection') && (
                          <div className={`space-y-2 ${!showPackingField ? 'md:col-span-2' : ''}`}>
                            <Label className="text-xs font-medium text-white uppercase tracking-wider">
                              {['Syrup/Suspension', 'Dry Syrup'].includes(item.formulationType) ? 'Label Type' : 'Packaging Type'} <span className="text-red-500">*</span>
                            </Label>
                            {packagingOptions ? (
                                 <Select
                                    value={item.packagingType}
                                    onValueChange={(value) => handleItemChange(index, 'packagingType', value)}
                                >
                                    <SelectTrigger className="w-full h-10">
                                        <SelectValue placeholder="Select Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {packagingOptions.concat(['Custom']).map(opt => (
                                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                 <Input
                                    value={item.packagingType}
                                    onChange={(e) => handleItemChange(index, 'packagingType', e.target.value)}
                                    placeholder="Type"
                                    className="h-10"
                                />
                            )}
                            {item.packagingType === 'Custom' && (
                              <Input
                                value={item.customPackagingType || ''}
                                onChange={(e) => handleItemChange(index, 'customPackagingType', e.target.value)}
                                placeholder="Enter custom packaging type"
                                className="h-10 mt-2"
                              />
                            )}
                          </div>
                        )}

                        {/* PVC Type Field - Only for Blister packaging */}
                        {item.packagingType === 'Blister' && (
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-white uppercase tracking-wider">
                              PVC Type
                            </Label>
                            <Select
                              value={item.pvcType || ''}
                              onValueChange={(value) => handleItemChange(index, 'pvcType', value)}
                            >
                              <SelectTrigger className="w-full h-10">
                                <SelectValue placeholder="Select PVC Type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Clear PVC">Clear PVC</SelectItem>
                                <SelectItem value="Amber PVC">Amber PVC</SelectItem>
                                <SelectItem value="Custom">Custom</SelectItem>
                              </SelectContent>
                            </Select>
                            {item.pvcType === 'Custom' && (
                              <Input
                                value={item.customPvcType || ''}
                                onChange={(e) => handleItemChange(index, 'customPvcType', e.target.value)}
                                placeholder="Enter custom PVC type"
                                className="h-10 mt-2"
                              />
                            )}
                          </div>
                        )}

                        {/* Liquid Injection Fields - Box Packing */}
                        {item.formulationType === 'Injection' && item.injectionType === 'Liquid Injection' && (
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-white uppercase tracking-wider">
                              Box Packing <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              value={item.injectionBoxPacking || ''}
                              onChange={(e) => handleItemChange(index, 'injectionBoxPacking', e.target.value)}
                              placeholder="Enter box packing"
                              className="h-10"
                            />
                          </div>
                        )}

                        {/* Liquid Injection Fields - Injection Packing */}
                        {item.formulationType === 'Injection' && item.injectionType === 'Liquid Injection' && (
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-white uppercase tracking-wider">
                              Injection Packing <span className="text-red-500">*</span>
                            </Label>
                            <Select
                              value={item.injectionPacking || ''}
                              onValueChange={(value) => handleItemChange(index, 'injectionPacking', value)}
                            >
                              <SelectTrigger className="w-full h-10">
                                <SelectValue placeholder="Select Injection Packing" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Tray Packing">Tray Packing</SelectItem>
                                <SelectItem value="Blister Packing">Blister Packing</SelectItem>
                                <SelectItem value="Custom">Custom</SelectItem>
                              </SelectContent>
                            </Select>
                            {item.injectionPacking === 'Custom' && (
                              <Input
                                value={item.customInjectionPacking || ''}
                                onChange={(e) => handleItemChange(index, 'customInjectionPacking', e.target.value)}
                                placeholder="Enter custom injection packing"
                                className="h-10 mt-2"
                              />
                            )}
                          </div>
                        )}

                        {/* Liquid Injection PVC Type - Only for Blister Packing */}
                        {item.formulationType === 'Injection' && item.injectionType === 'Liquid Injection' && item.injectionPacking === 'Blister Packing' && (
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-white uppercase tracking-wider">
                              PVC Type
                            </Label>
                            <Input
                              value={item.injectionPvcType || ''}
                              onChange={(e) => handleItemChange(index, 'injectionPvcType', e.target.value)}
                              placeholder="Enter PVC type (optional)"
                              className="h-10"
                            />
                          </div>
                        )}

                        {/* Carton Field - Only for Syrup/Suspension and Dry Syrup */}
                        {['Syrup/Suspension', 'Dry Syrup'].includes(item.formulationType) && (
                          <div className="space-y-2">
                             <Label className="text-xs font-medium text-white uppercase tracking-wider">
                              Carton {item.formulationType === 'Dry Syrup' && <span className="text-red-500">*</span>}
                            </Label>
                            <Select
                                value={item.cartonPacking}
                                onValueChange={(value) => handleItemChange(index, 'cartonPacking', value)}
                            >
                                <SelectTrigger className="w-full h-10">
                                    <SelectValue placeholder="Select Carton" />
                                </SelectTrigger>
                                <SelectContent>
                                    {(CARTON_OPTIONS[item.formulationType] || []).concat(['Custom']).map(opt => (
                                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {item.cartonPacking === 'Custom' && (
                              <Input
                                value={item.customCartonPacking || ''}
                                onChange={(e) => handleItemChange(index, 'customCartonPacking', e.target.value)}
                                placeholder="Enter custom carton"
                                className="h-10 mt-2"
                              />
                            )}
                          </div>
                        )}

                        {/* Water Type Field - Only for Dry Syrup */}
                        {item.formulationType === 'Dry Syrup' && (
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-white uppercase tracking-wider">
                              Water Type <span className="text-red-500">*</span>
                            </Label>
                            <Select
                              value={item.drySyrupWaterType || ''}
                              onValueChange={(value) => handleItemChange(index, 'drySyrupWaterType', value)}
                            >
                              <SelectTrigger className="w-full h-10">
                                <SelectValue placeholder="Select Water Type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Water">Water</SelectItem>
                                <SelectItem value="Without Water">Without Water</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}


                        {/* Specification - Optional */}
                        <div className="md:col-span-2 space-y-2">
                          <Label className="text-xs font-medium text-white uppercase tracking-wider">
                            Specification
                          </Label>
                          <Input
                            value={item.specification || ''}
                            onChange={(e) => handleItemChange(index, 'specification', e.target.value)}
                            placeholder="Enter specification (optional)"
                            className="h-10"
                          />
                        </div>

                      </div>

                      <Separator className="bg-border/40" />

                      {/* Commercials Section */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-end">
                        {/* Quantity */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-white uppercase tracking-wider">
                            Quantity <span className="text-red-500">*</span>
                          </Label>
                          <div className="relative">
                            <Input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                              onKeyDown={handleNumericKeyDown}
                              className="h-12 text-lg font-medium pl-3"
                            />
                            <span className="absolute right-3 top-3.5 text-xs text-muted-foreground">Units</span>
                          </div>
                        </div>

                         {/* MRP */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-white uppercase tracking-wider">
                            MRP (₹) <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={item.mrp}
                            onChange={(e) => handleItemChange(index, 'mrp', e.target.value)}
                            onKeyDown={handleNumericKeyDown}
                            className="h-12 text-lg pl-3"
                          />
                        </div>

                         {/* Our Rate */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-white uppercase tracking-wider">
                            Our Rate (₹) <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={item.rate}
                            onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                            onKeyDown={handleNumericKeyDown}
                            className="h-12 text-xl font-bold text-primary pl-3 border-primary/20 focus:border-primary"
                          />
                        </div>

                        {/* Total Amount Display - REMOVED */}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Additional Info - Read-only for all users, managed from Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="terms">Terms & Conditions</Label>
                <Textarea
                  id="terms"
                  name="terms"
                  value={formData.terms}
                  readOnly
                  rows={3}
                  className="bg-muted/50 cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankDetails">Account Details</Label>
                <Textarea
                  id="bankDetails"
                  name="bankDetails"
                  value={formData.bankDetails}
                  readOnly
                  rows={3}
                  className="bg-muted/50 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-muted-foreground">These fields can only be updated by Admin/Manager from Settings.</p>
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-4">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Quote Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="taxPercent" className="text-muted-foreground">Tax (%)</Label>
                  <Select
                    value={formData.taxPercent?.toString() || '0'}
                    onValueChange={(value) => setFormData({ ...formData, taxPercent: parseFloat(value) })}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0%</SelectItem>
                      <SelectItem value="5">5%</SelectItem>
                      <SelectItem value="18">18%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {taxOnSubtotal > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax on Subtotal</span>
                    <span>₹{taxOnSubtotal.toFixed(2)}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="cylinderCharges" className="text-muted-foreground">Cylinder Charges</Label>
                      <Select
                        value={String(formData.numberOfCylinders || 0)}
                        onValueChange={(value) => setFormData({ ...formData, numberOfCylinders: parseInt(value) })}
                      >
                        <SelectTrigger className="w-14 h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                            <SelectItem key={num} value={String(num)}>{num}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      id="cylinderCharges"
                      type="text"
                      inputMode="decimal"
                      name="cylinderCharges"
                      value={formData.cylinderCharges}
                      onChange={handleChange}
                      onKeyDown={handleNumericKeyDown}
                      className="w-24 text-right"
                    />
                  </div>
                  {formData.numberOfCylinders > 0 && (
                    <p className="text-xs text-muted-foreground">
                      ({formData.numberOfCylinders} Cylinder{formData.numberOfCylinders > 1 ? 's' : ''})
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="inventoryCharges" className="text-muted-foreground">Inventory Charges</Label>
                  <Input
                    id="inventoryCharges"
                    type="text"
                    inputMode="decimal"
                    name="inventoryCharges"
                    value={formData.inventoryCharges}
                    onChange={handleChange}
                    onKeyDown={handleNumericKeyDown}
                    className="w-24 text-right"
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <Label className="text-muted-foreground">Tax on Charges (%)</Label>
                  <span className="w-20 text-right font-medium">18%</span>
                </div>

                {taxOnCharges > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax on Cylinder & Inventory Charges</span>
                    <span>₹{taxOnCharges.toFixed(2)}</span>
                  </div>
                )}

                {totalTax > 0 && (
                  <div className="flex justify-between font-semibold">
                    <span className="text-muted-foreground">Total Tax</span>
                    <span>₹{totalTax.toFixed(2)}</span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-muted-foreground pt-2 border-t border-dashed">
                  <span>Advance Payment (35%)</span>
                  <span>₹{advancePayment.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleSubmit(false)}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                  Save as Draft
                </Button>
                <Button
                  className="w-full"
                  onClick={() => handleSubmit(true)}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send size={16} className="mr-2" />}
                  Submit for Approval
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      ) : (
      /* Draft Preview Panel */
      <Card className="border-2 border-primary/20">
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2">
              <Eye size={20} />
              Draft Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <QuotePreview quote={formData} isDraft={true} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuoteForm;
