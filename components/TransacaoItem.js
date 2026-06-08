import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles';

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function TransacaoItem({ item, onPress }) {
  const { tipo, descricao, categoria, loja, valor, data } = item;
  const isEntrada = tipo === 'entrada';

  return (
    <TouchableOpacity style={styles.transactionItem} onPress={onPress} activeOpacity={0.82}>
      <View style={styles.transactionHeader}>
        <View style={[styles.typeBadge, isEntrada ? styles.badgeEntrada : styles.badgeSaida]}>
          <Text style={styles.typeBadgeText}>{isEntrada ? 'Entrada' : 'Saída'}</Text>
        </View>
        <Text style={[styles.transactionValue, isEntrada ? styles.textEntrada : styles.textSaida]}>
          {isEntrada ? '+' : '-'} {formatarMoeda(valor)}
        </Text>
      </View>
      <Text style={styles.transactionTitle}>{descricao}</Text>
      <Text style={styles.transactionMeta}>{categoria} • {loja}</Text>
      <Text style={styles.transactionDate}>Registrado em {data}</Text>
    </TouchableOpacity>
  );
}
