import { z } from 'zod';

// Order Status State Machine
export const OrderStatusSchema = z.enum([
  'awaiting_action',
  'shipping_in_progress',
  'shipped',
  'needs_verification'
]);

export type OrderStatus = z.infer<typeof OrderStatusSchema>;

// Timestamp type for Firestore
export type Timestamp = any; // Will be firebase.firestore.Timestamp at runtime

// Order Schema
export const OrderSchema = z.object({
  // Core identifiers
  id: z.string(),
  shopId: z.string(), // Reference to shops collection
  shopifyId: z.string(), // Shopify order ID
  orderNumber: z.string(),
  
  // Status tracking (TWO-PHASE FULFILLMENT)
  flowfixStatus: OrderStatusSchema,
  shippingStartedAt: z.any().optional(), // Timestamp
  fulfillmentConfirmedAt: z.any().optional(), // Timestamp
  lastSyncStatus: z.string(), // e.g., 'webhook_received', 'timeout', 'api_failed'
  
  // Customer data
  customerName: z.string(),
  customerEmail: z.string(),
  addressDisplay: z.string(), // FULL formatted address, no truncation
  customerNotes: z.array(z.string()), // Aggregated from all sources
  isDomestic: z.boolean(), // Auto-detected
  
  // Trust metrics
  lastInterventionAt: z.any().optional(), // Timestamp
  lastInterventionReason: z.string().optional(),
  
  // Metadata
  createdAt: z.any(), // Timestamp
  updatedAt: z.any(), // Timestamp
});

export type Order = z.infer<typeof OrderSchema>;

// Shop Schema
export const ShopSchema = z.object({
  id: z.string(),
  shopifyDomain: z.string(),
  accessToken: z.string(), // Encrypted at rest
  accessTokenExpires: z.any(), // Timestamp
  
  // Trust metrics (THE CORE)
  lastInterventionAt: z.any().optional(), // Timestamp
  lastInterventionReason: z.string().optional(),
  currentTrustStreakHours: z.number().default(0),
  totalInterventions: z.number().default(0),
  
  // Settings
  domesticCountries: z.array(z.string()).default(['US', 'CA']),
  
  // Metadata
  createdAt: z.any(), // Timestamp
  updatedAt: z.any(), // Timestamp
});

export type Shop = z.infer<typeof ShopSchema>;

// Intervention Schema (Every trust reset)
export const InterventionSchema = z.object({
  id: z.string(),
  shopId: z.string(),
  orderId: z.string(),
  orderNumber: z.string(), // For quick reference
  reason: z.string(), // e.g., "Timeout waiting for Shopify confirmation"
  timestamp: z.any(), // Timestamp
  previousStreak: z.number(),
  details: z.object({}).passthrough().optional(),
});

export type Intervention = z.infer<typeof InterventionSchema>;

// Constants
export const COLLECTIONS = {
  SHOPS: 'shops',
  ORDERS: 'orders',
  INTERVENTIONS: 'interventions',
  PROCESSES: 'processes',
} as const;
