import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

interface GameSession {
  id: string;
  game_type: string;
  status: 'waiting' | 'active' | 'completed';
  player1_id: string;
  player1_name: string;
  player2_id: string | null;
  player2_name: string | null;
  game_data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface DbGameSession {
  id: string;
  game_type: string;
  status: string;
  player1_id: string;
  player1_name: string;
  player2_id: string | null;
  player2_name: string | null;
  game_data: Json;
  created_at: string;
  updated_at: string;
}

interface UseMultiplayerGamesProps {
  currentUser: User | null;
  guestName?: string;
}

export const useMultiplayerGames = ({ currentUser, guestName }: UseMultiplayerGamesProps) => {
  const [currentSession, setCurrentSession] = useState<GameSession | null>(null);
  const [waitingForPlayer, setWaitingForPlayer] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const channelRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Get current user info
  const getCurrentUserId = () => currentUser?.id || `guest_${guestName || 'unknown'}`;
  const getCurrentUsername = () => {
    if (currentUser) {
      return currentUser.email?.split('@')[0] || 'User';
    }
    return guestName || 'Guest';
  };

  // Convert database game session to app format
  const convertDbGameSession = (dbSession: DbGameSession): GameSession => ({
    id: dbSession.id,
    game_type: dbSession.game_type,
    status: dbSession.status as GameSession['status'],
    player1_id: dbSession.player1_id,
    player1_name: dbSession.player1_name,
    player2_id: dbSession.player2_id,
    player2_name: dbSession.player2_name,
    game_data: dbSession.game_data ? (dbSession.game_data as Record<string, any>) : {},
    created_at: dbSession.created_at,
    updated_at: dbSession.updated_at,
  });

  // Initialize real-time subscriptions
  useEffect(() => {
    const initializeGameSubscription = () => {
      // Set up real-time subscription for game sessions
      const gamesChannel = supabase
        .channel('game_sessions')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'game_sessions'
          },
          (payload) => {
            const updatedSession = convertDbGameSession(payload.new as DbGameSession);
            const userId = getCurrentUserId();
            
            // Only track sessions where current user is a player
            if (updatedSession.player1_id === userId || updatedSession.player2_id === userId) {
              setCurrentSession(updatedSession);
              
              // If player 2 joined, stop waiting and start game
              if (updatedSession.player2_id && waitingForPlayer) {
                setWaitingForPlayer(false);
                if (timeoutRef.current) {
                  clearTimeout(timeoutRef.current);
                }
                toast({
                  title: "Player found!",
                  description: `${updatedSession.player2_name} joined the game`,
                });
              }
            }
          }
        )
        .subscribe();

      channelRef.current = gamesChannel;
    };

    initializeGameSubscription();

    // Cleanup function
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentUser, guestName, waitingForPlayer]);

  // Find or create a game session
  const findGame = async (gameType: string): Promise<{ session: GameSession | null; shouldWait: boolean }> => {
    try {
      // First, try to find an existing waiting game
      const { data: waitingGames, error: searchError } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('game_type', gameType)
        .eq('status', 'waiting')
        .is('player2_id', null)
        .neq('player1_id', getCurrentUserId())
        .order('created_at', { ascending: true })
        .limit(1);

      if (searchError) {
        console.error('Error searching for games:', searchError);
        throw searchError;
      }

      if (waitingGames && waitingGames.length > 0) {
        // Join existing game
        const gameToJoin = waitingGames[0];
        const { data: updatedGame, error: joinError } = await supabase
          .from('game_sessions')
          .update({
            player2_id: getCurrentUserId(),
            player2_name: getCurrentUsername(),
            status: 'active'
          })
          .eq('id', gameToJoin.id)
          .select()
          .single();

        if (joinError) {
          console.error('Error joining game:', joinError);
          throw joinError;
        }

        return {
          session: convertDbGameSession(updatedGame),
          shouldWait: false
        };
      } else {
        // Create new game session
        const { data: newGame, error: createError } = await supabase
          .from('game_sessions')
          .insert([{
            game_type: gameType,
            player1_id: getCurrentUserId(),
            player1_name: getCurrentUsername(),
            status: 'waiting'
          }])
          .select()
          .single();

        if (createError) {
          console.error('Error creating game:', createError);
          throw createError;
        }

        return {
          session: convertDbGameSession(newGame),
          shouldWait: true
        };
      }
    } catch (error) {
      toast({
        title: "Failed to find game",
        description: "Please try again.",
        variant: "destructive",
      });
      return { session: null, shouldWait: false };
    }
  };

  // Start waiting for player with countdown
  const startWaiting = (session: GameSession) => {
    setCurrentSession(session);
    setWaitingForPlayer(true);
    setCountdown(30);

    // Start countdown
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          // Convert to bot game
          convertToBotGame(session);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    timeoutRef.current = countdownInterval;
  };

  // Convert waiting game to bot game
  const convertToBotGame = async (session: GameSession) => {
    try {
      const { error } = await supabase
        .from('game_sessions')
        .update({
          player2_id: 'bot',
          player2_name: 'Bot',
          status: 'active'
        })
        .eq('id', session.id);

      if (error) {
        console.error('Error converting to bot game:', error);
        throw error;
      }

      setWaitingForPlayer(false);
      toast({
        title: "Playing vs Bot",
        description: "No player found, starting game with bot",
      });
    } catch (error) {
      toast({
        title: "Failed to start bot game",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  // Cancel waiting for player
  const cancelWaiting = async () => {
    if (currentSession && timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      
      // Delete the waiting session
      await supabase
        .from('game_sessions')
        .delete()
        .eq('id', currentSession.id);

      setCurrentSession(null);
      setWaitingForPlayer(false);
      setCountdown(30);
    }
  };

  // Update game state
  const updateGameState = async (gameData: Record<string, any>) => {
    if (!currentSession) return;

    try {
      const { error } = await supabase
        .from('game_sessions')
        .update({ game_data: gameData })
        .eq('id', currentSession.id);

      if (error) {
        console.error('Error updating game state:', error);
        throw error;
      }
    } catch (error) {
      toast({
        title: "Failed to update game",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    currentSession,
    waitingForPlayer,
    countdown,
    findGame,
    startWaiting,
    cancelWaiting,
    updateGameState,
    convertToBotGame
  };
};