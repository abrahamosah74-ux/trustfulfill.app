# TrustFulfill Deployment Guide

## Prerequisites

- Vercel account (for frontend)
- Firebase project (for backend)
- Shopify Partner account
- Environment variables configured

## Phase 1: Deploy to Vercel (Frontend)

### Step 1: Connect GitHub Repository

1. Go to [vercel.com](https://vercel.com)
2. Click "Import Project"
3. Select your GitHub repository
4. Vercel will auto-detect Next.js configuration

### Step 2: Configure Environment Variables

In Vercel Dashboard:

```
NEXT_PUBLIC_SHOPIFY_API_KEY=your_key
SHOPIFY_API_SECRET=your_secret
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your_secret
```

### Step 3: Deploy

```bash
# Vercel auto-deploys on git push to main
# Or trigger manually in dashboard
```

## Phase 2: Deploy to Firebase (Backend)

### Step 1: Create Firebase Project

```bash
# Login to Firebase
firebase login

# Create project
firebase projects:create trustfulfill-prod --display-name="TrustFulfill Production"

# Select project
firebase use trustfulfill-prod
```

### Step 2: Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### Step 3: Deploy Cloud Functions

```bash
cd apps/functions
npm install
npm run build
firebase deploy --only functions
```

### Step 4: Setup Firestore Indexes

Firebase will provide migration prompts. Follow the CLI instructions.

## Phase 3: Configure Shopify App

### Step 1: Update App URL

```bash
shopify app config set --app-url https://your-domain.vercel.app
```

### Step 2: Setup Webhooks

In Shopify App Admin:

1. Go to Configuration > Webhooks
2. Add webhook for `orders/fulfilled`
3. Set endpoint to: `https://your-firebase-region-project.cloudfunctions.net/shopifyFulfillmentWebhook`

### Step 3: Configure Scopes

In `shopify.app.toml`:
```toml
scopes = "read_orders,write_fulfillments"
```

## Monitoring & Maintenance

### View Logs

```bash
# Vercel
vercel logs

# Firebase Functions
firebase functions:log
```

### Monitor Errors

Set up Sentry for error tracking:
1. Create Sentry project
2. Add `SENTRY_DSN` to Vercel environment variables
3. Deploy

### Health Checks

Regular checks to perform:
- Trust streak metrics (should grow over time)
- Intervention logs (should be rare after stabilization)
- API response times (should be < 200ms)
- Webhook delivery rates (should be > 99%)

## Rollback Procedures

### Vercel Rollback

```bash
# View deployments
vercel ls

# Rollback to previous
vercel rollback <deployment-id>
```

### Firebase Rollback

```bash
# List previous versions
firebase functions:list

# Delete problematic function
firebase functions:delete functionName

# Redeploy previous version
firebase deploy --only functions
```

## Performance Optimization

### Frontend

```bash
# Check Next.js build size
npm run build
# Look for warnings about large chunks
```

### Backend

Monitor Firebase usage:
- Firestore reads/writes
- Cloud Function invocations
- Storage usage

Set up cost alerts in Google Cloud Console.

## Scaling Considerations

When user base grows:

1. **Database**: Use Firestore sharding for hot collections
2. **Functions**: Increase memory allocation if needed
3. **CDN**: Vercel handles this automatically
4. **API**: Implement rate limiting per shop

## Disaster Recovery

### Backup Strategy

```bash
# Monthly exports
firebase firestore:export gs://trustfulfill-backups/monthly
```

### Restore Procedure

1. Export clean backup
2. Restore to staging environment
3. Test thoroughly
4. Promote to production

## Troubleshooting

### Webhook Not Triggering

1. Check Shopify webhook configuration
2. Verify Cloud Function URL
3. Test with curl: `curl -X POST https://your-function-url`
4. Check Firebase Function logs

### Orders Not Syncing

1. Check API credentials
2. Verify Shopify scopes
3. Test Shopify API directly
4. Check rate limits

### High Latency

1. Check Firestore indexes
2. Monitor Cloud Function memory usage
3. Check network requests in DevTools
4. Profile with Lighthouse

---

For issues during deployment, check the [README.md](README.md) for general setup instructions.
