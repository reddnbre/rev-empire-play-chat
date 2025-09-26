import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Send, Users, Clock, Smile, Mic, MicOff, Paperclip, Image, RotateCcw, Bell, BellOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNotifications } from "@/hooks/useNotifications";
import { useMultiplayerChat } from "@/hooks/useMultiplayerChat";


interface ChatInterfaceProps {
  currentUser: any;
  guestName?: string;
  onRequestName?: () => void;
}

const ChatInterface = ({ currentUser, guestName, onRequestName }: ChatInterfaceProps) => {
  const [newMessage, setNewMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showLandscapeHint, setShowLandscapeHint] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const { permission, supported, requestPermission, showNotification } = useNotifications();
  
  // Use the multiplayer chat hook
  const { messages, onlineUsers, sendMessage: sendChatMessage, addReaction } = useMultiplayerChat({
    currentUser,
    guestName,
    onNotification: showNotification
  });

  // Request notification permission on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (permission === 'default') {
        toast({
          title: "Enable notifications",
          description: "Get notified when someone sends you a message",
          action: (
            <Button
              size="sm"
              onClick={requestPermission}
              className="flex items-center gap-1"
            >
              <Bell className="h-3 w-3" />
              Enable
            </Button>
          ),
          duration: 8000,
        });
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [permission, requestPermission]);

  // Show landscape hint for mobile users
  useEffect(() => {
    if (isMobile && window.innerHeight > window.innerWidth) {
      setShowLandscapeHint(true);
      const timer = setTimeout(() => {
        toast({
          title: "Better chat experience",
          description: "📱 Rotate to landscape mode for optimal chat viewing",
          duration: 4000,
        });
        setShowLandscapeHint(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isMobile]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    await sendChatMessage(newMessage.trim());
    setNewMessage("");
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

  const handleAddReaction = async (messageId: string, emoji: string) => {
    await addReaction(messageId, emoji);
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
    reader.onload = async (e) => {
      const attachment = {
        type: file.type.includes('gif') ? 'gif' as const : 'image' as const,
        url: e.target?.result as string,
        name: file.name
      };

      await sendChatMessage(
        `Shared ${file.type.includes('gif') ? 'a GIF' : 'an image'}`,
        attachment
      );
    };
    reader.readAsDataURL(file);
    
    setShowFileUpload(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const popularEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥'];

  return (
    <Card className="h-[540px] md:h-[540px] h-[calc(100vh-200px)] flex flex-col">
      <div className="p-3 md:p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-base md:text-lg font-semibold">Global Chat</h3>
          <div className="flex items-center gap-1 md:gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={requestPermission}
              className="h-6 w-6 p-0"
              title={permission === 'granted' ? 'Notifications enabled' : 'Enable notifications'}
            >
              {permission === 'granted' ? (
                <Bell className="h-3 w-3 text-green-500" />
              ) : (
                <BellOff className="h-3 w-3 text-muted-foreground" />
              )}
            </Button>
            <Badge variant="secondary" className="flex items-center gap-1 text-xs">
              <Users className="h-3 w-3" />
              <span className="hidden sm:inline">{onlineUsers || 1}</span>
              <span className="sm:hidden">{onlineUsers || 1}</span>
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1 text-xs">
              <Clock className="h-3 w-3" />
              <span className="hidden sm:inline">8h auto-delete</span>
              <span className="sm:hidden">8h</span>
            </Badge>
          </div>
        </div>
      </div>

      <div className="p-3 md:p-4 flex-1 min-h-0 overflow-y-auto border-gray-200" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="flex gap-3">
                <Avatar className="h-7 w-7 md:h-8 md:w-8 flex-shrink-0">
                  <AvatarFallback className="text-xs">
                    {getInitials(message.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{message.username}</span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatTime(message.created_at)}
                    </span>
                  </div>
                  <div className="text-sm bg-muted rounded-lg px-3 py-2 break-words">
                    {message.content}
                    {message.attachment && (
                      <div className="mt-2">
                        <img 
                          src={message.attachment.url} 
                          alt={message.attachment.name}
                          className="max-w-full w-full sm:max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
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
                            onClick={() => handleAddReaction(message.id, emoji)}
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
                              onClick={() => handleAddReaction(message.id, emoji)}
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
          
        </div>
      </div>

      <form onSubmit={sendMessage} className="p-3 md:p-4 border-t flex-shrink-0">
        <div className="flex gap-1 md:gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 px-2 md:px-3"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 text-sm"
            maxLength={500}
          />
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggleRecording}
            className={`shrink-0 px-2 md:px-3 ${isRecording ? 'bg-destructive text-destructive-foreground' : ''}`}
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          
          <Button type="submit" size="sm" disabled={!newMessage.trim()} className="px-2 md:px-3">
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