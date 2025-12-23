import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// Alert on consecutive interventions
export const alertOnInterventionPatterns = functions.firestore
  .document('interventions/{interventionId}')
  .onCreate(async (snap, context) => {
    const intervention = snap.data();
    const shopId = intervention.shopId;
    
    // Get last 3 interventions within 24 hours
    const interventionsRef = admin.firestore().collection('interventions');
    const recentInterventions = await interventionsRef
      .where('shopId', '==', shopId)
      .where('timestamp', '>', new Date(Date.now() - 24 * 60 * 60 * 1000))
      .orderBy('timestamp', 'desc')
      .limit(3)
      .get();
    
    if (recentInterventions.size >= 3) {
      // Pattern detected: 3+ interventions in 24h
      functions.logger.warn('High intervention rate detected', {
        shopId,
        interventionCount: recentInterventions.size,
      });
    }
  });

// Monitor sync failures
export const monitorSyncFailures = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async () => {
    const ordersRef = admin.firestore().collection('orders');
    const recentFailures = await ordersRef
      .where('lastSyncStatus', 'in', ['timeout', 'api_failed', 'network_error'])
      .where('updatedAt', '>', new Date(Date.now() - 30 * 60 * 1000))
      .get();
    
    if (recentFailures.size > 5) {
      // System-wide issue
      functions.logger.error('System sync failure rate high', {
        failureCount: recentFailures.size,
      });
    }
  });
