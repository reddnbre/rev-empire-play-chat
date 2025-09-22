import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RotateCcw, Trophy, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface TicTacToeProps {
  onBack: () => void;
}

type Player = "X" | "O" | null;
type Board = Player[];
type GameStatus = "waiting" | "playing" | "finished";

const TicTacToe = ({ onBack }: TicTacToeProps) => {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>("X");
  const [gameStatus, setGameStatus] = useState<GameStatus>("playing");
  const [winner, setWinner] = useState<Player>(null);
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });
  const [gameMode, setGameMode] = useState<"pvp" | "bot">("pvp");

  const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
  ];

  useEffect(() => {
    checkWinner();
  }, [board]);

  useEffect(() => {
    if (gameMode === "bot" && currentPlayer === "O" && gameStatus === "playing") {
      const timer = setTimeout(() => {
        makeBotMove();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentPlayer, gameMode, gameStatus]);

  const checkWinner = () => {
    for (const combination of winningCombinations) {
      const [a, b, c] = combination;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        setWinner(board[a]);
        setGameStatus("finished");
        setScores(prev => ({ 
          ...prev, 
          [board[a]!]: prev[board[a] as "X" | "O"] + 1 
        }));
        toast({
          title: `Player ${board[a]} wins!`,
          description: "🎉 Congratulations!",
        });
        return;
      }
    }

    if (!board.includes(null)) {
      setWinner(null);
      setGameStatus("finished");
      setScores(prev => ({ ...prev, draws: prev.draws + 1 }));
      toast({
        title: "It's a draw!",
        description: "Good game! Try again?",
      });
    }
  };

  const makeBotMove = () => {
    const availableSpots = board
      .map((spot, index) => spot === null ? index : null)
      .filter(spot => spot !== null) as number[];

    if (availableSpots.length === 0) return;

    // Simple AI: Try to win, then block, then random
    let bestMove = getBestMove();
    if (bestMove === -1) {
      bestMove = availableSpots[Math.floor(Math.random() * availableSpots.length)];
    }

    const newBoard = [...board];
    newBoard[bestMove] = "O";
    setBoard(newBoard);
    setCurrentPlayer("X");
  };

  const getBestMove = (): number => {
    // Try to win
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        const testBoard = [...board];
        testBoard[i] = "O";
        if (checkWinCondition(testBoard, "O")) return i;
      }
    }

    // Try to block player from winning
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        const testBoard = [...board];
        testBoard[i] = "X";
        if (checkWinCondition(testBoard, "X")) return i;
      }
    }

    return -1;
  };

  const checkWinCondition = (testBoard: Board, player: Player): boolean => {
    return winningCombinations.some(combination => {
      const [a, b, c] = combination;
      return testBoard[a] === player && testBoard[b] === player && testBoard[c] === player;
    });
  };

  const makeMove = (index: number) => {
    if (board[index] || gameStatus !== "playing") return;

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);
    setCurrentPlayer(currentPlayer === "X" ? "O" : "X");
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer("X");
    setGameStatus("playing");
    setWinner(null);
  };

  const resetScores = () => {
    setScores({ X: 0, O: 0, draws: 0 });
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
          <Badge variant={gameMode === "pvp" ? "default" : "secondary"}>
            <Users className="h-3 w-3 mr-1" />
            PvP
          </Badge>
          <Badge variant={gameMode === "bot" ? "default" : "secondary"}>
            Bot
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Trophy className="h-5 w-5" />
            TicTacToe Battle
          </CardTitle>
          <CardDescription>
            {gameStatus === "playing" && `Player ${currentPlayer}'s turn`}
            {gameStatus === "finished" && winner && `Player ${winner} wins!`}
            {gameStatus === "finished" && !winner && "It's a draw!"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Scoreboard */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">X</div>
              <div className="text-sm text-muted-foreground">Player 1</div>
              <div className="text-lg font-semibold">{scores.X}</div>
            </div>
            <div className="p-3 bg-gray-500/10 rounded-lg">
              <div className="text-2xl font-bold">-</div>
              <div className="text-sm text-muted-foreground">Draws</div>
              <div className="text-lg font-semibold">{scores.draws}</div>
            </div>
            <div className="p-3 bg-red-500/10 rounded-lg">
              <div className="text-2xl font-bold text-red-600">O</div>
              <div className="text-sm text-muted-foreground">
                {gameMode === "pvp" ? "Player 2" : "Bot"}
              </div>
              <div className="text-lg font-semibold">{scores.O}</div>
            </div>
          </div>

          {/* Game Board */}
          <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
            {board.map((cell, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-20 w-20 text-2xl font-bold hover:bg-accent/50 transition-colors"
                onClick={() => makeMove(index)}
                disabled={cell !== null || gameStatus !== "playing"}
              >
                {cell && (
                  <span className={cell === "X" ? "text-blue-600" : "text-red-600"}>
                    {cell}
                  </span>
                )}
              </Button>
            ))}
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
            <Button
              variant="outline"
              onClick={() => setGameMode(gameMode === "pvp" ? "bot" : "pvp")}
            >
              Switch to {gameMode === "pvp" ? "Bot" : "PvP"}
            </Button>
            <Button variant="outline" onClick={resetScores}>
              Reset Scores
            </Button>
          </div>

          {/* Game Instructions */}
          <div className="text-center text-sm text-muted-foreground space-y-1">
            <p>Get 3 in a row to win!</p>
            <p>
              {gameMode === "pvp" 
                ? "Take turns with another player" 
                : "You're X, Bot is O"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TicTacToe;