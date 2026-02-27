export interface Caixa {
  id: string;
  pdvId: string;
  numero: number;
  dataAbertura: string;
  dataFechamento?: string;
  dataConsolidacao?: string;
  status: 'aberto' | 'fechado' | 'consolidado';
  tempoConsolidacao?: number; // em minutos
}

export interface PDV {
  id: string;
  nome: string;
  numero: number;
  caixas: Caixa[];
}

export interface IndicadorEmpresa {
  empresaId: string;
  empresaNome: string;
  numeroCaixasAbertos: number;
  menorDataCaixaAberto?: string;
  numeroCaixasFechados: number;
  menorDataSemConsolidar?: string;
  tempoMedioConsolidacao: number; // em minutos
}

// Manter compatibilidade com tipo antigo
export type IndicadorPDV = IndicadorEmpresa;

export interface DashboardData {
  indicadores: IndicadorEmpresa[];
  dataAtualizacao: string;
}

export interface RegistroOFX {
  id: string;
  empresaId: string;
  descricao: string;
  valor: number;
  dataProcesamento: string;
  conciliado: boolean;
}

export interface EmpresaOFX {
  id: string;
  nome: string;
  registrosConciliados: number;
  registrosNaoConciliados: number;
  percentualConciliacao: number;
}

export interface RelatorioOFX {
  empresas: EmpresaOFX[];
  totalConciliados: number;
  totalNaoConciliados: number;
  dataAtualizacao: string;
}
// Tipos para resposta do backend
export interface CaixasDesconsolidadosResponse {
  CAM: string[]; // Cabeçalhos: ["UNN_CD_UNIDADE_NEGOCIO","ABERTO","MENOR_DATA_ABERTO","FECHADO","MENOR_DATA_SEM_CONSOLIDAR"]
  DAD: Array<[number, number, string | null, number, string]>; // Dados
  RET: number; // Código de retorno
}

export interface CaixasDesconsolidados {
  empresaId: number;
  numeroCaixasAbertos: number;
  menorDataCaixaAberto: string | null;
  numeroCaixasFechados: number;
  menorDataSemConsolidar: string;
}

// Tipos para API de Empresas
export interface Empresa {
  empresaCodigo: number;
  cnpj: string;
  razao: string;
  fantasia: string;
  sigla: string;
  endereco: string;
  bairro: string;
  cidade: string;
  estado: string;
  codigo: number;
}

export interface EmpresasResponse {
  ultimoCodigo: number;
  resultados: Empresa[];
}

// Tipos para OFX
export interface OFXResponse {
  CAM: string[]; // ["UNN_CD_UNIDADE_NEGOCIO","QTD_REGISTROS","DATA","QTD_CONCILIADOS","QTD_NAO_CONCILIADOS"]
  DAD: Array<[number, number, string, number, number]>; // Dados
  RET: number; // Código de retorno
}

export interface OFXRegistro {
  empresaId: number;
  quantidadeRegistros: number;
  data: string;
  quantidadeConciliados: number;
  quantidadeNaoConciliados: number;
}

export interface OFXEmpresa {
  empresaId: number;
  empresaNome: string;
  totalRegistros: number;
  totalConciliados: number;
  totalNaoConciliados: number;
  percentualConciliacao: number;
  ultimaAtualizacao: string;
}

export interface RelatorioOFXCompleto {
  empresas: OFXEmpresa[];
  registrosPorData: OFXRegistro[]; // Todos os registros históricos
  totalGeralRegistros: number;
  totalGeralConciliados: number;
  totalGeralNaoConciliados: number;
  percentualConciliacaoGeral: number;
}

// Tipos para Cartões de Pagamento
export interface CartaoPagamentoResponse {
  CAM: string[]; // ["CAR_CD_UNIDADE_NEGOCIO", "QTD_CARTOES", "DATA", "RECEBIDO", "EM_REMESSA_ABERTA", "ABERTO", "TOTAL"]
  DAD: Array<[number, number, string, number, number, number, number]>; // Dados
  RET?: number; // Código de retorno
}

export interface CartaoPagamentoRegistro {
  empresaId: number;
  quantidadeCartoes: number;
  data: string;
  recebido: number;
  emRemessaAberta: number;
  aberto: number;
  total: number;
}

export interface CartaoPagamentoEmpresa {
  empresaId: number;
  empresaNome: string;
  totalCartoes: number;
  totalRecebido: number;
  totalEmRemessaAberta: number;
  totalAberto: number;
  total: number;
  percentualRecebido: number;
  ultimaAtualizacao: string;
}

export interface RelatorioCartoesPagamento {
  empresas: CartaoPagamentoEmpresa[];
  registrosPorData: CartaoPagamentoRegistro[];
  totalGeralCartoes: number;
  totalGeralRecebido: number;
  totalGeralEmRemessaAberta: number;
  totalGeralAberto: number;
  totalGeral: number;
  percentualRecebidoGeral: number;
}
