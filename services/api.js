const API_URL = 'https://6a16fe2e1b90031f81b1db01.mockapi.io/api/v1/transacoes';

const dadosReserva = [
  {
    id: '1',
    tipo: 'entrada',
    data: '2024-04-15',
    descricao: 'Fechamento caixa',
    pagoPara: 'Clientes',
    loja: 'Restaurante',
    categoria: 'Faturamento',
    conta: 'Itaú',
    valor: 140.85,
    status: 'on',
  },
  {
    id: '2',
    tipo: 'entrada',
    data: '2024-04-15',
    descricao: 'Fechamento delivery',
    pagoPara: 'Aplicativo parceiro',
    loja: 'Restaurante',
    categoria: 'Faturamento',
    conta: 'Carteira digital',
    valor: 254.1,
    status: 'on',
  },
  {
    id: '3',
    tipo: 'entrada',
    data: '2024-04-15',
    descricao: 'Fechamento balcão',
    pagoPara: 'Clientes',
    loja: 'Hamburgueria',
    categoria: 'Faturamento',
    conta: 'Itaú',
    valor: 120.75,
    status: 'on',
  },
  {
    id: '4',
    tipo: 'saida',
    data: '2024-04-14',
    descricao: 'Aluguel do ponto',
    pagoPara: 'Carlos Oliveira',
    loja: 'Restaurante',
    categoria: 'Imóvel',
    conta: 'Itaú',
    valor: 1455,
    status: 'on',
  },
  {
    id: '5',
    tipo: 'saida',
    data: '2024-04-14',
    descricao: 'Pagamento de férias',
    pagoPara: 'Raquel Mendes',
    loja: 'Restaurante',
    categoria: 'Funcionário',
    conta: 'Itaú',
    valor: 2400,
    status: 'off',
  },
  {
    id: '6',
    tipo: 'saida',
    data: '2024-04-14',
    descricao: 'Compra de embalagens',
    pagoPara: 'Fornecedor do Trigo',
    loja: 'Hamburgueria',
    categoria: 'Insumos',
    conta: 'Nubank',
    valor: 204.7,
    status: 'on',
  },
  {
    id: '7',
    tipo: 'entrada',
    data: '2024-04-14',
    descricao: 'Capital de giro',
    pagoPara: 'Banco',
    loja: 'Restaurante',
    categoria: 'Investimento',
    conta: 'Nubank',
    valor: 20000,
    status: 'off',
  },
  {
    id: '8',
    tipo: 'saida',
    data: '2024-04-13',
    descricao: 'Compra de tomate',
    pagoPara: 'Feira do Joaquim',
    loja: 'Hamburgueria',
    categoria: 'Insumos',
    conta: 'Nubank',
    valor: 98.3,
    status: 'on',
  },
];

export function apiEstaConfigurada() {
  return API_URL.startsWith('http') && !API_URL.includes('COLE_SUA_URL');
}

function normalizarTransacao(item) {
  return {
    id: String(item.id || Date.now()),
    tipo: item.tipo || 'entrada',
    data: item.data || new Date().toISOString().slice(0, 10),
    descricao: item.descricao || 'Sem descrição',
    pagoPara: item.pagoPara || 'Não informado',
    loja: item.loja || 'Não informada',
    categoria: item.categoria || 'Geral',
    conta: item.conta || 'Não informada',
    valor: Number(item.valor || 0),
    status: item.status || 'on',
  };
}

export const apiService = {
  async getTransacoes() {
    if (!apiEstaConfigurada()) {
      return {
        dados: dadosReserva,
        origem: 'local',
        mensagem: 'Mostrando exemplos de demonstração. Configure a API para salvar seus próprios lançamentos.',
      };
    }

    try {
      const resposta = await fetch(API_URL);

      if (!resposta.ok) {
        throw new Error('Erro ao buscar dados.');
      }

      const dados = await resposta.json();

      if (!Array.isArray(dados) || dados.length === 0) {
        return {
          dados: dadosReserva,
          origem: 'api-vazia',
          mensagem: 'A API ainda não tem lançamentos. Por isso, exibimos exemplos fictícios de demonstração. Cadastre um lançamento para mostrar apenas os dados reais salvos na API.',
        };
      }

      return {
        dados: dados.map(normalizarTransacao),
        origem: 'api',
        mensagem: 'Exibindo dados reais salvos na API.',
      };
    } catch (error) {
      return {
        dados: dadosReserva,
        origem: 'erro',
        mensagem: 'Não foi possível atualizar agora. Exibindo exemplos fictícios temporários.',
      };
    }
  },

  async postTransacao(novaTransacao) {
    const registro = {
      ...novaTransacao,
      data: new Date().toISOString().slice(0, 10),
      status: 'on',
      valor: Number(novaTransacao.valor || 0),
    };

    if (!apiEstaConfigurada()) {
      return {
        transacao: normalizarTransacao({ ...registro, id: Date.now() }),
        origem: 'local',
        mensagem: 'Lançamento salvo temporariamente no aplicativo.',
      };
    }

    try {
      const resposta = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registro),
      });

      if (!resposta.ok) {
        throw new Error('Erro ao salvar lançamento.');
      }

      const dados = await resposta.json();

      return {
        transacao: normalizarTransacao(dados),
        origem: 'api',
        mensagem: 'Lançamento salvo com sucesso na API.',
      };
    } catch (error) {
      return {
        transacao: normalizarTransacao({ ...registro, id: Date.now() }),
        origem: 'erro',
        mensagem: 'Não foi possível sincronizar agora. O lançamento foi salvo temporariamente no app.',
      };
    }
  },
};
