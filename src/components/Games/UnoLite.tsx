import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RotateCcw, Trophy, Heart, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface UnoLiteProps {
  onBack: () => void;
}

type UnoCard = {
  color: "red" | "blue" | "green" | "yellow" | "wild";
  value: string | number;
  id: string;
};

type GameStatus = "playing" | "finished";

const colors = ["red", "blue", "green", "yellow"] as const;
const values = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, "Skip", "Reverse", "+2"];

const UnoLite = ({ onBack }: UnoLiteProps) => {
  const [deck, setDeck] = useState<UnoCard[]>([]);
  const [playerHand, setPlayerHand] = useState<UnoCard[]>([]);
  const [botHand, setBotHand] = useState<UnoCard[]>([]);
  const [currentCard, setCurrentCard] = useState<UnoCard | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus>("playing");
  const [winner, setWinner] = useState<string>("");
  const [scores, setScores] = useState({ player: 0, bot: 0 });
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [gameDirection, setGameDirection] = useState(1); // 1 for normal, -1 for reverse

  useEffect(() => {
    initializeGame();
  }, []);

  const createDeck = (): UnoCard[] => {
    const newDeck: UnoCard[] = [];
    let cardId = 0;

    // Regular cards (2 of each except 0)
    colors.forEach(color => {
      values.forEach(value => {
        const count = value === 0 ? 1 : 2;
        for (let i = 0; i < count; i++) {
          newDeck.push({
            color,
            value,
            id: `${cardId++}`
          });
        }
      });
    });

    // Wild cards (simplified - just 4 wild cards)
    for (let i = 0; i < 4; i++) {
      newDeck.push({
        color: "wild",
        value: "Wild",
        id: `wild-${i}`
      });
    }

    // Shuffle deck
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }

    return newDeck;
  };

  const initializeGame = () => {
    const newDeck = createDeck();
    
    // Deal 7 cards to each player
    const playerCards = newDeck.splice(0, 7);
    const botCards = newDeck.splice(0, 7);
    
    // Set first card (ensure it's not a wild)
    let firstCard = newDeck.splice(0, 1)[0];
    while (firstCard.color === "wild") {
      newDeck.push(firstCard);
      firstCard = newDeck.splice(0, 1)[0];
    }

    setDeck(newDeck);
    setPlayerHand(playerCards);
    setBotHand(botCards);
    setCurrentCard(firstCard);
    setGameStatus("playing");
    setWinner("");
    setIsPlayerTurn(true);
    setGameDirection(1);
  };

  const drawCard = (fromDeck: UnoCard[]): UnoCard => {
    if (fromDeck.length === 0) {
      // If deck is empty, shuffle discard pile (simplified)
      const newDeck = createDeck();
      return newDeck[Math.floor(Math.random() * newDeck.length)];
    }
    return fromDeck.pop()!;
  };

  const canPlayCard = (card: UnoCard, current: UnoCard): boolean => {
    if (card.color === "wild") return true;
    if (card.color === current.color) return true;
    if (card.value === current.value) return true;
    return false;
  };

  const playCard = (card: UnoCard, playerType: "player" | "bot") => {
    if (!canPlayCard(card, currentCard!)) return false;

    // Remove card from hand
    if (playerType === "player") {
      setPlayerHand(prev => prev.filter(c => c.id !== card.id));
    } else {
      setBotHand(prev => prev.filter(c => c.id !== card.id));
    }

    // Set new current card
    let newCurrentCard = { ...card };
    if (card.color === "wild") {
      // For wild cards, choose a random color (simplified AI)
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      newCurrentCard = { ...card, color: randomColor };
    }
    
    setCurrentCard(newCurrentCard);

    // Handle special cards
    let skipTurn = false;
    if (card.value === "Skip") {
      skipTurn = true;
      toast({
        title: "Skip! ⏭️",
        description: "Turn skipped!",
      });
    } else if (card.value === "Reverse") {
      setGameDirection(prev => -prev);
      toast({
        title: "Reverse! 🔄",
        description: "Direction changed!",
      });
    } else if (card.value === "+2") {
      const drawingPlayer = playerType === "player" ? "bot" : "player";
      for (let i = 0; i < 2; i++) {
        const drawnCard = drawCard([...deck]);
        if (drawingPlayer === "player") {
          setPlayerHand(prev => [...prev, drawnCard]);
        } else {
          setBotHand(prev => [...prev, drawnCard]);
        }
      }
      skipTurn = true;
      toast({
        title: "Draw 2! ✋",
        description: `${drawingPlayer === "player" ? "You" : "Bot"} draws 2 cards!`,
      });
    }

    // Check win condition
    const remainingCards = playerType === "player" ? playerHand.length - 1 : botHand.length - 1;
    if (remainingCards === 0) {
      setWinner(playerType);
      setGameStatus("finished");
      setScores(prev => ({ 
        ...prev, 
        [playerType]: prev[playerType] + 1 
      }));
      toast({
        title: `${playerType === "player" ? "You" : "Bot"} Win! 🎉`,
        description: "All cards played!",
      });
      return true;
    }

    // Switch turns (unless skipped)
    if (!skipTurn) {
      setIsPlayerTurn(playerType === "bot");
    } else {
      setIsPlayerTurn(playerType === "player");
    }

    return true;
  };

  const playerDrawCard = () => {
    if (!isPlayerTurn || gameStatus !== "playing") return;
    
    const drawnCard = drawCard([...deck]);
    setPlayerHand(prev => [...prev, drawnCard]);
    setIsPlayerTurn(false);
    
    toast({
      title: "Card Drawn 🃏",
      description: "You drew a card. Bot's turn.",
    });
  };

  // Bot AI
  useEffect(() => {
    if (!isPlayerTurn && gameStatus === "playing") {
      const timer = setTimeout(() => {
        const playableCards = botHand.filter(card => canPlayCard(card, currentCard!));
        
        if (playableCards.length > 0) {
          const cardToPlay = playableCards[0]; // Simple AI - play first valid card
          playCard(cardToPlay, "bot");
        } else {
          // Bot draws card
          const drawnCard = drawCard([...deck]);
          setBotHand(prev => [...prev, drawnCard]);
          setIsPlayerTurn(true);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, gameStatus, botHand, currentCard]);

  const resetGame = () => {
    initializeGame();
  };

  const resetScores = () => {
    setScores({ player: 0, bot: 0 });
    resetGame();
  };

  const getCardColor = (card: UnoCard) => {
    const colors: Record<string, string> = {
      red: "bg-red-500 text-white",
      blue: "bg-blue-500 text-white", 
      green: "bg-green-500 text-white",
      yellow: "bg-yellow-400 text-black",
      wild: "bg-gradient-to-r from-red-500 via-blue-500 to-green-500 text-white"
    };
    return colors[card.color] || "bg-gray-300";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Games
        </Button>
        <div className="flex gap-2">
          <Badge variant="default">
            <Heart className="h-3 w-3 mr-1" />
            Card Game
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Trophy className="h-5 w-5" />
            UNO Lite
          </CardTitle>
          <CardDescription>
            {gameStatus === "playing" && (isPlayerTurn ? "Your turn! Play a card or draw." : "Bot is thinking...")}
            {gameStatus === "finished" && `${winner === "player" ? "You" : "Bot"} won!`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Scoreboard */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{playerHand.length}</div>
              <div className="text-sm text-muted-foreground">Your Cards</div>
              <div className="text-lg font-semibold">Wins: {scores.player}</div>
            </div>
            <div className="p-3 bg-red-500/10 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{botHand.length}</div>
              <div className="text-sm text-muted-foreground">Bot Cards</div>
              <div className="text-lg font-semibold">Wins: {scores.bot}</div>
            </div>
          </div>

          {/* Current Card */}
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">Current Card:</p>
            {currentCard && (
              <div className={`w-24 h-32 mx-auto rounded-lg flex flex-col items-center justify-center shadow-lg ${getCardColor(currentCard)}`}>
                <div className="text-2xl font-bold">{currentCard.value}</div>
                <div className="text-xs uppercase tracking-wider">{currentCard.color}</div>
              </div>
            )}
          </div>

          {/* Player Hand */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Your Cards</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={playerDrawCard}
                disabled={!isPlayerTurn || gameStatus !== "playing"}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Draw Card
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2 justify-center">
              {playerHand.map((card) => (
                <button
                  key={card.id}
                  className={`w-16 h-24 rounded-lg flex flex-col items-center justify-center shadow-md transition-transform hover:scale-105 ${getCardColor(card)}
                    ${canPlayCard(card, currentCard!) && isPlayerTurn ? "ring-2 ring-white cursor-pointer" : "opacity-75 cursor-not-allowed"}`}
                  onClick={() => isPlayerTurn && playCard(card, "player")}
                  disabled={!isPlayerTurn || !canPlayCard(card, currentCard!) || gameStatus !== "playing"}
                >
                  <div className="text-lg font-bold">{card.value}</div>
                  <div className="text-xs uppercase">{card.color}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Bot Hand (face down) */}
          <div className="space-y-4">
            <h3 className="font-semibold">Bot's Cards</h3>
            <div className="flex flex-wrap gap-2 justify-center">
              {botHand.map((_, index) => (
                <div
                  key={index}
                  className="w-16 h-24 bg-gray-700 rounded-lg flex items-center justify-center shadow-md"
                >
                  <div className="text-white text-xs">UNO</div>
                </div>
              ))}
            </div>
          </div>

          {/* Game Controls */}
          <div className="flex justify-center gap-4">
            <Button
              variant="outline"
              onClick={resetGame}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              New Game
            </Button>
            <Button variant="outline" onClick={resetScores}>
              Reset Scores
            </Button>
          </div>

          {/* Instructions */}
          <div className="text-center text-sm text-muted-foreground space-y-1">
            <p>Match color or number to play a card!</p>
            <p>Special cards: Skip (⏭️), Reverse (🔄), +2 (✋), Wild (🌈)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnoLite;