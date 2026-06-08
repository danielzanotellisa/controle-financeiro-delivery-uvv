import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '../styles';

export function StatusApiBox({ apiConfigurada, origemDados, mensagemApi }) {
  let titulo = 'Dados atualizados';
  let descricao = 'Suas informações estão prontas para consulta.';
  let destaque = 'Sincronizado';

  if (!apiConfigurada) {
    titulo = 'Modo demonstração';
    descricao = 'O app está exibindo exemplos fictícios até a API ser configurada.';
    destaque = 'Exemplos';
  }

  if (origemDados === 'api-vazia') {
    titulo = 'Modo demonstração';
    descricao = 'A API ainda não tem lançamentos. Por isso, estes exemplos são fictícios. Cadastre um lançamento para exibir dados reais salvos na API.';
    destaque = 'Exemplos';
  }

  if (origemDados === 'erro') {
    titulo = 'Exemplos temporários';
    descricao = 'Não foi possível atualizar agora. Estes dados são apenas para demonstração.';
    destaque = 'Offline';
  }

  return (
    <View style={styles.syncBox}>
      <View style={styles.syncPill}>
        <Text style={styles.syncPillText}>{destaque}</Text>
      </View>
      <Text style={styles.syncTitle}>{titulo}</Text>
      <Text style={styles.syncText}>{mensagemApi || descricao}</Text>
    </View>
  );
}
