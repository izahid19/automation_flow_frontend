// Shared Header Component for all designs
const InvoiceHeader = ({ quote, companySettings }) => {
  return (
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
  );
};

export default InvoiceHeader;
