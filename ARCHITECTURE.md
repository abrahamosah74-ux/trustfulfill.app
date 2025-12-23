# TrustFulfill Architecture

## System Overview

TrustFulfill is a Shopify embedded app built with a modern, scalable architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Shopify Admin                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Webhooks
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js 14 Frontend                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Today View │ OrderCard │ TrustMetric │ Analytics       │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  API Routes: /api/orders, /api/metrics, /api/shopify     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
    ┌────────────┐      ┌─────────────┐    ┌──────────────┐
    │  Firebase  │      │   Shopify   │    │   NextAuth   │
    │ Firestore  │      │     API     │    │  (Auth)      │
    │            │      │             │    │              │
    │ Collections│      │  Orders     │    │  Users       │
    │ - shops    │      │  Inventory  │    │  Sessions    │
    │ - orders   │      │  Webhooks   │    │              │
    │ - metrics  │      │             │    │              │
    └────────────┘      └─────────────┘    └──────────────┘
         │
         │ Triggers
         ▼
    ┌──────────────────┐
    │ Cloud Functions  │
    │                  │
    │ - Webhooks       │
    │ - Timers         │
    │ - Monitoring     │
    └──────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: React Query (@tanstack/react-query)
- **Forms**: React Hook Form + Zod
- **UI**: Custom components + Shopify Polaris

### Backend
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth + NextAuth
- **Functions**: Firebase Cloud Functions
- **API**: Next.js API Routes

### Infrastructure
- **Hosting**: Vercel (frontend)
- **Backend**: Google Firebase
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry + Logtail

### Monorepo
- **Tool**: Turbo
- **Package Manager**: npm workspaces
- **Version Control**: Git

## Data Model

### Shops Collection
```typescript
{
  id: string,                    // Shop ID (primary key)
  shopifyDomain: string,         // e.g., "mystore.myshopify.com"
  accessToken: string,           // Encrypted Shopify OAuth token
  accessTokenExpires: Timestamp, // When token expires
  
  // Trust metrics
  currentTrustStreakHours: number,      // Hours since last intervention
  lastInterventionAt: Timestamp,        // When trust was last reset
  lastInterventionReason: string,       // Why it was reset
  totalInterventions: number,           // Lifetime count
  
  // Settings
  domesticCountries: string[],          // ['US', 'CA', 'PR']
  
  // Metadata
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Orders Collection
```typescript
{
  id: string,                      // Our order ID
  shopId: string,                  // Reference to shops
  shopifyId: string,               // Shopify order ID
  orderNumber: string,             // e.g., "#1001"
  
  // Status tracking (TWO-PHASE)
  flowfixStatus: enum,             // awaiting_action | shipping_in_progress | shipped | needs_verification
  shippingStartedAt: Timestamp,    // When user marked as shipping
  fulfillmentConfirmedAt: Timestamp, // When Shopify confirmed
  lastSyncStatus: string,          // webhook_received | timeout | api_failed
  
  // Customer data
  customerName: string,
  customerEmail: string,
  addressDisplay: string,          // Full formatted address
  customerNotes: string[],         // Aggregated notes
  isDomestic: boolean,            // Auto-detected from country code
  
  // Metadata
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Interventions Collection
```typescript
{
  id: string,                      // Intervention ID
  shopId: string,                  // Which shop
  orderId: string,                 // Which order
  orderNumber: string,             // For quick reference
  
  reason: string,                  // Why intervention happened
  timestamp: Timestamp,            // When it happened
  previousStreak: number,          // Trust hours before reset
  
  details: object                  // Additional context
}
```

## State Machine: Order Status Flow

```
┌─────────────────────┐
│   awaiting_action   │  (Initial state)
└──────────┬──────────┘
           │ User clicks "Mark as Shipping"
           ▼
┌─────────────────────┐
│ shipping_in_progress│  (Waiting for Shopify confirmation)
└──────────┬──────────┘
           │
      ┌────┴─────────────────────────┐
      │                              │
   5 min timeout                  Webhook arrives
      │                              │
      ▼                              ▼
┌──────────────────┐        ┌─────────────┐
│ needs_verification│        │   shipped   │
└───────────────────┘        └─────────────┘
      │
      │ Manual verification
      ▼
┌─────────────┐
│   shipped   │
└─────────────┘
```

## Two-Phase Fulfillment Flow

```
┌──────────────────────────────────────────────────┐
│ User sees order in "awaiting_action" status      │
└──────────────────────────────────────────────────┘
                    │
                    │ Click "Mark as Shipping"
                    ▼
┌──────────────────────────────────────────────────┐
│ PHASE 1: Local State Update                      │
│ - Update order to "shipping_in_progress"         │
│ - Start 5-minute timeout timer                   │
└──────────────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────┐
│ PHASE 2: Call Shopify API                        │
│ - POST /fulfillments                             │
└──────────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
    Success      Failure      Timeout
        │           │           │
        ▼           ▼           ▼
┌──────────────────────────────────────────────────┐
│ PHASE 3: Confirm via Webhook                     │
│ When Shopify sends fulfillment webhook:          │
│ - Update order to "shipped"                      │
│ - Log fulfillmentConfirmedAt timestamp           │
│ - Trust remains active                           │
└──────────────────────────────────────────────────┘
        │
    ┌───┴──────┬──────────┐
    │          │          │
  Success    Timeout    Failure
    │          │          │
    ▼          ▼          ▼
 shipped needs_verification (both)
          ├─ Log intervention
          ├─ Reset trust streak
          └─ Alert user
```

## Trust Streak Calculation

```
Trust Streak = Time since last intervention

Example timeline:
├─ 00:00 - Shop installed → Streak starts
├─ 06:30 - Timeout on order #1 → Intervention 1, Streak = 0
├─ 06:35 - Shop stabilizes → Streak begins again
├─ 14:35 - Timeout on order #2 → Intervention 2, Streak = 0
├─ 14:40 - Shop stabilizes → Streak begins again
├─ 22:40 - Still no interventions → Streak = 8 hours
└─ Next day → Streak = 32 hours

Goal: 24+ hour streak (demonstrates system reliability)
```

## API Route Structure

### Orders Endpoints
```
GET    /api/orders                    # Fetch today's orders
POST   /api/orders/shipping           # Mark as shipping (Phase 1)
POST   /api/orders/retry              # Retry failed fulfillment
POST   /api/orders/verify             # Manually verify
PUT    /api/orders/status             # Update status
```

### Metrics Endpoints
```
GET    /api/metrics/trust             # Get trust metric
GET    /api/metrics/interventions     # Get intervention history
POST   /api/metrics/interventions     # Log intervention
```

### Shopify Endpoints
```
GET    /api/shopify/sync              # Sync orders from Shopify
POST   /api/shopify/fulfill           # Create fulfillment
GET    /api/shopify/orders/:id        # Get order details
```

## Firebase Cloud Functions

### Scheduled Functions

```
checkFulfillmentTimeouts (every 1 minute)
├─ Find orders in "shipping_in_progress" > 5 minutes old
├─ Move to "needs_verification"
├─ Log intervention
└─ Reset shop trust streak

calculateTrustStreaks (every 60 minutes)
├─ For each shop
├─ Calculate hours since last intervention
└─ Update currentTrustStreakHours
```

### Webhook Functions

```
shopifyFulfillmentWebhook
├─ Verify webhook signature
├─ Parse fulfillment data
├─ Find order in Firestore
├─ Update status to "shipped"
└─ Log confirmation timestamp
```

### Monitoring Functions

```
alertOnInterventionPatterns
├─ On each intervention logged
├─ Count interventions in last 24h
├─ If >= 3 → Alert user
└─ Log pattern to Sentry

monitorSyncFailures
├─ Every 5 minutes
├─ Count failures in last 30min
├─ If > 5 → System-wide alert
└─ Trigger incident response
```

## Security Model

### Authentication
- NextAuth with Shopify OAuth
- Session tokens stored in encrypted cookies
- Auto-refresh on expiration

### Authorization (Firestore Rules)
```
shops/{shopId}
├─ read/write: auth.uid == shopId

orders/{orderId}
├─ read: auth.uid == document.shopId
└─ write: auth.uid == document.shopId

interventions/{id}
├─ read: auth.uid == document.shopId
└─ create: auth.uid != null
```

### Data Protection
- API keys encrypted at rest
- Sensitive data never logged
- All traffic HTTPS
- Shopify scopes minimal (read_orders, write_fulfillments)

## Performance Considerations

### Database Indexing
```
orders collection:
├─ shopId + flowfixStatus
├─ shopId + shippingStartedAt
└─ flowfixStatus + updatedAt (global)

interventions collection:
├─ shopId + timestamp
└─ shopId (range queries)
```

### Caching Strategy
```
Orders: Cache 30 seconds
├─ Re-fetch on user action
├─ Auto-refresh every 30 seconds
└─ Stale-while-revalidate pattern

Trust Metric: Cache 60 seconds
├─ Calculated server-side
└─ Auto-refresh every minute

Interventions: Cache for lifetime
└─ Immutable log entries
```

### Query Optimization
- Always filter by shopId first
- Pagination for large result sets
- Limit to necessary fields only

## Error Handling

### Graceful Degradation
1. API fails → Show cached data + retry button
2. Webhook fails → 5-min timeout catches it
3. Timeout expires → User can manually verify
4. Multiple failures → Alert system

### Retry Logic
```
Exponential backoff: 100ms, 200ms, 400ms, 800ms
Max retries: 3
Timeout: 10 seconds
Fallback: needs_verification state
```

## Monitoring & Observability

### Logs
- Function execution logs
- API request/response logs
- Error traces with context

### Metrics
- Trust streak distribution
- Intervention frequency
- API response times
- Webhook delivery rate

### Alerts
- High intervention rate (3+/24h)
- System sync failures (5+/30min)
- API error rate > 1%
- Webhook delivery failures

## Scalability

### Current Limits
- Firestore: 1 write/sec per document
- Cloud Functions: 1000 concurrent
- API: 100 requests/sec (Vercel)

### When to Scale
- Multi-region replication
- Read replicas for analytics
- Caching layer (Redis)
- Function concurrency increase

## Deployment Architecture

### Development
- Firebase Emulator (local)
- Next.js dev server
- Docker for consistency

### Staging
- Firebase staging project
- Vercel preview deployments
- Test with real Shopify API

### Production
- Firebase production project
- Vercel production deployment
- SSL/TLS encryption
- DDoS protection (Vercel)

---

## Key Design Decisions

### Why Firebase?
- Real-time capabilities
- Automatic scaling
- Integrated authentication
- Serverless functions

### Why Next.js?
- SSR for SEO
- API routes (no separate backend)
- App Router (modern React)
- Vercel integration

### Why Turbo Monorepo?
- Shared types across packages
- Code reuse (db, shopify, firebase)
- Easy refactoring
- Single deployment

### Why Two-Phase Fulfillment?
- Explicit confirmation from Shopify
- Zero silent failures
- User retains control
- Clear responsibility boundaries

---

For implementation details, see the respective package README files.
