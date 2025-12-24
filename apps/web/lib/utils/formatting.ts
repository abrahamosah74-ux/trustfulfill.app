import { format, formatDistanceToNow } from 'date-fns';

export function formatTime(date: any): string {
  try {
    const d = date instanceof Date ? date : new Date(date);
    return format(d, 'h:mm a');
  } catch {
    return '';
  }
}

export function formatLastSync(orders: any[]): string {
  if (!orders || orders.length === 0) {
    return 'Never';
  }
  
  const lastUpdated = orders.reduce((latest, order) => {
    const orderTime = order.updatedAt instanceof Date 
      ? order.updatedAt 
      : new Date(order.updatedAt);
    const latestTime = latest instanceof Date 
      ? latest 
      : new Date(latest);
    
    return orderTime > latestTime ? orderTime : latestTime;
  }, new Date(0));
  
  return formatDistanceToNow(lastUpdated, { addSuffix: true });
}

export function formatAddress(address: string): string {
  return address || 'No address provided';
}
