import React, { useRef, useEffect } from 'react';
import { Tank, Projectile, Explosion, WindEffect, GameState, Powerup } from './gameTypes';
import { GAME_CONSTANTS, calculateTrajectory } from './gamePhysics';
import { drawProjectileByType } from './ProjectileRenderer';
import { drawExplosionByType } from './ExplosionRenderer';

interface GameCanvasProps {
  gameState: GameState;
  className?: string;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawBackground = (ctx: CanvasRenderingContext2D) => {
    // Enhanced sky gradient with stars
    const skyGradient = ctx.createLinearGradient(0, 0, 0, GAME_CONSTANTS.GROUND_Y);
    skyGradient.addColorStop(0, '#0F172A');
    skyGradient.addColorStop(0.2, '#1E293B');
    skyGradient.addColorStop(0.5, '#334155');
    skyGradient.addColorStop(0.8, '#475569');
    skyGradient.addColorStop(1, '#64748B');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, GAME_CONSTANTS.CANVAS_WIDTH, GAME_CONSTANTS.GROUND_Y);

    // Optimized animated stars - reduced count and complexity
    ctx.fillStyle = '#FFFFFF';
    const time = Date.now() * 0.001;
    for (let i = 0; i < 30; i++) {
      const x = (i * 123 + time * 0.5) % GAME_CONSTANTS.CANVAS_WIDTH;
      const y = (i * 456) % (GAME_CONSTANTS.GROUND_Y - 50);
      const twinkle = Math.sin(time * 2 + i) * 0.3 + 0.7;
      ctx.globalAlpha = twinkle;
      ctx.fillRect(x, y, 1, 1);
    }
    ctx.globalAlpha = 1;

    // Enhanced ground with texture
    const groundGradient = ctx.createLinearGradient(0, GAME_CONSTANTS.GROUND_Y, 0, GAME_CONSTANTS.CANVAS_HEIGHT);
    groundGradient.addColorStop(0, '#44403C');
    groundGradient.addColorStop(0.3, '#57534E');
    groundGradient.addColorStop(0.7, '#44403C');
    groundGradient.addColorStop(1, '#1C1917');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, GAME_CONSTANTS.GROUND_Y, GAME_CONSTANTS.CANVAS_WIDTH, GAME_CONSTANTS.CANVAS_HEIGHT - GAME_CONSTANTS.GROUND_Y);

    // Optimized ground texture - pre-calculated pattern
    ctx.fillStyle = 'rgba(120, 113, 108, 0.4)';
    for (let i = 0; i < GAME_CONSTANTS.CANVAS_WIDTH; i += 20) {
      const height = Math.sin(i * 0.1) * 3 + (i % 13) + 3;
      ctx.fillRect(i, GAME_CONSTANTS.GROUND_Y, 15, height);
    }
  };

  const drawTank = (ctx: CanvasRenderingContext2D, tank: Tank, angle: number) => {
    const centerX = tank.x;
    const centerY = tank.y + GAME_CONSTANTS.TANK_SIZE / 2;
    const isPlayer1 = tank.id === 1;

    // Tank shadow with blur
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;

    // Tank body with metallic gradient
    const gradient = ctx.createRadialGradient(centerX, centerY - 10, 0, centerX, centerY, GAME_CONSTANTS.TANK_SIZE);
    if (isPlayer1) {
      gradient.addColorStop(0, '#93C5FD');
      gradient.addColorStop(0.3, '#60A5FA');
      gradient.addColorStop(0.7, '#3B82F6');
      gradient.addColorStop(1, '#1D4ED8');
    } else {
      gradient.addColorStop(0, '#FCA5A5');
      gradient.addColorStop(0.3, '#F87171');
      gradient.addColorStop(0.7, '#EF4444');
      gradient.addColorStop(1, '#DC2626');
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(centerX - GAME_CONSTANTS.TANK_SIZE / 2, tank.y, GAME_CONSTANTS.TANK_SIZE, GAME_CONSTANTS.TANK_SIZE);

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Tank details and rivets
    ctx.fillStyle = isPlayer1 ? '#1E40AF' : '#991B1B';
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 2; j++) {
        ctx.beginPath();
        ctx.arc(
          centerX - GAME_CONSTANTS.TANK_SIZE / 2 + 8 + i * 12,
          tank.y + 8 + j * 24,
          2,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }

    // Enhanced cannon with rotation
    const cannonLength = 35;
    const aimRadians = (angle * Math.PI) / 180;
    const cannonAngle = isPlayer1 ? -aimRadians : Math.PI + aimRadians;
    const cannonX = centerX + Math.cos(cannonAngle) * cannonLength;
    const cannonY = centerY + Math.sin(cannonAngle) * cannonLength;

    // Cannon base
    ctx.fillStyle = isPlayer1 ? '#1E3A8A' : '#7F1D1D';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
    ctx.fill();

    // Cannon barrel with gradient
    const cannonGradient = ctx.createLinearGradient(centerX, centerY - 4, centerX, centerY + 4);
    cannonGradient.addColorStop(0, isPlayer1 ? '#3B82F6' : '#EF4444');
    cannonGradient.addColorStop(0.5, isPlayer1 ? '#1E40AF' : '#DC2626');
    cannonGradient.addColorStop(1, isPlayer1 ? '#1E3A8A' : '#991B1B');

    ctx.strokeStyle = cannonGradient;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(cannonX, cannonY);
    ctx.stroke();

    // Cannon tip glow
    const tipGradient = ctx.createRadialGradient(cannonX, cannonY, 0, cannonX, cannonY, 6);
    tipGradient.addColorStop(0, '#FFFFFF');
    tipGradient.addColorStop(0.5, isPlayer1 ? '#60A5FA' : '#F87171');
    tipGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = tipGradient;
    ctx.beginPath();
    ctx.arc(cannonX, cannonY, 6, 0, Math.PI * 2);
    ctx.fill();

    // Enhanced HP bar
    const barWidth = 60;
    const barHeight = 10;
    const barX = centerX - barWidth / 2;
    const barY = tank.y - 25;

    // HP bar background with border
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

    // Animated HP bar
    const hpPercent = tank.hp / tank.maxHp;
    const hpGradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
    if (hpPercent > 0.7) {
      hpGradient.addColorStop(0, '#22C55E');
      hpGradient.addColorStop(1, '#16A34A');
    } else if (hpPercent > 0.4) {
      hpGradient.addColorStop(0, '#F59E0B');
      hpGradient.addColorStop(1, '#D97706');
    } else {
      hpGradient.addColorStop(0, '#EF4444');
      hpGradient.addColorStop(1, '#DC2626');
    }

    ctx.fillStyle = hpGradient;
    ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);

    // Shield bar (if tank has shield)
    if (tank.shield && tank.shield > 0) {
      const shieldBarY = barY - 15;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(barX - 1, shieldBarY - 1, barWidth + 2, 6);
      
      const shieldGradient = ctx.createLinearGradient(barX, shieldBarY, barX + barWidth, shieldBarY);
      shieldGradient.addColorStop(0, '#3B82F6');
      shieldGradient.addColorStop(1, '#1D4ED8');
      ctx.fillStyle = shieldGradient;
      ctx.fillRect(barX, shieldBarY, Math.min(barWidth, (tank.shield / 50) * barWidth), 4);
      
      // Shield glow effect around tank
      ctx.strokeStyle = '#00BFFF';
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.globalAlpha = 0.6 + 0.4 * Math.sin(Date.now() * 0.01); // Pulsing effect
      ctx.strokeRect(tank.x - GAME_CONSTANTS.TANK_SIZE / 2 - 3, tank.y - 3, GAME_CONSTANTS.TANK_SIZE + 6, GAME_CONSTANTS.TANK_SIZE + 6);
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }

    // HP text with outline
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000000';
    ctx.strokeText(`${tank.hp}`, centerX, barY - 8);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`${tank.hp}`, centerX, barY - 8);

    // Active powerups indicators
    if (tank.powerups.length > 0) {
      ctx.font = '16px Arial';
      tank.powerups.forEach((powerup, index) => {
        const iconX = centerX - (tank.powerups.length * 10) + (index * 20);
        const iconY = tank.y - 45;
        
        // Draw powerup icon background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(iconX - 8, iconY - 8, 16, 16);
        
        // Draw remaining turns indicator
        ctx.fillStyle = powerup.remaining > 1 ? '#22C55E' : '#F59E0B';
        ctx.fillRect(iconX - 8, iconY + 6, (powerup.remaining / powerup.duration) * 16, 2);
        
        // Draw icon (simplified as colored circle for now)
        const powerupColors: Record<string, string> = {
          missile: '#FF6B35',
          shield: '#3B82F6',
          double_shot: '#F59E0B',
          napalm: '#EF4444',
          long_shot: '#10B981',
          repair_kit: '#22C55E',
          bounce_shot: '#8B5CF6',
          cluster_bomb: '#DC2626',
          laser_sight: '#EC4899',
          armor_piercing: '#6B7280'
        };
        
        ctx.fillStyle = powerupColors[powerup.type] || '#FFFFFF';
        ctx.beginPath();
        ctx.arc(iconX, iconY, 6, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  };

  const drawProjectile = (ctx: CanvasRenderingContext2D, projectile: Projectile) => {
    if (!projectile.active) return;
    drawProjectileByType(ctx, projectile);
  };

  const drawExplosion = (ctx: CanvasRenderingContext2D, explosion: Explosion) => {
    if (!explosion.active) return;
    drawExplosionByType(ctx, explosion);
  };

  const drawWindIndicator = (ctx: CanvasRenderingContext2D, wind: WindEffect) => {
    // Wind strength indicator
    const windBarX = GAME_CONSTANTS.CANVAS_WIDTH - 120;
    const windBarY = 20;
    const windBarWidth = 100;
    const windBarHeight = 8;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(windBarX, windBarY, windBarWidth, windBarHeight);

    // Wind strength
    const windStrengthWidth = Math.abs(wind.strength * wind.direction) * windBarWidth;
    const windColor = wind.direction > 0 ? '#3B82F6' : '#EF4444';
    ctx.fillStyle = windColor;
    
    if (wind.direction > 0) {
      ctx.fillRect(windBarX + windBarWidth / 2, windBarY, windStrengthWidth / 2, windBarHeight);
    } else {
      ctx.fillRect(windBarX + windBarWidth / 2 - windStrengthWidth / 2, windBarY, windStrengthWidth / 2, windBarHeight);
    }

    // Wind text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeText('WIND', windBarX + windBarWidth / 2, windBarY - 5);
    ctx.fillText('WIND', windBarX + windBarWidth / 2, windBarY - 5);

    // Wind arrow
    const arrowX = windBarX + windBarWidth / 2 + (wind.direction * 15);
    const arrowY = windBarY + windBarHeight + 15;
    
    ctx.strokeStyle = windColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(arrowX - wind.direction * 10, arrowY);
    ctx.lineTo(arrowX + wind.direction * 10, arrowY);
    ctx.lineTo(arrowX + wind.direction * 5, arrowY - 5);
    ctx.moveTo(arrowX + wind.direction * 10, arrowY);
    ctx.lineTo(arrowX + wind.direction * 5, arrowY + 5);
    ctx.stroke();
  };

  const drawPowerups = (ctx: CanvasRenderingContext2D, powerups: Powerup[]) => {
    powerups.forEach(powerup => {
      if (!powerup.active || powerup.collected) return;
      
      // Floating animation
      const floatOffset = Math.sin(Date.now() * 0.003 + powerup.x * 0.01) * 3;
      const y = powerup.y + floatOffset;
      
      // Glow effect
      const glowGradient = ctx.createRadialGradient(powerup.x, y, 0, powerup.x, y, 25);
      glowGradient.addColorStop(0, 'rgba(255, 215, 0, 0.6)');
      glowGradient.addColorStop(0.7, 'rgba(255, 215, 0, 0.3)');
      glowGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
      
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(powerup.x, y, 25, 0, Math.PI * 2);
      ctx.fill();
      
      // Powerup box
      const boxSize = 20;
      const boxGradient = ctx.createLinearGradient(
        powerup.x - boxSize/2, y - boxSize/2, 
        powerup.x + boxSize/2, y + boxSize/2
      );
      boxGradient.addColorStop(0, 'rgba(255, 215, 0, 0.9)');
      boxGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
      boxGradient.addColorStop(1, 'rgba(255, 165, 0, 0.9)');
      
      ctx.fillStyle = boxGradient;
      ctx.fillRect(powerup.x - boxSize/2, y - boxSize/2, boxSize, boxSize);
      
      // Border
      ctx.strokeStyle = 'rgba(255, 215, 0, 1)';
      ctx.lineWidth = 2;
      ctx.strokeRect(powerup.x - boxSize/2, y - boxSize/2, boxSize, boxSize);
      
      // Icon (simplified colored circle)
      const powerupColors: Record<string, string> = {
        missile: '#FF6B35',
        shield: '#3B82F6',
        double_shot: '#F59E0B',
        napalm: '#EF4444',
        long_shot: '#10B981',
        repair_kit: '#22C55E',
        bounce_shot: '#8B5CF6',
        cluster_bomb: '#DC2626',
        laser_sight: '#EC4899',
        armor_piercing: '#6B7280'
      };
      
      ctx.fillStyle = powerupColors[powerup.type] || '#FFFFFF';
      ctx.beginPath();
      ctx.arc(powerup.x, y, 8, 0, Math.PI * 2);
      ctx.fill();
      
      // Timer indicator
      const timerPercent = 1 - (powerup.timer / powerup.maxTimer);
      if (timerPercent < 0.3) {
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(powerup.x, y, 12, -Math.PI/2, -Math.PI/2 + (timerPercent * 2 * Math.PI));
        ctx.stroke();
      }
    });
  };

  const drawTrajectoryPreview = (ctx: CanvasRenderingContext2D, gameState: GameState) => {
    if (gameState.gamePhase !== 'aim' || (gameState.gameMode === 'bot' && gameState.currentPlayer === 2)) return;

    const currentTank = gameState.currentPlayer === 1 ? gameState.player1Tank : gameState.player2Tank;
    const direction = gameState.currentPlayer === 1 ? 1 : -1;
    
    // Check for laser sight powerup
    const hasLaserSight = currentTank.powerups.some(p => p.type === 'laser_sight');
    
    const barrelOffset = 25;
    const radians = (gameState.angle * Math.PI) / 180;
    const startX = currentTank.x + Math.cos(radians) * barrelOffset * direction;
    const startY = currentTank.y + GAME_CONSTANTS.TANK_SIZE / 2 - Math.sin(radians) * barrelOffset;
    
    const trajectoryPoints = calculateTrajectory(startX, startY, gameState.angle, gameState.power, direction, gameState.wind);

    if (trajectoryPoints.length > 0) {
      // Enhanced trajectory for laser sight
      const trajectoryColor = hasLaserSight ? 'rgba(255, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)';
      const gradient = ctx.createLinearGradient(startX, startY, trajectoryPoints[trajectoryPoints.length - 1].x, trajectoryPoints[trajectoryPoints.length - 1].y);
      gradient.addColorStop(0, trajectoryColor);
      gradient.addColorStop(0.5, trajectoryColor.replace('0.8', '0.5'));
      gradient.addColorStop(1, trajectoryColor.replace('0.8', '0.2'));

      ctx.strokeStyle = gradient;
      ctx.lineWidth = hasLaserSight ? 4 : 3;
      ctx.setLineDash(hasLaserSight ? [5, 2] : [10, 5]);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      
      trajectoryPoints.forEach(point => {
        ctx.lineTo(point.x, point.y);
      });
      
      ctx.stroke();
      ctx.setLineDash([]);

      // Trajectory dots with glow
      trajectoryPoints.forEach((point, index) => {
        if (index % (hasLaserSight ? 3 : 6) === 0) {
          const alpha = 1 - (index / trajectoryPoints.length);
          const dotColor = hasLaserSight ? 'rgba(255, 0, 0' : 'rgba(255, 255, 255';
          const glowGradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, 8);
          glowGradient.addColorStop(0, `${dotColor}, ${alpha})`);
          glowGradient.addColorStop(0.5, `${dotColor}, ${alpha * 0.5})`);
          glowGradient.addColorStop(1, `${dotColor}, 0)`);

          ctx.fillStyle = glowGradient;
          ctx.beginPath();
          ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = `${dotColor}, ${alpha})`;
          ctx.beginPath();
          ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }
  };

  const drawObstacles = (ctx: CanvasRenderingContext2D, obstacles: any[]) => {
    obstacles.forEach(obstacle => {
      if (obstacle.hp <= 0) return; // Don't draw destroyed obstacles
      
      // Damage effect - reduce opacity based on health
      const healthPercent = obstacle.hp / obstacle.maxHp;
      ctx.globalAlpha = Math.max(0.3, healthPercent);
      
      // Obstacle colors based on type
      const colors = {
        wall: '#8B7355',
        bunker: '#4A4A4A',
        rock: '#6B7280',
        building: '#DC2626'
      };
      
      // Draw obstacle with gradient
      const gradient = ctx.createLinearGradient(
        obstacle.x, obstacle.y,
        obstacle.x + obstacle.width, obstacle.y + obstacle.height
      );
      const baseColor = colors[obstacle.type] || '#6B7280';
      gradient.addColorStop(0, baseColor);
      gradient.addColorStop(0.5, '#FFFFFF40');
      gradient.addColorStop(1, baseColor);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      
      // Border
      ctx.strokeStyle = baseColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      
      // Health bar for damaged obstacles
      if (healthPercent < 1) {
        const barWidth = obstacle.width;
        const barHeight = 4;
        const barX = obstacle.x;
        const barY = obstacle.y - 10;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        ctx.fillStyle = healthPercent > 0.5 ? '#22C55E' : '#EF4444';
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
      }
      
      ctx.globalAlpha = 1;
    });
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, GAME_CONSTANTS.CANVAS_WIDTH, GAME_CONSTANTS.CANVAS_HEIGHT);

    drawBackground(ctx);
    drawObstacles(ctx, gameState.obstacles);
    drawWindIndicator(ctx, gameState.wind);
    drawTank(ctx, gameState.player1Tank, gameState.currentPlayer === 1 ? gameState.angle : 45);
    drawTank(ctx, gameState.player2Tank, gameState.currentPlayer === 2 ? gameState.angle : 45);
    drawTrajectoryPreview(ctx, gameState);
    drawProjectile(ctx, gameState.projectile);
    drawPowerups(ctx, gameState.powerups);
    
    gameState.explosions.forEach(explosion => drawExplosion(ctx, explosion));
  };

  useEffect(() => {
    let animationId: number;
    
    const animate = () => {
      draw();
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [gameState]);

  return (
    <canvas
      ref={canvasRef}
      width={GAME_CONSTANTS.CANVAS_WIDTH}
      height={GAME_CONSTANTS.CANVAS_HEIGHT}
      className={className}
    />
  );
};