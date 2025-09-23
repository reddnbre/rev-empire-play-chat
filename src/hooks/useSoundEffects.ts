import { useCallback } from 'react';

interface SoundEffects {
  playMove: () => void;
  playWin: () => void;
  playLose: () => void;
  playJoin: () => void;
  playMessage: () => void;
  playReaction: () => void;
  playTick: () => void;
}

export const useSoundEffects = (): SoundEffects => {
  const createSound = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine') => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  }, []);

  const playMove = useCallback(() => {
    createSound(800, 0.1, 'square');
  }, [createSound]);

  const playWin = useCallback(() => {
    // Victory fanfare
    setTimeout(() => createSound(523, 0.2), 0);
    setTimeout(() => createSound(659, 0.2), 100);
    setTimeout(() => createSound(784, 0.2), 200);
    setTimeout(() => createSound(1047, 0.4), 300);
  }, [createSound]);

  const playLose = useCallback(() => {
    // Descending defeat sound
    setTimeout(() => createSound(400, 0.3), 0);
    setTimeout(() => createSound(300, 0.3), 150);
    setTimeout(() => createSound(200, 0.5), 300);
  }, [createSound]);

  const playJoin = useCallback(() => {
    createSound(600, 0.15);
    setTimeout(() => createSound(800, 0.15), 100);
  }, [createSound]);

  const playMessage = useCallback(() => {
    createSound(440, 0.1, 'sine');
  }, [createSound]);

  const playReaction = useCallback(() => {
    createSound(660, 0.12, 'triangle');
  }, [createSound]);

  const playTick = useCallback(() => {
    createSound(1000, 0.05, 'square');
  }, [createSound]);

  return {
    playMove,
    playWin,
    playLose,
    playJoin,
    playMessage,
    playReaction,
    playTick
  };
};