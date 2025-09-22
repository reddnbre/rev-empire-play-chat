import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RotateCcw, Trophy, Users, Zap } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import GameResultDialog from "./GameResultDialog";

interface WarProps {
  onBack: () => void;
}

type CardType = {
  suit: "♠" | "♥" | "♦" | "♣";
  value: string;
  numValue: number;
};

type GameStatus = "playing" | "finished";

const War = ({ onBack }: WarProps) => {
  const [playerDeck, setPlayerDeck] = useState<CardType[]>([]);
  const [botDeck, setBotDeck] = useState<CardType[]>([]);
  const [playerCard, setPlayerCard] = useState<CardType | null>(null);
  const [botCard, setBotCard] = useState<CardType | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus>("playing");
  const [winner, setWinner] = useState<string>("");
  const [scores, setScores] = useState({ player: 0, bot: 0 });
  const [roundWinner, setRoundWinner] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [gameResult, setGameResult] = useState<"win" | "lose">("win");
  const [isWar, setIsWar] = useState(false);
  const [cardsAtStake, setCardsAtStake] = useState<CardType[]>([]);
  const [warDepth, setWarDepth] = useState(0);
  const [lastCardsWon, setLastCardsWon] = useState(0);

  useEffect(() => {
    initializeGame();
  }, []);

  const createDeck = (): CardType[] => {
    const suits: ("♠" | "♥" | "♦" | "♣")[] = ["♠", "♥", "♦", "♣"];
    const values = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
    const deck: CardType[] = [];

    suits.forEach(suit => {
      values.forEach((value, index) => {
        deck.push({
          suit,
          value,
          numValue: index + 2
        });
      });
    });

    // Shuffle deck
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    return deck;
  };

  const initializeGame = () => {
    const deck = createDeck();
    const midpoint = Math.floor(deck.length / 2);
    
    setPlayerDeck(deck.slice(0, midpoint));
    setBotDeck(deck.slice(midpoint));
    setPlayerCard(null);
    setBotCard(null);
    setGameStatus("playing");
    setWinner("");
    setRoundWinner("");
    setIsPlaying(false);
    setIsWar(false);
    setCardsAtStake([]);
    setWarDepth(0);
    setLastCardsWon(0);
  };

  const playRound = () => {
    if (playerDeck.length === 0 || botDeck.length === 0 || isPlaying) return;

    setIsPlaying(true);
    
    // Check if we have enough cards for war (need at least 4 cards each)
    if (isWar && (playerDeck.length < 4 || botDeck.length < 4)) {
      // Not enough cards for war - whoever has fewer cards loses
      if (playerDeck.length < botDeck.length) {
        endGame("bot");
      } else {
        endGame("player");
      }
      setIsPlaying(false);
      return;
    }

    let currentPlayerDeck = [...playerDeck];
    let currentBotDeck = [...botDeck];
    let currentCardsAtStake = [...cardsAtStake];

    let playerWarCard: CardType;
    let botWarCard: CardType;

    if (isWar) {
      // In War: each player puts down 4 cards (3 face down, 1 face up)
      const playerWarCards = currentPlayerDeck.splice(0, 4);
      const botWarCards = currentBotDeck.splice(0, 4);
      
      // Add all war cards to stakes
      currentCardsAtStake.push(...playerWarCards, ...botWarCards);
      
      // The 4th card (index 3) is the one we compare
      playerWarCard = playerWarCards[3];
      botWarCard = botWarCards[3];
    } else {
      // Regular round: each player draws one card
      playerWarCard = currentPlayerDeck.shift()!;
      botWarCard = currentBotDeck.shift()!;
      
      // These cards are at stake
      currentCardsAtStake = [playerWarCard, botWarCard];
    }
    
    setPlayerCard(playerWarCard);
    setBotCard(botWarCard);
    setCardsAtStake(currentCardsAtStake);

    setTimeout(() => {
      if (playerWarCard.numValue > botWarCard.numValue) {
        // Player wins - gets all cards at stake
        const newPlayerDeck = [...currentPlayerDeck, ...currentCardsAtStake];
        setPlayerDeck(newPlayerDeck);
        setBotDeck(currentBotDeck);
        setRoundWinner("player");
        setScores(prev => ({ ...prev, player: prev.player + 1 }));
        setLastCardsWon(currentCardsAtStake.length);
        setIsWar(false);
        setWarDepth(0);
        setCardsAtStake([]);
        
        toast({
          title: "You Won!",
          description: `You collected ${currentCardsAtStake.length} cards!`,
        });
      } else if (botWarCard.numValue > playerWarCard.numValue) {
        // Bot wins - gets all cards at stake
        const newBotDeck = [...currentBotDeck, ...currentCardsAtStake];
        setBotDeck(newBotDeck);
        setPlayerDeck(currentPlayerDeck);
        setRoundWinner("bot");
        setScores(prev => ({ ...prev, bot: prev.bot + 1 }));
        setLastCardsWon(currentCardsAtStake.length);
        setIsWar(false);
        setWarDepth(0);
        setCardsAtStake([]);
        
        toast({
          title: "Bot Won!",
          description: `Bot collected ${currentCardsAtStake.length} cards!`,
        });
      } else {
        // Another tie - escalate to War or continue War
        setPlayerDeck(currentPlayerDeck);
        setBotDeck(currentBotDeck);
        setRoundWinner("tie");
        setIsWar(true);
        setWarDepth(prev => prev + 1);
        setCardsAtStake(currentCardsAtStake);
        
        toast({
          title: "WAR!",
          description: warDepth > 0 ? `Double War! ${currentCardsAtStake.length} cards at stake!` : "Time for War! Each player puts down 4 cards!",
        });
      }

      // Check for game end
      if (currentPlayerDeck.length === 0) {
        endGame("bot");
      } else if (currentBotDeck.length === 0) {
        endGame("player");
      }

      setIsPlaying(false);
    }, 1500);
  };

  const endGame = (gameWinner: string) => {
    setWinner(gameWinner);
    setGameStatus("finished");
    setGameResult(gameWinner === "player" ? "win" : "lose");
    setShowResultDialog(true);
  };

  const resetGame = () => {
    initializeGame();
  };

  const resetScores = () => {
    setScores({ player: 0, bot: 0 });
    resetGame();
  };

  const getCardColor = (suit: string) => {
    return suit === "♥" || suit === "♦" ? "text-red-500" : "text-gray-800";
  };

  const getRoundResult = () => {
    if (!roundWinner) return "";
    if (roundWinner === "player") return `You won this round and collected ${lastCardsWon} cards!`;
    if (roundWinner === "bot") return `Bot won this round and collected ${lastCardsWon} cards!`;
    if (isWar) {
      return `WAR! ${cardsAtStake.length} cards at stake! Each player draws 4 cards!`;
    }
    return "It's a tie - Time for WAR!";
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
            <Zap className="h-3 w-3 mr-1" />
            vs Bot
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Trophy className="h-5 w-5" />
            War Card Battle
          </CardTitle>
          <CardDescription>
            {gameStatus === "playing" && (isWar 
              ? `WAR MODE! ${cardsAtStake.length} cards at stake!` 
              : "Draw cards and see who has the higher value!")}
            {gameStatus === "finished" && `${winner === "player" ? "You" : "Bot"} won the game!`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Scoreboard */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">You</div>
              <div className="text-sm text-muted-foreground">Cards: {playerDeck.length}</div>
              <div className="text-lg font-semibold">Rounds: {scores.player}</div>
            </div>
            <div className="p-3 bg-red-500/10 rounded-lg">
              <div className="text-2xl font-bold text-red-600">Bot</div>
              <div className="text-sm text-muted-foreground">Cards: {botDeck.length}</div>
              <div className="text-lg font-semibold">Rounds: {scores.bot}</div>
            </div>
          </div>

          {/* Cards Display */}
          <div className="grid grid-cols-2 gap-8 max-w-md mx-auto">
            {/* Player Card */}
            <div className="text-center space-y-2">
              <p className="font-medium">Your Card</p>
              <div className="h-32 w-24 mx-auto border-2 border-gray-300 rounded-lg flex flex-col items-center justify-center bg-white shadow-lg">
                {playerCard ? (
                  <>
                    <div className={`text-2xl font-bold ${getCardColor(playerCard.suit)}`}>
                      {playerCard.value}
                    </div>
                    <div className={`text-3xl ${getCardColor(playerCard.suit)}`}>
                      {playerCard.suit}
                    </div>
                  </>
                ) : (
                  <div className="text-gray-400 text-sm">?</div>
                )}
              </div>
            </div>

            {/* Bot Card */}
            <div className="text-center space-y-2">
              <p className="font-medium">Bot's Card</p>
              <div className="h-32 w-24 mx-auto border-2 border-gray-300 rounded-lg flex flex-col items-center justify-center bg-white shadow-lg">
                {botCard ? (
                  <>
                    <div className={`text-2xl font-bold ${getCardColor(botCard.suit)}`}>
                      {botCard.value}
                    </div>
                    <div className={`text-3xl ${getCardColor(botCard.suit)}`}>
                      {botCard.suit}
                    </div>
                  </>
                ) : (
                  <div className="text-gray-400 text-sm">?</div>
                )}
              </div>
            </div>
          </div>

          {/* Round Result */}
          {roundWinner && (
            <div className="text-center">
              <p className={`font-medium ${
                roundWinner === "player" ? "text-green-600" : 
                roundWinner === "bot" ? "text-red-600" : "text-yellow-600"
              }`}>
                {getRoundResult()}
              </p>
            </div>
          )}

          {/* Game Controls */}
          <div className="flex justify-center gap-4">
            {gameStatus === "playing" ? (
                <Button
                  onClick={playRound}
                  disabled={isPlaying || playerDeck.length === 0 || botDeck.length === 0}
                  className="flex items-center gap-2"
                  size="lg"
                >
                  <Zap className="h-4 w-4" />
                  {isPlaying ? (isWar ? "War in progress..." : "Drawing...") : (isWar ? "Continue War!" : "Draw Cards")}
                </Button>
            ) : (
              <Button
                variant="outline"
                onClick={resetGame}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                New Game
              </Button>
            )}
            <Button variant="outline" onClick={resetScores}>
              Reset Scores
            </Button>
          </div>

          {/* Game Instructions */}
          <div className="text-center text-sm text-muted-foreground space-y-1">
            <p>Higher card wins the round and takes both cards!</p>
            <p>On a tie, it's WAR! Each player puts down 3 cards face-down and 1 face-up.</p>
            <p>Highest face-up card wins ALL cards at stake!</p>
            <p>Win by collecting all 52 cards from your opponent.</p>
          </div>
        </CardContent>
      </Card>

      {/* Game Result Dialog */}
      <GameResultDialog
        open={showResultDialog}
        onClose={() => setShowResultDialog(false)}
        result={gameResult}
        title={gameResult === "win" ? "Victory!" : "Defeat!"}
        message={gameResult === "win" 
          ? "You collected all 52 cards! Excellent strategy! 🎉" 
          : "Bot collected all your cards! Try a different approach next time! 🤖"}
        onNewGame={() => {
          resetGame();
          setShowResultDialog(false);
        }}
        onBackToChat={onBack}
        gameName="War"
      />
    </div>
  );
};

export default War;
