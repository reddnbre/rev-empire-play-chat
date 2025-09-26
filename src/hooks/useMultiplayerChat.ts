import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

interface Message {
  id: string;
  user_id: string;
  username: string;
  content: string;
  created_at: string;
  expires_at: string;
  reactions?: Record<string, string[]>;
  attachment?: {
    type: 'image' | 'gif';
    url: string;
    name: string;
  };
}

interface DbMessage {
  id: string;
  user_id: string;
  username: string;
  content: string;
  created_at: string;
  expires_at: string;
  reactions: Json;
  attachment: Json;
}

interface UseMultiplayerChatProps {
  currentUser: User | null;
  guestName?: string;
  onNotification?: (title: string, options?: NotificationOptions) => void;
}

export const useMultiplayerChat = ({ currentUser, guestName, onNotification }: UseMultiplayerChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const channelRef = useRef<any>(null);

  // Get current user info
  const getCurrentUserId = () => currentUser?.id || 'guest';
  const getCurrentUsername = () => {
    if (currentUser) {
      return currentUser.email?.split('@')[0] || 'User';
    }
    return guestName || 'Guest';
  };

  // Convert database message to app message format
  const convertDbMessage = (dbMessage: DbMessage): Message => ({
    id: dbMessage.id,
    user_id: dbMessage.user_id,
    username: dbMessage.username,
    content: dbMessage.content,
    created_at: dbMessage.created_at,
    expires_at: dbMessage.expires_at,
    reactions: dbMessage.reactions ? (dbMessage.reactions as Record<string, string[]>) : undefined,
    attachment: dbMessage.attachment ? (dbMessage.attachment as Message['attachment']) : undefined,
  });

  // Initialize real-time subscriptions
  useEffect(() => {
    const initializeChat = async () => {
      // Load existing messages
      const { data: existingMessages } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50);

      if (existingMessages) {
        const convertedMessages = existingMessages.map(convertDbMessage);
        setMessages(convertedMessages);
      }

      // Set up real-time subscription for messages
      const messagesChannel = supabase
        .channel('chat_messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages'
          },
          (payload) => {
            const newMessage = convertDbMessage(payload.new as DbMessage);
            setMessages(prev => [...prev, newMessage]);
            
            // Show notification for messages from other users
            const currentUserId = getCurrentUserId();
            const currentUsername = getCurrentUsername();
            
            if (newMessage.user_id !== currentUserId && newMessage.username !== currentUsername) {
              onNotification?.(
                `${newMessage.username} sent a message`,
                {
                  body: newMessage.content.length > 100 
                    ? newMessage.content.substring(0, 100) + '...' 
                    : newMessage.content,
                  tag: 'chat-message'
                }
              );
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'chat_messages'
          },
          (payload) => {
            const updatedMessage = convertDbMessage(payload.new as DbMessage);
            setMessages(prev =>
              prev.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg)
            );
          }
        )
        .subscribe();

      channelRef.current = messagesChannel;

      // Update user presence
      await updateUserPresence();
      
      // Set up presence tracking
      const presenceChannel = supabase
        .channel('user_presence')
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel.presenceState();
          const userCount = Object.keys(state).length;
          setOnlineUsers(userCount);
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log('User joined:', key, newPresences);
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          console.log('User left:', key, leftPresences);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await presenceChannel.track({
              user_id: getCurrentUserId(),
              username: getCurrentUsername(),
              online_at: new Date().toISOString(),
            });
          }
        });

      return () => {
        messagesChannel.unsubscribe();
        presenceChannel.unsubscribe();
      };
    };

    initializeChat();

    // Cleanup function
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [currentUser, guestName]);

  // Update user presence in database
  const updateUserPresence = async () => {
    const userId = getCurrentUserId();
    const username = getCurrentUsername();

    await supabase
      .from('user_presence')
      .upsert({
        user_id: userId,
        username: username,
        last_seen: new Date().toISOString(),
        status: 'online'
      }, {
        onConflict: 'user_id'
      });
  };

  // Send message function
  const sendMessage = async (content: string, attachment?: any) => {
    try {
      const message = {
        user_id: getCurrentUserId(),
        username: getCurrentUsername(),
        content: content.trim(),
        attachment: attachment || null,
        expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() // 8 hours
      };

      const { error } = await supabase
        .from('chat_messages')
        .insert([message]);

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }

      toast({
        title: "Message sent",
        description: "Your message will auto-delete in 8 hours.",
      });
    } catch (error) {
      toast({
        title: "Failed to send message",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  // Add reaction function
  const addReaction = async (messageId: string, emoji: string) => {
    const userId = getCurrentUserId();
    
    // Find the message
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    const reactions = message.reactions || {};
    const currentReactions = reactions[emoji] || [];

    if (currentReactions.includes(userId)) {
      // Remove reaction
      reactions[emoji] = currentReactions.filter(id => id !== userId);
      if (reactions[emoji].length === 0) {
        delete reactions[emoji];
      }
    } else {
      // Add reaction
      reactions[emoji] = [...currentReactions, userId];
    }

    // Update in database
    const { error } = await supabase
      .from('chat_messages')
      .update({ reactions })
      .eq('id', messageId);

    if (error) {
      console.error('Error updating reaction:', error);
      toast({
        title: "Failed to update reaction",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    messages,
    onlineUsers,
    sendMessage,
    addReaction,
    updateUserPresence
  };
};