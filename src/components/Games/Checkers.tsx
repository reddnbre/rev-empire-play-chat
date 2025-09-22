import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RotateCcw, Trophy, Users, Crown } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface CheckersProps {
  onBack: () => void;
}

type Piece = {
  player: "red" | "black" | null;
  isKing: boolean;
};

type Board = Piece[][];
type GameStatus = "playing" | "finished";

const Checkers = ({ onBack }: CheckersProps) => {
  const [board, setBoard] = useState<Board>([]);
  const [currentPlayer, setCurrentPlayer] = useState<"red" | "black">("red");
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus>("playing");
  const [winner, setWinner] = useState<"red" | "black" | null>(null);
  const [scores, setScores] = useState({ red: 0, black: 0 });
  const [redPieces, setRedPieces] = useState(12);
  const [blackPieces, setBlackPieces] = useState(12);
  const [gameMode, setGameMode] = useState<"pvp" | "bot">("pvp");

  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    const newBoard: Board = Array(8).fill(null).map(() =>
      Array(8).fill({ player: null, isKing: false })
    );

    // Place red pieces (top 3 rows)
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          newBoard[row][col] = { player: "red", isKing: false };
        }
      }
    }

    // Place black pieces (bottom 3 rows)
    for (let row = 5; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          newBoard[row][col] = { player: "black", isKing: false };
        }
      }
    }

    setBoard(newBoard);
    setCurrentPlayer("red");
    setSelectedCell(null);
    setGameStatus("playing");
    setWinner(null);
    setRedPieces(12);
    setBlackPieces(12);
  };

  const isValidCell = (row: number, col: number) => {
    return row >= 0 && row < 8 && col >= 0 && col < 8 && (row + col) % 2 === 1;
  };

  const canMoveTo = (fromRow: number, fromCol: number, toRow: number, toCol: number): boolean => {
    const piece = board[fromRow][fromCol];
    if (!piece.player || board[toRow][toCol].player) return false;

    const rowDiff = toRow - fromRow;
    const colDiff = Math.abs(toCol - fromCol);

    // Regular piece movement
    if (!piece.isKing) {
      const direction = piece.player === "red" ? 1 : -1;
      if (rowDiff === direction && colDiff === 1) return true;
    } else {
      // King can move diagonally in any direction
      if (Math.abs(rowDiff) === 1 && colDiff === 1) return true;
    }

    return false;
  };

  const canJumpTo = (fromRow: number, fromCol: number, toRow: number, toCol: number): { canJump: boolean; capturedRow?: number; capturedCol?: number } => {
    const piece = board[fromRow][fromCol];
    if (!piece.player || board[toRow][toCol].player) return { canJump: false };

    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;

    // Check if it's a diagonal jump of 2 squares
    if (Math.abs(rowDiff) === 2 && Math.abs(colDiff) === 2) {
      const capturedRow = fromRow + rowDiff / 2;
      const capturedCol = fromCol + colDiff / 2;
      const capturedPiece = board[capturedRow][capturedCol];

      if (capturedPiece.player && capturedPiece.player !== piece.player) {
        // Check if piece can move in this direction
        if (!piece.isKing) {
          const direction = piece.player === "red" ? 1 : -1;
          if (Math.sign(rowDiff) !== direction) return { canJump: false };
        }
        return { canJump: true, capturedRow, capturedCol };
      }
    }

    return { canJump: false };
  };

  const makeMove = (fromRow: number, fromCol: number, toRow: number, toCol: number) => {
    const newBoard = board.map(row => row.map(cell => ({ ...cell })));
    const piece = newBoard[fromRow][fromCol];

    // Check for jump
    const jumpResult = canJumpTo(fromRow, fromCol, toRow, toCol);
    if (jumpResult.canJump && jumpResult.capturedRow !== undefined && jumpResult.capturedCol !== undefined) {
      // Remove captured piece
      newBoard[jumpResult.capturedRow][jumpResult.capturedCol] = { player: null, isKing: false };
      
      if (piece.player === "red") {
        setBlackPieces(prev => prev - 1);
      } else {
        setRedPieces(prev => prev - 1);
      }
    }

    // Move piece
    newBoard[toRow][toCol] = { ...piece };
    newBoard[fromRow][fromCol] = { player: null, isKing: false };

    // Check for king promotion
    if (!piece.isKing) {
      if ((piece.player === "red" && toRow === 7) || (piece.player === "black" && toRow === 0)) {
        newBoard[toRow][toCol].isKing = true;
        toast({
          title: "King Me! 👑",
          description: `${piece.player} piece became a king!`,
        });
      }
    }

    setBoard(newBoard);
    setSelectedCell(null);

    // Check win condition
    if (redPieces <= 1 || blackPieces <= 1) {
      const gameWinner = redPieces > blackPieces ? "red" : "black";
      setWinner(gameWinner);
      setGameStatus("finished");
      setScores(prev => ({ 
        ...prev, 
        [gameWinner]: prev[gameWinner] + 1 
      }));
      toast({
        title: `${gameWinner.charAt(0).toUpperCase() + gameWinner.slice(1)} Wins!`,
        description: "🎉 Victory!",
      });
    } else {
      setCurrentPlayer(currentPlayer === "red" ? "black" : "red");
      
      // Bot move
      if (gameMode === "bot" && currentPlayer === "red") {
        setTimeout(() => {
          makeBotMove(newBoard);
        }, 1000);
      }
    }
  };

  const makeBotMove = (currentBoard: Board) => {
    const botPieces: [number, number][] = [];
    
    // Find all bot pieces
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (currentBoard[row][col].player === "black") {
          botPieces.push([row, col]);
        }
      }
    }

    // Try to find a valid move
    for (const [row, col] of botPieces) {
      const moves = [
        [row + 1, col + 1], [row + 1, col - 1],
        [row - 1, col + 1], [row - 1, col - 1],
        [row + 2, col + 2], [row + 2, col - 2],
        [row - 2, col + 2], [row - 2, col - 2]
      ];

      for (const [toRow, toCol] of moves) {
        if (isValidCell(toRow, toCol)) {
          if (canMoveTo(row, col, toRow, toCol) || canJumpTo(row, col, toRow, toCol).canJump) {
            makeMove(row, col, toRow, toCol);
            return;
          }
        }
      }
    }
  };

  const handleCellClick = (row: number, col: number) => {
    if (gameStatus !== "playing" || (gameMode === "bot" && currentPlayer === "black")) return;

    if (selectedCell) {
      const [fromRow, fromCol] = selectedCell;
      
      if (row === fromRow && col === fromCol) {
        setSelectedCell(null);
        return;
      }

      if (canMoveTo(fromRow, fromCol, row, col) || canJumpTo(fromRow, fromCol, row, col).canJump) {
        makeMove(fromRow, fromCol, row, col);
      } else {
        setSelectedCell(null);
      }
    } else {
      const piece = board[row][col];
      if (piece.player === currentPlayer) {
        setSelectedCell([row, col]);
      }
    }
  };

  const resetGame = () => {
    initializeGame();
  };

  const resetScores = () => {
    setScores({ red: 0, black: 0 });
    resetGame();
  };

  const getCellColor = (row: number, col: number) => {
    const isSelected = selectedCell && selectedCell[0] === row && selectedCell[1] === col;
    const isDark = (row + col) % 2 === 1;
    
    if (isSelected) return "bg-yellow-300";
    if (isDark) return "bg-amber-800";
    return "bg-amber-100";
  };

  const renderPiece = (piece: Piece) => {
    if (!piece.player) return null;
    
    const baseClass = "w-8 h-8 rounded-full border-2 flex items-center justify-center text-lg font-bold";
    const colorClass = piece.player === "red" ? "bg-red-500 border-red-700 text-white" : "bg-gray-800 border-gray-900 text-white";
    
    return (
      <div className={`${baseClass} ${colorClass}`}>
        {piece.isKing && <Crown className="h-4 w-4" />}
      </div>
    );
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
            Checkers Battle
          </CardTitle>
          <CardDescription>
            {gameStatus === "playing" && `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)}'s turn`}
            {gameStatus === "finished" && winner && `${winner.charAt(0).toUpperCase() + winner.slice(1)} wins!`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Scoreboard */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-3 bg-red-500/10 rounded-lg">
              <div className="text-2xl font-bold text-red-600">●</div>
              <div className="text-sm text-muted-foreground">Red: {redPieces} pieces</div>
              <div className="text-lg font-semibold">Games: {scores.red}</div>
            </div>
            <div className="p-3 bg-gray-800/10 rounded-lg">
              <div className="text-2xl font-bold text-gray-800">●</div>
              <div className="text-sm text-muted-foreground">
                {gameMode === "pvp" ? "Black" : "Bot"}: {blackPieces} pieces
              </div>
              <div className="text-lg font-semibold">Games: {scores.black}</div>
            </div>
          </div>

          {/* Game Board */}
          <div className="bg-amber-200 p-4 rounded-lg max-w-md mx-auto">
            <div className="grid grid-cols-8 gap-1">
              {board.map((row, rowIndex) =>
                row.map((piece, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`w-10 h-10 flex items-center justify-center cursor-pointer
                      ${getCellColor(rowIndex, colIndex)}`}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                  >
                    {renderPiece(piece)}
                  </div>
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

          {/* Instructions */}
          <div className="text-center text-sm text-muted-foreground space-y-1">
            <p>Move diagonally, capture by jumping over opponent pieces!</p>
            <p>Reach the opposite end to become a King 👑</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Checkers;