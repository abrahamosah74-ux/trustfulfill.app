# TrustFulfill - Order Fulfillment Transparency

A Shopify embedded app that becomes the single source of truth for e-commerce order fulfillment, eliminating owner anxiety through transparent trust mechanics.

## 🎯 Core Innovation

We don't sell features. We sell trust transfer. When the app says "12 orders shipped," it means Shopify confirmed all 12. No lies, no silent failures.

## 📁 Project Structure

```
trustfulfill/
├── apps/
│   ├── web/                     # Next.js 14 (App Router)
│   │   ├── app/
│   │   │   ├── (main)/
│   │   │   │   ├── today/      # Today View (Main interface)
│   │   │   │   ├── processes/  # Process templates
│   │   │   │   └── analytics/  # Simple metrics
│   │   │   ├── api/            # Internal API routes
│   │   │   └── auth/           # Authentication
│   │   └── components/
│   │       ├── orders/         # Order components
│   │       ├── metrics/        # Metric components
│   │       └── providers/      # React providers
│   └── functions/              # Firebase Cloud Functions
│       ├── src/
│       │   ├── webhooks/       # Shopify webhook handlers
│       │   ├── timers/         # Scheduled functions
│       │   └── monitoring/     # Alert functions
│       └── package.json
├── packages/
│   ├── db/                     # Database schema & types
│   ├── shopify/                # Shopify API client
│   ├── firebase/               # Firebase config
│   └── shared/                 # Shared types & constants
├── docker-compose.yml          # Local development
├── firebase.json               # Firebase config
├── firestore.rules             # Firestore security rules
└── turbo.json                  # Turbo config
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Firebase account
- Shopify Partner account
- Docker (optional, for local Firebase emulator)

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the environment template and add your credentials:

```bash
cp apps/web/.env.example apps/web/.env.local
```

Fill in your Shopify and Firebase credentials.

### 3. Local Development

**Without Docker (Using Firebase Emulator via npm):**

```bash
# Terminal 1: Start Firebase emulator
cd apps/functions
npm run start

# Terminal 2: Start Next.js dev server
cd apps/web
npm run dev
```

**With Docker:**

```bash
docker-compose up
```

The app will be available at `http://localhost:3000`

### 4. Deploy

```bash
npm run build
```

## 🔐 CRITICAL NON-NEGOTIABLES

### 1. Never Lie About Status

```typescript
// WRONG:
if (shopifyApiCall) {
  markAsShipped(); // What if API fails?
}

// RIGHT:
if (shopifyApiCall.success) {
  markAsShipped();
} else {
  markAsNeedsVerification('Shopify API failed');
}
```

### 2. Two-Phase Fulfillment

1. **Phase 1**: User marks order as shipping → status = `shipping_in_progress`
2. **Phase 2**: Shopify webhook confirms → status = `shipped`

If webhook doesn't arrive within 5 minutes → auto-escalate to `needs_verification`

### 3. Trust Metric Calculation

```typescript
// Trust Streak = Time since last intervention
// Intervention = When system needed manual override
// This is what users optimize for
```

## 📊 Core Components

### TodayView
The main interface showing all orders categorized by status:
- **Domestic Orders**: Ready for action
- **International Orders**: Marked as "External fulfillment required"
- **Needs Verification**: Issues that need attention

### OrderCard
Individual order display with:
- Real-time status indicator
- Full address (NO truncation)
- Customer notes from all sources
- Action buttons based on status

### TrustMetric
Displays:
- Hours since last intervention
- Last intervention reason
- Progress toward 24-hour goal
- Visual streak indicator

## 🔄 API Routes

### Orders
- `GET /api/orders` - Fetch today's orders
- `POST /api/orders/shipping` - Mark order as shipping
- `POST /api/orders/retry` - Retry failed fulfillment
- `POST /api/orders/verify` - Manually verify order
- `PUT /api/orders/status` - Update order status

### Metrics
- `GET /api/metrics/trust` - Fetch trust metric
- `GET /api/metrics/interventions` - Fetch intervention history
- `POST /api/metrics/interventions` - Log new intervention

## 🛠️ Firebase Cloud Functions

### Webhooks
- `shopifyFulfillmentWebhook` - Handle Shopify fulfillment webhooks

### Timers
- `checkFulfillmentTimeouts` - Runs every minute, escalates orders stuck in `shipping_in_progress` for > 5 minutes
- `calculateTrustStreaks` - Runs hourly, updates shop trust streak metrics

### Monitoring
- `alertOnInterventionPatterns` - Triggers alerts on 3+ interventions in 24h
- `monitorSyncFailures` - Monitors system sync failure rates

## 📝 Environment Variables

See `.env.example` for all required variables.

### Essential Variables:
- `NEXT_PUBLIC_SHOPIFY_API_KEY` - Shopify app API key
- `SHOPIFY_API_SECRET` - Shopify app secret
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - Firebase project ID
- `NEXTAUTH_SECRET` - NextAuth session secret

## 🧪 Testing

```bash
# Run tests
npm run test

# Type check
npm run type-check

# Lint code
npm run lint
```

## 📚 Development Phases

### Phase 1: Today View + Shopify Sync (Week 1-2) ✅
- [x] Project initialization
- [x] Firebase setup
- [x] Database schema
- [x] Today View component
- [x] OrderCard component
- [x] Shopify integration
- [ ] End-to-end testing with real Shopify store

### Phase 2: Security & Authentication (Week 3)
- [ ] Shopify OAuth implementation
- [ ] Firestore security rules enforcement
- [ ] Rate limiting
- [ ] Error boundaries

### Phase 3: Trust Metrics & Analytics (Week 4)
- [ ] Intervention pattern detection
- [ ] Performance monitoring
- [ ] Backup & recovery
- [ ] Data export

### Phase 4: Deployment & Monitoring (Week 5-6)
- [ ] Vercel deployment
- [ ] Firebase production setup
- [ ] Sentry error tracking
- [ ] Logtail logging

## 🎯 Success Criteria

### Phase 1 Must-Haves:
- ✅ Zero silent failures - Never show "shipped" without Shopify confirmation
- ✅ Two-phase fulfillment - `shipping_in_progress` → `shipped` OR `needs_verification`
- ✅ 5-minute timeout - Auto-escalate to `needs_verification`
- ✅ International order detection
- ✅ Customer notes aggregation
- ✅ Address formatting with no truncation
- ✅ Trust metric calculation
- ✅ Intervention logging

## 📞 Support & Escalation

### When to Pause Development:
- Any silent failure occurs
- Trust metric resets > 3 times/day for any user
- Shopify check reduction < 30% after 7 days
- User reports "I don't trust what I'm seeing"

### When to Celebrate:
- 24+ hour trust streak achieved
- User says "I forgot to check Shopify today"
- Zero silent failures for 72 hours
- Organic word-of-mouth referrals

## 📖 Key Files to Know

- **Database Schema**: [packages/db/src/index.ts](packages/db/src/index.ts)
- **Today View**: [apps/web/components/orders/TodayView.tsx](apps/web/components/orders/TodayView.tsx)
- **Order Card**: [apps/web/components/orders/OrderCard.tsx](apps/web/components/orders/OrderCard.tsx)
- **Trust Metric**: [apps/web/components/metrics/TrustMetric.tsx](apps/web/components/metrics/TrustMetric.tsx)
- **Shopify Client**: [packages/shopify/src/index.ts](packages/shopify/src/index.ts)
- **Firebase Functions**: [apps/functions/src/](apps/functions/src/)

## 🚀 Deployment

### To Vercel (Frontend):
```bash
cd apps/web
vercel --prod
```

### To Firebase (Backend):
```bash
cd apps/functions
firebase deploy --only functions
firebase deploy --only firestore:rules
```

## 📝 License

Proprietary - TrustFulfill Inc.

---

**Remember**: You are not building features. You are building trust. Every line of code should answer: "Does this increase or decrease trust?"
#   t r u s t f u l f i l l . a p p  
 