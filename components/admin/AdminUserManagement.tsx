"use client";

import { useState, useEffect } from "react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { logger } from '@/lib/logger';
import { 
  Search, 
  Ban, 
  Shield, 
  User, 
  Mail, 
  Calendar,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Crown
} from "lucide-react";

interface User {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'MODERATOR' | 'USER';
  is_active: boolean;
  is_banned: boolean;
  created_at: string;
  updated_at: string;
  awra_coins: number;
  total_winnings: number;
  total_spent: number;
}

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function AdminUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication and get current user
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/auth/verify', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(data.authenticated);
        if (data.user) {
          setCurrentUser(data.user);
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      logger.error('Auth check failed:', error);
      setIsAuthenticated(false);
    }
  };

  const fetchUsers = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        search,
        page: "1",
        limit: "50"
      });

      const response = await fetch(`/api/admin/users?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data: UsersResponse = await response.json();
      setUsers(data.users);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
    }
  }, [isAuthenticated, search]);

  const handleBanUnban = async (email: string, action: 'ban' | 'unban', username: string) => {
    if (!isAuthenticated) return;

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${username} (${email})?`
    );

    if (!confirmed) return;

    try {
      setActionLoading(email);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          action,
          reason: `${action}ed by admin`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user status');
      }

      const result = await response.json();
      setSuccess(result.message);
      
      // Refresh users list
      fetchUsers();
    } catch (error: any) {
      setError(error.message || 'Failed to update user status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleModeratorAction = async (email: string, action: 'promote_mod' | 'demote_mod', username: string) => {
    if (!isAuthenticated) return;

    const actionText = action === 'promote_mod' ? 'promote to moderator' : 'demote from moderator';
    const confirmed = window.confirm(
      `Are you sure you want to ${actionText} ${username} (${email})?`
    );

    if (!confirmed) return;

    try {
      setActionLoading(email);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          action,
          reason: `${action} by admin`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update moderator status');
      }

      const result = await response.json();
      setSuccess(result.message);
      
      // Refresh users list
      fetchUsers();
    } catch (error: any) {
      setError(error.message || 'Failed to update moderator status');
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge className="bg-red-100 text-red-800">Admin</Badge>;
      case 'MODERATOR':
        return <Badge className="bg-blue-100 text-blue-800">Mod</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">User</Badge>;
    }
  };

  const getStatusBadge = (user: User) => {
    if (user.is_banned) {
      return <Badge className="bg-red-100 text-red-800">Banned</Badge>;
    }
    if (user.is_active) {
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800">Inactive</Badge>;
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-2 p-4 border border-red-200 rounded-lg bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <span className="text-red-800">
          Authentication required. Please log in to access user management.
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button onClick={fetchUsers} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search by username or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Messages */}
      {error && (
        <div className="flex items-center gap-2 p-4 border border-red-200 rounded-lg bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-4 border border-green-200 rounded-lg bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-green-800">{success}</span>
        </div>
      )}

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No users found
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{user.username}</span>
                        {getRoleBadge(user.role)}
                        {getStatusBadge(user)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Joined {new Date(user.created_at).toLocaleDateString()}
                        </div>
                        <div>Coins: {user.awra_coins}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {user.email !== currentUser?.email && (
                      <>
                        {/* Moderator Controls */}
                        {currentUser?.role === 'ADMIN' && user.role !== 'ADMIN' && (
                          <Button
                            variant={user.role === 'MODERATOR' ? "outline" : "default"}
                            size="sm"
                            onClick={() => handleModeratorAction(
                              user.email, 
                              user.role === 'MODERATOR' ? "demote_mod" : "promote_mod", 
                              user.username
                            )}
                            disabled={actionLoading === user.email}
                            className={user.role === 'MODERATOR' ? "border-orange-200 text-orange-600 hover:bg-orange-50" : "bg-orange-600 hover:bg-orange-700"}
                          >
                            {actionLoading === user.email ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            ) : (
                              <Crown className="w-4 h-4 mr-2" />
                            )}
                            {user.role === 'MODERATOR' ? "Remove Mod" : "Make Mod"}
                          </Button>
                        )}
                        
                        {/* Ban/Unban Controls */}
                        <Button
                          variant={user.is_banned ? "default" : "destructive"}
                          size="sm"
                          onClick={() => handleBanUnban(
                            user.email, 
                            user.is_banned ? "unban" : "ban", 
                            user.username
                          )}
                          disabled={actionLoading === user.email}
                        >
                          {actionLoading === user.email ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <Ban className="w-4 h-4 mr-2" />
                          )}
                          {user.is_banned ? "Unban" : "Ban"}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
