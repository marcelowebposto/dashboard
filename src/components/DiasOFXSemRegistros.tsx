import React, { useState, useEffect, useMemo } from 'react';
import { RelatorioOFXCompleto } from '../types';
import pdvService from '../services/pdvService';
import {
  identificarDiasSemRegistrosPorEmpresa,
  formatarData,
  getNomeDiaSemana,
} from '../services/feriadosService';
import styles from './DiasOFXSemRegistros.module.css';

interface DiasOFXSemRegistrosProps {
  refreshKey?: number;
}

export const DiasOFXSemRegistros: React.FC<DiasOFXSemRegistrosProps> = ({ refreshKey }) => {
  const [relatorio, setRelatorio] = useState<RelatorioOFXCompleto | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [periodoMeses, setPeriodoMeses] = useState(1); // Último mês por padrão
  const [expandido, setExpandido] = useState(false); // Começar colapsado

  useEffect(() => {
    carregarDados();
  }, [refreshKey]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setErro(null);
      console.log('[DiasOFXSemRegistros] Iniciando carregamento de dados...');
      const dados = await pdvService.getOFX();
      setRelatorio(dados);
    } catch (error) {
      console.error('[DiasOFXSemRegistros] Erro ao carregar dados:', error);
      setErro('Erro ao carregar dados: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  // Calcular dias sem registros
  const analise = useMemo(() => {
    if (!relatorio || relatorio.registrosPorData.length === 0) {
      return null;
    }

    // Definir período de análise (últimos N meses completos, excluindo hoje)
    const hoje = new Date();
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);
    
    const dataFim = ontem;
    
    // Começar do primeiro dia do mês, N meses atrás
    // Ex: Se estamos em março e periodoMeses=3, pega janeiro, fevereiro e março
    const dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - (periodoMeses - 1), 1);

    console.log('[DiasOFXSemRegistros] Período de análise:', dataInicio, 'a', dataFim);
    console.log('[DiasOFXSemRegistros] Total de registros:', relatorio.registrosPorData.length);

    // Preparar dados com nome da empresa
    const registrosComEmpresa = relatorio.registrosPorData.map(r => ({
      empresaId: r.empresaId,
      data: r.data,
      empresaNome: relatorio.empresas.find(e => e.empresaId === r.empresaId)?.empresaNome || `Empresa ${r.empresaId}`,
    }));

    const resultado = identificarDiasSemRegistrosPorEmpresa(registrosComEmpresa, dataInicio, dataFim);

    console.log('[DiasOFXSemRegistros] Análise por empresa:', resultado);

    return resultado;
  }, [relatorio, periodoMeses]);

  const totalDiasFaltandoGeral = useMemo(() => {
    if (!analise) return 0;
    return analise.reduce((acc, empresa) => acc + empresa.diasFaltando.length, 0);
  }, [analise]);

  const empresasComFaltas = useMemo(() => {
    if (!analise) return [];
    return analise.filter(e => e.diasFaltando.length > 0).sort((a, b) => b.diasFaltando.length - a.diasFaltando.length);
  }, [analise]);

  const empresas100Porcento = useMemo(() => {
    if (!analise) return 0;
    return analise.filter(e => e.diasFaltando.length === 0).length;
  }, [analise]);

  const percentualDiasImportar = useMemo(() => {
    if (!analise || analise.length === 0) return 0;
    const totalDiasUteisGeral = analise.reduce((acc, e) => acc + e.totalDiasUteis, 0);
    if (totalDiasUteisGeral === 0) return 0;
    return (totalDiasFaltandoGeral / totalDiasUteisGeral) * 100;
  }, [analise, totalDiasFaltandoGeral]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.carregando}>Carregando dados...</div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className={styles.container}>
        <div className={styles.erro}>{erro}</div>
      </div>
    );
  }

  if (!analise) {
    return (
      <div className={styles.container}>
        <div className={styles.vazio}>Nenhum dado de OFX disponível</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.cabecalho}>
        <h2 className={styles.titulo}>Dias sem Registros OFX por Empresa</h2>
        <label className={styles.labelPeriodo}>
          Período:
          <select
            value={periodoMeses}
            onChange={(e) => setPeriodoMeses(parseInt(e.target.value, 10))}
            className={styles.selectPeriodo}
          >
            <option value={1}>Último mês</option>
            <option value={3}>Últimos 3 meses</option>
            <option value={6}>Últimos 6 meses</option>
          </select>
        </label>
      </div>

      <div className={styles.resumoGeral}>
        <div className={styles.cartaoResumo}>
          <div className={`${styles.valor} ${empresas100Porcento === analise.length ? styles.verde : ''}`}>
            {empresas100Porcento}
          </div>
          <div className={styles.rotulo}>Empresas 100%</div>
          <div className={styles.subtexto}>(sem dias faltando)</div>
        </div>

        <div className={styles.cartaoResumo}>
          <div className={`${styles.valor} ${empresasComFaltas.length === 0 ? styles.verde : styles.vermelho}`}>
            {empresasComFaltas.length}
          </div>
          <div className={styles.rotulo}>Empresas faltando</div>
          <div className={styles.subtexto}>({totalDiasFaltandoGeral} dias no total)</div>
        </div>

        <div className={styles.cartaoResumo}>
          <div className={`${styles.valor} ${percentualDiasImportar === 0 ? styles.verde : styles.vermelho}`}>
            {percentualDiasImportar.toFixed(1)}%
          </div>
          <div className={styles.rotulo}>Dias a importar</div>
          <div className={styles.subtexto}>(do total de dias úteis)</div>
        </div>
      </div>

      <button
        className={styles.btnDetalhar}
        onClick={() => setExpandido(!expandido)}
      >
        {expandido ? 'Ocultar Detalhes' : 'Detalhar por Empresa'}
      </button>

      {expandido && (
        <>
          {empresasComFaltas.length > 0 ? (
            <div className={styles.secaoDias}>
              <h3 className={styles.subtitulo}>Empresas com dias sem registros:</h3>
              <div className={styles.tabelaEmpresas}>
                {empresasComFaltas.map((empresa) => (
                  <div key={empresa.empresaId} className={styles.linhaEmpresa}>
                    <div className={styles.colunaEmpresa}>
                      <div className={styles.nomeEmpresa}>{empresa.empresaNome}</div>
                      <div className={styles.infoEmpresa}>
                        {empresa.diasFaltando.length} dia(s) faltando de {empresa.totalDiasUteis}
                      </div>
                    </div>
                    <div className={styles.colunaDias}>
                      <div className={styles.listaDiasPequeña}>
                        {empresa.diasFaltando.map((data, idx) => (
                          <div key={idx} className={styles.itemDiaPequeño}>
                            <span className={styles.dataDia}>{formatarData(data)}</span>
                            <span className={styles.diaSemana}>{getNomeDiaSemana(data)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.mensagemSucesso}>
              ✓ Todas as empresas têm registros de OFX em todos os dias úteis!
            </div>
          )}

          <div className={styles.notaDisclaimer}>
            <strong>Nota:</strong> Análise de dias úteis (seg-sex) excluindo fins de semana, feriados e o dia de hoje.
          </div>
        </>
      )}
    </div>
  );
};

export default DiasOFXSemRegistros;
