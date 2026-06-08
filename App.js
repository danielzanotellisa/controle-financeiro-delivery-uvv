import 'react-native-gesture-handler';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';
import { Picker } from '@react-native-picker/picker';

import { styles } from './styles';
import { apiService, apiEstaConfigurada } from './services/api';
import { Campo } from './components/Campo';
import { BotaoPrincipal } from './components/BotaoPrincipal';
import { BotaoSecundario } from './components/BotaoSecundario';
import { CardResumo } from './components/CardResumo';
import { StatusApiBox } from './components/StatusApiBox';
import { TransacaoItem } from './components/TransacaoItem';

const Drawer = createDrawerNavigator();
const AppContext = createContext({});

function useApp() {
  return useContext(AppContext);
}

function AppProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [transacoes, setTransacoes] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [mensagemApi, setMensagemApi] = useState('');
  const [origemDados, setOrigemDados] = useState('local');

  async function carregarTransacoes() {
    setCarregando(true);
    const respostaGet = await apiService.getTransacoes();
    setTransacoes(respostaGet.dados);
    setOrigemDados(respostaGet.origem);
    setMensagemApi(respostaGet.mensagem);
    setCarregando(false);
  }

  useEffect(() => {
    carregarTransacoes();
  }, []);

  function cadastrarUsuario(dadosUsuario) {
    setUsuario(dadosUsuario);
  }

  async function adicionarTransacao(novaTransacao) {
    const respostaPost = await apiService.postTransacao(novaTransacao);

    // Quando o lançamento é salvo na API, atualizamos a lista com um novo GET.
    // Assim o app não mistura exemplos fictícios com dados reais.
    if (respostaPost.origem === 'api') {
      const respostaAtualizada = await apiService.getTransacoes();
      setTransacoes(respostaAtualizada.dados);
      setOrigemDados(respostaAtualizada.origem);
      setMensagemApi('Lançamento salvo. A lista foi atualizada com os dados reais da API.');

      return {
        ...respostaPost,
        mensagem: 'Lançamento salvo com sucesso. Os dados reais foram atualizados pela API.',
      };
    }

    // Se a API falhar ou não estiver configurada, mantém o app funcional em modo temporário.
    if (origemDados === 'api-vazia' || origemDados === 'local' || origemDados === 'erro') {
      setTransacoes([respostaPost.transacao]);
    } else {
      setTransacoes((listaAtual) => [respostaPost.transacao, ...listaAtual]);
    }

    setOrigemDados(respostaPost.origem);
    setMensagemApi(respostaPost.mensagem);
    return respostaPost;
  }

  return (
    <AppContext.Provider
      value={{
        usuario,
        cadastrarUsuario,
        transacoes,
        adicionarTransacao,
        carregarTransacoes,
        carregando,
        mensagemApi,
        origemDados,
        apiConfigurada: apiEstaConfigurada(),
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function CadastroScreen({ navigation }) {
  const { cadastrarUsuario } = useApp();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState('');

  function salvarCadastro() {
    if (!nome.trim() || !email.trim() || !telefone.trim() || !senha.trim() || !confirmarSenha.trim()) {
      setErro('Preencha todos os campos para continuar.');
      return;
    }

    if (!validarEmail(email)) {
      setErro('Digite um e-mail válido.');
      return;
    }

    if (telefone.replace(/\D/g, '').length < 10) {
      setErro('Digite um telefone válido com DDD.');
      return;
    }

    if (senha.length < 6) {
      setErro('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    if (senha !== confirmarSenha) {
      setErro('As senhas não conferem.');
      return;
    }

    cadastrarUsuario({ nome, email, telefone });
    setErro('');
    Alert.alert('Conta criada', 'Seu cadastro foi salvo com sucesso.');
    navigation.navigate('Início');
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.pageEyebrow}>Bem-vindo</Text>
        <Text style={styles.pageTitle}>Criar conta</Text>
        <Text style={styles.pageSubtitle}>
          Informe seus dados para acessar o controle financeiro do delivery.
        </Text>

        <Campo label="Nome completo *" value={nome} onChangeText={setNome} placeholder="Ex: João Silva" />
        <Campo label="E-mail *" value={email} onChangeText={setEmail} placeholder="email@exemplo.com" keyboardType="email-address" />
        <Campo label="Telefone *" value={telefone} onChangeText={setTelefone} placeholder="(21) 99999-9999" keyboardType="phone-pad" />
        <Campo label="Senha *" value={senha} onChangeText={setSenha} placeholder="Mínimo de 6 caracteres" secureTextEntry />
        <Campo label="Confirmar senha *" value={confirmarSenha} onChangeText={setConfirmarSenha} placeholder="Repita sua senha" secureTextEntry />

        {erro ? <Text style={styles.errorText}>{erro}</Text> : null}

        <BotaoPrincipal onPress={salvarCadastro}>Entrar no painel</BotaoPrincipal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function TelaCadastroObrigatorio({ navigation }) {
  return (
    <View style={styles.centerBox}>
      <Text style={styles.pageEyebrow}>Acesso protegido</Text>
      <Text style={styles.pageTitle}>Crie sua conta</Text>
      <Text style={styles.pageSubtitle}>
        Para acessar o painel financeiro, cadastre seus dados primeiro.
      </Text>
      <BotaoPrincipal onPress={() => navigation.navigate('Minha conta')}>
        Fazer cadastro
      </BotaoPrincipal>
    </View>
  );
}

function DashboardScreen({ navigation }) {
  const {
    usuario,
    transacoes,
    carregarTransacoes,
    carregando,
    mensagemApi,
    origemDados,
    apiConfigurada,
  } = useApp();

  const resumo = useMemo(() => {
    const entradas = transacoes
      .filter((item) => item.tipo === 'entrada')
      .reduce((total, item) => total + Number(item.valor), 0);

    const saidas = transacoes
      .filter((item) => item.tipo === 'saida')
      .reduce((total, item) => total + Number(item.valor), 0);

    return {
      entradas,
      saidas,
      saldo: entradas - saidas,
      quantidade: transacoes.length,
    };
  }, [transacoes]);

  if (!usuario) {
    return <TelaCadastroObrigatorio navigation={navigation} />;
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.pageEyebrow}>Painel financeiro</Text>
      <Text style={styles.pageTitle}>Visão geral</Text>
      <Text style={styles.pageSubtitle}>
        {usuario ? `Olá, ${usuario.nome}. Aqui está o resumo do seu caixa.` : 'Acompanhe o caixa do seu delivery em poucos segundos.'}
      </Text>

      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>Saldo disponível</Text>
        <Text style={styles.heroValue}>{formatarMoeda(resumo.saldo)}</Text>
        <Text style={styles.heroText}>Resultado entre entradas e saídas registradas.</Text>
      </View>

      <StatusApiBox
        apiConfigurada={apiConfigurada}
        origemDados={origemDados}
        mensagemApi={mensagemApi}
      />

      {carregando ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color="#111827" />
          <Text style={styles.loadingText}>Atualizando informações...</Text>
        </View>
      ) : null}

      <View style={styles.summaryGrid}>
        <CardResumo titulo="Entradas" valor={formatarMoeda(resumo.entradas)} descricao="Total recebido" />
        <CardResumo titulo="Saídas" valor={formatarMoeda(resumo.saidas)} descricao="Total pago" />
        <CardResumo titulo="Lançamentos" valor={String(resumo.quantidade)} descricao="Movimentações registradas" />
      </View>

      <BotaoSecundario onPress={carregarTransacoes}>Atualizar painel</BotaoSecundario>
    </ScrollView>
  );
}

function TransacoesScreen({ navigation }) {
  const { usuario, transacoes, carregarTransacoes, carregando } = useApp();
  const [filtroTipo, setFiltroTipo] = useState('todas');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');

  const categorias = useMemo(() => {
    const lista = transacoes.map((item) => item.categoria).filter(Boolean);
    return ['todas', ...new Set(lista)];
  }, [transacoes]);

  const transacoesFiltradas = useMemo(() => {
    return transacoes.filter((item) => {
      const filtroPorTipo = filtroTipo === 'todas' || item.tipo === filtroTipo;
      const filtroPorCategoria = filtroCategoria === 'todas' || item.categoria === filtroCategoria;
      return filtroPorTipo && filtroPorCategoria;
    });
  }, [transacoes, filtroTipo, filtroCategoria]);

  if (!usuario) {
    return <TelaCadastroObrigatorio navigation={navigation} />;
  }

  return (
    <View style={styles.screen}>
      <View style={styles.transacoesContainer}>
        <Text style={styles.pageEyebrow}>Histórico</Text>
        <Text style={styles.pageTitle}>Movimentações</Text>
        <Text style={styles.pageSubtitle}>Veja tudo que entrou e saiu do caixa.</Text>

        <View style={styles.filtersCard}>
          <View style={styles.filterRow}>
            <View style={styles.filterBox}>
              <Text style={styles.filterLabel}>Tipo</Text>
              <View style={styles.pickerInput}>
                <Picker
                  selectedValue={filtroTipo}
                  onValueChange={(value) => setFiltroTipo(value)}
                  style={styles.picker}
                  dropdownIconColor="#111827"
                >
                  <Picker.Item label="Todas" value="todas" />
                  <Picker.Item label="Entradas" value="entrada" />
                  <Picker.Item label="Saídas" value="saida" />
                </Picker>
              </View>
            </View>

            <View style={styles.filterBox}>
              <Text style={styles.filterLabel}>Categoria</Text>
              <View style={styles.pickerInput}>
                <Picker
                  selectedValue={filtroCategoria}
                  onValueChange={(value) => setFiltroCategoria(value)}
                  style={styles.picker}
                  dropdownIconColor="#111827"
                >
                  {categorias.map((categoria) => (
                    <Picker.Item
                      key={categoria}
                      label={categoria === 'todas' ? 'Todas' : categoria}
                      value={categoria}
                    />
                  ))}
                </Picker>
              </View>
            </View>
          </View>
        </View>

        <FlatList
          style={styles.listaTransacoes}
          data={transacoesFiltradas}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={carregando}
          onRefresh={carregarTransacoes}
          refreshControl={
            <RefreshControl refreshing={carregando} onRefresh={carregarTransacoes} colors={["#111827"]} />
          }
          renderItem={({ item }) => (
            <TransacaoItem
              item={item}
              onPress={() => navigation.navigate('Detalhes do lançamento', { transacao: item })}
            />
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma movimentação encontrada.</Text>}
        />
      </View>
    </View>
  );
}

function NovaTransacaoScreen({ navigation }) {
  const { usuario, adicionarTransacao, carregando } = useApp();
  const [tipo, setTipo] = useState('entrada');
  const [descricao, setDescricao] = useState('');
  const [pagoPara, setPagoPara] = useState('');
  const [loja, setLoja] = useState('');
  const [categoria, setCategoria] = useState('');
  const [conta, setConta] = useState('');
  const [valor, setValor] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  if (!usuario) {
    return <TelaCadastroObrigatorio navigation={navigation} />;
  }

  async function salvarTransacao() {
    if (!descricao.trim() || !pagoPara.trim() || !loja.trim() || !categoria.trim() || !conta.trim() || !valor.trim()) {
      setErro('Preencha todos os campos do lançamento.');
      return;
    }

    const valorNumerico = Number(valor.replace(',', '.'));

    if (Number.isNaN(valorNumerico) || valorNumerico <= 0) {
      setErro('Digite um valor válido maior que zero.');
      return;
    }

    setSalvando(true);

    const respostaPost = await adicionarTransacao({
      tipo,
      descricao,
      pagoPara,
      loja,
      categoria,
      conta,
      valor: valorNumerico,
    });

    setSalvando(false);
    setTipo('entrada');
    setDescricao('');
    setPagoPara('');
    setLoja('');
    setCategoria('');
    setConta('');
    setValor('');
    setErro('');

    Alert.alert('Lançamento salvo', respostaPost.mensagem);
    navigation.navigate('Movimentações');
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.pageEyebrow}>Novo registro</Text>
        <Text style={styles.pageTitle}>Novo lançamento</Text>
        <Text style={styles.pageSubtitle}>Registre uma entrada ou saída do seu caixa.</Text>

        <View style={styles.pickerBox}>
          <Text style={styles.filterLabel}>Tipo</Text>
          <View style={styles.pickerInput}>
            <Picker
              selectedValue={tipo}
              onValueChange={(value) => setTipo(value)}
              style={styles.picker}
              dropdownIconColor="#111827"
            >
              <Picker.Item label="Entrada" value="entrada" />
              <Picker.Item label="Saída" value="saida" />
            </Picker>
          </View>
        </View>

        <Campo label="Descrição *" value={descricao} onChangeText={setDescricao} placeholder="Ex: Venda do dia" />
        <Campo label="Cliente ou fornecedor *" value={pagoPara} onChangeText={setPagoPara} placeholder="Ex: Clientes" />
        <Campo label="Unidade *" value={loja} onChangeText={setLoja} placeholder="Ex: Restaurante Centro" />
        <Campo label="Categoria *" value={categoria} onChangeText={setCategoria} placeholder="Ex: Faturamento" />
        <Campo label="Conta *" value={conta} onChangeText={setConta} placeholder="Ex: Nubank" />
        <Campo label="Valor *" value={valor} onChangeText={setValor} placeholder="Ex: 150,00" keyboardType="decimal-pad" />

        {erro ? <Text style={styles.errorText}>{erro}</Text> : null}

        <BotaoPrincipal onPress={salvando || carregando ? undefined : salvarTransacao}>
          {salvando ? 'Salvando...' : 'Salvar lançamento'}
        </BotaoPrincipal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function DetalhesTransacaoScreen({ route, navigation }) {
  const { usuario } = useApp();
  const transacao = route.params?.transacao;

  if (!usuario) {
    return <TelaCadastroObrigatorio navigation={navigation} />;
  }

  if (!transacao) {
    return (
      <View style={styles.centerBox}>
        <Text style={styles.pageTitle}>Detalhes</Text>
        <Text style={styles.pageSubtitle}>Escolha uma movimentação para ver os detalhes.</Text>
      </View>
    );
  }

  const { tipo, descricao, pagoPara, loja, categoria, conta, valor, data, status } = transacao;
  const isEntrada = tipo === 'entrada';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.pageEyebrow}>Detalhamento</Text>
      <Text style={styles.pageTitle}>Lançamento</Text>
      <Text style={styles.pageSubtitle}>Confira as informações registradas.</Text>

      <View style={styles.detailCard}>
        <View style={[styles.typeBadge, isEntrada ? styles.badgeEntrada : styles.badgeSaida]}>
          <Text style={styles.typeBadgeText}>{isEntrada ? 'Entrada' : 'Saída'}</Text>
        </View>
        <Text style={styles.detailTitle}>{descricao}</Text>
        <Text style={[styles.detailValue, isEntrada ? styles.textEntrada : styles.textSaida]}>
          {isEntrada ? '+' : '-'} {formatarMoeda(valor)}
        </Text>
        <Text style={styles.detailLine}>Cliente ou fornecedor: {pagoPara}</Text>
        <Text style={styles.detailLine}>Unidade: {loja}</Text>
        <Text style={styles.detailLine}>Categoria: {categoria}</Text>
        <Text style={styles.detailLine}>Conta: {conta}</Text>
        <Text style={styles.detailLine}>Data: {data}</Text>
        <Text style={styles.detailLine}>Situação: {status === 'on' ? 'Confirmado' : 'Pendente'}</Text>
      </View>
    </ScrollView>
  );
}

function CustomDrawerContent(props) {
  const { usuario } = useApp();

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContainer}>
      <View style={styles.drawerHeader}>
        <Text style={styles.drawerAppName}>Finanças Delivery</Text>
        <Text style={styles.drawerUser}>{usuario ? usuario.nome : 'Acesso inicial'}</Text>
        <Text style={styles.drawerEmail}>{usuario ? usuario.email : 'Crie sua conta para liberar o painel'}</Text>
      </View>
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
}

function Routes() {
  return (
    <NavigationContainer>
      <Drawer.Navigator
        initialRouteName="Minha conta"
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTintColor: '#111827',
          headerTitleStyle: { fontWeight: '800' },
          headerShadowVisible: false,
          drawerActiveTintColor: '#111827',
          drawerInactiveTintColor: '#6B7280',
          drawerActiveBackgroundColor: '#EEF2FF',
          drawerLabelStyle: { fontWeight: '700' },
          drawerStyle: { backgroundColor: '#FFFFFF' },
        }}
      >
        <Drawer.Screen name="Minha conta" component={CadastroScreen} />
        <Drawer.Screen name="Início" component={DashboardScreen} />
        <Drawer.Screen name="Movimentações" component={TransacoesScreen} />
        <Drawer.Screen name="Novo lançamento" component={NovaTransacaoScreen} />
        <Drawer.Screen
          name="Detalhes do lançamento"
          component={DetalhesTransacaoScreen}
          options={{ drawerItemStyle: { display: 'none' } }}
        />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <SafeAreaView style={styles.safeArea}>
          <Routes />
        </SafeAreaView>
      </AppProvider>
    </GestureHandlerRootView>
  );
}
