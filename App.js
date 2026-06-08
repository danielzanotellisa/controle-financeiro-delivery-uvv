import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { styles } from './styles';
import { apiService, apiEstaConfigurada, contaMock } from './services/api';
import { Campo } from './components/Campo';
import { BotaoPrincipal } from './components/BotaoPrincipal';
import { BotaoSecundario } from './components/BotaoSecundario';
import { CardResumo } from './components/CardResumo';
import { StatusApiBox } from './components/StatusApiBox';
import { TransacaoItem } from './components/TransacaoItem';

const AppContext = createContext({});

function useApp() {
  return useContext(AppContext);
}

function AppProvider({ children }) {
  const [autenticado, setAutenticado] = useState(false);
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

  async function loginComMock(usuarioInput, senhaInput) {
    if (usuarioInput === contaMock.usuario && senhaInput === contaMock.senha) {
      setUsuario({ nome: contaMock.nome, email: contaMock.email, telefone: contaMock.telefone });
      setAutenticado(true);
      carregarTransacoes();
      return true;
    }
    return false;
  }

  function cadastrarUsuario(dadosUsuario) {
    setUsuario(dadosUsuario);
    if (!autenticado) {
      setAutenticado(true);
      setTransacoes([]);
      setMensagemApi('Nova conta criada. Registre seu primeiro lançamento.');
    }
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
        autenticado,
        usuario,
        loginComMock,
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
  const { cadastrarUsuario, usuario } = useApp();
  const estaLogado = !!usuario;
  const [nome, setNome] = useState(usuario?.nome || '');
  const [email, setEmail] = useState(usuario?.email || '');
  const [telefone, setTelefone] = useState(usuario?.telefone || '');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (usuario) {
      setNome(usuario.nome || '');
      setEmail(usuario.email || '');
      setTelefone(usuario.telefone || '');
    }
  }, [usuario]);

  function salvarCadastro() {
    if (!nome.trim() || !email.trim() || !telefone.trim()) {
      setErro('Preencha nome, e-mail e telefone para continuar.');
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

    if (!estaLogado) {
      if (!senha.trim() || !confirmarSenha.trim()) {
        setErro('Preencha todos os campos para continuar.');
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
    }

    cadastrarUsuario({ nome, email, telefone });
    setErro('');
    if (estaLogado) {
      Alert.alert('Dados atualizados', 'Suas informações foram atualizadas com sucesso.');
    } else {
      Alert.alert('Conta criada', 'Seu cadastro foi salvo com sucesso.');
      navigation.navigate('Início');
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.pageEyebrow}>{estaLogado ? 'Minha conta' : 'Bem-vindo'}</Text>
        <Text style={styles.pageTitle}>{estaLogado ? 'Meus dados' : 'Criar conta'}</Text>
        <Text style={styles.pageSubtitle}>
          {estaLogado
            ? 'Confira ou atualize as informações da sua conta.'
            : 'Informe seus dados para acessar o controle financeiro do delivery.'}
        </Text>

        <Campo label="Nome completo *" value={nome} onChangeText={setNome} placeholder="Ex: João Silva" />
        <Campo label="E-mail *" value={email} onChangeText={setEmail} placeholder="email@exemplo.com" keyboardType="email-address" />
        <Campo label="Telefone *" value={telefone} onChangeText={setTelefone} placeholder="(21) 99999-9999" keyboardType="phone-pad" />

        {!estaLogado && (
          <>
            <Campo label="Senha *" value={senha} onChangeText={setSenha} placeholder="Mínimo de 6 caracteres" secureTextEntry />
            <Campo label="Confirmar senha *" value={confirmarSenha} onChangeText={setConfirmarSenha} placeholder="Repita sua senha" secureTextEntry />
          </>
        )}

        {erro ? <Text style={styles.errorText}>{erro}</Text> : null}

        <BotaoPrincipal onPress={salvarCadastro}>
          {estaLogado ? 'Atualizar informações' : 'Entrar no painel'}
        </BotaoPrincipal>
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

  if (!usuario) {
    return <TelaCadastroObrigatorio navigation={navigation} />;
  }

  return (
    <View style={styles.screen}>
      <View style={styles.transacoesContainer}>
        <Text style={styles.pageEyebrow}>Histórico</Text>
        <Text style={styles.pageTitle}>Movimentações</Text>
        <Text style={styles.pageSubtitle}>Veja tudo que entrou e saiu do caixa.</Text>

        <FlatList
          style={styles.listaTransacoes}
          data={transacoes}
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

        <View style={styles.toggleBox}>
          <Text style={styles.toggleLabel}>Tipo *</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleButton, tipo === 'entrada' && styles.toggleButtonActiveEntrada]}
              onPress={() => setTipo('entrada')}
            >
              <Text style={[styles.toggleButtonText, tipo === 'entrada' && styles.toggleButtonTextActive]}>
                Entrada
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, tipo === 'saida' && styles.toggleButtonActiveSaida]}
              onPress={() => setTipo('saida')}
            >
              <Text style={[styles.toggleButtonText, tipo === 'saida' && styles.toggleButtonTextActive]}>
                Saída
              </Text>
            </TouchableOpacity>
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

function WelcomeScreen({ onEntrar, onCadastrar }) {
  const [usuarioInput, setUsuarioInput] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [entrando, setEntrando] = useState(false);

  async function handleEntrar() {
    if (!usuarioInput.trim() || !senha.trim()) {
      setErro('Preencha usuário e senha.');
      return;
    }
    setEntrando(true);
    const ok = await onEntrar(usuarioInput.trim(), senha.trim());
    setEntrando(false);
    if (!ok) setErro('Usuário ou senha incorretos.');
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      <ScrollView contentContainerStyle={styles.welcomeContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.welcomeHero}>
          <Text style={styles.welcomeAppName}>Finanças{'\n'}Delivery</Text>
          <Text style={styles.welcomeTagline}>Controle financeiro do seu negócio</Text>
        </View>

        <Campo label="Usuário" value={usuarioInput} onChangeText={setUsuarioInput} placeholder="Ex: teste" />
        <Campo label="Senha" value={senha} onChangeText={setSenha} placeholder="••••••" secureTextEntry />

        {erro ? <Text style={styles.errorText}>{erro}</Text> : null}

        <BotaoPrincipal onPress={entrando ? undefined : handleEntrar}>
          {entrando ? 'Entrando...' : 'Entrar'}
        </BotaoPrincipal>
        <BotaoSecundario onPress={onCadastrar}>Criar conta</BotaoSecundario>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function AuthFlow() {
  const { loginComMock } = useApp();
  const [tela, setTela] = useState('welcome');

  if (tela === 'cadastro') {
    return (
      <View style={{ flex: 1 }}>
        <TouchableOpacity style={styles.voltarButton} onPress={() => setTela('welcome')}>
          <Text style={styles.voltarText}>← Voltar</Text>
        </TouchableOpacity>
        <CadastroScreen navigation={{ navigate: () => {} }} />
      </View>
    );
  }

  return <WelcomeScreen onEntrar={loginComMock} onCadastrar={() => setTela('cadastro')} />;
}

function AppRoot() {
  const { autenticado } = useApp();
  if (!autenticado) return <AuthFlow />;
  return <AppNavigator />;
}

const TELAS_MENU = ['Minha conta', 'Início', 'Movimentações', 'Novo lançamento'];

function AppNavigator() {
  const { usuario } = useApp();
  const [telaAtual, setTelaAtual] = useState('Minha conta');
  const [drawerAberto, setDrawerAberto] = useState(false);
  const [transacaoSelecionada, setTransacaoSelecionada] = useState(null);
  const drawerAnim = useRef(new Animated.Value(-280)).current;

  useEffect(() => {
    Animated.timing(drawerAnim, {
      toValue: drawerAberto ? 0 : -280,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [drawerAberto]);

  function navigate(tela, params) {
    if (params?.transacao) setTransacaoSelecionada(params.transacao);
    setTelaAtual(tela);
    setDrawerAberto(false);
  }

  const navigation = { navigate, openDrawer: () => setDrawerAberto(true) };
  const route = { params: { transacao: transacaoSelecionada } };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.appHeader}>
        <TouchableOpacity style={styles.appHeaderButton} onPress={() => setDrawerAberto(true)}>
          <Text style={styles.appHeaderHamburger}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.appHeaderTitle}>{telaAtual}</Text>
        <View style={styles.appHeaderButton} />
      </View>

      <View style={{ flex: 1 }}>
        {telaAtual === 'Minha conta' && <CadastroScreen navigation={navigation} />}
        {telaAtual === 'Início' && <DashboardScreen navigation={navigation} />}
        {telaAtual === 'Movimentações' && <TransacoesScreen navigation={navigation} />}
        {telaAtual === 'Novo lançamento' && <NovaTransacaoScreen navigation={navigation} />}
        {telaAtual === 'Detalhes do lançamento' && <DetalhesTransacaoScreen navigation={navigation} route={route} />}
      </View>

      {drawerAberto && (
        <TouchableOpacity
          style={styles.drawerOverlay}
          onPress={() => setDrawerAberto(false)}
          activeOpacity={1}
        />
      )}

      <Animated.View style={[styles.drawerPanel, { transform: [{ translateX: drawerAnim }] }]}>
        <View style={styles.drawerHeader}>
          <Text style={styles.drawerAppName}>Finanças Delivery</Text>
          <Text style={styles.drawerUser}>{usuario ? usuario.nome : 'Acesso inicial'}</Text>
          <Text style={styles.drawerEmail}>{usuario ? usuario.email : 'Crie sua conta para liberar o painel'}</Text>
        </View>
        {TELAS_MENU.map((nome) => (
          <TouchableOpacity
            key={nome}
            style={[styles.drawerNavItem, telaAtual === nome && styles.drawerNavItemActive]}
            onPress={() => navigate(nome)}
          >
            <Text style={[styles.drawerNavItemText, telaAtual === nome && styles.drawerNavItemTextActive]}>
              {nome}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
    </View>
  );
}

export default function App() {
  return (
    <AppProvider>
      <SafeAreaView style={styles.safeArea}>
        <AppRoot />
      </SafeAreaView>
    </AppProvider>
  );
}
