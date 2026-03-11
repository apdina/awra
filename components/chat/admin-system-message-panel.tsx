"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Megaphone, Heart, Shield, Sparkles, Send } from "lucide-react";

interface AdminSystemMessagePanelProps {
  roomId: string;
  userId: string;
  onClose?: () => void;
}

export default function AdminSystemMessagePanel({ roomId, userId, onClose }: AdminSystemMessagePanelProps) {
  const [customMessage, setCustomMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const sendSystemMessage = async (messageType: "manners" | "behavior" | "encouragement" | "custom") => {
    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/chat/system-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          messageType,
          customMessage: messageType === "custom" ? customMessage : undefined,
          userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send system message');
      }

      setSuccess("System message sent successfully!");
      if (messageType === "custom") {
        setCustomMessage("");
      }
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to send system message");
      setTimeout(() => setError(null), 5000);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4 border-t bg-gradient-to-r from-blue-50 to-purple-50">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-sm flex items-center gap-2 text-blue-900">
          <Shield className="w-4 h-4" />
          Admin: Send System Message
        </h4>
        {onClose && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            ×
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-100 border border-red-300 text-red-700 text-xs rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-3 p-2 bg-green-100 border border-green-300 text-green-700 text-xs rounded">
          {success}
        </div>
      )}

      {/* Quick message buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
        <Button
          size="sm"
          variant="outline"
          onClick={() => sendSystemMessage("manners")}
          disabled={sending}
          className="flex items-center gap-2 bg-white hover:bg-blue-50 border-blue-200"
        >
          <Heart className="w-3 h-3 text-pink-500" />
          <span className="text-xs">Good Manners</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => sendSystemMessage("behavior")}
          disabled={sending}
          className="flex items-center gap-2 bg-white hover:bg-purple-50 border-purple-200"
        >
          <Shield className="w-3 h-3 text-purple-500" />
          <span className="text-xs">Behavior Reminder</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => sendSystemMessage("encouragement")}
          disabled={sending}
          className="flex items-center gap-2 bg-white hover:bg-green-50 border-green-200"
        >
          <Sparkles className="w-3 h-3 text-green-500" />
          <span className="text-xs">Encouragement</span>
        </Button>
      </div>

      {/* Custom message */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-700">Custom System Message:</label>
        <div className="flex gap-2">
          <Input
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Type a custom system message..."
            className="flex-1 text-sm"
            maxLength={500}
            disabled={sending}
          />
          <Button
            size="sm"
            onClick={() => sendSystemMessage("custom")}
            disabled={!customMessage.trim() || sending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-500">{customMessage.length}/500 characters</p>
      </div>
    </div>
  );
}
