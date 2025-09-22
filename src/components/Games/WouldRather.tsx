import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, RotateCcw, Trophy, Users, Vote } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface WouldRatherProps {
  onBack: () => void;
}

type Question = {
  id: number;
  optionA: string;
  optionB: string;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
};

const questions: Question[] = [
  {
    id: 1,
    optionA: "Have the ability to fly",
    optionB: "Have the ability to read minds",
    category: "Superpowers",
    difficulty: "Easy"
  },
  {
    id: 2,
    optionA: "Live without the internet for a year",
    optionB: "Live without your phone for a year",
    category: "Technology",
    difficulty: "Medium"
  },
  {
    id: 3,
    optionA: "Always be 10 minutes late",
    optionB: "Always be 20 minutes early",
    category: "Time",
    difficulty: "Easy"
  },
  {
    id: 4,
    optionA: "Have unlimited money",
    optionB: "Have unlimited time",
    category: "Life",
    difficulty: "Hard"
  },
  {
    id: 5,
    optionA: "Be able to speak every language",
    optionB: "Be able to talk to animals",
    category: "Communication",
    difficulty: "Medium"
  },
  {
    id: 6,
    optionA: "Live in a world without music",
    optionB: "Live in a world without movies",
    category: "Entertainment",
    difficulty: "Medium"
  },
  {
    id: 7,
    optionA: "Be famous but poor",
    optionB: "Be rich but unknown",
    category: "Fame",
    difficulty: "Hard"
  },
  {
    id: 8,
    optionA: "Have pizza as your only food forever",
    optionB: "Have ice cream as your only food forever",
    category: "Food",
    difficulty: "Easy"
  },
  {
    id: 9,
    optionA: "Live in the past (100 years ago)",
    optionB: "Live in the future (100 years from now)",
    category: "Time Travel",
    difficulty: "Medium"
  },
  {
    id: 10,
    optionA: "Never be able to lie",
    optionB: "Never be able to tell the truth",
    category: "Honesty",
    difficulty: "Hard"
  },
  {
    id: 11,
    optionA: "Have to sing everything you say",
    optionB: "Have to dance everywhere you go",
    category: "Silly",
    difficulty: "Easy"
  },
  {
    id: 12,
    optionA: "Be invisible when you want",
    optionB: "Be able to teleport anywhere",
    category: "Superpowers",
    difficulty: "Medium"
  }
];

const WouldRather = ({ onBack }: WouldRatherProps) => {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, "A" | "B">>({});
  const [gameStats, setGameStats] = useState({ totalAnswered: 0, optionACount: 0, optionBCount: 0 });
  const [gameFinished, setGameFinished] = useState(false);
  const [usedQuestions, setUsedQuestions] = useState<Set<number>>(new Set());

  useEffect(() => {
    getRandomQuestion();
  }, []);

  const getRandomQuestion = () => {
    const availableQuestions = questions.filter(q => !usedQuestions.has(q.id));
    
    if (availableQuestions.length === 0) {
      // All questions answered
      setGameFinished(true);
      toast({
        title: "All Questions Answered! 🎉",
        description: `You completed all ${questions.length} would you rather questions!`,
      });
      return;
    }

    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const selectedQuestion = availableQuestions[randomIndex];
    
    setCurrentQuestion(selectedQuestion);
    setUsedQuestions(prev => new Set([...prev, selectedQuestion.id]));
  };

  const handleAnswer = (choice: "A" | "B") => {
    if (!currentQuestion) return;

    const newAnswers = { ...answers, [currentQuestion.id]: choice };
    setAnswers(newAnswers);
    
    const newStats = {
      totalAnswered: gameStats.totalAnswered + 1,
      optionACount: gameStats.optionACount + (choice === "A" ? 1 : 0),
      optionBCount: gameStats.optionBCount + (choice === "B" ? 1 : 0)
    };
    setGameStats(newStats);

    const selectedOption = choice === "A" ? currentQuestion.optionA : currentQuestion.optionB;
    
    toast({
      title: "Choice Recorded! ✅",
      description: `You chose: ${selectedOption}`,
    });

    // Move to next question after a short delay
    setTimeout(() => {
      setQuestionIndex(prev => prev + 1);
      getRandomQuestion();
    }, 1500);
  };

  const skipQuestion = () => {
    toast({
      title: "Question Skipped ⏭️",
      description: "Moving to the next question...",
    });
    
    setTimeout(() => {
      setQuestionIndex(prev => prev + 1);
      getRandomQuestion();
    }, 500);
  };

  const resetGame = () => {
    setQuestionIndex(0);
    setAnswers({});
    setGameStats({ totalAnswered: 0, optionACount: 0, optionBCount: 0 });
    setGameFinished(false);
    setUsedQuestions(new Set());
    getRandomQuestion();
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "bg-green-500/20 text-green-600";
      case "Medium": return "bg-yellow-500/20 text-yellow-600";
      case "Hard": return "bg-red-500/20 text-red-600";
      default: return "bg-gray-500/20 text-gray-600";
    }
  };

  const getProgressPercentage = () => {
    return (usedQuestions.size / questions.length) * 100;
  };

  const getPreferenceText = () => {
    if (gameStats.totalAnswered === 0) return "No preferences yet";
    if (gameStats.optionACount > gameStats.optionBCount) return "You prefer first options";
    if (gameStats.optionBCount > gameStats.optionACount) return "You prefer second options";
    return "You're perfectly balanced";
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
            <Users className="h-3 w-3 mr-1" />
            Party Game
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Trophy className="h-5 w-5" />
            Would You Rather?
          </CardTitle>
          <CardDescription>
            Make tough choices and discover your preferences!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!gameFinished ? (
            <>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{gameStats.totalAnswered}</div>
                  <div className="text-sm text-muted-foreground">Answered</div>
                </div>
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{gameStats.optionACount}</div>
                  <div className="text-sm text-muted-foreground">First Options</div>
                </div>
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{gameStats.optionBCount}</div>
                  <div className="text-sm text-muted-foreground">Second Options</div>
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{usedQuestions.size} / {questions.length}</span>
                </div>
                <Progress value={getProgressPercentage()} className="w-full" />
              </div>

              {/* Current Question */}
              {currentQuestion && (
                <div className="space-y-6">
                  <div className="text-center space-y-4">
                    <div className="flex justify-center gap-2">
                      <Badge variant="secondary">{currentQuestion.category}</Badge>
                      <Badge className={getDifficultyColor(currentQuestion.difficulty)}>
                        {currentQuestion.difficulty}
                      </Badge>
                    </div>
                    <h3 className="text-2xl font-bold">Would You Rather...</h3>
                  </div>

                  {/* Options */}
                  <div className="grid gap-4">
                    <Button
                      variant="outline"
                      onClick={() => handleAnswer("A")}
                      className="p-6 h-auto text-left whitespace-normal bg-blue-50 hover:bg-blue-100 border-blue-200"
                      size="lg"
                    >
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                          A
                        </div>
                        <div className="text-lg">{currentQuestion.optionA}</div>
                      </div>
                    </Button>

                    <div className="text-center text-2xl font-bold text-muted-foreground">OR</div>

                    <Button
                      variant="outline"
                      onClick={() => handleAnswer("B")}
                      className="p-6 h-auto text-left whitespace-normal bg-red-50 hover:bg-red-100 border-red-200"
                      size="lg"
                    >
                      <div className="flex items-start gap-3">
                        <div className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                          B
                        </div>
                        <div className="text-lg">{currentQuestion.optionB}</div>
                      </div>
                    </Button>
                  </div>

                  {/* Skip Option */}
                  <div className="text-center">
                    <Button
                      variant="ghost"
                      onClick={skipQuestion}
                      className="text-muted-foreground"
                    >
                      Skip This Question ⏭️
                    </Button>
                  </div>
                </div>
              )}

              {/* Preference Insight */}
              {gameStats.totalAnswered > 0 && (
                <div className="text-center p-4 bg-accent/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">Your preference pattern:</p>
                  <p className="font-medium">{getPreferenceText()}</p>
                </div>
              )}
            </>
          ) : (
            /* Game Finished Screen */
            <div className="text-center space-y-6">
              <div className="text-6xl mb-4">🎊</div>
              <h3 className="text-2xl font-bold">All Questions Completed!</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-500/10 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{gameStats.optionACount}</div>
                    <div className="text-sm text-muted-foreground">First Options Chosen</div>
                  </div>
                  <div className="p-4 bg-red-500/10 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{gameStats.optionBCount}</div>
                    <div className="text-sm text-muted-foreground">Second Options Chosen</div>
                  </div>
                </div>
                <p className="text-lg font-medium">{getPreferenceText()}</p>
              </div>
            </div>
          )}

          {/* Game Controls */}
          <div className="flex justify-center gap-4">
            <Button
              variant="outline"
              onClick={resetGame}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Start Over
            </Button>
          </div>

          {/* Instructions */}
          <div className="text-center text-sm text-muted-foreground space-y-1">
            <p>Choose between two options and discover your decision patterns!</p>
            <p>Perfect for parties or getting to know yourself better.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WouldRather;