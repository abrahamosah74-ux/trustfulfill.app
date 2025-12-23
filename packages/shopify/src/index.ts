import { createRestClient } from '@shopify/shopify-api';
import { Order } from '@trustfulfill/db';

export class ShopifyClient {
  private client: ReturnType<typeof createRestClient>;
  private domesticCodes = ['US', 'CA', 'PR'];

  constructor(accessToken: string, shopDomain: string) {
    this.client = createRestClient({
      accessToken,
      shopDomain,
      apiVersion: '2024-01',
    });
  }

  // TWO-PHASE FULFILLMENT: Mark order as fulfilled
  async createFulfillment(orderId: string, trackingInfo?: any) {
    try {
      const response = await this.client.post(`/orders/${orderId}/fulfillments.json`, {
        fulfillment: {
          notify_customer: true,
          tracking_info: trackingInfo,
          line_items: await this.getFulfillableLineItems(orderId),
        },
      });

      return {
        success: true,
        data: response.data,
        fulfillmentId: response.data.fulfillment.id,
      };
    } catch (error: any) {
      // CRITICAL: Distinguish between rate limits and other errors
      if (error.response?.status === 429) {
        return {
          success: false,
          error: 'RATE_LIMIT',
          retryAfter: error.response.headers['retry-after'],
        };
      }
      
      return {
        success: false,
        error: 'API_ERROR',
        details: error.message,
      };
    }
  }

  // Get orders for today
  async getTodayOrders() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const response = await this.client.get('/orders.json', {
      params: {
        created_at_min: today.toISOString(),
        status: 'any',
        limit: 250,
        fields: 'id,name,email,shipping_address,note,line_items,financial_status,fulfillment_status',
      },
    });

    return this.transformOrders(response.data.orders);
  }

  // Transform Shopify order to our schema
  private transformOrders(shopifyOrders: any[]) {
    return shopifyOrders.map(order => ({
      shopifyId: order.id.toString(),
      orderNumber: order.name,
      customerName: `${order.shipping_address?.first_name || ''} ${order.shipping_address?.last_name || ''}`.trim(),
      customerEmail: order.email,
      addressDisplay: this.formatAddress(order.shipping_address),
      customerNotes: this.extractAllNotes(order),
      isDomestic: this.isDomestic(order.shipping_address?.country_code),
      financialStatus: order.financial_status,
      fulfillmentStatus: order.fulfillment_status,
    }));
  }

  // Extract notes from ALL sources
  private extractAllNotes(order: any): string[] {
    const notes: string[] = [];
    
    // Order note
    if (order.note) notes.push(order.note);
    
    // Shipping address note
    if (order.shipping_address?.note) {
      notes.push(`Shipping note: ${order.shipping_address.note}`);
    }
    
    // Line item properties
    order.line_items?.forEach((item: any) => {
      if (item.properties) {
        item.properties.forEach((prop: any) => {
          notes.push(`${item.title}: ${prop.name} = ${prop.value}`);
        });
      }
      
      // Line item note
      if (item.note) {
        notes.push(`${item.title}: ${item.note}`);
      }
    });
    
    return notes;
  }

  // Format address with NO TRUNCATION
  private formatAddress(address: any): string {
    if (!address) return 'No address provided';
    
    const lines = [];
    if (address.company) lines.push(address.company);
    if (address.address1) lines.push(address.address1);
    if (address.address2) lines.push(address.address2);
    lines.push(`${address.city}, ${address.province_code} ${address.zip}`);
    if (address.country) lines.push(address.country);
    
    return lines.join('\n');
  }

  // Domestic detection
  private isDomestic(countryCode?: string): boolean {
    return countryCode ? this.domesticCodes.includes(countryCode.toUpperCase()) : true;
  }

  private async getFulfillableLineItems(orderId: string) {
    // Placeholder - would fetch actual line items
    return [];
  }
}

// Webhook verification
export function verifyShopifyWebhook(
  hmacHeader: string,
  rawBody: string
): boolean {
  // Implement HMAC verification
  // This is a placeholder
  return true;
}
