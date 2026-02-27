import React, { useState } from 'react';
import { IndicadorEmpresa } from '../types';
import styles from './CaixasAbertosPanel.module.css'; // Reutilizar estilos

interface ConsolidacaoCaixasPanelProps {
  indicadores: IndicadorEmpresa[];
}

export const ConsolidacaoCaixasPanel: React.FC<ConsolidacaoCaixasPanelProps> = ({ indicadores }) => {
  const [showAll, setShowAll] = useState(false);

  // Filtrar empresas com caixas sem consolidar e ordenar do mais antigo para o mais recente
  const pendentesConsolidacao = indicadores
    .filter((ind) => ind.menorDataSemConsolidar)
    .sort((a, b) => {
      const dateA = new Date(a.menorDataSemConsolidar || '').getTime();
      const dateB = new Date(b.menorDataSemConsolidar || '').getTime();
      return dateA - dateB; // Do mais antigo para o mais recente
    });

  // Mostrar apenas 10 primeiros se não estiver expandido
  const exibidos = showAll ? pendentesConsolidacao : pendentesConsolidacao.slice(0, 10);

  if (pendentesConsolidacao.length === 0) {
    return (
      <div className={styles.panel}>
        <h2 className={styles.titulo}>✅ Consolidação de Caixas</h2>
        <div className={styles.vazio}>Todos os caixas estão consolidados!</div>
      </div>
    );
  }

  // Calcular o caixa mais antigo sem consolidar
  const caixaMaisAntigo = pendentesConsolidacao[0];
  const dataAntiga = new Date(caixaMaisAntigo.menorDataSemConsolidar || '');
  const agora = new Date();
  const diasAtraso = Math.floor(
    (agora.getTime() - dataAntiga.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className={styles.panel}>
      <h2 className={styles.titulo}>⏳ Consolidação de Caixas</h2>

      <div className={styles.info}>
        <div className={styles.infoItem}>
          <div className={styles.infoLabel}>Empresas Pendentes</div>
          <div className={styles.infoValue}>{pendentesConsolidacao.length}</div>
        </div>
        <div className={styles.infoItem}>
          <div className={styles.infoLabel}>Maior Atraso (dias)</div>
          <div className={styles.infoValue} style={{ color: diasAtraso > 30 ? '#e74c3c' : '#ff9800' }}>
            {diasAtraso}
          </div>
        </div>
      </div>

      <table className={styles.tabela}>
        <thead>
          <tr>
            <th>Empresa</th>
            <th>Menor Data Sem Consolidar</th>
            <th>Dias em Atraso</th>
          </tr>
        </thead>
        <tbody>
          {exibidos.map((indicador) => {
            const dataUltimo = new Date(indicador.menorDataSemConsolidar || '');
            const diasAtraso = Math.floor(
              (agora.getTime() - dataUltimo.getTime()) / (1000 * 60 * 60 * 24)
            );
            const statusColor = diasAtraso > 30 ? '#e74c3c' : diasAtraso > 7 ? '#ff9800' : '#27ae60';

            return (
              <tr key={indicador.empresaId}>
                <td>{indicador.empresaNome}</td>
                <td>{new Date(indicador.menorDataSemConsolidar || '').toLocaleDateString('pt-BR')}</td>
                <td style={{ fontWeight: 700, color: statusColor }}>{diasAtraso} dias</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {pendentesConsolidacao.length > 10 && (
        <div className={styles.footer}>
          <button 
            className={styles.btnExpandir}
            onClick={() => setShowAll(!showAll)}
          >
            {showAll 
              ? `Mostrar menos (${Math.min(10, pendentesConsolidacao.length)} de ${pendentesConsolidacao.length})`
              : `Mostrar todos (${pendentesConsolidacao.length})`
            }
          </button>
        </div>
      )}
    </div>
  );
};

export default ConsolidacaoCaixasPanel;

