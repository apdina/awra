"use client";

import * as React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface ChatContextType {
  isConnected: boolean;
  currentUserId?: Id<"userProfiles">;
  error?: string;
}

const ChatContext = createContext<ChatContextType>({
  isConnected: false,
});

export function useChat() {
  return useContext(ChatContext);
}

interface ChatProviderProps {
  children: React.ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Note: ChatProvider no longer uses Convex auth queries
  // The auth is handled via the useAuth() hook in chat components
  // This provider just manages chat connection state

  useEffect(() => {
    // Chat connection is established when the component mounts
    setIsConnected(true);
    setError(undefined);
  }, []);

  const contextValue: ChatContextType = {
    isConnected,
    error,
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
}
