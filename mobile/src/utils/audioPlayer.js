import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

let audioModeConfigured = false;

export const configureAudioMode = async () => {
  if (audioModeConfigured) return;
  try {
    await setAudioModeAsync({
      playsInSilentModeIOS: true,
    });
    audioModeConfigured = true;
  } catch (e) {}
};

/**
 * Creates and plays an audio stream using expo-audio (SDK 57 compatible)
 * @param {string} audioUri - URI of the audio file
 * @param {object} options - Options including loop, initial volume
 * @returns {object|null} player instance
 */
export const startAudioPlayback = async (audioUri, { loop = true, volume = 1.0 } = {}) => {
  if (!audioUri) return null;
  try {
    await configureAudioMode();
    const player = createAudioPlayer(audioUri);
    if (!player) return null;
    player.loop = Boolean(loop);
    player.volume = typeof volume === 'number' ? volume : 1.0;
    player.play();
    return player;
  } catch (err) {
    console.warn('[AudioPlayer] Playback error:', err?.message || err);
    return null;
  }
};

/**
 * Stops and cleans up an expo-audio player instance
 * @param {object} player 
 */
export const stopAudioPlayback = (player) => {
  if (!player) return;
  try {
    player.pause();
    if (typeof player.remove === 'function') {
      player.remove();
    } else if (typeof player.release === 'function') {
      player.release();
    }
  } catch (e) {}
};
