export interface Tank {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  id: 1 | 2;
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
  strength: number;
  direction: number;
  particles: WindParticle[];
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