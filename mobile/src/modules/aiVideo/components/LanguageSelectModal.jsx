import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fontScale } from '../../../utils/responsive';
import { LANGUAGES } from '../constants';
import { styles } from '../styles';

export default function LanguageSelectModal({
  visible,
  currentLanguage,
  title,
  onClose,
  onSelectLanguage,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.langModalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.langModalCard}>
          <View style={styles.langModalHeader}>
            <Text style={styles.langModalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={fontScale(20)} color="#111827" />
            </TouchableOpacity>
          </View>
          {LANGUAGES.map((lang) => {
            const isSelected = currentLanguage === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.langItem,
                  isSelected && styles.langItemSelected,
                ]}
                onPress={() => onSelectLanguage(lang.code)}
              >
                <Text style={[styles.langText, isSelected && styles.langTextSelected]}>
                  {lang.native} ({lang.name})
                </Text>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={fontScale(18)} color="#EE1D24" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
