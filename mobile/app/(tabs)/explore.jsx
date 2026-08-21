import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppBackground from '../../src/components/AppBackground';
import PressableScale from '../../src/components/PressableScale';
import CategoryPill from '../../src/components/CategoryPill';
import SectionHeader from '../../src/components/SectionHeader';
import TemplateCard from '../../src/components/TemplateCard';
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

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
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
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const router = useRouter();
  const setActiveTemplate = useCreationStore((state) => state.setActiveTemplate);

  const fetchExploreData = useCallback(async () => {
    try {
      const params = { sort: 'trending' };
      if (search) params.search = search;
      if (selectedCategory) params.categoryId = selectedCategory._id;

      const [resC, resT] = await Promise.all([
        API.get('/categories'),
        API.get('/templates', { params }),
      ]);

      if (resC.data.success) setCategories(resC.data.data);
      if (resT.data.success) setTemplates(resT.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, selectedCategory]);

  useEffect(() => {
    setLoading(true);
    fetchExploreData();
  }, [fetchExploreData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchExploreData();
  }, [fetchExploreData]);

  const handleTemplatePress = (template) => {
    setActiveTemplate(template);
    router.push(`/template/${template._id}`);
  };

  return (
    <AppBackground>
      <StatusBar style="dark" />
      <View style={[styles.safeArea, { paddingTop: Math.max(insets.top, 12) }]}>
        <SectionHeader icon="🧭" title="Explore" subtitle="Discover statuses & templates" style={styles.pageHeader} />

        <View style={styles.header}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={COLORS.inkFaint} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={t('enter_name_placeholder')}
              placeholderTextColor={COLORS.inkFaint}
              style={styles.searchInput}
            />
            {search.length > 0 && (
              <PressableScale onPress={() => setSearch('')} scaleTo={0.8} hitSlop={10} contentStyle={styles.clearContent}>
                <Ionicons name="close-circle" size={18} color={COLORS.inkFaint} />
              </PressableScale>
            )}
          </View>
        </View>

        <View style={styles.categoryBar}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[{ _id: 'all', name: 'All', icon: '✨' }, ...categories]}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.categoryScroll}
            renderItem={({ item }) => (
              <CategoryPill
                category={item}
                isSelected={item._id === 'all' ? !selectedCategory : (selectedCategory && selectedCategory._id === item._id)}
                onPress={() => setSelectedCategory(item._id === 'all' ? null : item)}
              />
            )}
          />
        </View>

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
            data={templates}
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
                <Ionicons name="search" size={44} color={COLORS.borderStrong} />
                <Text style={styles.emptyTitle}>{t('no_results_found')}</Text>
                <Text style={styles.emptyText}>{t('try_different_search')}</Text>
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
    marginTop: hp(0.012),
    marginBottom: 0,
  },
  header: {
    paddingHorizontal: wp(0.05),
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.borderStrong,
    borderRadius: wp(0.035),
    paddingHorizontal: wp(0.038),
    height: hp(0.06),
    marginTop: hp(0.014),
    gap: wp(0.025),
  },
  searchInput: {
    flex: 1,
    color: COLORS.ink,
    fontSize: fontScale(13.5),
    fontFamily: FONTS.medium,
  },
  clearContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(0.01),
  },
  categoryBar: {
    marginVertical: hp(0.016),
  },
  categoryScroll: {
    paddingHorizontal: wp(0.05),
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: SCREEN_PAD,
    marginBottom: GRID_GAP,
  },
  gridContent: {
    paddingHorizontal: SCREEN_PAD,
    paddingBottom: hp(0.04),
  },
  loadingGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SCREEN_PAD,
    marginTop: SPACING.sm,
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
