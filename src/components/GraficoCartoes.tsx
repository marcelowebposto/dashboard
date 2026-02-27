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
import { RelatorioCartoesPagamento } from '../types';
import pdvService from '../services/pdvService';
import styles from './GraficoCartoes.module.css';

interface DadosDiarios {
  data: string;
  recebido: number;
  emRemessaAberta: number;
  aberto: number;
  total: number;
  percentual: number;
}

interface DadosMensaisGrafico {
  mes: string;
  mesAbrev: string;
  recebido: number;
  emRemessaAberta: number;
  aberto: number;
  total: number;
  percentual: number;
  _sortKey: number;
}

interface GraficoCartoesProps {
  refreshKey?: number;
}

export const GraficoCartoes: React.FC<GraficoCartoesProps> = ({ refreshKey }) => {
  const [relatorio, setRelatorio] = useState<RelatorioCartoesPagamento | null>(null);
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
      console.log('[GraficoCartoes] Iniciando carregamento de dados...');
      const dados = await pdvService.getCartoesPagamento();
      console.log('[GraficoCartoes] Dados recebidos:', {
        totalEmpresas: dados.empresas?.length,
        totalRegistros: dados.registrosPorData?.length,
        primeiraEmpresa: dados.empresas?.[0],
        primeiroRegistro: dados.registrosPorData?.[0],
      });
      setRelatorio(dados);
    } catch (error) {
      console.error('[GraficoCartoes] Erro ao carregar dados de Cartões:', error);
      setErro('Erro ao carregar dados de cartões: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
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
      setMesSelecionado(null);
    } else {
      setMesSelecionado(mes);
    }
  };

  // Dados agregados por mês para o gráfico
  const dadosMensaisGrafico = useMemo((): DadosMensaisGrafico[] => {
    if (!relatorio) return [];

    const mesesMap = new Map<string, { chaveAno: number; chaveMes: number; recebido: number; emRemessaAberta: number; aberto: number; total: number }>();

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
          mesesMap.set(chaveData, { chaveAno: ano, chaveMes: mes, recebido: 0, emRemessaAberta: 0, aberto: 0, total: 0 });
        }

        const dados = mesesMap.get(chaveData)!;
        dados.recebido += registro.recebido;
        dados.emRemessaAberta += registro.emRemessaAberta;
        dados.aberto += registro.aberto;
        dados.total += registro.total;
      } catch (e) {
        console.error('Erro ao processar data:', registro.data);
      }
    });

    return Array.from(mesesMap.entries())
      .map(([, dados]) => {
        const mesAbrev = new Date(dados.chaveAno, dados.chaveMes - 1).toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
        const mesCompleto = new Date(dados.chaveAno, dados.chaveMes - 1).toLocaleString('pt-BR', { year: 'numeric', month: 'long' });
        return {
          mes: mesCompleto,
          mesAbrev: `${mesAbrev}/${dados.chaveAno % 100}`,
          recebido: dados.recebido,
          emRemessaAberta: dados.emRemessaAberta,
          aberto: dados.aberto,
          total: dados.total,
          percentual: dados.total > 0 ? (dados.recebido / dados.total) * 100 : 0,
          _sortKey: dados.chaveAno * 100 + dados.chaveMes,
        };
      })
      .sort((a, b) => a._sortKey - b._sortKey)
      .slice(-6);
  }, [relatorio]);

  // Calcular dados por empresa para o mês selecionado
  const dadosEmpresasPorMes = useMemo(() => {
    if (!relatorio || !mesSelecionado) return null;

    const mesEncontrado = dadosMensaisGrafico.find(d => d.mes === mesSelecionado);
    if (!mesEncontrado) return null;

    const empresasMap = new Map<number, { recebido: number; emRemessaAberta: number; aberto: number; total: number }>();

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

        const mesCompleto = new Date(ano, mes - 1).toLocaleString('pt-BR', { year: 'numeric', month: 'long' });
        if (mesCompleto !== mesSelecionado) return;

        if (!empresasMap.has(registro.empresaId)) {
          empresasMap.set(registro.empresaId, { recebido: 0, emRemessaAberta: 0, aberto: 0, total: 0 });
        }

        const dados = empresasMap.get(registro.empresaId)!;
        dados.recebido += registro.recebido;
        dados.emRemessaAberta += registro.emRemessaAberta;
        dados.aberto += registro.aberto;
        dados.total += registro.total;
      } catch (e) {
        console.error('Erro ao processar registro:', e);
      }
    });

    return Array.from(empresasMap.entries()).map(([empresaId, dados]) => {
      const empresa = relatorio.empresas.find(e => e.empresaId === empresaId);
      return {
        empresaId,
        empresaNome: empresa?.empresaNome || `Empresa ${empresaId}`,
        recebido: dados.recebido,
        emRemessaAberta: dados.emRemessaAberta,
        aberto: dados.aberto,
        total: dados.total,
        percentualRecebido: dados.total > 0 ? (dados.recebido / dados.total) * 100 : 0,
      };
    });
  }, [relatorio, mesSelecionado, dadosMensaisGrafico]);

  // Empresas filtradas e ordenadas
  const empresasFiltradas = useMemo(() => {
    if (!relatorio) return [];

    const dadosBase = dadosEmpresasPorMes || relatorio.empresas;
    
    let resultado = dadosBase.filter((empresa) =>
      empresa.empresaNome.toLowerCase().includes(filtro.toLowerCase())
    );

    resultado.sort((a, b) => {
      if (ordenacao === 'nome') {
        return a.empresaNome.localeCompare(b.empresaNome);
      }
      return a.percentualRecebido - b.percentualRecebido;
    });

    return resultado;
  }, [relatorio, dadosEmpresasPorMes, filtro, ordenacao]);

  const empresasExibidas = mostrarTodos ? empresasFiltradas : empresasFiltradas.slice(0, 20);

  // Calcular percentual médio
  const percentualMedio = useMemo(() => {
    if (!relatorio || relatorio.empresas.length === 0) return 0;
    const soma = relatorio.empresas.reduce((acc, emp) => acc + emp.percentualRecebido, 0);
    return soma / relatorio.empresas.length;
  }, [relatorio]);

  // Obter dados diários de uma empresa específica (filtrado por mês se selecionado)
  const dadosDiariosEmpresa = useMemo((): DadosDiarios[] => {
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
        recebido: registro.recebido,
        emRemessaAberta: registro.emRemessaAberta,
        aberto: registro.aberto,
        total: registro.total,
        percentual: registro.total > 0 ? (registro.recebido / registro.total) * 100 : 0,
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
    if (percentual >= 90) return '#4CAF50';
    if (percentual >= 70) return '#8BC34A';
    if (percentual >= 50) return '#FFC107';
    if (percentual >= 30) return '#FF9800';
    return '#F44336';
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.carregando}>Carregando dados de cartões...</div>
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

  if (!relatorio) {
    return (
      <div className={styles.container}>
        <div className={styles.vazio}>Nenhum dado disponível</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.titulo}>Cartões de Pagamento</h2>
        <button className={styles.btnAtualizar} onClick={carregarDados}>
          Atualizar
        </button>
      </div>

      {/* Cards de resumo */}
      <div className={styles.resumo}>
        <div className={styles.card}>
          <span className={styles.label}>Total Cartões</span>
          <span className={styles.valor}>
            {relatorio.totalGeral.toLocaleString('pt-BR')}
          </span>
        </div>
        <div className={styles.card}>
          <span className={styles.label}>Recebidos</span>
          <span className={`${styles.valor} ${styles.recebido}`}>
            {relatorio.totalGeralRecebido.toLocaleString('pt-BR')}
          </span>
        </div>
        <div className={styles.card}>
          <span className={styles.label}>Em Remessa</span>
          <span className={`${styles.valor} ${styles.pendente}`}>
            {relatorio.totalGeralEmRemessaAberta.toLocaleString('pt-BR')}
          </span>
        </div>
        <div className={styles.card}>
          <span className={styles.label}>Abertos</span>
          <span className={`${styles.valor} ${styles.aberto}`}>
            {relatorio.totalGeralAberto.toLocaleString('pt-BR')}
          </span>
        </div>
        <div className={styles.card}>
          <span className={styles.label}>% Recebido</span>
          <span className={`${styles.valor} ${styles.recebido}`}>
            {relatorio.percentualRecebidoGeral.toFixed(1)}%
          </span>
        </div>
        <div className={styles.card}>
          <span className={styles.label}>Média Empresas</span>
          <span className={styles.valor}>
            {percentualMedio.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Gráfico de barras por mês */}
      <div className={styles.graficoBarras}>
        <h3 className={styles.subTitulo}>Recebimento de Cartões por Mês</h3>
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
                border: '2px solid rgba(124, 156, 191, 0.3)',
                borderRadius: '8px',
              }}
              formatter={(value, name) => [
                Number(value).toLocaleString('pt-BR'),
                name === 'recebido' ? 'Recebidos' : name === 'emRemessaAberta' ? 'Em Remessa' : 'Abertos'
              ]}
              labelFormatter={(label) => {
                const item = dadosMensaisGrafico.find(d => d.mesAbrev === label);
                return item ? `${item.mes} (${item.percentual.toFixed(1)}% recebido)` : String(label);
              }}
            />
            <Legend 
              formatter={(value) => value === 'recebido' ? 'Recebidos' : value === 'emRemessaAberta' ? 'Em Remessa' : 'Abertos'}
            />
            <Bar 
              dataKey="recebido" 
              fill="#4CAF50" 
              radius={[4, 4, 0, 0]}
              name="recebido"
              cursor="pointer"
              onClick={(data) => handleBarClick(data)}
            >
              <LabelList 
                dataKey="recebido" 
                position="top" 
                fill="#2E7D32"
                fontSize={11}
                fontWeight={600}
                formatter={(value) => Number(value).toLocaleString('pt-BR')}
              />
            </Bar>
            <Bar 
              dataKey="emRemessaAberta" 
              fill="#FFC107" 
              radius={[4, 4, 0, 0]}
              name="emRemessaAberta"
              cursor="pointer"
              onClick={(data) => handleBarClick(data)}
            >
              <LabelList 
                dataKey="emRemessaAberta" 
                position="top" 
                fill="#D97706"
                fontSize={11}
                fontWeight={600}
                formatter={(value) => Number(value).toLocaleString('pt-BR')}
              />
            </Bar>
            <Bar 
              dataKey="aberto" 
              fill="#F44336" 
              radius={[4, 4, 0, 0]}
              name="aberto"
              cursor="pointer"
              onClick={(data) => handleBarClick(data)}
            >
              <LabelList 
                dataKey="aberto" 
                position="top" 
                fill="#C64567"
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
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className={styles.inputFiltro}
            />
            <select
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value as 'nome' | 'percentual')}
              className={styles.selectOrdenacao}
            >
              <option value="percentual">Ordenar por % recebido</option>
              <option value="nome">Ordenar por nome</option>
            </select>
          </div>
        </div>

        <div className={styles.tabelaConteudo}>
          <div className={styles.tabelaLinhaHeader}>
            <span>Empresa</span>
            <span style={{ textAlign: 'right' }}>Recebidos</span>
            <span style={{ textAlign: 'right' }}>Em Remessa</span>
            <span style={{ textAlign: 'right' }}>Abertos</span>
            <span style={{ textAlign: 'right' }}>Total</span>
            <span>% Recebido</span>
          </div>

          {empresasExibidas.length === 0 ? (
            <div className={styles.vazio}>Nenhuma empresa encontrada</div>
          ) : (
            empresasExibidas.map((empresa) => (
              <div key={empresa.empresaId} className={styles.tabelaLinhaContainer}>
                <div 
                  className={styles.tabelaLinha}
                  onClick={() => setEmpresaSelecionada({ id: empresa.empresaId, nome: empresa.empresaNome })}
                >
                  <span className={styles.colNome} title={empresa.empresaNome}>
                    {empresa.empresaNome}
                  </span>
                  <span className={styles.colNumeros}>
                    {'totalRecebido' in empresa ? empresa.totalRecebido.toLocaleString('pt-BR') : empresa.recebido.toLocaleString('pt-BR')}
                  </span>
                  <span className={styles.colNumeros}>
                    {'totalEmRemessaAberta' in empresa ? empresa.totalEmRemessaAberta.toLocaleString('pt-BR') : empresa.emRemessaAberta.toLocaleString('pt-BR')}
                  </span>
                  <span className={styles.colNumeros}>
                    {'totalAberto' in empresa ? empresa.totalAberto.toLocaleString('pt-BR') : empresa.aberto.toLocaleString('pt-BR')}
                  </span>
                  <span className={styles.colNumeros}>
                    {empresa.total.toLocaleString('pt-BR')}
                  </span>
                  <div className={styles.colPercentual}>
                    <div className={styles.barraProgresso}>
                      <div
                        className={styles.barra}
                        style={{
                          width: `${empresa.percentualRecebido}%`,
                          backgroundColor: getCorBarra(empresa.percentualRecebido),
                        }}
                      />
                    </div>
                    <span className={styles.percentualTexto}>
                      {empresa.percentualRecebido.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {empresasFiltradas.length > 20 && (
          <button
            className={styles.btnMostrarTodos}
            onClick={() => setMostrarTodos(!mostrarTodos)}
          >
            {mostrarTodos
              ? 'Mostrar menos'
              : `Mostrar todas (${empresasFiltradas.length} empresas)`}
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
                <span style={{ textAlign: 'right' }}>Recebidos</span>
                <span style={{ textAlign: 'right' }}>Em Remessa</span>
                <span style={{ textAlign: 'right' }}>Abertos</span>
                <span style={{ textAlign: 'right' }}>Total</span>
                <span>% Recebido</span>
              </div>
              <div className={styles.modalTabelaBody}>
                {dadosDiariosEmpresa.length === 0 ? (
                  <div className={styles.vazio}>Nenhum registro encontrado</div>
                ) : (
                  dadosDiariosEmpresa.map((dia, idx) => (
                    <div key={idx} className={styles.modalTabelaLinha}>
                      <span className={styles.colData}>{dia.data}</span>
                      <span className={styles.colNumeros}>{dia.recebido.toLocaleString('pt-BR')}</span>
                      <span className={styles.colNumeros}>{dia.emRemessaAberta.toLocaleString('pt-BR')}</span>
                      <span className={styles.colNumeros}>{dia.aberto.toLocaleString('pt-BR')}</span>
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

export default GraficoCartoes;
