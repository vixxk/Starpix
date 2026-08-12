import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppBackground from '../../src/components/AppBackground';
import TemplateCard from '../../src/components/TemplateCard';
import SectionHeader from '../../src/components/SectionHeader';
import Skeleton from '../../src/components/Skeleton';
import { COLORS, FONTS } from '../../src/constants/colors';
import { fontScale, wp, hp, SCREEN_PAD, GRID_GAP, SPACING } from '../../src/utils/responsive';
import API from '../../src/utils/api';
import { useCreationStore } from '../../src/store/useCreationStore';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function TrendingScreen() {
  const insets = useSafeAreaInsets();
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const setActiveTemplate = useCreationStore((state) => state.setActiveTemplate);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await API.get('/templates/trending');
        if (res.data.success) setTrending(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

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
          title="Trending"
          subtitle="Most popular status templates with high engagement"
          count={trending.length}
          style={styles.pageHeader}
        />

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
            data={trending}
            numColumns={2}
            keyExtractor={(item) => item._id}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.gridContent}
            renderItem={({ item }) => <TemplateCard template={item} onPress={() => handleTemplatePress(item)} />}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="flame-outline" size={44} color={COLORS.borderStrong} />
                <Text style={styles.emptyTitle}>Nothing trending yet</Text>
                <Text style={styles.emptyText}>Check back soon for fresh viral statuses.</Text>
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
