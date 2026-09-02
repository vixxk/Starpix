import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppBackground from '../../src/components/AppBackground';
import PressableScale from '../../src/components/PressableScale';
import FadeInView from '../../src/components/FadeInView';
import AppRefreshControl from '../../src/components/AppRefreshControl';
import Toast from '../../src/components/Toast';
import CategoryPill from '../../src/components/CategoryPill';
import TemplateCard from '../../src/components/TemplateCard';
import Skeleton from '../../src/components/Skeleton';
import { COLORS, FONTS } from '../../src/constants/colors';
import { fontScale, wp, hp, SCREEN_PAD, GRID_GAP, SPACING, SCREEN_DIMENSIONS } from '../../src/utils/responsive';
import { hapticTap } from '../../src/utils/haptics';
import API from '../../src/utils/api';
import { useCreationStore } from '../../src/store/useCreationStore';
import { Audio } from 'expo-av';
import { useIsFocused } from '@react-navigation/native';
import { resolveMediaUrl } from '../../src/utils/media';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';

// Module-level flag to track auto-opening per app session across component remounts
let hasAutoOpenedCampaignSession = false;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const router = useRouter();

  // Dynamic responsive viewport & template card sizing calculations
  const topInset = Math.max(insets.top, 12);
  const bottomInset = Math.max(insets.bottom, 12);
  const totalChromeHeight = topInset + 38 + 93 + (64 + bottomInset);
  const availableViewportHeight = Math.max(380, SCREEN_DIMENSIONS.height - totalChromeHeight);
  const maxCardHeight = Math.min(wp(0.70) * (16 / 9), availableViewportHeight - 86);
  const cardHeight = Math.max(250, maxCardHeight);
  const cardWidth = cardHeight * (9 / 16);
  const singleCardSnapHeight = availableViewportHeight;

  const activeIndexRef = useRef(0);
  const railActiveIndexRef = useRef({});

  const [disableVerticalInterval, setDisableVerticalInterval] = useState(true);
  const dragStartY = useRef(0);

  const handleVerticalScrollBeginDrag = (e) => {
    dragStartY.current = e.nativeEvent.contentOffset.y;
  };

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
  const setActiveTemplate = useCreationStore((state) => state.setActiveTemplate);
  const scrollRef = useRef(null);
  const logoScale = useRef(new Animated.Value(1)).current;
  const prevRefreshing = useRef(false);

  const displayCategories = categories || [];

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

  const [activeCampaigns, setActiveCampaigns] = useState([]);
  const [currentCoverBg, setCurrentCoverBg] = useState(null);

  const fetchHomeData = async () => {
    setLoadFailed(false);
    console.log('[HomeScreen] Fetching home data from:', API.defaults.baseURL);
    try {
      const results = await Promise.allSettled([
        API.get('/categories'),
        API.get('/templates/home-feed'),
        API.get('/campaigns/active-opening'),
        API.get('/templates', { params: { limit: 24, sort: 'trending' } }),
        API.get('/campaigns/active'),
      ]);

      let catData = [];
      let feedData = { trending: [], goodMorning: [], motivation: [], festival: [] };
      let campaignData = null;
      let templateData = [];
      let activeCamps = [];

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
      if (results[4].status === 'fulfilled' && results[4].value?.data?.success) {
        activeCamps = results[4].value.data.data || [];
      }

      setCategories(catData);
      setOpeningCampaign(campaignData);
      setAllTemplates(templateData);
      setActiveCampaigns(activeCamps);

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
      setInitialCampaignCheck(false);
    }
  };

  const [initialCampaignCheck, setInitialCampaignCheck] = useState(true);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const [allTemplates, setAllTemplates] = useState([]);

  // Automatically open single designated active campaign screen on app opening directly
  useEffect(() => {
    if (openingCampaign && openingCampaign._id && !hasAutoOpenedCampaignSession) {
      hasAutoOpenedCampaignSession = true;
      router.replace(`/campaign/${openingCampaign._id}`);
    }
  }, [openingCampaign]);

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

    const rawList = [
      ...(homeFeed.trending || []),
      ...(homeFeed.goodMorning || []),
      ...(homeFeed.festival || []),
      ...(homeFeed.motivation || []),
      ...allTemplates,
    ].filter((item, index, arr) => item && arr.findIndex((x) => x && x._id === item._id) === index);

    const instant = rawList
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
      .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || ((a.order !== undefined ? a.order : (a.sortOrder || 0)) - (b.order !== undefined ? b.order : (b.sortOrder || 0))) || (b.trendingScore || 0) - (a.trendingScore || 0));

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

  const displayTemplates = React.useMemo(() => {
    if (selectedCategory) return categoryTemplates;
    const combined = [
      ...(homeFeed.trending || []),
      ...(homeFeed.goodMorning || []),
      ...(homeFeed.festival || []),
      ...(homeFeed.motivation || []),
      ...(allTemplates || []),
    ];
    const seen = new Set();
    return combined.filter((t) => {
      if (!t || !t._id || seen.has(t._id)) return false;
      seen.add(t._id);
      return true;
    });
  }, [selectedCategory, categoryTemplates, homeFeed, allTemplates]);

  // Construct interleaved feed items: After every 2 simple template cards, insert 1 campaign card section (swiped left/right).
  const feedItems = React.useMemo(() => {
    const templates = displayTemplates || [];
    const campaigns = activeCampaigns || [];

    const items = [];
    let campaignIdx = 0;
    let templateIdx = 0;

    while (templateIdx < templates.length) {
      // Insert up to 2 simple template cards (swiped down/vertical)
      for (let i = 0; i < 2 && templateIdx < templates.length; i++) {
        const tmpl = templates[templateIdx++];
        items.push({ type: 'template', data: tmpl, key: `t_${tmpl._id}_${templateIdx}` });
      }

      // After 2 template cards, if active campaigns remain, insert campaign cards section (swiped left/right)
      if (campaignIdx < campaigns.length) {
        const c = campaigns[campaignIdx++];
        items.push({ type: 'campaign', data: c, key: `c_${c._id}_${campaignIdx}` });
      }
    }

    return items;
  }, [displayTemplates, activeCampaigns]);

  const isFocused = useIsFocused();
  const [activeCampaignMusic, setActiveCampaignMusic] = useState(null);
  const soundRef = useRef(null);

  // Auto-set audio for the initial campaign card on home screen load
  useEffect(() => {
    if (!selectedCategory && feedItems && feedItems.length > 0 && activeIndexRef.current === 0) {
      const firstItem = feedItems[0];
      if (firstItem && firstItem.type === 'campaign' && firstItem.data?.music) {
        setActiveCampaignMusic(firstItem.data.music);
      }
    }
  }, [feedItems, selectedCategory]);

  // Audio playback lifecycle effect for Home Screen campaign cards
  useEffect(() => {
    let soundObj = null;
    let isCancelled = false;

    const playHomeCampaignAudio = async () => {
      if (!activeCampaignMusic || !isFocused) {
        if (soundRef.current) {
          try {
            await soundRef.current.stopAsync();
            await soundRef.current.unloadAsync();
          } catch (e) {}
          soundRef.current = null;
        }
        return;
      }

      const audioUri = resolveMediaUrl(activeCampaignMusic);
      if (!audioUri) return;

      try {
        if (soundRef.current) {
          try {
            await soundRef.current.stopAsync();
            await soundRef.current.unloadAsync();
          } catch (e) {}
          soundRef.current = null;
        }

        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });

        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: true, isLooping: true, volume: 0.0 }
        );

        await sound.setIsLoopingAsync(true);
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish && !isCancelled) {
            sound.replayAsync().catch(() => {});
          }
        });

        if (isCancelled) {
          await sound.unloadAsync();
          return;
        }

        soundObj = sound;
        soundRef.current = sound;

        // Fade in volume smoothly over 1.5s
        let currentVol = 0.0;
        const targetVol = 1.0;
        const step = 0.05;
        const intervalMs = 75;

        const fadeInterval = setInterval(async () => {
          currentVol += step;
          if (currentVol >= targetVol) {
            currentVol = targetVol;
            clearInterval(fadeInterval);
          }
          if (soundObj && !isCancelled) {
            try {
              await soundObj.setVolumeAsync(currentVol);
            } catch (e) {}
          }
        }, intervalMs);
      } catch (err) {
        console.error('[HomeScreen] Error playing campaign audio:', err);
      }
    };

    playHomeCampaignAudio();

    return () => {
      isCancelled = true;
      if (soundObj) {
        soundObj.stopAsync().catch(() => {});
        soundObj.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, [activeCampaignMusic, isFocused]);

  const handleVerticalScroll = (e) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / singleCardSnapHeight);
    if (index !== activeIndexRef.current && index >= 0) {
      activeIndexRef.current = index;
      hapticTap();
    }

    // Update full screen background cover image and audio track when campaign card is visible
    const currentItem = selectedCategory ? null : feedItems[index];
    if (currentItem && currentItem.type === 'campaign') {
      const bg = currentItem.data?.heroBackground || currentItem.data?.heroImage;
      if (bg && bg !== currentCoverBg) {
        setCurrentCoverBg(bg);
      }
      const music = currentItem.data?.music || null;
      if (music !== activeCampaignMusic) {
        setActiveCampaignMusic(music);
      }
    } else {
      if (currentCoverBg !== null) {
        setCurrentCoverBg(null);
      }
      if (activeCampaignMusic !== null) {
        setActiveCampaignMusic(null);
      }
    }

    if (offsetY > dragStartY.current + 4) {
      if (!disableVerticalInterval) setDisableVerticalInterval(true);
    } else if (offsetY < dragStartY.current - 4) {
      if (disableVerticalInterval) setDisableVerticalInterval(false);
    }
  };

  const renderGrid = (items) => (
    <View style={styles.grid}>
      {items.map((item) => (
        <TemplateCard
          key={item._id}
          template={item}
          width={cardWidth}
          height={cardHeight}
          wrapperMinHeight={singleCardSnapHeight}
          onPress={() => handleTemplatePress(item)}
        />
      ))}
    </View>
  );

  if (initialCampaignCheck && !hasAutoOpenedCampaignSession) {
    return <AppBackground variant="bone" />;
  }

  return (
    <AppBackground bgImage={currentCoverBg}>
      <StatusBar style="dark" />
      <View style={[styles.safeArea, { paddingTop: topInset }]}>
        {/* Top Header Bar with Brand & AI Video Button */}
        <View style={styles.topHeaderBar}>
          <View style={styles.brandTitleWrap}>
            <Text style={styles.brandTitleText}>{t('brand_name')}</Text>
            <View style={styles.brandTag}>
              <Text style={styles.brandTagText}>{t('pro_tag')}</Text>
            </View>
          </View>

          <PressableScale
            onPress={() => {
              hapticTap();
              router.push('/ai-video');
            }}
            scaleTo={0.94}
            haptic="impact"
            style={styles.aiHeaderBtn}
            contentStyle={styles.aiHeaderBtnContent}
          >
            <Ionicons name="sparkles" size={fontScale(14)} color={COLORS.white} />
            <Text style={styles.aiHeaderBtnText}>{t('ai_video_badge')}</Text>
          </PressableScale>
        </View>

        {/* Sticky Top Categories Bar - Displaying 2 & 1/2 rows before scrolling */}
        <View style={styles.stickyCategoriesHeader}>
          <ScrollView
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={true}
            style={styles.categoriesScrollView}
            contentContainerStyle={styles.categoriesWrap}
          >
            <CategoryPill
              small
              category={{ _id: 'all', name: t('all_categories'), icon: '✨' }}
              isSelected={!selectedCategory}
              onPress={() => handleSelectCategory(null)}
            />
            {displayCategories.map((cat) => (
              <CategoryPill
                small
                key={cat._id}
                category={cat}
                isSelected={Boolean(selectedCategory && selectedCategory._id === cat._id)}
                onPress={() => handleSelectCategory(cat)}
              />
            ))}
          </ScrollView>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={singleCardSnapHeight}
          snapToAlignment="start"
          decelerationRate="fast"
          disableIntervalMomentum={disableVerticalInterval}
          onScrollBeginDrag={handleVerticalScrollBeginDrag}
          onScroll={handleVerticalScroll}
          scrollEventThrottle={16}
          refreshControl={
            <AppRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={[styles.scrollContent, { flexGrow: 1 }]}
        >
          <View style={{ marginTop: 0 }}>
            {loading ? (
              <View style={{ alignSelf: 'center', alignItems: 'center', minHeight: singleCardSnapHeight, justifyContent: 'center' }}>
                <Skeleton height={cardHeight} width={cardWidth} borderRadius={0} />
                <View style={{ flexDirection: 'row', width: cardWidth, justifyContent: 'space-between', marginTop: hp(0.008), gap: wp(0.025) }}>
                  <Skeleton height={hp(0.044)} width="48%" borderRadius={hp(0.012)} />
                  <Skeleton height={hp(0.044)} width="48%" borderRadius={hp(0.012)} />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', width: cardWidth, marginTop: hp(0.008), gap: 6 }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} width={hp(0.046)} height={hp(0.046)} borderRadius={6} />
                  ))}
                </View>
              </View>
            ) : selectedCategory ? (
              <FadeInView delay={0} key={selectedCategory._id}>
                {categoryTemplates.length > 0 ? (
                  renderGrid(categoryTemplates)
                ) : categoryFetching ? (
                  <View style={{ alignSelf: 'center', alignItems: 'center', minHeight: singleCardSnapHeight, justifyContent: 'center' }}>
                    <Skeleton height={cardHeight} width={cardWidth} borderRadius={0} />
                    <View style={{ flexDirection: 'row', width: cardWidth, justifyContent: 'space-between', marginTop: hp(0.008), gap: wp(0.025) }}>
                      <Skeleton height={hp(0.044)} width="48%" borderRadius={hp(0.012)} />
                      <Skeleton height={hp(0.044)} width="48%" borderRadius={hp(0.012)} />
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', width: cardWidth, marginTop: hp(0.008), gap: 6 }}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} width={hp(0.046)} height={hp(0.046)} borderRadius={6} />
                      ))}
                    </View>
                  </View>
                ) : (
                  <View style={styles.emptyFilter}>
                    <Ionicons name="file-tray-outline" size={40} color={COLORS.borderStrong} />
                    <Text style={styles.emptyFilterTitle}>{t('no_templates_found')}</Text>
                    <Text style={styles.emptyFilterText}>{t('fresh_statuses_msg')}</Text>
                  </View>
                )}
              </FadeInView>
            ) : loadFailed ? (
              <FadeInView delay={0}>
                <View style={styles.emptyFeed}>
                  <View style={styles.emptyFeedIcon}>
                    <Ionicons name="cloud-offline-outline" size={34} color={COLORS.orange} />
                  </View>
                  <Text style={styles.emptyFeedTitle}>{t('couldnt_load_statuses')}</Text>
                  <Text style={styles.emptyFeedText}>
                    {t('load_failed_msg')}
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
                    <Text style={styles.retryText}>{t('try_again')}</Text>
                  </PressableScale>
                </View>
              </FadeInView>
            ) : feedItems && feedItems.length > 0 ? (
              <FadeInView delay={0}>
                <View style={styles.grid}>
                  {feedItems.map((item) => {
                    if (item.type === 'template') {
                      return (
                        <TemplateCard
                          key={item.key}
                          template={item.data}
                          width={cardWidth}
                          height={cardHeight}
                          wrapperMinHeight={singleCardSnapHeight}
                          onPress={() => handleTemplatePress(item.data)}
                        />
                      );
                    } else if (item.type === 'campaign') {
                      const campaign = item.data;
                      const templates = campaign.featuredTemplates || [];
                      if (templates.length === 0) return null;

                      return (
                        <View key={item.key} style={styles.campaignFeedWrap}>
                          {/* Horizontal Swiping Carousel for Campaign Cards */}
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            nestedScrollEnabled={true}
                            contentContainerStyle={[styles.campaignHorizontalContent, { paddingHorizontal: SCREEN_PAD }]}
                            snapToInterval={cardWidth + GRID_GAP}
                            snapToAlignment="start"
                            decelerationRate="fast"
                          >
                            {templates.map((tItem) => (
                              <TemplateCard
                                key={`c_t_${tItem._id}`}
                                template={tItem}
                                width={cardWidth}
                                height={cardHeight}
                                wrapperMinHeight={singleCardSnapHeight}
                                onPress={() => handleTemplatePress(tItem)}
                              />
                            ))}
                          </ScrollView>
                        </View>
                      );
                    }
                    return null;
                  })}
                </View>
              </FadeInView>
            ) : (
              <FadeInView delay={0}>
                <View style={styles.emptyFeed}>
                  <View style={styles.emptyFeedIcon}>
                    <Ionicons name="sparkles-outline" size={34} color={COLORS.orange} />
                  </View>
                  <Text style={styles.emptyFeedTitle}>{t('no_statuses_yet')}</Text>
                  <Text style={styles.emptyFeedText}>{t('fresh_statuses_msg')}</Text>
                </View>
              </FadeInView>
            )}
          </View>
        </ScrollView>

        <Toast message={toastMessage} toastKey={toastKey} onDone={handleToastDone} />
      </View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  stickyCategoriesHeader: {
    paddingTop: 6,
    paddingBottom: 6,
    paddingHorizontal: SCREEN_PAD,
    zIndex: 100,
  },
  categoriesScrollView: {
    maxHeight: 81,
  },
  categoriesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 8,
    columnGap: 8,
    paddingRight: 4,
  },
  scrollContent: {
    paddingBottom: hp(0.08),
  },
  sectionWrap: {
    marginVertical: 0,
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
    paddingBottom: 0,
  },
  grid: {
    flexDirection: 'column',
    paddingHorizontal: SCREEN_PAD,
    rowGap: 0,
    marginVertical: 0,
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
  campaignFeedWrap: {
    width: '100%',
    marginVertical: 0,
    alignItems: 'center',
  },
  campaignBadgeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.orange,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
    marginBottom: 8,
    alignSelf: 'center',
  },
  campaignBadgeText: {
    color: COLORS.white,
    fontSize: fontScale(10.5),
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
  campaignHorizontalContent: {
    paddingHorizontal: SCREEN_PAD,
    gap: GRID_GAP,
    alignItems: 'center',
    paddingVertical: 0,
  },
  topHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SCREEN_PAD,
    paddingVertical: 6,
  },
  brandTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitleText: {
    fontSize: fontScale(20),
    fontFamily: FONTS.black,
    color: COLORS.ink,
    letterSpacing: 0.8,
  },
  brandTag: {
    backgroundColor: COLORS.orangeTint,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.orange,
  },
  brandTagText: {
    fontSize: fontScale(9),
    fontFamily: FONTS.bold,
    color: COLORS.orangeDeep,
  },
  aiHeaderBtn: {
    backgroundColor: COLORS.orange,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    shadowColor: COLORS.orangeDeep,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  aiHeaderBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiHeaderBtnText: {
    color: COLORS.white,
    fontSize: fontScale(12),
    fontFamily: FONTS.bold,
    letterSpacing: 0.3,
  },
});
