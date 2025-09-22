import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

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

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
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
  }, [navigate]);

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
        <div className="hidden lg:block w-40 flex-shrink-0 p-4">
          <div className="sticky top-4">
            <AdBanner position="sidebar" className="h-[600px]" />
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
              {/* Games Section */}
              <div className="lg:col-span-1">
                <GamesList onStartGame={handleStartGame} />
              </div>

              {/* Chat Section */}
              <div className="lg:col-span-1">
                <ChatInterface 
                  currentUser={user} 
                  guestName={guestName}
                  onRequestName={() => setShowNameInput(true)}
                />
              </div>

              {/* Welcome Info */}
              <div className="lg:col-span-1 space-y-4">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Welcome to RevEmpire!</h3>
                  <div className="space-y-4 text-sm">
                    <div>
                      <h4 className="font-medium">🎮 14 Multiplayer Games</h4>
                      <p className="text-muted-foreground">
                        Challenge friends in strategy, puzzle, and party games
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium">💬 Real-time Chat</h4>
                      <p className="text-muted-foreground">
                        Connect with players worldwide (8-hour auto-delete)
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium">🏆 Compete & Win</h4>
                      <p className="text-muted-foreground">
                        Join tournaments and climb the leaderboards
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </main>

        {/* Right Sidebar Banner */}
        <div className="hidden lg:block w-40 flex-shrink-0 p-4">
          <div className="sticky top-4">
            <AdBanner position="sidebar" className="h-[600px]" />
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