import { useCallback } from 'react';

interface SoundEffects {
  playMove: () => void;
  playWin: () => void;
  playLose: () => void;
  playJoin: () => void;
  playMessage: () => void;
  playReaction: () => void;
  playTick: () => void;
  // Cannon Duel specific sounds
  playCannonFire: () => void;
  playMissileLaunch: () => void;
  playPlasmaShot: () => void;
  playClusterBomb: () => void;
  playNapalmFire: () => void;
  playExplosion: () => void;
  playNapalmExplosion: () => void;
  playClusterExplosion: () => void;
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

  // Cannon Duel sound effects
  const playCannonFire = useCallback(() => {
    createSound(200, 0.3, 'sawtooth'); // Deep cannon boom
  }, [createSound]);

  const playMissileLaunch = useCallback(() => {
    // Whoosh sound rising in pitch
    createSound(300, 0.1, 'sawtooth');
    setTimeout(() => createSound(400, 0.15, 'sawtooth'), 50);
    setTimeout(() => createSound(500, 0.1, 'sawtooth'), 100);
  }, [createSound]);

  const playPlasmaShot = useCallback(() => {
    // Sci-fi zap sound
    createSound(800, 0.05, 'square');
    setTimeout(() => createSound(1200, 0.08, 'square'), 25);
    setTimeout(() => createSound(600, 0.1, 'triangle'), 50);
  }, [createSound]);

  const playClusterBomb = useCallback(() => {
    // Small popping sound
    createSound(400, 0.1, 'square');
    setTimeout(() => createSound(500, 0.08, 'square'), 30);
  }, [createSound]);

  const playNapalmFire = useCallback(() => {
    // Intense fire sound with crackling
    createSound(150, 0.4, 'sawtooth');
    setTimeout(() => createSound(180, 0.3, 'sawtooth'), 100);
    setTimeout(() => createSound(120, 0.2, 'sawtooth'), 200);
  }, [createSound]);

  const playExplosion = useCallback(() => {
    // Standard explosion boom
    createSound(120, 0.5, 'sawtooth');
    setTimeout(() => createSound(80, 0.3, 'sawtooth'), 150);
  }, [createSound]);

  const playNapalmExplosion = useCallback(() => {
    // Intense fiery explosion
    createSound(100, 0.6, 'sawtooth');
    setTimeout(() => createSound(140, 0.4, 'sawtooth'), 100);
    setTimeout(() => createSound(90, 0.5, 'sawtooth'), 250);
  }, [createSound]);

  const playClusterExplosion = useCallback(() => {
    // Multiple small pops in sequence
    createSound(200, 0.1, 'square');
    setTimeout(() => createSound(180, 0.08, 'square'), 40);
    setTimeout(() => createSound(220, 0.09, 'square'), 80);
    setTimeout(() => createSound(160, 0.07, 'square'), 120);
    setTimeout(() => createSound(240, 0.08, 'square'), 160);
  }, [createSound]);

  return {
    playMove,
    playWin,
    playLose,
    playJoin,
    playMessage,
    playReaction,
    playTick,
    playCannonFire,
    playMissileLaunch,
    playPlasmaShot,
    playClusterBomb,
    playNapalmFire,
    playExplosion,
    playNapalmExplosion,
    playClusterExplosion
  };
};