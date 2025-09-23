import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Target, Zap, Shield, Crosshair, Bot, Users, Wind, Gamepad2 } from 'lucide-react';
import { GameState, BotDifficulty } from './gameTypes';
import { POWERUP_CONFIGS } from './powerupSystem';

interface GameControlsProps {
  gameState: GameState;
  onBack: () => void;
  onGameModeChange: (mode: 'pvp' | 'bot') => void;
  onBotDifficultyChange: (difficulty: BotDifficulty) => void;
  onMoveTank: (direction: 'left' | 'right') => void;
  onStartAiming: () => void;
  onAngleChange: (angle: number[]) => void;
  onPowerChange: (power: number[]) => void;
  onFire: () => void;
  onNewGame: () => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
  gameState,
  onBack,
  onGameModeChange,
  onBotDifficultyChange,
  onMoveTank,
  onStartAiming,
  onAngleChange,
  onPowerChange,
  onFire,
  onNewGame
}) => {
  const getCurrentPlayerName = () => {
    if (gameState.currentPlayer === 1) return 'Player 1';
    return gameState.gameMode === 'bot' ? 'Bot' : 'Player 2';
  };

  const getCurrentPlayerIcon = () => {
    if (gameState.currentPlayer === 1) {
      return <Shield className="w-5 h-5 text-blue-600" />;
    }
    return gameState.gameMode === 'bot' ? 
      <Bot className="w-5 h-5 text-red-600" /> : 
      <Crosshair className="w-5 h-5 text-red-600" />;
  };

  const getPhaseDescription = () => {
    switch (gameState.gamePhase) {
      case 'move': return 'Position your tank';
      case 'aim': return 'Aim and set power';
      case 'firing': return 'Projectile in flight';
      case 'finished': return 'Game over';
      default: return '';
    }
  };

  const canShowControls = () => {
    return gameState.gameMode === 'pvp' || gameState.currentPlayer === 1;
  };

  const windStrengthText = () => {
    const strength = Math.abs(gameState.wind.strength);
    if (strength < 0.2) return 'Calm';
    if (strength < 0.4) return 'Light';
    if (strength < 0.6) return 'Moderate';
    return 'Strong';
  };

  const windDirectionText = () => {
    return gameState.wind.direction > 0 ? 'Right' : 'Left';
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Games
        </Button>
        
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <Button
              variant={gameState.gameMode === 'pvp' ? 'default' : 'outline'}
              onClick={() => onGameModeChange('pvp')}
              size="sm"
              className="flex items-center gap-1"
            >
              <Users className="w-4 h-4" />
              PvP
            </Button>
            <Button
              variant={gameState.gameMode === 'bot' ? 'default' : 'outline'}
              onClick={() => onGameModeChange('bot')}
              size="sm"
              className="flex items-center gap-1"
            >
              <Bot className="w-4 h-4" />
              vs Bot
            </Button>
          </div>

          {gameState.gameMode === 'bot' && (
            <Select value={gameState.botDifficulty} onValueChange={onBotDifficultyChange}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Game Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Card className="bg-slate-800/50 border-slate-600">
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{gameState.player1Tank.hp}</div>
              <div className="text-xs text-slate-400 mb-1">Player 1 HP</div>
              {gameState.player1Tank.shield && (
                <div className="flex items-center justify-center gap-1 text-xs text-blue-300">
                  <Shield className="w-3 h-3" />
                  {gameState.player1Tank.shield}
                </div>
              )}
              {gameState.player1Tank.powerups.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1 justify-center">
                  {gameState.player1Tank.powerups.map((powerup, i) => (
                    <div key={i} className="text-xs bg-blue-600/20 px-1 rounded">
                      {powerup.type.replace('_', ' ')} ({powerup.remaining})
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-600">
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{gameState.player2Tank.hp}</div>
              <div className="text-xs text-slate-400 mb-1">{gameState.gameMode === 'bot' ? 'Bot' : 'Player 2'} HP</div>
              {gameState.player2Tank.shield && (
                <div className="flex items-center justify-center gap-1 text-xs text-blue-300">
                  <Shield className="w-3 h-3" />
                  {gameState.player2Tank.shield}
                </div>
              )}
              {gameState.player2Tank.powerups.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1 justify-center">
                  {gameState.player2Tank.powerups.map((powerup, i) => (
                    <div key={i} className="text-xs bg-red-600/20 px-1 rounded">
                      {powerup.type.replace('_', ' ')} ({powerup.remaining})
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Powerups Info */}
      {gameState.powerups.filter(p => p.active && !p.collected).length > 0 && (
        <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30 mb-4">
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-sm font-semibold text-yellow-400 mb-2">Active Powerups on Field</div>
              <div className="flex flex-wrap gap-2 justify-center">
                {gameState.powerups.filter(p => p.active && !p.collected).map(powerup => (
                  <div key={powerup.id} className="bg-yellow-500/20 px-2 py-1 rounded text-xs">
                    {POWERUP_CONFIGS[powerup.type].icon} {powerup.name}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controls */}
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            {getCurrentPlayerIcon()}
            {getCurrentPlayerName()} Controls
            {!canShowControls() && (
              <Badge variant="outline" className="ml-auto">
                <Gamepad2 className="w-3 h-3 mr-1" />
                Waiting...
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {gameState.gamePhase === 'move' && canShowControls() && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium flex items-center gap-2 mb-3">
                  <Crosshair className="w-4 h-4" />
                  Position Tank
                </label>
                <div className="flex gap-2">
                  <Button onClick={() => onMoveTank('left')} size="sm" variant="outline">
                    ← Move Left
                  </Button>
                  <Button onClick={() => onMoveTank('right')} size="sm" variant="outline">
                    Move Right →
                  </Button>
                  <Button onClick={onStartAiming} variant="default" size="sm" className="ml-auto">
                    <Target className="w-4 h-4 mr-1" />
                    Ready to Aim
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {gameState.gamePhase === 'aim' && canShowControls() && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Angle: {gameState.angle}°</label>
                <Slider
                  value={[gameState.angle]}
                  onValueChange={onAngleChange}
                  max={90}
                  min={0}
                  step={1}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0° (Flat)</span>
                  <span>45° (Optimal)</span>
                  <span>90° (High Arc)</span>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Power: {gameState.power}%</label>
                <Slider
                  value={[gameState.power]}
                  onValueChange={onPowerChange}
                  max={100}
                  min={10}
                  step={1}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>10% (Short)</span>
                  <span>50% (Medium)</span>
                  <span>100% (Max Range)</span>
                </div>
              </div>
              
              <Button onClick={onFire} className="w-full" size="lg">
                <Zap className="w-4 h-4 mr-2" />
                FIRE!
              </Button>
            </div>
          )}
          
          {gameState.gamePhase === 'firing' && (
            <div className="text-center py-8">
              <div className="text-lg font-medium">Projectile in flight...</div>
              <div className="text-sm text-muted-foreground">Watch for impact!</div>
              <div className="mt-4">
                <div className="animate-pulse inline-flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          {gameState.gameMode === 'bot' && gameState.currentPlayer === 2 && gameState.gamePhase !== 'finished' && (
            <div className="text-center py-8">
              <div className="text-lg font-medium flex items-center justify-center gap-2">
                <Bot className="w-5 h-5" />
                Bot is calculating...
              </div>
              <div className="text-sm text-muted-foreground">
                Analyzing trajectory ({gameState.botDifficulty} difficulty)
              </div>
              <div className="mt-4">
                <div className="inline-flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}

          {gameState.gamePhase === 'finished' && (
            <div className="text-center py-4">
              <div className="text-lg font-bold mb-2">
                {gameState.winner === 1 ? '🎉 Player 1 Wins!' : 
                 gameState.gameMode === 'bot' ? '🤖 Bot Wins!' : '🎉 Player 2 Wins!'}
              </div>
              <Button onClick={onNewGame} size="lg" className="mt-2">
                <Target className="w-4 h-4 mr-2" />
                New Game
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex justify-center gap-2">
        <Button variant="outline" onClick={onNewGame}>
          New Game
        </Button>
      </div>
    </div>
  );
};