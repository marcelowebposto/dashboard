/**
 * Serviço para gerenciar feriados brasileiros e dias úteis
 */

// Feriados fixos do Brasil (mês/dia)
const FERIADOS_FIXOS = [
  { mes: 1, dia: 1 },    // Ano Novo
  { mes: 4, dia: 21 },   // Tiradentes
  { mes: 5, dia: 1 },    // Dia do Trabalho
  { mes: 9, dia: 7 },    // Independência
  { mes: 10, dia: 12 },  // Nossa Senhora Aparecida
  { mes: 11, dia: 2 },   // Finados
  { mes: 11, dia: 15 },  // Proclamação da República
  { mes: 11, dia: 20 },  // Consciência Negra
  { mes: 12, dia: 25 },  // Natal
];

// Feriados móveis (Carnaval, Páscoa, Corpus Christi, Finados) - 2026
const FERIADOS_MOVEIS_2026 = [
  { mes: 2, dia: 16 },   // Segunda de Carnaval
  { mes: 2, dia: 17 },   // Carnaval
  { mes: 2, dia: 18 },   // Quarta-feira de Cinzas (considerar como ponto facultativo)
  { mes: 4, dia: 5 },    // Páscoa
  { mes: 5, dia: 14 },   // Corpus Christi
];

// Feriados móveis (2025)
const FERIADOS_MOVEIS_2025 = [
  { mes: 2, dia: 3 },    // Segunda de Carnaval
  { mes: 2, dia: 4 },    // Carnaval
  { mes: 2, dia: 5 },    // Quarta-feira de Cinzas
  { mes: 3, dia: 30 },   // Páscoa (Domingo, mas segunda é feriado)
  { mes: 3, dia: 31 },   // Segunda de Páscoa
  { mes: 5, dia: 29 },   // Corpus Christi
];

/**
 * Verifica se uma data é fim de semana (sábado ou domingo)
 */
export function eFinaldeSemana(data: Date): boolean {
  const diaSemana = data.getDay();
  return diaSemana === 0 || diaSemana === 6; // 0 = domingo, 6 = sábado
}

/**
 * Verifica se uma data é feriado
 */
export function eFeriado(data: Date): boolean {
  const mes = data.getMonth() + 1;
  const dia = data.getDate();
  const ano = data.getFullYear();

  // Verificar feriados fixos
  if (FERIADOS_FIXOS.some(f => f.mes === mes && f.dia === dia)) {
    return true;
  }

  // Verificar feriados móveis por ano
  if (ano === 2025) {
    return FERIADOS_MOVEIS_2025.some(f => f.mes === mes && f.dia === dia);
  }
  if (ano === 2026) {
    return FERIADOS_MOVEIS_2026.some(f => f.mes === mes && f.dia === dia);
  }

  return false;
}

/**
 * Verifica se uma data é dia útil (não é fim de semana nem feriado)
 */
export function eDiaUtil(data: Date): boolean {
  return !eFinaldeSemana(data) && !eFeriado(data);
}

/**
 * Converte string de data (DD/MM/YYYY ou YYYY-MM-DD) para Date
 */
export function parseData(dataStr: string): Date | null {
  try {
    let dia: number, mes: number, ano: number;

    if (dataStr.includes('/')) {
      // Formato DD/MM/YYYY
      const partes = dataStr.split('/');
      dia = parseInt(partes[0], 10);
      mes = parseInt(partes[1], 10);
      ano = parseInt(partes[2], 10);
    } else if (dataStr.includes('-')) {
      // Formato YYYY-MM-DD
      const partes = dataStr.split('-');
      ano = parseInt(partes[0], 10);
      mes = parseInt(partes[1], 10);
      dia = parseInt(partes[2], 10);
    } else {
      return null;
    }

    return new Date(ano, mes - 1, dia);
  } catch {
    return null;
  }
}

/**
 * Formata data para DD/MM/YYYY
 */
export function formatarData(data: Date): string {
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

/**
 * Formata data para exibição em português (ex: "Terça-feira, 15 de março de 2026")
 */
export function formatarDataPorExtenso(data: Date): string {
  return data.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Retorna o nome do dia da semana
 */
export function getNomeDiaSemana(data: Date): string {
  const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  return dias[data.getDay()];
}

/**
 * Gera array de datas úteis entre duas datas
 */
export function gerarDiasUteis(dataInicio: Date, dataFim: Date): Date[] {
  const dias: Date[] = [];
  const data = new Date(dataInicio);

  while (data <= dataFim) {
    if (eDiaUtil(data)) {
      dias.push(new Date(data));
    }
    data.setDate(data.getDate() + 1);
  }

  return dias;
}

/**
 * Identifica dias úteis sem registros de OFX, agrupados por empresa
 */
export function identificarDiasSemRegistrosPorEmpresa(
  registrosPorData: Array<{ empresaId: number; data: string; empresaNome?: string }>,
  dataInicio: Date,
  dataFim: Date
): Array<{
  empresaId: number;
  empresaNome: string;
  diasFaltando: Date[];
  totalDiasUteis: number;
  diasComRegistro: number;
}> {
  // Agrupar dados por empresa
  const empresasMap = new Map<number, { nome: string; datas: Set<string> }>();

  registrosPorData.forEach(registro => {
    if (!empresasMap.has(registro.empresaId)) {
      empresasMap.set(registro.empresaId, {
        nome: registro.empresaNome || `Empresa ${registro.empresaId}`,
        datas: new Set(),
      });
    }

    const data = parseData(registro.data);
    if (data) {
      const dataFormatada = formatarData(data);
      empresasMap.get(registro.empresaId)!.datas.add(dataFormatada);
    }
  });

  // Para cada empresa, calcular dias faltando
  const resultado = Array.from(empresasMap.entries()).map(([empresaId, dados]) => {
    // Gerar todos os dias úteis no período
    const diasUteis = gerarDiasUteis(dataInicio, dataFim);

    // Filtrar dias úteis que não têm registros
    const diasFaltando = diasUteis.filter(data => {
      const dataFormatada = formatarData(data);
      return !dados.datas.has(dataFormatada);
    });

    return {
      empresaId,
      empresaNome: dados.nome,
      diasFaltando,
      totalDiasUteis: diasUteis.length,
      diasComRegistro: dados.datas.size,
    };
  });

  return resultado;
}
