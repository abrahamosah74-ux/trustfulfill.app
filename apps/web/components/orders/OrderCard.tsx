'use client';

import { useState } from 'react';
import { Order } from '@trustfulfill/db';
import { markAsShipping, retryFulfillment, markAsVerifiedManually } from '@/lib/api/orders';
import { formatTime } from '@/lib/utils/formatting';

interface OrderCardProps {
  order: Order;
  readOnly?: boolean;
  urgent?: boolean;
}

export function OrderCard({ order, readOnly = false, urgent = false }: OrderCardProps) {
  const [currentStatus, setCurrentStatus] = useState(order.flowfixStatus);
  const [isLoading, setIsLoading] = useState(false);
  
  // Status configuration
  const statusConfig = {
    awaiting_action: {
      color: 'gray',
      label: 'Awaiting Action',
      icon: '⭕',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-800',
    },
    shipping_in_progress: {
      color: 'yellow',
      label: 'Pending Shopify Confirmation',
      icon: '⏳',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
    },
    shipped: {
      color: 'green',
      label: order.fulfillmentConfirmedAt 
        ? `Shipped & Verified ${formatTime(order.fulfillmentConfirmedAt)}`
        : 'Shipped & Verified',
      icon: '✅',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
    },
    needs_verification: {
      color: 'orange',
      label: 'Needs Verification',
      icon: '⚠️',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-800',
    },
  };

  const status = statusConfig[currentStatus];

  const handleMarkAsShipping = async () => {
    setIsLoading(true);
    setCurrentStatus('shipping_in_progress');
    
    const result = await markAsShipping(order.id);
    
    if (!result.success) {
      // Immediate failure → needs_verification
      setCurrentStatus('needs_verification');
    }
    setIsLoading(false);
  };

  const handleRetry = async () => {
    setIsLoading(true);
    setCurrentStatus('shipping_in_progress');
    
    const result = await retryFulfillment(order.id);
    
    if (!result.success) {
      setCurrentStatus('needs_verification');
    }
    setIsLoading(false);
  };

  const handleMarkAsVerified = async () => {
    setIsLoading(true);
    const result = await markAsVerifiedManually(order.id);
    if (result.success) {
      setCurrentStatus('shipped');
    }
    setIsLoading(false);
  };

  return (
    <div className={`
      border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow
      ${urgent ? 'border-amber-300 bg-amber-50' : 'border-gray-200'}
      ${readOnly ? 'opacity-75' : ''}
    `}>
      {/* Header with status */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-lg">#{order.orderNumber}</h3>
          <p className="text-gray-600">{order.customerName}</p>
        </div>
        <div className={`px-3 py-1 rounded-full ${status.bgColor} ${status.textColor} whitespace-nowrap text-sm`}>
          <span className="font-medium">
            {status.icon} {status.label}
          </span>
        </div>
      </div>

      {/* Address - NO TRUNCATION */}
      <div className="mb-4">
        <p className="text-sm font-medium mb-1 text-gray-700">Shipping Address</p>
        <pre className="text-xs bg-gray-50 p-3 rounded whitespace-pre-wrap font-mono break-words overflow-hidden">
          {order.addressDisplay}
        </pre>
      </div>

      {/* Customer Notes - FIRST-CLASS CITIZEN */}
      {order.customerNotes.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium mb-1 text-gray-700">
            📝 Customer Notes ({order.customerNotes.length})
          </p>
          <ul className="space-y-2">
            {order.customerNotes.map((note, index) => (
              <li key={index} className="text-xs bg-blue-50 p-2 rounded border border-blue-100">
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      {!readOnly && currentStatus === 'awaiting_action' && (
        <button
          onClick={handleMarkAsShipping}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2.5 rounded-lg font-medium transition-colors"
        >
          {isLoading ? 'Processing...' : 'Mark as Shipping'}
        </button>
      )}

      {currentStatus === 'needs_verification' && (
        <div className="space-y-3">
          <p className="text-sm text-amber-700 font-medium">
            {order.lastSyncStatus === 'timeout'
              ? '⏰ Timeout: Shopify confirmation not received within 5 minutes'
              : '🔧 Issue: Shopify API call failed'}
          </p>
          <div className="flex space-x-2">
            <button
              onClick={handleRetry}
              disabled={isLoading}
              className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 py-2 rounded-lg font-medium text-sm"
            >
              {isLoading ? 'Processing...' : 'Retry'}
            </button>
            <button
              onClick={handleMarkAsVerified}
              disabled={isLoading}
              className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-500 text-white py-2 rounded-lg font-medium text-sm"
            >
              {isLoading ? 'Saving...' : 'Mark as Verified'}
            </button>
          </div>
        </div>
      )}

      {currentStatus === 'shipping_in_progress' && (
        <div className="text-center py-2">
          <div className="inline-flex items-center text-yellow-700">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-700 mr-2"></div>
            Waiting for Shopify confirmation...
          </div>
        </div>
      )}
    </div>
  );
}
