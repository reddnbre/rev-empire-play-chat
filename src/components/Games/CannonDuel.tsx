import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, Target, Zap, Shield, Crosshair } from 'lucide-react';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import GameResultDialog from './GameResultDialog';

interface CannonDuelProps {
  onBack: () => void;
}

interface Tank {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  active: boolean;
}

interface Explosion {
  x: number;
  y: number;
  frame: number;
  active: boolean;
}

type GamePhase = 'move' | 'aim' | 'firing' | 'finished';
type GameMode = 'pvp' | 'bot';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const GROUND_Y = 320;
const TANK_SIZE = 40;
const GRAVITY = 0.4;
const EXPLOSION_FRAMES = 30;
const PROJECTILE_SIZE = 6;

const CannonDuel: React.FC<CannonDuelProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const { playMove, playWin, playLose } = useSoundEffects();

  const [gameMode, setGameMode] = useState<GameMode>('pvp');
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [gamePhase, setGamePhase] = useState<GamePhase>('move');
  const [angle, setAngle] = useState([45]);
  const [power, setPower] = useState([50]);
  const [showResult, setShowResult] = useState(false);
  const [winner, setWinner] = useState<1 | 2 | null>(null);

  const [player1Tank, setPlayer1Tank] = useState<Tank>({
    x: 100,
    y: GROUND_Y - TANK_SIZE,
    hp: 100,
    maxHp: 100
  });

  const [player2Tank, setPlayer2Tank] = useState<Tank>({
    x: CANVAS_WIDTH - 100,
    y: GROUND_Y - TANK_SIZE,
    hp: 100,
    maxHp: 100
  });

  const [projectile, setProjectile] = useState<Projectile>({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    active: false
  });

  const [explosions, setExplosions] = useState<Explosion[]>([]);

  // Enhanced drawing functions
  const drawTank = (ctx: CanvasRenderingContext2D, tank: Tank, isPlayer1: boolean) => {
    const centerX = tank.x;
    const centerY = tank.y + TANK_SIZE/2;
    
    // Tank shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(centerX - TANK_SIZE/2 + 2, tank.y + 2, TANK_SIZE, TANK_SIZE);
    
    // Tank body gradient
    const gradient = ctx.createLinearGradient(centerX - TANK_SIZE/2, tank.y, centerX + TANK_SIZE/2, tank.y + TANK_SIZE);
    if (isPlayer1) {
      gradient.addColorStop(0, '#60A5FA');
      gradient.addColorStop(0.5, '#3B82F6');
      gradient.addColorStop(1, '#1E40AF');
    } else {
      gradient.addColorStop(0, '#F87171');
      gradient.addColorStop(0.5, '#EF4444');
      gradient.addColorStop(1, '#DC2626');
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(centerX - TANK_SIZE/2, tank.y, TANK_SIZE, TANK_SIZE);
    
    // Tank border
    ctx.strokeStyle = isPlayer1 ? '#1E3A8A' : '#991B1B';
    ctx.lineWidth = 2;
    ctx.strokeRect(centerX - TANK_SIZE/2, tank.y, TANK_SIZE, TANK_SIZE);
    
    // Cannon
    const cannonLength = 30;
    const cannonAngle = isPlayer1 ? 0 : Math.PI;
    const cannonX = centerX + Math.cos(cannonAngle) * cannonLength;
    const cannonY = centerY;
    
    ctx.strokeStyle = isPlayer1 ? '#1E3A8A' : '#991B1B';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(cannonX, cannonY);
    ctx.stroke();
    
    // Cannon tip
    ctx.fillStyle = isPlayer1 ? '#1E3A8A' : '#991B1B';
    ctx.beginPath();
    ctx.arc(cannonX, cannonY, 3, 0, Math.PI * 2);
    ctx.fill();

    // HP Bar background
    const barWidth = 50;
    const barHeight = 8;
    const barX = centerX - barWidth/2;
    const barY = tank.y - 20;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);
    
    // HP Bar
    const hpPercent = tank.hp / tank.maxHp;
    const hpGradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
    if (hpPercent > 0.6) {
      hpGradient.addColorStop(0, '#22C55E');
      hpGradient.addColorStop(1, '#16A34A');
    } else if (hpPercent > 0.3) {
      hpGradient.addColorStop(0, '#EAB308');
      hpGradient.addColorStop(1, '#CA8A04');
    } else {
      hpGradient.addColorStop(0, '#EF4444');
      hpGradient.addColorStop(1, '#DC2626');
    }
    
    ctx.fillStyle = hpGradient;
    ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
    
    // HP Text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeText(`${tank.hp}/100`, centerX, barY - 5);
    ctx.fillText(`${tank.hp}/100`, centerX, barY - 5);
  };

  const drawProjectile = (ctx: CanvasRenderingContext2D, proj: Projectile) => {
    if (!proj.active) return;
    
    // Projectile glow
    const glowGradient = ctx.createRadialGradient(proj.x, proj.y, 0, proj.x, proj.y, PROJECTILE_SIZE * 2);
    glowGradient.addColorStop(0, 'rgba(255, 107, 53, 0.8)');
    glowGradient.addColorStop(0.5, 'rgba(255, 107, 53, 0.4)');
    glowGradient.addColorStop(1, 'rgba(255, 107, 53, 0)');
    
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, PROJECTILE_SIZE * 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Projectile core
    const coreGradient = ctx.createRadialGradient(proj.x, proj.y, 0, proj.x, proj.y, PROJECTILE_SIZE);
    coreGradient.addColorStop(0, '#FFF');
    coreGradient.addColorStop(0.3, '#FF6B35');
    coreGradient.addColorStop(1, '#DC2626');
    
    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, PROJECTILE_SIZE, 0, Math.PI * 2);
    ctx.fill();
    
    // Projectile border
    ctx.strokeStyle = '#991B1B';
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  const drawExplosion = (ctx: CanvasRenderingContext2D, explosion: Explosion) => {
    if (!explosion.active) return;
    
    const progress = explosion.frame / EXPLOSION_FRAMES;
    const size = 40 * (1 - progress * 0.3);
    const alpha = 1 - progress;
    
    // Outer explosion ring
    ctx.globalAlpha = alpha * 0.6;
    const outerGradient = ctx.createRadialGradient(explosion.x, explosion.y, 0, explosion.x, explosion.y, size * 1.5);
    outerGradient.addColorStop(0, `hsl(${20 + progress * 20}, 100%, 60%)`);
    outerGradient.addColorStop(0.5, `hsl(${30 + progress * 30}, 100%, 50%)`);
    outerGradient.addColorStop(1, `hsl(${40 + progress * 40}, 100%, 30%)`);
    
    ctx.fillStyle = outerGradient;
    ctx.beginPath();
    ctx.arc(explosion.x, explosion.y, size * 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner explosion core
    ctx.globalAlpha = alpha;
    const innerGradient = ctx.createRadialGradient(explosion.x, explosion.y, 0, explosion.x, explosion.y, size);
    innerGradient.addColorStop(0, '#FFFFFF');
    innerGradient.addColorStop(0.3, `hsl(${50 + progress * 10}, 100%, 70%)`);
    innerGradient.addColorStop(0.8, `hsl(${30 + progress * 20}, 100%, 50%)`);
    innerGradient.addColorStop(1, `hsl(${10 + progress * 30}, 100%, 30%)`);
    
    ctx.fillStyle = innerGradient;
    ctx.beginPath();
    ctx.arc(explosion.x, explosion.y, size, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.globalAlpha = 1;
  };

  const drawBackground = (ctx: CanvasRenderingContext2D) => {
    // Sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    skyGradient.addColorStop(0, '#0F172A');
    skyGradient.addColorStop(0.3, '#1E293B');
    skyGradient.addColorStop(0.7, '#334155');
    skyGradient.addColorStop(1, '#475569');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, GROUND_Y);
    
    // Stars
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 50; i++) {
      const x = (i * 123) % CANVAS_WIDTH;
      const y = (i * 456) % (GROUND_Y - 50);
      ctx.beginPath();
      ctx.arc(x, y, Math.random() * 1.5 + 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Ground gradient
    const groundGradient = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_HEIGHT);
    groundGradient.addColorStop(0, '#44403C');
    groundGradient.addColorStop(0.5, '#57534E');
    groundGradient.addColorStop(1, '#292524');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
    
    // Ground texture
    ctx.fillStyle = 'rgba(120, 113, 108, 0.3)';
    for (let i = 0; i < CANVAS_WIDTH; i += 20) {
      const height = Math.random() * 10 + 5;
      ctx.fillRect(i, GROUND_Y, Math.random() * 15 + 5, height);
    }
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    drawBackground(ctx);
    drawTank(ctx, player1Tank, true);
    drawTank(ctx, player2Tank, false);
    drawProjectile(ctx, projectile);
    
    explosions.forEach(explosion => drawExplosion(ctx, explosion));

    // Enhanced trajectory preview when aiming
    if (gamePhase === 'aim' && (gameMode === 'pvp' || currentPlayer === 1)) {
      const currentTank = currentPlayer === 1 ? player1Tank : player2Tank;
      const radians = (angle[0] * Math.PI) / 180;
      const velocity = power[0] / 8;
      const direction = currentPlayer === 1 ? 1 : -1;
      
      // Trajectory line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      
      let x = currentTank.x;
      let y = currentTank.y + TANK_SIZE/2;
      ctx.moveTo(x, y);
      
      const points = [];
      for (let t = 0; t < 120; t += 3) {
        const newX = currentTank.x + (velocity * Math.cos(radians) * direction) * t;
        const newY = currentTank.y + TANK_SIZE/2 - (velocity * Math.sin(radians) * t - 0.5 * GRAVITY * t * t);
        
        if (newY >= GROUND_Y || newX < 0 || newX > CANVAS_WIDTH) break;
        
        points.push({ x: newX, y: newY });
        ctx.lineTo(newX, newY);
      }
      
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Trajectory dots
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      points.forEach((point, index) => {
        if (index % 4 === 0) {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }
  };

  // Game loop
  const gameLoop = () => {
    if (projectile.active) {
      setProjectile(prev => {
        const newX = prev.x + prev.vx;
        const newY = prev.y + prev.vy;
        const newVy = prev.vy + GRAVITY;
        
        // Check ground collision
        if (newY >= GROUND_Y) {
          createExplosion(newX, GROUND_Y);
          setTimeout(() => nextTurn(), 800);
          return { ...prev, active: false };
        }
        
        // Check tank collisions (improved hit detection)
        const player1Hit = Math.abs(newX - player1Tank.x) < TANK_SIZE/2 + PROJECTILE_SIZE && 
                          newY >= player1Tank.y && newY <= player1Tank.y + TANK_SIZE;
        
        const player2Hit = Math.abs(newX - player2Tank.x) < TANK_SIZE/2 + PROJECTILE_SIZE && 
                          newY >= player2Tank.y && newY <= player2Tank.y + TANK_SIZE;
        
        if (player1Hit) {
          createExplosion(newX, newY);
          damagePlayer(1);
          return { ...prev, active: false };
        }
        
        if (player2Hit) {
          createExplosion(newX, newY);
          damagePlayer(2);
          return { ...prev, active: false };
        }
        
        // Check bounds
        if (newX < 0 || newX > CANVAS_WIDTH) {
          setTimeout(() => nextTurn(), 500);
          return { ...prev, active: false };
        }
        
        return {
          ...prev,
          x: newX,
          y: newY,
          vy: newVy
        };
      });
    }

    // Update explosions
    setExplosions(prev => 
      prev.map(exp => ({
        ...exp,
        frame: exp.frame + 1,
        active: exp.frame < EXPLOSION_FRAMES
      })).filter(exp => exp.active)
    );

    draw();
    animationRef.current = requestAnimationFrame(gameLoop);
  };

  const createExplosion = (x: number, y: number) => {
    setExplosions(prev => [...prev, { x, y, frame: 0, active: true }]);
    playMove();
  };

  const damagePlayer = useCallback((player: 1 | 2) => {
    const damage = 25;
    
    if (player === 1) {
      setPlayer1Tank(prev => {
        const newHp = Math.max(0, prev.hp - damage);
        if (newHp <= 0) {
          setTimeout(() => {
            setWinner(2);
            setGamePhase('finished');
            setShowResult(true);
            playLose();
          }, 500);
        } else {
          setTimeout(() => nextTurn(), 1000);
        }
        return { ...prev, hp: newHp };
      });
    } else {
      setPlayer2Tank(prev => {
        const newHp = Math.max(0, prev.hp - damage);
        if (newHp <= 0) {
          setTimeout(() => {
            setWinner(1);
            setGamePhase('finished');
            setShowResult(true);
            playWin();
          }, 500);
        } else {
          setTimeout(() => nextTurn(), 1000);
        }
        return { ...prev, hp: newHp };
      });
    }
  }, [playWin, playLose]);

  const nextTurn = () => {
    setCurrentPlayer(prev => prev === 1 ? 2 : 1);
    setGamePhase('move');
    setAngle([45]);
    setPower([50]);
    
    // Bot turn
    if (gameMode === 'bot' && currentPlayer === 1) {
      setTimeout(() => {
        botTurn();
      }, 1000);
    }
  };

  const botTurn = () => {
    // Simple bot AI
    const targetX = player1Tank.x;
    const distance = Math.abs(player2Tank.x - targetX);
    
    // Calculate rough angle and power
    const roughAngle = 30 + Math.random() * 30;
    const roughPower = 40 + (distance / CANVAS_WIDTH) * 40;
    
    setAngle([roughAngle]);
    setPower([roughPower]);
    setGamePhase('aim');
    
    setTimeout(() => {
      fire();
    }, 2000);
  };

  const moveTank = (direction: 'left' | 'right') => {
    if (gamePhase !== 'move') return;
    
    const moveAmount = 20;
    if (currentPlayer === 1) {
      setPlayer1Tank(prev => ({
        ...prev,
        x: Math.max(50, Math.min(CANVAS_WIDTH/2 - 50, 
          prev.x + (direction === 'left' ? -moveAmount : moveAmount)))
      }));
    } else {
      setPlayer2Tank(prev => ({
        ...prev,
        x: Math.max(CANVAS_WIDTH/2 + 50, Math.min(CANVAS_WIDTH - 50, 
          prev.x + (direction === 'left' ? -moveAmount : moveAmount)))
      }));
    }
  };

  const startAiming = () => {
    setGamePhase('aim');
  };

  const fire = useCallback(() => {
    if (gamePhase !== 'aim') return;
    
    const currentTank = currentPlayer === 1 ? player1Tank : player2Tank;
    const radians = (angle[0] * Math.PI) / 180;
    const velocity = power[0] / 8;
    const direction = currentPlayer === 1 ? 1 : -1;
    
    setProjectile({
      x: currentTank.x,
      y: currentTank.y + TANK_SIZE/2,
      vx: velocity * Math.cos(radians) * direction,
      vy: -velocity * Math.sin(radians),
      active: true
    });
    
    setGamePhase('firing');
    playMove();
  }, [gamePhase, currentPlayer, player1Tank, player2Tank, angle, power, playMove]);

  const resetGame = () => {
    setPlayer1Tank({ x: 100, y: GROUND_Y - TANK_SIZE, hp: 100, maxHp: 100 });
    setPlayer2Tank({ x: CANVAS_WIDTH - 100, y: GROUND_Y - TANK_SIZE, hp: 100, maxHp: 100 });
    setCurrentPlayer(1);
    setGamePhase('move');
    setProjectile({ x: 0, y: 0, vx: 0, vy: 0, active: false });
    setExplosions([]);
    setWinner(null);
    setShowResult(false);
    setAngle([45]);
    setPower([50]);
  };

  useEffect(() => {
    animationRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [projectile, explosions, gamePhase, angle, power]);

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Games
        </Button>
        
        <div className="flex gap-2">
          <Button
            variant={gameMode === 'pvp' ? 'default' : 'outline'}
            onClick={() => setGameMode('pvp')}
            size="sm"
          >
            PvP
          </Button>
          <Button
            variant={gameMode === 'bot' ? 'default' : 'outline'}
            onClick={() => setGameMode('bot')}
            size="sm"
          >
            vs Bot
          </Button>
        </div>
      </div>

      {/* Game Info */}
      <div className="flex items-center justify-between">
        <div className="text-center">
          <Badge variant={currentPlayer === 1 ? 'default' : 'secondary'}>
            Player 1 Turn
          </Badge>
          <div className="text-sm text-muted-foreground mt-1">
            HP: {player1Tank.hp}/100
          </div>
        </div>
        
        <div className="text-center">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6" />
            Cannon Duel
          </h2>
          <div className="text-sm text-muted-foreground">
            Phase: {gamePhase === 'move' ? 'Move' : gamePhase === 'aim' ? 'Aim & Fire' : 'Firing'}
          </div>
        </div>
        
        <div className="text-center">
          <Badge variant={currentPlayer === 2 ? 'default' : 'secondary'}>
            {gameMode === 'bot' ? 'Bot' : 'Player 2'} Turn
          </Badge>
          <div className="text-sm text-muted-foreground mt-1">
            HP: {player2Tank.hp}/100
          </div>
        </div>
      </div>

      {/* Game Canvas */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
        <CardContent className="p-6">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="border-2 border-slate-600 rounded-xl shadow-2xl w-full max-w-full h-auto bg-slate-900"
            style={{ aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}` }}
          />
        </CardContent>
      </Card>

      {/* Controls */}
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            {currentPlayer === 1 ? <Shield className="w-5 h-5 text-blue-600" /> : <Crosshair className="w-5 h-5 text-red-600" />}
            {currentPlayer === 1 ? 'Player 1' : (gameMode === 'bot' ? 'Bot' : 'Player 2')} Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {gamePhase === 'move' && (gameMode === 'pvp' || currentPlayer === 1) && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Move Tank</label>
                <div className="flex gap-2 mt-2">
                  <Button onClick={() => moveTank('left')} size="sm">
                    ← Left
                  </Button>
                  <Button onClick={() => moveTank('right')} size="sm">
                    Right →
                  </Button>
                  <Button onClick={startAiming} variant="default" size="sm" className="ml-auto">
                    Ready to Aim
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {gamePhase === 'aim' && (gameMode === 'pvp' || currentPlayer === 1) && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Angle: {angle[0]}°</label>
                <Slider
                  value={angle}
                  onValueChange={setAngle}
                  max={90}
                  min={0}
                  step={1}
                  className="mt-2"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Power: {power[0]}%</label>
                <Slider
                  value={power}
                  onValueChange={setPower}
                  max={100}
                  min={10}
                  step={1}
                  className="mt-2"
                />
              </div>
              
              <Button onClick={fire} className="w-full" size="lg">
                <Zap className="w-4 h-4 mr-2" />
                FIRE!
              </Button>
            </div>
          )}
          
          {gamePhase === 'firing' && (
            <div className="text-center py-8">
              <div className="text-lg font-medium">Projectile in flight...</div>
              <div className="text-sm text-muted-foreground">Watch for impact!</div>
            </div>
          )}
          
          {(gameMode === 'bot' && currentPlayer === 2 && gamePhase !== 'finished') && (
            <div className="text-center py-8">
              <div className="text-lg font-medium">Bot is thinking...</div>
              <div className="text-sm text-muted-foreground">Calculating trajectory</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reset Button */}
      <div className="flex justify-center">
        <Button variant="outline" onClick={resetGame}>
          New Game
        </Button>
      </div>

      {/* Game Result Dialog */}
      <GameResultDialog
        open={showResult}
        onClose={() => setShowResult(false)}
        result={winner === 1 ? 'win' : 'lose'}
        title={winner === 1 ? 'Victory!' : (gameMode === 'bot' ? 'Bot Wins!' : 'Player 2 Wins!')}
        message={winner === 1 ? 'Tank destroyed! You are victorious!' : 'Your tank was destroyed!'}
        gameName="Cannon Duel"
        onNewGame={resetGame}
        onBackToChat={onBack}
      />
    </div>
  );
};

export default CannonDuel;