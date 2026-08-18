import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import AppBackground from '../../src/components/AppBackground';
import PressableScale from '../../src/components/PressableScale';
import TemplateCard from '../../src/components/TemplateCard';
import Skeleton from '../../src/components/Skeleton';
import { COLORS, FONTS } from '../../src/constants/colors';
import { wp, SCREEN_PAD, GRID_GAP, CARD_WIDTH, SINGLE_CARD_SNAP_HEIGHT } from '../../src/utils/responsive';
import { useRef } from 'react';
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

  const handleScrollBeginDrag = (e) => {
    dragStartX.current = e.nativeEvent.contentOffset.x;
  };

  const handleScroll = (e) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (CARD_WIDTH + GRID_GAP));
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

  const handleGoBackToMain = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
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

  const templatesList = campaign.featuredTemplates || [];

  return (
    <AppBackground>
      <StatusBar style="dark" />
      <View style={[styles.safeArea, { paddingTop: Math.max(insets.top, 12) }]}>
        {/* Top Header: Back Button + Campaign Name */}
        <View style={styles.headerBar}>
          <PressableScale
            onPress={handleGoBackToMain}
            scaleTo={0.9}
            style={styles.circleBtn}
            contentStyle={styles.centerContent}
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.ink} />
          </PressableScale>
          {campaign.name ? (
            <Text numberOfLines={1} style={styles.headerTitle}>
              {campaign.name}
            </Text>
          ) : null}
        </View>

        {templatesList.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="sparkles-outline" size={36} color={COLORS.inkMuted} />
            <Text style={styles.emptyTitle}>No campaign templates available</Text>
            <Text style={styles.emptySub}>Check back soon for new designs!</Text>
          </View>
        ) : (
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollContent}
              snapToInterval={CARD_WIDTH + GRID_GAP}
              snapToAlignment="center"
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
                  width={CARD_WIDTH}
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
    justify: 'flex-start',
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
  horizontalScrollContent: {
    paddingHorizontal: SCREEN_PAD,
    gap: GRID_GAP,
    alignItems: 'center',
    paddingVertical: 12,
  },
  emptyWrap: {
    alignItems: 'center',
    justify: 'center',
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
