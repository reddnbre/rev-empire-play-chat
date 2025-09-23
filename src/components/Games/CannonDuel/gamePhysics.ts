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
  wind: WindEffect,
  targetTank?: Tank
): Projectile => {
  if (!projectile.active) return projectile;

  // Increment safety frame counter
  const framesSinceFired = (projectile.framesSinceFired || 0) + 1;

  let newVx = projectile.vx + (wind.strength * wind.direction * 0.01);
  let newVy = projectile.vy + GAME_CONSTANTS.GRAVITY;

  // Handle homing missiles
  if ((projectile as any).homing && targetTank) {
    const dx = targetTank.x - projectile.x;
    const dy = (targetTank.y + GAME_CONSTANTS.TANK_SIZE / 2) - projectile.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      const homingStrength = 0.3;
      newVx += (dx / distance) * homingStrength;
      newVy += (dy / distance) * homingStrength;
    }
  }

  let newX = projectile.x + newVx;
  let newY = projectile.y + newVy;

  // Handle bouncing projectiles
  if ((projectile as any).bounces > 0) {
    let bounced = false;
    
    // Ground bounce
    if (newY >= GAME_CONSTANTS.GROUND_Y) {
      newY = GAME_CONSTANTS.GROUND_Y;
      newVy = -newVy * 0.7; // Reduce velocity on bounce
      (projectile as any).bounces--;
      bounced = true;
    }
    
    // Wall bounces
    if (newX <= 0 || newX >= GAME_CONSTANTS.CANVAS_WIDTH) {
      newVx = -newVx * 0.7;
      newX = Math.max(0, Math.min(GAME_CONSTANTS.CANVAS_WIDTH, newX));
      (projectile as any).bounces--;
      bounced = true;
    }
    
    if (bounced && (projectile as any).bounces <= 0) {
      (projectile as any).bounces = undefined;
    }
  }

  // Determine trail color based on projectile type
  const getTrailColor = (): string => {
    if ((projectile as any).homing) return 'rgba(255, 107, 53';
    if ((projectile as any).napalm) return 'rgba(239, 68, 68';
    if ((projectile as any).cluster) return 'rgba(220, 38, 38';
    if ((projectile as any).armorPiercing) return 'rgba(107, 114, 128';
    if ((projectile as any).bounces > 0) return 'rgba(139, 92, 246';
    return 'rgba(255, 255, 255';
  };

  const newTrail = [
    { x: projectile.x, y: projectile.y, alpha: 1.0, color: getTrailColor() },
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
    trail: newTrail,
    framesSinceFired
  };
};

export const checkCollisions = (
  projectile: Projectile,
  player1Tank: Tank,
  player2Tank: Tank
): { hitGround: boolean; hitTank: Tank | null; impactPoint: { x: number; y: number }; shouldCreateCluster?: boolean } => {
  const { x, y } = projectile;

  // For bouncing projectiles, don't collide with ground on first bounce
  const isBouncing = (projectile as any).bounces > 0;

  // Ground collision
  if (y >= GAME_CONSTANTS.GROUND_Y && !isBouncing) {
    const result = {
      hitGround: true,
      hitTank: null,
      impactPoint: { x, y: GAME_CONSTANTS.GROUND_Y }
    };
    
    // Add cluster bomb effect
    if ((projectile as any).cluster) {
      (result as any).shouldCreateCluster = true;
    }
    
    return result;
  }

  // Tank collisions with improved hit detection and self-collision prevention
  const checkTankHit = (tank: Tank): boolean => {
    // Prevent self-collision for first 10 frames
    if (projectile.ownerId === tank.id && (projectile.framesSinceFired || 0) < 10) {
      return false;
    }
    
    const dx = Math.abs(x - tank.x);
    const dy = Math.abs(y - (tank.y + GAME_CONSTANTS.TANK_SIZE / 2));
    return dx < GAME_CONSTANTS.TANK_SIZE / 2 + GAME_CONSTANTS.PROJECTILE_SIZE &&
           dy < GAME_CONSTANTS.TANK_SIZE / 2 + GAME_CONSTANTS.PROJECTILE_SIZE;
  };

  if (checkTankHit(player1Tank)) {
    const result = {
      hitGround: false,
      hitTank: player1Tank,
      impactPoint: { x, y }
    };
    
    if ((projectile as any).cluster) {
      (result as any).shouldCreateCluster = true;
    }
    
    return result;
  }

  if (checkTankHit(player2Tank)) {
    const result = {
      hitGround: false,
      hitTank: player2Tank,
      impactPoint: { x, y }
    };
    
    if ((projectile as any).cluster) {
      (result as any).shouldCreateCluster = true;
    }
    
    return result;
  }

  return {
    hitGround: false,
    hitTank: null,
    impactPoint: { x, y }
  };
};

export const createExplosion = (
  x: number, 
  y: number, 
  type: 'normal' | 'napalm' | 'cluster' = 'normal', 
  damage: number = 25,
  sourcePlayerId?: 1 | 2
): Explosion => {
  const particles: Particle[] = [];
  let particleCount = GAME_CONSTANTS.PARTICLE_COUNT;
  let colors = [`hsl(${Math.random() * 60 + 10}, 100%, ${Math.random() * 30 + 50}%)`];
  let radius = 50; // Base explosion radius
  
  // Different explosion types with varying damage radius
  if (type === 'napalm') {
    particleCount = GAME_CONSTANTS.PARTICLE_COUNT * 1.5;
    colors = ['#ff4500', '#ff6600', '#ff8800', '#ffaa00'];
    radius = 80; // Larger damage radius for napalm
  } else if (type === 'cluster') {
    particleCount = GAME_CONSTANTS.PARTICLE_COUNT * 0.7;
    colors = ['#ffff00', '#ffaa00', '#ff6600'];
    radius = 60; // Medium damage radius for cluster
  }
  
  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI * 2 * i) / particleCount;
    const velocity = Math.random() * (type === 'napalm' ? 2 : 3) + 1;
    const life = Math.random() * (type === 'napalm' ? 40 : 20) + (type === 'napalm' ? 30 : 20);
    
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity - Math.random() * 2,
      life,
      maxLife: life,
      size: Math.random() * (type === 'cluster' ? 3 : 4) + 2,
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }

  return {
    x,
    y,
    frame: 0,
    active: true,
    particles,
    type: type as any,
    damage,
    radius,
    sourcePlayerId
  };
};

export const createClusterExplosions = (x: number, y: number, damage: number = 15, sourcePlayerId?: 1 | 2): Explosion[] => {
  const explosions: Explosion[] = [];
  const clusterCount = 5;
  
  for (let i = 0; i < clusterCount; i++) {
    const offsetX = (Math.random() - 0.5) * 100;
    const offsetY = (Math.random() - 0.5) * 60;
    
    explosions.push(createExplosion(x + offsetX, y + offsetY, 'cluster', damage, sourcePlayerId));
  }
  
  return explosions;
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