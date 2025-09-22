import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RotateCcw, Trophy, Users, Brain } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import GameResultDialog from "./GameResultDialog";

interface HangmanProps {
  onBack: () => void;
}

type GameStatus = "playing" | "won" | "lost";

const words = [
  "JAVASCRIPT", "REACT", "COMPUTER", "PROGRAMMING", "CHALLENGE", 
  "VICTORY", "PUZZLE", "MYSTERY", "ADVENTURE", "TREASURE",
  "KEYBOARD", "MONITOR", "BROWSER", "FUNCTION", "VARIABLE"
];

const Hangman = ({ onBack }: HangmanProps) => {
  const [currentWord, setCurrentWord] = useState("");
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [wrongGuesses, setWrongGuesses] = useState<string[]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>("playing");
  const [scores, setScores] = useState({ wins: 0, losses: 0 });
  const [gameMode, setGameMode] = useState<"pvp" | "bot">("bot");
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [gameResult, setGameResult] = useState<"win" | "lose">("win");
  
  const maxWrongGuesses = 6;
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  useEffect(() => {
    startNewGame();
  }, []);

  useEffect(() => {
    checkGameEnd();
  }, [guessedLetters, wrongGuesses, currentWord]);

  const startNewGame = () => {
    const word = words[Math.floor(Math.random() * words.length)];
    setCurrentWord(word);
    setGuessedLetters([]);
    setWrongGuesses([]);
    setGameStatus("playing");
  };

  const checkGameEnd = () => {
    if (currentWord && wrongGuesses.length >= maxWrongGuesses) {
      setGameStatus("lost");
      setScores(prev => ({ ...prev, losses: prev.losses + 1 }));
      setGameResult("lose");
      setShowResultDialog(true);
    } else if (currentWord && currentWord.split("").every(letter => guessedLetters.includes(letter))) {
      setGameStatus("won");
      setScores(prev => ({ ...prev, wins: prev.wins + 1 }));
      setGameResult("win");
      setShowResultDialog(true);
    }
  };

  const guessLetter = (letter: string) => {
    if (guessedLetters.includes(letter) || wrongGuesses.includes(letter) || gameStatus !== "playing") {
      return;
    }

    if (currentWord.includes(letter)) {
      setGuessedLetters([...guessedLetters, letter]);
    } else {
      setWrongGuesses([...wrongGuesses, letter]);
    }
  };

  const getDisplayWord = () => {
    return currentWord
      .split("")
      .map(letter => guessedLetters.includes(letter) ? letter : "_")
      .join(" ");
  };

  const getHangmanDisplay = () => {
    const stages = [
      "  +---+\n  |   |\n      |\n      |\n      |\n      |\n=========",
      "  +---+\n  |   |\n  O   |\n      |\n      |\n      |\n=========",
      "  +---+\n  |   |\n  O   |\n  |   |\n      |\n      |\n=========",
      "  +---+\n  |   |\n  O   |\n /|   |\n      |\n      |\n=========",
      "  +---+\n  |   |\n  O   |\n /|\\  |\n      |\n      |\n=========",
      "  +---+\n  |   |\n  O   |\n /|\\  |\n /    |\n      |\n=========",
      "  +---+\n  |   |\n  O   |\n /|\\  |\n / \\  |\n      |\n========="
    ];
    return stages[wrongGuesses.length] || stages[0];
  };

  const resetScores = () => {
    setScores({ wins: 0, losses: 0 });
    startNewGame();
    setShowResultDialog(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Games
        </Button>
        <div className="flex gap-2">
          <Badge variant={gameMode === "bot" ? "default" : "secondary"}>
            <Brain className="h-3 w-3 mr-1" />
            Solo
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Trophy className="h-5 w-5" />
            Hangman Challenge
          </CardTitle>
          <CardDescription>
            {gameStatus === "playing" && `Guess the word! ${maxWrongGuesses - wrongGuesses.length} wrong guesses left`}
            {gameStatus === "won" && "You won! Great job!"}
            {gameStatus === "lost" && "You lost! Try again!"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Scoreboard */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <div className="text-2xl font-bold text-green-600">W</div>
              <div className="text-sm text-muted-foreground">Wins</div>
              <div className="text-lg font-semibold">{scores.wins}</div>
            </div>
            <div className="p-3 bg-red-500/10 rounded-lg">
              <div className="text-2xl font-bold text-red-600">L</div>
              <div className="text-sm text-muted-foreground">Losses</div>
              <div className="text-lg font-semibold">{scores.losses}</div>
            </div>
          </div>

          {/* Hangman Display */}
          <div className="text-center">
            <pre className="text-sm font-mono bg-muted p-4 rounded-lg inline-block">
              {getHangmanDisplay()}
            </pre>
          </div>

          {/* Current Word */}
          <div className="text-center">
            <div className="text-3xl font-mono font-bold tracking-wider p-4 bg-accent/20 rounded-lg">
              {getDisplayWord()}
            </div>
          </div>

          {/* Wrong Guesses */}
          {wrongGuesses.length > 0 && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Wrong guesses:</p>
              <div className="text-red-600 font-mono text-lg">
                {wrongGuesses.join(", ")}
              </div>
            </div>
          )}

          {/* Letter Buttons */}
          <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
            {alphabet.map((letter) => {
              const isGuessed = guessedLetters.includes(letter) || wrongGuesses.includes(letter);
              const isCorrect = guessedLetters.includes(letter);
              return (
                <Button
                  key={letter}
                  variant={isGuessed ? (isCorrect ? "default" : "destructive") : "outline"}
                  size="sm"
                  onClick={() => guessLetter(letter)}
                  disabled={isGuessed || gameStatus !== "playing"}
                  className="h-10 w-full"
                >
                  {letter}
                </Button>
              );
            })}
          </div>

          {/* Game Controls */}
          <div className="flex justify-center gap-4">
            <Button
              variant="outline"
              onClick={startNewGame}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              New Word
            </Button>
            <Button variant="outline" onClick={resetScores}>
              Reset Score
            </Button>
          </div>

          {/* Game Instructions */}
          <div className="text-center text-sm text-muted-foreground space-y-1">
            <p>Guess letters to reveal the hidden word!</p>
            <p>You have {maxWrongGuesses} wrong guesses before the game ends.</p>
          </div>
        </CardContent>
      </Card>

      {/* Game Result Dialog */}
      <GameResultDialog
        open={showResultDialog}
        onClose={() => setShowResultDialog(false)}
        result={gameResult}
        title={gameResult === "win" ? "Word Guessed!" : "Game Over!"}
        message={gameResult === "win" 
          ? `Congratulations! You guessed "${currentWord}" correctly! 🎉` 
          : `The word was "${currentWord}". Better luck next time! 😔`}
        onNewGame={() => {
          startNewGame();
          setShowResultDialog(false);
        }}
        onBackToChat={onBack}
        gameName="Hangman"
      />
    </div>
  );
};

export default Hangman;