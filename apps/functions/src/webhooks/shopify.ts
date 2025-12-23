import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { verifyShopifyWebhook } from '@trustfulfill/shopify';

admin.initializeApp();

// CRITICAL: Shopify fulfillment webhook
export const shopifyFulfillmentWebhook = functions.https.onRequest(
  async (req, res) => {
    try {
      // Verify webhook signature
      const isValid = verifyShopifyWebhook(
        req.headers['x-shopify-hmac-sha256'] as string,
        req.rawBody
      );
      
      if (!isValid) {
        res.status(401).send('Invalid webhook signature');
        return;
      }

      const { order_id, fulfillment_status } = req.body;
      
      // Find order by Shopify ID
      const ordersRef = admin.firestore().collection('orders');
      const orderQuery = await ordersRef
        .where('shopifyId', '==', order_id.toString())
        .where('flowfixStatus', '==', 'shipping_in_progress')
        .limit(1)
        .get();

      if (!orderQuery.empty) {
        const orderDoc = orderQuery.docs[0];
        const orderData = orderDoc.data();
        
        // Only confirm if Shopify says fulfilled
        if (fulfillment_status === 'fulfilled') {
          await orderDoc.ref.update({
            flowfixStatus: 'shipped',
            fulfillmentConfirmedAt: admin.firestore.FieldValue.serverTimestamp(),
            lastSyncStatus: 'webhook_confirmed',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          
          functions.logger.info(`Confirmed fulfillment for order ${order_id}`);
        }
      }

      res.status(200).send('OK');
    } catch (error) {
      functions.logger.error('Webhook processing error:', error);
      res.status(500).send('Internal server error');
    }
  }
);
