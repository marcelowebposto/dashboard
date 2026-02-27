import axios from 'axios';
import { DashboardData, IndicadorEmpresa, RelatorioOFX, CaixasDesconsolidadosResponse, CaixasDesconsolidados, Empresa, EmpresasResponse, OFXResponse, OFXRegistro, OFXEmpresa, RelatorioOFXCompleto, CartaoPagamentoResponse, CartaoPagamentoRegistro, CartaoPagamentoEmpresa, RelatorioCartoesPagamento } from '../types';
import { mockIndicadores, mockRelatorioOFX } from './mockData';
import authService from './authService';
import configService from './configService';

const API_BASE_URL = configService.getApiUrl();

console.log('[pdvService] API_BASE_URL configurada:', API_BASE_URL);

const api = axios.create({
  timeout: 30000, // Aumentar timeout para 30s
});

// Interceptor para adicionar o token JWT apenas em requisições do PAINEL_OPERACAO
api.interceptors.request.use(async (config) => {
  try {
    // Só adiciona token para endpoints que precisam (PAINEL_OPERACAO)
    if (config.url?.includes('/PAINEL_OPERACAO')) {
      const token = await authService.getToken();
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[API Interceptor] Token JWT adicionado para:', config.url);
    } else {
      console.log('[API Interceptor] Endpoint não requer token JWT:', config.url);
    }
    return config;
  } catch (error) {
    console.error('[API Interceptor] Erro ao adicionar token:', error);
    throw error;
  }
});

// Cache de empresas (invalidado quando a chave muda)
let empresasCache: Map<number, Empresa> = new Map();
let empresasCacheExpiresAt: number = 0;
let empresasCacheChave: string | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

class PDVService {
  /**
   * Buscar e cachear empresas
   */
  private async carregarEmpresas(): Promise<Map<number, Empresa>> {
    try {
      const chaveAtual = configService.getChave();
      
      // Invalidar cache se a chave mudou
      if (empresasCacheChave !== chaveAtual) {
        console.log('[pdvService] Chave mudou, invalidando cache de empresas');
        empresasCache = new Map();
        empresasCacheExpiresAt = 0;
        empresasCacheChave = chaveAtual;
      }
      
      // Se cache ainda é válido, retornar
      if (empresasCache.size > 0 && Date.now() < empresasCacheExpiresAt) {
        console.log('[pdvService] Usando cache de empresas:', empresasCache.size, 'empresas');
        return empresasCache;
      }

      const chave = configService.getChave();
      const url = `${API_BASE_URL}/INTEGRACAO/EMPRESAS?chave=${chave}`;
      console.log('[pdvService] Buscando empresas em:', url);

      const response = await api.get<EmpresasResponse>(url, {
        headers: {
          'Accept': 'application/json',
        },
      });

      console.log('[pdvService] Resposta de empresas recebida:', response.data);

      // Criar mapa para acesso rápido
      empresasCache = new Map();
      response.data.resultados.forEach((empresa) => {
        console.log(`[pdvService] Cachendo empresa ${empresa.empresaCodigo}: ${empresa.sigla} - ${empresa.fantasia}`);
        empresasCache.set(empresa.empresaCodigo, empresa);
      });

      empresasCacheExpiresAt = Date.now() + CACHE_DURATION;
      console.log('[pdvService] Empresas carregadas no cache:', empresasCache.size);

      return empresasCache;
    } catch (error) {
      console.error('[pdvService] Erro ao buscar empresas:', error);
      if (error instanceof Error) {
        console.error('[pdvService] Mensagem de erro:', error.message);
      }
      // Retornar cache mesmo se expirado em caso de erro
      return empresasCache;
    }
  }

  /**
   * Obter informações da empresa
   */
  private async getEmpresaInfo(codigoEmpresa: number): Promise<Empresa | undefined> {
    console.log(`[pdvService] Buscando informações da empresa ${codigoEmpresa}`);
    const empresas = await this.carregarEmpresas();
    const empresa = empresas.get(codigoEmpresa);
    console.log(`[pdvService] Empresa ${codigoEmpresa} encontrada:`, empresa?.fantasia || empresa?.sigla);
    return empresa;
  }
  /**
   * Obter caixas desconsolidados do backend
   */
  async getCaixasDesconsolidados(): Promise<CaixasDesconsolidados[]> {
    try {
      const url = `${API_BASE_URL}/PAINEL_OPERACAO/CAIXAS_DESCONSOLIDADOS`;
      console.log('[pdvService] Buscando caixas desconsolidados em:', url);

      const response = await api.get<CaixasDesconsolidadosResponse>(url, {
        headers: {
          'Accept': 'application/json',
        },
      });

      const { DAD, RET } = response.data;

      console.log('[pdvService] Resposta recebida. RET:', RET, 'Registros:', DAD.length);

      if (RET !== 0) {
        console.warn(`[pdvService] Aviso: API retornou RET=${RET}`);
      }

      // Converter de CAM/DAD para IndicadorEmpresa
      const caixas: CaixasDesconsolidados[] = DAD.map((linha) => ({
        empresaId: linha[0],
        numeroCaixasAbertos: linha[1],
        menorDataCaixaAberto: linha[2],
        numeroCaixasFechados: linha[3],
        menorDataSemConsolidar: linha[4],
      }));

      console.log('[pdvService] Caixas convertidos:', caixas.length);
      return caixas;
    } catch (error) {
      console.error('[pdvService] Erro ao buscar caixas desconsolidados:', error);
      throw error;
    }
  }

  /**
   * Converter CaixasDesconsolidados para IndicadorEmpresa
   */
  private async converterParaIndicadorEmpresa(
    caixa: CaixasDesconsolidados
  ): Promise<IndicadorEmpresa> {
    const empresaInfo = await this.getEmpresaInfo(caixa.empresaId);
    const empresaNome = empresaInfo?.fantasia || empresaInfo?.sigla || `Empresa ${caixa.empresaId}`;

    return {
      empresaId: `emp-${caixa.empresaId}`,
      empresaNome,
      numeroCaixasAbertos: caixa.numeroCaixasAbertos,
      menorDataCaixaAberto: caixa.menorDataCaixaAberto
        ? this.convertDataDDMMYYYY(caixa.menorDataCaixaAberto)
        : undefined,
      numeroCaixasFechados: caixa.numeroCaixasFechados,
      menorDataSemConsolidar: this.convertDataDDMMYYYY(caixa.menorDataSemConsolidar),
      tempoMedioConsolidacao: 0, // TODO: calcular a partir dos dados reais
    };
  }

  /**
   * Converte data de DD/MM/YYYY para ISO string
   */
  private convertDataDDMMYYYY(data: string): string {
    const [dia, mes, ano] = data.split('/');
    return `${ano}-${mes}-${dia}T00:00:00`;
  }

  /**
   * Obter indicadores de todas as empresas
   */
  async getIndicadores(): Promise<IndicadorEmpresa[]> {
    try {
      const caixas = await this.getCaixasDesconsolidados();
      const indicadores = await Promise.all(
        caixas.map((c) => this.converterParaIndicadorEmpresa(c))
      );
      return indicadores;
    } catch (error) {
      console.warn('Erro ao buscar indicadores, usando dados mock:', error);
      return mockIndicadores;
    }
  }

  /**
   * Obter dados completos do dashboard
   */
  async getDashboardData(): Promise<DashboardData> {
    try {
      const indicadores = await this.getIndicadores();
      return {
        indicadores,
        dataAtualizacao: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
      throw error;
    }
  }

  /**
   * Obter indicadores de uma empresa específica
   */
  async getIndicadorEmpresa(empresaId: string): Promise<IndicadorEmpresa> {
    try {
      const caixas = await this.getCaixasDesconsolidados();
      const numId = parseInt(empresaId.replace('emp-', ''), 10);
      const caixa = caixas.find((c) => c.empresaId === numId);

      if (!caixa) {
        throw new Error(`Empresa ${empresaId} não encontrada`);
      }

      return await this.converterParaIndicadorEmpresa(caixa);
    } catch (error) {
      console.error(`Erro ao buscar indicadores da empresa ${empresaId}:`, error);
      throw error;
    }
  }

  /**
   * Obter relatório de OFX conciliados e não conciliados
   */
  async getRelatorioOFX(): Promise<RelatorioOFX> {
    try {
      const response = await api.get(`${API_BASE_URL}/PAINEL_OPERACAO/OFX_CONCILIACAO`, {
        headers: {
          'Accept': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.warn('Usando dados mock para OFX:', error);
      return mockRelatorioOFX;
    }
  }

  /**
   * Obter dados de OFX do endpoint PAINEL_OPERACAO/OFX
   */
  async getOFX(): Promise<RelatorioOFXCompleto> {
    try {
      const url = `${API_BASE_URL}/PAINEL_OPERACAO/OFX`;
      console.log('[pdvService] Buscando dados OFX em:', url);

      const response = await api.get<OFXResponse>(url, {
        headers: {
          'Accept': 'application/json',
        },
      });

      const { DAD, RET } = response.data;

      console.log('[pdvService] Resposta OFX recebida. RET:', RET, 'Registros:', DAD.length);

      if (RET !== 0) {
        console.warn(`[pdvService] Aviso: API OFX retornou RET=${RET}`);
      }

      // Converter de CAM/DAD para OFXRegistro
      const registrosPorData: OFXRegistro[] = DAD.map((linha) => ({
        empresaId: linha[0],
        quantidadeRegistros: linha[1],
        data: linha[2],
        quantidadeConciliados: linha[3],
        quantidadeNaoConciliados: linha[4],
      }));

      console.log('[pdvService] OFX convertidos:', registrosPorData.length, 'registros');

      // Agregar dados por empresa
      const empresasMap = new Map<number, OFXEmpresa>();
      let totalGeralRegistros = 0;
      let totalGeralConciliados = 0;
      let totalGeralNaoConciliados = 0;

      for (const registro of registrosPorData) {
        totalGeralRegistros += registro.quantidadeRegistros;
        totalGeralConciliados += registro.quantidadeConciliados;
        totalGeralNaoConciliados += registro.quantidadeNaoConciliados;

        if (!empresasMap.has(registro.empresaId)) {
          const empresaInfo = await this.getEmpresaInfo(registro.empresaId);
          const empresaNome = empresaInfo?.fantasia || empresaInfo?.sigla || `Empresa ${registro.empresaId}`;

          empresasMap.set(registro.empresaId, {
            empresaId: registro.empresaId,
            empresaNome,
            totalRegistros: 0,
            totalConciliados: 0,
            totalNaoConciliados: 0,
            percentualConciliacao: 0,
            ultimaAtualizacao: '',
          });
        }

        const empresa = empresasMap.get(registro.empresaId)!;
        empresa.totalRegistros += registro.quantidadeRegistros;
        empresa.totalConciliados += registro.quantidadeConciliados;
        empresa.totalNaoConciliados += registro.quantidadeNaoConciliados;
        empresa.ultimaAtualizacao = registro.data; // Atualiza com a data mais recente (já que está ordenado)
      }

      // Calcular percentuais
      const empresas = Array.from(empresasMap.values()).map((emp) => ({
        ...emp,
        percentualConciliacao:
          emp.totalRegistros > 0 ? (emp.totalConciliados / emp.totalRegistros) * 100 : 0,
      }));

      const percentualConciliacaoGeral =
        totalGeralRegistros > 0 ? (totalGeralConciliados / totalGeralRegistros) * 100 : 0;

      console.log('[pdvService] OFX agregado:', empresas.length, 'empresas, percentual geral:', percentualConciliacaoGeral.toFixed(2) + '%');

      return {
        empresas,
        registrosPorData,
        totalGeralRegistros,
        totalGeralConciliados,
        totalGeralNaoConciliados,
        percentualConciliacaoGeral,
      };
    } catch (error) {
      console.error('[pdvService] Erro ao buscar OFX:', error);
      if (error instanceof Error) {
        console.error('[pdvService] Mensagem:', error.message);
        console.error('[pdvService] Stack:', error.stack);
      }
      // Re-throw para ver o erro real, não usar mock
      throw error;
    }
  }

  /**
   * Obter dados de Cartões de Pagamento do endpoint PAINEL_OPERACAO/CARTAO_PAGAMENTO
   */
  async getCartoesPagamento(): Promise<RelatorioCartoesPagamento> {
    try {
      const url = `${API_BASE_URL}/PAINEL_OPERACAO/CARTAO_PAGAMENTO`;
      console.log('[pdvService] Buscando dados Cartões Pagamento em:', url);

      const response = await api.get<CartaoPagamentoResponse>(url, {
        headers: {
          'Accept': 'application/json',
        },
      });

      const { DAD, RET } = response.data;

      console.log('[pdvService] Resposta Cartões recebida. RET:', RET, 'Registros:', DAD.length);

      if (RET !== undefined && RET !== 0) {
        console.warn(`[pdvService] Aviso: API Cartões retornou RET=${RET}`);
      }

      // Converter de CAM/DAD para CartaoPagamentoRegistro
      const registrosPorData: CartaoPagamentoRegistro[] = DAD.map((linha) => ({
        empresaId: linha[0],
        quantidadeCartoes: linha[1],
        data: linha[2],
        recebido: linha[3],
        emRemessaAberta: linha[4],
        aberto: linha[5],
        total: linha[6],
      }));

      console.log('[pdvService] Cartões convertidos:', registrosPorData.length, 'registros');

      // Agregar dados por empresa
      const empresasMap = new Map<number, CartaoPagamentoEmpresa>();
      let totalGeralCartoes = 0;
      let totalGeralRecebido = 0;
      let totalGeralEmRemessaAberta = 0;
      let totalGeralAberto = 0;
      let totalGeral = 0;

      for (const registro of registrosPorData) {
        totalGeralCartoes += registro.quantidadeCartoes;
        totalGeralRecebido += registro.recebido;
        totalGeralEmRemessaAberta += registro.emRemessaAberta;
        totalGeralAberto += registro.aberto;
        totalGeral += registro.total;

        if (!empresasMap.has(registro.empresaId)) {
          const empresaInfo = await this.getEmpresaInfo(registro.empresaId);
          const empresaNome = empresaInfo?.fantasia || empresaInfo?.sigla || `Empresa ${registro.empresaId}`;

          empresasMap.set(registro.empresaId, {
            empresaId: registro.empresaId,
            empresaNome,
            totalCartoes: 0,
            totalRecebido: 0,
            totalEmRemessaAberta: 0,
            totalAberto: 0,
            total: 0,
            percentualRecebido: 0,
            ultimaAtualizacao: '',
          });
        }

        const empresa = empresasMap.get(registro.empresaId)!;
        empresa.totalCartoes += registro.quantidadeCartoes;
        empresa.totalRecebido += registro.recebido;
        empresa.totalEmRemessaAberta += registro.emRemessaAberta;
        empresa.totalAberto += registro.aberto;
        empresa.total += registro.total;
        empresa.ultimaAtualizacao = registro.data;
      }

      // Calcular percentuais
      const empresas = Array.from(empresasMap.values()).map((emp) => ({
        ...emp,
        percentualRecebido:
          emp.total > 0 ? (emp.totalRecebido / emp.total) * 100 : 0,
      }));

      const percentualRecebidoGeral =
        totalGeral > 0 ? (totalGeralRecebido / totalGeral) * 100 : 0;

      console.log('[pdvService] Cartões agregado:', empresas.length, 'empresas, percentual geral:', percentualRecebidoGeral.toFixed(2) + '%');

      return {
        empresas,
        registrosPorData,
        totalGeralCartoes,
        totalGeralRecebido,
        totalGeralEmRemessaAberta,
        totalGeralAberto,
        totalGeral,
        percentualRecebidoGeral,
      };
    } catch (error) {
      console.error('[pdvService] Erro ao buscar Cartões Pagamento:', error);
      if (error instanceof Error) {
        console.error('[pdvService] Mensagem:', error.message);
        console.error('[pdvService] Stack:', error.stack);
      }
      throw error;
    }
  }
}

export default new PDVService();
