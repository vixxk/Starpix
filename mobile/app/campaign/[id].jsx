import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppBackground from '../../src/components/AppBackground';
import PressableScale from '../../src/components/PressableScale';
import TemplateCard from '../../src/components/TemplateCard';
import SectionHeader from '../../src/components/SectionHeader';
import { COLORS, FONTS } from '../../src/constants/colors';
import { fontScale, wp, hp, SCREEN_PAD, GRID_GAP } from '../../src/utils/responsive';
import API from '../../src/utils/api';
import { useCreationStore } from '../../src/store/useCreationStore';

export default function CampaignScreen() {
  const { id } = useLocalSearchParams();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const setActiveTemplate = useCreationStore((state) => state.setActiveTemplate);

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const res = await API.get(`/campaigns/${id}`);
        if (res.data.success) setCampaign(res.data.data);
      } catch (err) {
        console.error(err);
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

  if (loading || !campaign) {
    return (
      <AppBackground>
        <SafeAreaView style={styles.center}>
          <Text style={styles.loadingText}>Loading special campaign…</Text>
        </SafeAreaView>
      </AppBackground>
    );
  }

  return (
    <AppBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <View style={styles.heroContainer}>
            <Image
              source={{ uri: campaign.heroBackground || campaign.heroImage }}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <View style={styles.heroOverlay} />

            <PressableScale onPress={() => router.replace('/(tabs)')} scaleTo={0.93} style={styles.closeBtn} contentStyle={styles.closeContent}>
              <Text style={styles.closeText}>Skip</Text>
              <Ionicons name="close" size={14} color={COLORS.white} />
            </PressableScale>

            <View style={styles.heroContent}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>SPECIAL FEATURED</Text>
              </View>
              <Text style={styles.title}>{campaign.name}</Text>
              {campaign.description ? <Text style={styles.description}>{campaign.description}</Text> : null}
            </View>
          </View>

          {/* Templates */}
          <SectionHeader title="Campaign Templates" subtitle="Personalize with your photo & name" />
          <View style={styles.gridContainer}>
            {campaign.featuredTemplates?.map((template) => (
              <TemplateCard
                key={template._id}
                template={template}
                onPress={() => handleTemplatePress(template)}
              />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.inkMuted,
    fontSize: fontScale(14),
    fontFamily: FONTS.medium,
  },
  scrollContent: {
    paddingBottom: hp(0.05),
  },
  heroContainer: {
    height: hp(0.4),
    width: '100%',
    position: 'relative',
    justifyContent: 'space-between',
    padding: wp(0.06),
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(28, 15, 5, 0.55)',
  },
  closeBtn: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(28, 15, 5, 0.45)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    zIndex: 10,
  },
  closeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  closeText: {
    color: COLORS.white,
    fontFamily: FONTS.semibold,
    fontSize: fontScale(11.5),
  },
  heroContent: {
    zIndex: 10,
    paddingBottom: hp(0.008),
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.orange,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 10,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: fontScale(9),
    fontFamily: FONTS.bold,
    letterSpacing: 0.6,
  },
  title: {
    color: COLORS.white,
    fontSize: fontScale(27),
    fontFamily: FONTS.extrabold,
    letterSpacing: -0.5,
  },
  description: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: fontScale(13),
    fontFamily: FONTS.medium,
    marginTop: 5,
    lineHeight: 19,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: SCREEN_PAD,
    rowGap: GRID_GAP,
  },
});
