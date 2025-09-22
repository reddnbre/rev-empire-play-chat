import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Send, Users, Clock, Smile, Mic, MicOff, Paperclip, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Message {
  id: string;
  user_id: string;
  username: string;
  content: string;
  created_at: string;
  expires_at: string;
  reactions?: Record<string, string[]>; // emoji -> user_ids
  attachment?: {
    type: 'image' | 'gif';
    url: string;
    name: string;
  };
}

interface ChatInterfaceProps {
  currentUser: any;
  guestName?: string;
  onRequestName?: () => void;
}

const ChatInterface = ({ currentUser, guestName, onRequestName }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<number>(0);
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [someoneTyping, setSomeoneTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Simulate real-time messages and typing indicators
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.1) {
        // Show typing indicator first
        setSomeoneTyping(true);
        
        setTimeout(() => {
          setSomeoneTyping(false);
          const responses = [
            "Hey everyone! 👋",
            "Anyone want to play a game?",
            "Good luck in your matches!",
            "This chat is awesome! 🎮",
            "Just finished an epic game!",
            "Looking for teammates 🎯"
          ];
          const message: Message = {
            id: Math.random().toString(),
            user_id: `player_${Math.floor(Math.random() * 1000)}`,
            username: `Player${Math.floor(Math.random() * 1000)}`,
            content: responses[Math.floor(Math.random() * responses.length)],
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
          };
          
          setMessages(prev => [...prev, message]);
        }, 1500 + Math.random() * 2000);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // If guest user hasn't provided a name yet, request it
    if (!currentUser && !guestName && onRequestName) {
      onRequestName();
      return;
    }

    try {
      // For demo purposes, we'll simulate real-time chat with local state
      // In production, you'd insert into a messages table and use Supabase realtime
      const message: Message = {
        id: Math.random().toString(),
        user_id: currentUser?.id || 'guest',
        username: currentUser ? (currentUser.email?.split('@')[0] || 'User') : guestName || 'Guest',
        content: newMessage.trim(),
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() // 8 hours
      };

      setMessages(prev => [...prev, message]);
      setNewMessage("");

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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
  };

  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setIsRecording(true);
        toast({
          title: "Recording started",
          description: "Speak your message...",
        });
        // In a real app, start recording audio here
      } catch (error) {
        toast({
          title: "Microphone access denied",
          description: "Please allow microphone access to use voice messages",
          variant: "destructive"
        });
      }
    } else {
      setIsRecording(false);
      toast({
        title: "Recording stopped",
        description: "Voice message feature coming soon!",
      });
    }
  };

  const addReaction = (messageId: string, emoji: string) => {
    const userId = currentUser?.id || 'guest';
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const reactions = msg.reactions || {};
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
        
        return { ...msg, reactions: { ...reactions } };
      }
      return msg;
    }));
    setShowEmojiPicker(null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type (images and GIFs only)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only images and GIFs are allowed",
        variant: "destructive"
      });
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 5MB",
        variant: "destructive"
      });
      return;
    }

    // Create message with attachment
    const reader = new FileReader();
    reader.onload = (e) => {
      const message: Message = {
        id: Math.random().toString(),
        user_id: currentUser?.id || 'guest',
        username: currentUser ? (currentUser.email?.split('@')[0] || 'User') : guestName || 'Guest',
        content: `Shared ${file.type.includes('gif') ? 'a GIF' : 'an image'}`,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
        attachment: {
          type: file.type.includes('gif') ? 'gif' : 'image',
          url: e.target?.result as string,
          name: file.name
        }
      };

      setMessages(prev => [...prev, message]);
      toast({
        title: "File shared",
        description: "Your file has been shared in the chat",
      });
    };
    reader.readAsDataURL(file);
    
    setShowFileUpload(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const popularEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥'];

  return (
    <Card className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Global Chat</h3>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {onlineUsers || 1}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              8h auto-delete
            </Badge>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {getInitials(message.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{message.username}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(message.created_at)}
                    </span>
                  </div>
                  <div className="text-sm bg-muted rounded-lg px-3 py-2">
                    {message.content}
                    {message.attachment && (
                      <div className="mt-2">
                        <img 
                          src={message.attachment.url} 
                          alt={message.attachment.name}
                          className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(message.attachment?.url, '_blank')}
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Reactions */}
                  {message.reactions && Object.keys(message.reactions).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {Object.entries(message.reactions).map(([emoji, userIds]) => (
                        <Button
                          key={emoji}
                          variant="outline"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => addReaction(message.id, emoji)}
                        >
                          {emoji} {userIds.length}
                        </Button>
                      ))}
                    </div>
                  )}
                  
                  {/* Add reaction button */}
                  <div className="flex items-center gap-1 mt-1">
                    <Dialog open={showEmojiPicker === message.id} onOpenChange={(open) => setShowEmojiPicker(open ? message.id : null)}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Smile className="h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="w-80">
                        <DialogHeader>
                          <DialogTitle>Add Reaction</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-8 gap-2 p-4">
                          {popularEmojis.map(emoji => (
                            <Button
                              key={emoji}
                              variant="ghost"
                              className="h-10 w-10 p-0 text-lg hover:bg-muted"
                              onClick={() => addReaction(message.id, emoji)}
                            >
                              {emoji}
                            </Button>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            ))
          )}
          
          {/* Typing indicator */}
          {someoneTyping && (
            <div className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <span className="text-xs">💬</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                  <span>Someone is typing...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <form onSubmit={sendMessage} className="p-4 border-t">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
            maxLength={500}
          />
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggleRecording}
            className={`shrink-0 ${isRecording ? 'bg-destructive text-destructive-foreground' : ''}`}
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          
          <Button type="submit" size="sm" disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.gif"
          onChange={handleFileUpload}
          className="hidden"
        />
      </form>
    </Card>
  );
};

export default ChatInterface;