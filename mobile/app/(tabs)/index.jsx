import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, FlatList, StyleSheet, SafeAreaView, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppBackground from '../../src/components/AppBackground';
import PressableScale from '../../src/components/PressableScale';
import FadeInView from '../../src/components/FadeInView';
import AppRefreshControl from '../../src/components/AppRefreshControl';
import Toast from '../../src/components/Toast';
import CategoryCard from '../../src/components/CategoryCard';
import CampaignCard from '../../src/components/CampaignCard';
import TemplateCard from '../../src/components/TemplateCard';
import SectionHeader from '../../src/components/SectionHeader';
import Skeleton from '../../src/components/Skeleton';
import { COLORS, FONTS } from '../../src/constants/colors';
import { fontScale, wp, hp, SCREEN_PAD, GRID_GAP, SPACING } from '../../src/utils/responsive';
import API from '../../src/utils/api';
import { useCreationStore } from '../../src/store/useCreationStore';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [openingCampaign, setOpeningCampaign] = useState(null);
  const [homeFeed, setHomeFeed] = useState({ trending: [], goodMorning: [], motivation: [], festival: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categoryTemplates, setCategoryTemplates] = useState([]);
  const [categoryFetching, setCategoryFetching] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [toastKey, setToastKey] = useState(0);

  const router = useRouter();
  const setActiveTemplate = useCreationStore((state) => state.setActiveTemplate);
  const scrollRef = useRef(null);
  const logoScale = useRef(new Animated.Value(1)).current;
  const prevRefreshing = useRef(false);

  // Bounce the logo when a pull-to-refresh finishes (not on initial load)
  useEffect(() => {
    if (prevRefreshing.current && !refreshing) {
      logoScale.setValue(1);
      Animated.sequence([
        Animated.timing(logoScale, { toValue: 1.28, duration: 110, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, friction: 3.5, tension: 150, useNativeDriver: true }),
      ]).start();
    }
    prevRefreshing.current = refreshing;
  }, [refreshing, logoScale]);

  const fetchHomeData = async () => {
    try {
      const [resC, resHome, resCamp] = await Promise.all([
        API.get('/categories'),
        API.get('/templates/home-feed'),
        API.get('/campaigns/active-opening'),
      ]);

      if (resC.data.success) setCategories(resC.data.data);
      if (resHome.data.success) setHomeFeed(resHome.data.data);
      if (resCamp.data.success && resCamp.data.data) setOpeningCampaign(resCamp.data.data);
    } catch (err) {
      console.error('Error loading home feed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

  // Filter the feed instantly when a category is selected, then complete with the full category list
  useEffect(() => {
    let cancelled = false;

    if (!selectedCategory) {
      setCategoryTemplates([]);
      setCategoryFetching(false);
      return () => {
        cancelled = true;
      };
    }

    const catId = selectedCategory._id;
    const feedItems = [
      ...(homeFeed.trending || []),
      ...(homeFeed.goodMorning || []),
      ...(homeFeed.festival || []),
      ...(homeFeed.motivation || []),
    ].filter((item, index, arr) => arr.findIndex((x) => x._id === item._id) === index);

    const instant = feedItems
      .filter((t) => {
        const id = t.categoryId?._id || t.categoryId;
        return id === catId;
      })
      .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || (b.trendingScore || 0) - (a.trendingScore || 0));

    setCategoryTemplates(instant);
    setCategoryFetching(true);

    API.get('/templates', { params: { categoryId: catId, limit: 24, sort: 'trending' } })
      .then((res) => {
        if (!cancelled && res.data.success) {
          setCategoryTemplates(res.data.data);
          if (res.data.data.length === 0) {
            showToast(`No ${selectedCategory.name} templates yet`);
          }
        }
      })
      .catch(() => {
        // keep the instant filtered results if the full fetch fails
      })
      .finally(() => {
        if (!cancelled) setCategoryFetching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCategory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHomeData();
  };

  const handleSelectCategory = (cat) => {
    setSelectedCategory(cat);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setToastKey((k) => k + 1);
  };

  const handleToastDone = useCallback(() => setToastMessage(null), []);

  const handleTemplatePress = (template) => {
    setActiveTemplate(template);
    router.push({ pathname: `/template/${template._id}` });
  };

  const feedEmpty =
    !homeFeed.trending?.length &&
    !homeFeed.goodMorning?.length &&
    !homeFeed.festival?.length &&
    !homeFeed.motivation?.length;

  const renderGrid = (items) => (
    <View style={styles.grid}>
      {items.map((item) => (
        <TemplateCard key={item._id} template={item} onPress={() => handleTemplatePress(item)} />
      ))}
    </View>
  );

  return (
    <AppBackground>
      <StatusBar style="dark" />
      <View style={[styles.safeArea, { paddingTop: Math.max(insets.top, 12) }]}>
        {/* Brand header */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Animated.View style={[styles.logoIcon, { transform: [{ scale: logoScale }] }]}>
              <Text style={styles.logoText}>S</Text>
            </Animated.View>
            <View>
              <Text style={styles.appName}>Statuzzz</Text>
              <Text style={styles.appTagline}>Status with your photo</Text>
            </View>
          </View>

          <PressableScale onPress={() => router.push('/(tabs)/explore')} scaleTo={0.88} style={styles.searchBtn} contentStyle={styles.searchContent}>
            <Ionicons name="search" size={19} color={COLORS.orangeDeep} />
          </PressableScale>
        </View>

        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <AppRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.scrollContent}
        >
          {/* Active opening campaign */}
          {openingCampaign && (
            <CampaignCard
              campaign={openingCampaign}
              onPress={() => router.push({ pathname: `/campaign/${openingCampaign._id}` })}
            />
          )}

          {/* Categories carousel */}
          <View style={styles.categoriesWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
              <CategoryCard
                category={{ _id: 'all', name: 'All', icon: '✨' }}
                isSelected={!selectedCategory}
                onPress={() => handleSelectCategory(null)}
              />
              {categories.map((cat) => (
                <CategoryCard
                  key={cat._id}
                  category={cat}
                  isSelected={selectedCategory?._id === cat._id}
                  onPress={() => handleSelectCategory(cat)}
                />
              ))}
            </ScrollView>
          </View>

          {loading ? (
            <View style={styles.loadingWrap}>
              <Skeleton height={180} width="100%" borderRadius={20} style={styles.skeletonCard} />
              <Skeleton height={180} width="100%" borderRadius={20} />
            </View>
          ) : selectedCategory ? (
            <FadeInView delay={0} key={selectedCategory._id}>
              <SectionHeader
                icon={selectedCategory.icon}
                title={selectedCategory.name}
                subtitle="Templates & statuses in this category"
                count={categoryTemplates.length}
              />
              {categoryTemplates.length > 0 ? (
                renderGrid(categoryTemplates)
              ) : categoryFetching ? (
                <View style={styles.loadingWrap}>
                  <Skeleton height={180} width="100%" borderRadius={20} style={styles.skeletonCard} />
                  <Skeleton height={180} width="100%" borderRadius={20} />
                </View>
              ) : (
                <View style={styles.emptyFilter}>
                  <Ionicons name="file-tray-outline" size={40} color={COLORS.borderStrong} />
                  <Text style={styles.emptyFilterTitle}>No templates yet</Text>
                  <Text style={styles.emptyFilterText}>New {selectedCategory.name} statuses will appear here.</Text>
                </View>
              )}
            </FadeInView>
          ) : feedEmpty ? (
            <FadeInView delay={0}>
              <View style={styles.emptyFeed}>
                <View style={styles.emptyFeedIcon}>
                  <Ionicons name="sparkles-outline" size={34} color={COLORS.orange} />
                </View>
                <Text style={styles.emptyFeedTitle}>No statuses yet</Text>
                <Text style={styles.emptyFeedText}>Fresh statuses will show up here. Pull down to refresh.</Text>
              </View>
            </FadeInView>
          ) : (
            <>
              {homeFeed.trending?.length > 0 && (
                <FadeInView delay={0}>
                  <SectionHeader
                    icon="🔥"
                    title="Trending Statuses"
                    subtitle="Most created & shared today"
                    onSeeAll={() => router.push('/(tabs)/trending')}
                  />
                  <FlatList
                    data={homeFeed.trending}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.horizontalList}
                    renderItem={({ item }) => (
                      <TemplateCard template={item} width={wp(0.42)} onPress={() => handleTemplatePress(item)} />
                    )}
                  />
                </FadeInView>
              )}

              {homeFeed.goodMorning?.length > 0 && (
                <FadeInView delay={120}>
                  <SectionHeader
                    icon="🌅"
                    title="Good Morning Wishes"
                    subtitle="Personalized morning greetings"
                    count={homeFeed.goodMorning.length}
                  />
                  {renderGrid(homeFeed.goodMorning)}
                </FadeInView>
              )}

              {homeFeed.festival?.length > 0 && (
                <FadeInView delay={240}>
                  <SectionHeader
                    icon="🎉"
                    title="Festival & Celebrations"
                    subtitle="Diwali, Eid, Jayanti & more"
                    count={homeFeed.festival.length}
                  />
                  {renderGrid(homeFeed.festival)}
                </FadeInView>
              )}

              {homeFeed.motivation?.length > 0 && (
                <FadeInView delay={360}>
                  <SectionHeader
                    icon="💪"
                    title="Daily Inspiration"
                    subtitle="Success quotes with your photo"
                    count={homeFeed.motivation.length}
                  />
                  {renderGrid(homeFeed.motivation)}
                </FadeInView>
              )}
            </>
          )}
        </ScrollView>

        <Toast message={toastMessage} toastKey={toastKey} onDone={handleToastDone} />
      </View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(0.05),
    paddingVertical: hp(0.015),
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(0.03),
  },
  logoIcon: {
    width: wp(0.11),
    height: wp(0.11),
    borderRadius: wp(0.035),
    backgroundColor: COLORS.orange,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: COLORS.orangeDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  logoText: {
    color: COLORS.white,
    fontFamily: FONTS.black,
    fontSize: fontScale(21),
  },
  appName: {
    color: COLORS.ink,
    fontFamily: FONTS.extrabold,
    fontSize: fontScale(18),
    letterSpacing: 0.3,
  },
  appTagline: {
    color: COLORS.orange,
    fontFamily: FONTS.semibold,
    fontSize: fontScale(10.5),
    marginTop: 1,
  },
  searchBtn: {
    width: wp(0.11),
    height: wp(0.11),
    borderRadius: wp(0.035),
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },
  searchContent: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: hp(0.05),
  },
  categoriesWrapper: {
    marginVertical: SPACING.lg,
  },
  categoriesScroll: {
    paddingHorizontal: SCREEN_PAD,
  },
  loadingWrap: {
    paddingHorizontal: SCREEN_PAD,
    marginTop: SPACING.xxl,
  },
  skeletonCard: {
    marginBottom: SPACING.lg,
  },
  horizontalList: {
    paddingHorizontal: SCREEN_PAD,
    gap: GRID_GAP,
    paddingBottom: SPACING.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: SCREEN_PAD,
    rowGap: GRID_GAP,
  },
  emptyFilter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: SCREEN_PAD,
  },
  emptyFilterTitle: {
    color: COLORS.ink,
    fontSize: fontScale(16),
    fontFamily: FONTS.bold,
    marginTop: 14,
  },
  emptyFilterText: {
    color: COLORS.inkMuted,
    fontSize: fontScale(12.5),
    fontFamily: FONTS.medium,
    marginTop: 4,
    textAlign: 'center',
  },
  emptyFeed: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(0.09),
    paddingHorizontal: SCREEN_PAD,
  },
  emptyFeedIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: COLORS.orangeTint,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyFeedTitle: {
    color: COLORS.ink,
    fontSize: fontScale(17),
    fontFamily: FONTS.bold,
  },
  emptyFeedText: {
    color: COLORS.inkMuted,
    fontSize: fontScale(13),
    fontFamily: FONTS.medium,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: fontScale(19),
  },
});
