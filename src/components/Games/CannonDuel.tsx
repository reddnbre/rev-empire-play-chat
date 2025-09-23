import React from 'react';
import { CannonDuelGame } from './CannonDuel/CannonDuelGame';

interface CannonDuelProps {
  onBack: () => void;
}

const CannonDuel: React.FC<CannonDuelProps> = ({ onBack }) => {
  return <CannonDuelGame onBack={onBack} />;
};

export default CannonDuel;