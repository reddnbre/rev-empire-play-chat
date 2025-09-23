import React, { useRef, useEffect } from 'react';
import { Tank, Projectile, Explosion, WindEffect, GameState } from './gameTypes';
import { GAME_CONSTANTS, calculateTrajectory } from './gamePhysics';

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

    // HP text with outline
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000000';
    ctx.strokeText(`${tank.hp}`, centerX, barY - 8);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`${tank.hp}`, centerX, barY - 8);
  };

  const drawProjectile = (ctx: CanvasRenderingContext2D, projectile: Projectile) => {
    if (!projectile.active) return;

    // Draw trail
    projectile.trail.forEach((point, index) => {
      if (point.alpha > 0) {
        const size = (GAME_CONSTANTS.PROJECTILE_SIZE * point.alpha) / 2;
        const trailGradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, size * 2);
        trailGradient.addColorStop(0, `rgba(255, 107, 53, ${point.alpha * 0.8})`);
        trailGradient.addColorStop(0.5, `rgba(255, 107, 53, ${point.alpha * 0.4})`);
        trailGradient.addColorStop(1, `rgba(255, 107, 53, 0)`);

        ctx.fillStyle = trailGradient;
        ctx.beginPath();
        ctx.arc(point.x, point.y, size * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Enhanced projectile with glow and rotation
    const glowGradient = ctx.createRadialGradient(projectile.x, projectile.y, 0, projectile.x, projectile.y, GAME_CONSTANTS.PROJECTILE_SIZE * 3);
    glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    glowGradient.addColorStop(0.3, 'rgba(255, 107, 53, 0.8)');
    glowGradient.addColorStop(0.7, 'rgba(255, 107, 53, 0.4)');
    glowGradient.addColorStop(1, 'rgba(255, 107, 53, 0)');

    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, GAME_CONSTANTS.PROJECTILE_SIZE * 3, 0, Math.PI * 2);
    ctx.fill();

    // Projectile core with spinning effect
    const rotation = Date.now() * 0.01;
    ctx.save();
    ctx.translate(projectile.x, projectile.y);
    ctx.rotate(rotation);

    const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, GAME_CONSTANTS.PROJECTILE_SIZE);
    coreGradient.addColorStop(0, '#FFFFFF');
    coreGradient.addColorStop(0.4, '#FFD700');
    coreGradient.addColorStop(0.8, '#FF6B35');
    coreGradient.addColorStop(1, '#DC2626');

    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(0, 0, GAME_CONSTANTS.PROJECTILE_SIZE, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  const drawExplosion = (ctx: CanvasRenderingContext2D, explosion: Explosion) => {
    if (!explosion.active) return;

    const progress = explosion.frame / GAME_CONSTANTS.EXPLOSION_FRAMES;

    // Draw particles
    explosion.particles.forEach(particle => {
      const alpha = particle.life / particle.maxLife;
      if (alpha > 0) {
        const particleGradient = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.size);
        particleGradient.addColorStop(0, particle.color.replace(')', `, ${alpha})`).replace('hsl', 'hsla'));
        particleGradient.addColorStop(1, particle.color.replace(')', `, 0)`).replace('hsl', 'hsla'));

        ctx.fillStyle = particleGradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Central explosion flash
    if (progress < 0.3) {
      const flashSize = 50 * (1 - progress * 2);
      const flashGradient = ctx.createRadialGradient(explosion.x, explosion.y, 0, explosion.x, explosion.y, flashSize);
      flashGradient.addColorStop(0, `rgba(255, 255, 255, ${1 - progress * 3})`);
      flashGradient.addColorStop(0.5, `rgba(255, 200, 100, ${(1 - progress * 3) * 0.7})`);
      flashGradient.addColorStop(1, 'rgba(255, 100, 50, 0)');

      ctx.fillStyle = flashGradient;
      ctx.beginPath();
      ctx.arc(explosion.x, explosion.y, flashSize, 0, Math.PI * 2);
      ctx.fill();
    }
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

  const drawTrajectoryPreview = (ctx: CanvasRenderingContext2D, gameState: GameState) => {
    if (gameState.gamePhase !== 'aim' || (gameState.gameMode === 'bot' && gameState.currentPlayer === 2)) return;

    const currentTank = gameState.currentPlayer === 1 ? gameState.player1Tank : gameState.player2Tank;
    const direction = gameState.currentPlayer === 1 ? 1 : -1;
    
    const barrelOffset = 25;
    const radians = (gameState.angle * Math.PI) / 180;
    const startX = currentTank.x + Math.cos(radians) * barrelOffset * direction;
    const startY = currentTank.y + GAME_CONSTANTS.TANK_SIZE / 2 - Math.sin(radians) * barrelOffset;
    
    const trajectoryPoints = calculateTrajectory(startX, startY, gameState.angle, gameState.power, direction, gameState.wind);

    if (trajectoryPoints.length > 0) {
      // Trajectory line with gradient
      const gradient = ctx.createLinearGradient(startX, startY, trajectoryPoints[trajectoryPoints.length - 1].x, trajectoryPoints[trajectoryPoints.length - 1].y);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
      gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0.2)');

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 5]);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      
      trajectoryPoints.forEach(point => {
        ctx.lineTo(point.x, point.y);
      });
      
      ctx.stroke();
      ctx.setLineDash([]);

      // Trajectory dots with glow
      trajectoryPoints.forEach((point, index) => {
        if (index % 6 === 0) {
          const alpha = 1 - (index / trajectoryPoints.length);
          const glowGradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, 8);
          glowGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
          glowGradient.addColorStop(0.5, `rgba(255, 255, 255, ${alpha * 0.5})`);
          glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

          ctx.fillStyle = glowGradient;
          ctx.beginPath();
          ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.beginPath();
          ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, GAME_CONSTANTS.CANVAS_WIDTH, GAME_CONSTANTS.CANVAS_HEIGHT);

    drawBackground(ctx);
    drawWindIndicator(ctx, gameState.wind);
    drawTank(ctx, gameState.player1Tank, gameState.currentPlayer === 1 ? gameState.angle : 45);
    drawTank(ctx, gameState.player2Tank, gameState.currentPlayer === 2 ? gameState.angle : 45);
    drawTrajectoryPreview(ctx, gameState);
    drawProjectile(ctx, gameState.projectile);
    
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