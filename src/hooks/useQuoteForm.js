import { useState, useEffect } from 'react';
import { settingsAPI } from '@/services/api';
import { DEFAULT_ITEM } from '@/constants/quote.constants';

/**
 * Custom hook for managing quote form state and handlers
 */
export const useQuoteForm = () => {
  const [formData, setFormData] = useState({
    partyName: '',
    marketedBy: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: '',
    items: [{ ...DEFAULT_ITEM }],
    discountPercent: 0,
    taxPercent: 0,
    cylinderCharges: 0,
    inventoryCharges: 0,
    terms: 'Payment due within 30 days. All prices in INR.',
    bankDetails: '',
  });

  const [companySettings, setCompanySettings] = useState({
    companyPhone: '+917696275527',
    companyEmail: 'user@gmail.com',
    invoiceLabel: 'QUOTATION'
  });

  // Fetch default settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await settingsAPI.getAll();
        if (response.data.success) {
          setFormData(prev => ({
            ...prev,
            terms: response.data.data.terms || prev.terms,
            bankDetails: response.data.data.bankDetails || '',
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

  // Handle form field changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle item field changes
  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = 
      field === 'quantity' || field === 'rate' || field === 'mrp' 
        ? parseFloat(value) || 0 
        : value;

    // Reset dependent fields if formulation changes
    if (field === 'formulationType') {
      newItems[index].packing = '';
      newItems[index].packagingType = '';
    }

    setFormData({ ...formData, items: newItems });
  };

  // Add new item
  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { ...DEFAULT_ITEM }],
    });
  };

  // Copy item
  const copyItem = (index) => {
    const itemToCopy = { ...formData.items[index] };
    setFormData({
      ...formData,
      items: [...formData.items, itemToCopy],
    });
  };

  // Remove item
  const removeItem = (index) => {
    if (formData.items.length === 1) return;
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  return {
    formData,
    companySettings,
    handleChange,
    handleItemChange,
    addItem,
    copyItem,
    removeItem,
  };
};
