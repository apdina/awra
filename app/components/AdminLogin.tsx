"use client";

import { useState, useEffect } from 'react';

interface AdminLoginProps {
  children: React.ReactNode;
}

export function AdminLogin({ children }: AdminLoginProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  // Check if already authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('🔍 Checking admin authentication...');
      const response = await fetch('/api/admin/auth/verify', {
        credentials: 'include',
      });

      console.log('🔍 Auth check response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Auth check data:', data);
        setIsAuthenticated(data.authenticated);
      } else {
        console.log('🔍 Auth check failed, response not ok');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('🔍 Auth check failed:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    // Sanitize input
    const sanitizedPassword = password.trim();

    if (!sanitizedPassword) {
      setError("Password is required");
      return;
    }

    if (sanitizedPassword.length > 100) {
      setError("Password too long");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      console.log('🔐 Attempting admin login...');
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ password: sanitizedPassword }),
      });

      console.log('🔐 Login response status:', response.status);
      const data = await response.json();
      console.log('🔐 Login response data:', data);

      if (response.ok) {
        console.log('🔐 Login successful, checking auth...');
        // Wait a moment for cookie to be set
        setTimeout(() => {
          checkAuth();
        }, 100);
      } else {
        console.log('🔐 Login failed:', data.error);
        setError(data.error || "Authentication failed. Please check your credentials.");
        setRemainingAttempts(data.remainingAttempts);
      }
    } catch (error) {
      console.error('🔐 Login error:', error);
      setError("Failed to connect to server.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
      <div className="bg-gray-800 p-8 rounded-xl max-w-sm w-full border border-gray-700">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🔐</div>
          <h2 className="text-2xl font-bold text-yellow-500">Admin Access</h2>
          <p className="text-gray-400 text-sm mt-2">Enter admin password to continue</p>
        </div>

        <div className="space-y-4">
          <div>
            <input 
              type="password" 
              placeholder="Enter Admin Password" 
              className="w-full p-3 rounded bg-gray-700 border border-gray-600 text-white focus:border-yellow-500 focus:outline-none"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleLogin()}
              disabled={isLoading}
              maxLength={100}
              autoComplete="off"
            />
            {remainingAttempts !== null && remainingAttempts > 0 && (
              <p className="text-xs text-yellow-400 mt-1">
                {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining
              </p>
            )}
          </div>

          <button 
            onClick={handleLogin}
            disabled={isLoading || !password.trim()}
            className="w-full bg-yellow-600 text-black font-bold p-3 rounded hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Verifying...' : 'Login'}
          </button>

          {error && (
            <div className="bg-red-900/30 border border-red-500/50 rounded p-3">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-700">
          <p className="text-xs text-gray-500 text-center">
            🔒 Secure admin authentication
          </p>
        </div>
      </div>
    </div>
  );
}
