// Design 1: Table Layout (Current/Default Design)
const Design1 = ({ quote, companySettings, items, hasSoftGelatin, hasBlister, totals }) => {
  const { subtotal, taxOnSubtotal, taxOnCharges, totalTax, total, advancePayment } = totals;

  return (
    <>
      {/* Items Table */}
      <div className="mb-8 overflow-x-auto">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Quote Items</h3>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-1 py-2 text-left text-xs font-semibold text-gray-700">#</th>
              <th className="border border-gray-300 px-1 py-2 text-left text-xs font-semibold text-gray-700">Brand Name</th>
              <th className="border border-gray-300 px-1 py-2 text-left text-xs font-semibold text-gray-700">Category</th>
              <th className="border border-gray-300 px-1 py-2 text-left text-xs font-semibold text-gray-700" style={{ maxWidth: '120px' }}>Composition</th>
              <th className="border border-gray-300 px-1 py-2 text-left text-xs font-semibold text-gray-700">Formulation</th>
              <th className="border border-gray-300 px-1 py-2 text-left text-xs font-semibold text-gray-700">Box Packing / Unit Pack</th>
              <th className="border border-gray-300 px-1 py-2 text-left text-xs font-semibold text-gray-700">Packaging Type / Label Type</th>
              {hasBlister && (
                <th className="border border-gray-300 px-1 py-2 text-left text-xs font-semibold text-gray-700">PVC Type</th>
              )}
              <th className="border border-gray-300 px-1 py-2 text-left text-xs font-semibold text-gray-700">Carton</th>
              <th className="border border-gray-300 px-1 py-2 text-left text-xs font-semibold text-gray-700" style={{ maxWidth: '100px' }}>Specification</th>
              {hasSoftGelatin && (
                <th className="border border-gray-300 px-1 py-2 text-left text-xs font-semibold text-gray-700">Colour of Soft Gelatin</th>
              )}
              <th className="border border-gray-300 px-1 py-2 text-center text-xs font-semibold text-gray-700">Quantity</th>
              <th className="border border-gray-300 px-1 py-2 text-right text-xs font-semibold text-gray-700">MRP (₹)</th>
              <th className="border border-gray-300 px-1 py-2 text-right text-xs font-semibold text-gray-700">Our Rate (₹)</th>
              <th className="border border-gray-300 px-1 py-2 text-right text-xs font-semibold text-gray-700">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border border-gray-300 px-1 py-2 text-xs">{index + 1}</td>
                <td className="border border-gray-300 px-1 py-2 text-xs font-medium">{item.brandName || '-'}</td>
                <td className="border border-gray-300 px-1 py-2 text-xs">{item.categoryType || '-'}</td>
                <td className="border border-gray-300 px-1 py-2 text-xs text-gray-600" style={{ maxWidth: '120px', wordWrap: 'break-word' }}>{item.composition || '-'}</td>
                <td className="border border-gray-300 px-1 py-2 text-xs">
                  {item.formulationType || '-'}
                  {item.formulationType === 'Injection' && item.injectionType && (
                    <span className="block text-gray-500 text-[10px]">
                      ({item.injectionType})
                      {item.injectionType === 'Dry Injection' && (
                        <>
                          {item.dryInjectionPackType && <span className="block">Pack: {item.dryInjectionPackType}</span>}
                          {item.dryInjectionTrayPack === 'Required' && <span className="block">Tray: Required</span>}
                        </>
                      )}
                      {item.injectionType === 'Liquid Injection' && item.injectionPacking && (
                        <>
                          <span className="block">Inj. Pack: {item.injectionPacking === 'Custom' ? (item.customInjectionPacking || '-') : item.injectionPacking}</span>
                          {item.injectionPacking === 'Blister Packing' && item.injectionPvcType && <span className="block">PVC: {item.injectionPvcType}</span>}
                        </>
                      )}
                    </span>
                  )}
                </td>
                <td className="border border-gray-300 px-1 py-2 text-xs">
                  {item.formulationType === 'Injection' && item.injectionType === 'Liquid Injection' 
                    ? (item.injectionBoxPacking || '-')
                    : item.formulationType === 'Injection' && item.injectionType === 'Dry Injection'
                    ? (item.dryInjectionUnitPack || '-')
                    : item.packing === 'Custom' ? (item.customPacking || '-') : (item.packing || '-')}
                </td>
                <td className="border border-gray-300 px-1 py-2 text-xs">
                  {item.packagingType === 'Custom' ? (item.customPackagingType || '-') : (item.packagingType || '-')}
                </td>
                {hasBlister && (
                  <td className="border border-gray-300 px-1 py-2 text-xs">
                    {item.packagingType === 'Blister' ? (
                      item.pvcType === 'Custom' ? (item.customPvcType || '-') : (item.pvcType || '-')
                    ) : '-'}
                  </td>
                )}
                <td className="border border-gray-300 px-1 py-2 text-xs">
                  {['Syrup/Suspension', 'Dry Syrup'].includes(item.formulationType) ? (
                    <>
                      {item.cartonPacking === 'Custom' ? (item.customCartonPacking || '-') : (item.cartonPacking || '-')}
                      {item.formulationType === 'Dry Syrup' && item.drySyrupWaterType && (
                        <span className="block text-gray-500 text-[10px]">Water: {item.drySyrupWaterType}</span>
                      )}
                    </>
                  ) : '-'}
                </td>
                <td className="border border-gray-300 px-1 py-2 text-xs" style={{ maxWidth: '100px', wordWrap: 'break-word' }}>{item.specification || '-'}</td>
                {hasSoftGelatin && (
                  <td className="border border-gray-300 px-1 py-2 text-xs">
                    {item.formulationType === 'Soft Gelatine' ? (item.softGelatinColor || '-') : '-'}
                  </td>
                )}
                <td className="border border-gray-300 px-1 py-2 text-xs text-center">{item.quantity || 0}</td>
                <td className="border border-gray-300 px-1 py-2 text-xs text-right">₹{(parseFloat(item.mrp) || 0).toFixed(2)}</td>
                <td className="border border-gray-300 px-1 py-2 text-xs text-right">₹{(parseFloat(item.rate) || 0).toFixed(2)}</td>
                <td className="border border-gray-300 px-1 py-2 text-xs text-right font-medium">
                  ₹{((parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0)).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default Design1;
