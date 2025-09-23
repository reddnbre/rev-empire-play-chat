import { Powerup, PowerupType, PowerupEffect, Tank, Projectile } from './gameTypes';
import { GAME_CONSTANTS } from './gamePhysics';

export const POWERUP_CONFIGS: Record<PowerupType, {
  name: string;
  description: string;
  icon: string;
  rarity: number; // 1-10, higher = rarer
  duration?: number; // for timed effects
}> = {
  missile: {
    name: 'Guided Missile',
    description: 'Homing projectile that tracks target',
    icon: '🚀',
    rarity: 7
  },
  shield: {
    name: 'Energy Shield',
    description: 'Absorbs next 50 damage',
    icon: '🛡️',
    rarity: 6,
    duration: 5
  },
  double_shot: {
    name: 'Double Shot',
    description: 'Fire two projectiles at once',
    icon: '⚡',
    rarity: 5,
    duration: 3
  },
  napalm: {
    name: 'Napalm Strike',
    description: 'Creates lingering fire damage area',
    icon: '🔥',
    rarity: 8
  },
  long_shot: {
    name: 'Long Range',
    description: 'Double projectile range and speed',
    icon: '🎯',
    rarity: 4,
    duration: 4
  },
  repair_kit: {
    name: 'Repair Kit',
    description: 'Restore 40 HP instantly',
    icon: '🔧',
    rarity: 6
  },
  bounce_shot: {
    name: 'Bouncing Ball',
    description: 'Projectile bounces off surfaces',
    icon: '⚾',
    rarity: 5,
    duration: 3
  },
  cluster_bomb: {
    name: 'Cluster Bomb',
    description: 'Splits into multiple explosions',
    icon: '💣',
    rarity: 9
  },
  laser_sight: {
    name: 'Laser Sight',
    description: 'Perfect accuracy for 2 turns',
    icon: '🔴',
    rarity: 7,
    duration: 2
  },
  armor_piercing: {
    name: 'Armor Piercing',
    description: 'Ignores shields and deals extra damage',
    icon: '🗡️',
    rarity: 8,
    duration: 3
  }
};

export const generatePowerup = (x?: number, y?: number): Powerup => {
  // Weighted random selection based on rarity
  const powerupTypes = Object.keys(POWERUP_CONFIGS) as PowerupType[];
  const weights = powerupTypes.map(type => 11 - POWERUP_CONFIGS[type].rarity);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  
  let random = Math.random() * totalWeight;
  let selectedType: PowerupType = 'repair_kit';
  
  for (let i = 0; i < powerupTypes.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      selectedType = powerupTypes[i];
      break;
    }
  }

  const config = POWERUP_CONFIGS[selectedType];
  
  return {
    id: Math.random().toString(36).substr(2, 9),
    type: selectedType,
    x: x ?? (Math.random() * (GAME_CONSTANTS.CANVAS_WIDTH - 100) + 50),
    y: y ?? (GAME_CONSTANTS.GROUND_Y - 40),
    active: true,
    collected: false,
    timer: 0,
    maxTimer: 1000, // 10 seconds at 60fps
    name: config.name,
    description: config.description,
    icon: config.icon
  };
};

export const spawnRandomPowerups = (existing: Powerup[], maxPowerups: number = 3): Powerup[] => {
  const activePowerups = existing.filter(p => p.active && !p.collected);
  
  if (activePowerups.length >= maxPowerups) {
    return existing;
  }
  
  // 15% chance per frame to spawn a powerup (at 60fps = ~9 seconds average)
  if (Math.random() < 0.0025) {
    const newPowerup = generatePowerup();
    return [...existing, newPowerup];
  }
  
  return existing;
};

export const updatePowerups = (powerups: Powerup[]): Powerup[] => {
  return powerups.map(powerup => {
    if (!powerup.active || powerup.collected) return powerup;
    
    const newTimer = powerup.timer + 1;
    if (newTimer >= powerup.maxTimer) {
      return { ...powerup, active: false };
    }
    
    return { ...powerup, timer: newTimer };
  }).filter(p => p.active || p.collected);
};

export const checkPowerupCollision = (tank: Tank, powerups: Powerup[]): Powerup | null => {
  for (const powerup of powerups) {
    if (!powerup.active || powerup.collected) continue;
    
    const distance = Math.sqrt(
      Math.pow(tank.x - powerup.x, 2) + 
      Math.pow(tank.y + GAME_CONSTANTS.TANK_SIZE/2 - powerup.y, 2)
    );
    
    if (distance < 30) {
      return powerup;
    }
  }
  
  return null;
};

export const applyPowerupEffect = (tank: Tank, powerup: Powerup): Tank => {
  const newTank = { ...tank };
  
  switch (powerup.type) {
    case 'shield':
      newTank.shield = (newTank.shield || 0) + 50;
      const config = POWERUP_CONFIGS[powerup.type];
      if (config.duration) {
        newTank.powerups = [...newTank.powerups, {
          type: powerup.type,
          duration: config.duration,
          remaining: config.duration
        }];
      }
      break;
      
    case 'repair_kit':
      newTank.hp = Math.min(newTank.maxHp, newTank.hp + 40);
      break;
      
    case 'laser_sight':
    case 'double_shot':
    case 'long_shot':
    case 'bounce_shot':
    case 'armor_piercing':
    case 'missile':
    case 'napalm':
    case 'cluster_bomb':
      const effectConfig = POWERUP_CONFIGS[powerup.type];
      newTank.powerups = [...newTank.powerups, {
        type: powerup.type,
        duration: effectConfig.duration || 3, // Default 3 turns instead of 1
        remaining: effectConfig.duration || 3
      }];
      break;
  }
  
  return newTank;
};

export const updateTankPowerups = (tank: Tank): Tank => {
  const updatedPowerups = tank.powerups
    .map(effect => ({ ...effect, remaining: effect.remaining - 1 }))
    .filter(effect => effect.remaining > 0);
    
  return { ...tank, powerups: updatedPowerups };
};

export const modifyProjectileWithPowerups = (
  projectile: Projectile, 
  tank: Tank, 
  targetTank: Tank
): Projectile[] => {
  const projectiles: Projectile[] = [];
  let mainProjectile = { ...projectile };
  
  // Base damage from projectile or default
  let damage = projectile.damage || 25;
  let explosionType = projectile.explosionType || 'normal';
  let projectileType: import('./gameTypes').ProjectileType = 'basic';
  
  // Powerup stacking - combine all active powerups
  const combinedEffects = {
    damageMultiplier: 1,
    velocityMultiplier: 1,
    hasHoming: false,
    hasBouncing: false,
    hasArmorPiercing: false,
    hasNapalm: false,
    hasCluster: false,
    extraProjectiles: [] as Projectile[],
    visualEffects: [] as string[]
  };
  
  // Set trail colors and effects based on powerups
  const powerupColors: Record<PowerupType, string> = {
    missile: 'rgba(255, 107, 53',     // Orange
    shield: 'rgba(59, 130, 246',      // Blue
    double_shot: 'rgba(245, 158, 11', // Yellow
    napalm: 'rgba(239, 68, 68',       // Red
    long_shot: 'rgba(16, 185, 129',   // Green
    repair_kit: 'rgba(34, 197, 94',   // Light Green
    bounce_shot: 'rgba(139, 92, 246', // Purple
    cluster_bomb: 'rgba(220, 38, 38', // Dark Red
    laser_sight: 'rgba(236, 72, 153', // Pink
    armor_piercing: 'rgba(107, 114, 128' // Gray
  };
  
  // Process all powerups - STACK THEIR EFFECTS!
  for (const powerup of tank.powerups) {
    combinedEffects.visualEffects.push(powerup.type);
    
    switch (powerup.type) {
      case 'double_shot':
        // Create additional projectile
        const extraProjectile = {
          ...mainProjectile,
          vx: mainProjectile.vx * 0.95,
          vy: mainProjectile.vy * 0.95 + 0.3,
          trail: []
        };
        combinedEffects.extraProjectiles.push(extraProjectile);
        break;
        
      case 'long_shot':
        combinedEffects.velocityMultiplier *= 1.5;
        combinedEffects.damageMultiplier *= 1.1;
        break;
        
      case 'missile':
        combinedEffects.hasHoming = true;
        (mainProjectile as any).target = targetTank;
        projectileType = 'missile';
        break;
        
      case 'bounce_shot':
        combinedEffects.hasBouncing = true;
        (mainProjectile as any).bounces = 3;
        break;
        
      case 'cluster_bomb':
        combinedEffects.hasCluster = true;
        combinedEffects.damageMultiplier *= 0.85; // Slightly reduce main damage since clusters add more
        explosionType = 'cluster';
        projectileType = 'cluster';
        break;
        
      case 'napalm':
        combinedEffects.hasNapalm = true;
        combinedEffects.damageMultiplier *= 1.3;
        explosionType = 'napalm';
        projectileType = 'napalm';
        break;
        
      case 'armor_piercing':
        combinedEffects.hasArmorPiercing = true;
        combinedEffects.damageMultiplier *= 1.5;
        projectileType = 'plasma';
        break;
        
      case 'laser_sight':
        // Perfect accuracy - no effect on projectile mechanics
        break;
    }
  }
  
  // Apply combined velocity effects
  mainProjectile.vx *= combinedEffects.velocityMultiplier;
  mainProjectile.vy *= combinedEffects.velocityMultiplier;
  
  // Apply combined damage
  damage *= combinedEffects.damageMultiplier;
  
  // Set combined special properties
  if (combinedEffects.hasHoming) (mainProjectile as any).homing = true;
  if (combinedEffects.hasBouncing) (mainProjectile as any).bounces = 3;
  if (combinedEffects.hasArmorPiercing) (mainProjectile as any).armorPiercing = true;
  if (combinedEffects.hasNapalm) (mainProjectile as any).napalm = true;
  if (combinedEffects.hasCluster) (mainProjectile as any).cluster = true;
  
  // Create mixed trail color if multiple powerups
  let trailColor = 'rgba(255, 107, 53'; // Default orange
  if (combinedEffects.visualEffects.length > 0) {
    if (combinedEffects.visualEffects.length === 1) {
      trailColor = powerupColors[combinedEffects.visualEffects[0] as PowerupType];
    } else {
      // Mix colors for multiple powerups - create rainbow effect
      trailColor = 'rgba(255, 255, 255'; // White for multiple effects
    }
  }
  
  // Apply trail colors
  mainProjectile.trail = mainProjectile.trail.map(p => ({ ...p, color: trailColor }));
  
  // Apply to extra projectiles too
  combinedEffects.extraProjectiles.forEach(proj => {
    proj.damage = damage * 0.8; // Extra projectiles do slightly less damage
    proj.explosionType = explosionType;
    proj.projectileType = projectileType;
    proj.trail = proj.trail.map(p => ({ ...p, color: trailColor }));
    
    // Copy all special properties to extra projectiles
    if (combinedEffects.hasHoming) (proj as any).homing = true;
    if (combinedEffects.hasBouncing) (proj as any).bounces = 3;
    if (combinedEffects.hasArmorPiercing) (proj as any).armorPiercing = true;
    if (combinedEffects.hasNapalm) (proj as any).napalm = true;
    if (combinedEffects.hasCluster) (proj as any).cluster = true;
  });
  
  // Apply final properties to main projectile
  mainProjectile.damage = damage;
  mainProjectile.explosionType = explosionType;
  mainProjectile.projectileType = projectileType;
  
  // Add all projectiles to the array
  projectiles.push(mainProjectile, ...combinedEffects.extraProjectiles);
  
  return projectiles;
};

export const calculateDamageWithPowerups = (
  baseDamage: number, 
  attackerPowerups: PowerupEffect[], 
  defenderTank: Tank
): { damage: number; newShield: number } => {
  let damage = baseDamage;
  let shield = defenderTank.shield || 0;
  
  // Check attacker powerups
  const hasArmorPiercing = attackerPowerups.some(p => p.type === 'armor_piercing');
  const hasNapalm = attackerPowerups.some(p => p.type === 'napalm');
  
  if (hasArmorPiercing) {
    damage *= 1.5;
    shield = 0; // Ignore shields
  }
  
  if (hasNapalm) {
    damage *= 1.2;
  }
  
  // Apply shield
  if (shield > 0 && !hasArmorPiercing) {
    if (shield >= damage) {
      shield -= damage;
      damage = 0;
    } else {
      damage -= shield;
      shield = 0;
    }
  }
  
  return { damage, newShield: shield };
};