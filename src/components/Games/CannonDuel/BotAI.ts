import { Tank, BotDifficulty, WindEffect } from './gameTypes';
import { GAME_CONSTANTS } from './gamePhysics';

export class BotAI {
  private difficulty: BotDifficulty;
  private lastShotData: { angle: number; power: number; result: 'hit' | 'miss' | 'close' } | null = null;
  private shotHistory: { angle: number; power: number; distance: number }[] = [];

  constructor(difficulty: BotDifficulty = 'medium') {
    this.difficulty = difficulty;
  }

  setDifficulty(difficulty: BotDifficulty) {
    this.difficulty = difficulty;
  }

  calculateShot(botTank: Tank, targetTank: Tank, wind: WindEffect, powerups?: any[]): { angle: number; power: number; thinkingTime: number; shouldMove?: 'left' | 'right' | null; targetPowerup?: any } {
    const distance = Math.abs(targetTank.x - botTank.x);
    const heightDiff = targetTank.y - botTank.y;

    // Strategic decision making
    let shouldMove: 'left' | 'right' | null = null;
    let targetPowerup: any = null;

    // Check for nearby powerups (bot should collect them strategically)
    if (powerups && powerups.length > 0) {
      const activePowerups = powerups.filter(p => p.active && !p.collected);
      const nearbyPowerups = activePowerups.filter(p => 
        Math.abs(p.x - botTank.x) < 250
      );
      
      if (nearbyPowerups.length > 0) {
        // Prioritize rare/powerful powerups
        const priorityPowerups = nearbyPowerups.filter(p => 
          ['napalm', 'cluster_bomb', 'armor_piercing', 'missile'].includes(p.type)
        );
        
        const targetPowerups = priorityPowerups.length > 0 ? priorityPowerups : nearbyPowerups;
        
        // Find closest high-value powerup
        const closestPowerup = targetPowerups.reduce((closest, current) => {
          const closestDist = Math.abs(closest.x - botTank.x);
          const currentDist = Math.abs(current.x - botTank.x);
          return currentDist < closestDist ? current : closest;
        });
        
        const powerupDistance = Math.abs(closestPowerup.x - botTank.x);
        if (powerupDistance > 30 && powerupDistance < 200) {
          shouldMove = closestPowerup.x > botTank.x ? 'right' : 'left';
          targetPowerup = closestPowerup;
          console.log(`Bot targeting powerup: ${closestPowerup.name} at distance ${powerupDistance.toFixed(0)}px`);
        }
      }
    }

    // Strategic positioning - avoid being too close or in predictable spots
    if (!shouldMove && distance < 150 && this.difficulty !== 'easy') {
      // Move away if too close for comfort
      shouldMove = botTank.x < targetTank.x ? 'left' : 'right';
    } else if (!shouldMove && distance > 600 && this.difficulty === 'hard') {
      // Move closer for better accuracy on hard difficulty
      shouldMove = botTank.x < targetTank.x ? 'right' : 'left';
    }

    let angle: number;
    let power: number;
    let thinkingTime: number;

    switch (this.difficulty) {
      case 'easy':
        angle = this.calculateEasyShot(distance, heightDiff);
        power = this.calculateEasyPower(distance);
        thinkingTime = 1000 + Math.random() * 1000; // 1-2 seconds
        break;

      case 'medium':
        ({ angle, power } = this.calculateMediumShot(distance, heightDiff, wind));
        thinkingTime = 1500 + Math.random() * 1000; // 1.5-2.5 seconds
        break;

      case 'hard':
        ({ angle, power } = this.calculateHardShot(distance, heightDiff, wind));
        thinkingTime = 2000 + Math.random() * 1000; // 2-3 seconds
        break;

      default:
        angle = 45;
        power = 50;
        thinkingTime = 1500;
    }

    // Add some randomness to make it less predictable
    const randomFactor = this.getRandomFactor();
    angle += (Math.random() - 0.5) * randomFactor.angle;
    power += (Math.random() - 0.5) * randomFactor.power;

    // Clamp values
    angle = Math.max(0, Math.min(90, angle));
    power = Math.max(10, Math.min(100, power));

    // Store shot for learning
    this.shotHistory.push({ angle, power, distance });
    if (this.shotHistory.length > 10) {
      this.shotHistory.shift();
    }

    return { angle, power, thinkingTime, shouldMove, targetPowerup };
  }

  private calculateEasyShot(distance: number, heightDiff: number): number {
    // Simple angle calculation with high variance
    const baseAngle = 30 + (distance / GAME_CONSTANTS.CANVAS_WIDTH) * 30;
    return baseAngle + (Math.random() - 0.5) * 20; // ±10 degrees variance
  }

  private calculateEasyPower(distance: number): number {
    // Simple power calculation with high variance
    const basePower = 40 + (distance / GAME_CONSTANTS.CANVAS_WIDTH) * 40;
    return basePower + (Math.random() - 0.5) * 30; // ±15 power variance
  }

  private calculateMediumShot(distance: number, heightDiff: number, wind: WindEffect): { angle: number; power: number } {
    // More sophisticated calculation
    const gravity = GAME_CONSTANTS.GRAVITY;
    const targetDistance = distance;
    
    // Calculate optimal angle for distance (45 degrees is optimal for max range without air resistance)
    let angle = Math.atan(targetDistance / (targetDistance - heightDiff)) * (180 / Math.PI);
    if (isNaN(angle) || angle < 15) angle = 30;
    if (angle > 75) angle = 60;

    // Calculate power based on distance and angle
    const radians = angle * (Math.PI / 180);
    const power = Math.sqrt((targetDistance * gravity) / Math.sin(2 * radians)) * 8;

    // Adjust for wind (medium bot partially accounts for wind)
    const windAdjustment = wind.strength * wind.direction * 0.3;
    
    return {
      angle: Math.max(15, Math.min(75, angle)),
      power: Math.max(30, Math.min(90, power + windAdjustment * 10))
    };
  }

  private calculateHardShot(distance: number, heightDiff: number, wind: WindEffect): { angle: number; power: number } {
    // Advanced calculation with wind compensation and learning
    const gravity = GAME_CONSTANTS.GRAVITY;
    
    // Use physics to calculate optimal shot
    const dx = distance;
    const dy = -heightDiff; // negative because we're shooting upward
    
    // Solve trajectory equation for optimal angle
    const discriminant = (dx * dx * gravity * gravity) + (2 * dy * gravity * dx * dx);
    if (discriminant < 0) {
      // Fallback to medium calculation
      return this.calculateMediumShot(distance, heightDiff, wind);
    }

    const sqrtDiscriminant = Math.sqrt(discriminant);
    const angle1 = Math.atan((-dx * gravity + sqrtDiscriminant) / (dx * gravity)) * (180 / Math.PI);
    const angle2 = Math.atan((-dx * gravity - sqrtDiscriminant) / (dx * gravity)) * (180 / Math.PI);
    
    // Choose the lower angle for faster shot
    let angle = Math.min(Math.abs(angle1), Math.abs(angle2));
    if (isNaN(angle) || angle < 10) angle = 35;
    if (angle > 80) angle = 65;

    // Calculate required initial velocity
    const radians = angle * (Math.PI / 180);
    const velocity = Math.sqrt((dx * gravity) / Math.sin(2 * radians));
    let power = velocity * 8; // Convert to power scale

    // Advanced wind compensation
    const windEffect = wind.strength * wind.direction;
    const windCompensation = this.calculateWindCompensation(windEffect, distance, angle);
    power += windCompensation;

    // Learn from previous shots
    if (this.shotHistory.length > 3) {
      const adjustment = this.learnFromHistory(distance);
      angle += adjustment.angle;
      power += adjustment.power;
    }

    return {
      angle: Math.max(10, Math.min(80, angle)),
      power: Math.max(25, Math.min(95, power))
    };
  }

  private calculateWindCompensation(windEffect: number, distance: number, angle: number): number {
    // Complex wind compensation based on shot arc and time of flight
    const timeOfFlight = (2 * (100 / 8) * Math.sin(angle * Math.PI / 180)) / GAME_CONSTANTS.GRAVITY;
    const windImpact = windEffect * timeOfFlight * 0.5;
    return -windImpact * 5; // Convert to power adjustment
  }

  private learnFromHistory(currentDistance: number): { angle: number; power: number } {
    // Simple learning algorithm
    const recentShots = this.shotHistory.slice(-3);
    const avgAngle = recentShots.reduce((sum, shot) => sum + shot.angle, 0) / recentShots.length;
    const avgPower = recentShots.reduce((sum, shot) => sum + shot.power, 0) / recentShots.length;
    
    // If previous shots at similar distance, adjust slightly
    const similarShots = recentShots.filter(shot => Math.abs(shot.distance - currentDistance) < 100);
    if (similarShots.length > 0) {
      return {
        angle: (Math.random() - 0.5) * 2, // Small random adjustment
        power: (Math.random() - 0.5) * 4
      };
    }

    return { angle: 0, power: 0 };
  }

  private getRandomFactor(): { angle: number; power: number } {
    switch (this.difficulty) {
      case 'easy':
        return { angle: 15, power: 20 }; // High variance
      case 'medium':
        return { angle: 8, power: 12 }; // Medium variance
      case 'hard':
        return { angle: 3, power: 5 }; // Low variance
      default:
        return { angle: 8, power: 12 };
    }
  }

  recordShotResult(result: 'hit' | 'miss' | 'close') {
    if (this.lastShotData) {
      this.lastShotData.result = result;
    }
  }

  reset() {
    this.lastShotData = null;
    this.shotHistory = [];
  }
}

export const createBotAI = (difficulty: BotDifficulty = 'medium'): BotAI => {
  return new BotAI(difficulty);
};