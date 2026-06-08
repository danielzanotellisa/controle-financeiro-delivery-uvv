import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles';

export function BotaoSecundario({ children, onPress }) {
  return (
    <TouchableOpacity style={styles.secondaryButton} onPress={onPress} activeOpacity={0.85}>
      <Text style={styles.secondaryButtonText}>{children}</Text>
    </TouchableOpacity>
  );
}
