import { useState } from 'react';

/**
 * Custom hook for quote form validation
 * Handles email, phone, and form validation logic
 */
export const useQuoteValidation = () => {
  const [errors, setErrors] = useState({});

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone) => {
    if (!phone) return true; // optional field
    const re = /^[+]?[\d\s-]{10,15}$/;
    return re.test(phone);
  };

  const validateForm = (formData) => {
    const newErrors = {};

    // Party name validation
    if (!formData.partyName?.trim()) {
      newErrors.partyName = 'Party name is required';
    }

    // Marketed by validation
    if (!formData.marketedBy?.trim()) {
      newErrors.marketedBy = 'Marketed by is required';
    }

    // Email validation
    if (!formData.clientEmail?.trim()) {
      newErrors.clientEmail = 'Email is required';
    } else if (!validateEmail(formData.clientEmail)) {
      newErrors.clientEmail = 'Please enter a valid email address';
    }

    // Phone validation
    if (formData.clientPhone && !validatePhone(formData.clientPhone)) {
      newErrors.clientPhone = 'Please enter a valid phone number';
    }

    // Items validation
    const itemValidation = formData.items?.some((item) => {
      const isPharma = !['Injection', 'I.V/Fluid'].includes(item.formulationType);
      return (
        !item.brandName ||
        !item.composition ||
        !item.quantity ||
        !item.rate ||
        !item.mrp ||
        !item.packagingType ||
        (isPharma && !item.packing)
      );
    });

    if (itemValidation) {
      newErrors.items = 'Please fill in all mandatory item fields (Brand, Composition, Packing, etc.)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearErrors = () => setErrors({});

  return {
    errors,
    validateForm,
    validateEmail,
    validatePhone,
    clearErrors,
  };
};
