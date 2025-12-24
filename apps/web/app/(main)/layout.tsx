import type { Metadata } from 'next';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'Today - TrustFulfill',
};

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      {children}
    </Providers>
  );
}
