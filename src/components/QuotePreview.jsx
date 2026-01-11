import { useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';

const QuotePreview = ({ quote, isDraft = false }) => {
  const [companySettings, setCompanySettings] = useState({
    companyPhone: '+917696275527',
    companyEmail: 'user@gmail.com',
    invoiceLabel: 'QUOTATION',
    advancePaymentNote: 'Please pay the advance amount to continue the process.'
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
          advancePaymentNote: response.data.data.advancePaymentNote || 'Please pay the advance amount to continue the process.'
        });
      }
    } catch (error) {
      console.error('Failed to fetch company settings:', error);
    }
  };

  const items = quote?.items || [];
  const hasSoftGelatin = items.some(item => item.formulationType === 'Soft Gelatine');
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

  return (
    <div className="bg-white text-black p-8 min-h-[600px]">
      {/* Header */}
      <div className="border-b-4 border-orange-500 pb-4 mb-6">
        <div className="flex justify-between items-center">
          <div className="shrink-0">
            <img src="/logo/chemsrootlogo.png" alt="Company Logo" className="h-24 w-auto object-contain mb-2" />
            <div className="text-xs text-gray-600 leading-relaxed">
              <p>📞 {companySettings.companyPhone}</p>
              <p>✉️ {companySettings.companyEmail}</p>
            </div>
          </div>
          <div className="flex-1 text-center">
            <h1 className="text-3xl font-bold text-gray-800">{companySettings.invoiceLabel}</h1>
          </div>
          <div className="text-right shrink-0 min-w-[180px]">
            <p className="text-sm text-gray-500">Order Number</p>
            <p className="text-lg font-semibold text-gray-700">
              {quote?.quoteNumber || 'CR-XXXX-XXXX'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Date: {quote?.createdAt ? new Date(quote.createdAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}
            </p>
            <p className="text-xs text-gray-500">
              Time: {quote?.createdAt 
                ? new Date(quote.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                : new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
              }
            </p>
          </div>
        </div>
      </div>

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
            <p className="text-lg font-semibold text-gray-800">{quote?.createdBy?.email || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-8 overflow-x-auto">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Quote Items</h3>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-1 py-2 text-left text-xs font-semibold text-gray-700">#</th>
              <th className="border border-gray-300 px-1 py-2 text-left text-xs font-semibold text-gray-700">Brand Name</th>
              <th className="border border-gray-300 px-1 py-2 text-left text-xs font-semibold text-gray-700" style={{ maxWidth: '120px' }}>Composition</th>
              <th className="border border-gray-300 px-1 py-2 text-left text-xs font-semibold text-gray-700">Formulation Type</th>
              <th className="border border-gray-300 px-1 py-2 text-left text-xs font-semibold text-gray-700">Packing</th>
              <th className="border border-gray-300 px-1 py-2 text-left text-xs font-semibold text-gray-700">Packaging / Label Type</th>
              <th className="border border-gray-300 px-1 py-2 text-left text-xs font-semibold text-gray-700">Carton</th>
              <th className="border border-gray-300 px-1 py-2 text-left text-xs font-semibold text-gray-700" style={{ maxWidth: '100px' }}>Specification</th>
              {hasSoftGelatin && (
                <th className="border border-gray-300 px-1 py-2 text-left text-xs font-semibold text-gray-700">Soft Gelatin Color</th>
              )}
              <th className="border border-gray-300 px-1 py-2 text-center text-xs font-semibold text-gray-700">Qty</th>
              <th className="border border-gray-300 px-1 py-2 text-right text-xs font-semibold text-gray-700">MRP</th>
              <th className="border border-gray-300 px-1 py-2 text-right text-xs font-semibold text-gray-700">Rate</th>
              <th className="border border-gray-300 px-1 py-2 text-right text-xs font-semibold text-gray-700">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border border-gray-300 px-1 py-2 text-xs">{index + 1}</td>
                <td className="border border-gray-300 px-1 py-2 text-xs font-medium">{item.brandName || '-'}</td>
                <td className="border border-gray-300 px-1 py-2 text-xs text-gray-600" style={{ maxWidth: '120px', wordWrap: 'break-word' }}>{item.composition || '-'}</td>
                <td className="border border-gray-300 px-1 py-2 text-xs">{item.formulationType || '-'}</td>
                <td className="border border-gray-300 px-1 py-2 text-xs">
                  {item.packing === 'Custom' ? (item.customPacking || '-') : (item.packing || '-')}
                </td>
                <td className="border border-gray-300 px-1 py-2 text-xs">
                  {item.packagingType === 'Custom' ? (item.customPackagingType || '-') : (item.packagingType || '-')}
                </td>
                <td className="border border-gray-300 px-1 py-2 text-xs">
                  {['Syrup/Suspension', 'Dry Syrup'].includes(item.formulationType) ? (
                    item.cartonPacking === 'Custom' ? (item.customCartonPacking || '-') : (item.cartonPacking || '-')
                  ) : '-'}
                </td>
                <td className="border border-gray-300 px-1 py-2 text-xs" style={{ maxWidth: '100px', wordWrap: 'break-word' }}>{item.specification || '-'}</td>
                {hasSoftGelatin && (
                  <td className="border border-gray-300 px-1 py-2 text-xs">
                    {item.formulationType === 'Soft Gelatine' ? (item.softGelatinColor || '-') : '-'}
                  </td>
                )}
                <td className="border border-gray-300 px-1 py-2 text-xs text-center">{item.quantity || 0}</td>
                <td className="border border-gray-300 px-1 py-2 text-xs text-right">₹{(item.mrp || 0).toFixed(2)}</td>
                <td className="border border-gray-300 px-1 py-2 text-xs text-right">₹{(item.rate || 0).toFixed(2)}</td>
                <td className="border border-gray-300 px-1 py-2 text-xs text-right font-medium">
                  ₹{((item.quantity || 0) * (item.rate || 0)).toFixed(2)}
                </td>
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
            <span className="font-medium">₹{subtotal.toFixed(2)}</span>
          </div>
          {taxOnSubtotal > 0 && (
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Tax on Subtotal ({quote?.taxPercent}%)</span>
              <span className="font-medium">₹{taxOnSubtotal.toFixed(2)}</span>
            </div>
          )}
          {(quote?.cylinderCharges > 0) && (
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Cylinder Charges</span>
              <span className="font-medium">₹{parseFloat(quote.cylinderCharges).toFixed(2)}</span>
            </div>
          )}
          {(quote?.inventoryCharges > 0) && (
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Inventory Charges</span>
              <span className="font-medium">₹{parseFloat(quote.inventoryCharges).toFixed(2)}</span>
            </div>
          )}
          {taxOnCharges > 0 && (
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Tax on Cylinder & Inventory Charges (18%)</span>
              <span className="font-medium">₹{taxOnCharges.toFixed(2)}</span>
            </div>
          )}
          {totalTax > 0 && (
            <div className="flex justify-between py-2 border-b border-gray-200 font-semibold">
              <span className="text-gray-600">Total Tax</span>
              <span className="font-medium">₹{totalTax.toFixed(2)}</span>
            </div>
          )}
            <div className="flex justify-between py-3 border-t-2 border-gray-800 mt-2">
              <span className="text-lg font-bold">Total</span>
              <span className="text-lg font-bold text-orange-500">₹{total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 border-t border-gray-200 mt-1 text-sm text-gray-600">
               <span>Advance Payment (35%)</span>
               <span className="font-medium">₹{advancePayment.toFixed(2)}</span>
            </div>
        </div>
      </div>

      {/* Advance Payment Note */}
      <div className="mb-6 pb-4 border-b border-gray-300">
        <p className="text-sm font-medium text-gray-700 text-center">
          {companySettings.advancePaymentNote}
        </p>
      </div>

      {/* Terms & Account Details */}
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Terms & Conditions</h3>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{quote?.terms || 'Payment due within 30 days. All prices in INR.'}</p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Account Details</h3>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{quote?.bankDetails || 'No account details specified'}</p>
        </div>
      </div>
    </div>
  );
};

export default QuotePreview;
