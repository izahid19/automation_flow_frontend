// Shared Footer Component for all designs
const InvoiceFooter = ({ quote, companySettings, totals }) => {
  const { subtotal, taxOnSubtotal, taxOnCharges, totalTax, total, advancePayment } = totals;

  return (
    <>
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
              <span className="text-gray-600">
                Cylinder Charges
                {quote?.numberOfCylinders > 0 && (
                  <span className="text-xs ml-1">({quote.numberOfCylinders} Cylinder{quote.numberOfCylinders > 1 ? 's' : ''})</span>
                )}
              </span>
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
    </>
  );
};

export default InvoiceFooter;
