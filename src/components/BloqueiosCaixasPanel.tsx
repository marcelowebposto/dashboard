import React, { useState } from 'react';
import { IndicadorEmpresa } from '../types';
import styles from './CaixasAbertosPanel.module.css'; // Reutilizar estilos

interface BloqueiosCaixasPanelProps {
  indicadores: IndicadorEmpresa[];
}

export const BloqueiosCaixasPanel: React.FC<BloqueiosCaixasPanelProps> = ({ indicadores }) => {
  const [showAll, setShowAll] = useState(false);

  // Calcular dias em atraso para cada empresa
  const agora = new Date();
  const pendentesDesbloqueio = indicadores
    .map((ind) => {
      const dataBase = new Date(ind.menorDataSemBloquear || '');
      const dias = isNaN(dataBase.getTime()) ? 0 : Math.floor(
        (agora.getTime() - dataBase.getTime()) / (1000 * 60 * 60 * 24)
      );
      return { ...ind, diasAtraso: dias };
    })
    .sort((a, b) => b.diasAtraso - a.diasAtraso); // Mais dias primeiro

  // Mostrar apenas resumo se não estiver expandido
  const exibidos = showAll ? pendentesDesbloqueio : [];

  if (indicadores.length === 0) {
    return (
      <div className={styles.panel}>
        <h2 className={styles.titulo}>✅ Bloqueio de Caixas</h2>
        <div className={styles.vazio}>Nenhuma empresa disponível!</div>
      </div>
    );
  }

  // Calcular maior atraso dentre todas as empresas
  const comBloqueios = indicadores.filter((ind) => (ind.numeroCaixasBloqueados || 0) > 0);
  const maiorAtraso = pendentesDesbloqueio.length > 0 ? pendentesDesbloqueio[0].diasAtraso : 0;

  return (
    <div className={styles.panel}>
      <h2 className={styles.titulo}>🔒 Bloqueio de Caixas</h2>

      <div className={styles.info}>
        <div className={styles.infoItem}>
          <div className={styles.infoLabel}>Total de Empresas</div>
          <div className={styles.infoValue}>{pendentesDesbloqueio.length}</div>
        </div>
        <div className={styles.infoItem}>
          <div className={styles.infoLabel}>Empresas com Bloqueio</div>
          <div className={styles.infoValue} style={{ color: comBloqueios.length > 0 ? '#ff6b6b' : '#27ae60' }}>
            {comBloqueios.length}
          </div>
        </div>
        <div className={styles.infoItem}>
          <div className={styles.infoLabel}>Maior Atraso (dias)</div>
          <div className={styles.infoValue} style={{ color: maiorAtraso > 30 ? '#e74c3c' : maiorAtraso > 7 ? '#ff9800' : '#27ae60' }}>
            {maiorAtraso}
          </div>
        </div>
      </div>

      {showAll && exibidos.length > 0 && (
        <div className={styles.gridDetalhe}>
          {exibidos.map((indicador) => {
            const statusColor = indicador.diasAtraso > 30 ? '#e74c3c' : indicador.diasAtraso > 7 ? '#ff9800' : '#27ae60';

            return (
              <div key={indicador.empresaId} className={styles.cardDetalhe}>
                <div className={styles.cardDetalheHeader}>{indicador.empresaNome}</div>
                <div className={styles.cardDetalheRow}>
                  <span className={styles.cardDetalheLabel}>Bloqueados</span>
                  <span className={styles.cardDetalheValue}>{indicador.numeroCaixasBloqueados || 0}</span>
                </div>
                <div className={styles.cardDetalheRow}>
                  <span className={styles.cardDetalheLabel}>Desbloqueados</span>
                  <span className={styles.cardDetalheValue}>{indicador.numeroCaixasDesbloqueados || 0}</span>
                </div>
                <div className={styles.cardDetalheRow}>
                  <span className={styles.cardDetalheLabel}>Última Data</span>
                  <span className={styles.cardDetalheValue}>{new Date(indicador.menorDataSemBloquear || '').toLocaleDateString('pt-BR')}</span>
                </div>
                <div className={styles.cardDetalheRow}>
                  <span className={styles.cardDetalheLabel}>Dias Atraso</span>
                  <span className={styles.cardDetalheValue} style={{ color: statusColor }}>{indicador.diasAtraso} d</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className={styles.footer}>
        <button 
          className={styles.btnExpandir}
          onClick={() => setShowAll(!showAll)}
        >
          {showAll 
            ? `Mostrar menos`
            : `Mostrar detalhes (${pendentesDesbloqueio.length})`
          }
        </button>
      </div>
    </div>
  );
};

export default BloqueiosCaixasPanel;
