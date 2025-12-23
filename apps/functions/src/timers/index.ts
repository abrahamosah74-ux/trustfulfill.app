import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// CRITICAL: 5-minute timeout checker
export const checkFulfillmentTimeouts = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const ordersRef = admin.firestore().collection('orders');
    const timeoutOrders = await ordersRef
      .where('flowfixStatus', '==', 'shipping_in_progress')
      .where('shippingStartedAt', '<', fiveMinutesAgo)
      .get();

    for (const doc of timeoutOrders.docs) {
      const order = doc.data();
      
      // Move to needs_verification
      await doc.ref.update({
        flowfixStatus: 'needs_verification',
        lastSyncStatus: 'timeout',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      // LOG INTERVENTION (TRUST RESET)
      await admin.firestore().collection('interventions').add({
        shopId: order.shopId,
        orderId: order.id,
        orderNumber: order.orderNumber,
        reason: 'Timeout: Shopify confirmation not received within 5 minutes',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        previousStreak: order.currentTrustStreakHours || 0,
        details: {
          shippingStartedAt: order.shippingStartedAt,
          timeoutAfter: '5 minutes',
        },
      });
      
      // Reset shop's trust streak
      const shopRef = admin.firestore().collection('shops').doc(order.shopId);
      await shopRef.update({
        lastInterventionAt: admin.firestore.FieldValue.serverTimestamp(),
        lastInterventionReason: 'Timeout: Shopify confirmation not received within 5 minutes',
        currentTrustStreakHours: 0,
        totalInterventions: admin.firestore.FieldValue.increment(1),
      });
      
      functions.logger.info(`Timeout triggered for order ${order.orderNumber}`);
    }
    
    return null;
  });

// Calculate trust streaks every hour
export const calculateTrustStreaks = functions.pubsub
  .schedule('every 60 minutes')
  .onRun(async () => {
    const shopsRef = admin.firestore().collection('shops');
    const shops = await shopsRef.get();
    
    for (const shopDoc of shops.docs) {
      const shop = shopDoc.data();
      
      if (!shop.lastInterventionAt) {
        // No interventions yet, streak = hours since installation
        const installedAt = shop.createdAt.toDate();
        const hours = (Date.now() - installedAt.getTime()) / (1000 * 60 * 60);
        
        await shopDoc.ref.update({
          currentTrustStreakHours: Math.floor(hours * 100) / 100,
        });
      } else {
        // Streak = hours since last intervention
        const lastIntervention = shop.lastInterventionAt.toDate();
        const hours = (Date.now() - lastIntervention.getTime()) / (1000 * 60 * 60);
        
        await shopDoc.ref.update({
          currentTrustStreakHours: Math.floor(hours * 100) / 100,
        });
      }
    }
    
    return null;
  });
