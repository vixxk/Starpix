import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppBackground from '../../src/components/AppBackground';
import TemplateCard from '../../src/components/TemplateCard';
import SectionHeader from '../../src/components/SectionHeader';
import Skeleton from '../../src/components/Skeleton';
import AppRefreshControl from '../../src/components/AppRefreshControl';
import { COLORS, FONTS } from '../../src/constants/colors';
import { fontScale, wp, hp, SCREEN_PAD, GRID_GAP, SPACING, SINGLE_CARD_SNAP_HEIGHT, CARD_WIDTH, CARD_HEIGHT } from '../../src/utils/responsive';
import API from '../../src/utils/api';
import { useCreationStore } from '../../src/store/useCreationStore';
import { useRef } from 'react';
import { hapticTap } from '../../src/utils/haptics';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { useTranslation } from 'react-i18next';

export default function TrendingScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const activeIndexRef = useRef(0);
  const [disableVerticalInterval, setDisableVerticalInterval] = useState(true);
  const dragStartY = useRef(0);

  const handleScrollBeginDrag = (e) => {
    dragStartY.current = e.nativeEvent.contentOffset.y;
  };

  const handleScroll = (e) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / SINGLE_CARD_SNAP_HEIGHT);
    if (index !== activeIndexRef.current && index >= 0) {
      activeIndexRef.current = index;
      hapticTap();
    }

    if (offsetY > dragStartY.current + 4) {
      if (!disableVerticalInterval) setDisableVerticalInterval(true);
    } else if (offsetY < dragStartY.current - 4) {
      if (disableVerticalInterval) setDisableVerticalInterval(false);
    }
  };
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const router = useRouter();
  const setActiveTemplate = useCreationStore((state) => state.setActiveTemplate);

  const fetchTrending = useCallback(async () => {
    try {
      const res = await API.get('/templates/trending');
      if (res.data.success) setTrending(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTrending();
  }, [fetchTrending]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTrending();
  }, [fetchTrending]);

  const handleTemplatePress = (template) => {
    setActiveTemplate(template);
    router.push(`/template/${template._id}`);
  };

  return (
    <AppBackground>
      <StatusBar style="dark" />
      <View style={[styles.safeArea, { paddingTop: Math.max(insets.top, 12) }]}>
        <SectionHeader
          icon="🔥"
          title={t('trending_today')}
          subtitle={t('trending_subtitle')}
          style={styles.pageHeader}
        />

        {loading && !refreshing ? (
          <View style={{ alignSelf: 'center', alignItems: 'center', paddingVertical: 12 }}>
            <Skeleton height={CARD_HEIGHT} width={CARD_WIDTH} borderRadius={0} />
            <View style={{ flexDirection: 'row', width: CARD_WIDTH, justifyContent: 'space-between', marginTop: 10, gap: 10 }}>
              <Skeleton height={hp(0.055)} width="48%" borderRadius={14} />
              <Skeleton height={hp(0.055)} width="48%" borderRadius={14} />
            </View>
          </View>
        ) : (
          <FlatList
            data={trending}
            numColumns={1}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.gridContent}
            snapToInterval={SINGLE_CARD_SNAP_HEIGHT}
            snapToAlignment="start"
            decelerationRate="fast"
            disableIntervalMomentum={disableVerticalInterval}
            onScrollBeginDrag={handleScrollBeginDrag}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            refreshControl={
              <AppRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            renderItem={({ item }) => <TemplateCard template={item} onPress={() => handleTemplatePress(item)} />}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="flame-outline" size={44} color={COLORS.borderStrong} />
                <Text style={styles.emptyTitle}>{t('nothing_trending_yet')}</Text>
                <Text style={styles.emptyText}>{t('nothing_trending_msg')}</Text>
              </View>
            }
          />
        )}
      </View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  pageHeader: {
    marginTop: SPACING.lg,
  },
  gridContent: {
    paddingHorizontal: SCREEN_PAD,
    paddingBottom: hp(0.04),
  },
  loadingGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SCREEN_PAD,
  },
  loadingCol: {
    width: wp(0.435),
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    color: COLORS.ink,
    fontSize: fontScale(16),
    fontFamily: FONTS.bold,
    marginTop: 14,
  },
  emptyText: {
    color: COLORS.inkMuted,
    fontSize: fontScale(12.5),
    fontFamily: FONTS.medium,
    marginTop: 4,
  },
});
