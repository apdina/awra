"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLogin } from '@/app/components/AdminLogin';
import { useAuth } from '@/components/ConvexAuthProvider';

function SetDrawTimeContent() {
  const [date, setDate] = useState(""); // Input: 20/01/2025
  const [time, setTime] = useState("21:40"); // Input: 21:40 (default draw time with minutes)
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const { logout } = useAuth();

  const handleSubmit = async () => {
    if (!date || !time) {
      setMessage("Please fill in both Date and Time.");
      return;
    }

    // Validate time format (HH:MM 24-hour)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      setMessage("Invalid time format. Use HH:MM (24-hour format, e.g., 20:30, 21:15)");
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

      const response = await fetch('/api/admin/set-draw-time', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        setMessage("✅ Draw Time Updated Successfully!");
        setTimeout(() => router.push('/admin'), 2000); // Go back to admin dashboard
      } else {
        setMessage(`❌ Error: ${res.error}`);
      }
    } catch (error) {
      setMessage("❌ Failed to connect to server.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
      <div className="bg-gray-800 p-8 rounded-xl max-w-md w-full border border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-yellow-500">
            Set Draw Time
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
          Configure the draw time for a specific date (24H format)
        </p>

        <div className="space-y-4">
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
                // Only allow numbers and colon, format as HH:MM
                if (value === '' || /^[0-9:]*$/.test(value)) {
                  setTime(value);
                }
              }}
              onBlur={(e) => {
                const value = e.target.value;
                // Auto-format to HH:MM if valid
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
            <div className="mt-2 p-2 bg-gray-700 rounded text-xs text-gray-300">
              <strong>Valid Times:</strong><br/>
              • 19:00, 19:15, 19:30, 19:45<br/>
              • 20:00, 20:15, 20:30, 20:45<br/>
              • 21:00, 21:15, 21:30, 21:45<br/>
              • 22:00, 22:15, 22:30, 22:45
            </div>
          </div>

          <button 
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full p-4 rounded font-bold text-xl transition-colors ${
              loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? "Updating..." : "SET DRAW TIME"}
          </button>
          
          {message && (
            <div className="text-center mt-4 p-3 rounded bg-gray-900">
              {message}
            </div>
          )}

          <div className="mt-4 text-center">
            <button 
              onClick={() => router.push('/admin')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← Back to Admin Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SetDrawTime() {
  return (
    <AdminLogin>
      <SetDrawTimeContent />
    </AdminLogin>
  );
}
