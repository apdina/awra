"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLogin } from '@/app/components/AdminLogin';
import { useAuth } from '@/components/ConvexAuthProvider';

function AutoScheduleContent() {
  const [baseTime, setBaseTime] = useState(""); // Will be loaded from database
  const [excludeSundays, setExcludeSundays] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const { logout } = useAuth();

  // Load current draw time on component mount
  useEffect(() => {
    const fetchCurrentDrawTime = async () => {
      try {
        const response = await fetch('/api/current-draw');
        if (response.ok) {
          const draw = await response.json();
          if (draw.draw_time) {
            // Remove seconds if present (e.g., "21:40:00" -> "21:40")
            const timeWithoutSeconds = draw.draw_time.split(':').slice(0, 2).join(':');
            setBaseTime(timeWithoutSeconds);
          }
        }
      } catch (error) {
        console.error('Failed to fetch current draw time:', error);
        setBaseTime("21:40"); // Fallback
      }
    };

    fetchCurrentDrawTime();
  }, []);

  const handleAutoSchedule = async () => {
    setLoading(true);
    setMessage("");
    
    try {
      console.log('🔧 AutoSchedule: Attempting draw increment API call');
      const API_URL = `/api/admin/check-and-increment-draw`;
      const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET || '';

      if (!ADMIN_SECRET) {
        setMessage("❌ Admin secret not configured");
        setLoading(false);
        return;
      }

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret-Key': ADMIN_SECRET
        }
      });

      if (response.ok) {
        const result = await response.json();
        setMessage(`✅ ${result.message}`);
        
        // Refresh current draw time
        const refreshResponse = await fetch('/api/current-draw');
        if (refreshResponse.ok) {
          const draw = await refreshResponse.json();
          if (draw.draw_time) {
            const timeWithoutSeconds = draw.draw_time.split(':').slice(0, 2).join(':');
            setBaseTime(timeWithoutSeconds);
          }
        }
      } else {
        const error = await response.json();
        setMessage(`❌ ${error.error}`);
      }
    } catch (error) {
      console.error('Auto schedule error:', error);
      setMessage("❌ Failed to create next draw");
    } finally {
      setLoading(false);
    }
  };

  
  return (
    <AdminLogin>
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
        <div className="bg-gray-800 p-8 rounded-xl max-w-4xl w-full border border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-yellow-500">
              Auto Schedule Draws
            </h1>
            <button 
              onClick={logout}
              className="text-gray-400 hover:text-white transition-colors"
              title="Logout"
            >
              🚪
            </button>
          </div>
          <p className="text-gray-400 text-center mb-6">
            Automatically schedule draws with Sunday exclusion and 24-hour increments
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Configuration */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-blue-400 mb-4">Configuration</h2>
              
              <div>
                <label className="block text-gray-400 mb-2">Current Time</label>
                <input 
                  type="text" 
                  value={baseTime}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^[0-9:]*$/.test(value)) {
                      setBaseTime(value);
                    }
                  }}
                  onBlur={(e) => {
                    const value = e.target.value;
                    if (value && /^\d{1,2}$/.test(value)) {
                      setBaseTime(value.padStart(2, '0') + ':00');
                    } else if (value && /^\d{1,2}:\d$/.test(value)) {
                      setBaseTime(value.padStart(5, '0'));
                    }
                  }}
                  className="w-full p-3 rounded bg-gray-900 border border-gray-600 text-white font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Current draw time (will be used for next draw)
                </p>
              </div>

              <div>
                <label className="flex items-center space-x-3">
                  <input 
                    type="checkbox" 
                    checked={excludeSundays}
                    onChange={(e) => setExcludeSundays(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-300">Exclude Sundays</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-7">
                  Automatically skip Sundays when creating next draw
                </p>
              </div>

              <div className="space-y-2">
                <button 
                  onClick={handleAutoSchedule}
                  disabled={loading}
                  className={`w-full p-3 rounded font-bold transition-colors ${
                    loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {loading ? 'Creating Next Draw...' : '🚀 Create Next Draw'}
                </button>
                <p className="text-xs text-gray-500 text-center">
                  Creates next draw 24 hours from now (skipping Sundays if enabled)
                </p>
              </div>

              {message && (
                <div className="text-center p-3 rounded bg-gray-900">
                  {message}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-700">
            <div className="text-center space-y-2">
              <button 
                onClick={() => router.push('/admin')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ← Back to Admin Dashboard
              </button>
              <div className="flex justify-center space-x-4 text-sm">
                <button 
                  onClick={() => router.push('/admin/set-draw-time')}
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Manual Time Settings
                </button>
                <button 
                  onClick={() => router.push('/admin')}
                  className="text-green-400 hover:text-green-300 transition-colors"
                >
                  Set Winning Numbers
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLogin>
  );
}

export default function AutoSchedule() {
  return (
    <AdminLogin>
      <AutoScheduleContent />
    </AdminLogin>
  );
}
