// Design 3: Compact List Format
const Design3 = ({ quote, companySettings, items, hasSoftGelatin, hasBlister, totals }) => {
  const { subtotal, taxOnSubtotal, taxOnCharges, totalTax, total, advancePayment } = totals;

  return (
    <>
      {/* Items List */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Quote Items</h3>
        <div className="space-y-1">
          {items.map((item, index) => (
            <div key={index} className={`py-3 px-4 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} border-l-4 ${index % 2 === 0 ? 'border-emerald-500' : 'border-gray-300'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-bold text-gray-400 w-6">#{index + 1}</span>
                    <h4 className="font-semibold text-sm text-gray-800">{item.brandName || '-'}</h4>
                    {item.categoryType && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                        {item.categoryType}
                      </span>
                    )}
                    <span className="text-xs px-2 py-0.5 bg-gray-200 rounded">{item.formulationType || '-'}</span>
                  </div>
                  
                  <div className="ml-9 grid grid-cols-4 gap-4 text-xs text-gray-600">
                    <div>
                      <span className="font-medium">Composition:</span> {item.composition || '-'}
                    </div>
                    <div>
                      <span className="font-medium">
                        {['Syrup/Suspension', 'Dry Syrup'].includes(item.formulationType) ? 'Unit Pack:' : 'Box Packing:'}
                      </span> {item.packing === 'Custom' ? (item.customPacking || '-') : (item.packing || '-')}
                    </div>
                    {/* Packaging Type - Hide for Dry Injection */}
                    {!(item.formulationType === 'Injection' && item.injectionType === 'Dry Injection') && (
                      <div>
                        <span className="font-medium">
                          {['Syrup/Suspension', 'Dry Syrup'].includes(item.formulationType) ? 'Label Type:' : 'Packaging Type:'}
                        </span> {item.packagingType === 'Custom' ? (item.customPackagingType || '-') : (item.packagingType || '-')}
                      </div>
                    )}
                    {hasBlister && item.packagingType === 'Blister' && (
                      <div>
                        <span className="font-medium">PVC Type:</span> {item.pvcType === 'Custom' ? (item.customPvcType || '-') : (item.pvcType || '-')}
                      </div>
                    )}
                    {['Syrup/Suspension', 'Dry Syrup'].includes(item.formulationType) && (
                      <div>
                        <span className="font-medium">Carton:</span> {item.cartonPacking === 'Custom' ? (item.customCartonPacking || '-') : (item.cartonPacking || '-')}
                      </div>
                    )}
                    {item.specification && (
                      <div>
                        <span className="font-medium">Specification:</span> {item.specification}
                      </div>
                    )}
                    {hasSoftGelatin && item.formulationType === 'Soft Gelatine' && (
                      <div>
                        <span className="font-medium">Colour of Soft Gelatin:</span> {item.softGelatinColor || '-'}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-right ml-4 min-w-[200px]">
                  <div className="grid grid-cols-4 gap-2 text-xs mb-2">
                    <div className="text-gray-500">Quantity</div>
                    <div className="text-gray-500">MRP (₹)</div>
                    <div className="text-gray-500">Our Rate (₹)</div>
                    <div className="text-gray-500 font-semibold">Amount</div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className="font-medium">{item.quantity || 0}</div>
                    <div>₹{(parseFloat(item.mrp) || 0).toFixed(2)}</div>
                    <div>₹{(parseFloat(item.rate) || 0).toFixed(2)}</div>
                    <div className="font-bold text-orange-500">₹{((parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0)).toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Design3;
