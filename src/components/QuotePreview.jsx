import { useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';
import InvoiceHeader from './invoiceDesigns/InvoiceHeader';
import InvoiceFooter from './invoiceDesigns/InvoiceFooter';
// import Design1 from './invoiceDesigns/Design1'; // Commented out - keeping for future reference
import Design2 from './invoiceDesigns/Design2';
// Design 3 removed - no longer needed

const QuotePreview = ({ quote, isDraft = false, designOverride = null }) => {
  const [companySettings, setCompanySettings] = useState({
    companyPhone: '+917696275527',
    companyEmail: 'user@gmail.com',
    invoiceLabel: 'QUOTATION',
    advancePaymentNote: 'Please pay the advance amount to continue the process.',
    invoiceDesign: 'design2'
  });

  useEffect(() => {
    fetchCompanySettings();
  }, []);

  const fetchCompanySettings = async () => {
    try {
      const response = await settingsAPI.getAll();
      if (response.data.success) {
        setCompanySettings({
          companyPhone: response.data.data.companyPhone || '+917696275527',
          companyEmail: response.data.data.companyEmail || 'user@gmail.com',
          invoiceLabel: response.data.data.invoiceLabel || 'QUOTATION',
          advancePaymentNote: response.data.data.advancePaymentNote || 'Please pay the advance amount to continue the process.',
          invoiceDesign: response.data.data.invoiceDesign || 'design2'
        });
      }
    } catch (error) {
      console.error('Failed to fetch company settings:', error);
    }
  };

  const items = quote?.items || [];
  const hasSoftGelatin = items.some(item => item.formulationType === 'Soft Gelatine');
  const hasBlister = items.some(item => item.packagingType === 'Blister');
  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity || 0) * (item.rate || 0), 0);
    const cylinderCharges = parseFloat(quote?.cylinderCharges) || 0;
    const inventoryCharges = parseFloat(quote?.inventoryCharges) || 0;
    const taxPercent = parseFloat(quote?.taxPercent) || 0;
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

    return { subtotal, taxOnSubtotal, taxOnCharges, totalTax, total, advancePayment };
  };

  const { subtotal, taxOnSubtotal, taxOnCharges, totalTax, total, advancePayment } = calculateTotals();
  
  const totals = { subtotal, taxOnSubtotal, taxOnCharges, totalTax, total, advancePayment };
  const selectedDesign = designOverride || companySettings.invoiceDesign || 'design2';

  // Render the selected design
  const renderDesign = () => {
    const commonProps = {
      quote,
      companySettings,
      items,
      hasSoftGelatin,
      hasBlister,
      totals
    };

    switch (selectedDesign) {
      // case 'design1': // Commented out - keeping for future reference
      //   return <Design1 {...commonProps} />;
      case 'design2':
      default:
        return <Design2 {...commonProps} />;
    }
  };

  return (
    <div className="bg-white text-black p-8 min-h-[600px]">
      {/* Header */}
      <InvoiceHeader quote={quote} companySettings={companySettings} />

      {/* Client Details */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Bill To</h3>
          <p className="text-lg font-semibold text-gray-800">{quote?.clientName || quote?.partyName || 'Party Name'}</p>
          <p className="text-gray-600">{quote?.clientEmail || 'client@email.com'}</p>
          <p className="text-gray-600">{quote?.clientPhone || '+91 XXXXX XXXXX'}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Marketed By</h3>
            <p className="text-lg font-semibold text-gray-800">{quote?.marketedBy || 'Sales Person'}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Created By</h3>
            <p className="text-lg font-semibold text-gray-800">{quote?.createdByName || quote?.createdBy?.name || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Items - Design Specific */}
      {renderDesign()}

      {/* Footer */}
      <InvoiceFooter quote={quote} companySettings={companySettings} totals={totals} />
    </div>
  );
};

export default QuotePreview;
