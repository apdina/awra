"use client";

import { useState, useEffect } from "react";
import { Clock, Settings, Save, RefreshCw, Calendar } from "lucide-react";

interface DrawTimeManagerProps {
  // adminSecret no longer needed - uses session authentication
}

interface DrawConfig {
  defaultDrawTime: string;
  excludeSundays: boolean;
  nextDrawDate?: string;
  nextDrawTime?: string;
  currentDrawStatus?: string;
}

export default function DrawTimeManager({}: DrawTimeManagerProps) {
  const [config, setConfig] = useState<DrawConfig>({
    defaultDrawTime: "21:40",
    excludeSundays: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch current configuration
  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      
      // Get CSRF token
      const csrfResponse = await fetch('/api/csrf-token', {
        credentials: 'include',
      });
      const csrfData = await csrfResponse.json();
      const csrfToken = csrfData.token;

      const response = await fetch('/api/admin/draw-config', {
        headers: {
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setConfig({
          defaultDrawTime: data.defaultDrawTime || "21:40",
          excludeSundays: data.excludeSundays !== false,
          nextDrawDate: data.nextDrawDate,
          nextDrawTime: data.nextDrawTime,
          currentDrawStatus: data.currentDrawStatus
        });
      } else {
        setMessage({ type: 'error', text: 'Failed to fetch configuration' });
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      setMessage({ type: 'error', text: 'Error fetching configuration' });
    } finally {
      setIsLoading(false);
    }
  };

  // Save configuration
  const saveConfig = async () => {
    try {
      setIsSaving(true);
      setMessage(null);
      
      // Get CSRF token
      const csrfResponse = await fetch('/api/csrf-token', {
        credentials: 'include',
      });
      const csrfData = await csrfResponse.json();
      const csrfToken = csrfData.token;
      
      const response = await fetch('/api/admin/draw-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({
          defaultDrawTime: config.defaultDrawTime,
          excludeSundays: config.excludeSundays
        })
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Configuration saved successfully!' });
        await fetchConfig(); // Refresh data
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to save configuration' });
      }
    } catch (error) {
      console.error('Error saving config:', error);
      setMessage({ type: 'error', text: 'Error saving configuration' });
    } finally {
      setIsSaving(false);
    }
  };

  // Create next draw manually
  const createNextDraw = async () => {
    try {
      setIsSaving(true);
      setMessage(null);
      
      const response = await fetch('/api/admin/create-next-draw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminSecret}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessage({ 
          type: 'success', 
          text: `Next draw created: ${data.next_draw.date} at ${data.next_draw.time}` 
        });
        await fetchConfig(); // Refresh data
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to create next draw' });
      }
    } catch (error) {
      console.error('Error creating draw:', error);
      setMessage({ type: 'error', text: 'Error creating next draw' });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [adminSecret]);

  if (isLoading) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
        <div className="flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 text-yellow-400 animate-spin" />
          <span className="text-white">Loading configuration...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-6 h-6 text-yellow-400" />
        <h2 className="text-xl font-bold text-white">Draw Time Management</h2>
      </div>

      {/* Current Status */}
      <div className="mb-6 p-4 bg-slate-800/50 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-400" />
          Current Status
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">Current Draw Time:</span>
            <span className="text-white font-mono">{config.defaultDrawTime}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Sunday Exclusion:</span>
            <span className={`font-semibold ${config.excludeSundays ? 'text-green-400' : 'text-red-400'}`}>
              {config.excludeSundays ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          {config.nextDrawDate && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-300">Next Draw Date:</span>
                <span className="text-white">{config.nextDrawDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Next Draw Time:</span>
                <span className="text-white font-mono">{config.nextDrawTime}</span>
              </div>
            </>
          )}
          <div className="flex justify-between">
            <span className="text-gray-300">Auto-Increment:</span>
            <span className="text-green-400 font-semibold">Active (24H/48H Sunday)</span>
          </div>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Default Draw Time
          </label>
          <input
            type="time"
            value={config.defaultDrawTime}
            onChange={(e) => setConfig(prev => ({ ...prev, defaultDrawTime: e.target.value }))}
            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            disabled={isSaving}
          />
          <p className="text-xs text-gray-400 mt-1">
            Time when draws occur daily (24-hour format, UTC)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="excludeSundays"
            checked={config.excludeSundays}
            onChange={(e) => setConfig(prev => ({ ...prev, excludeSundays: e.target.checked }))}
            className="h-4 w-4 rounded border-gray-600 bg-gray-700/50 text-yellow-400 focus:ring-2 focus:ring-yellow-500"
            disabled={isSaving}
          />
          <label htmlFor="excludeSundays" className="text-sm text-gray-300">
            Skip Sunday draws (48-hour window on Saturday→Tuesday)
          </label>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`p-3 rounded-lg text-sm ${
            message.type === 'success' 
              ? 'bg-green-500/20 border border-green-500 text-green-200' 
              : 'bg-red-500/20 border border-red-500 text-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={saveConfig}
            disabled={isSaving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-black font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
          
          <button
            onClick={createNextDraw}
            disabled={isSaving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Clock className="w-4 h-4" />
            {isSaving ? 'Creating...' : 'Create Next Draw'}
          </button>
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-300 mb-2">Auto-Increment Logic</h4>
        <ul className="text-xs text-blue-200 space-y-1">
          <li>• Monday-Saturday: Draws occur every 24 hours</li>
          <li>• Sunday skip: Saturday draw creates Tuesday draw (48-hour window)</li>
          <li>• Manual changes: Admin can modify time without breaking auto-schedule</li>
          <li>• Redis caching: Ensures performance and real-time updates</li>
        </ul>
      </div>
    </div>
  );
}
