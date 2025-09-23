import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Bot, Clock, Target } from 'lucide-react';

interface GameLobbyProps {
  onStartPvP: () => void;
  onStartBot: () => void;
  onBack: () => void;
}

export const GameLobby: React.FC<GameLobbyProps> = ({ onStartPvP, onStartBot, onBack }) => {
  const [waitingForPlayer, setWaitingForPlayer] = useState(false);
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (waitingForPlayer && countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            // Auto-start with bot when countdown reaches 0
            setTimeout(() => {
              setWaitingForPlayer(false);
              onStartBot();
            }, 100);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [waitingForPlayer, countdown, onStartBot]);

  const handleStartPvP = () => {
    setWaitingForPlayer(true);
    setCountdown(30);
    // In a real implementation, this would broadcast to other players
  };

  const handleCancelWait = () => {
    setWaitingForPlayer(false);
    setCountdown(30);
  };

  if (waitingForPlayer) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <Users className="w-6 h-6" />
              Waiting for Player...
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="space-y-4">
              <div className="text-6xl font-mono font-bold text-blue-600">
                {countdown}
              </div>
              <div className="flex items-center justify-center gap-2 text-lg text-muted-foreground">
                <Clock className="w-5 h-5" />
                Auto-starting with Bot in {countdown} seconds
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Share this room with a friend to play together!
              </div>
              
              <div className="flex gap-3 justify-center">
                <Button onClick={onStartBot} variant="default">
                  <Bot className="w-4 h-4 mr-2" />
                  Play vs Bot Now
                </Button>
                <Button onClick={handleCancelWait} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>

            {/* Animated waiting indicator */}
            <div className="flex justify-center">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-300">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl flex items-center justify-center gap-2">
            <Target className="w-8 h-8" />
            Cannon Duel
          </CardTitle>
          <p className="text-lg text-muted-foreground mt-2">
            Strategic tank warfare with destructible terrain and power-ups
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            {/* PvP Mode */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300 hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center space-y-4">
                <Users className="w-12 h-12 mx-auto text-blue-600" />
                <h3 className="text-xl font-semibold">Player vs Player</h3>
                <p className="text-sm text-muted-foreground">
                  Challenge a friend to strategic tank combat. Take turns positioning, aiming, and firing while collecting power-ups.
                </p>
                <Badge variant="secondary" className="mb-2">
                  Online Multiplayer
                </Badge>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div>• Real-time strategy gameplay</div>
                  <div>• Destructible terrain</div>
                  <div>• Power-up collection</div>
                  <div>• 30-second matchmaking</div>
                </div>
                <Button onClick={handleStartPvP} className="w-full" size="lg">
                  <Users className="w-4 h-4 mr-2" />
                  Find Player
                </Button>
              </CardContent>
            </Card>

            {/* Bot Mode */}
            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-300 hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center space-y-4">
                <Bot className="w-12 h-12 mx-auto text-red-600" />
                <h3 className="text-xl font-semibold">Player vs Bot</h3>
                <p className="text-sm text-muted-foreground">
                  Battle against AI with adjustable difficulty. The bot will strategically move, collect power-ups, and adapt to your play style.
                </p>
                <Badge variant="secondary" className="mb-2">
                  AI Challenge
                </Badge>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div>• Smart AI behavior</div>
                  <div>• Strategic movement</div>
                  <div>• Power-up collection</div>
                  <div>• Adaptive difficulty</div>
                </div>
                <Button onClick={onStartBot} className="w-full" size="lg" variant="outline">
                  <Bot className="w-4 h-4 mr-2" />
                  Play vs Bot
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button onClick={onBack} variant="ghost">
              ← Back to Games
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};