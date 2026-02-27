import React from 'react';
import { IndicadorEmpresa } from '../types';
import IndicadorCard from './IndicadorCard';
import styles from './PDVIndicadores.module.css';

interface EmpresaIndicadoresProps {
  indicador: IndicadorEmpresa;
}

export const EmpresaIndicadores: React.FC<EmpresaIndicadoresProps> = ({ indicador }) => {
  const formatarData = (dataStr?: string): string => {
    if (!dataStr) return 'N/A';
    const data = new Date(dataStr);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatarTempo = (minutos: number): string => {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h ${mins}m`;
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.titulo}>{indicador.empresaNome}</h2>
      <div className={styles.grid}>
        <IndicadorCard
          titulo="Caixas em Aberto"
          valor={indicador.numeroCaixasAbertos}
          tema={indicador.numeroCaixasAbertos > 0 ? 'aviso' : 'sucesso'}
        />
        <IndicadorCard
          titulo="Menor Data - Caixa Aberto"
          valor={formatarData(indicador.menorDataCaixaAberto)}
          tema="primario"
        />
        <IndicadorCard
          titulo="Caixas Fechados"
          valor={indicador.numeroCaixasFechados}
          tema="sucesso"
        />
        <IndicadorCard
          titulo="Menor Data - Sem Consolidar"
          valor={formatarData(indicador.menorDataSemConsolidar)}
          tema="primario"
        />
        <IndicadorCard
          titulo="Tempo Médio de Consolidação"
          valor={formatarTempo(indicador.tempoMedioConsolidacao)}
          tema="primario"
        />
      </div>
    </div>
  );
};

// Exportar com nome antigo para compatibilidade
export const PDVIndicadores = EmpresaIndicadores;

export default EmpresaIndicadores;
