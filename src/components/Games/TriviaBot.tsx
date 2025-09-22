import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, RotateCcw, Trophy, Brain, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface TriviaBotProps {
  onBack: () => void;
}

type Question = {
  question: string;
  options: string[];
  correct: number;
  category: string;
};

const questions: Question[] = [
  {
    question: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Rome"],
    correct: 2,
    category: "Geography"
  },
  {
    question: "Which programming language was created by Guido van Rossum?",
    options: ["Java", "Python", "JavaScript", "C++"],
    correct: 1,
    category: "Technology"
  },
  {
    question: "What is the largest mammal in the world?",
    options: ["Elephant", "Blue Whale", "Giraffe", "Rhinoceros"],
    correct: 1,
    category: "Nature"
  },
  {
    question: "In which year did World War II end?",
    options: ["1944", "1945", "1946", "1947"],
    correct: 1,
    category: "History"
  },
  {
    question: "What is the chemical symbol for gold?",
    options: ["Go", "Gd", "Au", "Ag"],
    correct: 2,
    category: "Science"
  },
  {
    question: "Which planet is closest to the Sun?",
    options: ["Venus", "Mercury", "Earth", "Mars"],
    correct: 1,
    category: "Science"
  },
  {
    question: "Who wrote 'Romeo and Juliet'?",
    options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
    correct: 1,
    category: "Literature"
  },
  {
    question: "What is the square root of 64?",
    options: ["6", "7", "8", "9"],
    correct: 2,
    category: "Mathematics"
  },
  {
    question: "Which country invented pizza?",
    options: ["Greece", "France", "Spain", "Italy"],
    correct: 3,
    category: "Culture"
  },
  {
    question: "What does 'HTML' stand for?",
    options: ["HyperText Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "HyperText Modern Language"],
    correct: 0,
    category: "Technology"
  }
];

const TriviaBot = ({ onBack }: TriviaBotProps) => {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isAnswering, setIsAnswering] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  useEffect(() => {
    loadQuestion();
  }, []);

  useEffect(() => {
    if (timeLeft > 0 && !isAnswering && !gameOver) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isAnswering) {
      handleTimeout();
    }
  }, [timeLeft, isAnswering, gameOver]);

  const loadQuestion = () => {
    if (currentQuestionIndex >= questions.length) {
      endGame();
      return;
    }

    setCurrentQuestion(questions[currentQuestionIndex]);
    setTimeLeft(15);
    setIsAnswering(false);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const handleAnswer = (answerIndex: number) => {
    if (isAnswering || showResult) return;

    setIsAnswering(true);
    setSelectedAnswer(answerIndex);
    
    const correct = answerIndex === currentQuestion?.correct;
    
    if (correct) {
      const points = Math.max(1, Math.floor(timeLeft / 2));
      setScore(prev => prev + points);
      setStreak(prev => {
        const newStreak = prev + 1;
        setBestStreak(current => Math.max(current, newStreak));
        return newStreak;
      });
      toast({
        title: "Correct! 🎉",
        description: `+${points} points (${timeLeft}s left)`,
      });
    } else {
      setStreak(0);
      toast({
        title: "Wrong Answer 😞",
        description: `Correct answer: ${currentQuestion?.options[currentQuestion.correct]}`,
        variant: "destructive"
      });
    }

    setShowResult(true);

    setTimeout(() => {
      setCurrentQuestionIndex(prev => prev + 1);
      loadQuestion();
    }, 2000);
  };

  const handleTimeout = () => {
    setIsAnswering(true);
    setStreak(0);
    setShowResult(true);
    
    toast({
      title: "Time's Up! ⏰",
      description: `Correct answer: ${currentQuestion?.options[currentQuestion?.correct || 0]}`,
      variant: "destructive"
    });

    setTimeout(() => {
      setCurrentQuestionIndex(prev => prev + 1);
      loadQuestion();
    }, 2000);
  };

  const endGame = () => {
    setGameOver(true);
    toast({
      title: "Quiz Complete! 🏆",
      description: `Final Score: ${score} points`,
    });
  };

  const resetGame = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setStreak(0);
    setGameOver(false);
    loadQuestion();
  };

  const getProgressPercentage = () => {
    return ((currentQuestionIndex) / questions.length) * 100;
  };

  const getButtonColor = (index: number) => {
    if (!showResult) return "outline";
    if (index === currentQuestion?.correct) return "default"; // Correct answer
    if (index === selectedAnswer && index !== currentQuestion?.correct) return "destructive"; // Wrong selected
    return "secondary";
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
            Trivia
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Trophy className="h-5 w-5" />
            Trivia Challenge
          </CardTitle>
          <CardDescription>
            Answer questions quickly to earn more points!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!gameOver ? (
            <>
              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{score}</div>
                  <div className="text-sm text-muted-foreground">Score</div>
                </div>
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{streak}</div>
                  <div className="text-sm text-muted-foreground">Streak</div>
                </div>
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{bestStreak}</div>
                  <div className="text-sm text-muted-foreground">Best</div>
                </div>
                <div className="p-3 bg-orange-500/10 rounded-lg">
                  <div className={`text-2xl font-bold flex items-center justify-center gap-1 ${
                    timeLeft <= 5 ? "text-red-600" : "text-orange-600"
                  }`}>
                    <Clock className="h-4 w-4" />
                    {timeLeft}
                  </div>
                  <div className="text-sm text-muted-foreground">Time</div>
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{currentQuestionIndex + 1} / {questions.length}</span>
                </div>
                <Progress value={getProgressPercentage()} className="w-full" />
              </div>

              {/* Question */}
              {currentQuestion && (
                <div className="space-y-6">
                  <div className="text-center">
                    <Badge variant="secondary" className="mb-4">
                      {currentQuestion.category}
                    </Badge>
                    <h3 className="text-xl font-semibold mb-4">
                      {currentQuestion.question}
                    </h3>
                  </div>

                  {/* Answer Options */}
                  <div className="grid gap-3">
                    {currentQuestion.options.map((option, index) => (
                      <Button
                        key={index}
                        variant={getButtonColor(index)}
                        onClick={() => handleAnswer(index)}
                        disabled={isAnswering}
                        className="p-4 h-auto text-left justify-start whitespace-normal"
                        size="lg"
                      >
                        <span className="font-medium mr-3">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        {option}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Game Over Screen */
            <div className="text-center space-y-6">
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-2xl font-bold">Quiz Complete!</h3>
              <div className="space-y-2">
                <p className="text-lg">
                  Final Score: <span className="font-bold text-primary">{score}</span> points
                </p>
                <p className="text-muted-foreground">
                  Best Streak: {bestStreak} correct answers
                </p>
                <p className="text-muted-foreground">
                  Questions Answered: {questions.length}
                </p>
              </div>
              <Button onClick={resetGame} className="flex items-center gap-2 mx-auto">
                <RotateCcw className="h-4 w-4" />
                Play Again
              </Button>
            </div>
          )}

          {/* Instructions */}
          <div className="text-center text-sm text-muted-foreground space-y-1">
            <p>Answer quickly to earn bonus points!</p>
            <p>Build streaks for better performance tracking.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TriviaBot;