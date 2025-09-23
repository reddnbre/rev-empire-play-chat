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
    duration: 3
  },
  double_shot: {
    name: 'Double Shot',
    description: 'Fire two projectiles at once',
    icon: '⚡',
    rarity: 5
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
    rarity: 4
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
    rarity: 5
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
    rarity: 8
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
        duration: effectConfig.duration || 1,
        remaining: effectConfig.duration || 1
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
  
  for (const powerup of tank.powerups) {
    switch (powerup.type) {
      case 'double_shot':
        // Create second projectile with slight angle difference
        const secondProjectile = {
          ...mainProjectile,
          vx: mainProjectile.vx * 0.9,
          vy: mainProjectile.vy * 0.9 + 0.5,
          trail: []
        };
        projectiles.push(secondProjectile);
        break;
        
      case 'long_shot':
        mainProjectile.vx *= 1.5;
        mainProjectile.vy *= 1.5;
        break;
        
      case 'missile':
        // Add homing behavior (will be handled in physics)
        (mainProjectile as any).homing = true;
        (mainProjectile as any).target = targetTank;
        break;
        
      case 'bounce_shot':
        (mainProjectile as any).bounces = 3;
        break;
        
      case 'cluster_bomb':
        (mainProjectile as any).cluster = true;
        break;
        
      case 'armor_piercing':
        (mainProjectile as any).armorPiercing = true;
        break;
        
      case 'napalm':
        (mainProjectile as any).napalm = true;
        break;
    }
  }
  
  projectiles.unshift(mainProjectile);
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