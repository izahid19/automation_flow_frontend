// Design 2: Card-Based Layout
const Design2 = ({ quote, companySettings, items, hasSoftGelatin, hasBlister, totals }) => {
  const { subtotal, taxOnSubtotal, taxOnCharges, totalTax, total, advancePayment } = totals;

  return (
    <>
      {/* Items Cards */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Quote Items</h3>
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="border-2 border-gray-200 rounded-lg p-4 bg-white shadow-sm">
              <div className="grid grid-cols-12 gap-3 items-start">
                {/* Item Number */}
                <div className="col-span-1 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                </div>
                
                {/* Main Details */}
                <div className="col-span-7 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-bold text-base text-gray-800">{item.brandName || '-'}</h4>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-medium text-gray-600">MRP: ₹{(parseFloat(item.mrp) || 0).toFixed(2)}</p>
                    </div>
                  </div>
                  
                  {/* Composition - Full Width */}
                  {item.composition && (
                    <div className="pt-2">
                      <span className="text-xs text-gray-500 font-medium">Composition:</span>
                      <p className="text-xs text-gray-700 mt-1 break-all">{item.composition}</p>
                    </div>
                  )}
                  
                  {/* Specifications Grid */}
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-200">
                    <div>
                      <span className="text-xs text-gray-500">Category:</span>
                      <p className="text-xs font-medium">{item.categoryType || '-'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Formulation:</span>
                      <p className="text-xs font-medium">{item.formulationType || '-'}</p>
                    </div>
                    {item.formulationType === 'Injection' && item.injectionType && (
                      <div>
                        <span className="text-xs text-gray-500">Injection Type:</span>
                        <p className="text-xs font-medium">{item.injectionType}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-xs text-gray-500">
                        {item.formulationType === 'Injection' && item.injectionType === 'Liquid Injection' 
                          ? 'Box Packing:'
                          : item.formulationType === 'Injection' && item.injectionType === 'Dry Injection'
                          ? 'Unit Pack:'
                          : ['Syrup/Suspension', 'Dry Syrup'].includes(item.formulationType) ? 'Unit Pack:' : 'Box Packing:'}
                      </span>
                      <p className="text-xs font-medium">
                        {item.formulationType === 'Injection' && item.injectionType === 'Liquid Injection' 
                          ? (item.injectionBoxPacking || '-')
                          : item.formulationType === 'Injection' && item.injectionType === 'Dry Injection'
                          ? (item.dryInjectionUnitPack || '-')
                          : item.packing === 'Custom' ? (item.customPacking || '-') : (item.packing || '-')}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">
                        {['Syrup/Suspension', 'Dry Syrup'].includes(item.formulationType) ? 'Label Type:' : 'Packaging Type:'}
                      </span>
                      <p className="text-xs font-medium">
                        {item.packagingType === 'Custom' ? (item.customPackagingType || '-') : (item.packagingType || '-')}
                      </p>
                    </div>
                    {hasBlister && item.packagingType === 'Blister' && (
                      <div>
                        <span className="text-xs text-gray-500">PVC Type:</span>
                        <p className="text-xs font-medium">
                          {item.pvcType === 'Custom' ? (item.customPvcType || '-') : (item.pvcType || '-')}
                        </p>
                      </div>
                    )}
                    {['Syrup/Suspension', 'Dry Syrup'].includes(item.formulationType) && (
                      <div>
                        <span className="text-xs text-gray-500">Carton:</span>
                        <p className="text-xs font-medium">
                          {item.cartonPacking === 'Custom' ? (item.customCartonPacking || '-') : (item.cartonPacking || '-')}
                        </p>
                      </div>
                    )}
                    {item.formulationType === 'Dry Syrup' && item.drySyrupWaterType && (
                      <div>
                        <span className="text-xs text-gray-500">Water Type:</span>
                        <p className="text-xs font-medium">{item.drySyrupWaterType}</p>
                      </div>
                    )}
                    {hasSoftGelatin && item.formulationType === 'Soft Gelatine' && (
                      <div>
                        <span className="text-xs text-gray-500">Colour of Soft Gelatin:</span>
                        <p className="text-xs font-medium">{item.softGelatinColor || '-'}</p>
                      </div>
                    )}
                    {/* Dry Injection specific fields */}
                    {item.formulationType === 'Injection' && item.injectionType === 'Dry Injection' && (
                      <>
                        <div>
                          <span className="text-xs text-gray-500">Pack Type:</span>
                          <p className="text-xs font-medium">{item.dryInjectionPackType || '-'}</p>
                        </div>
                        {item.dryInjectionTrayPack === 'Required' && (
                          <div>
                            <span className="text-xs text-gray-500">Tray Pack:</span>
                            <p className="text-xs font-medium">Required</p>
                          </div>
                        )}
                      </>
                    )}
                    {/* Liquid Injection specific fields */}
                    {item.formulationType === 'Injection' && item.injectionType === 'Liquid Injection' && (
                      <>
                        <div>
                          <span className="text-xs text-gray-500">Injection Packing:</span>
                          <p className="text-xs font-medium">
                            {item.injectionPacking === 'Custom' ? (item.customInjectionPacking || '-') : (item.injectionPacking || '-')}
                          </p>
                        </div>
                        {item.injectionPacking === 'Blister Packing' && item.injectionPvcType && (
                          <div>
                            <span className="text-xs text-gray-500">PVC Type:</span>
                            <p className="text-xs font-medium">{item.injectionPvcType}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  
                  {/* Specification - Full Width */}
                  {item.specification && (
                    <div className="pt-2 border-t border-gray-200">
                      <span className="text-xs text-gray-500 font-medium">Specification:</span>
                      <p className="text-xs text-gray-700 mt-1 break-all">{item.specification}</p>
                    </div>
                  )}
                </div>
                
                {/* Pricing */}
                <div className="col-span-4 border-l-2 border-gray-200 pl-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">Quantity:</span>
                    <span className="text-xs font-medium">{item.quantity || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">Our Rate (₹):</span>
                    <span className="text-xs font-medium">₹{(parseFloat(item.rate) || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-sm font-semibold text-gray-700">Amount:</span>
                    <span className="text-sm font-bold text-orange-500">₹{((parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0)).toFixed(2)}</span>
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

export default Design2;
