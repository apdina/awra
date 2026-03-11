"use client";

import { AdminLogin } from '@/app/components/AdminLogin';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminLogin>
      {children}
    </AdminLogin>
  );
}
