"use client";

import { useState, useEffect } from 'react';
import { formatTableDate } from '@/lib/date-utils';
import { useRouter } from 'next/navigation';
import { AdminLogin } from '@/app/components/AdminLogin';
import { useAuth } from '@/components/ConvexAuthProvider';
import SimpleUserManagement from '@/components/admin/SimpleUserManagement';
import { triggerCountdownRefresh } from '@/components/SimpleCountdown';

type TabType = 'set-result' | 'set-time' | 'auto-schedule' | 'system-message' | 'user-management';

function UnifiedAdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('set-result');
  const [date, setDate] = useState(""); // Input: 20/01/2025
  const [number, setNumber] = useState(""); // Input: 154
  const [time, setTime] = useState("21:40"); // Input: 21:40
  const [baseTime, setBaseTime] = useState(""); // For auto-schedule
  const [excludeSundays, setExcludeSundays] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [timeLoading, setTimeLoading] = useState(false);
  const [timeMessage, setTimeMessage] = useState("");
  const [systemMessage, setSystemMessage] = useState("");
  const [systemMessageLoading, setSystemMessageLoading] = useState(false);
  const [systemMessageRoom, setSystemMessageRoom] = useState("global");
  const [systemMessageType, setSystemMessageType] = useState<"manners" | "behavior" | "encouragement" | "custom">("manners");
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      // Reload page to show login screen
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Load current draw time on component mount
  useEffect(() => {
    const fetchCurrentDrawTime = async () => {
      try {
        const response = await fetch('/api/current-draw');
        if (response.ok) {
          const draw = await response.json();
          if (draw.draw_time) {
            const timeWithoutSeconds = draw.draw_time.split(':').slice(0, 2).join(':');
            setBaseTime(timeWithoutSeconds);
            setTime(timeWithoutSeconds);
          }
        }
      } catch (error) {
        console.error('Failed to fetch current draw time:', error);
        setBaseTime("21:40");
        setTime("21:40");
      }
    };

    fetchCurrentDrawTime();
  }, []);

  const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET || '';

  // Set Result Handler
  const handleSetResult = async () => {
    if (!date || !number) {
      setMessage("Please fill in both Date and Number.");
      return;
    }

    setLoading(true);
    
    try {
      // Get CSRF token
      const csrfResponse = await fetch('/api/csrf-token', {
        credentials: 'include',
      });
      const csrfData = await csrfResponse.json();
      const csrfToken = csrfData.token;

      const response = await fetch('/api/admin/set-result', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret-Key': ADMIN_SECRET,
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({
          draw_date: date,
          winning_number: parseInt(number)
        })
      });

      const res = await response.json();

      if (response.ok) {
        setMessage("✅ Winning Number Updated!");
        setTimeout(() => {
          setMessage("");
          setDate("");
          setNumber("");
        }, 2000);
      } else {
        setMessage(`❌ Error: ${res.error}`);
      }
    } catch (error) {
      setMessage("❌ Failed to connect to server.");
    }

    setLoading(false);
  };

  // Set Time Handler
  const handleSetTime = async () => {
    if (!date || !time) {
      setTimeMessage("Please fill in both Date and Time.");
      return;
    }

    // Validate time format (HH:MM 24-hour)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      setTimeMessage("Invalid time format. Use HH:MM (24-hour format, e.g., 20:30, 21:15)");
      return;
    }

    setTimeLoading(true);
    
    try {
      // Get CSRF token
      const csrfResponse = await fetch('/api/csrf-token', {
        credentials: 'include',
      });
      const csrfData = await csrfResponse.json();
      const csrfToken = csrfData.token;

      const response = await fetch('/api/admin/set-draw-time', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret-Key': ADMIN_SECRET,
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({
          draw_date: date,
          draw_time: time
        })
      });

      const res = await response.json();

      if (response.ok) {
        setTimeMessage("✅ Draw Time Updated Successfully!");
        
        // Refetch current draw time to update the display (with cache-busting parameter)
        setTimeout(async () => {
          try {
            const refreshResponse = await fetch(`/api/current-draw?t=${Date.now()}`, {
              cache: 'no-store'
            });
            if (refreshResponse.ok) {
              const draw = await refreshResponse.json();
              if (draw.draw_time) {
                const timeWithoutSeconds = draw.draw_time.split(':').slice(0, 2).join(':');
                setBaseTime(timeWithoutSeconds);
                setTime(timeWithoutSeconds);
              }
            }
          } catch (refreshError) {
            console.error('Failed to refresh draw time:', refreshError);
          }
          
          // Trigger countdown refresh across all tabs
          try {
            triggerCountdownRefresh();
          } catch (countdownError) {
            console.error('Failed to refresh countdown:', countdownError);
          }
        }, 500); // 500ms delay to allow cache invalidation
        
        setTimeout(() => {
          setTimeMessage("");
          setDate("");
        }, 3000);
      } else {
        setTimeMessage(`❌ Error: ${res.error}`);
      }
    } catch (error) {
      setTimeMessage("❌ Failed to connect to server.");
    }

    setTimeLoading(false);
  };

  // Set Default Time Handler
  const setDefaultTime = async () => {
    setTimeLoading(true);
    setTimeMessage("");
    
    const today = new Date();
    const todayFormatted = formatTableDate(today);
    
    try {
      // Get CSRF token
      const csrfResponse = await fetch('/api/csrf-token', {
        credentials: 'include',
      });
      const csrfData = await csrfResponse.json();
      const csrfToken = csrfData.token;

      const response = await fetch('/api/admin/set-draw-time', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret-Key': ADMIN_SECRET,
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({
          draw_date: todayFormatted,
          draw_time: "21:40"
        })
      });

      const res = await response.json();

      if (response.ok) {
        setTimeMessage("✅ Default draw time set to 21:40!");
        
        // Refetch current draw time to update the display (with cache-busting parameter)
        setTimeout(async () => {
          try {
            const refreshResponse = await fetch(`/api/current-draw?t=${Date.now()}`, {
              cache: 'no-store'
            });
            if (refreshResponse.ok) {
              const draw = await refreshResponse.json();
              if (draw.draw_time) {
                const timeWithoutSeconds = draw.draw_time.split(':').slice(0, 2).join(':');
                setBaseTime(timeWithoutSeconds);
                setTime(timeWithoutSeconds);
              }
            }
          } catch (refreshError) {
            console.error('Failed to refresh draw time:', refreshError);
          }
          
          // Trigger countdown refresh across all tabs
          try {
            triggerCountdownRefresh();
          } catch (countdownError) {
            console.error('Failed to refresh countdown:', countdownError);
          }
        }, 500); // 500ms delay to allow cache invalidation
        
        setTimeout(() => setTimeMessage(""), 3000);
      } else {
        setTimeMessage(`❌ Error: ${res.error}`);
      }
    } catch (error) {
      setTimeMessage("❌ Failed to connect to server.");
    }

    setTimeLoading(false);
  };

  // Auto Schedule Handler
  const handleAutoSchedule = async () => {
    setLoading(true);
    setMessage("");
    
    try {
      // Get CSRF token
      const csrfResponse = await fetch('/api/csrf-token', {
        credentials: 'include',
      });
      const csrfData = await csrfResponse.json();
      const csrfToken = csrfData.token;

      const response = await fetch('/api/admin/check-and-increment-draw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret-Key': ADMIN_SECRET,
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        setMessage(`✅ ${result.message}`);
        
        // Refresh current draw time with cache-busting
        const refreshResponse = await fetch(`/api/current-draw?t=${Date.now()}`, {
          cache: 'no-store'
        });
        if (refreshResponse.ok) {
          const draw = await refreshResponse.json();
          if (draw.draw_time) {
            const timeWithoutSeconds = draw.draw_time.split(':').slice(0, 2).join(':');
            setBaseTime(timeWithoutSeconds);
            setTime(timeWithoutSeconds);
          }
        }
        
        // Trigger countdown refresh across all tabs
        try {
          await fetch('/api/countdown', { method: 'POST', headers: { 'Cache-Control': 'no-cache' } });
        } catch (countdownError) {
          console.error('Failed to refresh countdown:', countdownError);
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

  const tabs = [
    { id: 'set-result' as TabType, label: '🎯 Set Result', color: 'text-green-400' },
    { id: 'set-time' as TabType, label: '⏰ Set Time', color: 'text-blue-400' },
    { id: 'auto-schedule' as TabType, label: '🚀 Auto Schedule', color: 'text-purple-400' },
    { id: 'system-message' as TabType, label: '📢 System Message', color: 'text-yellow-400' }
  ];

  // System Message Handler
  const handleSystemMessage = async () => {
    if (!systemMessage.trim()) {
      setMessage("Please enter a message");
      return;
    }

    setSystemMessageLoading(true);
    setMessage("");
    
    try {
      // Get CSRF token
      const csrfResponse = await fetch('/api/csrf-token', {
        credentials: 'include',
      });
      const csrfData = await csrfResponse.json();
      const csrfToken = csrfData.token;

      const response = await fetch('/api/chat/system-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({
          roomId: systemMessageRoom,
          messageType: systemMessageType,
          customMessage: systemMessageType === "custom" ? systemMessage : undefined
        })
      });

      const res = await response.json();

      if (response.ok) {
        setMessage("✅ System message sent successfully!");
        setTimeout(() => {
          setMessage("");
          setSystemMessage("");
        }, 2000);
      } else {
        setMessage(`❌ Error: ${res.error}`);
      }
    } catch (error) {
      setMessage("❌ Failed to send system message.");
    }

    setSystemMessageLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-yellow-500">
              Unified Admin Dashboard
            </h1>
            <button 
              onClick={handleLogout}
              className="text-gray-400 hover:text-white transition-colors text-2xl"
              title="Logout"
            >
              🚪
            </button>
          </div>
          <p className="text-gray-400 mt-2">
            Manage draws, results, and scheduling from one place
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-gray-800 p-2 rounded-xl border border-gray-700 mb-6">
          <div className="flex space-x-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 p-3 rounded-lg font-semibold transition-colors ${
                  activeTab === tab.id
                    ? 'bg-gray-700 text-white'
                    : 'hover:bg-gray-700 text-gray-400'
                }`}
              >
                <span className={activeTab === tab.id ? tab.color : ''}>
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-gray-800 p-8 rounded-xl border border-gray-700">
          {/* Set Result Tab */}
          {activeTab === 'set-result' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-green-400">Set Winning Number</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-400 mb-2">Draw Date (DD/MM/YYYY)</label>
                  <input 
                    type="text" 
                    placeholder="e.g., 20/01/2025"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-4 rounded bg-gray-900 border border-gray-600 text-white text-xl"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-2">Winning Number (001-200)</label>
                  <input 
                    type="number" 
                    placeholder="e.g., 154"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    className="w-full p-4 rounded bg-gray-900 border border-gray-600 text-white text-xl"
                  />
                </div>
              </div>

              <button 
                onClick={handleSetResult}
                disabled={loading}
                className={`w-full p-4 rounded font-bold text-xl transition-colors ${
                  loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {loading ? "Updating..." : "SET WINNING NUMBER"}
              </button>
              
              {message && (
                <div className="text-center p-3 rounded bg-gray-900">
                  {message}
                </div>
              )}
            </div>
          )}

          {/* Set Time Tab */}
          {activeTab === 'set-time' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-blue-400">Set Draw Time</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-400 mb-2">Draw Date (DD/MM/YYYY)</label>
                  <input 
                    type="text" 
                    placeholder="e.g., 20/01/2025"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-4 rounded bg-gray-900 border border-gray-600 text-white text-xl"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-2">Draw Time (24H Format)</label>
                  <input 
                    type="text" 
                    pattern="[0-9]{2}:[0-9]{2}"
                    placeholder="e.g., 21:40"
                    value={time}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^[0-9:]*$/.test(value)) {
                        setTime(value);
                      }
                    }}
                    onBlur={(e) => {
                      const value = e.target.value;
                      if (value && /^\d{1,2}$/.test(value)) {
                        setTime(value.padStart(2, '0') + ':00');
                      } else if (value && /^\d{1,2}:\d$/.test(value)) {
                        setTime(value.padStart(5, '0'));
                      }
                    }}
                    className="w-full p-4 rounded bg-gray-900 border border-gray-600 text-white text-xl font-mono"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: HH:MM (24-hour only) • Examples: 20:30, 21:15, 22:45
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <button 
                  onClick={handleSetTime}
                  disabled={timeLoading}
                  className={`p-4 rounded font-bold text-xl transition-colors ${
                    timeLoading ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {timeLoading ? "Updating..." : "SET DRAW TIME"}
                </button>

                <button 
                  onClick={setDefaultTime}
                  disabled={timeLoading}
                  className={`p-4 rounded font-bold text-xl transition-colors ${
                    timeLoading ? 'bg-gray-600 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                >
                  {timeLoading ? "Setting..." : "⏰ Set Default Time (21:40)"}
                </button>
              </div>
              
              {timeMessage && (
                <div className="text-center p-3 rounded bg-gray-900">
                  {timeMessage}
                </div>
              )}

              <div className="p-4 bg-gray-700 rounded text-sm">
                <strong>Valid Times:</strong><br/>
                • 19:00, 19:15, 19:30, 19:45<br/>
                • 20:00, 20:15, 20:30, 20:45<br/>
                • 21:00, 21:15, 21:30, 21:45<br/>
                • 22:00, 22:15, 22:30, 22:45
              </div>
            </div>
          )}

          {/* Auto Schedule Tab */}
          {activeTab === 'auto-schedule' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-purple-400">Auto Schedule Draws</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
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
                    className="w-full p-4 rounded bg-gray-900 border border-gray-600 text-white font-mono"
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
              </div>

              <button 
                onClick={handleAutoSchedule}
                disabled={loading}
                className={`w-full p-4 rounded font-bold text-xl transition-colors ${
                  loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {loading ? 'Creating Next Draw...' : '🚀 Create Next Draw'}
              </button>

              <p className="text-xs text-gray-500 text-center">
                Creates next draw 24 hours from now (skipping Sundays if enabled)
              </p>

              {message && (
                <div className="text-center p-3 rounded bg-gray-900">
                  {message}
                </div>
              )}
            </div>
          )}

          {/* System Message Tab */}
          {activeTab === 'system-message' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-yellow-400">Send System Message</h2>
              
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Message Type
                    </label>
                    <select 
                      value={systemMessageType}
                      onChange={(e) => setSystemMessageType(e.target.value as any)}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                    >
                      <option value="manners">Manners Reminder</option>
                      <option value="behavior">Behavior Warning</option>
                      <option value="encouragement">Encouragement</option>
                      <option value="custom">Custom Message</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Room
                    </label>
                    <select 
                      value={systemMessageRoom}
                      onChange={(e) => setSystemMessageRoom(e.target.value)}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                    >
                      <option value="global">Global Chat</option>
                      <option value="room1">Room 1</option>
                      <option value="room2">Room 2</option>
                    </select>
                  </div>

                  {systemMessageType === 'custom' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Custom Message
                      </label>
                      <textarea 
                        value={systemMessage}
                        onChange={(e) => setSystemMessage(e.target.value)}
                        placeholder="Enter your custom system message..."
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white h-20"
                      />
                    </div>
                  )}

                  <button 
                    onClick={handleSystemMessage}
                    disabled={systemMessageLoading || (systemMessageType === 'custom' && !systemMessage.trim())}
                    className="w-full p-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white font-bold rounded transition-colors"
                  >
                    {systemMessageLoading ? '⏳ Sending...' : '📢 Send System Message'}
                  </button>
                </div>
              </div>

              {systemMessage && (
                <div className="text-center p-3 rounded bg-gray-900">
                  {systemMessage}
                </div>
              )}
            </div>
          )}

          {/* User Management Tab */}
          {activeTab === 'user-management' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-blue-400">User Management</h2>
              <SimpleUserManagement />
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-6 bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-lg font-semibold text-yellow-400 mb-4">Quick Actions</h3>
          <div className="grid md:grid-cols-5 gap-4">
            <button 
              onClick={() => setActiveTab('set-result')}
              className="p-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded transition-colors"
            >
              🎯 Set Winning Number
            </button>
            <button 
              onClick={() => setActiveTab('set-time')}
              className="p-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded transition-colors"
            >
              ⏰ Set Draw Time
            </button>
            <button 
              onClick={() => setActiveTab('auto-schedule')}
              className="p-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded transition-colors"
            >
              🚀 Auto Schedule
            </button>
            <button 
              onClick={() => setActiveTab('system-message')}
              className="p-3 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded transition-colors"
            >
              📢 System Message
            </button>
            <button 
              onClick={() => setActiveTab('user-management')}
              className="p-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded transition-colors"
            >
              👥 User Management
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <AdminLogin>
      <UnifiedAdminDashboard />
    </AdminLogin>
  );
}
