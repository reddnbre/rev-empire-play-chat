import { Explosion, ProjectileType } from './gameTypes';
import { GAME_CONSTANTS } from './gamePhysics';

export const drawExplosionByType = (
  ctx: CanvasRenderingContext2D,
  explosion: Explosion
) => {
  const explosionType = explosion.type || 'normal';
  
  switch (explosionType) {
    case 'normal':
      drawBasicExplosion(ctx, explosion);
      break;
    case 'napalm':
      drawNapalmExplosion(ctx, explosion);
      break;
    case 'cluster':
      drawClusterExplosion(ctx, explosion);
      break;
    default:
      drawBasicExplosion(ctx, explosion);
  }
};

const drawBasicExplosion = (ctx: CanvasRenderingContext2D, explosion: Explosion) => {
  const progress = explosion.frame / GAME_CONSTANTS.EXPLOSION_FRAMES;
  const maxRadius = 60;
  const currentRadius = maxRadius * (1 - Math.pow(progress - 1, 2)); // Parabolic expansion
  
  // Central flash
  if (explosion.frame < GAME_CONSTANTS.EXPLOSION_FRAMES * 0.3) {
    const flashIntensity = 1 - (explosion.frame / (GAME_CONSTANTS.EXPLOSION_FRAMES * 0.3));
    const flashGradient = ctx.createRadialGradient(
      explosion.x, explosion.y, 0,
      explosion.x, explosion.y, currentRadius * 2
    );
    flashGradient.addColorStop(0, `rgba(255, 255, 255, ${flashIntensity})`);
    flashGradient.addColorStop(0.5, `rgba(255, 200, 100, ${flashIntensity * 0.7})`);
    flashGradient.addColorStop(1, `rgba(255, 100, 50, 0)`);
    
    ctx.fillStyle = flashGradient;
    ctx.beginPath();
    ctx.arc(explosion.x, explosion.y, currentRadius * 2, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Draw particles
  explosion.particles.forEach(particle => {
    if (particle.life > 0) {
      const alpha = particle.life / particle.maxLife;
      ctx.fillStyle = particle.color.replace('1)', `${alpha})`);
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
  });
};

const drawNapalmExplosion = (ctx: CanvasRenderingContext2D, explosion: Explosion) => {
  const progress = explosion.frame / GAME_CONSTANTS.EXPLOSION_FRAMES;
  const maxRadius = 80;
  const currentRadius = maxRadius * (1 - Math.pow(progress - 1, 2));
  
  // Intense orange/red flash
  if (explosion.frame < GAME_CONSTANTS.EXPLOSION_FRAMES * 0.4) {
    const flashIntensity = 1 - (explosion.frame / (GAME_CONSTANTS.EXPLOSION_FRAMES * 0.4));
    const napalmGradient = ctx.createRadialGradient(
      explosion.x, explosion.y, 0,
      explosion.x, explosion.y, currentRadius * 2.5
    );
    napalmGradient.addColorStop(0, `rgba(255, 255, 255, ${flashIntensity})`);
    napalmGradient.addColorStop(0.3, `rgba(255, 150, 0, ${flashIntensity * 0.8})`);
    napalmGradient.addColorStop(0.6, `rgba(255, 50, 0, ${flashIntensity * 0.6})`);
    napalmGradient.addColorStop(1, `rgba(200, 0, 0, 0)`);
    
    ctx.fillStyle = napalmGradient;
    ctx.beginPath();
    ctx.arc(explosion.x, explosion.y, currentRadius * 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Lingering fire particles
  explosion.particles.forEach(particle => {
    if (particle.life > 0) {
      const alpha = particle.life / particle.maxLife;
      const fireIntensity = 0.7 + 0.3 * Math.sin(Date.now() * 0.01 + particle.x * 0.1);
      
      // Fire glow
      const fireGradient = ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, particle.size * 3
      );
      fireGradient.addColorStop(0, `rgba(255, 200, 0, ${alpha * fireIntensity})`);
      fireGradient.addColorStop(0.5, `rgba(255, 100, 0, ${alpha * fireIntensity * 0.5})`);
      fireGradient.addColorStop(1, `rgba(200, 0, 0, 0)`);
      
      ctx.fillStyle = fireGradient;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Core particle
      ctx.fillStyle = particle.color.replace('1)', `${alpha})`);
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
  });
};

const drawClusterExplosion = (ctx: CanvasRenderingContext2D, explosion: Explosion) => {
  const progress = explosion.frame / GAME_CONSTANTS.EXPLOSION_FRAMES;
  const maxRadius = 40; // Smaller individual explosions
  const currentRadius = maxRadius * (1 - Math.pow(progress - 1, 2));
  
  // Multiple small flash points
  if (explosion.frame < GAME_CONSTANTS.EXPLOSION_FRAMES * 0.25) {
    const flashIntensity = 1 - (explosion.frame / (GAME_CONSTANTS.EXPLOSION_FRAMES * 0.25));
    
    // Create multiple small explosion centers
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5;
      const distance = currentRadius * 0.3;
      const subX = explosion.x + Math.cos(angle) * distance;
      const subY = explosion.y + Math.sin(angle) * distance;
      
      const subGradient = ctx.createRadialGradient(
        subX, subY, 0,
        subX, subY, currentRadius * 0.8
      );
      subGradient.addColorStop(0, `rgba(255, 255, 100, ${flashIntensity})`);
      subGradient.addColorStop(0.5, `rgba(255, 200, 50, ${flashIntensity * 0.6})`);
      subGradient.addColorStop(1, `rgba(255, 150, 0, 0)`);
      
      ctx.fillStyle = subGradient;
      ctx.beginPath();
      ctx.arc(subX, subY, currentRadius * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // Scattered particles in multiple groups
  explosion.particles.forEach((particle, index) => {
    if (particle.life > 0) {
      const alpha = particle.life / particle.maxLife;
      const groupIndex = Math.floor(index / (explosion.particles.length / 5));
      const groupColors = [
        'rgba(255, 255, 100,',
        'rgba(255, 200, 50,',
        'rgba(255, 150, 0,',
        'rgba(255, 100, 0,',
        'rgba(200, 50, 0,'
      ];
      
      ctx.fillStyle = (groupColors[groupIndex] || groupColors[0]) + `${alpha})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
  });
};