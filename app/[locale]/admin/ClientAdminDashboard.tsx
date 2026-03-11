"use client";

import { useAuth } from "@/components/ConvexAuthProvider";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Settings, Shield, BarChart, AlertCircle } from 'lucide-react';
import UserManagement from '@/components/admin/UserManagement';

export default function ClientAdminDashboard() {
  const { user: authUser, isAuthenticated } = useAuth();

  // Check if user has admin/moderator access
  const hasAccess = isAuthenticated && (authUser?.isAdmin || authUser?.isModerator);

  if (!hasAccess) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 p-4 border border-red-200 rounded-lg bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span className="text-red-800">
            Access denied. Admin or moderator privileges required.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Manage users, monitor system activity, and configure settings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Logged in as:</span>
          {authUser?.isAdmin ? (
            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">Admin</span>
          ) : authUser?.isModerator ? (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">Moderator</span>
          ) : (
            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">User</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">User Management</CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Manage users, ban/unban accounts, and monitor activity
            </p>
            <Button className="w-full" disabled>
              <Users className="w-4 h-4 mr-2" />
              Active Below
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Chat Moderation</CardTitle>
            <Shield className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Moderate chat messages and manage reports
            </p>
            <Button variant="outline" className="w-full" disabled>
              <Shield className="w-4 h-4 mr-2" />
              Coming Soon
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">System Settings</CardTitle>
            <Settings className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Configure system settings and preferences
            </p>
            <Button variant="outline" className="w-full" disabled>
              <Settings className="w-4 h-4 mr-2" />
              Coming Soon
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Analytics</CardTitle>
            <BarChart className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              View system analytics and usage statistics
            </p>
            <Button variant="outline" className="w-full" disabled>
              <BarChart className="w-4 h-4 mr-2" />
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* User Management Section - Integrated Directly */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-6">
          <Users className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold">User Management</h2>
        </div>
        <UserManagement />
      </div>
    </div>
  );
}
