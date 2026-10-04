import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import AppVideo, { ResizeMode } from '../../../components/AppVideo';
import Skeleton from '../../../components/Skeleton';
import { fontScale, wp, hp } from '../../../utils/responsive';
import { resolveMediaUrl } from '../../../utils/media';
import { styles } from '../styles';

export default function HeroTemplateCard({
  loading,
  selectedTemplate,
  requiredPhotosCount,
  userFaces,
  getSlotImageUri,
  handlePickFaceImage,
  handleRemoveFace,
  handleUploadCardPress,
  isCurrentVideo,
  generatedResult,
  generating,
  downloading,
  sharing,
  handleDownloadResult,
  handleShareResult,
  handleTriggerCreate,
  t,
}) {
  const [resultMediaLoading, setResultMediaLoading] = React.useState(true);
  const [loadingStage, setLoadingStage] = React.useState(0);
  const [isMuted, setIsMuted] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(true);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const progressAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    setIsPlaying(true);
  }, [selectedTemplate?._id, selectedTemplate?.videoUrl]);

  React.useEffect(() => {
    if (!generating) {
      setLoadingStage(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingStage((prev) => (prev + 1) % 4);
    }, 4500);
    return () => clearInterval(interval);
  }, [generating]);

  React.useEffect(() => {
    if (generatedResult?.resultUrl) {
      setResultMediaLoading(true);
      const timer = setTimeout(() => {
        setResultMediaLoading(false);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [generatedResult?.resultUrl]);

  const hasAllUserFaces = Array.from({ length: requiredPhotosCount }).every((_, i) => Boolean(userFaces[i]));
  const hasAnyUserFace = Boolean(userFaces[0] || userFaces[1]);
  const isPhotoUploadedWaiting = hasAnyUserFace && !generatedResult?.resultUrl;
  const showLoadingOverlay = generating || (resultMediaLoading && Boolean(generatedResult?.resultUrl)) || isPhotoUploadedWaiting;

  // Pulse & Progress Bar Animations for generating / media buffering / photo uploaded states
  React.useEffect(() => {
    const isBufferingOrGenerating = showLoadingOverlay;
    if (isBufferingOrGenerating) {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1100,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1100,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

      const progressLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(progressAnim, {
            toValue: 1,
            duration: 2200,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: false,
          }),
          Animated.timing(progressAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: false,
          }),
        ])
      );

      pulseLoop.start();
      progressLoop.start();

      return () => {
        pulseLoop.stop();
        progressLoop.stop();
      };
    }
  }, [generating, resultMediaLoading, generatedResult?.resultUrl, showLoadingOverlay]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: ['15%', '72%', '100%'],
  });

  const stageMessages = [
    t('generating_ai_magic') || 'Generating AI Magic...',
    t('generating_content_title') || 'Processing Face Features...',
    t('generating_content_sub') || 'Generating in background (~15-30s)...',
    t('please_wait_moment') || 'Please wait a moment (~15-30s)...',
  ];

  if (loading) {
    return (
      <View style={styles.heroCard}>
        <View style={styles.beforeRow}>
          <View style={styles.beforeContainer}>
            <Skeleton
              width={wp(0.14)}
              height={hp(0.018)}
              borderRadius={wp(0.015)}
              style={{ position: 'absolute', top: hp(0.006), left: wp(0.018) }}
            />
            <View style={[styles.beforePhotosRow, { marginTop: hp(0.018) }]}>
              <Skeleton width={wp(0.18)} height={wp(0.18)} borderRadius={wp(0.02)} />
              <Skeleton width={wp(0.18)} height={wp(0.18)} borderRadius={wp(0.02)} />
            </View>
          </View>

          <View style={[styles.uploadCard, { borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }]}>
            <Skeleton width={wp(0.1)} height={wp(0.1)} borderRadius={wp(0.05)} style={{ marginBottom: 8 }} />
            <Skeleton width="80%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
            <Skeleton width="60%" height={10} borderRadius={3} />
          </View>
        </View>

        <View style={styles.afterCard}>
          <View style={styles.afterTopRow}>
            <Skeleton width={wp(0.14)} height={hp(0.022)} borderRadius={wp(0.015)} />
            <Skeleton width={wp(0.16)} height={hp(0.022)} borderRadius={wp(0.015)} />
          </View>

          <View style={styles.mediaContainer}>
            <Skeleton width="100%" height={hp(0.42)} borderRadius={wp(0.03)} />
          </View>

          <View style={styles.cardInfoRow}>
            <View style={{ flex: 1, gap: 6 }}>
              <Skeleton width="65%" height={16} borderRadius={4} />
              <Skeleton width="35%" height={12} borderRadius={3} />
            </View>
            <Skeleton width={wp(0.24)} height={hp(0.022)} borderRadius={wp(0.015)} />
          </View>

          <Skeleton width="100%" height={hp(0.052)} borderRadius={wp(0.065)} style={{ marginTop: hp(0.015) }} />
        </View>
      </View>
    );
  }

  if (!selectedTemplate) return null;

  const cleanText = (val, fallback) => {
    if (!val || typeof val !== 'string') return fallback || '';
    if (val.includes('_')) return fallback || val.replace(/_/g, ' ');
    return val;
  };

  const isMulti = requiredPhotosCount > 1;
  const uploadedCount = userFaces.filter(Boolean).length;

  let uploadTitle = '';
  let uploadSubtitle = '';

  if (hasAllUserFaces) {
    uploadTitle = isMulti
      ? cleanText(t('all_photos_ready'), 'Photos Ready')
      : cleanText(t('photo_ready'), 'Photo Ready');
    uploadSubtitle = cleanText(t('tap_to_change_photo'), 'Tap to change photo');
  } else if (hasAnyUserFace && isMulti) {
    uploadTitle = cleanText(t('add_second_photo'), 'Add 2nd Photo');
    uploadSubtitle = `${uploadedCount}/${requiredPhotosCount} ${cleanText(t('all_photos_ready'), 'photos added')}`;
  } else {
    uploadTitle = isMulti
      ? cleanText(t('upload_2_photos'), 'Upload 2 Photos')
      : cleanText(t('upload_1_photo'), 'Upload 1 Photo');
    uploadSubtitle = isMulti
      ? cleanText(t('add_1_or_2_photos'), 'Add 2 face photos')
      : cleanText(t('add_1_photo'), 'Add 1 face photo');
  }

  const isResultVideo = generatedResult?.mediaType
    ? generatedResult.mediaType === 'video'
    : Boolean(
        generatedResult?.resultUrl &&
        generatedResult.resultUrl.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i) &&
        !generatedResult.resultUrl.match(/\.(jpg|jpeg|png|webp)(\?.*)?$/i)
      );
  const isVideoAsset =
    (selectedTemplate?.mediaType || 'video') === 'video' ||
    Boolean(
      selectedTemplate?.videoUrl &&
      selectedTemplate.videoUrl.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i)
    );
  const showVideoPlayer = generatedResult?.resultUrl ? isResultVideo : isVideoAsset;

  return (
    <View style={styles.heroCard}>
      {/* Top Before & Upload Cards Row */}
      <View style={styles.beforeRow}>
        {/* Before Slot Card */}
        <View style={styles.beforeContainer}>
          <View style={styles.beforeBadge}>
            <Text style={styles.beforeBadgeText}>{t('before')}</Text>
          </View>

          {/* Multiple / Single Face Photos */}
          <View style={styles.beforePhotosRow}>
            {Array.from({ length: requiredPhotosCount }).map((_, idx) => {
              const uri = getSlotImageUri(selectedTemplate, idx);
              const isUserUploaded = Boolean(userFaces[idx]);
              const slotLabel = isMulti
                ? (idx === 0 ? cleanText(t('face_slot_1'), 'Face 1') : cleanText(t('face_slot_2'), 'Face 2'))
                : cleanText(t('before'), 'Your Face');

              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.beforePhotoWrap,
                    isMulti && { width: wp(0.20), height: wp(0.20) },
                  ]}
                  onPress={() => handlePickFaceImage(idx)}
                  disabled={generating}
                  activeOpacity={0.85}
                >
                  {uri ? (
                    <Image
                      source={{ uri }}
                      style={styles.beforePhotoImg}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.emptyBeforePhoto}>
                      <Ionicons name="person" size={fontScale(22)} color="#9CA3AF" />
                    </View>
                  )}

                  {/* Slot Number/Tag only when empty */}
                  {!isUserUploaded && (
                    <View style={styles.slotTag}>
                      <Text style={styles.slotTagText}>{slotLabel}</Text>
                    </View>
                  )}

                  {isUserUploaded ? (
                    <TouchableOpacity
                      style={styles.removeFaceBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleRemoveFace(idx);
                      }}
                      disabled={generating}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close" size={fontScale(11)} color="#FFFFFF" />
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.addFaceBadge}>
                      <Ionicons name="camera" size={fontScale(9)} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Transformation Curved Arrow Connector from Before Box to After */}
          <View style={styles.arrowConnectorWrap} pointerEvents="none">
            <Svg width={22} height={26} viewBox="0 0 22 26" fill="none">
              <Path
                d="M 2 2 C 7 3, 11 9, 11 17"
                stroke="#E11D48"
                strokeWidth="2.6"
                strokeLinecap="round"
              />
              <Path
                d="M 5.5 15 L 11 23 L 16.5 15"
                stroke="#E11D48"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
        </View>

        {/* Upload Your Photo(s) Card */}
        <TouchableOpacity
          style={[
            styles.uploadCard,
            hasAllUserFaces && styles.uploadCardActive,
            (!hasAllUserFaces && hasAnyUserFace) && styles.uploadCardHalfActive,
          ]}
          onPress={handleUploadCardPress}
          disabled={generating}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.uploadIconBadge,
              hasAllUserFaces && styles.uploadIconBadgeActive,
              (!hasAllUserFaces && hasAnyUserFace) && styles.uploadIconBadgeHalfActive,
            ]}
          >
            <MaterialCommunityIcons
              name={
                hasAllUserFaces
                  ? 'check-decagram'
                  : hasAnyUserFace
                  ? 'account-plus'
                  : isMulti
                  ? 'account-multiple-plus-outline'
                  : 'account-plus-outline'
              }
              size={fontScale(22)}
              color={hasAllUserFaces ? '#16A34A' : hasAnyUserFace ? '#F59E0B' : '#EE1D24'}
            />
          </View>
          <Text style={styles.uploadTitle} numberOfLines={1}>
            {uploadTitle}
          </Text>
          <Text style={styles.uploadSubtitle} numberOfLines={1}>
            {uploadSubtitle}
          </Text>
        </TouchableOpacity>
      </View>

      {/* After Result / Preview Media Card */}
      <View style={styles.afterCard}>
        <View style={styles.afterTopRow}>
          <View style={styles.afterBadge}>
            <Text style={styles.afterBadgeText}>{t('after')}</Text>
          </View>

          <View style={styles.mediaTypeBadge}>
            <Ionicons
              name={showVideoPlayer ? 'videocam' : 'image'}
              size={fontScale(12)}
              color="#EE1D24"
              style={{ marginRight: wp(0.01) }}
            />
            <Text style={styles.mediaTypeBadgeText}>
              {showVideoPlayer ? (t('media_video') || 'Video') : (t('media_image') || 'Image')}
            </Text>
          </View>
        </View>

        {/* Main Media Preview */}
        <View style={styles.mediaContainer}>
          {showVideoPlayer ? (
            <View style={styles.mediaPreviewWrap}>
              <AppVideo
                source={{
                  uri: resolveMediaUrl(
                    generatedResult?.resultUrl || selectedTemplate.videoUrl
                  ),
                }}
                style={styles.mainMedia}
                resizeMode={ResizeMode.COVER}
                shouldPlay={isPlaying}
                isLooping
                isMuted={isMuted}
                onReadyForDisplay={() => setResultMediaLoading(false)}
                onLoad={() => setResultMediaLoading(false)}
                onError={() => setResultMediaLoading(false)}
              />

              {/* Sound Toggle Button (Sound On / Sound Off) */}
              <TouchableOpacity
                onPress={() => setIsMuted((m) => !m)}
                style={styles.soundBadgeContainer}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isMuted ? 'volume-mute' : 'volume-high'}
                  size={fontScale(13)}
                  color="#FFFFFF"
                />
                <Text style={styles.soundBadgeText}>
                  {isMuted ? t('sound_off') : t('sound_on')}
                </Text>
              </TouchableOpacity>

              {/* Tap anywhere on video to toggle play/pause */}
              <TouchableOpacity
                style={StyleSheet.absoluteFill}
                onPress={() => setIsPlaying((p) => !p)}
                activeOpacity={1}
              />

              {/* Play/Pause Button in the Mid of the Template */}
              <View style={styles.playButtonOverlay} pointerEvents="box-none">
                <TouchableOpacity
                  style={[
                    styles.playButtonCircle,
                    isPlaying && styles.playButtonCirclePlaying,
                  ]}
                  onPress={() => setIsPlaying((p) => !p)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={isPlaying ? 'pause' : 'play'}
                    size={fontScale(22)}
                    color="#FFFFFF"
                    style={!isPlaying ? { marginLeft: wp(0.01) } : {}}
                  />
                </TouchableOpacity>
              </View>

              {selectedTemplate?.durationSeconds ? (
                <View style={styles.durationBadge} pointerEvents="none">
                  <Text style={styles.durationText}>
                    {`00:${String(selectedTemplate.durationSeconds).padStart(2, '0')}`}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : (
            <Image
              source={{
                uri: resolveMediaUrl(
                  generatedResult?.resultUrl ||
                  selectedTemplate.thumbnailUrl ||
                  selectedTemplate.videoUrl
                ),
              }}
              style={styles.mainMedia}
              resizeMode="cover"
              onLoadStart={() => setResultMediaLoading(true)}
              onLoadEnd={() => setResultMediaLoading(false)}
              onError={() => setResultMediaLoading(false)}
            />
          )}

          {/* Premium Animated AI Loading Screen for Generating, Buffering, or Photo Uploaded */}
          {showLoadingOverlay && (
            <View style={styles.loadingOverlayContainer}>
              {/* Ambient Blurred Background (Prevents ugly black box) */}
              <Image
                source={{
                  uri: resolveMediaUrl(
                    userFaces[0] ||
                    selectedTemplate.thumbnailUrl ||
                    (selectedTemplate.mediaType === 'image' ? selectedTemplate.videoUrl : '')
                  ),
                }}
                style={styles.loadingBlurredBackdrop}
                blurRadius={20}
                resizeMode="cover"
              />
              <View style={styles.loadingDimmerOverlay} />

              {/* Glowing Status Pill */}
              <View style={styles.loadingTopBadge}>
                <MaterialCommunityIcons name="star-four-points" size={fontScale(10)} color="#F59E0B" />
                <Text style={styles.loadingTopBadgeText}>
                  {generating
                    ? (t('ai_rendering_badge') || 'AI RENDERING')
                    : isPhotoUploadedWaiting
                    ? (t('ai_ready_badge') || 'AI READY')
                    : (t('ai_rendering_badge') || 'AI RENDERING')}
                </Text>
              </View>

              {/* Central Pulsing Emblem */}
              <Animated.View
                style={[
                  styles.loadingPulseOuterRing,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <View style={styles.loadingPulseInnerBadge}>
                  <MaterialCommunityIcons
                    name={isCurrentVideo ? 'movie-filter-outline' : 'image-filter-vintage'}
                    size={fontScale(24)}
                    color="#FFFFFF"
                  />
                </View>
              </Animated.View>

              {/* Spinner */}
              <ActivityIndicator size="small" color="#F59E0B" style={styles.loadingSpinner} />

              {/* Dynamic Stage Copy */}
              <Text style={styles.loadingPrimaryTitle} numberOfLines={1}>
                {generating
                  ? (stageMessages[loadingStage] || stageMessages[0])
                  : isPhotoUploadedWaiting
                  ? (hasAllUserFaces ? (t('photo_uploaded_ready') || 'Photos Ready') : (t('add_second_photo') || 'Add 2nd Photo'))
                  : (t('finalizing_ai_creation') || 'Finalizing AI Creation...')}
              </Text>
              <Text style={styles.loadingSecondarySubtitle} numberOfLines={2}>
                {generating
                  ? (t('please_wait_moment') || 'Please wait a moment (~15-30s)...')
                  : isPhotoUploadedWaiting
                  ? (hasAllUserFaces ? (t('tap_create_to_start') || 'Tap Create below to generate your AI magic') : (t('add_1_or_2_photos') || 'Add face photo to start'))
                  : (t('preparing_media_preview') || 'Preparing high quality preview...')}
              </Text>

              {/* Glowing Animated Progress Bar */}
              <View style={styles.loadingProgressTrack}>
                <Animated.View style={[styles.loadingProgressFill, { width: progressWidth }]} />
              </View>
            </View>
          )}
        </View>

        {/* Info Row: Title & Credits */}
        <View style={styles.cardInfoRow}>
          <Text style={styles.templateTitle} numberOfLines={1}>
            {cleanText(selectedTemplate.title)}
          </Text>

          <View style={styles.templateDetailsRight}>
            <View style={styles.uploadCountRow}>
              <Ionicons
                name={requiredPhotosCount > 1 ? 'people' : 'person'}
                size={fontScale(12)}
                color="#EE1D24"
                style={{ marginRight: wp(0.01) }}
              />
              <Text style={styles.uploadCountText}>
                {cleanText(
                  requiredPhotosCount > 1
                    ? t('upload_2_photos')
                    : t('upload_1_photo')
                )}
              </Text>
            </View>
            <Text style={styles.creditText}>
              {cleanText(t('required_credit', { credit: selectedTemplate.creditsRequired || 25 }))}
            </Text>
          </View>
        </View>

        {/* Dynamic Action Button or Result Actions if generated */}
        {generatedResult ? (
          <View style={styles.resultActionsRow}>
            <TouchableOpacity
              style={[
                styles.resultActionBtn,
                styles.downloadBtn,
                resultMediaLoading && styles.resultActionBtnDisabled,
              ]}
              onPress={handleDownloadResult}
              disabled={downloading || resultMediaLoading}
              activeOpacity={0.85}
            >
              {downloading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="download-outline" size={fontScale(14)} color="#FFFFFF" />
                  <Text style={styles.resultActionBtnText} numberOfLines={1} adjustsFontSizeToFit>
                    {cleanText(t('download'), 'Download')}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.resultActionBtn,
                styles.shareBtn,
                resultMediaLoading && styles.resultActionBtnDisabled,
              ]}
              onPress={handleShareResult}
              disabled={sharing || resultMediaLoading}
              activeOpacity={0.85}
            >
              {sharing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="share-social-outline" size={fontScale(14)} color="#FFFFFF" />
                  <Text style={styles.resultActionBtnText} numberOfLines={1} adjustsFontSizeToFit>
                    {cleanText(t('share'), 'Share')}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.resultActionBtn,
                styles.createAgainBtn,
                resultMediaLoading && styles.resultActionBtnDisabled,
              ]}
              onPress={handleTriggerCreate}
              disabled={generating || resultMediaLoading}
              activeOpacity={0.85}
            >
              <Ionicons name="refresh" size={fontScale(14)} color="#EE1D24" />
              <Text style={styles.createAgainBtnText} numberOfLines={1} adjustsFontSizeToFit>
                {cleanText(t('create_again'), 'Create Again')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.createButton, generating && styles.createButtonDisabled]}
            onPress={handleTriggerCreate}
            disabled={generating}
            activeOpacity={0.88}
          >
            {generating ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: wp(0.02) }} />
                <Text style={styles.createButtonText}>
                  {t('generating_video') || (isCurrentVideo ? 'Generating AI Video...' : 'Generating AI Photo...')}
                </Text>
              </>
            ) : (
              <>
                <MaterialCommunityIcons
                  name="star-four-points"
                  size={fontScale(18)}
                  color="#FFFFFF"
                  style={{ marginRight: wp(0.015) }}
                />
                <Text style={styles.createButtonText}>
                  {isCurrentVideo ? t('create_video') : t('create_image')}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
