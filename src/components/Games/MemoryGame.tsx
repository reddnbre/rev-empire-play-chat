import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RotateCcw, Trophy, Users, Brain } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface MemoryGameProps {
  onBack: () => void;
}

type CardState = {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
};

type GameStatus = "playing" | "finished";

const emojis = ["🎮", "🎯", "🎲", "🃏", "🎪", "🎨", "🎭", "🎸"];

const MemoryGame = ({ onBack }: MemoryGameProps) => {
  const [cards, setCards] = useState<CardState[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [moves, setMoves] = useState(0);
  const [gameStatus, setGameStatus] = useState<GameStatus>("playing");
  const [scores, setScores] = useState({ wins: 0, bestMoves: Infinity });
  const [gameMode] = useState<"solo">("solo");

  useEffect(() => {
    initializeGame();
  }, []);

  useEffect(() => {
    if (flippedCards.length === 2) {
      const [first, second] = flippedCards;
      const firstCard = cards.find(card => card.id === first);
      const secondCard = cards.find(card => card.id === second);

      if (firstCard && secondCard && firstCard.emoji === secondCard.emoji) {
        // Match found
        setTimeout(() => {
          setCards(prev => prev.map(card => 
            card.id === first || card.id === second 
              ? { ...card, isMatched: true }
              : card
          ));
          setMatchedPairs(prev => prev + 1);
          setFlippedCards([]);
          
          // Check if game is complete
          if (matchedPairs + 1 === 8) {
            endGame();
          }
        }, 500);
      } else {
        // No match - flip cards back
        setTimeout(() => {
          setCards(prev => prev.map(card => 
            card.id === first || card.id === second 
              ? { ...card, isFlipped: false }
              : card
          ));
          setFlippedCards([]);
        }, 1000);
      }
      setMoves(prev => prev + 1);
    }
  }, [flippedCards, matchedPairs]);

  const initializeGame = () => {
    // Create pairs of emojis
    const gameEmojis = [...emojis, ...emojis];
    
    // Shuffle and create cards
    const shuffledEmojis = gameEmojis.sort(() => Math.random() - 0.5);
    const newCards = shuffledEmojis.map((emoji, index) => ({
      id: index,
      emoji,
      isFlipped: false,
      isMatched: false
    }));

    setCards(newCards);
    setFlippedCards([]);
    setMatchedPairs(0);
    setMoves(0);
    setGameStatus("playing");
  };

  const endGame = () => {
    setGameStatus("finished");
    setScores(prev => ({
      wins: prev.wins + 1,
      bestMoves: Math.min(prev.bestMoves, moves + 1)
    }));
    
    toast({
      title: "Congratulations!",
      description: `You won in ${moves + 1} moves! 🎉`,
    });
  };

  const flipCard = (cardId: number) => {
    if (flippedCards.length >= 2 || gameStatus !== "playing") return;
    
    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;

    setCards(prev => prev.map(c => 
      c.id === cardId ? { ...c, isFlipped: true } : c
    ));
    setFlippedCards(prev => [...prev, cardId]);
  };

  const resetGame = () => {
    initializeGame();
  };

  const resetScores = () => {
    setScores({ wins: 0, bestMoves: Infinity });
    resetGame();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Games
        </Button>
        <div className="flex gap-2">
          <Badge variant="default">
            <Brain className="h-3 w-3 mr-1" />
            Solo
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Trophy className="h-5 w-5" />
            Memory Match
          </CardTitle>
          <CardDescription>
            {gameStatus === "playing" && `Find all pairs! Moves: ${moves} | Pairs: ${matchedPairs}/8`}
            {gameStatus === "finished" && `Game complete in ${moves} moves!`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{moves}</div>
              <div className="text-sm text-muted-foreground">Moves</div>
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{matchedPairs}</div>
              <div className="text-sm text-muted-foreground">Pairs Found</div>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {scores.bestMoves === Infinity ? "-" : scores.bestMoves}
              </div>
              <div className="text-sm text-muted-foreground">Best Score</div>
            </div>
          </div>

          {/* Game Board */}
          <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
            {cards.map((card) => (
              <Button
                key={card.id}
                variant="outline"
                className={`
                  h-20 w-20 text-3xl font-bold transition-all duration-300 transform
                  ${card.isFlipped || card.isMatched 
                    ? 'bg-primary/10 scale-105' 
                    : 'bg-muted hover:bg-accent/50'}
                  ${card.isMatched ? 'opacity-75 cursor-default' : ''}
                `}
                onClick={() => flipCard(card.id)}
                disabled={card.isFlipped || card.isMatched || gameStatus !== "playing"}
              >
                {card.isFlipped || card.isMatched ? card.emoji : "?"}
              </Button>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(matchedPairs / 8) * 100}%` }}
            />
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
              Reset Stats
            </Button>
          </div>

          {/* Game Instructions */}
          <div className="text-center text-sm text-muted-foreground space-y-1">
            <p>Flip two cards at a time to find matching pairs!</p>
            <p>Complete the puzzle with the fewest moves possible.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MemoryGame;