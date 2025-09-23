import { Tank, Explosion } from './gameTypes';
import { GAME_CONSTANTS } from './gamePhysics';

export interface ExplosionDamageResult {
  player1Damage: number;
  player2Damage: number;
  player1NewShield: number;
  player2NewShield: number;
}

export const calculateExplosionDamage = (
  explosion: Explosion,
  player1Tank: Tank,
  player2Tank: Tank
): ExplosionDamageResult => {
  let player1Damage = 0;
  let player2Damage = 0;
  let player1NewShield = player1Tank.shield || 0;
  let player2NewShield = player2Tank.shield || 0;

  const explosionRadius = explosion.radius || 50;
  const explosionDamage = explosion.damage || 25;
  const sourcePlayerId = explosion.sourcePlayerId;

  // Calculate distance from each tank to explosion center
  const player1Distance = Math.sqrt(
    Math.pow(player1Tank.x - explosion.x, 2) + 
    Math.pow(player1Tank.y + GAME_CONSTANTS.TANK_SIZE / 2 - explosion.y, 2)
  );
  
  const player2Distance = Math.sqrt(
    Math.pow(player2Tank.x - explosion.x, 2) + 
    Math.pow(player2Tank.y + GAME_CONSTANTS.TANK_SIZE / 2 - explosion.y, 2)
  );

  // Minimum safe distance - if the source player is too close, they take no/reduced damage
  const minSafeDistance = 40;

  // Calculate damage for player 1
  if (player1Distance <= explosionRadius) {
    let damageMultiplier = Math.max(0.2, 1 - (player1Distance / explosionRadius));
    let calculatedDamage = Math.floor(explosionDamage * damageMultiplier);
    
    // Reduce self-damage if too close to own explosion
    if (sourcePlayerId === 1 && player1Distance < minSafeDistance) {
      calculatedDamage = Math.floor(calculatedDamage * 0.3); // 30% self-damage
    }
    
    // Apply shield
    if (player1NewShield > 0) {
      if (player1NewShield >= calculatedDamage) {
        player1NewShield -= calculatedDamage;
        calculatedDamage = 0;
      } else {
        calculatedDamage -= player1NewShield;
        player1NewShield = 0;
      }
    }
    
    player1Damage = calculatedDamage;
  }

  // Calculate damage for player 2
  if (player2Distance <= explosionRadius) {
    let damageMultiplier = Math.max(0.2, 1 - (player2Distance / explosionRadius));
    let calculatedDamage = Math.floor(explosionDamage * damageMultiplier);
    
    // Reduce self-damage if too close to own explosion
    if (sourcePlayerId === 2 && player2Distance < minSafeDistance) {
      calculatedDamage = Math.floor(calculatedDamage * 0.3); // 30% self-damage
    }
    
    // Apply shield
    if (player2NewShield > 0) {
      if (player2NewShield >= calculatedDamage) {
        player2NewShield -= calculatedDamage;
        calculatedDamage = 0;
      } else {
        calculatedDamage -= player2NewShield;
        player2NewShield = 0;
      }
    }
    
    player2Damage = calculatedDamage;
  }

  return {
    player1Damage,
    player2Damage,
    player1NewShield,
    player2NewShield
  };
};