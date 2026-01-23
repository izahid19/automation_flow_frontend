import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { quoteAPI, settingsAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, Save, Send, Loader2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import QuotePreview from '@/components/QuotePreview';
import { DEFAULT_ITEM } from '@/constants/quote.constants';
import { QuoteItemCard, ClientDetailsSection, QuoteSummaryCard, AdditionalInfoSection } from '@/components/quote';
import { useItemManagement } from '@/hooks/form/useItemManagement';
import { validateQuoteForm } from '@/utils/validators';
import { hasFormChanges, deepClone } from '@/utils/formHelpers';

const QuoteForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const repeatQuoteId = searchParams.get('repeat');
  const isEditMode = !!id;
  const isRepeatMode = !!repeatQuoteId;

  // State
  const [loading, setLoading] = useState(false);
  const [loadingQuote, setLoadingQuote] = useState(isEditMode || isRepeatMode);
  const [showPreview, setShowPreview] = useState(false);
  const [initialFormData, setInitialFormData] = useState(null);
  
  const [formData, setFormData] = useState({
    partyName: '',
    marketedBy: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: '',
    discountPercent: 0,
    taxPercent: 5,
    taxPercentOnCharges: 18,
    cylinderCharges: 0,
    numberOfCylinders: 2,
    inventoryCharges: 0,
    terms: 'Payment due within 30 days. All prices in INR.',
    bankDetails: '',
  });

  const [companySettings, setCompanySettings] = useState({
    companyPhone: '+917696275527',
    companyEmail: 'user@gmail.com',
    invoiceLabel: 'QUOTATION'
  });

  const [errors, setErrors] = useState({});
  const [itemErrors, setItemErrors] = useState([]);

  // Use item management hook
  const {
    items,
    updateItem,
    addItem,
    copyItem,
    removeItem,
    setAllItems,
    canRemoveItems,
  } = useItemManagement([{ ...DEFAULT_ITEM }]);

  // Check for unsaved changes
  const hasChanges = hasFormChanges(
    { ...formData, items }, 
    initialFormData
  );

  // Fetch settings on mount
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

  // Fetch quote for edit mode
  useEffect(() => {
    if (!isEditMode) return;
    
    const fetchQuote = async () => {
      try {
        setLoadingQuote(true);
        const response = await quoteAPI.getOne(id);
        const quote = response.data.data;
        
        const mappedData = {
          partyName: quote.clientName || '',
          marketedBy: quote.marketedBy || '',
          clientEmail: quote.clientEmail || '',
          clientPhone: quote.clientPhone || '',
          clientAddress: quote.clientAddress || '',
          discountPercent: quote.discountPercent || 0,
          taxPercent: quote.taxPercent || 0,
          taxPercentOnCharges: 18,
          cylinderCharges: quote.cylinderCharges || 0,
          numberOfCylinders: quote.numberOfCylinders || 0,
          inventoryCharges: quote.inventoryCharges || 0,
          terms: quote.terms || 'Payment due within 30 days. All prices in INR.',
          bankDetails: quote.bankDetails || '',
        };

        setFormData(mappedData);
        setAllItems(quote.items && quote.items.length > 0 ? quote.items : [{ ...DEFAULT_ITEM }]);
        setInitialFormData(deepClone({ ...mappedData, items: quote.items }));
      } catch (error) {
        toast.error('Failed to load quote');
        navigate('/quotes');
      } finally {
        setLoadingQuote(false);
      }
    };
    
    fetchQuote();
  }, [id, isEditMode, navigate, setAllItems]);

  // Fetch quote for repeat mode
  useEffect(() => {
    if (!isRepeatMode) return;
    
    const fetchRepeatQuote = async () => {
      try {
        setLoadingQuote(true);
        const response = await quoteAPI.getOne(repeatQuoteId);
        const quote = response.data.data;
        
        const repeatItems = quote.items && quote.items.length > 0 
          ? quote.items.map(item => ({ ...item, orderType: 'Repeat' }))
          : [{ ...DEFAULT_ITEM, orderType: 'Repeat' }];
        
        setFormData({
          partyName: quote.clientName || '',
          marketedBy: quote.marketedBy || '',
          clientEmail: quote.clientEmail || '',
          clientPhone: quote.clientPhone || '',
          clientAddress: quote.clientAddress || '',
          discountPercent: quote.discountPercent || 0,
          taxPercent: quote.taxPercent || 5,
          taxPercentOnCharges: 18,
          cylinderCharges: quote.cylinderCharges || 0,
          numberOfCylinders: quote.numberOfCylinders || 2,
          inventoryCharges: quote.inventoryCharges || 0,
          terms: quote.terms || 'Payment due within 30 days. All prices in INR.',
          bankDetails: quote.bankDetails || '',
        });
        setAllItems(repeatItems);
        toast.success('Quote data loaded for repeat order');
      } catch (error) {
        toast.error('Failed to load quote for repeat order');
        navigate('/quotes');
      } finally {
        setLoadingQuote(false);
      }
    };
    
    fetchRepeatQuote();
  }, [repeatQuoteId, isRepeatMode, navigate, setAllItems]);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Validate and submit
  const handleSubmit = async (submitForApproval = false) => {
    const { errors: formErrors, itemErrors: itemErrs } = validateQuoteForm({ ...formData, items });
    
    if (Object.keys(formErrors).length > 0 || itemErrs.some(e => Object.keys(e).length > 0)) {
      setErrors(formErrors);
      setItemErrors(itemErrs);
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        clientName: formData.partyName,
        items,
      };
      
      let quoteId = id;
      
      if (isEditMode) {
        const response = await quoteAPI.update(id, submitData);
        const updatedQuote = response.data.data;
        toast.success('Quote updated successfully!');
        
        if (submitForApproval && updatedQuote.status === 'draft') {
          await quoteAPI.resubmit(quoteId);
          toast.success('Quote resubmitted for approval!');
        }
      } else {
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

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      return sum + (qty * rate);
    }, 0);
    
    const cylinderCharges = parseFloat(formData.cylinderCharges) || 0;
    const inventoryCharges = parseFloat(formData.inventoryCharges) || 0;
    const taxPercent = parseFloat(formData.taxPercent) || 0;
    const taxPercentOnCharges = 18;
    
    const taxOnSubtotal = (subtotal * taxPercent) / 100;
    const chargesTotal = cylinderCharges + inventoryCharges;
    const taxOnCharges = (chargesTotal * taxPercentOnCharges) / 100;
    const totalTax = taxOnSubtotal + taxOnCharges;
    const total = subtotal + cylinderCharges + inventoryCharges + totalTax;
    const advancePayment = total * 0.35;

    return { subtotal, taxOnSubtotal, taxOnCharges, totalTax, total, advancePayment };
  };

  const { subtotal, taxOnSubtotal, taxOnCharges, totalTax, total, advancePayment } = calculateTotals();

  // Get error for specific item field
  const getItemError = (index) => (field) => itemErrors[index]?.[field];

  if (loadingQuote) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
            <h1 className="text-2xl font-bold">
              {isEditMode ? 'Edit Quote' : isRepeatMode ? 'Repeat Order' : 'Create New Quote'}
            </h1>
            <p className="text-muted-foreground">
              {isEditMode ? 'Update the quote details' : isRepeatMode ? 'Create a new quote based on previous order' : 'Fill in the details to create a quotation'}
            </p>
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

      {!showPreview ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client Details */}
            <ClientDetailsSection
              formData={formData}
              errors={errors}
              onChange={handleChange}
            />

            {/* Items */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Quote Items</CardTitle>
                <Button variant="outline" size="sm" onClick={addItem}>
                  <Plus size={16} className="mr-2" /> Add Item
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item, index) => (
                  <QuoteItemCard
                    key={index}
                    item={item}
                    index={index}
                    onChange={updateItem}
                    onCopy={copyItem}
                    onRemove={removeItem}
                    canRemove={canRemoveItems()}
                    getError={getItemError(index)}
                  />
                ))}
              </CardContent>
            </Card>

            {/* Additional Info */}
            <AdditionalInfoSection
              formData={formData}
              onChange={handleChange}
              readOnly={true}
            />
          </div>

          {/* Summary Sidebar */}
          <div className="sticky top-4 self-start">
            <QuoteSummaryCard
              subtotal={subtotal}
              taxPercent={formData.taxPercent}
              taxOnSubtotal={taxOnSubtotal}
              cylinderCharges={formData.cylinderCharges}
              numberOfCylinders={formData.numberOfCylinders}
              inventoryCharges={formData.inventoryCharges}
              taxOnCharges={taxOnCharges}
              totalTax={totalTax}
              total={total}
              advancePayment={advancePayment}
              onTaxPercentChange={(value) => setFormData({ ...formData, taxPercent: parseFloat(value) })}
              onCylinderChargesChange={(value) => setFormData({ ...formData, cylinderCharges: value })}
              onNumberOfCylindersChange={(value) => setFormData({ ...formData, numberOfCylinders: parseInt(value) })}
              onInventoryChargesChange={(value) => setFormData({ ...formData, inventoryCharges: value })}
              onSaveDraft={() => handleSubmit(false)}
              onSubmitForApproval={() => handleSubmit(true)}
              loading={loading}
              hasChanges={hasChanges}
              isEditMode={isEditMode}
            />
          </div>
        </div>
      ) : (
        <Card className="border-2 border-primary/20">
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2">
              <Eye size={20} />
              Draft Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <QuotePreview quote={{ ...formData, clientName: formData.partyName, items }} isDraft={true} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuoteForm;
