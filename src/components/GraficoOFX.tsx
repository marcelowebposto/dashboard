import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Tooltip,
  LabelList,
} from 'recharts';
import { RelatorioOFXCompleto } from '../types';
import pdvService from '../services/pdvService';
import styles from './GraficoOFX.module.css';

interface DadosMensaisGrafico {
  mes: string;
  mesAbrev: string;
  conciliados: number;
  naoConciliados: number;
  total: number;
  percentual: number;
  _sortKey: number;
}

interface DadosDiariosOFX {
  data: string;
  conciliados: number;
  naoConciliados: number;
  total: number;
  percentual: number;
}

interface GraficoOFXProps {
  refreshKey?: number;
}

export const GraficoOFX: React.FC<GraficoOFXProps> = ({ refreshKey }) => {
  const [relatorio, setRelatorio] = useState<RelatorioOFXCompleto | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [filtro, setFiltro] = useState('');
  const [ordenacao, setOrdenacao] = useState<'nome' | 'percentual'>('percentual');
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const [mesSelecionado, setMesSelecionado] = useState<string | null>(null);
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);
  const [empresaSelecionada, setEmpresaSelecionada] = useState<{ id: number; nome: string } | null>(null);

  useEffect(() => {
    carregarDados();
  }, [refreshKey]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setErro(null);
      console.log('[GraficoOFX] Iniciando carregamento de dados...');
      const dados = await pdvService.getOFX();
      console.log('[GraficoOFX] Dados recebidos:', {
        totalEmpresas: dados.empresas?.length,
        totalRegistros: dados.registrosPorData?.length,
        primeiraEmpresa: dados.empresas?.[0],
        primeiroRegistro: dados.registrosPorData?.[0],
      });
      setRelatorio(dados);
    } catch (error) {
      console.error('[GraficoOFX] Erro ao carregar dados de OFX:', error);
      setErro('Erro ao carregar dados de conciliação: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  // Handler de clique no gráfico de barras
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleBarClick = (data: any) => {
    const mes = data?.mes || data?.payload?.mes;
    if (!mes) return;
    
    if (mesSelecionado === mes) {
      setMesSelecionado(null); // Clicou no mesmo mês, limpa filtro
    } else {
      setMesSelecionado(mes);
    }
  };

  // Dados agregados por mês para o gráfico (deve estar antes dos returns condicionais)
  const dadosMensaisGrafico = useMemo((): DadosMensaisGrafico[] => {
    if (!relatorio) return [];

    const mesesMap = new Map<string, { chaveAno: number; chaveMes: number; conciliados: number; naoConciliados: number }>();

    relatorio.registrosPorData.forEach((registro) => {
      try {
        const partes = registro.data.split('/');
        let mes: number, ano: number;

        if (partes.length === 3) {
          mes = parseInt(partes[1], 10);
          ano = parseInt(partes[2], 10);
        } else if (registro.data.includes('-')) {
          const partesISO = registro.data.split('-');
          ano = parseInt(partesISO[0], 10);
          mes = parseInt(partesISO[1], 10);
        } else {
          return;
        }

        const chaveData = `${ano}-${String(mes).padStart(2, '0')}`;

        if (!mesesMap.has(chaveData)) {
          mesesMap.set(chaveData, { chaveAno: ano, chaveMes: mes, conciliados: 0, naoConciliados: 0 });
        }

        const dados = mesesMap.get(chaveData)!;
        dados.conciliados += registro.quantidadeConciliados;
        dados.naoConciliados += registro.quantidadeNaoConciliados;
      } catch (e) {
        console.error('Erro ao processar data:', registro.data);
      }
    });

    return Array.from(mesesMap.entries())
      .map(([, dados]) => {
        const mesAbrev = new Date(dados.chaveAno, dados.chaveMes - 1).toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
        const mesCompleto = new Date(dados.chaveAno, dados.chaveMes - 1).toLocaleString('pt-BR', { year: 'numeric', month: 'long' });
        const total = dados.conciliados + dados.naoConciliados;
        return {
          mes: mesCompleto,
          mesAbrev: `${mesAbrev}/${dados.chaveAno % 100}`,
          conciliados: dados.conciliados,
          naoConciliados: dados.naoConciliados,
          total,
          percentual: total > 0 ? (dados.conciliados / total) * 100 : 0,
          _sortKey: dados.chaveAno * 100 + dados.chaveMes,
        };
      })
      .sort((a, b) => a._sortKey - b._sortKey)
      .slice(-6);
  }, [relatorio]);

  // Calcular dados por empresa para o mês selecionado
  const dadosEmpresasPorMes = useMemo(() => {
    if (!relatorio || !mesSelecionado) return null;

    // Encontrar ano/mês do filtro
    const mesEncontrado = dadosMensaisGrafico.find(d => d.mes === mesSelecionado);
    if (!mesEncontrado) return null;

    // Agrupar registros por empresa para o mês selecionado
    const empresasMap = new Map<number, { conciliados: number; naoConciliados: number }>();

    relatorio.registrosPorData.forEach((registro) => {
      try {
        const partes = registro.data.split('/');
        let mes: number, ano: number;

        if (partes.length === 3) {
          mes = parseInt(partes[1], 10);
          ano = parseInt(partes[2], 10);
        } else if (registro.data.includes('-')) {
          const partesISO = registro.data.split('-');
          ano = parseInt(partesISO[0], 10);
          mes = parseInt(partesISO[1], 10);
        } else {
          return;
        }

        // Verificar se é o mesmo mês
        const mesRegistro = new Date(ano, mes - 1).toLocaleString('pt-BR', { year: 'numeric', month: 'long' });
        if (mesRegistro !== mesSelecionado) return;

        if (!empresasMap.has(registro.empresaId)) {
          empresasMap.set(registro.empresaId, { conciliados: 0, naoConciliados: 0 });
        }

        const dados = empresasMap.get(registro.empresaId)!;
        dados.conciliados += registro.quantidadeConciliados;
        dados.naoConciliados += registro.quantidadeNaoConciliados;
      } catch (e) {
        console.error('Erro ao processar data:', registro.data);
      }
    });

    return empresasMap;
  }, [relatorio, mesSelecionado, dadosMensaisGrafico]);

  // Empresas filtradas e ordenadas
  const empresasFiltradas = useMemo(() => {
    if (!relatorio) return [];

    let empresas = relatorio.empresas.filter((e) =>
      e.empresaNome.toLowerCase().includes(filtro.toLowerCase())
    );

    // Filtrar por mês selecionado se houver
    if (mesSelecionado && dadosEmpresasPorMes) {
      empresas = empresas
        .filter((e) => dadosEmpresasPorMes.has(e.empresaId))
        .map((e) => {
          const dados = dadosEmpresasPorMes.get(e.empresaId)!;
          const total = dados.conciliados + dados.naoConciliados;
          return {
            ...e,
            totalConciliados: dados.conciliados,
            totalNaoConciliados: dados.naoConciliados,
            percentualConciliacao: total > 0 ? (dados.conciliados / total) * 100 : 0,
          };
        });
    }

    return empresas.sort((a, b) => {
      if (ordenacao === 'nome') {
        return a.empresaNome.localeCompare(b.empresaNome);
      }
      return a.percentualConciliacao - b.percentualConciliacao;
    });
  }, [relatorio, filtro, ordenacao, mesSelecionado, dadosEmpresasPorMes]);

  const percentualMedio = relatorio?.percentualConciliacaoGeral ?? 0;

  // Obter dados diários de uma empresa específica (filtrado por mês se selecionado)
  const dadosDiariosEmpresa = useMemo((): DadosDiariosOFX[] => {
    if (!relatorio || !empresaSelecionada) return [];

    let registrosEmpresa = relatorio.registrosPorData.filter(
      (r) => r.empresaId === empresaSelecionada.id
    );

    // Filtrar pelo mês selecionado se houver
    if (mesSelecionado) {
      registrosEmpresa = registrosEmpresa.filter((registro) => {
        try {
          const partes = registro.data.split('/');
          if (partes.length === 3) {
            const mes = parseInt(partes[1], 10);
            const ano = parseInt(partes[2], 10);
            const mesCompleto = new Date(ano, mes - 1).toLocaleString('pt-BR', { year: 'numeric', month: 'long' });
            return mesCompleto === mesSelecionado;
          }
        } catch (e) {
          return false;
        }
        return false;
      });
    }

    return registrosEmpresa
      .map((registro) => ({
        data: registro.data,
        conciliados: registro.quantidadeConciliados,
        naoConciliados: registro.quantidadeNaoConciliados,
        total: registro.quantidadeRegistros,
        percentual: registro.quantidadeRegistros > 0 ? (registro.quantidadeConciliados / registro.quantidadeRegistros) * 100 : 0,
      }))
      .sort((a, b) => {
        // Ordenar por data decrescente
        const partesA = a.data.split('/');
        const partesB = b.data.split('/');
        const dataA = new Date(parseInt(partesA[2]), parseInt(partesA[1]) - 1, parseInt(partesA[0]));
        const dataB = new Date(parseInt(partesB[2]), parseInt(partesB[1]) - 1, parseInt(partesB[0]));
        return dataB.getTime() - dataA.getTime();
      });
  }, [relatorio, empresaSelecionada, mesSelecionado]);

  const getCorBarra = (percentual: number): string => {
    if (percentual >= 95) return '#A8D5BA';
    if (percentual >= 85) return '#B8E6F0';
    if (percentual >= 70) return '#FFD4A3';
    return '#FFB8B8';
  };

  if (loading) {
    return <div className={styles.container}>Carregando dados...</div>;
  }

  if (erro) {
    return <div className={styles.container + ' ' + styles.erro}>{erro}</div>;
  }

  if (!relatorio || relatorio.empresas.length === 0) {
    return (
      <div className={styles.container}>
        Nenhum dado de OFX disponível
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.titulo}>Conciliação de OFX</h2>
        <button className={styles.btnAtualizar} onClick={carregarDados}>
          Atualizar
        </button>
      </div>

      {/* Cards de resumo */}
      <div className={styles.resumo}>
        <div className={styles.card}>
          <span className={styles.label}>Total de Empresas</span>
          <span className={styles.valor}>{relatorio.empresas.length}</span>
        </div>
        <div className={styles.card}>
          <span className={styles.label}>Registros Conciliados</span>
          <span className={styles.valor + ' ' + styles.conciliado}>
            {relatorio.totalGeralConciliados.toLocaleString('pt-BR')}
          </span>
        </div>
        <div className={styles.card}>
          <span className={styles.label}>Registros Não Conciliados</span>
          <span className={styles.valor + ' ' + styles.naoConciliado}>
            {relatorio.totalGeralNaoConciliados.toLocaleString('pt-BR')}
          </span>
        </div>
        <div className={styles.card}>
          <span className={styles.label}>Conciliação Média</span>
          <span className={styles.valor}>
            {percentualMedio.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Gráfico de barras por mês */}
      <div className={styles.graficoBarras}>
        <h3 className={styles.subTitulo}>Proporcionalidade Geral por Mês</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={dadosMensaisGrafico}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
            <XAxis 
              dataKey="mesAbrev" 
              tick={{ fill: '#666', fontSize: 12 }}
              axisLine={{ stroke: '#E0E0E0' }}
            />
            <YAxis 
              tick={{ fill: '#666', fontSize: 12 }}
              axisLine={{ stroke: '#E0E0E0' }}
              tickFormatter={(value) => value.toLocaleString('pt-BR')}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '2px solid rgba(168, 213, 186, 0.3)',
                borderRadius: '8px',
              }}
              formatter={(value, name) => [
                Number(value).toLocaleString('pt-BR'),
                name === 'conciliados' ? 'Conciliados' : 'Não Conciliados'
              ]}
              labelFormatter={(label) => {
                const item = dadosMensaisGrafico.find(d => d.mesAbrev === label);
                return item ? `${item.mes} (${item.percentual.toFixed(1)}% conciliado)` : String(label);
              }}
            />
            <Legend 
              formatter={(value) => value === 'conciliados' ? 'Conciliados' : 'Não Conciliados'}
            />
            <Bar 
              dataKey="conciliados" 
              fill="#A8D5BA" 
              radius={[4, 4, 0, 0]}
              name="conciliados"
              cursor="pointer"
              onClick={(data) => handleBarClick(data)}
            >
              <LabelList 
                dataKey="conciliados" 
                position="top" 
                fill="#449966"
                fontSize={11}
                fontWeight={600}
                formatter={(value) => Number(value).toLocaleString('pt-BR')}
              />
            </Bar>
            <Bar 
              dataKey="naoConciliados" 
              fill="#FFD4A3" 
              radius={[4, 4, 0, 0]}
              name="naoConciliados"
              cursor="pointer"
              onClick={(data) => handleBarClick(data)}
            >
              <LabelList 
                dataKey="naoConciliados" 
                position="top" 
                fill="#D97706"
                fontSize={11}
                fontWeight={600}
                formatter={(value) => Number(value).toLocaleString('pt-BR')}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Botão Detalhar */}
      <button
        className={styles.btnDetalhar}
        onClick={() => setMostrarDetalhes(!mostrarDetalhes)}
      >
        {mostrarDetalhes ? 'Ocultar Detalhes' : 'Detalhar por Empresa'}
      </button>

      {/* Tabela completa */}
      {mostrarDetalhes && (
      <div className={styles.tabela}>
        <div className={styles.tabelaHeader}>
          <h3 className={styles.subTitulo}>
            Lista Completa de Empresas
            {mesSelecionado && (
              <span className={styles.filtroMes}>
                {' '}- {mesSelecionado}
                <button
                  className={styles.btnLimparFiltro}
                  onClick={() => setMesSelecionado(null)}
                  title="Limpar filtro"
                >
                  ✕
                </button>
              </span>
            )}
          </h3>
          <div className={styles.controles}>
            <input
              type="text"
              placeholder="Filtrar por nome..."
              className={styles.inputFiltro}
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
            <select
              className={styles.selectOrdenacao}
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value as 'nome' | 'percentual')}
            >
              <option value="percentual">Ordenar: Menor Conciliação</option>
              <option value="nome">Ordenar: Por Nome</option>
            </select>
          </div>
        </div>

        <div className={styles.tabelaConteudo}>
          <div className={styles.tabelaLinhaHeader}>
            <span className={styles.colNome}>Empresa</span>
            <span className={styles.colNumeros}>Conciliados</span>
            <span className={styles.colNumeros}>Não Conciliados</span>
            <span className={styles.colPercentual}>Percentual</span>
          </div>
          {(mostrarTodos ? empresasFiltradas : empresasFiltradas.slice(0, 10)).map((empresa) => (
            <div
              key={empresa.empresaId}
              className={styles.tabelaLinhaContainer}
            >
              <div
                className={styles.tabelaLinha}
                style={{
                  opacity: empresa.percentualConciliacao < 85 ? 1 : 0.7,
                }}
                onClick={() => setEmpresaSelecionada({ id: empresa.empresaId, nome: empresa.empresaNome })}
              >
                <span
                  className={styles.colNome}
                  title={empresa.empresaNome}
                >
                  {empresa.empresaNome}
                </span>
                <span className={styles.colNumeros}>
                  {empresa.totalConciliados.toLocaleString('pt-BR')}
                </span>
                <span className={styles.colNumeros}>
                  {empresa.totalNaoConciliados.toLocaleString('pt-BR')}
                </span>
                <span className={styles.colPercentual}>
                  <div className={styles.barraProgresso}>
                    <div
                      className={styles.barra}
                      style={{
                        width: `${empresa.percentualConciliacao}%`,
                        backgroundColor:
                          empresa.percentualConciliacao >= 95
                            ? '#A8D5BA'
                            : empresa.percentualConciliacao >= 85
                              ? '#B8E6F0'
                              : '#FFD4A3',
                      }}
                    />
                  </div>
                  <span className={styles.percentualTexto}>
                    {empresa.percentualConciliacao.toFixed(1)}%
                  </span>
                </span>
              </div>
            </div>
          ))}
        </div>
        {empresasFiltradas.length === 0 && (
          <div className={styles.vazio}>
            Nenhuma empresa encontrada com o filtro aplicado
          </div>
        )}
        {empresasFiltradas.length > 10 && (
          <button
            className={styles.btnMostrarTodos}
            onClick={() => setMostrarTodos(!mostrarTodos)}
          >
            {mostrarTodos
              ? 'Ocultar empresas'
              : `Mostrar todas (${empresasFiltradas.length - 10} restantes)`}
          </button>
        )}
      </div>
      )}

      {/* Modal de detalhes diários */}
      {empresaSelecionada && (
        <div className={styles.modalOverlay} onClick={() => setEmpresaSelecionada(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitulo}>
                Detalhes Diários - {empresaSelecionada.nome}
                {mesSelecionado && <span className={styles.modalMes}> ({mesSelecionado})</span>}
              </h3>
              <button
                className={styles.modalFechar}
                onClick={() => setEmpresaSelecionada(null)}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalConteudo}>
              <div className={styles.modalTabelaHeader}>
                <span>Data</span>
                <span style={{ textAlign: 'right' }}>Conciliados</span>
                <span style={{ textAlign: 'right' }}>Não Conciliados</span>
                <span style={{ textAlign: 'right' }}>Total</span>
                <span>% Conciliação</span>
              </div>
              <div className={styles.modalTabelaBody}>
                {dadosDiariosEmpresa.length === 0 ? (
                  <div className={styles.vazio}>Nenhum registro encontrado</div>
                ) : (
                  dadosDiariosEmpresa.map((dia, idx) => (
                    <div key={idx} className={styles.modalTabelaLinha}>
                      <span className={styles.colData}>{dia.data}</span>
                      <span className={styles.colNumeros}>{dia.conciliados.toLocaleString('pt-BR')}</span>
                      <span className={styles.colNumeros}>{dia.naoConciliados.toLocaleString('pt-BR')}</span>
                      <span className={styles.colNumeros}>{dia.total.toLocaleString('pt-BR')}</span>
                      <div className={styles.colPercentual}>
                        <div className={styles.barraProgresso}>
                          <div
                            className={styles.barra}
                            style={{
                              width: `${dia.percentual}%`,
                              backgroundColor: getCorBarra(dia.percentual),
                            }}
                          />
                        </div>
                        <span className={styles.percentualTexto}>
                          {dia.percentual.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GraficoOFX;
