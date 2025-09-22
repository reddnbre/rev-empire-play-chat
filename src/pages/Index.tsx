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

// Games
import TicTacToe from "@/components/Games/TicTacToe";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<"main" | "admin" | "game">("main");
  const [currentGame, setCurrentGame] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(true); // Enable admin access for all users
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

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

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

  const renderGameComponent = () => {
    switch (currentGame) {
      case "tictactoe":
        return <TicTacToe onBack={handleBackToMain} />;
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

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        currentUser={user} 
        onShowAdmin={() => setCurrentView("admin")}
        isAdmin={isAdmin}
      />

      {/* Top Ad Banner */}
      <div className="container mx-auto px-4 pt-4">
        <AdBanner position="top" />
      </div>

      <main className="container mx-auto px-4 py-6">
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
              <ChatInterface currentUser={user} />
            </div>

            {/* Sidebar with Ads */}
            <div className="lg:col-span-1 space-y-4">
              <AdBanner position="sidebar" />
              
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

              <AdBanner position="sidebar" />
            </div>
          </div>
        )}
      </main>

      {/* Bottom Ad Banner */}
      <div className="container mx-auto px-4 pb-4">
        <AdBanner position="bottom" />
      </div>

      {/* Popup Ad */}
      <AdBanner position="popup" />
    </div>
  );
};

export default Index;