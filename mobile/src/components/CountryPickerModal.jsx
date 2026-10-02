import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Rect, Circle } from 'react-native-svg';
import { fontScale, wp, hp } from '../utils/responsive';
import { FONTS } from '../constants/colors';
import { useTranslation } from 'react-i18next';
import { hapticTap } from '../utils/haptics';

export function IndiaFlagSvg({ width = 24, height = 16 }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 16">
      <Rect width="24" height="5.33" fill="#FF9933" />
      <Rect y="5.33" width="24" height="5.33" fill="#FFFFFF" />
      <Rect y="10.66" width="24" height="5.33" fill="#138808" />
      <Circle cx="12" cy="8" r="2.2" stroke="#000080" strokeWidth="0.8" fill="none" />
    </Svg>
  );
}

export const COUNTRIES = [
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳', minLen: 10, maxLen: 10 },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', minLen: 10, maxLen: 10 },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', minLen: 10, maxLen: 11 },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪', minLen: 9, maxLen: 9 },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦', minLen: 9, maxLen: 9 },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦', minLen: 10, maxLen: 10 },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺', minLen: 9, maxLen: 10 },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬', minLen: 8, maxLen: 8 },
  { code: 'MY', name: 'Malaysia', dialCode: '+60', flag: '🇲🇾', minLen: 9, maxLen: 10 },
  { code: 'BD', name: 'Bangladesh', dialCode: '+880', flag: '🇧🇩', minLen: 10, maxLen: 10 },
  { code: 'NP', name: 'Nepal', dialCode: '+977', flag: '🇳🇵', minLen: 10, maxLen: 10 },
  { code: 'LK', name: 'Sri Lanka', dialCode: '+94', flag: '🇱🇰', minLen: 9, maxLen: 9 },
  { code: 'QA', name: 'Qatar', dialCode: '+974', flag: '🇶🇦', minLen: 8, maxLen: 8 },
  { code: 'KW', name: 'Kuwait', dialCode: '+965', flag: '🇰🇼', minLen: 8, maxLen: 8 },
  { code: 'OM', name: 'Oman', dialCode: '+968', flag: '🇴🇲', minLen: 8, maxLen: 8 },
  { code: 'BH', name: 'Bahrain', dialCode: '+973', flag: '🇧🇭', minLen: 8, maxLen: 8 },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪', minLen: 10, maxLen: 11 },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷', minLen: 9, maxLen: 9 },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', flag: '🇳🇿', minLen: 8, maxLen: 10 },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦', minLen: 9, maxLen: 9 },
  { code: 'PH', name: 'Philippines', dialCode: '+63', flag: '🇵🇭', minLen: 10, maxLen: 10 },
  { code: 'ID', name: 'Indonesia', dialCode: '+62', flag: '🇮🇩', minLen: 9, maxLen: 12 },
  { code: 'PK', name: 'Pakistan', dialCode: '+92', flag: '🇵🇰', minLen: 10, maxLen: 10 },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵', minLen: 10, maxLen: 10 },
  { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷', minLen: 9, maxLen: 11 },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹', minLen: 9, maxLen: 10 },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸', minLen: 9, maxLen: 9 },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱', minLen: 9, maxLen: 9 },
  { code: 'CH', name: 'Switzerland', dialCode: '+41', flag: '🇨🇭', minLen: 9, maxLen: 9 },
  { code: 'SE', name: 'Sweden', dialCode: '+46', flag: '🇸🇪', minLen: 7, maxLen: 10 },
  { code: 'NO', name: 'Norway', dialCode: '+47', flag: '🇳🇴', minLen: 8, maxLen: 8 },
  { code: 'DK', name: 'Denmark', dialCode: '+45', flag: '🇩🇰', minLen: 8, maxLen: 8 },
  { code: 'IE', name: 'Ireland', dialCode: '+353', flag: '🇮🇪', minLen: 9, maxLen: 9 },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷', minLen: 10, maxLen: 11 },
  { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽', minLen: 10, maxLen: 10 },
  { code: 'RU', name: 'Russia', dialCode: '+7', flag: '🇷🇺', minLen: 10, maxLen: 10 },
  { code: 'TR', name: 'Turkey', dialCode: '+90', flag: '🇹🇷', minLen: 10, maxLen: 10 },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬', minLen: 10, maxLen: 10 },
  { code: 'KE', name: 'Kenya', dialCode: '+254', flag: '🇰🇪', minLen: 9, maxLen: 9 },
  { code: 'EG', name: 'Egypt', dialCode: '+20', flag: '🇪🇬', minLen: 10, maxLen: 10 },
];

export default function CountryPickerModal({
  visible,
  onClose,
  selectedCountry,
  onSelectCountry,
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');

  const filteredCountries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [search]);

  const handleSelect = (country) => {
    hapticTap();
    onSelectCountry(country);
    setSearch('');
    onClose();
  };

  const handleClose = () => {
    setSearch('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View
          style={[
            styles.sheetContainer,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          {/* Sheet Handle */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{t('auth_select_country')}</Text>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={fontScale(22)} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Search Box */}
          <View style={styles.searchBox}>
            <Ionicons name="search" size={fontScale(18)} color="#9CA3AF" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={t('auth_search_country')}
              placeholderTextColor="#9CA3AF"
              style={styles.searchInput}
              clearButtonMode="while-editing"
              autoCorrect={false}
            />
            {search.length > 0 && Platform.OS !== 'ios' && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={fontScale(18)} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Country List */}
          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.code}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isSelected = selectedCountry?.code === item.code;
              return (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleSelect(item)}
                  style={[
                    styles.countryItem,
                    isSelected && styles.countryItemSelected,
                  ]}
                >
                  <View style={styles.flagWrapper}>
                    {item.code === 'IN' ? (
                      <IndiaFlagSvg width={22} height={15} />
                    ) : (
                      <Text style={styles.flagText}>{item.flag}</Text>
                    )}
                  </View>
                  <Text style={styles.countryName}>{item.name}</Text>
                  <Text style={styles.countryDialCode}>{item.dialCode}</Text>
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={fontScale(18)}
                      color="#EE1D24"
                      style={styles.checkIcon}
                    />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: hp(0.8),
    minHeight: hp(0.5),
    paddingTop: 12,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(0.05),
    paddingBottom: hp(0.012),
  },
  title: {
    fontSize: fontScale(17),
    fontFamily: FONTS.bold,
    color: '#111827',
  },
  closeBtn: {
    padding: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    marginHorizontal: wp(0.05),
    paddingHorizontal: wp(0.035),
    height: hp(0.052),
    borderRadius: 12,
    marginBottom: hp(0.012),
    gap: wp(0.02),
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: fontScale(14),
    fontFamily: FONTS.medium,
    color: '#111827',
  },
  listContent: {
    paddingHorizontal: wp(0.05),
    paddingBottom: hp(0.02),
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(0.016),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  countryItemSelected: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    paddingHorizontal: wp(0.02),
  },
  flagWrapper: {
    width: 26,
    height: 18,
    borderRadius: 3,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(0.03),
  },
  flagText: {
    fontSize: fontScale(18),
    includeFontPadding: false,
    textAlign: 'center',
  },
  countryName: {
    flex: 1,
    fontSize: fontScale(14.5),
    fontFamily: FONTS.medium,
    color: '#1F2937',
  },
  countryDialCode: {
    fontSize: fontScale(14),
    fontFamily: FONTS.semibold,
    color: '#6B7280',
    marginRight: wp(0.02),
  },
  checkIcon: {
    marginLeft: wp(0.01),
  },
});
