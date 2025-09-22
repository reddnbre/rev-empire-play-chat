import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, Construction } from "lucide-react";

interface SimpleGameProps {
  onBack: () => void;
  gameName: string;
  gameDescription: string;
}

const SimpleGame = ({ onBack, gameName, gameDescription }: SimpleGameProps) => {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Games
        </Button>
      </div>

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Trophy className="h-5 w-5" />
            {gameName}
          </CardTitle>
          <CardDescription>
            {gameDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-12">
            <Construction className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Coming Soon!</h3>
            <p className="text-muted-foreground mb-6">
              This game is currently under development and will be available soon.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>✨ Enhanced multiplayer features</p>
              <p>🎯 Advanced game mechanics</p>
              <p>🏆 Competitive scoring system</p>
            </div>
          </div>

          <div className="text-center">
            <Button onClick={onBack} className="flex items-center gap-2 mx-auto">
              Explore Other Games
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleGame;