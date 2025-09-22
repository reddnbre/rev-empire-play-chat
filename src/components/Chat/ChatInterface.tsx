import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Users, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Message {
  id: string;
  user_id: string;
  username: string;
  content: string;
  created_at: string;
  expires_at: string;
}

interface ChatInterfaceProps {
  currentUser: any;
}

const ChatInterface = ({ currentUser }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<number>(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      // For demo purposes, we'll simulate real-time chat with local state
      // In production, you'd insert into a messages table and use Supabase realtime
      const message: Message = {
        id: Math.random().toString(),
        user_id: currentUser.id,
        username: currentUser.email?.split('@')[0] || 'User',
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
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <form onSubmit={sendMessage} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
            maxLength={500}
          />
          <Button type="submit" size="sm" disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default ChatInterface;