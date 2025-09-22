import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

// Components
import Header from "@/components/Layout/Header";
import ChatInterface from "@/components/Chat/ChatInterface";
import GamesList from "@/components/Games/GamesList";
import AdminPanel from "@/components/Admin/AdminPanel";
import AdBanner from "@/components/Ads/AdBanner";
import GuestNameInput from "@/components/Chat/GuestNameInput";

// Games
import TicTacToe from "@/components/Games/TicTacToe";
import Hangman from "@/components/Games/Hangman";
import ConnectFour from "@/components/Games/ConnectFour";
import MemoryGame from "@/components/Games/MemoryGame";
import NumberPuzzle from "@/components/Games/NumberPuzzle";
import War from "@/components/Games/War";
import EmojiGuess from "@/components/Games/EmojiGuess";
import TriviaBot from "@/components/Games/TriviaBot";
import Battleship from "@/components/Games/Battleship";
import Checkers from "@/components/Games/Checkers";
import UnoLite from "@/components/Games/UnoLite";
import WordSearch from "@/components/Games/WordSearch";
import WouldRather from "@/components/Games/WouldRather";
import CustomGames from "@/components/Games/CustomGames";
import SimpleGame from "@/components/Games/SimpleGame";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<"main" | "admin" | "game">("main");
  const [currentGame, setCurrentGame] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [showNameInput, setShowNameInput] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // If user logs out and becomes guest, prompt for name
        if (!session && !guestName) {
          setShowNameInput(true);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // If no authenticated user and no guest name, prompt for name
      if (!session && !guestName) {
        setShowNameInput(true);
      }
    });

    // Hidden admin shortcut: Shift+Ctrl+A
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.ctrlKey && e.key === 'A') {
        e.preventDefault();
        navigate('/auth');
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate, guestName]);

  useEffect(() => {
    if (user) {
      setIsAdmin(true); // Only authenticated users can be admin
    }
  }, [user]);

  const handleStartGame = (gameId: string) => {
    setCurrentGame(gameId);
    setCurrentView("game");
    toast({
      title: "Starting game",
      description: `Loading ${gameId}...`,
    });
  };

  const handleBackToMain = () => {
    setCurrentView("main");
    setCurrentGame("");
  };

  const handleAdminAccess = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setCurrentView("admin");
  };

  const handleGuestNameSubmit = (name: string) => {
    setGuestName(name);
    setShowNameInput(false);
  };

  const renderGameComponent = () => {
    switch (currentGame) {
      case "tictactoe":
        return <TicTacToe onBack={handleBackToMain} />;
      case "hangman":
        return <Hangman onBack={handleBackToMain} />;
      case "connect-four":
        return <ConnectFour onBack={handleBackToMain} />;
      case "memory-game":
        return <MemoryGame onBack={handleBackToMain} />;
      case "number-puzzle":
        return <NumberPuzzle onBack={handleBackToMain} />;
      case "war":
        return <War onBack={handleBackToMain} />;
      case "emoji-guess":
        return <EmojiGuess onBack={handleBackToMain} />;
      case "trivia-bot":
        return <TriviaBot onBack={handleBackToMain} />;
      case "battleship":
        return <Battleship onBack={handleBackToMain} />;
      case "checkers":
        return <Checkers onBack={handleBackToMain} />;
      case "uno-lite":
        return <UnoLite onBack={handleBackToMain} />;
      case "word-search":
        return <WordSearch onBack={handleBackToMain} />;
      case "would-rather":
        return <WouldRather onBack={handleBackToMain} />;
      case "custom-games":
        return <CustomGames onBack={handleBackToMain} />;
      default:
        return (
          <Card className="p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">Game Coming Soon</h3>
            <p className="text-muted-foreground mb-4">
              {currentGame} is being developed and will be available soon!
            </p>
            <Button onClick={handleBackToMain}>Back to Games</Button>
          </Card>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading RevEmpire ChatBox...</p>
        </div>
      </div>
    );
  }

  // Show name input for guests on first chat interaction
  if (showNameInput) {
    return <GuestNameInput onSubmit={handleGuestNameSubmit} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        currentUser={user} 
        onShowAdmin={handleAdminAccess}
        isAdmin={user ? isAdmin : false}
        guestName={guestName}
      />

      {/* Top Ad Banner */}
      <div className="w-full px-4 pt-4">
        <div className="max-w-full mx-auto">
          <AdBanner position="top" />
        </div>
      </div>

      {/* Main Layout with Side Banners */}
      <div className="flex w-full">
        {/* Left Sidebar Banner */}
        <div className="hidden xl:block w-32 flex-shrink-0 p-2">
          <div className="sticky top-4">
            <AdBanner position="sidebar" className="h-[500px]" />
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 px-4 py-6 min-w-0">
          {currentView === "admin" && (
            <div className="space-y-6">
              <Button 
                variant="outline" 
                onClick={() => setCurrentView("main")}
              >
                ← Back to Main
              </Button>
              <AdminPanel />
            </div>
          )}

          {currentView === "game" && (
            <div className="space-y-6">
              {renderGameComponent()}
            </div>
          )}

          {currentView === "main" && (
            <div className={`${isMobile ? 'space-y-4' : 'flex gap-4'} min-h-[calc(100vh-200px)]`}>
              {/* Left Sidebar - Hidden on mobile */}
              {!isMobile && (
                <div className="w-56 space-y-4 flex-shrink-0">
                  {/* Guest Mode Indicator */}
                  {!user && guestName && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium">Playing as {guestName}</span>
                      </div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        Guest mode - your progress won't be saved
                      </p>
                    </div>
                  )}
                  
                  {/* Welcome/Features Section */}
                  <Card className="p-4">
                    <h3 className="text-sm font-semibold mb-3">Welcome/Features</h3>
                    <div className="space-y-2 text-xs">
                      <div>
                        <h4 className="font-medium">🎮 Live Games</h4>
                        <p className="text-muted-foreground">
                          Real-time multiplayer with spectating & in-game chat
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium">💬 Global Chat</h4>
                        <p className="text-muted-foreground">
                          Connect instantly with typing indicators & reactions
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium">🤖 Smart Bots</h4>
                        <p className="text-muted-foreground">
                          Auto-matched when no players join in time
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Ad Section */}
                  <Card className="p-4">
                    <h3 className="text-sm font-semibold mb-3">Ad Section</h3>
                    <div className="h-32 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                      <AdBanner position="sidebar" className="w-full h-full" />
                    </div>
                  </Card>
                </div>
              )}

              {/* Center Content */}
              <div className="flex-1 space-y-4 min-w-0">
                {/* Mobile Guest Indicator */}
                {isMobile && !user && guestName && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium">Playing as {guestName}</span>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Guest mode - your progress won't be saved
                    </p>
                  </div>
                )}

                {/* Multiplayer/Game Selection - More compact on mobile */}
                <div className={`${isMobile ? 'h-12 mb-4' : 'h-16 mb-12'}`}>
                  <GamesList onStartGame={handleStartGame} />
                </div>

                {/* Chat Section - Dominant area */}
                <div className="flex-1">
                  <ChatInterface 
                    currentUser={user} 
                    guestName={guestName}
                    onRequestName={() => setShowNameInput(true)}
                  />
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Right Sidebar Banner */}
        <div className="hidden xl:block w-32 flex-shrink-0 p-2">
          <div className="sticky top-4">
            <AdBanner position="sidebar" className="h-[500px]" />
          </div>
        </div>
      </div>

      {/* Bottom Ad Banner */}
      <div className="w-full px-4 pb-4">
        <div className="max-w-full mx-auto">
          <AdBanner position="bottom" />
        </div>
      </div>

      {/* Popup Ad */}
      <AdBanner position="popup" />
    </div>
  );
};

export default Index;