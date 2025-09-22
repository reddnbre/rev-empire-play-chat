import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RotateCcw, Trophy, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ConnectFourProps {
  onBack: () => void;
}

type Player = "red" | "yellow" | null;
type Board = Player[][];
type GameStatus = "playing" | "finished";

const ConnectFour = ({ onBack }: ConnectFourProps) => {
  const [board, setBoard] = useState<Board>(() => 
    Array(6).fill(null).map(() => Array(7).fill(null))
  );
  const [currentPlayer, setCurrentPlayer] = useState<Player>("red");
  const [gameStatus, setGameStatus] = useState<GameStatus>("playing");
  const [winner, setWinner] = useState<Player>(null);
  const [scores, setScores] = useState({ red: 0, yellow: 0, draws: 0 });
  const [gameMode, setGameMode] = useState<"pvp" | "bot">("pvp");

  useEffect(() => {
    checkWinner();
  }, [board]);

  useEffect(() => {
    if (gameMode === "bot" && currentPlayer === "yellow" && gameStatus === "playing") {
      const timer = setTimeout(() => {
        makeBotMove();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentPlayer, gameMode, gameStatus]);

  const checkWinner = () => {
    // Check horizontal
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 4; col++) {
        if (board[row][col] && 
            board[row][col] === board[row][col + 1] && 
            board[row][col] === board[row][col + 2] && 
            board[row][col] === board[row][col + 3]) {
          endGame(board[row][col]);
          return;
        }
      }
    }

    // Check vertical
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 7; col++) {
        if (board[row][col] && 
            board[row][col] === board[row + 1][col] && 
            board[row][col] === board[row + 2][col] && 
            board[row][col] === board[row + 3][col]) {
          endGame(board[row][col]);
          return;
        }
      }
    }

    // Check diagonal (top-left to bottom-right)
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        if (board[row][col] && 
            board[row][col] === board[row + 1][col + 1] && 
            board[row][col] === board[row + 2][col + 2] && 
            board[row][col] === board[row + 3][col + 3]) {
          endGame(board[row][col]);
          return;
        }
      }
    }

    // Check diagonal (bottom-left to top-right)
    for (let row = 3; row < 6; row++) {
      for (let col = 0; col < 4; col++) {
        if (board[row][col] && 
            board[row][col] === board[row - 1][col + 1] && 
            board[row][col] === board[row - 2][col + 2] && 
            board[row][col] === board[row - 3][col + 3]) {
          endGame(board[row][col]);
          return;
        }
      }
    }

    // Check for draw
    if (board[0].every(cell => cell !== null)) {
      endGame(null);
    }
  };

  const endGame = (winnerPlayer: Player) => {
    setWinner(winnerPlayer);
    setGameStatus("finished");
    
    if (winnerPlayer) {
      setScores(prev => ({ 
        ...prev, 
        [winnerPlayer]: prev[winnerPlayer] + 1 
      }));
      toast({
        title: `${winnerPlayer.charAt(0).toUpperCase() + winnerPlayer.slice(1)} wins!`,
        description: "🎉 Four in a row!",
      });
    } else {
      setScores(prev => ({ ...prev, draws: prev.draws + 1 }));
      toast({
        title: "It's a draw!",
        description: "The board is full!",
      });
    }
  };

  const dropPiece = (col: number) => {
    if (gameStatus !== "playing") return;
    
    // Find the lowest empty row in this column
    for (let row = 5; row >= 0; row--) {
      if (board[row][col] === null) {
        const newBoard = board.map(r => [...r]);
        newBoard[row][col] = currentPlayer;
        setBoard(newBoard);
        setCurrentPlayer(currentPlayer === "red" ? "yellow" : "red");
        return;
      }
    }
  };

  const makeBotMove = () => {
    const availableCols = [];
    for (let col = 0; col < 7; col++) {
      if (board[0][col] === null) {
        availableCols.push(col);
      }
    }

    if (availableCols.length > 0) {
      const randomCol = availableCols[Math.floor(Math.random() * availableCols.length)];
      dropPiece(randomCol);
    }
  };

  const resetGame = () => {
    setBoard(Array(6).fill(null).map(() => Array(7).fill(null)));
    setCurrentPlayer("red");
    setGameStatus("playing");
    setWinner(null);
  };

  const resetScores = () => {
    setScores({ red: 0, yellow: 0, draws: 0 });
    resetGame();
  };

  const getCellColor = (cell: Player) => {
    if (cell === "red") return "bg-red-500";
    if (cell === "yellow") return "bg-yellow-400";
    return "bg-gray-100 border-2 border-gray-300";
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
            Connect Four
          </CardTitle>
          <CardDescription>
            {gameStatus === "playing" && `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)}'s turn`}
            {gameStatus === "finished" && winner && `${winner.charAt(0).toUpperCase() + winner.slice(1)} wins!`}
            {gameStatus === "finished" && !winner && "It's a draw!"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Scoreboard */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-red-500/10 rounded-lg">
              <div className="text-2xl font-bold text-red-600">●</div>
              <div className="text-sm text-muted-foreground">Red</div>
              <div className="text-lg font-semibold">{scores.red}</div>
            </div>
            <div className="p-3 bg-gray-500/10 rounded-lg">
              <div className="text-2xl font-bold">-</div>
              <div className="text-sm text-muted-foreground">Draws</div>
              <div className="text-lg font-semibold">{scores.draws}</div>
            </div>
            <div className="p-3 bg-yellow-500/10 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">●</div>
              <div className="text-sm text-muted-foreground">
                {gameMode === "pvp" ? "Yellow" : "Bot"}
              </div>
              <div className="text-lg font-semibold">{scores.yellow}</div>
            </div>
          </div>

          {/* Game Board */}
          <div className="bg-blue-600 p-4 rounded-lg max-w-md mx-auto">
            <div className="grid grid-cols-7 gap-2 mb-4">
              {Array(7).fill(null).map((_, col) => (
                <Button
                  key={col}
                  variant="secondary"
                  size="sm"
                  onClick={() => dropPiece(col)}
                  disabled={board[0][col] !== null || gameStatus !== "playing"}
                  className="h-8 w-8 p-0 text-xs"
                >
                  ↓
                </Button>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-2">
              {board.map((row, rowIndex) => 
                row.map((cell, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`w-8 h-8 rounded-full ${getCellColor(cell)} shadow-inner`}
                  />
                ))
              )}
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
            <p>Connect 4 pieces in a row to win!</p>
            <p>Horizontal, vertical, or diagonal connections count.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConnectFour;