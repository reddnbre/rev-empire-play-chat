export interface Tank {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  id: 1 | 2;
  shield?: number;
  powerups: PowerupEffect[];
}

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  active: boolean;
  trail: { x: number; y: number; alpha: number }[];
}

export interface Explosion {
  x: number;
  y: number;
  frame: number;
  active: boolean;
  particles: Particle[];
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export interface WindEffect {
  strength: number; // 0-1
  direction: number; // -1 to 1 (left to right)
  particles: WindParticle[];
}

export type PowerupType = 
  | 'missile' 
  | 'shield' 
  | 'double_shot' 
  | 'napalm' 
  | 'long_shot' 
  | 'repair_kit'
  | 'bounce_shot'
  | 'cluster_bomb'
  | 'laser_sight'
  | 'armor_piercing';

export interface Powerup {
  id: string;
  type: PowerupType;
  x: number;
  y: number;
  active: boolean;
  collected: boolean;
  timer: number;
  maxTimer: number;
  name: string;
  description: string;
  icon: string;
}

export interface PowerupEffect {
  type: PowerupType;
  duration: number;
  remaining: number;
}

export interface WindParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
}

export type GamePhase = 'move' | 'aim' | 'firing' | 'finished';
export type GameMode = 'pvp' | 'bot';
export type BotDifficulty = 'easy' | 'medium' | 'hard';

export interface GameState {
  currentPlayer: 1 | 2;
  gamePhase: GamePhase;
  gameMode: GameMode;
  botDifficulty: BotDifficulty;
  player1Tank: Tank;
  player2Tank: Tank;
  projectile: Projectile;
  explosions: Explosion[];
  wind: WindEffect;
  angle: number;
  power: number;
  winner: 1 | 2 | null;
  player2Joined: boolean;
  roundCount: number;
  powerups: Powerup[];
  activePowerup: PowerupType | null;
}

export interface GameConstants {
  CANVAS_WIDTH: number;
  CANVAS_HEIGHT: number;
  GROUND_Y: number;
  TANK_SIZE: number;
  GRAVITY: number;
  EXPLOSION_FRAMES: number;
  PROJECTILE_SIZE: number;
  TRAIL_LENGTH: number;
  PARTICLE_COUNT: number;
}