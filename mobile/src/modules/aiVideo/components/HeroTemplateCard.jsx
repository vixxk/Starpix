import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
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

  const hasAllUserFaces = Array.from({ length: requiredPhotosCount }).every((_, i) => Boolean(userFaces[i]));
  const hasAnyUserFace = Boolean(userFaces[0] || userFaces[1]);

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
              return (
                <TouchableOpacity
                  key={idx}
                  style={styles.beforePhotoWrap}
                  onPress={() => handlePickFaceImage(idx)}
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
                      <Ionicons name="person" size={fontScale(24)} color="#9CA3AF" />
                    </View>
                  )}
                  {isUserUploaded ? (
                    <TouchableOpacity
                      style={styles.removeFaceBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleRemoveFace(idx);
                      }}
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

          {/* Curved Arrow pointer */}
          <View style={styles.curvedArrowWrap}>
            <Svg width={wp(0.06)} height={hp(0.035)} viewBox="0 0 24 24">
              <Path
                d="M 4 2 Q 4 16 16 16 L 16 19 L 21 14 L 16 9 L 16 12 Q 7 12 7 2 Z"
                fill="#EE1D24"
              />
            </Svg>
          </View>
        </View>

        {/* Upload Your Photo(s) Card */}
        <TouchableOpacity
          style={[
            styles.uploadCard,
            hasAnyUserFace && styles.uploadCardActive,
          ]}
          onPress={handleUploadCardPress}
          activeOpacity={0.8}
        >
          <View style={[styles.uploadIconBadge, hasAnyUserFace && styles.uploadIconBadgeActive]}>
            <MaterialCommunityIcons
              name={hasAllUserFaces ? 'check-decagram' : 'account-plus-outline'}
              size={fontScale(22)}
              color={hasAllUserFaces ? '#16A34A' : '#EE1D24'}
            />
          </View>
          <Text style={styles.uploadTitle} numberOfLines={1}>
            {hasAllUserFaces
              ? (requiredPhotosCount > 1 ? (t('change_photos') || t('change_photo_gallery')) : (t('change_photo') || t('change_photo_gallery')))
              : (requiredPhotosCount > 1 ? t('upload_your_photos') : t('upload_your_photo'))}
          </Text>
          <Text style={styles.uploadSubtitle} numberOfLines={1}>
            {hasAllUserFaces
              ? (t('photo_ready') || 'Tap to change photo')
              : (requiredPhotosCount > 1 ? t('add_1_or_2_photos') : t('add_1_photo'))}
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
              name={isCurrentVideo ? 'videocam' : 'image'}
              size={fontScale(12)}
              color="#EE1D24"
              style={{ marginRight: wp(0.01) }}
            />
            <Text style={styles.mediaTypeBadgeText}>
              {isCurrentVideo ? 'Video' : 'Image'}
            </Text>
          </View>
        </View>

        {/* Main Media Preview */}
        <View style={styles.mediaContainer}>
          {generatedResult?.resultUrl ? (
            isCurrentVideo ? (
              <AppVideo
                source={{ uri: resolveMediaUrl(generatedResult.resultUrl) }}
                style={styles.mainMedia}
                resizeMode={ResizeMode.COVER}
                shouldPlay
                isLooping
              />
            ) : (
              <Image
                source={{ uri: resolveMediaUrl(generatedResult.resultUrl) }}
                style={styles.mainMedia}
                resizeMode="cover"
              />
            )
          ) : (
            <View style={styles.mediaPreviewWrap}>
              <Image
                source={{
                  uri: resolveMediaUrl(
                    selectedTemplate.videoUrl || selectedTemplate.thumbnailUrl
                  ),
                }}
                style={styles.mainMedia}
                resizeMode="cover"
              />
              {isCurrentVideo && (
                <View style={styles.playButtonOverlay}>
                  <View style={styles.playButtonCircle}>
                    <Ionicons
                      name="play"
                      size={fontScale(24)}
                      color="#FFFFFF"
                      style={{ marginLeft: wp(0.01) }}
                    />
                  </View>
                </View>
              )}
              {isCurrentVideo && (
                <View style={styles.durationBadge}>
                  <Text style={styles.durationText}>
                    {`00:${selectedTemplate.durationSeconds || 15}`}
                  </Text>
                </View>
              )}
            </View>
          )}

          {generating && (
            <View style={styles.generatingOverlay}>
              <ActivityIndicator size="large" color="#EE1D24" />
              <Text style={styles.generatingText}>Generating AI Magic...</Text>
            </View>
          )}
        </View>

        {/* Info Row: Title & Credits */}
        <View style={styles.cardInfoRow}>
          <Text style={styles.templateTitle} numberOfLines={1}>
            {selectedTemplate.title}
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
                {requiredPhotosCount > 1
                  ? t('upload_2_photos')
                  : t('upload_1_photo')}
              </Text>
            </View>
            <Text style={styles.creditText}>
              {t('required_credit', { credit: selectedTemplate.creditsRequired || 25 })}
            </Text>
          </View>
        </View>

        {/* Dynamic Action Button or Result Actions if generated */}
        {generatedResult ? (
          <View style={styles.resultActionsRow}>
            <TouchableOpacity
              style={[styles.resultActionBtn, styles.downloadBtn]}
              onPress={handleDownloadResult}
              disabled={downloading}
              activeOpacity={0.85}
            >
              {downloading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="download-outline" size={fontScale(16)} color="#FFFFFF" />
                  <Text style={styles.resultActionBtnText}>{t('download') || 'Download'}</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.resultActionBtn, styles.shareBtn]}
              onPress={handleShareResult}
              disabled={sharing}
              activeOpacity={0.85}
            >
              {sharing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="share-social-outline" size={fontScale(16)} color="#FFFFFF" />
                  <Text style={styles.resultActionBtnText}>{t('share') || 'Share'}</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.resultActionBtn, styles.createAgainBtn]}
              onPress={handleTriggerCreate}
              disabled={generating}
              activeOpacity={0.85}
            >
              <Ionicons name="refresh" size={fontScale(16)} color="#EE1D24" />
              <Text style={styles.createAgainBtnText}>{t('create_again') || 'Create Again'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleTriggerCreate}
            disabled={generating}
            activeOpacity={0.88}
          >
            <MaterialCommunityIcons
              name="star-four-points"
              size={fontScale(18)}
              color="#FFFFFF"
              style={{ marginRight: wp(0.015) }}
            />
            <Text style={styles.createButtonText}>
              {isCurrentVideo ? t('create_video') : t('create_image')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
