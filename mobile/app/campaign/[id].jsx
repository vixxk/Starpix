import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, BackHandler } from 'react-native';
import { useLocalSearchParams, useRouter, usePathname } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import AppBackground from '../../src/components/AppBackground';
import PressableScale from '../../src/components/PressableScale';
import TemplateCard from '../../src/components/TemplateCard';
import Skeleton from '../../src/components/Skeleton';
import { COLORS, FONTS } from '../../src/constants/colors';
import { wp, SCREEN_PAD, GRID_GAP, CARD_WIDTH, SINGLE_CARD_SNAP_HEIGHT, SCREEN_DIMENSIONS } from '../../src/utils/responsive';
import { hapticTap } from '../../src/utils/haptics';
import API from '../../src/utils/api';
import { useCreationStore } from '../../src/store/useCreationStore';

export default function CampaignScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);

  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  const [disableHorizontalInterval, setDisableHorizontalInterval] = useState(true);
  const dragStartX = useRef(0);

  const router = useRouter();
  const pathname = usePathname();
  const isFocused = useIsFocused();

  // Intercept hardware back button on Android to return to Home ONLY when Campaign screen itself is focused
  useEffect(() => {
    const onBackPress = () => {
      if (!isFocused || pathname.includes('/template/') || pathname.includes('/preview/')) {
        return false; // Allow standard stack pop back to Campaign screen
      }
      router.replace('/(tabs)');
      return true;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [router, isFocused, pathname]);

  const handleScrollBeginDrag = (e) => {
    dragStartX.current = e.nativeEvent.contentOffset.x;
  };

  const CAMPAIGN_CARD_WIDTH = wp(0.89);
  const sidePadding = wp(0.04);

  const handleScroll = (e) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (CAMPAIGN_CARD_WIDTH + GRID_GAP));
    if (index !== activeIndexRef.current && index >= 0) {
      activeIndexRef.current = index;
      setActiveIndex(index);
      hapticTap();
    }

    if (offsetX > dragStartX.current + 4) {
      if (!disableHorizontalInterval) setDisableHorizontalInterval(true);
    } else if (offsetX < dragStartX.current - 4) {
      if (disableHorizontalInterval) setDisableHorizontalInterval(false);
    }
  };

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

  const handleGoBackToMain = () => {
    router.replace('/(tabs)');
  };

  if (loading || !campaign) {
    return (
      <AppBackground>
        <StatusBar style="dark" />
        <View style={[styles.safeArea, { paddingTop: Math.max(insets.top, 16) }]}>
          <View style={styles.skeletonContainer}>
            <Skeleton height={38} width={38} borderRadius={19} />
            <View style={{ marginTop: 24, flexDirection: 'row', justifyContent: 'space-between' }}>
              <Skeleton height={wp(0.435) * 1.55} width={wp(0.435)} borderRadius={18} />
              <Skeleton height={wp(0.435) * 1.55} width={wp(0.435)} borderRadius={18} />
            </View>
          </View>
        </View>
      </AppBackground>
    );
  }

  const templatesList = campaign?.featuredTemplates || [];
  const coverBg = campaign?.heroBackground || campaign?.heroImage;

  return (
    <AppBackground bgImage={coverBg}>
      <StatusBar style={coverBg ? 'light' : 'dark'} />
      <View style={[styles.safeArea, { paddingTop: Math.max(insets.top, 12) }]}>
        {/* Top Header: Back Button */}
        <View style={styles.headerBar}>
          <PressableScale
            onPress={handleGoBackToMain}
            scaleTo={0.9}
            style={styles.circleBtn}
            contentStyle={styles.centerContent}
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.ink} />
          </PressableScale>
        </View>

        {templatesList.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="sparkles-outline" size={36} color={coverBg ? COLORS.white : COLORS.inkMuted} />
            <Text style={[styles.emptyTitle, coverBg && { color: COLORS.white }]}>No campaign templates available</Text>
            <Text style={[styles.emptySub, coverBg && { color: COLORS.white }]}>Check back soon for new designs!</Text>
          </View>
        ) : (
          <View style={styles.centeredCardContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.horizontalScrollContent, { paddingHorizontal: sidePadding }]}
              snapToInterval={CAMPAIGN_CARD_WIDTH + GRID_GAP}
              snapToAlignment="start"
              decelerationRate="fast"
              disableIntervalMomentum={disableHorizontalInterval}
              onScrollBeginDrag={handleScrollBeginDrag}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            >
              {templatesList.map((template, idx) => (
                <TemplateCard
                  key={template._id}
                  template={template}
                  width={CAMPAIGN_CARD_WIDTH}
                  actionWidth={CARD_WIDTH}
                  shouldPlay={idx === activeIndex}
                  onPress={() => handleTemplatePress(template)}
                />
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  skeletonContainer: {
    paddingHorizontal: SCREEN_PAD,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: SCREEN_PAD,
    paddingBottom: 8,
    gap: 12,
  },
  headerTitle: {
    color: COLORS.ink,
    fontSize: 17,
    fontFamily: FONTS.bold,
    flex: 1,
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredCardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  horizontalScrollContent: {
    alignItems: 'center',
    gap: GRID_GAP,
    paddingVertical: 12,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    color: COLORS.ink,
    fontSize: 15,
    fontFamily: FONTS.bold,
    marginTop: 10,
  },
  emptySub: {
    color: COLORS.inkMuted,
    fontSize: 12,
    fontFamily: FONTS.medium,
    marginTop: 2,
  },
});
