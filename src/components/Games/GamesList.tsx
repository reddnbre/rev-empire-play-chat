import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Gamepad2, 
  Users, 
  Zap, 
  Brain, 
  Target, 
  Puzzle, 
  Heart,
  Trophy,
  Clock,
  Play
} from "lucide-react";

interface Game {
  id: string;
  name: string;
  description: string;
  icon: any;
  players: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category: "Strategy" | "Action" | "Puzzle" | "Trivia" | "Party";
  estimatedTime: string;
}

const games: Game[] = [
  {
    id: "tictactoe",
    name: "TicTacToe",
    description: "Classic 3x3 grid strategy game",
    icon: Target,
    players: "1v1",
    difficulty: "Easy",
    category: "Strategy",
    estimatedTime: "2-5 min"
  },
  {
    id: "hangman",
    name: "Hangman",
    description: "Guess the word before time runs out",
    icon: Brain,
    players: "1v1",
    difficulty: "Medium",
    category: "Trivia",
    estimatedTime: "3-8 min"
  },
  {
    id: "battleship",
    name: "Battleship",
    description: "Naval strategy - sink all enemy ships",
    icon: Target,
    players: "1v1",
    difficulty: "Hard",
    category: "Strategy",
    estimatedTime: "10-15 min"
  },
  {
    id: "connect-four",
    name: "Connect Four",
    description: "Connect 4 pieces in a row to win",
    icon: Gamepad2,
    players: "1v1",
    difficulty: "Medium",
    category: "Strategy",
    estimatedTime: "5-10 min"
  },
  {
    id: "checkers",
    name: "Checkers",
    description: "Classic board game strategy",
    icon: Trophy,
    players: "1v1",
    difficulty: "Hard",
    category: "Strategy",
    estimatedTime: "15-30 min"
  },
  {
    id: "war",
    name: "War Card Game",
    description: "Simple card battle game",
    icon: Zap,
    players: "1v1",
    difficulty: "Easy",
    category: "Action",
    estimatedTime: "5-10 min"
  },
  {
    id: "uno-lite",
    name: "UNO Lite",
    description: "Fast-paced card matching game",
    icon: Heart,
    players: "2-4",
    difficulty: "Medium",
    category: "Party",
    estimatedTime: "8-15 min"
  },
  {
    id: "word-search",
    name: "Word Search",
    description: "Find hidden words in the grid",
    icon: Puzzle,
    players: "1v1",
    difficulty: "Easy",
    category: "Puzzle",
    estimatedTime: "5-10 min"
  },
  {
    id: "memory-game",
    name: "Memory Match",
    description: "Find matching pairs of cards",
    icon: Brain,
    players: "1v1",
    difficulty: "Medium",
    category: "Puzzle",
    estimatedTime: "3-7 min"
  },
  {
    id: "number-puzzle",
    name: "Number Puzzle",
    description: "Sliding tile number puzzle",
    icon: Puzzle,
    players: "1v1",
    difficulty: "Hard",
    category: "Puzzle",
    estimatedTime: "5-15 min"
  },
  {
    id: "trivia-bot",
    name: "Trivia Bot",
    description: "Answer questions faster than opponent",
    icon: Brain,
    players: "1v1",
    difficulty: "Medium",
    category: "Trivia",
    estimatedTime: "5-10 min"
  },
  {
    id: "emoji-guess",
    name: "Emoji Guess",
    description: "Guess the phrase from emojis",
    icon: Heart,
    players: "1v1",
    difficulty: "Easy",
    category: "Trivia",
    estimatedTime: "3-6 min"
  },
  {
    id: "would-rather",
    name: "Would You Rather",
    description: "Choose between two options",
    icon: Users,
    players: "2+",
    difficulty: "Easy",
    category: "Party",
    estimatedTime: "5-10 min"
  },
  {
    id: "custom-games",
    name: "Custom Games",
    description: "Create and play custom games",
    icon: Gamepad2,
    players: "Varies",
    difficulty: "Medium",
    category: "Party",
    estimatedTime: "Varies"
  }
];

interface GamesListProps {
  onStartGame: (gameId: string) => void;
}

const GamesList = ({ onStartGame }: GamesListProps) => {
  return (
    <div className="w-full">
      <h3 className="text-sm font-semibold mb-2 text-center">Multiplayer Games</h3>
      <div className="grid grid-cols-7 gap-1 px-2">
        {games.map((game) => (
          <Button
            key={game.id}
            variant="outline"
            size="sm"
            onClick={() => onStartGame(game.id)}
            className="text-xs px-2 py-1 h-8 text-center"
          >
            {game.name}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default GamesList;