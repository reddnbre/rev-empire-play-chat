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
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  
  const categories = ["All", "Strategy", "Action", "Puzzle", "Trivia", "Party"];
  
  const filteredGames = selectedCategory === "All" 
    ? games 
    : games.filter(game => game.category === selectedCategory);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "bg-green-500/20 text-green-400";
      case "Medium": return "bg-yellow-500/20 text-yellow-400";
      case "Hard": return "bg-red-500/20 text-red-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gamepad2 className="h-5 w-5" />
          Multiplayer Games
        </CardTitle>
        <CardDescription>
          Choose from 14 exciting multiplayer games
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="px-6 pb-4">
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
        
        <ScrollArea className="h-[500px] px-6">
          <div className="grid gap-4 pb-4">
            {filteredGames.map((game) => {
              const IconComponent = game.icon;
              return (
                <Card key={game.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{game.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {game.description}
                            </p>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => onStartGame(game.id)}
                            className="shrink-0"
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Play
                          </Button>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            <Users className="h-3 w-3 mr-1" />
                            {game.players}
                          </Badge>
                          <Badge variant="outline" className={`text-xs ${getDifficultyColor(game.difficulty)}`}>
                            {game.difficulty}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {game.estimatedTime}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {game.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default GamesList;