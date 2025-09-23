import { Tank, Projectile, Explosion, Particle, WindEffect } from './gameTypes';

export const GAME_CONSTANTS = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 400,
  GROUND_Y: 320,
  TANK_SIZE: 40,
  GRAVITY: 0.4,
  EXPLOSION_FRAMES: 40,
  PROJECTILE_SIZE: 6,
  TRAIL_LENGTH: 8,
  PARTICLE_COUNT: 20,
};

export const updateProjectilePhysics = (
  projectile: Projectile,
  wind: WindEffect
): Projectile => {
  if (!projectile.active) return projectile;

  const newX = projectile.x + projectile.vx;
  const newY = projectile.y + projectile.vy;
  const newVy = projectile.vy + GAME_CONSTANTS.GRAVITY;
  const newVx = projectile.vx + (wind.strength * wind.direction * 0.01);

  // Update trail
  const newTrail = [
    { x: projectile.x, y: projectile.y, alpha: 1.0 },
    ...projectile.trail.slice(0, GAME_CONSTANTS.TRAIL_LENGTH - 1)
  ].map((point, index) => ({
    ...point,
    alpha: 1.0 - (index / GAME_CONSTANTS.TRAIL_LENGTH)
  }));

  return {
    ...projectile,
    x: newX,
    y: newY,
    vx: newVx,
    vy: newVy,
    trail: newTrail
  };
};

export const checkCollisions = (
  projectile: Projectile,
  player1Tank: Tank,
  player2Tank: Tank
): { hitGround: boolean; hitTank: Tank | null; impactPoint: { x: number; y: number } } => {
  const { x, y } = projectile;

  // Ground collision
  if (y >= GAME_CONSTANTS.GROUND_Y) {
    return {
      hitGround: true,
      hitTank: null,
      impactPoint: { x, y: GAME_CONSTANTS.GROUND_Y }
    };
  }

  // Tank collisions with improved hit detection
  const checkTankHit = (tank: Tank): boolean => {
    const dx = Math.abs(x - tank.x);
    const dy = Math.abs(y - (tank.y + GAME_CONSTANTS.TANK_SIZE / 2));
    return dx < GAME_CONSTANTS.TANK_SIZE / 2 + GAME_CONSTANTS.PROJECTILE_SIZE &&
           dy < GAME_CONSTANTS.TANK_SIZE / 2 + GAME_CONSTANTS.PROJECTILE_SIZE;
  };

  if (checkTankHit(player1Tank)) {
    return {
      hitGround: false,
      hitTank: player1Tank,
      impactPoint: { x, y }
    };
  }

  if (checkTankHit(player2Tank)) {
    return {
      hitGround: false,
      hitTank: player2Tank,
      impactPoint: { x, y }
    };
  }

  return {
    hitGround: false,
    hitTank: null,
    impactPoint: { x, y }
  };
};

export const createExplosion = (x: number, y: number): Explosion => {
  const particles: Particle[] = [];
  
  for (let i = 0; i < GAME_CONSTANTS.PARTICLE_COUNT; i++) {
    const angle = (Math.PI * 2 * i) / GAME_CONSTANTS.PARTICLE_COUNT;
    const velocity = Math.random() * 3 + 1;
    const life = Math.random() * 20 + 20;
    
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity - Math.random() * 2,
      life,
      maxLife: life,
      size: Math.random() * 4 + 2,
      color: `hsl(${Math.random() * 60 + 10}, 100%, ${Math.random() * 30 + 50}%)`
    });
  }

  return {
    x,
    y,
    frame: 0,
    active: true,
    particles
  };
};

export const updateExplosion = (explosion: Explosion): Explosion => {
  return {
    ...explosion,
    frame: explosion.frame + 1,
    active: explosion.frame < GAME_CONSTANTS.EXPLOSION_FRAMES,
    particles: explosion.particles.map(particle => ({
      ...particle,
      x: particle.x + particle.vx,
      y: particle.y + particle.vy,
      vy: particle.vy + 0.1, // gravity on particles
      life: particle.life - 1,
      vx: particle.vx * 0.98 // air resistance
    })).filter(particle => particle.life > 0)
  };
};

export const generateWind = (): WindEffect => {
  const strength = Math.random() * 0.5 + 0.1; // 0.1 to 0.6
  const direction = Math.random() > 0.5 ? 1 : -1;
  
  return {
    strength,
    direction,
    particles: []
  };
};

export const calculateTrajectory = (
  startX: number,
  startY: number,
  angle: number,
  power: number,
  direction: number,
  wind: WindEffect
): { x: number; y: number }[] => {
  const radians = (angle * Math.PI) / 180;
  const velocity = power / 8;
  const points: { x: number; y: number }[] = [];
  
  let vx = velocity * Math.cos(radians) * direction;
  let vy = -velocity * Math.sin(radians);
  let x = startX;
  let y = startY;
  
  for (let t = 0; t < 120; t += 2) {
    if (y >= GAME_CONSTANTS.GROUND_Y || x < 0 || x > GAME_CONSTANTS.CANVAS_WIDTH) break;
    
    points.push({ x, y });
    
    x += vx;
    y += vy;
    vy += GAME_CONSTANTS.GRAVITY;
    vx += wind.strength * wind.direction * 0.01;
  }
  
  return points;
};