import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PressableScale from './PressableScale';
import { COLORS, FONTS } from '../constants/colors';
import { fontScale, hp, SCREEN_PAD } from '../utils/responsive';
import { hapticTap } from '../utils/haptics';

const SHARE_OPTIONS = [
  { id: 'whatsapp', name: 'WhatsApp', sub: 'Status', icon: 'logo-whatsapp', bg: '#25D366', color: '#FFF' },
  { id: 'instagram', name: 'Instagram', sub: 'Story', icon: 'logo-instagram', bg: '#E1306C', color: '#FFF' },
  { id: 'facebook', name: 'Facebook', sub: 'Story', icon: 'logo-facebook', bg: '#1877F2', color: '#FFF' },
  { id: 'snapchat', name: 'Snapchat', sub: 'Snap', icon: 'ghost', bg: '#FFFC00', color: '#000' },
  { id: 'twitter', name: 'X / Twitter', sub: 'Post', icon: 'logo-twitter', bg: '#1DA1F2', color: '#FFF' },
  { id: 'more', name: 'More Apps', sub: 'System Share', icon: 'share-social', bg: COLORS.orange, color: '#FFF' },
];

export default function ShareModal({ visible, onClose, onShareOption }) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.contentCard} onPress={(e) => e.stopPropagation()}>
          {/* Top Grab Bar Handle */}
          <View style={styles.handle} />

          {/* Modal Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Share to Story</Text>
              <Text style={styles.subtitle}>Select app to share your status</Text>
            </View>
            <PressableScale onPress={onClose} scaleTo={0.88} style={styles.closeBtn} contentStyle={styles.centerContent}>
              <Ionicons name="close" size={18} color={COLORS.inkMuted} />
            </PressableScale>
          </View>

          {/* Social Media Grid */}
          <View style={styles.grid}>
            {SHARE_OPTIONS.map((item) => (
              <PressableScale
                key={item.id}
                onPress={() => {
                  hapticTap();
                  onShareOption(item);
                }}
                scaleTo={0.92}
                style={styles.gridItem}
                contentStyle={styles.itemContent}
              >
                <View style={[styles.iconCircle, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon} size={28} color={item.color} />
                </View>
                <Text style={styles.itemTitle} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemSub} numberOfLines={1}>{item.sub}</Text>
              </PressableScale>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  contentCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: SCREEN_PAD,
    paddingTop: 12,
    paddingBottom: hp(0.04),
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  handle: {
    width: 38,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: COLORS.borderStrong,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    color: COLORS.ink,
    fontSize: fontScale(18),
    fontFamily: FONTS.extrabold,
  },
  subtitle: {
    color: COLORS.inkMuted,
    fontSize: fontScale(12),
    fontFamily: FONTS.medium,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surfaceAlt,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    rowGap: 20,
    columnGap: 10,
  },
  gridItem: {
    width: '28%',
    alignItems: 'center',
  },
  itemContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    marginBottom: 8,
  },
  itemTitle: {
    color: COLORS.ink,
    fontSize: fontScale(12),
    fontFamily: FONTS.bold,
    textAlign: 'center',
  },
  itemSub: {
    color: COLORS.inkMuted,
    fontSize: fontScale(9.5),
    fontFamily: FONTS.medium,
    textAlign: 'center',
    marginTop: 1,
  },
});
