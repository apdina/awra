"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { MessageCircle, Users, Trophy, X, Megaphone, Settings } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useChat } from "./chat-provider";

interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  type: "global" | "draw" | "private";
  userCount?: number;
  isActive?: boolean;
}

interface ChatSidebarProps {
  selectedRoomId: string;
  onRoomSelect: (roomId: string) => void;
  onToggleSystemMessagePanel: () => void;
  showSystemMessagePanel: boolean;
  className?: string;
}

export default function ChatSidebar({ 
  selectedRoomId, 
  onRoomSelect,
  onToggleSystemMessagePanel,
  showSystemMessagePanel,
  className 
}: ChatSidebarProps) {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRoomSelector, setShowRoomSelector] = useState(false);

  const { isConnected } = useChat();
  const activeRooms = useQuery(api.chatRooms.getActiveRooms);
  // Only query online users if we have a selected room
  const onlineUsers = selectedRoomId ? useQuery(api.chat.getOnlineUsers, { roomId: selectedRoomId }) : null;

  useEffect(() => {
    if (activeRooms !== undefined) {
      // Map Convex data (_id) to ChatRoom interface (id)
      const mappedRooms = activeRooms.map(room => ({
        id: room._id,
        name: room.name,
        description: room.description,
        type: room.type,
        userCount: room.userCount,
        isActive: room.isActive
      }));
      setRooms(mappedRooms);
      setIsLoading(false);
    }
  }, [activeRooms]);

  const getRoomIcon = (type: ChatRoom["type"]) => {
    switch (type) {
      case "global":
        return <MessageCircle className="w-4 h-4" />;
      case "draw":
        return <Trophy className="w-4 h-4" />;
      case "private":
        return <Users className="w-4 h-4" />;
      default:
        return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getRoomColor = (type: ChatRoom["type"]) => {
    switch (type) {
      case "global":
        return "bg-blue-900/30 border-blue-700 hover:bg-blue-900/50 hover:border-blue-600";
      case "draw":
        return "bg-green-900/30 border-green-700 hover:bg-green-900/50 hover:border-green-600";
      case "private":
        return "bg-purple-900/30 border-purple-700 hover:bg-purple-900/50 hover:border-purple-600";
      default:
        return "bg-gray-800/50 border-gray-700 hover:bg-gray-800/70";
    }
  };

  const totalOnlineUsers = onlineUsers?.length || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}></div>
          <h3 className="font-semibold text-lg text-white">Chat</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={onToggleSystemMessagePanel}
            className={`h-8 w-8 p-0 ${showSystemMessagePanel ? "bg-blue-600 text-white" : "text-white hover:bg-white/10"}`}
            title="System Messages"
          >
            <Megaphone className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowRoomSelector(!showRoomSelector)}
            className="h-8 w-8 p-0 text-white hover:bg-white/10"
            title="Change Room"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Room Selector Dropdown */}
      {showRoomSelector && (
        <div className="mb-4">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowRoomSelector(false)} />
          <div className="relative bg-white rounded-lg shadow-lg p-4 z-10">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Select Room</h4>
                <Button size="sm" variant="ghost" onClick={() => setShowRoomSelector(false)} className="h-6 w-6 p-0">
                  <X className="w-3 h-3" />
                </Button>
              </div>
              
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {rooms.length > 0 ? (
                  rooms.map((room) => (
                    <Card
                      key={room.id}
                      className={`p-2 cursor-pointer transition-colors ${
                        selectedRoomId === room.id
                          ? "ring-2 ring-blue-500 bg-blue-900/50"
                          : `${getRoomColor(room.type)} ${!room.isActive ? "opacity-50" : ""}`
                      }`}
                      onClick={() => {
                        if (room.isActive) {
                          onRoomSelect(room.id);
                          setShowRoomSelector(false);
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded ${
                          room.type === "global" ? "bg-blue-600 text-white" :
                          room.type === "draw" ? "bg-green-600 text-white" :
                          "bg-purple-600 text-white"
                        }`}>
                          {getRoomIcon(room.type)}
                        </div>
                        <div>
                          <div className="font-medium text-xs">{room.name}</div>
                          {room.description && (
                            <div className="text-[10px] text-slate-400">{room.description}</div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-4 text-slate-400 text-sm">
                    No active rooms
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Online Users */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2 text-sm text-slate-300">
          <Users className="w-4 h-4" />
          <span>Online: {totalOnlineUsers}</span>
        </div>
        <div className="space-y-2">
          {onlineUsers && onlineUsers.length > 0 ? (
            onlineUsers.map((user) => (
              <div key={user.userId} className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-slate-200 truncate">
                  {user.profile?.displayName || "Unknown User"}
                </span>
                {user.isTyping && (
                  <span className="text-xs text-blue-400 italic">typing...</span>
                )}
              </div>
            ))
          ) : (
            <div className="text-sm text-slate-400 italic">No users online</div>
          )}
        </div>
      </div>

      {/* Room List */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-2">
        <h4 className="font-semibold text-sm text-slate-300 mb-2">Rooms</h4>
        {rooms.length > 0 ? (
          rooms.map((room) => (
            <Card
              key={room.id}
              className={`p-2 cursor-pointer transition-all duration-200 ${
                selectedRoomId === room.id
                  ? "ring-2 ring-blue-500 bg-blue-900/50 shadow-sm"
                  : `${getRoomColor(room.type)} ${!room.isActive ? "opacity-50" : ""}`
              }`}
              onClick={() => room.isActive && onRoomSelect(room.id)}
            >
              <div className="flex items-center gap-2">
                <div className={`p-1 rounded ${
                  room.type === "global" ? "bg-blue-600 text-white" :
                  room.type === "draw" ? "bg-green-600 text-white" :
                  "bg-purple-600 text-white"
                }`}>
                  {getRoomIcon(room.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-xs truncate">{room.name}</div>
                  {room.description && (
                    <div className="text-[10px] text-slate-400 truncate">{room.description}</div>
                  )}
                </div>
                {room.userCount !== undefined && (
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Users className="w-3 h-3" />
                    <span>{room.userCount}</span>
                  </div>
                )}
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500 text-sm">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 text-slate-500" />
            No active rooms
          </div>
        )}
      </div>
    </div>
  );
}
