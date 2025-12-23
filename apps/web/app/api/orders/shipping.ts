import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId } = body;

    // TODO: Call Shopify API to create fulfillment
    // For now, return success mock

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking order as shipping:', error);
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
  }
}
