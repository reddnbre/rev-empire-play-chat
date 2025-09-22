import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, RotateCcw, Trophy, Heart, CheckCircle, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface EmojiGuessProps {
  onBack: () => void;
}

type Puzzle = {
  emojis: string;
  answer: string;
  hint: string;
};

const puzzles: Puzzle[] = [
  { emojis: "🎬🍿", answer: "movie night", hint: "Entertainment activity" },
  { emojis: "☕️📚", answer: "coffee break", hint: "Study pause" },
  { emojis: "🏠💚", answer: "home sweet home", hint: "Comfort place" },
  { emojis: "🌧️🌈", answer: "rainbow", hint: "Weather phenomenon" },
  { emojis: "🎂🎉", answer: "birthday party", hint: "Celebration event" },
  { emojis: "🚗💨", answer: "road trip", hint: "Travel adventure" },
  { emojis: "🌙⭐", answer: "good night", hint: "Evening greeting" },
  { emojis: "📱💬", answer: "text message", hint: "Digital communication" },
  { emojis: "🎵🎧", answer: "music", hint: "Sound entertainment" },
  { emojis: "🍕❤️", answer: "pizza lover", hint: "Food preference" },
  { emojis: "📝✏️", answer: "homework", hint: "School assignment" },
  { emojis: "🌅🏃", answer: "morning run", hint: "Exercise routine" },
  { emojis: "🛒🥕", answer: "grocery shopping", hint: "Food purchasing" },
  { emojis: "🎮🏆", answer: "video game", hint: "Digital entertainment" },
  { emojis: "📖😴", answer: "bedtime story", hint: "Sleep routine" }
];

const EmojiGuess = ({ onBack }: EmojiGuessProps) => {
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);
  const [userGuess, setUserGuess] = useState("");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [usedPuzzles, setUsedPuzzles] = useState<Set<number>>(new Set());
  const [showHint, setShowHint] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | "">("");

  useEffect(() => {
    getNewPuzzle();
  }, []);

  const getNewPuzzle = () => {
    const availablePuzzles = puzzles.filter((_, index) => !usedPuzzles.has(index));
    
    if (availablePuzzles.length === 0) {
      // All puzzles completed
      toast({
        title: "Congratulations! 🎉",
        description: `You completed all puzzles! Final score: ${score}`,
      });
      setGameOver(true);
      return;
    }

    const randomIndex = Math.floor(Math.random() * availablePuzzles.length);
    const selectedPuzzle = availablePuzzles[randomIndex];
    const originalIndex = puzzles.indexOf(selectedPuzzle);
    
    setCurrentPuzzle(selectedPuzzle);
    setUsedPuzzles(prev => new Set([...prev, originalIndex]));
    setUserGuess("");
    setShowHint(false);
    setFeedback("");
  };

  const checkAnswer = () => {
    if (!currentPuzzle || !userGuess.trim()) return;

    const normalizedGuess = userGuess.toLowerCase().trim();
    const normalizedAnswer = currentPuzzle.answer.toLowerCase();

    if (normalizedGuess === normalizedAnswer) {
      setScore(prev => prev + (showHint ? 1 : 2));
      setFeedback("correct");
      toast({
        title: "Correct! 🎉",
        description: `+${showHint ? 1 : 2} points`,
      });
      setTimeout(() => {
        getNewPuzzle();
      }, 1500);
    } else {
      setFeedback("wrong");
      setLives(prev => {
        const newLives = prev - 1;
        if (newLives <= 0) {
          setGameOver(true);
          toast({
            title: "Game Over!",
            description: `Final score: ${score}`,
            variant: "destructive"
          });
        }
        return newLives;
      });
      setTimeout(() => {
        setFeedback("");
        setUserGuess("");
      }, 1500);
    }
  };

  const useHint = () => {
    setShowHint(true);
  };

  const skipPuzzle = () => {
    setLives(prev => prev - 1);
    if (lives <= 1) {
      setGameOver(true);
      toast({
        title: "Game Over!",
        description: `Final score: ${score}`,
        variant: "destructive"
      });
    } else {
      getNewPuzzle();
    }
  };

  const resetGame = () => {
    setScore(0);
    setLives(3);
    setUsedPuzzles(new Set());
    setGameOver(false);
    setFeedback("");
    getNewPuzzle();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    checkAnswer();
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
            <Heart className="h-3 w-3 mr-1" />
            Solo
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Trophy className="h-5 w-5" />
            Emoji Guess Challenge
          </CardTitle>
          <CardDescription>
            Guess the phrase from the emojis!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{score}</div>
              <div className="text-sm text-muted-foreground">Score</div>
            </div>
            <div className="p-3 bg-red-500/10 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{lives}</div>
              <div className="text-sm text-muted-foreground">Lives</div>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{usedPuzzles.size}</div>
              <div className="text-sm text-muted-foreground">Solved</div>
            </div>
          </div>

          {!gameOver && currentPuzzle && (
            <>
              {/* Emoji Display */}
              <div className="text-center">
                <div className="text-6xl mb-4 p-8 bg-accent/20 rounded-lg">
                  {currentPuzzle.emojis}
                </div>
                
                {showHint && (
                  <div className="text-sm text-muted-foreground mb-4">
                    💡 Hint: {currentPuzzle.hint}
                  </div>
                )}
              </div>

              {/* Answer Input */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={userGuess}
                    onChange={(e) => setUserGuess(e.target.value)}
                    placeholder="Type your guess here..."
                    className={`flex-1 ${
                      feedback === "correct" ? "border-green-500 bg-green-50" :
                      feedback === "wrong" ? "border-red-500 bg-red-50" : ""
                    }`}
                    disabled={feedback !== ""}
                  />
                  <Button 
                    type="submit" 
                    disabled={!userGuess.trim() || feedback !== ""}
                  >
                    {feedback === "correct" ? <CheckCircle className="h-4 w-4" /> :
                     feedback === "wrong" ? <XCircle className="h-4 w-4" /> :
                     "Guess"}
                  </Button>
                </div>
              </form>

              {/* Action Buttons */}
              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={useHint}
                  disabled={showHint || feedback !== ""}
                >
                  💡 Use Hint (-1 point)
                </Button>
                <Button
                  variant="outline"
                  onClick={skipPuzzle}
                  disabled={feedback !== ""}
                >
                  Skip (-1 life)
                </Button>
              </div>

              {/* Feedback */}
              {feedback && (
                <div className="text-center">
                  {feedback === "correct" && (
                    <p className="text-green-600 font-medium">
                      ✅ Correct! The answer was: "{currentPuzzle.answer}"
                    </p>
                  )}
                  {feedback === "wrong" && (
                    <p className="text-red-600 font-medium">
                      ❌ Wrong! Try again...
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {gameOver && (
            <div className="text-center space-y-4">
              <div className="text-4xl mb-4">🎮</div>
              <h3 className="text-xl font-bold">Game Over!</h3>
              <p className="text-muted-foreground">
                Final Score: <span className="font-bold text-primary">{score}</span>
              </p>
              <Button onClick={resetGame} className="flex items-center gap-2 mx-auto">
                <RotateCcw className="h-4 w-4" />
                Play Again
              </Button>
            </div>
          )}

          {/* Progress */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(usedPuzzles.size / puzzles.length) * 100}%` }}
            />
          </div>

          {/* Instructions */}
          <div className="text-center text-sm text-muted-foreground space-y-1">
            <p>Decode the emoji combination to reveal the hidden phrase!</p>
            <p>Get 2 points for correct guess, 1 point with hint used.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmojiGuess;