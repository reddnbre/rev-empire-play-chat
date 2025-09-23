import { Projectile, ProjectileType } from './gameTypes';
import { GAME_CONSTANTS } from './gamePhysics';

export const drawProjectileByType = (
  ctx: CanvasRenderingContext2D,
  projectile: Projectile
) => {
  const projectileType = projectile.projectileType || 'basic';
  
  // Draw trail first (behind projectile)
  drawProjectileTrail(ctx, projectile);
  
  // Draw projectile based on type
  switch (projectileType) {
    case 'basic':
      drawBasicCannonball(ctx, projectile);
      break;
    case 'missile':
      drawMissile(ctx, projectile);
      break;
    case 'plasma':
      drawPlasmaShot(ctx, projectile);
      break;
    case 'cluster':
      drawClusterBomb(ctx, projectile);
      break;
    case 'napalm':
      drawNapalmShell(ctx, projectile);
      break;
    default:
      drawBasicCannonball(ctx, projectile);
  }
};

const drawProjectileTrail = (ctx: CanvasRenderingContext2D, projectile: Projectile) => {
  // Draw enhanced trail with custom colors
  projectile.trail.forEach((point, index) => {
    if (point.alpha > 0.1) {
      const size = (point.alpha * GAME_CONSTANTS.PROJECTILE_SIZE * 0.8) + 2;
      
      // Use custom color if available, otherwise default
      let baseColor = point.color || 'rgba(255, 107, 53';
      if (baseColor.endsWith(', ')) {
        baseColor = baseColor.slice(0, -2);
      }
      
      const trailGradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, size * 2);
      trailGradient.addColorStop(0, `${baseColor}, ${point.alpha * 0.8})`);
      trailGradient.addColorStop(0.5, `${baseColor}, ${point.alpha * 0.4})`);
      trailGradient.addColorStop(1, `${baseColor}, 0)`);

      ctx.fillStyle = trailGradient;
      ctx.beginPath();
      ctx.arc(point.x, point.y, size * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  });
};

const drawBasicCannonball = (ctx: CanvasRenderingContext2D, projectile: Projectile) => {
  // Original orange fireball design
  const glowGradient = ctx.createRadialGradient(
    projectile.x, projectile.y, 0, 
    projectile.x, projectile.y, GAME_CONSTANTS.PROJECTILE_SIZE * 3
  );
  glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
  glowGradient.addColorStop(0.3, 'rgba(255, 107, 53, 0.8)');
  glowGradient.addColorStop(0.7, 'rgba(255, 107, 53, 0.4)');
  glowGradient.addColorStop(1, 'rgba(255, 107, 53, 0)');

  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  ctx.arc(projectile.x, projectile.y, GAME_CONSTANTS.PROJECTILE_SIZE * 3, 0, Math.PI * 2);
  ctx.fill();

  // Spinning core
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

const drawMissile = (ctx: CanvasRenderingContext2D, projectile: Projectile) => {
  // Calculate missile orientation based on velocity
  const angle = Math.atan2(projectile.vy, projectile.vx);
  
  ctx.save();
  ctx.translate(projectile.x, projectile.y);
  ctx.rotate(angle);
  
  // Missile body (gray rectangle)
  ctx.fillStyle = '#6B7280';
  ctx.fillRect(-12, -3, 20, 6);
  
  // Red tip
  ctx.fillStyle = '#DC2626';
  ctx.beginPath();
  ctx.moveTo(8, 0);
  ctx.lineTo(12, -2);
  ctx.lineTo(12, 2);
  ctx.closePath();
  ctx.fill();
  
  // Fins
  ctx.fillStyle = '#374151';
  ctx.fillRect(-8, -5, 4, 2);
  ctx.fillRect(-8, 3, 4, 2);
  
  ctx.restore();
  
  // Fire plume behind missile
  const plumeGradient = ctx.createRadialGradient(
    projectile.x - Math.cos(angle) * 15,
    projectile.y - Math.sin(angle) * 15,
    0,
    projectile.x - Math.cos(angle) * 25,
    projectile.y - Math.sin(angle) * 25,
    10
  );
  plumeGradient.addColorStop(0, 'rgba(255, 100, 0, 0.8)');
  plumeGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
  
  ctx.fillStyle = plumeGradient;
  ctx.beginPath();
  ctx.arc(
    projectile.x - Math.cos(angle) * 15,
    projectile.y - Math.sin(angle) * 15,
    8, 0, Math.PI * 2
  );
  ctx.fill();
};

const drawPlasmaShot = (ctx: CanvasRenderingContext2D, projectile: Projectile) => {
  // Pulsing cyan orb
  const pulseIntensity = 0.7 + 0.3 * Math.sin(Date.now() * 0.02);
  
  // Outer aura
  const auraGradient = ctx.createRadialGradient(
    projectile.x, projectile.y, 0,
    projectile.x, projectile.y, GAME_CONSTANTS.PROJECTILE_SIZE * 4
  );
  auraGradient.addColorStop(0, `rgba(0, 255, 255, ${pulseIntensity * 0.6})`);
  auraGradient.addColorStop(0.5, `rgba(0, 200, 255, ${pulseIntensity * 0.3})`);
  auraGradient.addColorStop(1, 'rgba(0, 200, 255, 0)');
  
  ctx.fillStyle = auraGradient;
  ctx.beginPath();
  ctx.arc(projectile.x, projectile.y, GAME_CONSTANTS.PROJECTILE_SIZE * 4, 0, Math.PI * 2);
  ctx.fill();
  
  // Core orb
  const coreGradient = ctx.createRadialGradient(
    projectile.x, projectile.y, 0,
    projectile.x, projectile.y, GAME_CONSTANTS.PROJECTILE_SIZE
  );
  coreGradient.addColorStop(0, '#FFFFFF');
  coreGradient.addColorStop(0.3, '#00FFFF');
  coreGradient.addColorStop(0.7, '#0088FF');
  coreGradient.addColorStop(1, '#0066CC');
  
  ctx.fillStyle = coreGradient;
  ctx.beginPath();
  ctx.arc(projectile.x, projectile.y, GAME_CONSTANTS.PROJECTILE_SIZE, 0, Math.PI * 2);
  ctx.fill();
  
  // Electric sparks
  ctx.strokeStyle = '#00FFFF';
  ctx.lineWidth = 2;
  ctx.globalAlpha = pulseIntensity;
  for (let i = 0; i < 4; i++) {
    const sparkAngle = (Date.now() * 0.01) + (i * Math.PI / 2);
    const sparkLength = GAME_CONSTANTS.PROJECTILE_SIZE * 2;
    ctx.beginPath();
    ctx.moveTo(projectile.x, projectile.y);
    ctx.lineTo(
      projectile.x + Math.cos(sparkAngle) * sparkLength,
      projectile.y + Math.sin(sparkAngle) * sparkLength
    );
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
};

const drawClusterBomb = (ctx: CanvasRenderingContext2D, projectile: Projectile) => {
  // Small yellow shell
  ctx.fillStyle = '#FCD34D';
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 2;
  
  ctx.beginPath();
  ctx.arc(projectile.x, projectile.y, GAME_CONSTANTS.PROJECTILE_SIZE * 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  // Shell segments
  ctx.strokeStyle = '#D97706';
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    ctx.beginPath();
    ctx.moveTo(projectile.x, projectile.y);
    ctx.lineTo(
      projectile.x + Math.cos(angle) * GAME_CONSTANTS.PROJECTILE_SIZE * 0.6,
      projectile.y + Math.sin(angle) * GAME_CONSTANTS.PROJECTILE_SIZE * 0.6
    );
    ctx.stroke();
  }
};

const drawNapalmShell = (ctx: CanvasRenderingContext2D, projectile: Projectile) => {
  // Fiery shell with intense flames
  const flameGradient = ctx.createRadialGradient(
    projectile.x, projectile.y, 0,
    projectile.x, projectile.y, GAME_CONSTANTS.PROJECTILE_SIZE * 3
  );
  flameGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
  flameGradient.addColorStop(0.2, 'rgba(255, 150, 0, 0.8)');
  flameGradient.addColorStop(0.5, 'rgba(255, 50, 0, 0.6)');
  flameGradient.addColorStop(0.8, 'rgba(200, 0, 0, 0.3)');
  flameGradient.addColorStop(1, 'rgba(200, 0, 0, 0)');
  
  ctx.fillStyle = flameGradient;
  ctx.beginPath();
  ctx.arc(projectile.x, projectile.y, GAME_CONSTANTS.PROJECTILE_SIZE * 3, 0, Math.PI * 2);
  ctx.fill();
  
  // Dark core shell
  ctx.fillStyle = '#7F1D1D';
  ctx.strokeStyle = '#991B1B';
  ctx.lineWidth = 1;
  
  ctx.beginPath();
  ctx.arc(projectile.x, projectile.y, GAME_CONSTANTS.PROJECTILE_SIZE, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  // Flickering flame effects around the shell
  const flameTime = Date.now() * 0.02;
  for (let i = 0; i < 8; i++) {
    const flameAngle = (i * Math.PI / 4) + Math.sin(flameTime + i) * 0.3;
    const flameDistance = GAME_CONSTANTS.PROJECTILE_SIZE * (1.5 + Math.sin(flameTime * 2 + i) * 0.5);
    
    ctx.fillStyle = `rgba(255, ${100 + Math.sin(flameTime + i) * 50}, 0, 0.6)`;
    ctx.beginPath();
    ctx.arc(
      projectile.x + Math.cos(flameAngle) * flameDistance,
      projectile.y + Math.sin(flameAngle) * flameDistance,
      2, 0, Math.PI * 2
    );
    ctx.fill();
  }
};