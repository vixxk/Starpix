import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet, SafeAreaView, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import AppBackground from '../../src/components/AppBackground';
import PressableScale from '../../src/components/PressableScale';
import TemplateRenderer from '../../src/components/TemplateRenderer';
import AppButton from '../../src/components/AppButton';
import { COLORS, FONTS } from '../../src/constants/colors';
import { fontScale, wp, hp, SCREEN_PAD } from '../../src/utils/responsive';
import API from '../../src/utils/api';
import { useCreationStore } from '../../src/store/useCreationStore';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CANVAS_WIDTH = SCREEN_WIDTH * 0.72;
const CANVAS_HEIGHT = CANVAS_WIDTH * (16 / 9);

const TABS = [
  { key: 'photo', label: 'Photo', icon: 'image-outline' },
  { key: 'text', label: 'Text', icon: 'text-outline' },
  { key: 'frames', label: 'Frames', icon: 'square-outline' },
  { key: 'effects', label: 'Effects', icon: 'sparkles-outline' },
];

export default function TemplateEditorScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState('photo');
  const [frames, setFrames] = useState([]);
  const [effects, setEffects] = useState([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  const {
    activeTemplate,
    setActiveTemplate,
    userPhotoUri,
    setUserPhotoUri,
    userNameText,
    setUserNameText,
    userQuoteText,
    setUserQuoteText,
    selectedFrame,
    setSelectedFrame,
    selectedEffect,
    setSelectedEffect,
    photoScale,
  } = useCreationStore();

  useEffect(() => {
    const fetchTemplateDetails = async () => {
      try {
        const [resT, resF, resE] = await Promise.all([
          API.get(`/templates/${id}`),
          API.get('/frames'),
          API.get('/effects'),
        ]);

        if (resT.data.success) setActiveTemplate(resT.data.data);
        if (resF.data.success) setFrames(resF.data.data);
        if (resE.data.success) setEffects(resE.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplateDetails();
  }, [id]);

  const handlePickPhoto = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Permission to access photo library is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setUserPhotoUri(result.assets[0].uri);
    }
  };

  const handleProceedToPreview = () => {
    if (!activeTemplate) return;
    router.push({ pathname: `/preview/${activeTemplate._id}` });
  };

  if (loading || !activeTemplate) {
    return (
      <AppBackground>
        <StatusBar style="dark" />
        <View style={[styles.centerContainer, { paddingTop: Math.max(insets.top, hp(0.015)) }]}>
          <Text style={styles.loadingText}>Loading template editor…</Text>
        </View>
      </AppBackground>
    );
  }

  return (
    <AppBackground>
      <StatusBar style="dark" />
      <View style={[styles.safeArea, { paddingTop: Math.max(insets.top, hp(0.012)) }]}>
        {/* Header */}
        <View style={styles.header}>
          <PressableScale onPress={() => router.back()} scaleTo={0.88} style={styles.headerBtn} contentStyle={styles.iconContent}>
            <Ionicons name="chevron-back" size={22} color={COLORS.orange} />
          </PressableScale>
          <Text numberOfLines={1} style={styles.templateTitle}>{activeTemplate.name}</Text>
          <PressableScale onPress={handleProceedToPreview} scaleTo={0.93} style={styles.previewBtn} contentStyle={styles.previewContent}>
            <Text style={styles.previewBtnText}>Preview</Text>
            <Ionicons name="arrow-forward" size={14} color={COLORS.white} />
          </PressableScale>
        </View>

        {/* Live canvas */}
        <View style={styles.canvasContainer}>
          <TemplateRenderer
            template={activeTemplate}
            userPhotoUri={userPhotoUri}
            userNameText={userNameText}
            userQuoteText={userQuoteText}
            selectedFrame={selectedFrame}
            selectedEffect={selectedEffect}
            photoTransform={{ scale: photoScale }}
            canvasWidth={CANVAS_WIDTH}
            canvasHeight={CANVAS_HEIGHT}
          />
        </View>

        {/* Edit panel */}
        <View style={styles.editorPanel}>
          <View style={styles.tabHeader}>
            {TABS.map((tab) => (
              <PressableScale
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                scaleTo={0.94}
                style={[styles.tabItem, activeTab === tab.key && styles.activeTabItem]}
                contentStyle={styles.tabItemContent}
              >
                <Ionicons
                  name={tab.icon}
                  size={18}
                  color={activeTab === tab.key ? COLORS.orange : COLORS.inkMuted}
                />
                <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                  {tab.label}
                </Text>
              </PressableScale>
            ))}
          </View>

          <View style={styles.tabContent}>
            {activeTab === 'photo' && (
              <AppButton
                title={userPhotoUri ? 'Change Selected Photo' : 'Select Photo from Gallery'}
                onPress={handlePickPhoto}
                style={{ height: 48 }}
              />
            )}

            {activeTab === 'text' && (
              <View>
                <Text style={styles.inputLabel}>Personalized Name</Text>
                <TextInput
                  value={userNameText}
                  onChangeText={setUserNameText}
                  placeholder="Enter your name"
                  placeholderTextColor={COLORS.inkFaint}
                  style={styles.textInput}
                />
              </View>
            )}

            {activeTab === 'frames' && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalOptions}>
                <PressableScale
                  onPress={() => setSelectedFrame(null)}
                  scaleTo={0.93}
                  style={[styles.optionChip, !selectedFrame && styles.selectedOptionChip]}
                  contentStyle={styles.chipContent}
                >
                  <Text style={[styles.optionChipText, !selectedFrame && styles.selectedOptionChipText]}>None</Text>
                </PressableScale>
                {frames
                  .filter((f) => {
                    if (!activeTemplate?.categoryId?._id && !activeTemplate?.categoryId) return true;
                    const catId = activeTemplate.categoryId?._id || activeTemplate.categoryId;
                    return !f.category || f.category._id === catId || f.category === catId;
                  })
                  .map((f) => (
                    <PressableScale
                      key={f._id}
                      onPress={() => setSelectedFrame(f)}
                      scaleTo={0.93}
                      style={[styles.optionChip, selectedFrame?._id === f._id && styles.selectedOptionChip]}
                      contentStyle={styles.chipContent}
                    >
                      <Text style={[styles.optionChipText, selectedFrame?._id === f._id && styles.selectedOptionChipText]}>
                        {f.name}
                      </Text>
                    </PressableScale>
                  ))}
              </ScrollView>
            )}

            {activeTab === 'effects' && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalOptions}>
                <PressableScale
                  onPress={() => setSelectedEffect(null)}
                  scaleTo={0.93}
                  style={[styles.optionChip, !selectedEffect && styles.selectedOptionChip]}
                  contentStyle={styles.chipContent}
                >
                  <Text style={[styles.optionChipText, !selectedEffect && styles.selectedOptionChipText]}>None</Text>
                </PressableScale>
                {effects.map((ef) => (
                  <PressableScale
                    key={ef._id}
                    onPress={() => setSelectedEffect(ef)}
                    scaleTo={0.93}
                    style={[styles.optionChip, selectedEffect?._id === ef._id && styles.selectedOptionChip]}
                    contentStyle={styles.chipContent}
                  >
                    <Text style={[styles.optionChipText, selectedEffect?._id === ef._id && styles.selectedOptionChipText]}>
                      {ef.name}
                    </Text>
                  </PressableScale>
                ))}
              </ScrollView>
            )}
          </View>

          <AppButton
            title="Proceed to Full Screen Preview"
            onPress={handleProceedToPreview}
            style={{ marginTop: hp(0.02) }}
          />
        </View>
      </View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.inkMuted,
    fontSize: fontScale(14),
    fontFamily: FONTS.medium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(0.05),
    paddingVertical: hp(0.012),
  },
  headerBtn: {
    width: wp(0.105),
    height: wp(0.105),
    borderRadius: wp(0.032),
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },
  iconContent: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  templateTitle: {
    color: COLORS.ink,
    fontSize: fontScale(15),
    fontFamily: FONTS.bold,
    maxWidth: wp(0.46),
    textAlign: 'center',
  },
  previewBtn: {
    backgroundColor: COLORS.orange,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    elevation: 3,
    shadowColor: COLORS.orangeDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  previewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  previewBtnText: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: fontScale(12),
  },
  canvasContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 6,
  },
  editorPanel: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: wp(0.05),
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingBottom: hp(0.025),
  },
  tabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 14,
    padding: 4,
    marginBottom: 14,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 11,
  },
  tabItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  activeTabItem: {
    backgroundColor: COLORS.surface,
    shadowColor: COLORS.orangeDeep,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  tabText: {
    color: COLORS.inkMuted,
    fontFamily: FONTS.semibold,
    fontSize: fontScale(11.5),
  },
  activeTabText: {
    color: COLORS.orange,
  },
  tabContent: {
    minHeight: 48,
    justifyContent: 'center',
  },
  inputLabel: {
    color: COLORS.inkMuted,
    fontSize: fontScale(10.5),
    fontFamily: FONTS.semibold,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  textInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.borderStrong,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    color: COLORS.ink,
    fontSize: fontScale(13),
    fontFamily: FONTS.medium,
  },
  horizontalOptions: {
    gap: 8,
    paddingVertical: 4,
  },
  optionChip: {
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1.5,
    borderColor: COLORS.borderStrong,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  chipContent: {
    justifyContent: 'center',
  },
  selectedOptionChip: {
    borderColor: COLORS.orange,
    backgroundColor: COLORS.orangeTint,
  },
  optionChipText: {
    color: COLORS.ink,
    fontSize: fontScale(11.5),
    fontFamily: FONTS.semibold,
  },
  selectedOptionChipText: {
    color: COLORS.orange,
  },
});
