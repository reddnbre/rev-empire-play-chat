export interface Obstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  type: 'wall' | 'bunker' | 'rock' | 'building';
  destructible: boolean;
}

export const OBSTACLE_TYPES = {
  wall: {
    width: 20,
    height: 80,
    hp: 50,
    color: '#8B7355',
    destructible: true
  },
  bunker: {
    width: 60,
    height: 40,
    hp: 100,
    color: '#4A4A4A',
    destructible: true
  },
  rock: {
    width: 40,
    height: 60,
    hp: 75,
    color: '#6B7280',
    destructible: true
  },
  building: {
    width: 80,
    height: 100,
    hp: 150,
    color: '#DC2626',
    destructible: true
  }
};

export const generateRandomObstacles = (canvasWidth: number, groundY: number): Obstacle[] => {
  const obstacles: Obstacle[] = [];
  const numObstacles = Math.floor(Math.random() * 4) + 2; // 2-5 obstacles
  
  // Ensure we don't place obstacles too close to tank spawn points
  const leftSafeZone = 200;
  const rightSafeZone = canvasWidth - 200;
  const centerZone = canvasWidth / 2;
  
  for (let i = 0; i < numObstacles; i++) {
    const types = Object.keys(OBSTACLE_TYPES) as Array<keyof typeof OBSTACLE_TYPES>;
    const type = types[Math.floor(Math.random() * types.length)];
    const config = OBSTACLE_TYPES[type];
    
    // Generate position avoiding safe zones
    let x: number;
    do {
      x = Math.random() * (canvasWidth - config.width);
    } while (
      (x < leftSafeZone) ||
      (x > rightSafeZone - config.width) ||
      (Math.abs(x - centerZone) < 100) // Avoid center for better gameplay
    );
    
    const obstacle: Obstacle = {
      id: `obstacle-${i}`,
      x,
      y: groundY - config.height,
      width: config.width,
      height: config.height,
      hp: config.hp,
      maxHp: config.hp,
      type,
      destructible: config.destructible
    };
    
    // Check if this obstacle overlaps with existing ones
    const overlaps = obstacles.some(existing => {
      return Math.abs(obstacle.x - existing.x) < Math.max(obstacle.width, existing.width);
    });
    
    if (!overlaps) {
      obstacles.push(obstacle);
    }
  }
  
  return obstacles;
};

export const checkObstacleCollision = (
  projectileX: number,
  projectileY: number,
  obstacles: Obstacle[]
): { hit: boolean; obstacle?: Obstacle; hitPoint?: { x: number; y: number } } => {
  for (const obstacle of obstacles) {
    if (obstacle.hp <= 0) continue;
    
    if (
      projectileX >= obstacle.x &&
      projectileX <= obstacle.x + obstacle.width &&
      projectileY >= obstacle.y &&
      projectileY <= obstacle.y + obstacle.height
    ) {
      return {
        hit: true,
        obstacle,
        hitPoint: { x: projectileX, y: projectileY }
      };
    }
  }
  
  return { hit: false };
};

export const damageObstacle = (obstacle: Obstacle, damage: number): Obstacle => {
  return {
    ...obstacle,
    hp: Math.max(0, obstacle.hp - damage)
  };
};

export const isObstacleDestroyed = (obstacle: Obstacle): boolean => {
  return obstacle.hp <= 0;
};