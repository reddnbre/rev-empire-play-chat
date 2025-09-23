import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { GameCanvas } from './GameCanvas';
import { GameControls } from './GameControls';
import { BotAI, createBotAI } from './BotAI';
import GameResultDialog from '../GameResultDialog';
import { 
  GameState, 
  BotDifficulty, 
  Tank, 
  Projectile, 
  Explosion 
} from './gameTypes';
import { 
  GAME_CONSTANTS, 
  updateProjectilePhysics, 
  checkCollisions, 
  createExplosion, 
  updateExplosion, 
  generateWind 
} from './gamePhysics';

interface CannonDuelGameProps {
  onBack: () => void;
}

export const CannonDuelGame: React.FC<CannonDuelGameProps> = ({ onBack }) => {
  const animationRef = useRef<number>();
  const botRef = useRef<BotAI>(createBotAI('medium'));
  const { playMove, playWin, playLose } = useSoundEffects();

  const [showResult, setShowResult] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    currentPlayer: 1,
    gamePhase: 'move',
    gameMode: 'pvp',
    botDifficulty: 'medium',
    player1Tank: {
      x: 80,
      y: GAME_CONSTANTS.GROUND_Y - GAME_CONSTANTS.TANK_SIZE,
      hp: 100,
      maxHp: 100,
      id: 1
    },
    player2Tank: {
      x: GAME_CONSTANTS.CANVAS_WIDTH - 80,
      y: GAME_CONSTANTS.GROUND_Y - GAME_CONSTANTS.TANK_SIZE,
      hp: 100,
      maxHp: 100,
      id: 2
    },
    projectile: {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      active: false,
      trail: []
    },
    explosions: [],
    wind: generateWind(),
    angle: 45,
    power: 50,
    winner: null,
    player2Joined: false,
    roundCount: 1
  });

  // Game loop
  const gameLoop = useCallback(() => {
    setGameState(prevState => {
      let newState = { ...prevState };

      // Update projectile
      if (newState.projectile.active) {
        const updatedProjectile = updateProjectilePhysics(newState.projectile, newState.wind);
        
        // Check bounds
        if (updatedProjectile.x < 0 || updatedProjectile.x > GAME_CONSTANTS.CANVAS_WIDTH) {
          newState.projectile = { ...updatedProjectile, active: false };
          setTimeout(() => nextTurn(), 500);
          return newState;
        }

        const collision = checkCollisions(updatedProjectile, newState.player1Tank, newState.player2Tank);
        
        if (collision.hitGround || collision.hitTank) {
          const explosion = createExplosion(collision.impactPoint.x, collision.impactPoint.y);
          newState.explosions = [...newState.explosions, explosion];
          newState.projectile = { ...updatedProjectile, active: false };
          
          if (collision.hitTank) {
            setTimeout(() => damagePlayer(collision.hitTank!.id as 1 | 2), 200);
          } else {
            setTimeout(() => nextTurn(), 800);
          }
          
          playMove();
        } else {
          newState.projectile = updatedProjectile;
        }
      }

      // Update explosions
      newState.explosions = newState.explosions
        .map(updateExplosion)
        .filter(explosion => explosion.active);

      return newState;
    });

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [playMove]);

  const damagePlayer = useCallback((player: 1 | 2) => {
    const damage = 25;
    
    setGameState(prevState => {
      const newState = { ...prevState };
      
      if (player === 1) {
        const newHp = Math.max(0, newState.player1Tank.hp - damage);
        newState.player1Tank = { ...newState.player1Tank, hp: newHp };
        
        if (newHp <= 0) {
          setTimeout(() => {
            setGameState(state => ({ ...state, winner: 2, gamePhase: 'finished' }));
            setShowResult(true);
            playLose();
          }, 500);
        } else {
          setTimeout(() => nextTurn(), 1000);
        }
      } else {
        const newHp = Math.max(0, newState.player2Tank.hp - damage);
        newState.player2Tank = { ...newState.player2Tank, hp: newHp };
        
        if (newHp <= 0) {
          setTimeout(() => {
            setGameState(state => ({ ...state, winner: 1, gamePhase: 'finished' }));
            setShowResult(true);
            playWin();
          }, 500);
        } else {
          setTimeout(() => nextTurn(), 1000);
        }
      }
      
      return newState;
    });
  }, [playWin, playLose]);

  const nextTurn = useCallback(() => {
    setGameState(prevState => {
      const newState = { 
        ...prevState,
        currentPlayer: (prevState.currentPlayer === 1 ? 2 : 1) as 1 | 2,
        gamePhase: 'move' as const,
        angle: 45,
        power: 50,
        wind: generateWind(), // New wind each turn
        roundCount: prevState.currentPlayer === 2 ? prevState.roundCount + 1 : prevState.roundCount
      };
      
      // Bot turn
      if (newState.gameMode === 'bot' && newState.currentPlayer === 2) {
        setTimeout(() => {
          botTurn();
        }, 1000);
      }
      
      return newState;
    });
  }, []);

  const botTurn = useCallback(() => {
    const { angle, power, thinkingTime } = botRef.current.calculateShot(
      gameState.player2Tank,
      gameState.player1Tank,
      gameState.wind
    );

    setGameState(prevState => ({
      ...prevState,
      angle,
      power,
      gamePhase: 'aim'
    }));

    setTimeout(() => {
      fire();
    }, thinkingTime);
  }, [gameState.player2Tank, gameState.player1Tank, gameState.wind]);

  const moveTank = useCallback((direction: 'left' | 'right') => {
    if (gameState.gamePhase !== 'move') return;
    
    const moveAmount = 20;
    setGameState(prevState => {
      const newState = { ...prevState };
      
      if (newState.currentPlayer === 1) {
        const newX = newState.player1Tank.x + (direction === 'left' ? -moveAmount : moveAmount);
        newState.player1Tank = {
          ...newState.player1Tank,
          x: Math.max(50, Math.min(GAME_CONSTANTS.CANVAS_WIDTH / 2 - 100, newX))
        };
      } else {
        const newX = newState.player2Tank.x + (direction === 'left' ? -moveAmount : moveAmount);
        newState.player2Tank = {
          ...newState.player2Tank,
          x: Math.max(GAME_CONSTANTS.CANVAS_WIDTH / 2 + 100, Math.min(GAME_CONSTANTS.CANVAS_WIDTH - 50, newX))
        };
      }
      
      return newState;
    });
  }, [gameState.gamePhase]);

  const startAiming = useCallback(() => {
    setGameState(prevState => ({ ...prevState, gamePhase: 'aim' }));
  }, []);

  const fire = useCallback(() => {
    if (gameState.gamePhase !== 'aim') return;
    
    const currentTank = gameState.currentPlayer === 1 ? gameState.player1Tank : gameState.player2Tank;
    const radians = (gameState.angle * Math.PI) / 180;
    const velocity = gameState.power / 8;
    const direction = gameState.currentPlayer === 1 ? 1 : -1;
    
    // Spawn projectile at barrel tip to avoid self-collision
    const barrelOffset = 25;
    const spawnX = currentTank.x + Math.cos(radians) * barrelOffset * direction;
    const spawnY = currentTank.y + GAME_CONSTANTS.TANK_SIZE / 2 - Math.sin(radians) * barrelOffset;
    
    setGameState(prevState => ({
      ...prevState,
      projectile: {
        x: spawnX,
        y: spawnY,
        vx: velocity * Math.cos(radians) * direction,
        vy: -velocity * Math.sin(radians),
        active: true,
        trail: []
      },
      gamePhase: 'firing'
    }));
    
    playMove();
  }, [gameState, playMove]);

  const resetGame = useCallback(() => {
    setGameState({
      currentPlayer: 1,
      gamePhase: 'move',
      gameMode: gameState.gameMode,
      botDifficulty: gameState.botDifficulty,
      player1Tank: {
        x: 80,
        y: GAME_CONSTANTS.GROUND_Y - GAME_CONSTANTS.TANK_SIZE,
        hp: 100,
        maxHp: 100,
        id: 1
      },
      player2Tank: {
        x: GAME_CONSTANTS.CANVAS_WIDTH - 80,
        y: GAME_CONSTANTS.GROUND_Y - GAME_CONSTANTS.TANK_SIZE,
        hp: 100,
        maxHp: 100,
        id: 2
      },
      projectile: {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        active: false,
        trail: []
      },
      explosions: [],
      wind: generateWind(),
      angle: 45,
      power: 50,
      winner: null,
      player2Joined: false,
      roundCount: 1
    });
    setShowResult(false);
    botRef.current.reset();
  }, [gameState.gameMode, gameState.botDifficulty]);

  // Game mode handlers
  const handleGameModeChange = useCallback((mode: 'pvp' | 'bot') => {
    setGameState(prevState => ({ ...prevState, gameMode: mode, player2Joined: mode === 'bot' }));
  }, []);

  const handleBotDifficultyChange = useCallback((difficulty: BotDifficulty) => {
    setGameState(prevState => ({ ...prevState, botDifficulty: difficulty }));
    botRef.current.setDifficulty(difficulty);
  }, []);

  const handleAngleChange = useCallback((angle: number[]) => {
    setGameState(prevState => ({ ...prevState, angle: angle[0] }));
  }, []);

  const handlePowerChange = useCallback((power: number[]) => {
    setGameState(prevState => ({ ...prevState, power: power[0] }));
  }, []);

  // Auto-switch to bot mode after 60 seconds in PvP
  useEffect(() => {
    if (gameState.gameMode === 'pvp' && !gameState.player2Joined) {
      const timeout = setTimeout(() => {
        handleGameModeChange('bot');
      }, 60000); // 60 seconds

      return () => clearTimeout(timeout);
    }
  }, [gameState.gameMode, gameState.player2Joined, handleGameModeChange]);

  // Simulate player 2 joining (replace with real multiplayer logic)
  useEffect(() => {
    if (gameState.gameMode === 'pvp' && gameState.currentPlayer === 2 && !gameState.player2Joined) {
      setGameState(prevState => ({ ...prevState, player2Joined: true }));
    }
  }, [gameState.currentPlayer, gameState.gameMode, gameState.player2Joined]);

  // Start game loop
  useEffect(() => {
    animationRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameLoop]);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4">
      <GameControls
        gameState={gameState}
        onBack={onBack}
        onGameModeChange={handleGameModeChange}
        onBotDifficultyChange={handleBotDifficultyChange}
        onMoveTank={moveTank}
        onStartAiming={startAiming}
        onAngleChange={handleAngleChange}
        onPowerChange={handlePowerChange}
        onFire={fire}
        onNewGame={resetGame}
      />

      {/* Game Canvas */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
        <CardContent className="p-6">
          <GameCanvas
            gameState={gameState}
            className="border-2 border-slate-600 rounded-xl shadow-2xl w-full max-w-full h-auto bg-slate-900"
          />
        </CardContent>
      </Card>

      {/* Game Result Dialog */}
      <GameResultDialog
        open={showResult}
        onClose={() => setShowResult(false)}
        result={gameState.winner === 1 ? 'win' : 'lose'}
        title={gameState.winner === 1 ? 'Victory!' : (gameState.gameMode === 'bot' ? 'Bot Wins!' : 'Player 2 Wins!')}
        message={gameState.winner === 1 ? 'Enemy tank destroyed! You are victorious!' : 'Your tank was destroyed!'}
        gameName="Cannon Duel"
        onNewGame={resetGame}
        onBackToChat={onBack}
      />
    </div>
  );
};