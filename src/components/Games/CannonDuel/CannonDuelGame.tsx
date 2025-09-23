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
  createClusterExplosions,
  updateExplosion, 
  generateWind 
} from './gamePhysics';
import { 
  spawnRandomPowerups, 
  updatePowerups, 
  checkPowerupCollision, 
  applyPowerupEffect,
  updateTankPowerups,
  modifyProjectileWithPowerups,
  calculateDamageWithPowerups
} from './powerupSystem';
import { generateRandomObstacles, checkObstacleCollision, damageObstacle } from './TerrainObstacles';
import { calculateExplosionDamage } from './explosionDamage';

interface CannonDuelGameProps {
  onBack: () => void;
  initialGameMode?: 'pvp' | 'bot';
}

export const CannonDuelGame: React.FC<CannonDuelGameProps> = ({ onBack, initialGameMode = 'pvp' }) => {
  const animationRef = useRef<number>();
  const botRef = useRef<BotAI>(createBotAI());
  const { 
    playMove, 
    playWin, 
    playLose, 
    playCannonFire, 
    playMissileLaunch, 
    playPlasmaShot, 
    playClusterBomb, 
    playNapalmFire,
    playExplosion,
    playNapalmExplosion,
    playClusterExplosion
  } = useSoundEffects();

  const [showResult, setShowResult] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    currentPlayer: 1,
    gamePhase: 'move',
    gameMode: initialGameMode,
    botDifficulty: 'medium',
    player1Tank: {
      x: 80,
      y: GAME_CONSTANTS.GROUND_Y - GAME_CONSTANTS.TANK_SIZE,
      hp: 100,
      maxHp: 100,
      id: 1,
      powerups: []
    },
    player2Tank: {
      x: GAME_CONSTANTS.CANVAS_WIDTH - 80,
      y: GAME_CONSTANTS.GROUND_Y - GAME_CONSTANTS.TANK_SIZE,
      hp: 100,
      maxHp: 100,
      id: 2,
      powerups: []
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
    player2Joined: initialGameMode === 'bot',
    roundCount: 1,
    powerups: [],
    activePowerup: null,
    obstacles: generateRandomObstacles(GAME_CONSTANTS.CANVAS_WIDTH, GAME_CONSTANTS.GROUND_Y),
    inLobby: false
  });

  // Game loop
  const gameLoop = useCallback(() => {
    setGameState(prevState => {
      let newState = { ...prevState };

      // Update powerups
      newState.powerups = spawnRandomPowerups(newState.powerups);
      newState.powerups = updatePowerups(newState.powerups);

      // Check powerup collisions
      const p1Collision = checkPowerupCollision(newState.player1Tank, newState.powerups);
      const p2Collision = checkPowerupCollision(newState.player2Tank, newState.powerups);
      
      if (p1Collision) {
        newState.player1Tank = applyPowerupEffect(newState.player1Tank, p1Collision);
        newState.powerups = newState.powerups.map(p => 
          p.id === p1Collision.id ? { ...p, collected: true, active: false } : p
        );
      }
      
      if (p2Collision) {
        newState.player2Tank = applyPowerupEffect(newState.player2Tank, p2Collision);
        newState.powerups = newState.powerups.map(p => 
          p.id === p2Collision.id ? { ...p, collected: true, active: false } : p
        );
      }

      // Tank powerups are updated only during turn transitions, not every frame

      // Update projectile
      if (newState.projectile.active) {
        const targetTank = newState.currentPlayer === 1 ? newState.player2Tank : newState.player1Tank;
        const updatedProjectile = updateProjectilePhysics(newState.projectile, newState.wind, targetTank);
        
        // Check bounds for non-bouncing projectiles
        if ((updatedProjectile.x < 0 || updatedProjectile.x > GAME_CONSTANTS.CANVAS_WIDTH) && !(updatedProjectile as any).bounces) {
          newState.projectile = { ...updatedProjectile, active: false };
          setTimeout(() => nextTurn(), 500);
          return newState;
        }

        const collision = checkCollisions(updatedProjectile, newState.player1Tank, newState.player2Tank);
        
        // Check obstacle collisions
        const obstacleCollision = checkObstacleCollision(updatedProjectile.x, updatedProjectile.y, newState.obstacles);
        
        if (obstacleCollision.hit && obstacleCollision.obstacle) {
          // Damage obstacle
          newState.obstacles = newState.obstacles.map(obs => 
            obs.id === obstacleCollision.obstacle!.id 
              ? damageObstacle(obs, 25) 
              : obs
          );
          
          const explosion = createExplosion(
            obstacleCollision.hitPoint!.x, 
            obstacleCollision.hitPoint!.y, 
            newState.projectile.explosionType || 'normal',
            newState.projectile.damage || 25,
            newState.currentPlayer
          );
          newState.explosions = [...newState.explosions, explosion];
          
          // Play appropriate explosion sound
          const explosionType = newState.projectile.explosionType || 'normal';
          switch (explosionType) {
            case 'napalm':
              playNapalmExplosion();
              break;
            case 'cluster':
              playClusterExplosion();
              break;
            default:
              playExplosion();
          }
          newState.projectile = { ...updatedProjectile, active: false };
          setTimeout(() => nextTurn(), 800);
          playMove();
        } else if (collision.hitGround || collision.hitTank) {
          // Use projectile's explosion type or determine from properties
          const explosionType = newState.projectile.explosionType || 'normal';
          
          const explosion = createExplosion(
            collision.impactPoint.x, 
            collision.impactPoint.y, 
            explosionType,
            newState.projectile.damage || 25,
            newState.currentPlayer
          );
          newState.explosions = [...newState.explosions, explosion];
          
          // Play appropriate explosion sound
          switch (explosionType) {
            case 'napalm':
              playNapalmExplosion();
              break;
            case 'cluster':
              playClusterExplosion();
              break;
            default:
              playExplosion();
          }
          
          // Handle cluster bombs
          if ((collision as any).shouldCreateCluster) {
            const clusterDamage = Math.floor((newState.projectile.damage || 25) * 0.6); // Cluster bombs do 60% damage each
            const clusterExplosions = createClusterExplosions(collision.impactPoint.x, collision.impactPoint.y, clusterDamage, newState.currentPlayer);
            newState.explosions = [...newState.explosions, ...clusterExplosions];
          }
          
          newState.projectile = { ...updatedProjectile, active: false };
          
          if (collision.hitTank) {
            // Bot learning - record hit
            if (newState.currentPlayer === 2) {
              const distance = Math.abs(newState.player2Tank.x - newState.player1Tank.x);
              botRef.current.recordShotResult(distance, newState.angle, 'hit');
            }
            setTimeout(() => handleDamagePlayer(collision.hitTank!.id as 1 | 2), 200);
          } else {
            // Bot learning - record miss or close
            if (newState.currentPlayer === 2) {
              const distance = Math.abs(newState.player2Tank.x - newState.player1Tank.x);
              const hitDistance = Math.abs(collision.impactPoint.x - (collision.hitTank ? collision.hitTank.x : newState.player1Tank.x));
              const result = hitDistance < 50 ? 'close' : 'miss';
              botRef.current.recordShotResult(distance, newState.angle, result);
            }
            setTimeout(() => nextTurn(), 800);
          }
          
          playMove();
        } else {
          newState.projectile = updatedProjectile;
        }
      }

      // Update explosions and apply area damage
      // First, apply area damage from new explosions (frame 0 only)
      newState.explosions.forEach(explosion => {
        if (explosion.frame === 0) { // Only apply damage on explosion start
          const damageResult = calculateExplosionDamage(explosion, newState.player1Tank, newState.player2Tank);
          
          // Apply damage to player 1
          if (damageResult.player1Damage > 0) {
            newState.player1Tank = {
              ...newState.player1Tank,
              hp: Math.max(0, newState.player1Tank.hp - damageResult.player1Damage),
              shield: damageResult.player1NewShield
            };
          }
          
          // Apply damage to player 2
          if (damageResult.player2Damage > 0) {
            newState.player2Tank = {
              ...newState.player2Tank,
              hp: Math.max(0, newState.player2Tank.hp - damageResult.player2Damage),
              shield: damageResult.player2NewShield
            };
          }
        }
      });
      
      newState.explosions = newState.explosions
        .map(updateExplosion)
        .filter(explosion => explosion.active);

      return newState;
    });

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [playMove]);

  const nextTurn = useCallback(() => {
    setGameState(prevState => {
      let newState = { 
        ...prevState,
        currentPlayer: (prevState.currentPlayer === 1 ? 2 : 1) as 1 | 2,
        gamePhase: 'move' as const,
        angle: 45,
        power: 50,
        wind: generateWind(),
        roundCount: prevState.currentPlayer === 2 ? prevState.roundCount + 1 : prevState.roundCount
      };
      
      // Update tank powerups only during turn transitions
      newState.player1Tank = updateTankPowerups(newState.player1Tank);
      newState.player2Tank = updateTankPowerups(newState.player2Tank);
      
      if (newState.gameMode === 'bot' && newState.currentPlayer === 2) {
        setTimeout(() => {
          botTurn();
        }, 1000);
      }
      
      return newState;
    });
  }, []);

  const handleDamagePlayer = useCallback((player: 1 | 2) => {
    setGameState(prevState => {
      const newState = { ...prevState };
      const attackerTank = player === 1 ? newState.player2Tank : newState.player1Tank;
      const defenderTank = player === 1 ? newState.player1Tank : newState.player2Tank;
      
      // Calculate damage using projectile's damage property or fallback
      const projectileDamage = newState.projectile.damage || 25;
      const { damage, newShield } = calculateDamageWithPowerups(projectileDamage, attackerTank.powerups, defenderTank);
      
      if (player === 1) {
        const newHp = Math.max(0, newState.player1Tank.hp - damage);
        newState.player1Tank = { 
          ...newState.player1Tank, 
          hp: newHp,
          shield: newShield
        };
        
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
        newState.player2Tank = { 
          ...newState.player2Tank, 
          hp: newHp,
          shield: newShield
        };
        
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
  }, [nextTurn, playWin, playLose]);

  const botTurn = useCallback(() => {
    setGameState(prevState => {
      const botDecision = botRef.current.calculateShot(
        prevState.player2Tank,
        prevState.player1Tank,
        prevState.wind,
        prevState.powerups,
        prevState.obstacles
      );
      
      console.log('Bot AI Decision:', {
        angle: botDecision.angle.toFixed(1),
        power: botDecision.power.toFixed(1),
        shouldMove: botDecision.shouldMove,
        thinkingTime: botDecision.thinkingTime,
        strategicReason: botDecision.strategicReason
      });

      // Handle bot movement
      if (botDecision.shouldMove) {
        const moveAmount = Math.random() * 30 + 20; // 20-50 pixel movement
        const newX = prevState.player2Tank.x + (botDecision.shouldMove === 'left' ? -moveAmount : moveAmount);
        const clampedX = Math.max(
          GAME_CONSTANTS.CANVAS_WIDTH / 2 + 100, 
          Math.min(GAME_CONSTANTS.CANVAS_WIDTH - 50, newX)
        );
        
        const newState = {
          ...prevState,
          player2Tank: {
            ...prevState.player2Tank,
            x: clampedX
          },
          angle: botDecision.angle,
          power: botDecision.power,
          gamePhase: 'aim' as const
        };
        
        // After movement, proceed with aiming
        setTimeout(() => {
          fire(); // Use existing fire function
        }, botDecision.thinkingTime);
        
        return newState;
      } else {
        const newState = {
          ...prevState,
          angle: botDecision.angle,
          power: botDecision.power,
          gamePhase: 'aim' as const
        };

        setTimeout(() => {
          fire(); // Use existing fire function
        }, botDecision.thinkingTime);

        return newState;
      }
    });
  }, []);

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
    setGameState(prevState => {
      if (prevState.gamePhase !== 'aim') return prevState;
      
      const currentTank = prevState.currentPlayer === 1 ? prevState.player1Tank : prevState.player2Tank;
      const targetTank = prevState.currentPlayer === 1 ? prevState.player2Tank : prevState.player1Tank;
      const radians = (prevState.angle * Math.PI) / 180;
      const velocity = prevState.power / 8;
      const direction = prevState.currentPlayer === 1 ? 1 : -1;
      
      // Spawn projectile at barrel tip to avoid self-collision
      const barrelOffset = 25;
      const spawnX = currentTank.x + Math.cos(radians) * barrelOffset * direction;
      const spawnY = currentTank.y + GAME_CONSTANTS.TANK_SIZE / 2 - Math.sin(radians) * barrelOffset;
      
      const baseProjectile = {
        x: spawnX,
        y: spawnY,
        vx: velocity * Math.cos(radians) * direction,
        vy: -velocity * Math.sin(radians),
        active: true,
        trail: [],
        ownerId: prevState.currentPlayer,
        framesSinceFired: 0,
        damage: 25,
        explosionType: 'normal' as const
      };

      const projectiles = modifyProjectileWithPowerups(baseProjectile, currentTank, targetTank);
      
      // Play appropriate firing sound based on projectile type
      const projectileType = projectiles[0]?.projectileType || 'basic';
      switch (projectileType) {
        case 'missile':
          playMissileLaunch();
          break;
        case 'plasma':
          playPlasmaShot();
          break;
        case 'cluster':
          playClusterBomb();
          break;
        case 'napalm':
          playNapalmFire();
          break;
        default:
          playCannonFire();
      }
      
      return {
        ...prevState,
        projectile: projectiles[0],
        projectiles: projectiles, // Store all projectiles
        gamePhase: 'firing' as const
      };
    });
  }, [playMove]);

  const resetGame = useCallback(() => {
    setGameState(prevState => ({
      currentPlayer: 1,
      gamePhase: 'move',
      gameMode: prevState.gameMode,
      botDifficulty: prevState.botDifficulty,
      player1Tank: {
        x: 80,
        y: GAME_CONSTANTS.GROUND_Y - GAME_CONSTANTS.TANK_SIZE,
        hp: 100,
        maxHp: 100,
        id: 1,
        powerups: []
      },
      player2Tank: {
        x: GAME_CONSTANTS.CANVAS_WIDTH - 80,
        y: GAME_CONSTANTS.GROUND_Y - GAME_CONSTANTS.TANK_SIZE,
        hp: 100,
        maxHp: 100,
        id: 2,
        powerups: []
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
      player2Joined: prevState.gameMode === 'bot',
      roundCount: 1,
      powerups: [],
      activePowerup: null,
      obstacles: generateRandomObstacles(GAME_CONSTANTS.CANVAS_WIDTH, GAME_CONSTANTS.GROUND_Y),
      inLobby: false
    }));
    setShowResult(false);
    botRef.current.reset();
  }, []);

  // Game mode handlers
  const handleGameModeChange = useCallback((mode: 'pvp' | 'bot') => {
    setGameState(prevState => ({ ...prevState, gameMode: mode, player2Joined: mode === 'bot' }));
  }, []);

  const handleBotDifficultyChange = useCallback((difficulty: BotDifficulty) => {
    // Bot is now always strategic - no difficulty levels
    setGameState(prevState => ({ ...prevState, botDifficulty: 'hard' }));
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
      <div className="flex gap-4">
        {/* Game Canvas */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 flex-1">
          <CardContent className="p-6">
            <GameCanvas
              gameState={gameState}
              className="border-2 border-slate-600 rounded-xl shadow-2xl w-full max-w-full h-auto bg-slate-900"
            />
          </CardContent>
        </Card>

        {/* Controls Panel */}
        <div className="w-80 flex-shrink-0">
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
        </div>
      </div>

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