import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppBackground from '../../src/components/AppBackground';
import PressableScale from '../../src/components/PressableScale';
import FadeInView from '../../src/components/FadeInView';
import AppRefreshControl from '../../src/components/AppRefreshControl';
import Toast from '../../src/components/Toast';
import CategoryPill from '../../src/components/CategoryPill';
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

const FALLBACK_CATEGORIES = [
  { _id: 'good-morning', name: 'Good Morning', icon: '🌅' },
  { _id: 'festival', name: 'Festivals', icon: '🎉' },
  { _id: 'motivation', name: 'Motivation', icon: '⚡' },
  { _id: 'devotional', name: 'Devotional', icon: '🙏' },
  { _id: 'love', name: 'Love', icon: '💖' },
  { _id: 'quotes', name: 'Quotes', icon: '💬' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [openingCampaign, setOpeningCampaign] = useState(null);
  const [homeFeed, setHomeFeed] = useState({ trending: [], goodMorning: [], motivation: [], festival: [] });
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
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

  const displayCategories = categories && categories.length > 0 ? categories : FALLBACK_CATEGORIES;

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

  const [allTemplates, setAllTemplates] = useState([]);

  const fetchHomeData = async () => {
    setLoadFailed(false);
    console.log('[HomeScreen] Fetching home data from:', API.defaults.baseURL);
    try {
      const results = await Promise.allSettled([
        API.get('/categories'),
        API.get('/templates/home-feed'),
        API.get('/campaigns/active-opening'),
        API.get('/templates', { params: { limit: 24, sort: 'trending' } }),
      ]);

      let catData = [];
      let feedData = { trending: [], goodMorning: [], motivation: [], festival: [] };
      let campaignData = null;
      let templateData = [];

      if (results[0].status === 'fulfilled' && results[0].value?.data?.success) {
        catData = results[0].value.data.data || [];
      }
      if (results[1].status === 'fulfilled' && results[1].value?.data?.success) {
        feedData = results[1].value.data.data || feedData;
      }
      if (results[2].status === 'fulfilled' && results[2].value?.data?.success) {
        campaignData = results[2].value.data.data || null;
      }
      if (results[3].status === 'fulfilled' && results[3].value?.data?.success) {
        templateData = results[3].value.data.data || [];
      }

      setCategories(catData);
      setOpeningCampaign(campaignData);
      setAllTemplates(templateData);

      // Guarantee that if section rails are empty, trending gets auto-filled from templateData
      if (
        (!feedData.trending || feedData.trending.length === 0) &&
        templateData.length > 0
      ) {
        feedData.trending = templateData.slice(0, 10);
      }
      setHomeFeed(feedData);

      const anySuccess = results.some(
        (r) => r.status === 'fulfilled' && r.value?.data?.success
      );
      setLoadFailed(!anySuccess);
    } catch (err) {
      console.error('[HomeScreen] Error loading home feed:', err);
      setLoadFailed(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

  // Search templates when user types
  useEffect(() => {
    if (!search || search.trim() === '') {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);
    API.get('/templates', { params: { search: search.trim(), sort: 'trending' } })
      .then((res) => {
        if (!cancelled && res.data && res.data.success) {
          setSearchResults(res.data.data || []);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (!cancelled) setSearching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [search]);

  // Filter the feed instantly when a category is selected, then complete with backend query
  useEffect(() => {
    let cancelled = false;

    if (!selectedCategory) {
      setCategoryTemplates([]);
      setCategoryFetching(false);
      return () => {
        cancelled = true;
      };
    }

    const catId = String(selectedCategory._id);
    const catNameLower = (selectedCategory.name || '').toLowerCase();

    const feedItems = [
      ...(homeFeed.trending || []),
      ...(homeFeed.goodMorning || []),
      ...(homeFeed.festival || []),
      ...(homeFeed.motivation || []),
      ...allTemplates,
    ].filter((item, index, arr) => item && arr.findIndex((x) => x && x._id === item._id) === index);

    const instant = feedItems
      .filter((t) => {
        if (!t) return false;
        const rawId = t.categoryId?._id || t.categoryId || t.category?._id || t.category;
        if (rawId && String(rawId) === catId) return true;

        const tName = (t.name || '').toLowerCase();
        const tTags = Array.isArray(t.tags) ? t.tags.join(' ').toLowerCase() : '';
        if (catNameLower && catNameLower !== 'all' && (tName.includes(catNameLower) || tTags.includes(catNameLower))) {
          return true;
        }

        return false;
      })
      .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || (b.trendingScore || 0) - (a.trendingScore || 0));

    setCategoryTemplates(instant);
    setCategoryFetching(true);

    API.get('/templates', { params: { categoryId: selectedCategory._id, limit: 24, sort: 'trending' } })
      .then((res) => {
        if (!cancelled && res.data && res.data.success) {
          const fetched = res.data.data || [];
          if (fetched.length > 0) {
            setCategoryTemplates(fetched);
          }
        }
      })
      .catch((err) => {
        console.log('Category fetch notice:', err?.message);
      })
      .finally(() => {
        if (!cancelled) setCategoryFetching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCategory, homeFeed, allTemplates]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHomeData();
  };

  const handleSelectCategory = (cat) => {
    if (!cat || (selectedCategory && selectedCategory._id === cat._id)) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(cat);
    }
    if (scrollRef.current) scrollRef.current.scrollTo({ y: 0, animated: true });
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
    !(homeFeed.trending && homeFeed.trending.length) &&
    !(homeFeed.goodMorning && homeFeed.goodMorning.length) &&
    !(homeFeed.festival && homeFeed.festival.length) &&
    !(homeFeed.motivation && homeFeed.motivation.length) &&
    !allTemplates.length;

  const renderGrid = (items) => (
    <View style={styles.grid}>
      {items.map((item) => (
        <TemplateCard key={item._id} template={item} onPress={() => handleTemplatePress(item)} />
      ))}
    </View>
  );

  const renderRail = (items) => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.horizontalList}
    >
      {items.map((item) => (
        <TemplateCard key={item._id} template={item} width={wp(0.42)} onPress={() => handleTemplatePress(item)} />
      ))}
    </ScrollView>
  );

  return (
    <AppBackground>
      <StatusBar style="dark" />
      <View style={[styles.safeArea, { paddingTop: Math.max(insets.top, 12) }]}>
        {/* Brand header */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Animated.View style={[styles.logoIcon, { transform: [{ scale: logoScale }] }]}>
              <Ionicons name="map-outline" size={22} color={COLORS.white} />
            </Animated.View>
            <View>
              <Text style={styles.appName}>Statuzzz</Text>
              <Text style={styles.appTagline}>Explore & status with your photo</Text>
            </View>
          </View>
        </View>

        {/* Explore Search Bar */}
        <View style={styles.searchBarContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={COLORS.inkFaint} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search status, quotes, festivals..."
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

        {/* Sticky Top Category Filter Pills Bar */}
        {search.trim().length === 0 && (
          <View style={styles.categoryBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
              <CategoryPill
                category={{ _id: 'all', name: 'All', icon: '✨' }}
                isSelected={!selectedCategory}
                onPress={() => handleSelectCategory(null)}
              />
              {displayCategories.map((cat) => (
                <CategoryPill
                  key={cat._id}
                  category={cat}
                  isSelected={Boolean(selectedCategory && selectedCategory._id === cat._id)}
                  onPress={() => handleSelectCategory(cat)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        <ScrollView
          style={{ flex: 1 }}
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <AppRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={[styles.scrollContent, { flexGrow: 1 }]}
        >
          {/* If user typed in search bar, display Explore search results */}
          {search.trim().length > 0 ? (
            <View style={{ marginTop: 8 }}>
              <SectionHeader
                icon="🧭"
                title={`Search: "${search}"`}
                subtitle="Matching templates & statuses"
              />
              {searching ? (
                <View style={styles.loadingWrap}>
                  <Skeleton height={180} width="100%" borderRadius={20} style={styles.skeletonCard} />
                  <Skeleton height={180} width="100%" borderRadius={20} />
                </View>
              ) : searchResults.length > 0 ? (
                renderGrid(searchResults)
              ) : (
                <View style={styles.emptyFilter}>
                  <Ionicons name="search-outline" size={40} color={COLORS.borderStrong} />
                  <Text style={styles.emptyFilterTitle}>No results found</Text>
                  <Text style={styles.emptyFilterText}>Try another keyword or pick a category below.</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={{ marginTop: 4 }}>
              {/* Active opening campaign */}
              {openingCampaign && !selectedCategory && (
                <CampaignCard
                  campaign={openingCampaign}
                  onPress={() => router.push({ pathname: `/campaign/${openingCampaign._id}` })}
                />
              )}

              {loading ? (
                <View style={styles.homeSkeletonWrap}>
                  <Skeleton height={140} width="100%" borderRadius={22} style={{ marginBottom: 20 }} />

                  <View style={styles.sectionHeaderSkeleton}>
                    <Skeleton height={20} width={140} borderRadius={6} />
                    <Skeleton height={12} width={210} borderRadius={4} style={{ marginTop: 6 }} />
                  </View>

                  <View style={styles.railSkeletonRow}>
                    <Skeleton height={wp(0.42) * 1.55} width={wp(0.42)} borderRadius={18} />
                    <Skeleton height={wp(0.42) * 1.55} width={wp(0.42)} borderRadius={18} />
                    <Skeleton height={wp(0.42) * 1.55} width={wp(0.42)} borderRadius={18} />
                  </View>

                  <View style={[styles.sectionHeaderSkeleton, { marginTop: 24 }]}>
                    <Skeleton height={20} width={130} borderRadius={6} />
                    <Skeleton height={12} width={180} borderRadius={4} style={{ marginTop: 6 }} />
                  </View>

                  <View style={styles.gridSkeletonRow}>
                    <Skeleton height={wp(0.435) * 1.55} width={wp(0.435)} borderRadius={18} />
                    <Skeleton height={wp(0.435) * 1.55} width={wp(0.435)} borderRadius={18} />
                  </View>
                </View>
              ) : selectedCategory ? (
                <FadeInView delay={0} key={selectedCategory._id}>
                  <SectionHeader
                    icon={selectedCategory.icon || '✨'}
                    title={selectedCategory.name}
                    subtitle="Templates & statuses in this category"
                    onSeeAll={() => handleSelectCategory(null)}
                    seeAllText="Clear Filter ✕"
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
                      <Text style={styles.emptyFilterTitle}>No templates found</Text>
                      <Text style={styles.emptyFilterText}>New {selectedCategory.name} statuses will appear here.</Text>
                    </View>
                  )}
                </FadeInView>
              ) : loadFailed ? (
                <FadeInView delay={0}>
                  <View style={styles.emptyFeed}>
                    <View style={styles.emptyFeedIcon}>
                      <Ionicons name="cloud-offline-outline" size={34} color={COLORS.orange} />
                    </View>
                    <Text style={styles.emptyFeedTitle}>Couldn't load statuses</Text>
                    <Text style={styles.emptyFeedText}>
                      We couldn't reach the Statuzzz server. Check that the backend is running and your phone is on the same Wi-Fi, then try again.
                    </Text>
                    <PressableScale
                      onPress={() => {
                        setLoading(true);
                        fetchHomeData();
                      }}
                      scaleTo={0.95}
                      haptic="impact"
                      style={styles.retryBtn}
                      contentStyle={styles.retryContent}
                    >
                      <Ionicons name="refresh" size={16} color={COLORS.white} />
                      <Text style={styles.retryText}>Try Again</Text>
                    </PressableScale>
                    <Text style={styles.retryHint} numberOfLines={2}>
                      API: {API.defaults.baseURL}
                    </Text>
                  </View>
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
                <View>
                  {homeFeed.trending && homeFeed.trending.length > 0 && (
                    <View style={styles.sectionWrap}>
                      <SectionHeader
                        icon="🔥"
                        title="Trending Statuses"
                        subtitle="Most created & shared today"
                        onSeeAll={() => router.push('/(tabs)/trending')}
                      />
                      {renderRail(homeFeed.trending)}
                    </View>
                  )}

                  {homeFeed.goodMorning && homeFeed.goodMorning.length > 0 && (
                    <View style={styles.sectionWrap}>
                      <SectionHeader
                        icon="🌅"
                        title="Good Morning Wishes"
                        subtitle="Personalized morning greetings"
                      />
                      {renderRail(homeFeed.goodMorning)}
                    </View>
                  )}

                  {homeFeed.festival && homeFeed.festival.length > 0 && (
                    <View style={styles.sectionWrap}>
                      <SectionHeader
                        icon="🎉"
                        title="Festival & Celebrations"
                        subtitle="Diwali, Eid, Jayanti & more"
                      />
                      {renderRail(homeFeed.festival)}
                    </View>
                  )}

                  {homeFeed.motivation && homeFeed.motivation.length > 0 && (
                    <View style={styles.sectionWrap}>
                      <SectionHeader
                        icon="💪"
                        title="Daily Inspiration"
                        subtitle="Success quotes with your photo"
                      />
                      {renderRail(homeFeed.motivation)}
                    </View>
                  )}

                  {allTemplates && allTemplates.length > 0 && (
                    <View style={styles.sectionWrap}>
                      <SectionHeader
                        icon="✨"
                        title="All Status Templates"
                        subtitle="Browse & personalize with your photo"
                        onSeeAll={() => router.push('/(tabs)/explore')}
                      />
                      {renderGrid(allTemplates)}
                    </View>
                  )}
                </View>
              )}
            </View>
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
  searchBarContainer: {
    paddingHorizontal: wp(0.05),
    marginBottom: hp(0.01),
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.borderStrong,
    borderRadius: wp(0.035),
    paddingHorizontal: wp(0.038),
    height: hp(0.055),
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
  scrollContent: {
    paddingBottom: hp(0.05),
  },
  categoryBar: {
    marginVertical: 4,
  },
  categoryScroll: {
    paddingHorizontal: SCREEN_PAD,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionWrap: {
    marginBottom: SPACING.md,
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
  homeSkeletonWrap: {
    paddingHorizontal: SCREEN_PAD,
    marginTop: 8,
  },
  sectionHeaderSkeleton: {
    marginBottom: 12,
  },
  railSkeletonRow: {
    flexDirection: 'row',
    gap: 12,
    overflow: 'hidden',
  },
  gridSkeletonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
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
    textAlign: 'center',
  },
  emptyFeedText: {
    color: COLORS.inkMuted,
    fontSize: fontScale(13),
    fontFamily: FONTS.medium,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: fontScale(19),
    paddingHorizontal: 20,
  },
  retryBtn: {
    marginTop: 18,
    backgroundColor: COLORS.orange,
    borderRadius: 14,
    paddingHorizontal: 26,
    paddingVertical: 12,
    elevation: 3,
    shadowColor: COLORS.orangeDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  retryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retryText: {
    color: COLORS.white,
    fontSize: fontScale(13.5),
    fontFamily: FONTS.bold,
  },
  retryHint: {
    color: COLORS.inkFaint,
    fontSize: fontScale(9.5),
    fontFamily: FONTS.medium,
    textAlign: 'center',
    marginTop: 14,
    paddingHorizontal: 30,
  },
});
