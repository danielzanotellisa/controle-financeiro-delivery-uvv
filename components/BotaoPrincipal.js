import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles';

export function BotaoPrincipal({ children, onPress }) {
  return (
    <TouchableOpacity style={styles.primaryButton} onPress={onPress} activeOpacity={0.85}>
      <Text style={styles.primaryButtonText}>{children}</Text>
    </TouchableOpacity>
  );
}
