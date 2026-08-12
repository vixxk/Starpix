import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppBackground from '../../src/components/AppBackground';
import PressableScale from '../../src/components/PressableScale';
import CategoryPill from '../../src/components/CategoryPill';
import SectionHeader from '../../src/components/SectionHeader';
import TemplateCard from '../../src/components/TemplateCard';
import Skeleton from '../../src/components/Skeleton';
import { COLORS, FONTS } from '../../src/constants/colors';
import { fontScale, wp, hp, SCREEN_PAD, GRID_GAP, SPACING } from '../../src/utils/responsive';
import API from '../../src/utils/api';
import { useCreationStore } from '../../src/store/useCreationStore';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const setActiveTemplate = useCreationStore((state) => state.setActiveTemplate);

  const fetchExploreData = async () => {
    setLoading(true);
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
    }
  };

  useEffect(() => {
    fetchExploreData();
  }, [search, selectedCategory]);

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
                isSelected={item._id === 'all' ? !selectedCategory : selectedCategory?._id === item._id}
                onPress={() => setSelectedCategory(item._id === 'all' ? null : item)}
              />
            )}
          />
        </View>

        {loading ? (
          <View style={styles.loadingGrid}>
            <View style={styles.loadingCol}>
              <Skeleton height={200} width="100%" borderRadius={16} />
              <Skeleton height={200} width="100%" borderRadius={16} style={{ marginTop: GRID_GAP }} />
            </View>
            <View style={styles.loadingCol}>
              <Skeleton height={200} width="100%" borderRadius={16} />
              <Skeleton height={200} width="100%" borderRadius={16} style={{ marginTop: GRID_GAP }} />
            </View>
          </View>
        ) : (
          <FlatList
            data={templates}
            numColumns={2}
            keyExtractor={(item) => item._id}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.gridContent}
            renderItem={({ item }) => <TemplateCard template={item} onPress={() => handleTemplatePress(item)} />}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="search" size={44} color={COLORS.borderStrong} />
                <Text style={styles.emptyTitle}>No results found</Text>
                <Text style={styles.emptyText}>Try a different search or category.</Text>
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
