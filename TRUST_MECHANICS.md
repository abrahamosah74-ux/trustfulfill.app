# TrustFulfill: Core Trust Mechanics

## The Philosophy

**We don't sell features. We sell trust transfer.**

When a shop owner sees "12 orders shipped" in TrustFulfill, they know Shopify confirmed all 12. Not "probably," not "likely" - **confirmed**.

This is the entire value proposition. Everything else is implementation detail.

## What Creates Trust?

### ✅ Visible Confirmation
- User sees "Pending Shopify Confirmation" status
- Webhook arrives → "Shipped & Verified [time]"
- Clear timeline of what happened and when

### ✅ Transparent Failure
- Order stuck > 5 minutes → "⚠️ Needs Verification"
- Reason clearly stated (timeout vs API error)
- User retains ultimate control

### ✅ System Autonomy
- "Hours since intervention" metric visible
- Demonstrates system is working without asking
- Goal: 24+ hours of successful operation

### ✅ Honest Limitations
- International orders explicitly marked as "External fulfillment"
- Not "hidden" or "secondary" - front and center
- User understands scope boundaries

## What Destroys Trust?

### ❌ Silent Failures
```typescript
// NEVER do this:
markAsShipped(); // Hope it works
```

### ❌ Ambiguous Status
```typescript
// NEVER do this:
orderStatus = "processing"; // What does this mean?
```

### ❌ Hidden Limitations
```typescript
// NEVER do this:
if (international) {
  tryToFulfill(); // Might fail silently
}
```

### ❌ Confusing Intervention
```typescript
// NEVER do this:
await setTimeout(() => {
  refundIfNotShipped(); // User doesn't know this happened
}, 5 * 60 * 1000);
```

## The Two-Phase Commitment

### Phase 1: "I'm doing this"
```
User Action: Click "Mark as Shipping"
System Response: Change status to "shipping_in_progress"
Message: "Waiting for Shopify confirmation..."
Timeline: Next 5 minutes will tell us if this worked
```

### Phase 2: "It's confirmed"
```
Shopify Event: Fulfillment webhook arrives
System Response: Change status to "shipped"
Message: "Shipped & Verified [time]"
Trust Impact: +1 to streak
```

### Phase 3: "Something went wrong"
```
Timeout Event: 5 minutes pass without webhook
System Response: Change status to "needs_verification"
Message: "⚠️ Timeout: Shopify confirmation not received"
Trust Impact: Streak resets to 0
User Option: Retry or manually verify
```

## Trust Streak Meaning

**Trust Streak = "I haven't needed to intervene in [X] hours"**

This is NOT:
- Success rate (we can have 100% success but still need to verify)
- API uptime (Shopify API could be slow)
- Processing speed (some orders take time)

This IS:
- System reliability for THIS shop
- Proof that automated flow is working
- Demonstration that owner can trust the system

### Streak Lifecycle

```
Installation (00:00):
└─ Streak = 0 hours
   User is testing, needs manual verification on first few

First 6 hours:
├─ Orders succeeding without intervention
├─ User gains confidence
└─ Streak grows

Order times out (06:00):
├─ Automatic escalation to needs_verification
├─ User manually verifies (only took 30 seconds)
├─ Shop learns: "Use manual verification when needed"
└─ Streak resets to 0

Hours 6-24:
├─ User understands the system
├─ Fewer manual interventions needed
├─ Streak grows to 18+ hours
└─ Shop owner starts saying "I forgot to check Shopify"

Day 2+:
└─ "24+ hour streak" becomes baseline expectation
```

## Intervention Logging

Every time trust resets, log an intervention:

```typescript
const intervention = {
  shopId: order.shopId,
  orderId: order.id,
  orderNumber: order.orderNumber,
  reason: "Timeout: Shopify confirmation not received within 5 minutes",
  timestamp: now(),
  previousStreak: order.currentTrustStreakHours, // How long was it working?
  details: {
    // Context for debugging
    shippingStartedAt: order.shippingStartedAt,
    checkpointOne: "Local status updated",
    checkpointTwo: "Shopify API called",
    checkpointThree: "Timeout triggered",
  },
};
```

This creates:
1. **Audit trail** - What happened and why
2. **Pattern detection** - If same shop keeps failing, we know
3. **Metric foundation** - For calculating trust streaks
4. **User transparency** - Can see exactly when system needed help

## International Order Boundary

**Decision: We don't handle international fulfillment**

Why?
- Customs complexity
- Regional restrictions
- Carrier requirements
- Escapes our trust model

How we handle it:
```typescript
if (!isDomestic(order.shippingAddress)) {
  order.status = "awaiting_action"; // Still visible
  order.readOnly = true;             // Can't interact
  order.category = "International";  // Clear label
  // Don't include in "verified shipped" count
  // Don't track in trust metric
}
```

This is better than:
- Hiding international orders (user loses visibility)
- Trying to fulfill them (might fail silently)
- Mixing with domestic orders (confuses metrics)

## The Dashboard Story

When a user opens TrustFulfill:

```
┌─────────────────────────────────────────┐
│ System Autonomy: 12.5 hours             │  ← Trust Streak
│ [=========>......................] 24h   │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│ Domestic Orders (8) - Ready             │  ← Can action
│ ┌─────────────────────────────────────┐│
│ │ #1001: John Doe                     ││  ← Auto verified
│ │ Status: ✅ Shipped & Verified 2:15pm│  │     when Shopify
│ │ Addr: 123 Main St, New York, NY     ││  │     confirms
│ └─────────────────────────────────────┘│
│ ... (7 more in same state)              │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│ International Orders (2)                 │  ← Read-only
│ ┌─────────────────────────────────────┐│
│ │ #1009: Jane Smith                   ││  ← User handles
│ │ Status: ⭕ Awaiting Action          ││  │     manually
│ │ Addr: 45 Baker St, London, UK       ││  │     via Shopify
│ │ (External fulfillment required)      ││
│ └─────────────────────────────────────┘│
│ ... (1 more)                            │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│ Needs Verification (0)                   │  ← User attention
│ (None - system working well!)           │     when needed
└─────────────────────────────────────────┘

Last intervention: Installation setup
```

This tells the complete trust story in one glance:
- System is working (12.5h streak)
- 8 orders confirmed
- 2 orders acknowledged as out-of-scope
- 0 problems requiring attention

## Failure Modes & Recovery

### Scenario 1: Timeout
```
15:30 - User: "Mark as Shipping" → shipping_in_progress
15:35 - Webhook never arrived → needs_verification
        System: "Timeout: Shopify confirmation not received"
        User: Can retry or manually verify
        Outcome: Shop owner learns timeout behavior
```

### Scenario 2: API Error
```
15:30 - User: "Mark as Shipping"
        Shopify API: 500 error
        System: Immediately → needs_verification
        Message: "Shopify API call failed"
        Outcome: User knows it's not a timeout, it's a real error
```

### Scenario 3: Webhook Fails
```
15:30 - User: "Mark as Shipping" → shipping_in_progress
15:32 - Shopify: Sends fulfillment webhook
        Firebase: Webhook times out
        System: Waits until 15:35 → needs_verification
        User: Can manually verify
        Outcome: Transparent about the issue
```

### Scenario 4: Retry Success
```
15:30 - Timeout: needs_verification
15:35 - User: Clicks "Retry"
        API: Now succeeds
        Webhook: Arrives immediately
        System: shifted to shipped
        Outcome: User trusts the retry mechanism
```

## Metrics That Matter

### For Shop Owner:
- **Trust Streak**: Do I have to micromanage?
- **Intervention History**: What went wrong and when?
- **Verified Orders**: How many orders has Shopify confirmed?

### For Product:
- **Failure Patterns**: Are certain shops failing repeatedly?
- **Timeout Rate**: Are timeouts > 5%? Indicates Shopify speed issue
- **Intervention Frequency**: Should be declining with use

### For Support:
- **Intervention Reason**: Can help debug shop-specific issues
- **Order Details**: Full context for triage

## Testing Trust Mechanics

To verify implementation is maintaining trust:

```
Test: Mark order as shipping
├─ Status immediately shows "shipping_in_progress"
├─ UI shows "Waiting for Shopify confirmation"
└─ 5-minute timer starts

Test: Webhook arrives
├─ Status updates to "shipped"
├─ Timestamp shows exact confirmation time
├─ Trust streak updates
└─ User never had to intervene

Test: Timeout occurs
├─ After 5 minutes, auto-escalate to "needs_verification"
├─ Intervention logged with reason
├─ Trust streak resets
├─ User can see what happened
├─ User can retry or manually verify

Test: Manual verification
├─ User clicks "Manually verify"
├─ Status becomes "shipped"
├─ Streak remains reset (because manual intervention occurred)
└─ User explicitly responsible

Test: International order
├─ Status shows as "Awaiting Action"
├─ Not included in verified count
├─ Cannot be actioned via TrustFulfill
├─ User understands to handle via Shopify
└─ Streak not affected if left unhandled
```

## The Bottom Line

Every architectural decision must answer: **"Does this increase or decrease trust?"**

If unsure, choose the option that:
1. Is more transparent about limitations
2. Fails visibly rather than silently
3. Preserves the user's sense of control
4. Teaches the system's boundaries

---

**Remember**: Trust is earned slowly and lost instantly. One silent failure undoes weeks of good work.

Code accordingly.
