import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import AppBackground from '../../src/components/AppBackground';
import PressableScale from '../../src/components/PressableScale';
import TemplateCard from '../../src/components/TemplateCard';
import SectionHeader from '../../src/components/SectionHeader';
import Skeleton from '../../src/components/Skeleton';
import { COLORS, FONTS } from '../../src/constants/colors';
import { fontScale, wp, hp, SCREEN_PAD, GRID_GAP } from '../../src/utils/responsive';
import API from '../../src/utils/api';
import { resolveMediaUrl } from '../../src/utils/media';
import { useCreationStore } from '../../src/store/useCreationStore';

export default function CampaignScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [heroImageError, setHeroImageError] = useState(false);

  const router = useRouter();
  const setActiveTemplate = useCreationStore((state) => state.setActiveTemplate);

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const res = await API.get(`/campaigns/${id}`);
        if (res.data.success) setCampaign(res.data.data);
      } catch (err) {
        console.error('Error fetching campaign:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCampaign();
  }, [id]);

  const handleTemplatePress = (template) => {
    setActiveTemplate(template);
    router.push(`/template/${template._id}`);
  };

  const heroUri = heroImageError
    ? resolveMediaUrl(null)
    : resolveMediaUrl(campaign?.heroBackground || campaign?.heroImage);

  if (loading || !campaign) {
    return (
      <AppBackground>
        <StatusBar style="dark" />
        <View style={[styles.safeArea, { paddingTop: Math.max(insets.top, 16) }]}>
          <View style={styles.skeletonContainer}>
            <Skeleton height={220} width="100%" borderRadius={24} />
            <View style={{ marginTop: 20, paddingHorizontal: SCREEN_PAD }}>
              <Skeleton height={24} width="70%" borderRadius={8} />
              <Skeleton height={14} width="90%" borderRadius={6} style={{ marginTop: 8 }} />
              <View style={{ marginTop: 24, marginBottom: 12 }}>
                <Skeleton height={20} width={140} borderRadius={6} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Skeleton height={wp(0.435) * 1.55} width={wp(0.435)} borderRadius={18} />
                <Skeleton height={wp(0.435) * 1.55} width={wp(0.435)} borderRadius={18} />
              </View>
            </View>
          </View>
        </View>
      </AppBackground>
    );
  }

  const templatesList = campaign.featuredTemplates || [];

  return (
    <AppBackground>
      <StatusBar style="light" />
      <View style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 24, 40) }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Dynamic Hero Banner */}
          <View style={styles.heroWrapper}>
            <Image
              source={{ uri: heroUri }}
              style={styles.heroImage}
              resizeMode="cover"
              onError={() => setHeroImageError(true)}
            />
            <View style={styles.heroOverlay} />

            {/* Header controls inside hero banner */}
            <View style={[styles.heroHeader, { paddingTop: Math.max(insets.top, 12) }]}>
              <PressableScale
                onPress={() => router.back()}
                scaleTo={0.9}
                style={styles.circleBtn}
                contentStyle={styles.centerContent}
              >
                <Ionicons name="chevron-back" size={20} color={COLORS.white} />
              </PressableScale>

              <PressableScale
                onPress={() => router.replace('/(tabs)')}
                scaleTo={0.92}
                style={styles.closeBtn}
                contentStyle={styles.closeContent}
              >
                <Text style={styles.closeText}>Skip</Text>
                <Ionicons name="close" size={14} color={COLORS.white} />
              </PressableScale>
            </View>

            {/* Hero Body Content */}
            <View style={styles.heroBody}>
              <View style={styles.badgeRow}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>⭐ SPECIAL FEATURED</Text>
                </View>
              </View>

              <Text style={styles.title}>{campaign.name}</Text>
              {campaign.description ? (
                <Text style={styles.description}>{campaign.description}</Text>
              ) : null}
            </View>
          </View>

          {/* Campaign Templates Section Header */}
          <SectionHeader
            title="Campaign Templates"
            subtitle="Personalize with your photo & text"
            style={styles.sectionHeader}
          />

          {/* Templates Grid */}
          {templatesList.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="sparkles-outline" size={36} color={COLORS.inkMuted} />
              <Text style={styles.emptyTitle}>No templates available</Text>
              <Text style={styles.emptySub}>Check back soon for new designs!</Text>
            </View>
          ) : (
            <View style={styles.gridContainer}>
              {templatesList.map((template) => (
                <TemplateCard
                  key={template._id}
                  template={template}
                  onPress={() => handleTemplatePress(template)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  skeletonContainer: {
    paddingHorizontal: SCREEN_PAD,
  },

  /* Hero Banner */
  heroWrapper: {
    width: '100%',
    minHeight: hp(0.36),
    position: 'relative',
    backgroundColor: '#1E1005',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#1E1005',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20, 10, 3, 0.65)',
  },

  /* Top Navigation Bar */
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(0.05),
    paddingBottom: 8,
    zIndex: 10,
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 16,
  },
  closeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  closeText: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: fontScale(11.5),
  },

  /* Hero Body */
  heroBody: {
    paddingHorizontal: wp(0.06),
    paddingTop: hp(0.02),
    paddingBottom: hp(0.035),
    zIndex: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.orange,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: fontScale(9),
    fontFamily: FONTS.bold,
    letterSpacing: 0.6,
  },
  title: {
    color: COLORS.white,
    fontSize: fontScale(24),
    fontFamily: FONTS.extrabold,
    letterSpacing: -0.4,
    lineHeight: fontScale(30),
  },
  description: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: fontScale(12.5),
    fontFamily: FONTS.medium,
    marginTop: 6,
    lineHeight: fontScale(18.5),
  },

  /* Section Header */
  sectionHeader: {
    marginTop: hp(0.02),
    marginBottom: hp(0.008),
  },

  /* Templates Grid */
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: SCREEN_PAD,
    rowGap: GRID_GAP,
    paddingBottom: hp(0.02),
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    color: COLORS.ink,
    fontSize: fontScale(15),
    fontFamily: FONTS.bold,
    marginTop: 10,
  },
  emptySub: {
    color: COLORS.inkMuted,
    fontSize: fontScale(12),
    fontFamily: FONTS.medium,
    marginTop: 2,
  },
});
