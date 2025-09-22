import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RotateCcw, Trophy, Search, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface WordSearchProps {
  onBack: () => void;
}

type Cell = {
  letter: string;
  isFound: boolean;
  isSelected: boolean;
  wordIndex?: number;
};

type Word = {
  word: string;
  found: boolean;
  startRow: number;
  startCol: number;
  direction: "horizontal" | "vertical" | "diagonal";
};

const WORDS = ["REACT", "CODE", "GAME", "WORD", "SEARCH", "PUZZLE", "GRID", "FIND"];
const GRID_SIZE = 12;

const WordSearch = ({ onBack }: WordSearchProps) => {
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [words, setWords] = useState<Word[]>([]);
  const [foundWords, setFoundWords] = useState(0);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<[number, number] | null>(null);
  const [currentSelection, setCurrentSelection] = useState<[number, number][]>([]);
  const [score, setScore] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);

  useEffect(() => {
    generateGrid();
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameStarted && !gameFinished) {
      timer = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameStarted, gameFinished]);

  const generateGrid = () => {
    // Create empty grid
    const newGrid: Cell[][] = Array(GRID_SIZE).fill(null).map(() =>
      Array(GRID_SIZE).fill(null).map(() => ({
        letter: "",
        isFound: false,
        isSelected: false
      }))
    );

    const newWords: Word[] = [];
    const placedWords = new Set<string>();

    // Place words in grid
    WORDS.forEach((word, wordIndex) => {
      let placed = false;
      let attempts = 0;

      while (!placed && attempts < 50) {
        const direction = ["horizontal", "vertical", "diagonal"][Math.floor(Math.random() * 3)] as Word["direction"];
        const row = Math.floor(Math.random() * GRID_SIZE);
        const col = Math.floor(Math.random() * GRID_SIZE);

        if (canPlaceWord(newGrid, word, row, col, direction)) {
          placeWord(newGrid, word, row, col, direction, wordIndex);
          newWords.push({
            word,
            found: false,
            startRow: row,
            startCol: col,
            direction
          });
          placedWords.add(word);
          placed = true;
        }
        attempts++;
      }
    });

    // Fill empty cells with random letters
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (newGrid[row][col].letter === "") {
          newGrid[row][col].letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        }
      }
    }

    setGrid(newGrid);
    setWords(newWords);
    setFoundWords(0);
    setScore(0);
    setTimeElapsed(0);
    setGameStarted(false);
    setGameFinished(false);
  };

  const canPlaceWord = (grid: Cell[][], word: string, row: number, col: number, direction: Word["direction"]): boolean => {
    const { deltaRow, deltaCol } = getDirection(direction);
    
    for (let i = 0; i < word.length; i++) {
      const newRow = row + i * deltaRow;
      const newCol = col + i * deltaCol;
      
      if (newRow < 0 || newRow >= GRID_SIZE || newCol < 0 || newCol >= GRID_SIZE) {
        return false;
      }
      
      if (grid[newRow][newCol].letter !== "" && grid[newRow][newCol].letter !== word[i]) {
        return false;
      }
    }
    
    return true;
  };

  const placeWord = (grid: Cell[][], word: string, row: number, col: number, direction: Word["direction"], wordIndex: number) => {
    const { deltaRow, deltaCol } = getDirection(direction);
    
    for (let i = 0; i < word.length; i++) {
      const newRow = row + i * deltaRow;
      const newCol = col + i * deltaCol;
      grid[newRow][newCol].letter = word[i];
      grid[newRow][newCol].wordIndex = wordIndex;
    }
  };

  const getDirection = (direction: Word["direction"]) => {
    switch (direction) {
      case "horizontal": return { deltaRow: 0, deltaCol: 1 };
      case "vertical": return { deltaRow: 1, deltaCol: 0 };
      case "diagonal": return { deltaRow: 1, deltaCol: 1 };
      default: return { deltaRow: 0, deltaCol: 1 };
    }
  };

  const handleMouseDown = (row: number, col: number) => {
    if (!gameStarted) setGameStarted(true);
    
    setIsSelecting(true);
    setSelectionStart([row, col]);
    setCurrentSelection([[row, col]]);
    updateGridSelection([[row, col]]);
  };

  const handleMouseEnter = (row: number, col: number) => {
    if (!isSelecting || !selectionStart) return;

    const newSelection = getSelectionCells(selectionStart, [row, col]);
    setCurrentSelection(newSelection);
    updateGridSelection(newSelection);
  };

  const handleMouseUp = () => {
    if (!isSelecting || currentSelection.length === 0) {
      setIsSelecting(false);
      clearSelection();
      return;
    }

    const selectedWord = currentSelection.map(([row, col]) => grid[row][col].letter).join("");
    const reverseWord = selectedWord.split("").reverse().join("");
    
    const foundWord = words.find(w => 
      (w.word === selectedWord || w.word === reverseWord) && !w.found
    );

    if (foundWord) {
      // Mark word as found
      setWords(prev => prev.map(w => 
        w.word === foundWord.word ? { ...w, found: true } : w
      ));
      
      // Mark cells as found
      setGrid(prev => prev.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          const isInSelection = currentSelection.some(([r, c]) => r === rowIndex && c === colIndex);
          return isInSelection ? { ...cell, isFound: true } : { ...cell, isSelected: false };
        })
      ));

      const newFoundWords = foundWords + 1;
      setFoundWords(newFoundWords);
      setScore(prev => prev + foundWord.word.length * 10);
      
      toast({
        title: "Word Found! 🎉",
        description: `Found "${foundWord.word}" (+${foundWord.word.length * 10} points)`,
      });

      if (newFoundWords === words.length) {
        setGameFinished(true);
        toast({
          title: "Puzzle Complete! 🏆",
          description: `All words found in ${formatTime(timeElapsed)}!`,
        });
      }
    } else {
      clearSelection();
    }

    setIsSelecting(false);
    setSelectionStart(null);
    setCurrentSelection([]);
  };

  const getSelectionCells = (start: [number, number], end: [number, number]): [number, number][] => {
    const [startRow, startCol] = start;
    const [endRow, endCol] = end;
    const cells: [number, number][] = [];

    const deltaRow = endRow - startRow;
    const deltaCol = endCol - startCol;
    
    // Only allow horizontal, vertical, or diagonal lines
    if (deltaRow === 0 || deltaCol === 0 || Math.abs(deltaRow) === Math.abs(deltaCol)) {
      const steps = Math.max(Math.abs(deltaRow), Math.abs(deltaCol));
      const stepRow = steps === 0 ? 0 : deltaRow / steps;
      const stepCol = steps === 0 ? 0 : deltaCol / steps;
      
      for (let i = 0; i <= steps; i++) {
        cells.push([startRow + i * stepRow, startCol + i * stepCol]);
      }
    }
    
    return cells;
  };

  const updateGridSelection = (selection: [number, number][]) => {
    setGrid(prev => prev.map((row, rowIndex) =>
      row.map((cell, colIndex) => ({
        ...cell,
        isSelected: !cell.isFound && selection.some(([r, c]) => r === rowIndex && c === colIndex)
      }))
    ));
  };

  const clearSelection = () => {
    setGrid(prev => prev.map(row =>
      row.map(cell => ({ ...cell, isSelected: false }))
    ));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const resetGame = () => {
    generateGrid();
  };

  const getCellClass = (cell: Cell) => {
    if (cell.isFound) return "bg-green-200 text-green-800";
    if (cell.isSelected) return "bg-blue-200 text-blue-800";
    return "bg-gray-100 hover:bg-gray-200";
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
            <Search className="h-3 w-3 mr-1" />
            Puzzle
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Trophy className="h-5 w-5" />
            Word Search Challenge
          </CardTitle>
          <CardDescription>
            Find all hidden words in the grid by selecting them!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{foundWords}</div>
              <div className="text-sm text-muted-foreground">Found</div>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{words.length - foundWords}</div>
              <div className="text-sm text-muted-foreground">Remaining</div>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{score}</div>
              <div className="text-sm text-muted-foreground">Score</div>
            </div>
            <div className="p-3 bg-orange-500/10 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{formatTime(timeElapsed)}</div>
              <div className="text-sm text-muted-foreground">Time</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Word Grid */}
            <div className="lg:col-span-2">
              <div 
                className="grid grid-cols-12 gap-1 max-w-2xl mx-auto select-none"
                onMouseLeave={() => isSelecting && handleMouseUp()}
              >
                {grid.map((row, rowIndex) =>
                  row.map((cell, colIndex) => (
                    <button
                      key={`${rowIndex}-${colIndex}`}
                      className={`w-8 h-8 text-sm font-bold rounded transition-colors ${getCellClass(cell)}`}
                      onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                      onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                      onMouseUp={handleMouseUp}
                    >
                      {cell.letter}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Words List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Find These Words:</h3>
              <div className="space-y-2">
                {words.map((word, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-2 p-2 rounded ${
                      word.found ? "bg-green-100 text-green-800" : "bg-gray-100"
                    }`}
                  >
                    {word.found && <CheckCircle className="h-4 w-4 text-green-600" />}
                    <span className={word.found ? "line-through" : ""}>{word.word}</span>
                  </div>
                ))}
              </div>
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
              New Puzzle
            </Button>
          </div>

          {/* Instructions */}
          <div className="text-center text-sm text-muted-foreground space-y-1">
            <p>Drag to select words horizontally, vertically, or diagonally!</p>
            <p>Words can be written forwards or backwards.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WordSearch;