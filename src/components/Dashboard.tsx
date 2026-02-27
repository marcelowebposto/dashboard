import React, { useState, useEffect } from 'react';
import { IndicadorEmpresa } from '../types';
import pdvService from '../services/pdvService';
import CaixasAbertosPanel from './CaixasAbertosPanel';
import ConsolidacaoCaixasPanel from './ConsolidacaoCaixasPanel';
import GraficoOFX from './GraficoOFX';
import GraficoCartoes from './GraficoCartoes';
import styles from './Dashboard.module.css';

export const Dashboard: React.FC = () => {
  const [indicadores, setIndicadores] = useState<IndicadorEmpresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<string>(
    new Date().toLocaleTimeString('pt-BR')
  );
  const [refreshKey, setRefreshKey] = useState(0);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setErro(null);
      const dados = await pdvService.getIndicadores();
      setIndicadores(dados);
      setUltimaAtualizacao(new Date().toLocaleTimeString('pt-BR'));
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setErro('Erro ao carregar dados do dashboard. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();

    // Atualizar a cada 5 minutos
    const intervalo = setInterval(carregarDados, 300000);

    return () => clearInterval(intervalo);
  }, []);

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1 className={styles.titulo}>Dashboard PDV</h1>
        <div className={styles.headerInfo}>
          <span className={styles.atualizacao}>
            Última atualização: {ultimaAtualizacao}
          </span>
          <button className={styles.btnAtualizar} onClick={carregarDados}>
            Atualizar
          </button>
        </div>
      </header>

      {loading && <div className={styles.carregando}>Carregando dados...</div>}

      {erro && <div className={styles.erro}>{erro}</div>}

      {!loading && !erro && indicadores.length === 0 && (
        <div className={styles.vazio}>
          Nenhum dado disponível. Verifique se a API está funcionando.
        </div>
      )}

      {!loading && !erro && indicadores.length > 0 && (
        <main className={styles.conteudo}>
          <CaixasAbertosPanel indicadores={indicadores} />
          <ConsolidacaoCaixasPanel indicadores={indicadores} />
          <GraficoOFX refreshKey={refreshKey} />
          <GraficoCartoes refreshKey={refreshKey} />
        </main>
      )}
    </div>
  );
};

export default Dashboard;
