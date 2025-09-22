import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RotateCcw, Trophy, Target, Crosshair } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface BattleshipProps {
  onBack: () => void;
}

type CellState = "empty" | "ship" | "hit" | "miss";
type GamePhase = "setup" | "playing" | "finished";
type Board = CellState[][];

const BOARD_SIZE = 8;
const SHIPS = [
  { name: "Carrier", size: 4 },
  { name: "Battleship", size: 3 },
  { name: "Destroyer", size: 2 },
  { name: "Submarine", size: 2 }
];

const Battleship = ({ onBack }: BattleshipProps) => {
  const [playerBoard, setPlayerBoard] = useState<Board>([]);
  const [botBoard, setBotBoard] = useState<Board>([]);
  const [gamePhase, setGamePhase] = useState<GamePhase>("setup");
  const [currentShip, setCurrentShip] = useState(0);
  const [scores, setScores] = useState({ player: 0, bot: 0 });
  const [playerShips, setPlayerShips] = useState(0);
  const [botShips, setBotShips] = useState(0);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);

  useEffect(() => {
    initializeGame();
  }, []);

  const createEmptyBoard = (): Board => {
    return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill("empty"));
  };

  const initializeGame = () => {
    setPlayerBoard(createEmptyBoard());
    setBotBoard(createEmptyBoard());
    setGamePhase("setup");
    setCurrentShip(0);
    setPlayerShips(0);
    setBotShips(0);
    setIsPlayerTurn(true);
    
    // Auto-place bot ships
    const botBoardWithShips = createEmptyBoard();
    let shipsPlaced = 0;
    
    SHIPS.forEach(ship => {
      let placed = false;
      let attempts = 0;
      while (!placed && attempts < 50) {
        const horizontal = Math.random() > 0.5;
        const row = Math.floor(Math.random() * (horizontal ? BOARD_SIZE : BOARD_SIZE - ship.size + 1));
        const col = Math.floor(Math.random() * (horizontal ? BOARD_SIZE - ship.size + 1 : BOARD_SIZE));
        
        let canPlace = true;
        for (let i = 0; i < ship.size; i++) {
          const checkRow = horizontal ? row : row + i;
          const checkCol = horizontal ? col + i : col;
          if (botBoardWithShips[checkRow][checkCol] !== "empty") {
            canPlace = false;
            break;
          }
        }
        
        if (canPlace) {
          for (let i = 0; i < ship.size; i++) {
            const placeRow = horizontal ? row : row + i;
            const placeCol = horizontal ? col + i : col;
            botBoardWithShips[placeRow][placeCol] = "ship";
          }
          shipsPlaced += ship.size;
          placed = true;
        }
        attempts++;
      }
    });
    
    setBotBoard(botBoardWithShips);
    setBotShips(shipsPlaced);
  };

  const placePlayerShip = (row: number, col: number) => {
    if (gamePhase !== "setup" || currentShip >= SHIPS.length) return;
    
    const ship = SHIPS[currentShip];
    const newBoard = playerBoard.map(r => [...r]);
    
    // Try horizontal placement
    let canPlace = true;
    if (col + ship.size <= BOARD_SIZE) {
      for (let i = 0; i < ship.size; i++) {
        if (newBoard[row][col + i] !== "empty") {
          canPlace = false;
          break;
        }
      }
      
      if (canPlace) {
        for (let i = 0; i < ship.size; i++) {
          newBoard[row][col + i] = "ship";
        }
        
        setPlayerBoard(newBoard);
        setPlayerShips(prev => prev + ship.size);
        setCurrentShip(prev => prev + 1);
        
        if (currentShip + 1 >= SHIPS.length) {
          setGamePhase("playing");
          toast({
            title: "Battle Begins!",
            description: "All ships placed. Start attacking!",
          });
        }
      } else {
        toast({
          title: "Invalid Placement",
          description: "Ships cannot overlap!",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Invalid Placement", 
        description: "Ship doesn't fit here!",
        variant: "destructive"
      });
    }
  };

  const attackCell = (row: number, col: number) => {
    if (gamePhase !== "playing" || !isPlayerTurn) return;
    
    const newBotBoard = botBoard.map(r => [...r]);
    const cell = newBotBoard[row][col];
    
    if (cell === "hit" || cell === "miss") return;
    
    if (cell === "ship") {
      newBotBoard[row][col] = "hit";
      setScores(prev => ({ ...prev, player: prev.player + 1 }));
      setBotShips(prev => {
        const newShips = prev - 1;
        if (newShips === 0) {
          setGamePhase("finished");
          toast({
            title: "Victory! 🎉",
            description: "You sunk all enemy ships!",
          });
        }
        return newShips;
      });
      toast({
        title: "Hit! 🎯",
        description: "You hit an enemy ship!",
      });
    } else {
      newBotBoard[row][col] = "miss";
      toast({
        title: "Miss! 🌊",
        description: "No ship at that location.",
      });
    }
    
    setBotBoard(newBotBoard);
    setIsPlayerTurn(false);
    
    // Bot turn
    setTimeout(() => {
      botAttack();
    }, 1000);
  };

  const botAttack = () => {
    const availableCells = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (playerBoard[row][col] !== "hit" && playerBoard[row][col] !== "miss") {
          availableCells.push([row, col]);
        }
      }
    }
    
    if (availableCells.length === 0) return;
    
    const [row, col] = availableCells[Math.floor(Math.random() * availableCells.length)];
    const newPlayerBoard = playerBoard.map(r => [...r]);
    const cell = newPlayerBoard[row][col];
    
    if (cell === "ship") {
      newPlayerBoard[row][col] = "hit";
      setScores(prev => ({ ...prev, bot: prev.bot + 1 }));
      setPlayerShips(prev => {
        const newShips = prev - 1;
        if (newShips === 0) {
          setGamePhase("finished");
          toast({
            title: "Defeat! 💥",
            description: "Enemy sunk all your ships!",
            variant: "destructive"
          });
        }
        return newShips;
      });
    } else {
      newPlayerBoard[row][col] = "miss";
    }
    
    setPlayerBoard(newPlayerBoard);
    setIsPlayerTurn(true);
  };

  const resetGame = () => {
    initializeGame();
  };

  const getCellDisplay = (cell: CellState, isPlayerBoard: boolean) => {
    if (cell === "hit") return "💥";
    if (cell === "miss") return "💧";
    if (cell === "ship" && isPlayerBoard) return "🚢";
    return "";
  };

  const getCellColor = (cell: CellState, isPlayerBoard: boolean) => {
    if (cell === "hit") return "bg-red-500";
    if (cell === "miss") return "bg-blue-300";
    if (cell === "ship" && isPlayerBoard) return "bg-gray-600";
    return "bg-blue-100 hover:bg-blue-200 border border-blue-300";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Games
        </Button>
        <div className="flex gap-2">
          <Badge variant="default">
            <Target className="h-3 w-3 mr-1" />
            Naval Battle
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Trophy className="h-5 w-5" />
            Battleship Naval Combat
          </CardTitle>
          <CardDescription>
            {gamePhase === "setup" && `Place ${SHIPS[currentShip]?.name} (${SHIPS[currentShip]?.size} cells)`}
            {gamePhase === "playing" && (isPlayerTurn ? "Your turn - Click to attack!" : "Enemy attacking...")}
            {gamePhase === "finished" && "Battle Complete!"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{scores.player}</div>
              <div className="text-sm text-muted-foreground">Your Hits</div>
            </div>
            <div className="p-3 bg-red-500/10 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{scores.bot}</div>
              <div className="text-sm text-muted-foreground">Enemy Hits</div>
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{playerShips}</div>
              <div className="text-sm text-muted-foreground">Your Ships</div>
            </div>
            <div className="p-3 bg-orange-500/10 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{botShips}</div>
              <div className="text-sm text-muted-foreground">Enemy Ships</div>
            </div>
          </div>

          {/* Game Boards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Player Board */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center">Your Fleet</h3>
              <div className="grid grid-cols-8 gap-1 max-w-xs mx-auto">
                {playerBoard.map((row, rowIndex) =>
                  row.map((cell, colIndex) => (
                    <button
                      key={`player-${rowIndex}-${colIndex}`}
                      className={`h-8 w-8 text-xs font-bold rounded ${getCellColor(cell, true)} 
                        ${gamePhase === "setup" ? "cursor-pointer" : "cursor-default"}`}
                      onClick={() => gamePhase === "setup" && placePlayerShip(rowIndex, colIndex)}
                    >
                      {getCellDisplay(cell, true)}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Enemy Board */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center">Enemy Waters</h3>
              <div className="grid grid-cols-8 gap-1 max-w-xs mx-auto">
                {botBoard.map((row, rowIndex) =>
                  row.map((cell, colIndex) => (
                    <button
                      key={`bot-${rowIndex}-${colIndex}`}
                      className={`h-8 w-8 text-xs font-bold rounded ${getCellColor(cell, false)}
                        ${gamePhase === "playing" && isPlayerTurn ? "cursor-crosshair" : "cursor-default"}`}
                      onClick={() => attackCell(rowIndex, colIndex)}
                      disabled={gamePhase !== "playing" || !isPlayerTurn}
                    >
                      {getCellDisplay(cell, false)}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Ships to Place */}
          {gamePhase === "setup" && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Ships to place:</p>
              <div className="flex justify-center gap-2 flex-wrap">
                {SHIPS.map((ship, index) => (
                  <Badge
                    key={ship.name}
                    variant={index === currentShip ? "default" : index < currentShip ? "secondary" : "outline"}
                  >
                    {ship.name} ({ship.size})
                  </Badge>
                ))}
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
              New Battle
            </Button>
          </div>

          {/* Instructions */}
          <div className="text-center text-sm text-muted-foreground space-y-1">
            <p>🚢 Place your ships horizontally, then attack enemy waters!</p>
            <p>💥 Hit = Red, Miss = Blue. Sink all enemy ships to win!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Battleship;