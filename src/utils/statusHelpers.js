/**
 * Status helper utilities for consistent status display
 */

/**
 * Quote status configuration
 */
export const QUOTE_STATUS_CONFIG = {
  draft: {
    label: 'Draft',
    variant: 'secondary',
    className: '',
    color: 'bg-gray-500'
  },
  quote_submitted: {
    label: 'Quote Submitted',
    variant: 'outline',
    className: '',
    color: 'bg-blue-500'
  },
  pending_manager_approval: {
    label: 'Pending Manager Approval',
    variant: 'outline',
    className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500',
    color: 'bg-yellow-500'
  },
  manager_approved: {
    label: 'Manager Approved',
    variant: 'default',
    className: 'bg-blue-500 text-white border-blue-500',
    color: 'bg-blue-500'
  },
  manager_rejected: {
    label: 'Manager Rejected',
    variant: 'destructive',
    className: 'bg-red-500 text-white border-red-500',
    color: 'bg-red-500'
  },
  pending_accountant: {
    label: 'Pending Accountant',
    variant: 'outline',
    className: 'bg-orange-500/10 text-orange-500 border-orange-500',
    color: 'bg-orange-500'
  },
  pending_designer: {
    label: 'Pending Designer',
    variant: 'outline',
    className: 'bg-purple-500/10 text-purple-500 border-purple-500',
    color: 'bg-purple-500'
  },
  completed_quote: {
    label: 'Quote Completed',
    variant: 'default',
    className: 'bg-green-500 text-white border-green-500',
    color: 'bg-green-500'
  },
  quote_rejected: {
    label: 'Quote Rejected',
    variant: 'destructive',
    className: 'bg-red-500 text-white border-red-500',
    color: 'bg-red-500'
  },
};

/**
 * Purchase Order status configuration
 */
export const PO_STATUS_CONFIG = {
  draft: {
    label: 'Draft',
    variant: 'secondary',
    className: '',
    color: 'bg-gray-500'
  },
  pending: {
    label: 'Pending',
    variant: 'outline',
    className: '',
    color: 'bg-gray-500'
  },
  ready_for_po: {
    label: 'Ready for PO',
    variant: 'default',
    className: 'bg-green-500 text-white border-green-500',
    color: 'bg-green-500'
  },
  po_created: {
    label: 'PO Created',
    variant: 'default',
    className: 'bg-orange-500 text-white border-orange-500',
    color: 'bg-orange-500'
  },
  sent: {
    label: 'Sent to Client',
    variant: 'outline',
    className: '',
    color: 'bg-green-500'
  },
  acknowledged: {
    label: 'Acknowledged',
    variant: 'outline',
    className: '',
    color: 'bg-blue-500'
  },
  in_production: {
    label: 'In Production',
    variant: 'default',
    className: '',
    color: 'bg-amber-500'
  },
  shipped: {
    label: 'Shipped',
    variant: 'default',
    className: '',
    color: 'bg-purple-500'
  },
  delivered: {
    label: 'Delivered',
    variant: 'default',
    className: '',
    color: 'bg-green-500'
  },
  completed: {
    label: 'Completed',
    variant: 'default',
    className: '',
    color: 'bg-green-500'
  },
  po_completed: {
    label: 'PO Completed',
    variant: 'default',
    className: 'bg-green-600 text-white border-green-600',
    color: 'bg-green-600'
  },
};

/**
 * Order type badge configuration
 */
export const ORDER_TYPE_CONFIG = {
  New: {
    label: 'New',
    className: 'bg-green-500/10 text-green-500 border-green-500'
  },
  Repeat: {
    label: 'Repeat',
    className: 'bg-red-500/10 text-red-500 border-red-500'
  }
};

/**
 * Get quote status configuration
 * @param {string} status - Status key
 * @returns {object} Status configuration
 */
export const getQuoteStatusConfig = (status) => {
  return QUOTE_STATUS_CONFIG[status] || {
    label: status,
    variant: 'secondary',
    className: '',
    color: 'bg-gray-500'
  };
};

/**
 * Get PO status configuration
 * @param {string} status - Status key
 * @returns {object} Status configuration
 */
export const getPOStatusConfig = (status) => {
  return PO_STATUS_CONFIG[status] || {
    label: status,
    variant: 'secondary',
    className: '',
    color: 'bg-gray-500'
  };
};

/**
 * Get order type configuration
 * @param {string} orderType - Order type
 * @returns {object} Order type configuration
 */
export const getOrderTypeConfig = (orderType) => {
  return ORDER_TYPE_CONFIG[orderType] || {
    label: orderType || 'New',
    className: 'bg-green-500/10 text-green-500 border-green-500'
  };
};

/**
 * Get approval history action label
 * @param {string} action - Action key
 * @returns {string} Human-readable label
 */
export const getApprovalActionLabel = (action) => {
  const actionLabels = {
    created: 'Quote Created',
    edited: 'Quote Edited',
    submitted: 'Quote Submitted',
    resubmitted: 'Quote Resubmitted',
    edited_and_resubmitted: 'Quote Edited & Resubmitted',
    se_approved: 'Sales Executive Approved',
    se_rejected: 'Sales Executive Rejected',
    manager_approved: 'Manager Approved',
    manager_rejected: 'Manager Rejected',
    md_approved: 'MD Approved',
    md_rejected: 'MD Rejected',
    client_order_approved: 'Client Order Confirmed',
    payment_verified: 'Payment Verified',
    design_quote_approved: 'Design Approved',
    client_design_approved: 'Client Approved Design',
    manufacturer_design_approved: 'Manufacturer Approved Design',
  };
  
  return actionLabels[action] || action.replace(/_/g, ' ');
};

/**
 * Get approval history action color
 * @param {string} action - Action key
 * @returns {string} Tailwind color class
 */
export const getApprovalActionColor = (action) => {
  if (action.includes('rejected')) return 'bg-red-500';
  if (action.includes('edited')) return 'bg-orange-500';
  if (action === 'created') return 'bg-blue-500';
  return 'bg-green-500';
};

/**
 * Filter statuses for status filter chips
 */
export const QUOTE_STATUS_FILTERS = [
  { value: 'all', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'quote_submitted', label: 'Quote Submitted' },
  { value: 'pending_manager_approval', label: 'Pending Manager Approval' },
  { value: 'manager_approved', label: 'Manager Approved' },
  { value: 'manager_rejected', label: 'Manager Rejected' },
  { value: 'pending_accountant', label: 'Pending Accountant' },
  { value: 'pending_designer', label: 'Pending Designer' },
  { value: 'completed_quote', label: 'Quote Completed' },
];

/**
 * Get count of pending approvals from stats
 * @param {object} stats - Stats object with byStatus array
 * @returns {number} Total pending count
 */
export const getPendingApprovalsCount = (stats) => {
  const getStatusCount = (status) => {
    return stats?.byStatus?.find((s) => s._id === status)?.count || 0;
  };
  
  return (
    getStatusCount('pending_manager_approval') +
    getStatusCount('pending_se_approval') +
    getStatusCount('pending_md_approval')
  );
};

/**
 * Get count of approved quotes from stats
 * @param {object} stats - Stats object with byStatus array
 * @returns {number} Total approved count
 */
export const getApprovedCount = (stats) => {
  const getStatusCount = (status) => {
    return stats?.byStatus?.find((s) => s._id === status)?.count || 0;
  };
  
  return (
    getStatusCount('manager_approved') +
    getStatusCount('design_approved') +
    getStatusCount('pending_accountant') +
    getStatusCount('pending_designer') +
    getStatusCount('design_pending') +
    getStatusCount('ready_for_po') +
    getStatusCount('po_created') +
    getStatusCount('completed_quote')
  );
};
