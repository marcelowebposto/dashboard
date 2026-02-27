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
    // Empresa 1 - últimos 6 meses
    { empresaId: 1, quantidadeRegistros: 250, data: '2026-02-15', quantidadeConciliados: 150, quantidadeNaoConciliados: 100 },
    { empresaId: 1, quantidadeRegistros: 260, data: '2026-01-15', quantidadeConciliados: 156, quantidadeNaoConciliados: 104 },
    { empresaId: 1, quantidadeRegistros: 240, data: '2025-12-15', quantidadeConciliados: 144, quantidadeNaoConciliados: 96 },
    { empresaId: 1, quantidadeRegistros: 255, data: '2025-11-15', quantidadeConciliados: 153, quantidadeNaoConciliados: 102 },
    { empresaId: 1, quantidadeRegistros: 245, data: '2025-10-15', quantidadeConciliados: 147, quantidadeNaoConciliados: 98 },
    { empresaId: 1, quantidadeRegistros: 250, data: '2025-09-15', quantidadeConciliados: 150, quantidadeNaoConciliados: 100 },
    // Empresa 2 - últimos 6 meses
    { empresaId: 2, quantidadeRegistros: 340, data: '2026-02-15', quantidadeConciliados: 272, quantidadeNaoConciliados: 68 },
    { empresaId: 2, quantidadeRegistros: 350, data: '2026-01-15', quantidadeConciliados: 280, quantidadeNaoConciliados: 70 },
    { empresaId: 2, quantidadeRegistros: 330, data: '2025-12-15', quantidadeConciliados: 264, quantidadeNaoConciliados: 66 },
    { empresaId: 2, quantidadeRegistros: 345, data: '2025-11-15', quantidadeConciliados: 276, quantidadeNaoConciliados: 69 },
    { empresaId: 2, quantidadeRegistros: 335, data: '2025-10-15', quantidadeConciliados: 268, quantidadeNaoConciliados: 67 },
    { empresaId: 2, quantidadeRegistros: 340, data: '2025-09-15', quantidadeConciliados: 272, quantidadeNaoConciliados: 68 },
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
