# TrustFulfill: Quick Reference Card

Print this. Keep it handy.

---

## 🎯 Core Principle

**Every line of code answers: "Does this increase or decrease trust?"**

If unsure, choose the option that:
1. Is more transparent about limitations
2. Fails visibly rather than silently
3. Preserves the user's sense of control
4. Teaches the system's boundaries

---

## 📊 Status Flow (Never Deviate)

```
awaiting_action
     ↓ (User clicks)
shipping_in_progress (Waiting for Shopify webhook)
     ↓
  ┌─────┬──────────────┐
  ↓     ↓              ↓
shipped  timeout      api_error
(5min)  (auto-escalate)
  ↓     ↓              ↓
  ✅    needs_verification (User can retry/verify)
```

---

## 🔑 Two-Phase Commitment

```
Phase 1: "I'm doing this"
├─ User: Click "Mark as Shipping"
├─ System: Set status = shipping_in_progress
└─ UI: "Waiting for Shopify confirmation..."

Phase 2: "It's confirmed"
├─ Shopify: Send fulfillment webhook
├─ System: Set status = shipped
└─ UI: "Shipped & Verified [time]"

Phase 3: "Something went wrong"
├─ Timeout: 5+ minutes without webhook
├─ System: Set status = needs_verification
├─ Log: Intervention with reason
├─ UI: "⚠️ Timeout: Shopify confirmation not received"
└─ User: Can retry or manually verify
```

---

## ⚠️ Critical Non-Negotiables

### DO
- ✅ Log every intervention with reason
- ✅ Show status changes to user
- ✅ Let user retry failures
- ✅ Reset trust streak on intervention
- ✅ Clearly label international orders
- ✅ Show full addresses (no truncation)
- ✅ Aggregate all customer notes
- ✅ Provide manual override option

### DON'T
- ❌ Show "shipped" without Shopify confirmation
- ❌ Hide failures from user
- ❌ Auto-refund or take action without user knowledge
- ❌ Truncate important information
- ❌ Assume international orders are handled
- ❌ Mix trust metric with other metrics
- ❌ Exceed Shopify API rate limits without handling
- ❌ Let webhook failures go unnoticed

---

## 📈 Trust Metric Formula

```
Trust Streak (hours) = Time Since Last Intervention

Example:
├─ 00:00 Installation → Streak = 0
├─ 06:00 First order succeeds → Streak starts
├─ 12:00 Still succeeding → Streak = 6h
├─ 18:00 Order times out (intervention) → Streak = 0
├─ 18:05 User resolves manually → Streak starts again
├─ 24:00 Still succeeding → Streak = 6h
└─ Goal: 24+ hours

Reset on ANY system intervention:
├─ Timeout (5+ min without webhook)
├─ API error (Shopify call failed)
├─ Network timeout
├─ Webhook delivery failure
└─ Manual fallback used
```

---

## 🌍 International Order Rule

```
isDomestic = country_code in ['US', 'CA', 'PR']

If NOT domestic:
├─ Status: ✅ "Awaiting Action" (visible to user)
├─ Category: "International Orders" (separate section)
├─ Interaction: Read-only (cannot action via app)
├─ Metric Impact: None (not counted in verified orders)
├─ UI Note: "External fulfillment required"
└─ User: Must handle manually via Shopify

NOT:
├─ Hidden (diminishes visibility)
├─ Automatically attempted (might fail)
├─ Mixed with domestic (confuses status)
└─ Ignored (user loses track)
```

---

## 🔄 Order Lifecycle

```
Created in Shopify
├─ Sync to TrustFulfill
├─ Display in "Domestic Orders" or "International Orders"
│
User Marks as Shipping
├─ Phase 1: Status = shipping_in_progress
├─ Phase 1: Show "Waiting for Shopify confirmation"
├─ Phase 1: Start 5-minute timer
├─ Phase 2: Call Shopify fulfillment API
│
Webhook Path (Success)
├─ Shopify sends fulfillment webhook
├─ Verify signature (security)
├─ Find order by shopifyId
├─ Update status = shipped
├─ Log fulfillmentConfirmedAt timestamp
├─ Update trust streak
└─ User sees: ✅ "Shipped & Verified [time]"

Timeout Path (5+ minutes, no webhook)
├─ Background job detects stalled order
├─ Status = needs_verification
├─ Log intervention
├─ Reset trust streak to 0
├─ User sees: ⚠️ "Timeout: Confirmation not received"
├─ User can: Retry or Manually Verify
└─ After retry/verify → status = shipped

API Error Path (Shopify call fails)
├─ Status immediately = needs_verification
├─ Log intervention
├─ Reset trust streak
├─ User sees: 🔧 "Shopify API call failed"
├─ User can: Retry
└─ After retry success → status = shipped
```

---

## 💾 Database Collections (Quick Reference)

### shops
```
{
  id: "shop_id",
  currentTrustStreakHours: 12.5,          ← Core metric
  lastInterventionAt: timestamp,          ← When it reset
  lastInterventionReason: "string",       ← Why
  totalInterventions: 3,                  ← Lifetime count
}
```

### orders
```
{
  flowfixStatus: "awaiting_action|shipping_in_progress|shipped|needs_verification",
  isDomestic: boolean,
  addressDisplay: "full_address",         ← No truncation
  customerNotes: ["note1", "note2"],      ← Aggregated
  shippingStartedAt: timestamp,           ← Phase 1
  fulfillmentConfirmedAt: timestamp,      ← Phase 2
  lastSyncStatus: "webhook_received|timeout|api_failed",
}
```

### interventions
```
{
  reason: "Timeout: Shopify confirmation not received within 5 minutes",
  previousStreak: 6.5,                    ← How long was it working?
  timestamp: when_it_happened,
}
```

---

## 🚨 What Triggers Intervention Log?

| Event | Logged? | Reason |
|-------|---------|--------|
| Order created | ❌ | Normal flow |
| User marks shipping | ❌ | User choice |
| Webhook arrives immediately | ❌ | System working |
| Webhook arrives after 4 min | ❌ | System working |
| 5+ min without webhook | ✅ | Timeout |
| Shopify API returns error | ✅ | System failure |
| Network timeout | ✅ | System failure |
| Webhook delivery fails | ✅ | System failure |
| User manually verifies | ✅ | Manual override |
| User retries successfully | ❌ | No additional intervention |

---

## 🔌 API Endpoints (Phase 1)

| Endpoint | Method | Purpose | Returns |
|----------|--------|---------|---------|
| `/api/orders` | GET | Fetch today's orders | Order[] |
| `/api/orders/shipping` | POST | Mark as shipping (Phase 1) | {success: bool} |
| `/api/orders/retry` | POST | Retry failed fulfillment | {success: bool} |
| `/api/orders/verify` | POST | Manually verify order | {success: bool} |
| `/api/metrics/trust` | GET | Fetch trust metric | {streak: num, reason: str} |
| `/api/metrics/interventions` | GET | Get intervention history | Intervention[] |

---

## 📱 Component Map

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| **TodayView** | Main page layout | orders: Order[] |
| **OrderCard** | Individual order | order: Order, readOnly?, urgent? |
| **TrustMetric** | Trust streak display | (auto-fetches data) |
| **Providers** | React Query setup | children |

---

## 🎁 Feature Flow Examples

### Feature: Add new order status
1. Add to `OrderStatusSchema` in `packages/db/src/index.ts`
2. Update `statusConfig` in `apps/web/components/orders/OrderCard.tsx`
3. Update Firestore rules if permissions change
4. Add cases in Cloud Functions as needed
5. Test timeout and failure paths

### Feature: Add new metric
1. Define in `packages/db/src/index.ts`
2. Add calculation in Cloud Function
3. Create API endpoint in `apps/web/app/api/metrics/`
4. Create component in `apps/web/components/metrics/`
5. Add to TodayView layout

### Feature: Add webhook endpoint
1. Create handler in `apps/functions/src/webhooks/`
2. Add Firestore update logic
3. Test with ngrok locally
4. Add to Shopify app configuration
5. Verify signature in handler

---

## 🧪 Testing Checklist

For every feature:
- [ ] Happy path works (success case)
- [ ] Error path works (failure case)
- [ ] Timeout path works (5+ min waits)
- [ ] Fallback works (manual override)
- [ ] Trust metric updates correctly
- [ ] Intervention logs created
- [ ] Messages are clear to user
- [ ] International orders excluded
- [ ] Types are correct (TypeScript)

---

## 🚀 Deployment Checklist

Before deploying:
- [ ] All tests passing
- [ ] No console errors
- [ ] Build succeeds
- [ ] Environment variables set
- [ ] Firebase project ready
- [ ] Shopify app configured
- [ ] Firestore rules deployed
- [ ] Cloud Functions deployed
- [ ] Webhooks configured

---

## 🆘 Common Issues

| Issue | Check | Fix |
|-------|-------|-----|
| Order not appearing | Shopify API call works? | Check API credentials |
| Status doesn't update | Webhook being received? | Check Firebase logs |
| Timeout not firing | 5-min timer started? | Verify Cloud Function runs |
| Trust metric wrong | Calculation logic correct? | Check timezone in calculations |
| International order actioned | isDomestic check working? | Verify country code detection |

---

## 📞 Reference

**Your Core Philosophy Document**: [TRUST_MECHANICS.md](TRUST_MECHANICS.md)

**Your Technical Guide**: [ARCHITECTURE.md](ARCHITECTURE.md)

**Your Dev Workflow**: [DEVELOPMENT.md](DEVELOPMENT.md)

**Your Deployment Steps**: [DEPLOYMENT.md](DEPLOYMENT.md)

**Your Implementation Checklist**: [CHECKLIST.md](CHECKLIST.md)

---

## 💡 Remember

- **Trust is the product**, not features
- **One silent failure** undoes weeks of good work
- **Transparent failure** is better than hidden success
- **User retains control** at all times
- **Interventions are reset points**, not errors

Code accordingly.

---

**Status**: Phase 1 Complete  
**Next**: Implement Firebase & Shopify integration  
**Timeline**: 2 weeks to Phase 1 completion
