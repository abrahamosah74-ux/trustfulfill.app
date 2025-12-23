'use client';

import { Order } from '@trustfulfill/db';
import { OrderCard } from './OrderCard';
import { TrustMetric } from '../metrics/TrustMetric';
import { formatLastSync } from '@/lib/utils/formatting';

interface TodayViewProps {
  orders: Order[];
}

export function TodayView({ orders }: TodayViewProps) {
  // CRITICAL: Auto-categorize orders
  const domesticOrders = orders.filter(order => 
    order.isDomestic && order.flowfixStatus !== 'needs_verification'
  );
  
  const internationalOrders = orders.filter(order => 
    !order.isDomestic
  );
  
  const needsVerificationOrders = orders.filter(order => 
    order.flowfixStatus === 'needs_verification'
  );

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-8">
      {/* Trust Metric - Top of screen */}
      <TrustMetric />
      
      {/* Domestic Orders */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">
            Domestic Orders ({domesticOrders.length})
          </h2>
          {domesticOrders.length > 0 && (
            <span className="text-sm text-gray-600">
              All verified orders
            </span>
          )}
        </div>
        {domesticOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg">
            No domestic orders yet today.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {domesticOrders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </section>

      {/* International Orders - CLEARLY SEPARATED */}
      {internationalOrders.length > 0 && (
        <section className="border-t pt-8">
          <h2 className="text-2xl font-semibold mb-4">
            International Orders ({internationalOrders.length})
            <span className="ml-2 text-sm font-normal text-gray-600">
              • External fulfillment required
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {internationalOrders.map(order => (
              <OrderCard key={order.id} order={order} readOnly />
            ))}
          </div>
        </section>
      )}

      {/* Needs Verification - VISIBLY DIFFERENT */}
      {needsVerificationOrders.length > 0 && (
        <section className="border-t border-amber-200 pt-8">
          <h2 className="text-2xl font-semibold mb-4 text-amber-800">
            ⚠️ Needs Verification ({needsVerificationOrders.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {needsVerificationOrders.map(order => (
              <OrderCard key={order.id} order={order} urgent />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
