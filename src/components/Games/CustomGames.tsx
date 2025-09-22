import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Trophy, Plus, Play, Edit, Trash2, Gamepad2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface CustomGamesProps {
  onBack: () => void;
}

type CustomGame = {
  id: string;
  name: string;
  description: string;
  rules: string;
  category: string;
  players: string;
  difficulty: "Easy" | "Medium" | "Hard";
  createdAt: Date;
};

type GameTemplate = {
  name: string;
  description: string;
  rules: string;
  category: string;
};

const gameTemplates: GameTemplate[] = [
  {
    name: "20 Questions",
    description: "One player thinks of something, others guess with yes/no questions",
    rules: "1. One player thinks of an object, person, or place\n2. Other players ask yes/no questions\n3. Maximum 20 questions allowed\n4. Guess correctly to win!",
    category: "Trivia"
  },
  {
    name: "Story Builder",
    description: "Collaboratively create a story by taking turns adding sentences",
    rules: "1. First player starts with opening sentence\n2. Each player adds one sentence\n3. Story must make sense and continue logically\n4. Continue for agreed number of rounds",
    category: "Creative"
  },
  {
    name: "Category Challenge",
    description: "Name items in a category within time limit",
    rules: "1. Choose a category (e.g., animals, movies, food)\n2. Set a time limit (30-60 seconds)\n3. Players take turns naming items\n4. No repeats allowed\n5. First to hesitate or repeat loses",
    category: "Knowledge"
  },
  {
    name: "Drawing Relay",
    description: "Pass drawings around and guess what they represent",
    rules: "1. Each player draws a word/phrase\n2. Pass drawing to next player\n3. They guess what it is and draw their guess\n4. Continue until back to original\n5. Compare final result to original word",
    category: "Creative"
  }
];

const CustomGames = ({ onBack }: CustomGamesProps) => {
  const [customGames, setCustomGames] = useState<CustomGame[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGame, setEditingGame] = useState<CustomGame | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    rules: "",
    category: "Party",
    players: "2-4",
    difficulty: "Medium" as "Easy" | "Medium" | "Hard"
  });

  const handleCreateGame = () => {
    if (!formData.name.trim() || !formData.description.trim() || !formData.rules.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const newGame: CustomGame = {
      id: Date.now().toString(),
      name: formData.name.trim(),
      description: formData.description.trim(),
      rules: formData.rules.trim(),
      category: formData.category,
      players: formData.players,
      difficulty: formData.difficulty,
      createdAt: new Date()
    };

    if (editingGame) {
      setCustomGames(prev => prev.map(game => 
        game.id === editingGame.id ? { ...newGame, id: editingGame.id } : game
      ));
      setEditingGame(null);
      toast({
        title: "Game Updated! ✏️",
        description: `"${newGame.name}" has been updated successfully.`,
      });
    } else {
      setCustomGames(prev => [...prev, newGame]);
      toast({
        title: "Game Created! 🎉",
        description: `"${newGame.name}" has been added to your custom games.`,
      });
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      rules: "",
      category: "Party",
      players: "2-4",
      difficulty: "Medium" as "Easy" | "Medium" | "Hard"
    });
    setShowCreateForm(false);
  };

  const handleEdit = (game: CustomGame) => {
    setFormData({
      name: game.name,
      description: game.description,
      rules: game.rules,
      category: game.category,
      players: game.players,
      difficulty: game.difficulty
    });
    setEditingGame(game);
    setShowCreateForm(true);
  };

  const handleDelete = (gameId: string) => {
    setCustomGames(prev => prev.filter(game => game.id !== gameId));
    toast({
      title: "Game Deleted",
      description: "Custom game has been removed.",
    });
  };

  const playGame = (game: CustomGame) => {
    toast({
      title: "Game Started! 🎮",
      description: `Starting "${game.name}" - follow the rules to play!`,
    });
  };

  const useTemplate = (template: GameTemplate) => {
    setFormData({
      name: template.name,
      description: template.description,
      rules: template.rules,
      category: template.category,
      players: "2-4",
      difficulty: "Medium" as "Easy" | "Medium" | "Hard"
    });
    setShowCreateForm(true);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "bg-green-500/20 text-green-600";
      case "Medium": return "bg-yellow-500/20 text-yellow-600";
      case "Hard": return "bg-red-500/20 text-red-600";
      default: return "bg-gray-500/20 text-gray-600";
    }
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
            <Gamepad2 className="h-3 w-3 mr-1" />
            Custom
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Trophy className="h-5 w-5" />
            Custom Game Creator
          </CardTitle>
          <CardDescription>
            Create your own games and share them with friends!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!showCreateForm ? (
            <>
              {/* Create New Game Button */}
              <div className="text-center">
                <Button 
                  onClick={() => setShowCreateForm(true)}
                  className="flex items-center gap-2"
                  size="lg"
                >
                  <Plus className="h-4 w-4" />
                  Create New Game
                </Button>
              </div>

              {/* Game Templates */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Quick Start Templates</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {gameTemplates.map((template, index) => (
                    <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold">{template.name}</h4>
                              <p className="text-sm text-muted-foreground">{template.description}</p>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {template.category}
                            </Badge>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => useTemplate(template)}
                            className="w-full"
                          >
                            Use Template
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Custom Games List */}
              {customGames.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Your Custom Games ({customGames.length})</h3>
                  <div className="grid gap-4">
                    {customGames.map((game) => (
                      <Card key={game.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-semibold">{game.name}</h4>
                                  <p className="text-sm text-muted-foreground">{game.description}</p>
                                </div>
                                <div className="flex gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {game.players}
                                  </Badge>
                                  <Badge className={`text-xs ${getDifficultyColor(game.difficulty)}`}>
                                    {game.difficulty}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    {game.category}
                                  </Badge>
                                </div>
                              </div>
                              <div className="bg-muted p-3 rounded text-sm">
                                <strong>Rules:</strong>
                                <div className="whitespace-pre-wrap mt-1">{game.rules}</div>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Created: {game.createdAt.toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 mt-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => playGame(game)}
                              className="flex items-center gap-1"
                            >
                              <Play className="h-3 w-3" />
                              Play
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(game)}
                              className="flex items-center gap-1"
                            >
                              <Edit className="h-3 w-3" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(game.id)}
                              className="flex items-center gap-1 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Create/Edit Form */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {editingGame ? "Edit Game" : "Create New Game"}
                </h3>
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>

              <div className="grid gap-4">
                <div>
                  <Label htmlFor="name">Game Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter a catchy game name"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of your game"
                  />
                </div>

                <div>
                  <Label htmlFor="rules">Game Rules *</Label>
                  <Textarea
                    id="rules"
                    value={formData.rules}
                    onChange={(e) => setFormData(prev => ({ ...prev, rules: e.target.value }))}
                    placeholder="Explain how to play your game step by step..."
                    rows={6}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="Party">Party</option>
                      <option value="Strategy">Strategy</option>
                      <option value="Trivia">Trivia</option>
                      <option value="Creative">Creative</option>
                      <option value="Physical">Physical</option>
                      <option value="Knowledge">Knowledge</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="players">Players</Label>
                    <Input
                      id="players"
                      value={formData.players}
                      onChange={(e) => setFormData(prev => ({ ...prev, players: e.target.value }))}
                      placeholder="e.g. 2-4, 3+, Any"
                    />
                  </div>

                  <div>
                    <Label htmlFor="difficulty">Difficulty</Label>
                    <select
                      id="difficulty"
                      value={formData.difficulty}
                      onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as "Easy" | "Medium" | "Hard" }))}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>

                <Button onClick={handleCreateGame} className="w-full" size="lg">
                  {editingGame ? "Update Game" : "Create Game"}
                </Button>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="text-center text-sm text-muted-foreground space-y-1">
            <p>Create custom party games, share rules, and have fun!</p>
            <p>Use templates for quick starts or build from scratch.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomGames;