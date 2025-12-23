import type { Metadata } from 'next';
import './globals.css';

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
      <body>{children}</body>
    </html>
  );
}
