import React, { useState } from 'react';
import { CannonDuelGame } from './CannonDuel/CannonDuelGame';
import { GameLobby } from './CannonDuel/GameLobby';

interface CannonDuelProps {
  onBack: () => void;
}

const CannonDuel: React.FC<CannonDuelProps> = ({ onBack }) => {
  const [gameMode, setGameMode] = useState<'lobby' | 'pvp' | 'bot'>('lobby');

  const handleStartPvP = () => setGameMode('pvp');
  const handleStartBot = () => setGameMode('bot');
  const handleBackToLobby = () => setGameMode('lobby');

  if (gameMode === 'lobby') {
    return (
      <GameLobby
        onStartPvP={handleStartPvP}
        onStartBot={handleStartBot}
        onBack={onBack}
      />
    );
  }

  return (
    <CannonDuelGame
      onBack={handleBackToLobby}
      initialGameMode={gameMode}
    />
  );
};

export default CannonDuel;