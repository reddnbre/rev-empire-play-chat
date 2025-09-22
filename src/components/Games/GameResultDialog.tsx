import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trophy, RotateCcw, MessageCircle, Sparkles } from "lucide-react";

interface GameResultDialogProps {
  open: boolean;
  onClose: () => void;
  result: "win" | "lose" | "draw";
  title?: string;
  message?: string;
  score?: number;
  onNewGame: () => void;
  onBackToChat: () => void;
  gameName?: string;
}

const GameResultDialog = ({
  open,
  onClose,
  result,
  title,
  message,
  score,
  onNewGame,
  onBackToChat,
  gameName = "Game"
}: GameResultDialogProps) => {
  const getResultConfig = () => {
    switch (result) {
      case "win":
        return {
          emoji: "🎉",
          title: title || "Victory!",
          message: message || "Congratulations! You won!",
          bgGradient: "bg-gradient-to-br from-green-50 to-emerald-50",
          iconColor: "text-green-600",
          borderColor: "border-green-200"
        };
      case "lose":
        return {
          emoji: "😔",
          title: title || "Game Over",
          message: message || "Better luck next time!",
          bgGradient: "bg-gradient-to-br from-red-50 to-rose-50",
          iconColor: "text-red-600",
          borderColor: "border-red-200"
        };
      case "draw":
        return {
          emoji: "🤝",
          title: title || "It's a Draw!",
          message: message || "Good game! Well played!",
          bgGradient: "bg-gradient-to-br from-blue-50 to-cyan-50",
          iconColor: "text-blue-600",
          borderColor: "border-blue-200"
        };
      default:
        return {
          emoji: "🎮",
          title: title || "Game Complete",
          message: message || "Thanks for playing!",
          bgGradient: "bg-gradient-to-br from-gray-50 to-slate-50",
          iconColor: "text-gray-600",
          borderColor: "border-gray-200"
        };
    }
  };

  const config = getResultConfig();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`sm:max-w-md ${config.bgGradient} ${config.borderColor} border-2 animate-scale-in`}>
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto space-y-2">
            {/* Animated celebration emoji */}
            <div className="text-6xl animate-fade-in">
              {config.emoji}
            </div>
            
            {/* Trophy icon for wins */}
            {result === "win" && (
              <div className="flex justify-center">
                <div className="relative">
                  <Trophy className={`h-12 w-12 ${config.iconColor} animate-scale-in`} />
                  <Sparkles className="h-4 w-4 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
                </div>
              </div>
            )}
          </div>
          
          <DialogTitle className={`text-2xl font-bold ${config.iconColor} animate-fade-in`}>
            {config.title}
          </DialogTitle>
          
          <DialogDescription className="text-lg text-gray-700 animate-fade-in">
            {config.message}
            {score !== undefined && (
              <div className="mt-2 font-semibold text-lg">
                Final Score: {score}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Celebration particles for wins */}
        {result === "win" && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
            <div className="absolute top-4 left-4 w-2 h-2 bg-yellow-400 rounded-full animate-ping" />
            <div className="absolute top-8 right-8 w-1 h-1 bg-green-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
            <div className="absolute bottom-12 left-8 w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
            <div className="absolute bottom-8 right-4 w-2 h-2 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: '1.5s' }} />
          </div>
        )}

        <DialogFooter className="flex flex-col sm:flex-row gap-3 animate-fade-in">
          <Button
            variant="outline"
            onClick={onNewGame}
            className="flex items-center gap-2 hover-scale"
          >
            <RotateCcw className="h-4 w-4" />
            Play Again
          </Button>
          <Button
            onClick={onBackToChat}
            className="flex items-center gap-2 hover-scale"
          >
            <MessageCircle className="h-4 w-4" />
            Back to Chat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GameResultDialog;