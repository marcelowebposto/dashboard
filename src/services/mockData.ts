import { IndicadorEmpresa, RelatorioOFX, RelatorioOFXCompleto } from '../types';

export const mockIndicadores: IndicadorEmpresa[] = [
  {
    empresaId: 'emp-001',
    empresaNome: 'Empresa A',
    numeroCaixasAbertos: 2,
    menorDataCaixaAberto: '2026-02-20T09:30:00',
    numeroCaixasFechados: 15,
    menorDataSemConsolidar: '2026-02-19T15:45:00',
    tempoMedioConsolidacao: 45,
  },
];

// Mock simples - os dados reais vêm da API
export const mockRelatorioOFXCompleto: RelatorioOFXCompleto = {
  empresas: [
    {
      empresaId: 1,
      empresaNome: 'Empresa A - Filial 1',
      totalRegistros: 1500,
      totalConciliados: 900,
      totalNaoConciliados: 600,
      percentualConciliacao: 60,
      ultimaAtualizacao: new Date().toISOString(),
    },
    {
      empresaId: 2,
      empresaNome: 'Empresa B - Filial 1',
      totalRegistros: 2000,
      totalConciliados: 1600,
      totalNaoConciliados: 400,
      percentualConciliacao: 80,
      ultimaAtualizacao: new Date().toISOString(),
    },
  ],
  registrosPorData: [
    // Fevereiro 2026 - com alguns dias sem registros propositalmente
    { empresaId: 1, quantidadeRegistros: 120, data: '2026-02-02', quantidadeConciliados: 72, quantidadeNaoConciliados: 48 },
    { empresaId: 1, quantidadeRegistros: 115, data: '2026-02-03', quantidadeConciliados: 69, quantidadeNaoConciliados: 46 },
    // Faltam dias 4, 5 (pular propositalmente)
    { empresaId: 1, quantidadeRegistros: 118, data: '2026-02-06', quantidadeConciliados: 70, quantidadeNaoConciliados: 48 },
    { empresaId: 1, quantidadeRegistros: 125, data: '2026-02-09', quantidadeConciliados: 75, quantidadeNaoConciliados: 50 },
    { empresaId: 1, quantidadeRegistros: 110, data: '2026-02-10', quantidadeConciliados: 66, quantidadeNaoConciliados: 44 },
    // Falta dia 11
    { empresaId: 1, quantidadeRegistros: 122, data: '2026-02-12', quantidadeConciliados: 73, quantidadeNaoConciliados: 49 },
    { empresaId: 1, quantidadeRegistros: 128, data: '2026-02-13', quantidadeConciliados: 76, quantidadeNaoConciliados: 52 },
    { empresaId: 1, quantidadeRegistros: 105, data: '2026-02-16', quantidadeConciliados: 63, quantidadeNaoConciliados: 42 },
    { empresaId: 1, quantidadeRegistros: 120, data: '2026-02-17', quantidadeConciliados: 72, quantidadeNaoConciliados: 48 },
    { empresaId: 1, quantidadeRegistros: 130, data: '2026-02-18', quantidadeConciliados: 78, quantidadeNaoConciliados: 52 },
    { empresaId: 1, quantidadeRegistros: 125, data: '2026-02-19', quantidadeConciliados: 75, quantidadeNaoConciliados: 50 },
    { empresaId: 1, quantidadeRegistros: 115, data: '2026-02-20', quantidadeConciliados: 69, quantidadeNaoConciliados: 46 },
    // Faltam dias 23, 24
    { empresaId: 1, quantidadeRegistros: 118, data: '2026-02-25', quantidadeConciliados: 70, quantidadeNaoConciliados: 48 },
    { empresaId: 1, quantidadeRegistros: 122, data: '2026-02-26', quantidadeConciliados: 73, quantidadeNaoConciliados: 49 },

    // Janeiro 2026 - mais dias
    { empresaId: 1, quantidadeRegistros: 125, data: '2026-01-02', quantidadeConciliados: 75, quantidadeNaoConciliados: 50 },
    { empresaId: 1, quantidadeRegistros: 130, data: '2026-01-05', quantidadeConciliados: 78, quantidadeNaoConciliados: 52 },
    { empresaId: 1, quantidadeRegistros: 128, data: '2026-01-06', quantidadeConciliados: 76, quantidadeNaoConciliados: 52 },
    // Falta dia 7
    { empresaId: 1, quantidadeRegistros: 120, data: '2026-01-08', quantidadeConciliados: 72, quantidadeNaoConciliados: 48 },
    { empresaId: 1, quantidadeRegistros: 115, data: '2026-01-09', quantidadeConciliados: 69, quantidadeNaoConciliados: 46 },
    { empresaId: 1, quantidadeRegistros: 122, data: '2026-01-12', quantidadeConciliados: 73, quantidadeNaoConciliados: 49 },
    { empresaId: 1, quantidadeRegistros: 125, data: '2026-01-13', quantidadeConciliados: 75, quantidadeNaoConciliados: 50 },
    { empresaId: 1, quantidadeRegistros: 118, data: '2026-01-14', quantidadeConciliados: 70, quantidadeNaoConciliados: 48 },
    { empresaId: 1, quantidadeRegistros: 110, data: '2026-01-15', quantidadeConciliados: 66, quantidadeNaoConciliados: 44 },
    { empresaId: 1, quantidadeRegistros: 120, data: '2026-01-16', quantidadeConciliados: 72, quantidadeNaoConciliados: 48 },
    { empresaId: 1, quantidadeRegistros: 128, data: '2026-01-19', quantidadeConciliados: 76, quantidadeNaoConciliados: 52 },
    { empresaId: 1, quantidadeRegistros: 122, data: '2026-01-20', quantidadeConciliados: 73, quantidadeNaoConciliados: 49 },
    // Faltam dias 21, 22
    { empresaId: 1, quantidadeRegistros: 125, data: '2026-01-23', quantidadeConciliados: 75, quantidadeNaoConciliados: 50 },
    { empresaId: 1, quantidadeRegistros: 130, data: '2026-01-26', quantidadeConciliados: 78, quantidadeNaoConciliados: 52 },
    { empresaId: 1, quantidadeRegistros: 115, data: '2026-01-27', quantidadeConciliados: 69, quantidadeNaoConciliados: 46 },
    { empresaId: 1, quantidadeRegistros: 120, data: '2026-01-28', quantidadeConciliados: 72, quantidadeNaoConciliados: 48 },
    { empresaId: 1, quantidadeRegistros: 118, data: '2026-01-29', quantidadeConciliados: 70, quantidadeNaoConciliados: 48 },

    // Empresa 2 - também com alguns gaps
    { empresaId: 2, quantidadeRegistros: 150, data: '2026-02-02', quantidadeConciliados: 120, quantidadeNaoConciliados: 30 },
    { empresaId: 2, quantidadeRegistros: 145, data: '2026-02-03', quantidadeConciliados: 116, quantidadeNaoConciliados: 29 },
    { empresaId: 2, quantidadeRegistros: 148, data: '2026-02-06', quantidadeConciliados: 118, quantidadeNaoConciliados: 30 },
    { empresaId: 2, quantidadeRegistros: 155, data: '2026-02-09', quantidadeConciliados: 124, quantidadeNaoConciliados: 31 },
    { empresaId: 2, quantidadeRegistros: 140, data: '2026-02-10', quantidadeConciliados: 112, quantidadeNaoConciliados: 28 },
    { empresaId: 2, quantidadeRegistros: 152, data: '2026-02-12', quantidadeConciliados: 121, quantidadeNaoConciliados: 31 },
    { empresaId: 2, quantidadeRegistros: 158, data: '2026-02-13', quantidadeConciliados: 126, quantidadeNaoConciliados: 32 },
    { empresaId: 2, quantidadeRegistros: 135, data: '2026-02-16', quantidadeConciliados: 108, quantidadeNaoConciliados: 27 },
    { empresaId: 2, quantidadeRegistros: 150, data: '2026-02-17', quantidadeConciliados: 120, quantidadeNaoConciliados: 30 },
    { empresaId: 2, quantidadeRegistros: 160, data: '2026-02-18', quantidadeConciliados: 128, quantidadeNaoConciliados: 32 },
    // Falta dia 19
    { empresaId: 2, quantidadeRegistros: 145, data: '2026-02-20', quantidadeConciliados: 116, quantidadeNaoConciliados: 29 },
    { empresaId: 2, quantidadeRegistros: 148, data: '2026-02-25', quantidadeConciliados: 118, quantidadeNaoConciliados: 30 },
    { empresaId: 2, quantidadeRegistros: 152, data: '2026-02-26', quantidadeConciliados: 121, quantidadeNaoConciliados: 31 },
  ],
  totalGeralRegistros: 3500,
  totalGeralConciliados: 2500,
  totalGeralNaoConciliados: 1000,
  percentualConciliacaoGeral: 71.4,
};

export const mockRelatorioOFX: RelatorioOFX = {
  empresas: [],
  totalConciliados: 0,
  totalNaoConciliados: 0,
  dataAtualizacao: new Date().toISOString(),
};
