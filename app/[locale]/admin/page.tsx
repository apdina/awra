import { Metadata } from 'next';
import ClientAdminDashboard from './ClientAdminDashboard';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'Admin dashboard for user management and system settings',
};

export default function AdminPage() {
  return <ClientAdminDashboard />;
}
