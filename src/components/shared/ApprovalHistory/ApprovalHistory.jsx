/**
 * ApprovalHistory Component
 * Displays approval timeline with visual indicators
 */

import { Check, X, Edit, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatDate, formatTime } from '@/utils/formatters';
import { getApprovalActionLabel, getApprovalActionColor } from '@/utils/statusHelpers';

/**
 * ApprovalStep - Single approval step in timeline
 * @param {object} props - Component props
 * @param {object} props.step - Step data
 * @param {boolean} props.isLast - Is last step in timeline
 * @returns {JSX.Element} Approval step
 */
const ApprovalStep = ({ step, isLast = false }) => {
  const { action, performedBy, role, timestamp, comments, details, status } = step;

  // Determine icon based on action/status
  const getIcon = () => {
    if (action?.includes('rejected') || status === 'rejected') {
      return <X size={16} className="text-white" />;
    }
    if (action?.includes('edited')) {
      return <Edit size={16} className="text-white" />;
    }
    if (status === 'pending') {
      return <Clock size={16} className="text-white" />;
    }
    return <Check size={16} className="text-white" />;
  };

  const iconColor = action 
    ? getApprovalActionColor(action)
    : status === 'pending'
    ? 'bg-yellow-500 animate-pulse'
    : 'bg-gray-500';

  const label = action ? getApprovalActionLabel(action) : step.label || 'Step';

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center z-10">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${iconColor}`}>
          {getIcon()}
        </div>
        {!isLast && <div className="w-0.5 h-full bg-border mt-2" />}
      </div>
      <div className="flex-1 pb-4">
        <p className="font-medium">
          {label}
          {status === 'pending' && (
            <span className="ml-2 text-xs text-yellow-500">(In Progress)</span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {performedBy?.name || role || 'System'}
        </p>
        {timestamp && (
          <p className="text-xs text-muted-foreground mt-1">
            {formatDate(timestamp)} at {formatTime(timestamp)}
          </p>
        )}
        {comments && (
          <p className="text-sm mt-1 bg-muted/50 p-2 rounded text-muted-foreground italic">
            "{comments}"
          </p>
        )}
        {details && (
          <p className="text-xs mt-1 text-muted-foreground">
            {details}
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * ApprovalHistory - Complete approval timeline
 * @param {object} props - Component props
 * @param {array} props.history - Array of history items
 * @param {object} props.quote - Quote object (for fallback timeline)
 * @param {string} props.type - Type of document ('quote' or 'po')
 * @param {boolean} props.showCard - Whether to wrap in Card component (default: true)
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} Approval history timeline
 */
export const ApprovalHistory = ({ 
  history = [], 
  quote = null, 
  type = 'quote',
  showCard = true,
  className = '' 
}) => {
  // If history array is provided, use it
  const renderTimeline = () => {
    if (history && history.length > 0) {
      return (
        <div className="space-y-3">
          {history.map((item, index) => (
            <ApprovalStep 
              key={index} 
              step={item} 
              isLast={index === history.length - 1}
            />
          ))}
        </div>
      );
    }

    // Otherwise, build timeline from quote object (fallback)
    if (!quote) {
      return (
        <div className="text-sm text-muted-foreground">
          No approval history available
        </div>
      );
    }

    return buildFallbackTimeline(quote);
  };

  const content = renderTimeline();

  if (!showCard) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Approval History</CardTitle>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
};

// Helper to build fallback timeline from quote object
const buildFallbackTimeline = (quote) => {
  // Otherwise, build timeline from quote object (fallback)
  if (!quote) {
    return (
      <div className="text-sm text-muted-foreground">
        No approval history available
      </div>
    );
  }

  const timeline = [];

  // Quote Created
  timeline.push({
    label: 'Quote Created',
    performedBy: { name: quote.createdByName || 'Sales Person' },
    timestamp: quote.createdAt,
    action: 'created',
  });

  // Manager Approval
  if (quote.managerApproval) {
    timeline.push({
      label: 'Manager Approval',
      role: quote.managerApproval.status === 'approved' ? 'Approved' : 'Pending',
      timestamp: quote.managerApproval.approvedAt,
      comments: quote.managerApproval.comments,
      status: quote.managerApproval.status,
      action: quote.managerApproval.status === 'approved' ? 'manager_approved' : undefined,
    });
  }

  // Client Order Confirmation
  if (quote.status === 'approved' || quote.status === 'pending_accountant' || quote.status === 'pending_designer' || quote.status === 'completed') {
    timeline.push({
      label: 'Client Order Confirmation',
      role: quote.clientOrderStatus === 'approved' ? 'Approved' : 'Pending',
      performedBy: quote.clientOrderApprovedBy,
      timestamp: quote.clientOrderApprovedAt,
      status: quote.clientOrderStatus,
      details: quote.advanceAmount ? `Advance Received: ₹${quote.advanceAmount.toFixed(2)}` : undefined,
    });
  }

  // Accountant Approval
  if (quote.status === 'pending_accountant' || quote.status === 'pending_designer' || quote.status === 'completed' || quote.accountantApproval) {
    timeline.push({
      label: 'Accountant Approval',
      role: quote.accountantApproval?.status === 'approved' ? 'Approved' : quote.status === 'pending_accountant' ? 'Pending' : 'Not Started',
      timestamp: quote.accountantApproval?.approvedAt,
      status: quote.status === 'pending_accountant' ? 'pending' : quote.accountantApproval?.status,
      details: quote.advancePaymentReceivedAt ? `Payment confirmed: ${formatDate(quote.advancePaymentReceivedAt)}` : undefined,
    });
  }

  // Designer Status
  if (quote.status === 'pending_designer' || quote.status === 'completed' || quote.designStatus !== 'pending') {
    timeline.push({
      label: 'Designer Status',
      role: quote.designStatus || 'Pending',
      status: quote.status === 'pending_designer' ? 'pending' : undefined,
      comments: quote.designNotes,
    });
  }

  // Client Design Approval
  if (quote.clientDesignApprovedAt) {
    timeline.push({
      label: 'Client Design Approved',
      role: 'Approved',
      timestamp: quote.clientDesignApprovedAt,
      action: 'client_design_approved',
    });
  }

  // Manufacturer Design Approval
  if (quote.manufacturerDesignApprovedAt) {
    timeline.push({
      label: 'Manufacturer Design Approved',
      role: 'Approved',
      timestamp: quote.manufacturerDesignApprovedAt,
      action: 'manufacturer_design_approved',
    });
  }

  // Completed Status
  if (quote.status === 'completed') {
    timeline.push({
      label: 'Order Completed',
      role: 'All approvals received',
      action: 'completed',
    });
  }

  return (
    <div className="space-y-3">
      {timeline.map((item, index) => (
        <ApprovalStep 
          key={index} 
          step={item} 
          isLast={index === timeline.length - 1}
        />
      ))}
    </div>
  );
};

export default ApprovalHistory;
