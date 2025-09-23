import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, Target, Zap } from 'lucide-react';
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
const GROUND_Y = 350;
const TANK_SIZE = 30;
const GRAVITY = 0.3;
const EXPLOSION_FRAMES = 20;

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

  // Drawing functions
  const drawTank = (ctx: CanvasRenderingContext2D, tank: Tank, isPlayer1: boolean) => {
    // Tank body
    ctx.fillStyle = isPlayer1 ? '#4A90E2' : '#E24A4A';
    ctx.fillRect(tank.x - TANK_SIZE/2, tank.y, TANK_SIZE, TANK_SIZE);
    
    // Cannon
    const cannonLength = 25;
    const cannonAngle = isPlayer1 ? 0 : Math.PI;
    const cannonX = tank.x + Math.cos(cannonAngle) * cannonLength;
    const cannonY = tank.y + TANK_SIZE/2;
    
    ctx.strokeStyle = isPlayer1 ? '#2E5C8A' : '#A83232';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(tank.x, tank.y + TANK_SIZE/2);
    ctx.lineTo(cannonX, cannonY);
    ctx.stroke();

    // HP Bar
    const barWidth = 40;
    const barHeight = 6;
    const barX = tank.x - barWidth/2;
    const barY = tank.y - 15;
    
    // Background
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // HP
    const hpPercent = tank.hp / tank.maxHp;
    ctx.fillStyle = hpPercent > 0.5 ? '#4CAF50' : hpPercent > 0.25 ? '#FFC107' : '#F44336';
    ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
    
    // HP Text
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${tank.hp}/100`, tank.x, barY - 5);
  };

  const drawProjectile = (ctx: CanvasRenderingContext2D, proj: Projectile) => {
    if (!proj.active) return;
    
    ctx.fillStyle = '#FF6B35';
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, 4, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawExplosion = (ctx: CanvasRenderingContext2D, explosion: Explosion) => {
    if (!explosion.active) return;
    
    const progress = explosion.frame / EXPLOSION_FRAMES;
    const size = 30 * (1 - progress) + 10 * progress;
    const alpha = 1 - progress;
    
    ctx.globalAlpha = alpha;
    ctx.fillStyle = `hsl(${20 + progress * 40}, 100%, 50%)`;
    ctx.beginPath();
    ctx.arc(explosion.x, explosion.y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  };

  const drawBackground = (ctx: CanvasRenderingContext2D) => {
    // Sky
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#E0F6FF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, GROUND_Y);
    
    // Ground
    ctx.fillStyle = '#8B7355';
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
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

    // Trajectory preview when aiming
    if (gamePhase === 'aim') {
      const currentTank = currentPlayer === 1 ? player1Tank : player2Tank;
      const radians = (angle[0] * Math.PI) / 180;
      const velocity = power[0] / 10;
      const direction = currentPlayer === 1 ? 1 : -1;
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      
      let x = currentTank.x;
      let y = currentTank.y + TANK_SIZE/2;
      ctx.moveTo(x, y);
      
      for (let t = 0; t < 100; t += 2) {
        const newX = currentTank.x + (velocity * Math.cos(radians) * direction) * t;
        const newY = currentTank.y + TANK_SIZE/2 - (velocity * Math.sin(radians) * t - 0.5 * GRAVITY * t * t);
        
        if (newY >= GROUND_Y) break;
        
        ctx.lineTo(newX, newY);
        x = newX;
        y = newY;
      }
      
      ctx.stroke();
      ctx.setLineDash([]);
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
          nextTurn();
          return { ...prev, active: false };
        }
        
        // Check tank collisions
        const player1Hit = Math.abs(newX - player1Tank.x) < TANK_SIZE/2 && 
                          Math.abs(newY - (player1Tank.y + TANK_SIZE/2)) < TANK_SIZE/2;
        
        const player2Hit = Math.abs(newX - player2Tank.x) < TANK_SIZE/2 && 
                          Math.abs(newY - (player2Tank.y + TANK_SIZE/2)) < TANK_SIZE/2;
        
        if (player1Hit) {
          createExplosion(player1Tank.x, player1Tank.y + TANK_SIZE/2);
          damagePlayer(1);
          return { ...prev, active: false };
        }
        
        if (player2Hit) {
          createExplosion(player2Tank.x, player2Tank.y + TANK_SIZE/2);
          damagePlayer(2);
          return { ...prev, active: false };
        }
        
        // Check bounds
        if (newX < 0 || newX > CANVAS_WIDTH) {
          nextTurn();
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

  const damagePlayer = (player: 1 | 2) => {
    if (player === 1) {
      setPlayer1Tank(prev => {
        const newHp = Math.max(0, prev.hp - 20);
        if (newHp <= 0) {
          setWinner(2);
          setGamePhase('finished');
          setShowResult(true);
          playLose();
        }
        return { ...prev, hp: newHp };
      });
    } else {
      setPlayer2Tank(prev => {
        const newHp = Math.max(0, prev.hp - 20);
        if (newHp <= 0) {
          setWinner(1);
          setGamePhase('finished');
          setShowResult(true);
          playWin();
        }
        return { ...prev, hp: newHp };
      });
    }
    
    if (winner === null) {
      nextTurn();
    }
  };

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

  const fire = () => {
    if (gamePhase !== 'aim') return;
    
    const currentTank = currentPlayer === 1 ? player1Tank : player2Tank;
    const radians = (angle[0] * Math.PI) / 180;
    const velocity = power[0] / 10;
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
  };

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
      <Card>
        <CardContent className="p-4">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="border rounded-lg bg-sky-100 w-full max-w-full h-auto"
            style={{ aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}` }}
          />
        </CardContent>
      </Card>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
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