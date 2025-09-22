import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RotateCcw, Trophy, Shuffle, Brain } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface NumberPuzzleProps {
  onBack: () => void;
}

type GameStatus = "playing" | "won";

const NumberPuzzle = ({ onBack }: NumberPuzzleProps) => {
  const [board, setBoard] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [gameStatus, setGameStatus] = useState<GameStatus>("playing");
  const [scores, setScores] = useState({ wins: 0, bestMoves: Infinity });
  const [isShuffling, setIsShuffling] = useState(false);

  const solvedBoard = [1, 2, 3, 4, 5, 6, 7, 8, 0]; // 0 represents empty space

  useEffect(() => {
    initializeGame();
  }, []);

  useEffect(() => {
    if (board.length > 0 && JSON.stringify(board) === JSON.stringify(solvedBoard)) {
      if (gameStatus === "playing") {
        endGame();
      }
    }
  }, [board, gameStatus]);

  const initializeGame = () => {
    // Start with solved board and shuffle
    let newBoard = [...solvedBoard];
    
    // Shuffle the board with valid moves to ensure solvability
    for (let i = 0; i < 100; i++) {
      const emptyIndex = newBoard.indexOf(0);
      const validMoves = getValidMoves(emptyIndex);
      const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
      [newBoard[emptyIndex], newBoard[randomMove]] = [newBoard[randomMove], newBoard[emptyIndex]];
    }
    
    setBoard(newBoard);
    setMoves(0);
    setGameStatus("playing");
  };

  const getValidMoves = (emptyIndex: number): number[] => {
    const validMoves = [];
    const row = Math.floor(emptyIndex / 3);
    const col = emptyIndex % 3;

    // Up
    if (row > 0) validMoves.push(emptyIndex - 3);
    // Down
    if (row < 2) validMoves.push(emptyIndex + 3);
    // Left
    if (col > 0) validMoves.push(emptyIndex - 1);
    // Right
    if (col < 2) validMoves.push(emptyIndex + 1);

    return validMoves;
  };

  const endGame = () => {
    setGameStatus("won");
    setScores(prev => ({
      wins: prev.wins + 1,
      bestMoves: Math.min(prev.bestMoves, moves)
    }));
    
    toast({
      title: "Puzzle Solved!",
      description: `Congratulations! You solved it in ${moves} moves! 🎉`,
    });
  };

  const moveTile = (index: number) => {
    if (gameStatus !== "playing") return;

    const emptyIndex = board.indexOf(0);
    const validMoves = getValidMoves(emptyIndex);

    if (validMoves.includes(index)) {
      const newBoard = [...board];
      [newBoard[emptyIndex], newBoard[index]] = [newBoard[index], newBoard[emptyIndex]];
      setBoard(newBoard);
      setMoves(prev => prev + 1);
    }
  };

  const shuffleBoard = async () => {
    setIsShuffling(true);
    
    // Animate shuffle
    for (let i = 0; i < 10; i++) {
      const emptyIndex = board.indexOf(0);
      const validMoves = getValidMoves(emptyIndex);
      const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
      
      setBoard(prev => {
        const newBoard = [...prev];
        [newBoard[emptyIndex], newBoard[randomMove]] = [newBoard[randomMove], newBoard[emptyIndex]];
        return newBoard;
      });
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setMoves(0);
    setGameStatus("playing");
    setIsShuffling(false);
  };

  const resetScores = () => {
    setScores({ wins: 0, bestMoves: Infinity });
    initializeGame();
  };

  const getTileColor = (number: number) => {
    if (number === 0) return "bg-gray-100 border-2 border-dashed border-gray-300";
    return "bg-primary/10 hover:bg-primary/20 border-2 border-primary/30 cursor-pointer";
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
            Number Slide Puzzle
          </CardTitle>
          <CardDescription>
            {gameStatus === "playing" && `Arrange numbers 1-8 in order. Moves: ${moves}`}
            {gameStatus === "won" && `Puzzle solved in ${moves} moves!`}
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
              <div className="text-2xl font-bold text-green-600">{scores.wins}</div>
              <div className="text-sm text-muted-foreground">Wins</div>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {scores.bestMoves === Infinity ? "-" : scores.bestMoves}
              </div>
              <div className="text-sm text-muted-foreground">Best Score</div>
            </div>
          </div>

          {/* Game Board */}
          <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto bg-gray-200 p-4 rounded-lg">
            {board.map((number, index) => (
              <div
                key={index}
                className={`
                  h-20 w-20 flex items-center justify-center text-2xl font-bold 
                  rounded-lg transition-all duration-200 select-none
                  ${getTileColor(number)}
                  ${number === 0 ? '' : 'active:scale-95 transform'}
                `}
                onClick={() => moveTile(index)}
              >
                {number || ""}
              </div>
            ))}
          </div>

          {/* Target Pattern */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Target arrangement:</p>
            <div className="grid grid-cols-3 gap-1 max-w-[120px] mx-auto">
              {solvedBoard.map((number, index) => (
                <div
                  key={index}
                  className="h-8 w-8 flex items-center justify-center text-xs font-bold bg-green-100 border border-green-300 rounded"
                >
                  {number || ""}
                </div>
              ))}
            </div>
          </div>

          {/* Game Controls */}
          <div className="flex justify-center gap-4">
            <Button
              variant="outline"
              onClick={shuffleBoard}
              disabled={isShuffling}
              className="flex items-center gap-2"
            >
              <Shuffle className="h-4 w-4" />
              {isShuffling ? "Shuffling..." : "Shuffle"}
            </Button>
            <Button
              variant="outline"
              onClick={initializeGame}
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
            <p>Slide the numbered tiles to arrange them in order 1-8!</p>
            <p>Click on a tile next to the empty space to move it.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NumberPuzzle;