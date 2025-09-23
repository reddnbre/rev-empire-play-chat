import { Tank, WindEffect, Powerup, Obstacle } from './gameTypes';
import { GAME_CONSTANTS } from './gamePhysics';

export class BotAI {
  private shotHistory: { angle: number; power: number; distance: number; result?: 'hit' | 'miss' | 'close' }[] = [];
  private strategicMemory: Map<string, { success: number; attempts: number }> = new Map();

  constructor() {
    // No difficulty levels - bot is always strategic
  }

  calculateShot(
    botTank: Tank, 
    targetTank: Tank, 
    wind: WindEffect, 
    powerups: Powerup[] = [], 
    obstacles: Obstacle[] = []
  ): { 
    angle: number; 
    power: number; 
    thinkingTime: number; 
    shouldMove?: 'left' | 'right' | null; 
    targetPowerup?: Powerup;
    strategicReason: string;
  } {
    const distance = Math.abs(targetTank.x - botTank.x);
    const heightDiff = targetTank.y - botTank.y;
    
    // Strategic analysis
    const analysis = this.analyzeStrategicSituation(botTank, targetTank, powerups, obstacles);
    
    let shouldMove: 'left' | 'right' | null = null;
    let targetPowerup: Powerup | undefined = undefined;
    let strategicReason = "Calculating optimal shot";

    // Priority 1: Collect powerful powerups if nearby and safe
    if (analysis.nearbyPowerups.length > 0 && analysis.threatLevel < 0.7) {
      const bestPowerup = this.selectBestPowerup(analysis.nearbyPowerups, botTank);
      if (bestPowerup && Math.abs(bestPowerup.x - botTank.x) > 25) {
        shouldMove = bestPowerup.x > botTank.x ? 'right' : 'left';
        targetPowerup = bestPowerup;
        strategicReason = `Collecting ${bestPowerup.name} powerup`;
      }
    }
    
    // Priority 2: Move out of danger
    if (!shouldMove && analysis.threatLevel > 0.8) {
      shouldMove = this.calculateEvasiveMove(botTank, targetTank, obstacles);
      strategicReason = "Evading imminent threat";
    }
    
    // Priority 3: Destroy blocking obstacles if beneficial
    if (!shouldMove && analysis.blockingObstacles.length > 0) {
      const shouldDestroyObstacle = this.shouldDestroyObstacle(botTank, targetTank, analysis.blockingObstacles);
      if (shouldDestroyObstacle) {
        strategicReason = "Destroying tactical obstacle";
      }
    }
    
    // Priority 4: Optimal positioning for attack
    if (!shouldMove) {
      const optimalPosition = this.calculateOptimalPosition(botTank, targetTank, obstacles, distance);
      if (optimalPosition !== 'stay') {
        shouldMove = optimalPosition;
        strategicReason = "Moving to optimal firing position";
      }
    }

    // Calculate shot with advanced physics and strategic considerations
    const { angle, power } = this.calculateAdvancedShot(botTank, targetTank, wind, obstacles, analysis);
    
    // Thinking time based on complexity (bot always thinks strategically)
    const complexity = analysis.threatLevel + (analysis.nearbyPowerups.length * 0.1) + (obstacles.length * 0.05);
    const thinkingTime = 2000 + (complexity * 1000); // 2-5 seconds based on situation complexity

    return { 
      angle, 
      power, 
      thinkingTime, 
      shouldMove, 
      targetPowerup,
      strategicReason 
    };
  }

  private analyzeStrategicSituation(
    botTank: Tank, 
    targetTank: Tank, 
    powerups: Powerup[], 
    obstacles: Obstacle[]
  ) {
    const distance = Math.abs(targetTank.x - botTank.x);
    
    // Analyze powerups in range
    const nearbyPowerups = powerups.filter(p => 
      p.active && !p.collected && Math.abs(p.x - botTank.x) < 300
    );
    
    // Calculate threat level based on distance and enemy powerups
    let threatLevel = 0;
    if (distance < 200) threatLevel += 0.4; // Close combat is risky
    if (targetTank.powerups.length > 0) {
      threatLevel += targetTank.powerups.length * 0.2;
      // Extra threat from dangerous powerups
      const dangerousPowerups = targetTank.powerups.filter(p => 
        ['cluster_bomb', 'napalm', 'armor_piercing', 'missile'].includes(p.type)
      );
      threatLevel += dangerousPowerups.length * 0.3;
    }
    
    // Identify blocking obstacles
    const blockingObstacles = obstacles.filter(obs => {
      const obsBetween = (botTank.x < obs.x && obs.x < targetTank.x) || 
                        (targetTank.x < obs.x && obs.x < botTank.x);
      return obsBetween && obs.destructible;
    });
    
    return {
      nearbyPowerups,
      threatLevel: Math.min(1, threatLevel),
      blockingObstacles,
      distance
    };
  }

  private selectBestPowerup(powerups: Powerup[], botTank: Tank): Powerup | null {
    if (powerups.length === 0) return null;
    
    // Powerup priority scoring
    const powerupScores = powerups.map(p => {
      const distance = Math.abs(p.x - botTank.x);
      const distanceScore = Math.max(0, 1 - (distance / 200)); // Closer is better
      
      // Strategic value of powerup types
      const typeScores: Record<string, number> = {
        cluster_bomb: 0.95,    // Extremely valuable - AOE damage
        napalm: 0.90,          // Very valuable - lingering damage
        armor_piercing: 0.85,  // High damage, ignores shields
        missile: 0.80,         // Homing capability
        double_shot: 0.70,     // Good damage output
        long_shot: 0.60,       // Range advantage
        bounce_shot: 0.55,     // Tactical advantage
        laser_sight: 0.50,     // Accuracy boost
        shield: 0.40,          // Defensive only
        repair_kit: 0.30       // Situational
      };
      
      const typeScore = typeScores[p.type] || 0.25;
      const timeScore = 1 - (p.timer / p.maxTimer); // Prefer powerups that will last longer
      
      return {
        powerup: p,
        totalScore: (typeScore * 0.6) + (distanceScore * 0.3) + (timeScore * 0.1)
      };
    });
    
    // Return highest scoring powerup
    const best = powerupScores.reduce((best, current) => 
      current.totalScore > best.totalScore ? current : best
    );
    
    return best.totalScore > 0.3 ? best.powerup : null;
  }

  private calculateEvasiveMove(botTank: Tank, targetTank: Tank, obstacles: Obstacle[]): 'left' | 'right' {
    // Calculate safe directions
    const leftSafe = this.isDirectionSafe(botTank, 'left', obstacles);
    const rightSafe = this.isDirectionSafe(botTank, 'right', obstacles);
    
    if (leftSafe && rightSafe) {
      // Choose direction that increases distance from target
      return botTank.x < targetTank.x ? 'left' : 'right';
    }
    
    return leftSafe ? 'left' : 'right';
  }

  private isDirectionSafe(tank: Tank, direction: 'left' | 'right', obstacles: Obstacle[]): boolean {
    const moveDistance = 50;
    const newX = direction === 'left' ? tank.x - moveDistance : tank.x + moveDistance;
    
    // Check boundaries
    if (newX < 50 || newX > GAME_CONSTANTS.CANVAS_WIDTH - 50) return false;
    
    // Check obstacles
    return !obstacles.some(obs => 
      newX > obs.x - obs.width/2 && newX < obs.x + obs.width/2
    );
  }

  private shouldDestroyObstacle(botTank: Tank, targetTank: Tank, obstacles: Obstacle[]): boolean {
    // Check if destroying obstacles would give clear shot advantage
    return obstacles.some(obs => {
      const clearsShotPath = (botTank.x < obs.x && obs.x < targetTank.x) || 
                             (targetTank.x < obs.x && obs.x < botTank.x);
      return clearsShotPath && obs.destructible;
    });
  }

  private calculateOptimalPosition(
    botTank: Tank, 
    targetTank: Tank, 
    obstacles: Obstacle[], 
    currentDistance: number
  ): 'left' | 'right' | 'stay' {
    const optimalDistance = 350; // Sweet spot for accuracy vs safety
    
    if (currentDistance < 150) {
      // Too close - dangerous
      return botTank.x < targetTank.x ? 'left' : 'right';
    } else if (currentDistance > 600) {
      // Too far - move closer for better accuracy
      return botTank.x < targetTank.x ? 'right' : 'left';
    } else if (Math.abs(currentDistance - optimalDistance) > 100) {
      // Move toward optimal distance
      const needsToBeCloser = currentDistance > optimalDistance;
      if (needsToBeCloser) {
        return botTank.x < targetTank.x ? 'right' : 'left';
      } else {
        return botTank.x < targetTank.x ? 'left' : 'right';
      }
    }
    
    return 'stay';
  }

  private calculateAdvancedShot(
    botTank: Tank, 
    targetTank: Tank, 
    wind: WindEffect, 
    obstacles: Obstacle[],
    analysis: any
  ): { angle: number; power: number } {
    const distance = Math.abs(targetTank.x - botTank.x);
    const heightDiff = targetTank.y - botTank.y;
    const gravity = GAME_CONSTANTS.GRAVITY;
    
    // Advanced physics calculation with obstacle avoidance
    let optimalAngle = this.calculateBallisticAngle(distance, heightDiff, gravity);
    let optimalPower = this.calculateBallisticPower(distance, optimalAngle, gravity);
    
    // Adjust for obstacles in path
    const obstacleAdjustment = this.calculateObstacleAvoidance(botTank, targetTank, obstacles);
    optimalAngle += obstacleAdjustment.angle;
    optimalPower += obstacleAdjustment.power;
    
    // Advanced wind compensation
    const windCompensation = this.calculatePreciseWindCompensation(wind, distance, optimalAngle);
    optimalPower += windCompensation;
    
    // Learn from shot history
    const learningAdjustment = this.applyMachineLearning(distance, optimalAngle, optimalPower);
    optimalAngle += learningAdjustment.angle;
    optimalPower += learningAdjustment.power;
    
    // Strategic powerup considerations
    if (botTank.powerups.length > 0) {
      const powerupAdjustment = this.adjustForOwnPowerups(botTank.powerups);
      optimalAngle += powerupAdjustment.angle;
      optimalPower += powerupAdjustment.power;
    }
    
    // Clamp to valid ranges
    optimalAngle = Math.max(5, Math.min(85, optimalAngle));
    optimalPower = Math.max(15, Math.min(100, optimalPower));
    
    return { angle: optimalAngle, power: optimalPower };
  }

  private calculateBallisticAngle(distance: number, heightDiff: number, gravity: number): number {
    // Solve ballistic trajectory for optimal angle
    const dx = distance;
    const dy = -heightDiff;
    
    const discriminant = (dx * dx * gravity * gravity) + (2 * dy * gravity * dx * dx);
    if (discriminant < 0) return 45; // Fallback
    
    const sqrtDiscriminant = Math.sqrt(discriminant);
    const angle1 = Math.atan((-dx * gravity + sqrtDiscriminant) / (dx * gravity)) * (180 / Math.PI);
    const angle2 = Math.atan((-dx * gravity - sqrtDiscriminant) / (dx * gravity)) * (180 / Math.PI);
    
    // Choose lower angle for faster, flatter trajectory
    return Math.min(Math.abs(angle1), Math.abs(angle2)) || 35;
  }

  private calculateBallisticPower(distance: number, angle: number, gravity: number): number {
    const radians = angle * (Math.PI / 180);
    const velocity = Math.sqrt((distance * gravity) / Math.sin(2 * radians));
    return Math.min(100, velocity * 6); // Scale to power range
  }

  private calculateObstacleAvoidance(
    botTank: Tank, 
    targetTank: Tank, 
    obstacles: Obstacle[]
  ): { angle: number; power: number } {
    // Simple obstacle avoidance - aim higher if obstacles block path
    const hasBlockingObstacles = obstacles.some(obs => {
      const between = (botTank.x < obs.x && obs.x < targetTank.x) || 
                      (targetTank.x < obs.x && obs.x < botTank.x);
      return between && obs.y < GAME_CONSTANTS.GROUND_Y - 50;
    });
    
    if (hasBlockingObstacles) {
      return { angle: 8, power: 5 }; // Aim higher and with more power
    }
    
    return { angle: 0, power: 0 };
  }

  private calculatePreciseWindCompensation(wind: WindEffect, distance: number, angle: number): number {
    const timeOfFlight = (2 * Math.sin(angle * Math.PI / 180) * 60) / GAME_CONSTANTS.GRAVITY;
    const windEffect = wind.strength * wind.direction;
    const windImpact = windEffect * timeOfFlight * 0.4;
    
    // Convert wind impact to power adjustment
    return -windImpact * 8;
  }

  private applyMachineLearning(distance: number, angle: number, power: number): { angle: number; power: number } {
    const key = `${Math.floor(distance / 50)}_${Math.floor(angle / 10)}`;
    const memory = this.strategicMemory.get(key);
    
    if (memory && memory.attempts > 2) {
      const successRate = memory.success / memory.attempts;
      if (successRate < 0.3) {
        // Adjust based on poor performance
        return {
          angle: (Math.random() - 0.5) * 6,
          power: (Math.random() - 0.5) * 8
        };
      }
    }
    
    return { angle: 0, power: 0 };
  }

  private adjustForOwnPowerups(powerups: any[]): { angle: number; power: number } {
    let angleAdjust = 0;
    let powerAdjust = 0;
    
    powerups.forEach(powerup => {
      switch (powerup.type) {
        case 'long_shot':
          powerAdjust -= 5; // Can use less power for same distance
          break;
        case 'cluster_bomb':
          angleAdjust += 2; // Aim slightly higher for better cluster spread
          break;
        case 'missile':
          angleAdjust -= 3; // Can aim more directly since missile homes in
          break;
      }
    });
    
    return { angle: angleAdjust, power: powerAdjust };
  }

  recordShotResult(distance: number, angle: number, result: 'hit' | 'miss' | 'close') {
    // Machine learning - record results for future improvement
    const key = `${Math.floor(distance / 50)}_${Math.floor(angle / 10)}`;
    const existing = this.strategicMemory.get(key) || { success: 0, attempts: 0 };
    
    existing.attempts++;
    if (result === 'hit') existing.success++;
    
    this.strategicMemory.set(key, existing);
    
    // Keep shot history for pattern recognition
    this.shotHistory.push({ angle, power: 0, distance, result });
    if (this.shotHistory.length > 20) {
      this.shotHistory.shift();
    }
  }

  reset() {
    this.shotHistory = [];
    this.strategicMemory.clear();
  }
}

export const createBotAI = (): BotAI => {
  return new BotAI();
};