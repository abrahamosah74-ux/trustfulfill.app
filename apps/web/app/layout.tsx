import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { ErrorBoundary } from '@/components/error-boundary';

export const metadata: Metadata = {
  title: 'TrustFulfill - Order Fulfillment Transparency',
  description: 'Real-time order fulfillment tracking for Shopify stores',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <Providers>{children}</Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
