import { Order } from '@trustfulfill/db';

export async function fetchOrders(): Promise<Order[]> {
  const response = await fetch('/api/orders', {
    cache: 'no-store',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch orders');
  }
  
  return response.json();
}

export async function markAsShipping(orderId: string) {
  const response = await fetch('/api/orders/shipping', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId }),
  });
  
  const result = await response.json();
  return result;
}

export async function retryFulfillment(orderId: string) {
  const response = await fetch('/api/orders/retry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId }),
  });
  
  const result = await response.json();
  return result;
}

export async function markAsVerifiedManually(orderId: string) {
  const response = await fetch('/api/orders/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId }),
  });
  
  const result = await response.json();
  return result;
}

async function updateOrderStatus(
  orderId: string, 
  status: string, 
  syncStatus?: string
) {
  await fetch('/api/orders/status', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId,
      status,
      syncStatus,
      timestamp: new Date().toISOString(),
    }),
  });
}

// CRITICAL: Intervention logging
async function logIntervention(orderId: string, reason: string) {
  await fetch('/api/metrics/interventions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId,
      reason,
      timestamp: new Date().toISOString(),
    }),
  });
}
