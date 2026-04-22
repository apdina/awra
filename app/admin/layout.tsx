"use client";

import { AdminLogin } from '@/app/components/AdminLogin';
import { ConvexClientProvider } from '@/components/ConvexClientProvider';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConvexClientProvider>
      <AdminLogin>
        {children}
      </AdminLogin>
    </ConvexClientProvider>
  );
}
