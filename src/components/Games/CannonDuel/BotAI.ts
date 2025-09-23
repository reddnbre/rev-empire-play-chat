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

    // STRATEGIC DECISION TREE - Bot thinks like a human player
    
    // Priority 1: LETHAL SHOT - If bot can finish the game, take it!
    if (analysis.hasDirectLineOfSight && this.canKillTarget(botTank, targetTank, distance)) {
      strategicReason = "Going for the kill shot!";
    }
    
    // Priority 2: HIGH-VALUE POWERUP COLLECTION - Worth taking risks for game-changers
    else if (analysis.nearbyPowerups.length > 0 && analysis.opportunityScore > 0.4) {
      const bestPowerup = this.selectBestPowerup(analysis.nearbyPowerups, botTank);
      if (bestPowerup && Math.abs(bestPowerup.x - botTank.x) > 25) {
        shouldMove = bestPowerup.x > botTank.x ? 'right' : 'left';
        targetPowerup = bestPowerup;
        strategicReason = `Securing ${bestPowerup.name} - high tactical value!`;
      }
    }
    
    // Priority 3: POINT-BLANK EXECUTION - Close range, just shoot
    else if (distance < 80 && analysis.hasDirectLineOfSight) {
      strategicReason = "Point-blank shot - taking it!";
    }
    
    // Priority 4: CLEAR TACTICAL PATH - Destroy obstacles that block good opportunities
    else if (analysis.destructibleBlockers.length > 0 && this.shouldClearPath(botTank, targetTank, analysis)) {
      strategicReason = "Clearing tactical path for better positioning";
    }
    
    // Priority 5: THREAT EVASION - Only move if in serious danger AND not close
    else if (analysis.threatLevel > 0.7 && distance > 120 && !analysis.hasDirectLineOfSight) {
      shouldMove = this.calculateEvasiveMove(botTank, targetTank, obstacles);
      strategicReason = "Tactical repositioning under fire";
    }
    
    // Priority 6: AGGRESSIVE POSITIONING - Move to dominate the battlefield
    else if (analysis.opportunityScore > analysis.threatLevel) {
      const aggressivePosition = this.calculateAggressivePosition(botTank, targetTank, obstacles, analysis);
      if (aggressivePosition !== 'stay') {
        shouldMove = aggressivePosition;
        strategicReason = "Advancing for tactical advantage";
      }
    }
    
    // Priority 7: OBSTACLE MANAGEMENT - Smart obstacle handling
    else if (analysis.blockingObstacles.length > 0) {
      const obstacleStrategy = this.determineObstacleStrategy(botTank, targetTank, analysis);
      if (obstacleStrategy === 'destroy') {
        strategicReason = "Destroying obstacle for clear shot";
      } else if (obstacleStrategy === 'arc') {
        strategicReason = "Arcing shot over obstacle";
      }
    }

    // Calculate shot with advanced physics and strategic considerations
    const { angle, power } = this.calculateAdvancedShot(botTank, targetTank, wind, obstacles, analysis);
    
    // Dynamic thinking time based on complexity and aggression
    const complexity = analysis.threatLevel + (analysis.nearbyPowerups.length * 0.1) + (obstacles.length * 0.05);
    const thinkingTime = 1500 + (complexity * 800); // 1.5-3 seconds - faster, more confident

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
    
    // Analyze powerups in range - POWERUPS ARE GOOD, NOT THREATS!
    const nearbyPowerups = powerups.filter(p => 
      p.active && !p.collected && Math.abs(p.x - botTank.x) < 300
    );
    
    // Calculate ACTUAL threat level - only from enemy capabilities and positioning
    let threatLevel = 0;
    
    // Distance-based threat (only if enemy has line of sight)
    const hasDirectLineOfSight = !this.checkLineOfSightBlocked(botTank, targetTank, obstacles);
    if (distance < 200 && hasDirectLineOfSight) {
      threatLevel += 0.3; // Reduced - close combat isn't always bad
    }
    
    // Enemy powerup threat - only count actual dangerous ones
    if (targetTank.powerups.length > 0) {
      const dangerousPowerups = targetTank.powerups.filter(p => 
        ['cluster_bomb', 'napalm', 'armor_piercing', 'missile'].includes(p.type)
      );
      threatLevel += dangerousPowerups.length * 0.25;
    }
    
    // Health disadvantage increases threat
    const healthRatio = botTank.hp / targetTank.hp;
    if (healthRatio < 0.5) threatLevel += 0.3;
    
    // Identify different types of obstacles
    const blockingObstacles = obstacles.filter(obs => {
      const obsBetween = (botTank.x < obs.x && obs.x < targetTank.x) || 
                        (targetTank.x < obs.x && obs.x < botTank.x);
      return obsBetween;
    });
    
    const destructibleBlockers = blockingObstacles.filter(obs => obs.destructible);
    const permanentBlockers = blockingObstacles.filter(obs => !obs.destructible);
    
    // Calculate opportunity score (powerups + tactical advantage)
    let opportunityScore = nearbyPowerups.length * 0.2;
    if (botTank.hp > targetTank.hp) opportunityScore += 0.3; // Health advantage
    if (botTank.powerups.length > targetTank.powerups.length) opportunityScore += 0.2;
    
    return {
      nearbyPowerups,
      threatLevel: Math.min(1, threatLevel),
      blockingObstacles,
      destructibleBlockers,
      permanentBlockers,
      distance,
      opportunityScore,
      hasDirectLineOfSight
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
    // AGGRESSIVE POSITIONING - Bot wants to win, not just survive
    const aggressiveDistance = 200; // Much closer than before - bot is confident
    
    // If bot has powerups, be more aggressive
    const powerupBonus = botTank.powerups.length * 50;
    const targetDistance = Math.max(150, aggressiveDistance - powerupBonus);
    
    if (currentDistance < 80) {
      // Very close - perfect for high damage, stay and fight
      return 'stay';
    } else if (currentDistance > targetDistance + 100) {
      // Too far - move closer for better accuracy and damage
      return botTank.x < targetTank.x ? 'right' : 'left';
    } else if (currentDistance < targetDistance - 50) {
      // Close enough for devastating shots - stay aggressive
      return 'stay';
    }
    
    // Check if moving would give tactical advantage
    const leftAdvantage = this.evaluatePositionAdvantage(botTank.x - 80, targetTank, obstacles);
    const rightAdvantage = this.evaluatePositionAdvantage(botTank.x + 80, targetTank, obstacles);
    const currentAdvantage = this.evaluatePositionAdvantage(botTank.x, targetTank, obstacles);
    
    if (leftAdvantage > currentAdvantage && leftAdvantage > rightAdvantage) {
      return 'left';
    } else if (rightAdvantage > currentAdvantage) {
      return 'right';
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

  // === NEW STRATEGIC METHODS ===

  private checkLineOfSightBlocked(botTank: Tank, targetTank: Tank, obstacles: Obstacle[]): boolean {
    return obstacles.some(obs => {
      const between = (botTank.x < obs.x && obs.x < targetTank.x) || 
                     (targetTank.x < obs.x && obs.x < botTank.x);
      return between && obs.y < GAME_CONSTANTS.GROUND_Y - 30;
    });
  }

  private canKillTarget(botTank: Tank, targetTank: Tank, distance: number): boolean {
    // Estimate if current shot could be lethal
    let estimatedDamage = 25; // Base damage
    
    // Add powerup damage bonuses
    botTank.powerups.forEach(powerup => {
      switch (powerup.type) {
        case 'armor_piercing': estimatedDamage += 15; break;
        case 'cluster_bomb': estimatedDamage += 20; break;
        case 'missile': estimatedDamage += 15; break;
        case 'napalm': estimatedDamage += 10; break;
      }
    });
    
    // Close range bonus (more likely to hit)
    if (distance < 150) estimatedDamage *= 1.2;
    
    return estimatedDamage >= targetTank.hp;
  }

  private shouldClearPath(botTank: Tank, targetTank: Tank, analysis: any): boolean {
    // Clear path if it opens up better tactical opportunities
    const hasValuablePowerups = analysis.nearbyPowerups.some((p: any) => 
      ['cluster_bomb', 'missile', 'napalm'].includes(p.type)
    );
    
    const healthAdvantage = botTank.hp > targetTank.hp * 1.2;
    
    return hasValuablePowerups || healthAdvantage || analysis.opportunityScore > 0.6;
  }

  private calculateAggressivePosition(
    botTank: Tank, 
    targetTank: Tank, 
    obstacles: Obstacle[], 
    analysis: any
  ): 'left' | 'right' | 'stay' {
    const distance = Math.abs(targetTank.x - botTank.x);
    
    // If bot has advantage, move aggressively
    if (analysis.opportunityScore > 0.5) {
      const aggressiveDistance = 250; // Closer for more accurate shots
      
      if (distance > aggressiveDistance) {
        // Move closer
        return botTank.x < targetTank.x ? 'right' : 'left';
      } else if (distance < 100) {
        // Too close - back off slightly
        return botTank.x < targetTank.x ? 'left' : 'right';
      }
    }
    
    return 'stay';
  }

  private determineObstacleStrategy(
    botTank: Tank, 
    targetTank: Tank, 
    analysis: any
  ): 'destroy' | 'arc' | 'ignore' {
    const distance = Math.abs(targetTank.x - botTank.x);
    
    // If close range and destructible obstacles, destroy them
    if (distance < 300 && analysis.destructibleBlockers.length > 0) {
      return 'destroy';
    }
    
    // If far range, try to arc over
    if (distance > 300 && analysis.permanentBlockers.length > 0) {
      return 'arc';
    }
    
    // If obstacles are blocking valuable powerups, destroy them
    if (analysis.nearbyPowerups.length > 0 && analysis.destructibleBlockers.length > 0) {
      return 'destroy';
    }
    
    return 'arc';
  }

  private evaluatePositionAdvantage(x: number, targetTank: Tank, obstacles: Obstacle[]): number {
    let advantage = 0;
    
    // Distance scoring - closer is better (aggressive bot)
    const distance = Math.abs(x - targetTank.x);
    if (distance < 200) advantage += 0.5;
    else if (distance < 300) advantage += 0.3;
    else if (distance > 500) advantage -= 0.3; // Too far is bad
    
    // Clear line of sight bonus
    const hasObstaclesBetween = obstacles.some(obs => {
      const between = (x < obs.x && obs.x < targetTank.x) || 
                     (targetTank.x < obs.x && obs.x < x);
      return between && obs.y < GAME_CONSTANTS.GROUND_Y - 50;
    });
    
    if (!hasObstaclesBetween) advantage += 0.4;
    
    // Boundary penalties
    if (x < 100 || x > GAME_CONSTANTS.CANVAS_WIDTH - 100) advantage -= 0.5;
    
    return advantage;
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