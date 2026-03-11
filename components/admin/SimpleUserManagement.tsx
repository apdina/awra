"use client";

import { useState } from "react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Mail, 
  Ban, 
  Shield, 
  User, 
  AlertCircle,
  CheckCircle,
  Crown
} from "lucide-react";

export default function SimpleUserManagement() {
  const [email, setEmail] = useState("");
  const [action, setAction] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAction = async () => {
    if (!email.trim()) {
      setError("Please enter an email address");
      return;
    }

    if (!action) {
      setError("Please select an action");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to ${getActionText(action)} ${email}?`
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: email.trim(),
          action,
          reason: `Action performed by admin`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to perform action');
      }

      const result = await response.json();
      setSuccess(result.message);
      setEmail("");
      setAction("");
      
    } catch (error: any) {
      setError(error.message || 'Failed to perform action');
    } finally {
      setLoading(false);
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'ban': return 'ban';
      case 'unban': return 'unban';
      case 'promote_mod': return 'promote to moderator';
      case 'demote_mod': return 'demote from moderator';
      default: return action;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'ban': return 'bg-red-600 hover:bg-red-700';
      case 'unban': return 'bg-green-600 hover:bg-green-700';
      case 'promote_mod': return 'bg-orange-600 hover:bg-orange-700';
      case 'demote_mod': return 'bg-orange-600 hover:bg-orange-700';
      default: return 'bg-gray-600 hover:bg-gray-700';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'ban': return <Ban className="w-4 h-4 mr-2" />;
      case 'unban': return <Shield className="w-4 h-4 mr-2" />;
      case 'promote_mod': return <Crown className="w-4 h-4 mr-2" />;
      case 'demote_mod': return <User className="w-4 h-4 mr-2" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            User Management
          </CardTitle>
          <p className="text-sm text-gray-600">
            Enter an email address and select an action to perform
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User Email Address
            </label>
            <Input
              type="email"
              placeholder="Enter user email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Action Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Action
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button
                variant={action === 'ban' ? 'default' : 'outline'}
                onClick={() => setAction('ban')}
                className={action === 'ban' ? 'bg-red-600 hover:bg-red-700' : 'border-red-200 text-red-600 hover:bg-red-50'}
              >
                <Ban className="w-4 h-4 mr-2" />
                Ban User
              </Button>
              
              <Button
                variant={action === 'unban' ? 'default' : 'outline'}
                onClick={() => setAction('unban')}
                className={action === 'unban' ? 'bg-green-600 hover:bg-green-700' : 'border-green-200 text-green-600 hover:bg-green-50'}
              >
                <Shield className="w-4 h-4 mr-2" />
                Unban User
              </Button>
              
              <Button
                variant={action === 'promote_mod' ? 'default' : 'outline'}
                onClick={() => setAction('promote_mod')}
                className={action === 'promote_mod' ? 'bg-orange-600 hover:bg-orange-700' : 'border-orange-200 text-orange-600 hover:bg-orange-50'}
              >
                <Crown className="w-4 h-4 mr-2" />
                Make Mod
              </Button>
              
              <Button
                variant={action === 'demote_mod' ? 'default' : 'outline'}
                onClick={() => setAction('demote_mod')}
                className={action === 'demote_mod' ? 'bg-orange-600 hover:bg-orange-700' : 'border-orange-200 text-orange-600 hover:bg-orange-50'}
              >
                <User className="w-4 h-4 mr-2" />
                Remove Mod
              </Button>
            </div>
          </div>

          {/* Execute Button */}
          <Button
            onClick={handleAction}
            disabled={loading || !email.trim() || !action}
            className={`w-full ${action ? getActionColor(action) : 'bg-gray-400'}`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                {getActionIcon(action)}
                {action ? `${getActionText(action).charAt(0).toUpperCase() + getActionText(action).slice(1)} User` : 'Select an Action'}
              </>
            )}
          </Button>
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

      {/* Instructions */}
      <Card className="bg-gray-50 border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg">Quick Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <span className="text-red-600">🚫</span>
            <span><strong>Ban User:</strong> Prevents user from logging in and accessing the system</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600">✅</span>
            <span><strong>Unban User:</strong> Restores user access to the system</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-orange-600">👑</span>
            <span><strong>Make Mod:</strong> Grants moderator privileges (chat moderation, user management)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-gray-600">👤</span>
            <span><strong>Remove Mod:</strong> Removes moderator privileges</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
