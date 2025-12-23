import { NextRequest, NextResponse } from 'next/server';

// GET /api/orders - Fetch today's orders
export async function GET(req: NextRequest) {
  try {
    // TODO: Implement actual Shopify API call
    // For now, return mock data
    const mockOrders = [
      {
        id: '1',
        shopId: 'shop-1',
        shopifyId: '123456789',
        orderNumber: '#1001',
        flowfixStatus: 'awaiting_action',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        addressDisplay: '123 Main St\nNew York, NY 10001\nUSA',
        customerNotes: ['Gift wrapping requested'],
        isDomestic: true,
        lastSyncStatus: 'success',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    return NextResponse.json(mockOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
