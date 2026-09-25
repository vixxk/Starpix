import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

export const ResizeMode = {
  COVER: 'cover',
  CONTAIN: 'contain',
  STRETCH: 'fill',
};

export default function AppVideo({
  source,
  style,
  resizeMode = 'cover',
  shouldPlay = true,
  isLooping = true,
  isMuted = false,
  useNativeControls = false,
  onLoad,
  onReadyForDisplay,
  onError,
}) {
  const uri = typeof source === 'string' ? source : source?.uri;
  const initialUriRef = useRef(uri);

  const player = useVideoPlayer(uri || '', (p) => {
    p.loop = isLooping;
    p.muted = isMuted;
    if (shouldPlay && uri) {
      try {
        p.play();
      } catch (e) {}
    }
  });

  // Keep player properties synchronized
  useEffect(() => {
    if (!player) return;
    try {
      player.loop = isLooping;
    } catch (e) {}
  }, [player, isLooping]);

  useEffect(() => {
    if (!player) return;
    try {
      player.muted = isMuted;
    } catch (e) {}
  }, [player, isMuted]);

  // Update source if changed
  useEffect(() => {
    if (!player || !uri) return;
    if (initialUriRef.current !== uri) {
      initialUriRef.current = uri;
      try {
        player.replace(uri);
        if (shouldPlay) player.play();
      } catch (e) {}
    }
  }, [player, uri, shouldPlay]);

  // Handle play / pause state
  useEffect(() => {
    if (!player) return;
    try {
      if (shouldPlay && uri) {
        player.play();
      } else {
        player.pause();
      }
    } catch (e) {}
  }, [player, shouldPlay, uri]);

  // Listen for status changes & errors
  useEffect(() => {
    if (!player) return;
    const sub = player.addListener('statusChange', (payload) => {
      if (payload.status === 'readyToPlay') {
        if (onLoad) onLoad(payload);
        if (onReadyForDisplay) onReadyForDisplay(payload);
      } else if (payload.status === 'error') {
        if (onError) onError(payload.error);
      }
    });
    return () => {
      try {
        sub?.remove?.();
      } catch (e) {}
    };
  }, [player, onLoad, onReadyForDisplay, onError]);

  const contentFit =
    resizeMode === ResizeMode.CONTAIN || resizeMode === 'contain' ? 'contain' : 'cover';

  if (!uri) {
    return <View style={style} />;
  }

  return (
    <VideoView
      style={style}
      player={player}
      contentFit={contentFit}
      nativeControls={useNativeControls}
    />
  );
}

export const Video = AppVideo;
