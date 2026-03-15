"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { MessageCircle, Users, Trophy, X } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  type: "global" | "draw" | "private";
  userCount?: number;
  isActive?: boolean;
}

interface ChatRoomSelectorProps {
  selectedRoomId: string;
  onRoomSelect: (roomId: string) => void;
  onClose?: () => void;
}

export default function ChatRoomSelector({ 
  selectedRoomId, 
  onRoomSelect,
  onClose 
}: ChatRoomSelectorProps) {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const roomData = useQuery(api.chatRooms.getRoomByStringId, { roomId: 'global' });

  useEffect(() => {
    if (roomData) {
      setRooms([
        {
          id: roomData._id,
          name: roomData.name,
          description: roomData.description,
          type: roomData.type,
          isActive: roomData.isActive,
        },
      ]);
      setIsLoading(false);
    }
  }, [roomData]);

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
        return "bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300";
      case "draw":
        return "bg-green-50 border-green-200 hover:bg-green-100 hover:border-green-300";
      case "private":
        return "bg-purple-50 border-purple-200 hover:bg-purple-100 hover:border-purple-300";
      default:
        return "bg-gray-50 border-gray-200 hover:bg-gray-100";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Chat Rooms</h3>
        {onClose && (
          <Button size="sm" variant="ghost" onClick={onClose} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
        {rooms.length > 0 ? (
          rooms.map((room) => (
            <Card
              key={room.id}
              className={`p-3 cursor-pointer transition-all duration-200 ${
                selectedRoomId === room.id
                  ? "ring-2 ring-blue-500 bg-blue-50 shadow-md"
                  : `${getRoomColor(room.type)} ${!room.isActive ? "opacity-50" : ""}`
              }`}
              onClick={() => room.isActive && onRoomSelect(room.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    room.type === "global" ? "bg-blue-100 text-blue-600" :
                    room.type === "draw" ? "bg-green-100 text-green-600" :
                    "bg-purple-100 text-purple-600"
                  }`}>
                    {getRoomIcon(room.type)}
                  </div>
                  
                  <div>
                    <div className="font-medium text-sm">{room.name}</div>
                    {room.description && (
                      <div className="text-xs text-gray-600 line-clamp-1">{room.description}</div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {room.userCount !== undefined && (
                    <div className="flex items-center gap-1 text-xs font-medium">
                      <Users className="w-3 h-3" />
                      <span className={room.userCount > 0 ? "text-green-600" : "text-gray-500"}>
                        {room.userCount}
                      </span>
                    </div>
                  )}
                  
                  {room.isActive === false && (
                    <span className="text-xs text-gray-400">Closed</span>
                  )}
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No active chat rooms</p>
          </div>
        )}
      </div>
    </div>
  );
}
