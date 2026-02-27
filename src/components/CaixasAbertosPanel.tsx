import React, { useState } from 'react';
import { IndicadorEmpresa } from '../types';
import styles from './CaixasAbertosPanel.module.css';

interface CaixasAbertosPanelProps {
  indicadores: IndicadorEmpresa[];
}

export const CaixasAbertosPanel: React.FC<CaixasAbertosPanelProps> = ({ indicadores }) => {
  const [showAll, setShowAll] = useState(false);

  // Filtrar apenas empresas com caixas abertos > 0
  const caixasAbertos = indicadores
    .filter((ind) => ind.numeroCaixasAbertos > 0)
    .sort((a, b) => b.numeroCaixasAbertos - a.numeroCaixasAbertos);

  // Mostrar apenas 10 primeiros se não estiver expandido
  const caixasExibidos = showAll ? caixasAbertos : caixasAbertos.slice(0, 10);

  if (caixasAbertos.length === 0) {
    return (
      <div className={styles.panel}>
        <h2 className={styles.titulo}>🔴 Caixas em Aberto</h2>
        <div className={styles.vazio}>Nenhuma empresa com caixas em aberto</div>
      </div>
    );
  }

  const totalCaixasAbertos = caixasAbertos.reduce((acc, ind) => acc + ind.numeroCaixasAbertos, 0);

  return (
    <div className={styles.panel}>
      <h2 className={styles.titulo}>🔴 Caixas em Aberto</h2>

      <div className={styles.info}>
        <div className={styles.infoItem}>
          <div className={styles.infoLabel}>Total de Caixas Abertos</div>
          <div className={styles.infoValue}>{totalCaixasAbertos}</div>
        </div>
        <div className={styles.infoItem}>
          <div className={styles.infoLabel}>Empresas Afetadas</div>
          <div className={styles.infoValue}>{caixasAbertos.length}</div>
        </div>
      </div>

      <table className={styles.tabela}>
        <thead>
          <tr>
            <th>Empresa</th>
            <th>Caixas Abertos</th>
            <th>Menor Data</th>
          </tr>
        </thead>
        <tbody>
          {caixasExibidos.map((indicador) => (
            <tr key={indicador.empresaId}>
              <td>{indicador.empresaNome}</td>
              <td className={styles.numeroAberto}>{indicador.numeroCaixasAbertos}</td>
              <td className={styles.dataAberta}>
                {indicador.menorDataCaixaAberto
                  ? new Date(indicador.menorDataCaixaAberto).toLocaleDateString('pt-BR')
                  : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {caixasAbertos.length > 10 && (
        <div className={styles.footer}>
          <button 
            className={styles.btnExpandir}
            onClick={() => setShowAll(!showAll)}
          >
            {showAll 
              ? `Mostrar menos (${Math.min(10, caixasAbertos.length)} de ${caixasAbertos.length})`
              : `Mostrar todos (${caixasAbertos.length})`
            }
          </button>
        </div>
      )}
    </div>
  );
};

export default CaixasAbertosPanel;

