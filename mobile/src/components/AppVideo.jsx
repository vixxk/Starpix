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
  const [isReady, setIsReady] = React.useState(false);
  const [hasFirstFrame, setHasFirstFrame] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  const player = useVideoPlayer(uri || '', (p) => {
    p.loop = isLooping;
    p.muted = isMuted;
    if (shouldPlay) {
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
      setIsReady(false);
      setHasFirstFrame(false);
      setHasError(false);
      try {
        player.replace(uri);
        if (shouldPlay) {
          player.play();
        }
      } catch (e) {}
    }
  }, [player, uri, shouldPlay]);

  // Handle play / pause state and loop enforcement
  useEffect(() => {
    if (!player) return;
    try {
      player.loop = isLooping;
      if (shouldPlay && uri) {
        player.play();
      } else if (!shouldPlay) {
        player.pause();
      }
    } catch (e) {}
  }, [player, shouldPlay, uri, isLooping]);

  // Robust loop handling: if video reaches the end before container duration, replay immediately
  useEffect(() => {
    if (!player) return;
    const endSub = player.addListener('playToEnd', () => {
      if (isLooping) {
        try {
          player.replay();
        } catch (e) {
          try {
            player.play();
          } catch (e2) {}
        }
      }
    });
    return () => {
      try {
        endSub?.remove?.();
      } catch (e) {}
    };
  }, [player, isLooping]);

  // Listen for status changes & errors
  useEffect(() => {
    if (!player) return;
    const sub = player.addListener('statusChange', (payload) => {
      if (payload.status === 'readyToPlay') {
        setIsReady(true);
        setHasError(false);
        try {
          player.loop = isLooping;
        } catch (e) {}
        if (shouldPlay) {
          try {
            player.play();
          } catch (e) {}
        }
        if (onLoad) onLoad(payload);
      } else if (payload.status === 'idle' && isLooping && shouldPlay) {
        try {
          player.replay();
        } catch (e) {}
      } else if (payload.status === 'error') {
        setIsReady(false);
        setHasFirstFrame(false);
        setHasError(true);
        console.log('[AppVideo] error playing video:', payload.error);
        if (onError) onError(payload.error);
      }
    });
    return () => {
      try {
        sub?.remove?.();
      } catch (e) {}
    };
  }, [player, shouldPlay, isLooping, onLoad, onError]);

  const contentFit =
    resizeMode === ResizeMode.CONTAIN || resizeMode === 'contain'
      ? 'contain'
      : resizeMode === ResizeMode.STRETCH || resizeMode === 'fill'
      ? 'fill'
      : 'cover';

  if (!uri || hasError) {
    return null;
  }

  // Use textureView on Android so VideoView integrates seamlessly into the view hierarchy
  // without punching black holes through views or overflowing rounded borders
  return (
    <VideoView
      style={style}
      player={player}
      contentFit={contentFit}
      surfaceType="textureView"
      nativeControls={useNativeControls}
      onFirstFrameRender={() => {
        setHasFirstFrame(true);
        if (onReadyForDisplay) onReadyForDisplay();
      }}
    />
  );
}

export const Video = AppVideo;
