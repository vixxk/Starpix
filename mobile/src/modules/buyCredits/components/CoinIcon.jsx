import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fontScale } from '../../../utils/responsive';
import { styles } from '../styles';

export default function CoinIcon({ type }) {
  if (type === 'gift') {
    return (
      <View style={styles.coinStackWrap}>
        <View style={styles.coinCircleS}>
          <Text style={styles.coinSymbolText}>S</Text>
        </View>
        <View style={styles.giftBadge}>
          <MaterialCommunityIcons name="gift-outline" size={fontScale(11)} color="#FFFFFF" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.coinStackWrap}>
      <View style={styles.coinLayerBack} />
      <View style={styles.coinLayerMid} />
      <View style={styles.coinCircleB}>
        <Text style={styles.coinSymbolText}>B</Text>
      </View>
    </View>
  );
}
