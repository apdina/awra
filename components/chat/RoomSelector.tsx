"use client";

import { useState } from "react";
import { CHAT_ROOMS, getChatRoom } from "@/convex/chat_rooms_config";
import { Users } from "lucide-react";

interface RoomSelectorProps {
  currentRoomId: string;
  onSelectRoom: (roomId: string) => void;
  onlineUsersCount: number;
}

export default function RoomSelector({ 
  currentRoomId, 
  onSelectRoom,
  onlineUsersCount 
}: RoomSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentRoom = getChatRoom(currentRoomId);

  return (
    <div className="relative">
      {/* Desktop Button - Styled as header title */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 hover:bg-slate-700/30 rounded-lg transition-all duration-200"
      >
        <h3 className="font-semibold text-white text-base">{currentRoom?.name || "Select Room"}</h3>
        <svg 
          className={`w-4 h-4 text-white transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M19 9l-7 7-7-7" 
          />
        </svg>
      </button>

      {/* Mobile Button - Styled as header title */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden flex items-center gap-1.5 px-2 py-1 hover:bg-slate-700/30 rounded-md transition-all duration-200"
      >
        <h3 className="font-semibold text-white text-sm">{currentRoom?.name || "Room"}</h3>
        <svg 
          className={`w-3.5 h-3.5 text-white transition-transform duration-200 flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M19 9l-7 7-7-7" 
          />
        </svg>
      </button>

      {/* Dropdown - Fixed positioning to not affect header */}
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div 
            className="fixed inset-0 z-40 md:hidden" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown menu */}
          <div className="absolute top-full left-0 mt-2 w-72 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 z-50 max-h-96 overflow-y-auto">
            <div className="p-2">
              <div className="flex items-center justify-between px-3 py-2 mb-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Chat Rooms</p>
                <span className="text-xs text-blue-400">{onlineUsersCount} online</span>
              </div>
              {CHAT_ROOMS.map((room) => (
                <button
                  key={room.id}
                  onClick={() => {
                    onSelectRoom(room.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors duration-150 ${
                    currentRoomId === room.id
                      ? "bg-blue-600 text-white"
                      : "hover:bg-slate-700 text-slate-300"
                  }`}
                >
                  <div className="font-medium text-sm">{room.name}</div>
                  <div className="text-xs opacity-70 truncate mt-0.5">{room.description}</div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
