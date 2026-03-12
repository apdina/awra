"use client";

import * as React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/components/ConvexAuthProvider";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { logger } from '@/lib/logger';
import { Send, Edit2, Trash2, Users, Megaphone, Heart, Shield } from "lucide-react";
import { getUserAvatarUrl, getInitials } from "@/lib/avatarUtils";
import { Id } from "@/convex/_generated/dataModel";

// Types from Convex schema
interface ChatMessage {
  _id: Id<"chatMessages">;
  _creationTime: number;
  userId?: Id<"userProfiles">;
  roomId: string;
  content: string;
  messageType: "text" | "system" | "winner";
  isDeleted: boolean;
  isEdited: boolean;
  editedAt?: number;
  reportCount?: number;
  reportedBy?: Id<"userProfiles">[];
  lastReportedAt?: number;
  lastReportReason?: string;
  deletedReason?: string;
  createdAt: number;
  user?: {
    id?: Id<"userProfiles"> | string;
    displayName: string;
    avatarUrl?: string;
    avatarName?: string;
    avatarType?: 'basic' | 'special';
    isAdmin?: boolean;
    isModerator?: boolean;
  };
}

interface SimpleUser {
  id: string;
  displayName: string;
  avatarUrl?: string;
  avatarName?: string;
  avatarType?: 'basic' | 'special';
  isTyping: boolean;
  status: string;
}

interface ChatContainerProps {
  roomId: string;
  className?: string;
}

export default function ChatContainerSimple({ roomId, className }: ChatContainerProps) {
  const [message, setMessage] = useState("");
  const [editingMessage, setEditingMessage] = useState<Id<"chatMessages"> | null>(null);
  const [editContent, setEditContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showSystemMessagePanel, setShowSystemMessagePanel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>(undefined);

  // Auth context
  const { user: authUser, isAuthenticated } = useAuth();
  const currentUser = authUser;

  // Convex queries and mutations
  const messagesData = useQuery(api.chat.getMessages, { 
    roomId, 
    limit: 30,
    cursor: undefined
  });
  const onlineUsersData = useQuery(api.chat.getOnlineUsers, { roomId });

  const sendMessageMutation = useMutation(api.chat.sendMessage);
  const deleteMessageMutation = useMutation(api.chat.deleteMessage);
  const editMessageMutation = useMutation(api.chat.editMessage);
  const setTypingStatus = useMutation(api.chat.setTypingStatus);


  // Mock functions - replace with actual Convex mutations later
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !isAuthenticated || !authUser?._id) return;

    try {
      setError(null);
      await sendMessageMutation({
        userId: authUser._id,
        roomId,
        content: message.trim(),
        messageType: "text",
      });
      setMessage("");
      await setTypingStatus({ isTyping: false, roomId, userId: authUser._id });
    } catch (error: any) {
      logger.error("Failed to send message:", error);
      setError(error.message || "Failed to send message");
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleDeleteMessage = async (messageId: Id<"chatMessages">, isOwnMessage: boolean = false) => {
    if (!isAuthenticated || !authUser?._id) return;

    // Show confirmation for moderators/admins deleting other users' messages
    if (!isOwnMessage && (currentUser?.isAdmin === true || currentUser?.isModerator === true)) {
      const role = currentUser?.isAdmin ? 'Admin' : 'Moderator';
      const confirmed = window.confirm(
        `Are you sure you want to delete this message as ${role}?\n\nThis action cannot be undone.`
      );
      if (!confirmed) return;
    }

    try {
      setError(null);
      await deleteMessageMutation({ messageId, userId: authUser._id });
      setSuccessMessage("Message deleted");
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch (error: any) {
      logger.error("Failed to delete message:", error);
      setError(error.message || "Failed to delete message");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleEditMessage = async (messageId: Id<"chatMessages">) => {
    if (!editContent.trim() || !isAuthenticated || !authUser?._id) return;

    try {
      setError(null);
      await editMessageMutation({ messageId, newContent: editContent, userId: authUser._id });
      setEditingMessage(null);
      setEditContent("");
      setSuccessMessage("Message updated");
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch (error: any) {
      logger.error("Failed to edit message:", error);
      setError(error.message || "Failed to edit message");
      setTimeout(() => setError(null), 3000);
    }
  };



  const handleSendSystemMessage = async (type: "manners" | "behavior" | "encouragement") => {
    const systemMessages = {
      manners: [
        "Remember to be respectful and kind to everyone in the chat! 🌟",
        "Good manners make the chat better for everyone. Please be polite! 😊",
        "Treat others as you'd like to be treated. Kindness goes a long way! 💙",
      ],
      behavior: [
        "No spamming or flooding the chat. Let everyone have a chance to speak! 🗣️",
        "Keep conversations appropriate and family-friendly. Thank you! 👨‍👩‍👧‍👦",
        "Avoid sharing personal information. Stay safe online! 🔒",
      ],
      encouragement: [
        "Great conversations happen when everyone participates! Join in! 💬",
        "Share your positive energy with the community! ✨",
        "Every friendly message helps build our community! 🏗️",
      ],
    };

    const messages = systemMessages[type];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    // This would need admin functionality - for now just log
    logger.log("System message:", randomMessage);
  };

  // Handle typing indicator with debouncing
  const handleTypingStart = useCallback(() => {
    if (!authUser?._id || message.trim().length === 0) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    setTypingStatus({ isTyping: true, roomId, userId: authUser._id });

    typingTimeoutRef.current = setTimeout(() => {
      setTypingStatus({ isTyping: false, roomId, userId: authUser._id });
    }, 5000);
  }, [roomId, setTypingStatus, authUser?._id, message]);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messagesData, scrollToBottom]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isOwnMessage = (msg: ChatMessage) => {
    if (!authUser) return false;
    return msg.userId === authUser._id;
  };

  return (
    <div className={`flex flex-col h-full bg-white border rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Chat Room</h3>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="w-4 h-4" />
          {onlineUsersData?.length || 0} online
        </div>
      </div>

      {/* Error/Success messages */}
      {error && (
        <div className="p-3 bg-red-50 border-b border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
      {successMessage && (
        <div className="p-3 bg-green-50 border-b border-green-200 text-green-700 text-sm flex items-center gap-2">
          <Shield className="w-4 h-4 flex-shrink-0" />
          {successMessage}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        {!messagesData ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {messagesData.messages.map((msg) => (
              <div
                key={msg._id}
                className={`flex gap-3 ${
                  msg.messageType === "system"
                    ? "justify-center"
                    : isOwnMessage(msg)
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                {/* System Messages - Centered */}
                {(msg.messageType === "system") ? (
                  <div className="max-w-[80%]">
                    <div
                      className={`rounded-lg p-3 ${
                        msg.messageType === "system"
                          ? "bg-gradient-to-r from-blue-100 to-purple-100 border-2 border-blue-300"
                          : "bg-gradient-to-r from-red-100 to-orange-100 border-2 border-red-300"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Megaphone className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-bold text-blue-800">
                          System Message
                        </span>
                        <span className="text-xs ml-auto text-blue-600">
                          {formatTime(msg.createdAt)}
                        </span>
                        }`}>
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                      <p className={`text-sm ${
                        msg.messageType === "system" ? "text-blue-900" : "text-red-900"
                      }`}>
                        {msg.content}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Regular Messages */}
                    {!isOwnMessage(msg) && msg.user && (
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage src={getUserAvatarUrl(msg.user)} alt={msg.user.displayName} />
                        <AvatarFallback className="w-8 h-8 bg-blue-100 text-blue-600 text-sm flex items-center justify-center rounded-full">
                          {getInitials(msg.user.displayName)}
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div className={`max-w-[70%] ${isOwnMessage(msg) ? "order-first" : ""}`}>
                      {!isOwnMessage(msg) && msg.user && (
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-xs font-semibold text-gray-700">{msg.user.displayName}</span>
                          {msg.user.isAdmin && (
                            <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-semibold">
                              Admin
                            </span>
                          )}
                          {!msg.user.isAdmin && msg.user.isModerator && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-semibold">
                              Mod
                            </span>
                          )}
                        </div>
                      )}

                      {editingMessage === msg._id ? (
                        <div className="bg-white border-2 border-blue-300 rounded-lg p-2 shadow-sm">
                          <Input
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="mb-2 text-sm"
                            placeholder="Edit message..."
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleEditMessage(msg._id)}
                              className="bg-blue-600 hover:bg-blue-700 h-7 text-xs"
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingMessage(null);
                                setEditContent("");
                              }}
                              className="h-7 text-xs"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`rounded-lg p-3 ${
                            (msg.messageType as string) === "system"
                              ? "bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 text-blue-800"
                              : isOwnMessage(msg)
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          <p className="text-sm break-words">{msg.content}</p>
                          {msg.isEdited && (msg.messageType as string) !== "system" && (
                            <span className="text-xs opacity-70">(edited)</span>
                          )}
                          <div
                            className={`text-xs mt-1 ${
                              (msg.messageType as string) === "system"
                                ? "text-blue-600"
                                : isOwnMessage(msg)
                                ? "text-blue-100"
                                : "text-gray-500"
                            }`}
                          >
                            {formatTime(msg.createdAt)}
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      {!isOwnMessage(msg) && isAuthenticated && (
                        <div className="flex gap-1 mt-0.5">
                          {(currentUser?.isAdmin === true || currentUser?.isModerator === true) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteMessage(msg._id, false)}
                              className="h-5 px-1.5 text-[10px] text-red-600 hover:text-red-700 hover:bg-red-50"
                              title={`Delete message (${currentUser?.isAdmin ? 'Admin' : 'Moderator'})`}
                            >
                              <Trash2 className="w-3 h-3 mr-0.5" />
                              Delete
                            </Button>
                          )}
                        </div>
                      )}

                      {isOwnMessage(msg) && (
                        <div className="flex gap-1 mt-0.5 justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingMessage(msg._id);
                              setEditContent(msg.content);
                            }}
                            className="h-5 px-1.5 text-[10px] hover:bg-blue-50"
                            title="Edit message"
                          >
                            <Edit2 className="w-3 h-3 mr-0.5" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteMessage(msg._id, true)}
                            className="h-5 px-1.5 text-[10px] text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Delete message"
                          >
                            <Trash2 className="w-3 h-3 mr-0.5" />
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Typing indicator */}
      {onlineUsersData?.some((user) => user.isTyping && user.userId !== authUser?._id) && (
        <div className="px-4 py-2 text-sm text-gray-600 bg-gray-50 border-t">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span>typing...</span>
          </div>
        </div>
      )}

      {/* Message input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              handleTypingStart();
            }}
            placeholder={isAuthenticated ? "Type a message..." : "Please log in to chat"}
            className="flex-1"
            disabled={!isAuthenticated}
          />
          <Button
            type="submit"
            disabled={!message.trim() || !isAuthenticated}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
