import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { COLORS, FONTS } from '../constants/colors';
import { fontScale, wp, hp } from '../utils/responsive';
import { hapticTap } from '../utils/haptics';

export default function AllCategoriesModal({
  visible,
  categories = [],
  activeCategoryId,
  onSelectCategory,
  onClose,
}) {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={() => {
            hapticTap();
            onClose();
          }}
        />

        <View
          style={[
            styles.sheetContainer,
            { paddingBottom: Math.max(insets.bottom, 16) + 12 },
          ]}
        >
          {/* Top Handle */}
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleWrap}>
              <Ionicons name="grid" size={18} color="#9F1239" style={{ marginRight: 8 }} />
              <Text style={styles.headerTitle}>
                {t('all_categories_popup') || t('all_categories') || 'All Categories'}
              </Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{categories.length}</Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                hapticTap();
                onClose();
              }}
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={18} color="#4B5563" />
            </TouchableOpacity>
          </View>

          {/* Category Chips Container */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.chipsWrap}>
              {categories.map((cat) => {
                const isSelected = activeCategoryId === cat.id || activeCategoryId === cat.slug;
                const label =
                  (cat.nameTranslations && cat.nameTranslations[i18n.language]) ||
                  (cat.labelKey && i18n.exists(cat.labelKey) ? t(cat.labelKey) : (cat.name || cat.id));

                return (
                  <TouchableOpacity
                    key={cat.id || cat._id}
                    activeOpacity={0.75}
                    onPress={() => {
                      hapticTap();
                      onSelectCategory(cat.id || cat.slug);
                      onClose();
                    }}
                    style={[
                      styles.categoryCard,
                      isSelected && styles.categoryCardActive,
                      cat.isSpecial && !isSelected && styles.categoryCardSpecial,
                    ]}
                  >
                    {cat.icon ? (
                      <Text style={styles.cardIcon}>{cat.icon}</Text>
                    ) : null}
                    <Text
                      style={[
                        styles.cardText,
                        isSelected && styles.cardTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {label}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color="#FFFFFF"
                        style={{ marginLeft: 4 }}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingHorizontal: wp(0.045),
    maxHeight: hp(0.72),
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  dragHandle: {
    width: 38,
    height: 4.5,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontScale(16),
    fontFamily: FONTS.bold,
    color: '#0F172A',
  },
  countBadge: {
    backgroundColor: '#FFE4E6',
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginLeft: 8,
  },
  countBadgeText: {
    fontSize: fontScale(11),
    fontFamily: FONTS.bold,
    color: '#9F1239',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollArea: {
    marginTop: 12,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 22,
    paddingHorizontal: 13,
    paddingVertical: 8,
    gap: 6,
  },
  categoryCardActive: {
    backgroundColor: '#9F1239',
    borderColor: '#9F1239',
    shadowColor: '#9F1239',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryCardSpecial: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
  },
  cardIcon: {
    fontSize: fontScale(14),
  },
  cardText: {
    fontSize: fontScale(13),
    fontFamily: FONTS.semiBold,
    color: '#334155',
  },
  cardTextActive: {
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
  },
});
