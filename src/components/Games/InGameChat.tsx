import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, Smile } from 'lucide-react';
import { useSoundEffects } from '@/hooks/useSoundEffects';

interface GameMessage {
  id: string;
  text: string;
  sender: 'player1' | 'player2' | 'spectator';
  timestamp: Date;
  isReaction?: boolean;
}

interface InGameChatProps {
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  currentPlayer?: 'player1' | 'player2' | 'spectator';
  spectatorCount?: number;
}

const QUICK_REACTIONS = ['👍', '👎', '😄', '😢', '🔥', '💯', '🎉', '😱'];

const InGameChat = ({ 
  isMinimized = false, 
  onToggleMinimize,
  currentPlayer = 'player1',
  spectatorCount = 0 
}: InGameChatProps) => {
  const [messages, setMessages] = useState<GameMessage[]>([
    {
      id: '1',
      text: 'Good luck! 🍀',
      sender: 'player2',
      timestamp: new Date(Date.now() - 30000)
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { playMessage, playReaction } = useSoundEffects();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simulate typing indicator
  useEffect(() => {
    if (Math.random() < 0.3) {
      setIsTyping(true);
      const timer = setTimeout(() => {
        setIsTyping(false);
        // Simulate incoming message
        if (Math.random() < 0.7) {
          const responses = [
            'Nice move!',
            'Thinking...',
            'Good game so far',
            'Your turn!',
            'Let\'s see...'
          ];
          addMessage(responses[Math.floor(Math.random() * responses.length)], 'player2');
        }
      }, 2000 + Math.random() * 3000);
      return () => clearTimeout(timer);
    }
  }, [messages.length]);

  const addMessage = (text: string, sender: 'player1' | 'player2' | 'spectator', isReaction = false) => {
    const message: GameMessage = {
      id: Date.now().toString(),
      text,
      sender,
      timestamp: new Date(),
      isReaction
    };
    setMessages(prev => [...prev, message]);
    if (isReaction) {
      playReaction();
    } else {
      playMessage();
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      addMessage(newMessage, currentPlayer);
      setNewMessage('');
    }
  };

  const handleQuickReaction = (emoji: string) => {
    addMessage(emoji, currentPlayer, true);
    setShowReactions(false);
  };

  const getSenderColor = (sender: string) => {
    switch (sender) {
      case 'player1': return 'text-blue-500';
      case 'player2': return 'text-red-500';
      case 'spectator': return 'text-gray-500';
      default: return 'text-foreground';
    }
  };

  const getSenderName = (sender: string) => {
    switch (sender) {
      case 'player1': return 'Player 1';
      case 'player2': return 'Player 2';
      case 'spectator': return 'Spectator';
      default: return 'Unknown';
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <Button
          onClick={onToggleMinimize}
          className="h-12 w-12 rounded-full shadow-lg"
          size="sm"
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
        {messages.length > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center"
          >
            {messages.length}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 h-96 z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-card rounded-t-lg">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          <span className="font-medium">Game Chat</span>
          {spectatorCount > 0 && (
            <Badge variant="outline" className="text-xs">
              {spectatorCount} watching
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onToggleMinimize}>
          ×
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          {messages.map((message) => (
            <div key={message.id} className={`flex flex-col gap-1 ${
              message.sender === currentPlayer ? 'items-end' : 'items-start'
            }`}>
              <div className={`max-w-[80%] p-2 rounded-lg ${
                message.sender === currentPlayer 
                  ? 'bg-primary text-primary-foreground ml-auto' 
                  : 'bg-muted'
              } ${message.isReaction ? 'text-2xl p-1' : ''}`}>
                {!message.isReaction && (
                  <div className={`text-xs ${getSenderColor(message.sender)} mb-1`}>
                    {getSenderName(message.sender)}
                  </div>
                )}
                <div className={message.isReaction ? 'text-center' : ''}>
                  {message.text}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {message.timestamp.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
              <span className="text-sm">Opponent is typing...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Quick Reactions */}
      {showReactions && (
        <div className="p-2 border-t bg-muted/50">
          <div className="flex gap-1 justify-center">
            {QUICK_REACTIONS.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-lg hover:scale-110 transition-transform"
                onClick={() => handleQuickReaction(emoji)}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowReactions(!showReactions)}
          >
            <Smile className="h-4 w-4" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 h-8"
            maxLength={100}
          />
          <Button type="submit" size="sm" disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
};

export default InGameChat;