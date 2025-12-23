# TrustFulfill Development Guide

## Getting Started

This guide walks you through the TrustFulfill development process, from local setup to deployment.

## Environment Setup

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd TrustFulfill
npm install
```

### 2. Firebase Setup

Create a new Firebase project:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize Firebase project
firebase init
# Choose: Firestore, Functions, Emulator
# When asked about project ID, enter your Firebase project ID
```

### 3. Environment Variables

Create `.env.local` in `apps/web/`:

```bash
cp apps/web/.env.example apps/web/.env.local
```

Edit with your credentials:
- Shopify API credentials
- Firebase config
- NextAuth secret (generate with `openssl rand -base64 32`)

### 4. Test Data Setup

For local development, you can use the Firebase Emulator:

```bash
# Terminal 1: Start emulators
firebase emulators:start

# Terminal 2: Start dev server
cd apps/web
npm run dev
```

Access Firebase Emulator UI at `http://localhost:4000`

## Development Workflow

### Working on a Feature

1. **Create a feature branch**:
```bash
git checkout -b feature/your-feature-name
```

2. **Make changes** to relevant files

3. **Test locally**:
```bash
# Type check
npm run type-check

# Lint
npm run lint
```

4. **Commit and push**:
```bash
git add .
git commit -m "feat: description of your change"
git push origin feature/your-feature-name
```

5. **Create Pull Request** with description of changes

### File Organization

When adding new features:

- **Components**: `apps/web/components/[feature-area]/`
- **API Routes**: `apps/web/app/api/[resource]/`
- **API Utilities**: `apps/web/lib/api/`
- **Database Schema**: `packages/db/src/`
- **Cloud Functions**: `apps/functions/src/[category]/`

## Working with the Database

### Adding a New Collection

1. Update schema in `packages/db/src/index.ts`:
```typescript
export const YourCollectionSchema = z.object({
  id: z.string(),
  // ... fields
});

export type YourCollection = z.infer<typeof YourCollectionSchema>;
```

2. Update Firestore rules in `firestore.rules`

3. Create API route in `apps/web/app/api/`

### Querying Data

In API routes or Cloud Functions:

```typescript
import { db } from '@trustfulfill/firebase';

// Get documents
const snapshot = await db.collection('orders').where('shopId', '==', shopId).get();

// Set document
await db.collection('orders').doc(orderId).set(orderData);

// Update document
await db.collection('orders').doc(orderId).update(updates);
```

## Working with Shopify Integration

### Testing Webhooks

Use ngrok to tunnel webhooks to localhost:

```bash
# In separate terminal
ngrok http 3000

# Add ngrok URL to Shopify webhooks in app settings
```

Test webhook delivery in Shopify Admin > Apps > Your App > Configuration.

### Shopify API Testing

```typescript
import { ShopifyClient } from '@trustfulfill/shopify';

const client = new ShopifyClient(accessToken, shopDomain);
const orders = await client.getTodayOrders();
```

## Common Development Tasks

### Add a New API Endpoint

1. Create file: `apps/web/app/api/[resource]/[action].ts`
2. Implement GET/POST/PUT handler
3. Add tests
4. Update documentation

### Update Order Status Display

Edit: `apps/web/components/orders/OrderCard.tsx`

Modify `statusConfig` object to add/change status displays.

### Add a New Firebase Function

1. Create file: `apps/functions/src/[category]/index.ts`
2. Export function
3. Deploy: `firebase deploy --only functions`

### Run Database Migrations

For major schema changes:

1. Export current data
2. Update schema
3. Write migration script
4. Test on staging
5. Deploy to production

## Debugging

### Enable Verbose Logging

```bash
DEBUG=* npm run dev
```

### Firebase Emulator Issues

```bash
# Clear emulator data
firebase emulators:start --import ./data --export-on-exit

# Reset everything
rm -rf ./data
firebase emulators:start
```

### Network Issues

Check browser DevTools:
1. Network tab - see API responses
2. Console tab - see JavaScript errors
3. Application tab - see local storage/cookies

## Performance Monitoring

### Build Size

```bash
# Analyze bundle
npm run build
# Check .next folder size
```

### API Performance

Use Next.js built-in monitoring or add:

```typescript
import { performance } from 'perf_hooks';

const start = performance.now();
// ... code ...
console.log(`Request took ${performance.now() - start}ms`);
```

## Testing

### Unit Tests

```bash
npm run test
```

### Integration Tests

Test API endpoints with actual Firebase Emulator running.

### E2E Tests

Use Playwright or Cypress (setup needed):

```bash
npx playwright install
npm run test:e2e
```

## Code Style

This project uses:
- **TypeScript** for type safety
- **ESLint** for linting
- **Prettier** for formatting

### Format Code

```bash
npm run format
```

### Check for Issues

```bash
npm run lint
npm run type-check
```

## Security Considerations

### Sensitive Data

- Never commit `.env.local` (it's in `.gitignore`)
- Use environment variables for secrets
- Don't log sensitive information

### Firestore Rules

Always test security rules:

```bash
# Rules are enforced in emulator
firebase emulators:start
# Try operations that should fail
```

### API Security

- Validate input with Zod
- Check authentication before returning data
- Rate limit endpoints
- Use HTTPS in production

## Deployment Checklist

Before deploying to production:

- [ ] All tests passing
- [ ] No console errors or warnings
- [ ] Environment variables set
- [ ] Database schema matches code
- [ ] Firestore rules updated
- [ ] Cloud Functions tested
- [ ] Shopify webhooks configured
- [ ] Error monitoring (Sentry) configured

## Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run lint             # Check code style
npm run type-check       # Check TypeScript types
npm run format           # Format code

# Firebase
firebase emulators:start # Start local emulators
firebase deploy          # Deploy to Firebase
firebase logs            # View function logs

# Database
npm run db:migrate       # Run migrations
npm run db:seed          # Seed test data

# Testing
npm run test             # Run unit tests
npm run test:watch       # Watch mode
npm run test:e2e         # End-to-end tests
```

## Getting Help

1. Check existing issues/PRs
2. Review code comments and docs
3. Check Firebase/Next.js documentation
4. Ask team members

## Contributing Guidelines

1. Write clear commit messages
2. Add tests for new features
3. Update documentation
4. Keep PRs focused and small
5. Request review before merging

---

For deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)
