"use client";

import * as React from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { MessageCircle, Users, Trophy } from "lucide-react";

interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  type: "global" | "draw" | "private";
  userCount?: number;
  isActive?: boolean;
}

interface ChatListProps {
  rooms: ChatRoom[];
  activeRoomId?: string;
  onRoomSelect: (roomId: string) => void;
  className?: string;
}

export default function ChatList({ 
  rooms, 
  activeRoomId, 
  onRoomSelect, 
  className 
}: ChatListProps) {
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
        return "bg-blue-50 border-blue-200 hover:bg-blue-100";
      case "draw":
        return "bg-green-50 border-green-200 hover:bg-green-100";
      case "private":
        return "bg-purple-50 border-purple-200 hover:bg-purple-100";
      default:
        return "bg-gray-50 border-gray-200 hover:bg-gray-100";
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <h3 className="font-semibold text-lg mb-3">Chat Rooms</h3>
      
      {rooms.map((room) => (
        <Card
          key={room.id}
          className={`p-3 cursor-pointer transition-colors ${
            activeRoomId === room.id
              ? "ring-2 ring-blue-500 bg-blue-50"
              : getRoomColor(room.type)
          } ${!room.isActive ? "opacity-60" : ""}`}
          onClick={() => room.isActive && onRoomSelect(room.id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-1 rounded ${
                room.type === "global" ? "bg-blue-100 text-blue-600" :
                room.type === "draw" ? "bg-green-100 text-green-600" :
                "bg-purple-100 text-purple-600"
              }`}>
                {getRoomIcon(room.type)}
              </div>
              
              <div>
                <div className="font-medium text-sm">{room.name}</div>
                {room.description && (
                  <div className="text-xs text-gray-600">{room.description}</div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {room.userCount !== undefined && (
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Users className="w-3 h-3" />
                  {room.userCount}
                </div>
              )}
              
              {activeRoomId === room.id && (
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              )}
            </div>
          </div>
        </Card>
      ))}
      
      {rooms.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No active chat rooms</p>
        </div>
      )}
    </div>
  );
}
