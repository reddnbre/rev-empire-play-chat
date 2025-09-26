import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Bot, Timer, Eye } from 'lucide-react';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useMultiplayerGames } from '@/hooks/useMultiplayerGames';
import { User } from '@supabase/supabase-js';

interface GameLobbyProps {
  gameName: string;
  gameType: string;
  currentUser: User | null;
  guestName?: string;
  onStartGame: (session: any) => void;
  onBack: () => void;
}

const GameLobby = ({ 
  gameName, 
  gameType,
  currentUser,
  guestName,
  onStartGame,
  onBack
}: GameLobbyProps) => {
  const [playersOnline] = useState(Math.floor(Math.random() * 20) + 5); // Mock online count
  const [activeGames] = useState(Math.floor(Math.random() * 8) + 2); // Mock active games
  const { playTick, playJoin } = useSoundEffects();
  
  // Use multiplayer games hook
  const { 
    currentSession, 
    waitingForPlayer, 
    countdown, 
    findGame, 
    startWaiting, 
    cancelWaiting,
    convertToBotGame 
  } = useMultiplayerGames({ currentUser, guestName });

  // Handle starting PvP game
  const handleStartPvP = async () => {
    const { session, shouldWait } = await findGame(gameType);
    
    if (session) {
      if (shouldWait) {
        startWaiting(session);
        playJoin();
      } else {
        // Game found immediately, start playing
        onStartGame(session);
      }
    }
  };

  // Handle starting bot game
  const handleStartBot = async () => {
    const { session } = await findGame(gameType);
    if (session) {
      await convertToBotGame(session);
      onStartGame(session);
    }
  };

  // Handle game session updates
  useEffect(() => {
    if (currentSession && currentSession.status === 'active' && !waitingForPlayer) {
      onStartGame(currentSession);
    }
  }, [currentSession, waitingForPlayer, onStartGame]);

  const progress = ((30 - countdown) / 30) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold gradient-text mb-2">{gameName}</h1>
        <p className="text-muted-foreground">Choose your game mode</p>
      </div>

      {/* Live Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Players Online</span>
          </div>
          <div className="text-2xl font-bold text-primary">{playersOnline}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-accent" />
            <span className="text-sm text-muted-foreground">Active Games</span>
          </div>
          <div className="text-2xl font-bold text-accent">{activeGames}</div>
        </Card>
      </div>

      {/* Waiting for Player Timer */}
      {waitingForPlayer && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Timer className="h-5 w-5 animate-pulse" />
              Waiting for Player...
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">{countdown}s</div>
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground mt-2">
                {countdown > 0 
                  ? `Auto-starting with Bot in ${countdown} seconds...`
                  : 'Starting with Bot...'}
              </p>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleStartBot} variant="default">
                  Play vs Bot Now
                </Button>
                <Button onClick={cancelWaiting} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Game Mode Selection */}
      {!waitingForPlayer && (
        <div className="grid gap-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={handleStartPvP}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Play vs Player</h3>
                    <p className="text-sm text-muted-foreground">
                      Challenge another human player
                    </p>
                  </div>
                </div>
                <Badge variant="default">Multiplayer</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={handleStartBot}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-accent/10 rounded-lg group-hover:bg-accent/20 transition-colors">
                    <Bot className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Play vs Bot</h3>
                    <p className="text-sm text-muted-foreground">
                      Practice against AI opponent
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">Single Player</Badge>
              </div>
            </CardContent>
          </Card>

          {activeGames > 0 && (
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-500/10 rounded-lg group-hover:bg-orange-500/20 transition-colors">
                      <Eye className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Spectate Games</h3>
                      <p className="text-sm text-muted-foreground">
                        Watch live games in progress
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-orange-500 border-orange-500">
                    {activeGames} Live
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="flex justify-center">
        <Button variant="outline" onClick={onBack}>
          Back to Games
        </Button>
      </div>
    </div>
  );
};

export default GameLobby;