import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CelebrationOverlayProps {
  show: boolean;
  type: 'win' | 'lose' | 'draw';
  message: string;
  onComplete?: () => void;
}

const CelebrationOverlay = ({ show, type, message, onComplete }: CelebrationOverlayProps) => {
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; y: number; color: string }>>([]);

  useEffect(() => {
    if (show && type === 'win') {
      // Generate confetti
      const newConfetti = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: -10,
        color: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'][Math.floor(Math.random() * 5)]
      }));
      setConfetti(newConfetti);

      const timer = setTimeout(() => {
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [show, type, onComplete]);

  const getEmoji = () => {
    switch (type) {
      case 'win': return '🎉';
      case 'lose': return '😔';
      case 'draw': return '🤝';
      default: return '🎮';
    }
  };

  const getColors = () => {
    switch (type) {
      case 'win': return 'from-yellow-400 to-orange-500';
      case 'lose': return 'from-gray-400 to-gray-600';
      case 'draw': return 'from-blue-400 to-purple-500';
      default: return 'from-primary to-accent';
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          {/* Confetti for wins */}
          {type === 'win' && confetti.map((piece) => (
            <motion.div
              key={piece.id}
              initial={{ x: `${piece.x}vw`, y: '-10vh', rotate: 0 }}
              animate={{ 
                x: `${piece.x + (Math.random() - 0.5) * 20}vw`, 
                y: '110vh', 
                rotate: 360 * 3 
              }}
              transition={{ 
                duration: 3 + Math.random() * 2, 
                ease: 'easeOut' 
              }}
              className="absolute w-2 h-2 rounded-full"
              style={{ backgroundColor: piece.color }}
            />
          ))}

          {/* Main celebration content */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: 'spring', duration: 0.8 }}
            className="text-center p-8 bg-card rounded-2xl border shadow-2xl max-w-md mx-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="text-8xl mb-4"
            >
              {getEmoji()}
            </motion.div>

            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className={`text-3xl font-bold mb-2 bg-gradient-to-r ${getColors()} bg-clip-text text-transparent`}
            >
              {type === 'win' ? 'Victory!' : type === 'lose' ? 'Game Over' : 'Draw!'}
            </motion.h2>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-lg text-muted-foreground"
            >
              {message}
            </motion.p>

            {type === 'win' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ delay: 1, repeat: Infinity, duration: 2 }}
                className="mt-4"
              >
                <div className="text-2xl">⭐ ⭐ ⭐</div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CelebrationOverlay;