import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '../styles';

export function CardResumo({ titulo, valor, descricao }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>{titulo}</Text>
      <Text style={styles.summaryValue}>{valor}</Text>
      <Text style={styles.summaryDescription}>{descricao}</Text>
    </View>
  );
}
