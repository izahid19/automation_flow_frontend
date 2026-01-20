import { useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';
import Design2 from './invoiceDesigns/Design2';
import InvoiceHeader from './invoiceDesigns/InvoiceHeader';

const PurchaseOrderPreview = ({ formData, items, manufacturer, totals }) => {
  const [companySettings, setCompanySettings] = useState({
    companyName: 'Chem Smat', 
    companyAddress: 'SCO 23, Top Floor, Swastik Vihar, MDC Sector 5, Panchkula, Haryana 134109',
    companyPhone: '+917696275527',
    companyEmail: 'user@gmail.com',
    invoiceLabel: 'PURCHASE ORDER',
    invoiceDesign: 'design2'
  });

  useEffect(() => {
    fetchCompanySettings();
  }, []);

  const fetchCompanySettings = async () => {
    try {
      const response = await settingsAPI.getAll();
      if (response.data.success) {
        setCompanySettings(prev => ({
          ...prev,
          ...response.data.data,
          invoiceLabel: 'PURCHASE ORDER' // Force label for PO
        }));
      }
    } catch (error) {
      console.error('Failed to fetch company settings:', error);
    }
  };

  const quoteForHeader = {
    quoteNumber: formData.quoteNumber ? `Ref: ${formData.quoteNumber}` : 'DRAFT',
    createdAt: new Date().toISOString()
  };

  return (
    <div className="bg-white text-black p-8 min-h-[600px] shadow-lg rounded-lg">
      {/* Header */}
      <InvoiceHeader quote={quoteForHeader} companySettings={companySettings} />

      {/* Addresses */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Vendor / Manufacturer</h3>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <p className="text-lg font-bold text-gray-800 mb-1">{manufacturer?.name || 'Select Manufacturer'}</p>
            {manufacturer?.email && (
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <span className="w-4 h-4 flex items-center justify-center rounded-full bg-gray-200 text-xs">@</span>
                {manufacturer.email}
              </p>
            )}
            {manufacturer?.address && <p className="text-sm text-gray-600 mt-2">{manufacturer.address}</p>}
          </div>
        </div>
        

      </div>

      {/* Items using Design2 Layout */}
      <Design2 
        items={items} 
        totals={totals}
        hasSoftGelatin={items.some(i => i.formulationType === 'Soft Gelatine')}
        hasBlister={items.some(i => i.packagingType === 'Blister')}
        quote={{}} // Passing empty quote object as Design2 might check fields, but we pass items directly
        companySettings={companySettings}
        hidePurchaseRate={formData.hidePurchaseRate}
      />

      {/* Footer / Totals */}
      <div className="border-t pt-6 mt-6">
        <div className="flex justify-end">
          <div className="w-80 space-y-3">
             <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span className="font-medium">₹{totals.subtotal.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center pt-3 border-t border-gray-200">
              <span className="text-xl font-bold text-gray-800">Total:</span>
              <span className="text-xl font-bold text-emerald-600">₹{totals.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {formData.notes && (
          <div className="mt-8 pt-6 border-t border-dashed border-gray-200">
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Notes & Instructions</h4>
            <p className="text-gray-600 bg-yellow-50 p-4 rounded-lg text-sm border border-yellow-100">
              {formData.notes}
            </p>
          </div>
        )}
      </div>

      <div className="mt-12 text-center text-xs text-gray-400 pt-8 border-t">
        <p>This is a computer generated purchase order and does not require a signature.</p>
        <p className="mt-1">Thank you for your business!</p>
      </div>
    </div>
  );
};

export default PurchaseOrderPreview;
