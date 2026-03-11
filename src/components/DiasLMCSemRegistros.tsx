import React, { useState, useEffect } from 'react';
import { RelatorioLMCCompleto } from '../types';
import pdvService from '../services/pdvService';
import styles from './CaixasAbertosPanel.module.css'; // Reutilizar estilos

interface DiasLMCSemRegistrosProps {
  refreshKey?: number;
}

interface ProdutoLMC {
  nome: string;
  ultimoLMC: string; // ISO format
}

interface LMCEmpresa {
  empresaId: number;
  empresaNome: string;
  ultimoLMC: string; // ISO format - maior data
  diasSemLMC: number;
  emDia: boolean; // true se d-1 ou hoje
  produtos: ProdutoLMC[];
  expandido?: boolean;
}

export const DiasLMCSemRegistros: React.FC<DiasLMCSemRegistrosProps> = ({ refreshKey }) => {
  const [dados, setDados] = useState<LMCEmpresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [expandidoMap, setExpandidoMap] = useState<Map<number, boolean>>(new Map());

  useEffect(() => {
    carregarDados();
  }, [refreshKey]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setErro(null);
      console.log('[DiasLMCSemRegistros] Carregando dados LMC...');
      
      const relatorio = await pdvService.getLMC();
      
      // Agrupar por empresa e calcular último LMC
      const empresasMap = new Map<number, { nome: string; ultimoLMC: string; produtos: Map<string, string> }>();
      
      for (const registro of relatorio.registrosPorData) {
        const dataISO = registro.data;
        
        if (!empresasMap.has(registro.empresaId)) {
          empresasMap.set(registro.empresaId, {
            nome: registro.empresaNome,
            ultimoLMC: dataISO,
            produtos: new Map(),
          });
        }
        
        const empresa = empresasMap.get(registro.empresaId)!;
        
        // Manter data mais recente
        if (new Date(dataISO) > new Date(empresa.ultimoLMC)) {
          empresa.ultimoLMC = dataISO;
        }
        
        // Agrupar produtos por empresa
        for (const produto of registro.produtos) {
          const dataProduto = new Date(produto.maiorLMC);
          const dataExistente = empresa.produtos.get(produto.produtoLMC);
          
          if (!dataExistente || dataProduto > new Date(dataExistente)) {
            empresa.produtos.set(produto.produtoLMC, produto.maiorLMC);
          }
        }
      }

      // Calcular dias sem LMC
      const agora = new Date();
      const ontem = new Date(agora);
      ontem.setDate(ontem.getDate() - 1);
      
      const empresasComDias: LMCEmpresa[] = Array.from(empresasMap.entries()).map(
        ([empresaId, { nome, ultimoLMC, produtos }]) => {
          const dataUltimo = new Date(ultimoLMC);
          const diasSemLMC = Math.floor(
            (agora.getTime() - dataUltimo.getTime()) / (1000 * 60 * 60 * 24)
          );
          
          // Empresa está em dia se o LMC é de hoje ou ontem
          const emDia = diasSemLMC <= 1;

          // Converter map de produtos para array
          const produtosArray: ProdutoLMC[] = Array.from(produtos.entries()).map(
            ([nome, data]) => ({
              nome,
              ultimoLMC: data,
            })
          ).sort((a, b) => new Date(a.ultimoLMC).getTime() - new Date(b.ultimoLMC).getTime());

          return {
            empresaId,
            empresaNome: nome,
            ultimoLMC: ultimoLMC,
            diasSemLMC: diasSemLMC > 0 ? diasSemLMC : 0,
            emDia,
            produtos: produtosArray,
            expandido: false,
          };
        }
      ).sort((a, b) => {
        // Ordenar: em atraso (maiores dias primeiro), depois em dia
        if (a.emDia && !b.emDia) return 1;
        if (!a.emDia && b.emDia) return -1;
        return b.diasSemLMC - a.diasSemLMC;
      });

      setDados(empresasComDias);
      console.log('[DiasLMCSemRegistros] Dados carregados:', empresasComDias.length, 'empresas');
    } catch (error) {
      console.error('[DiasLMCSemRegistros] Erro ao carregar dados:', error);
      setErro('Erro ao carregar dados: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const getCorTermometro = (diasSemLMC: number, emDia: boolean): string => {
    if (emDia) return '#27ae60'; // Verde - em dia
    if (diasSemLMC === 1) return '#27ae60'; // Verde - 1 dia
    if (diasSemLMC <= 5) return '#ff9800'; // Amarelo - 2 a 5 dias
    return '#e74c3c'; // Vermelho - mais de 5 dias
  };

  const toggleExpandir = (empresaId: number) => {
    const novoMap = new Map(expandidoMap);
    novoMap.set(empresaId, !expandidoMap.get(empresaId));
    setExpandidoMap(novoMap);
  };

  if (loading) {
    return (
      <div className={styles.panel}>
        <h2 className={styles.titulo}>📦 Dias sem LMC</h2>
        <div className={styles.vazio}>Carregando dados...</div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className={styles.panel}>
        <h2 className={styles.titulo}>📦 Dias sem LMC</h2>
        <div className={styles.vazio}>{erro}</div>
      </div>
    );
  }

  if (dados.length === 0) {
    return (
      <div className={styles.panel}>
        <h2 className={styles.titulo}>📦 Dias sem LMC</h2>
        <div className={styles.vazio}>Nenhum dado disponível</div>
      </div>
    );
  }

  // Empresas em dia
  const empresasEmDia = dados.filter(e => e.emDia).length;
  const percentualEmDia = ((empresasEmDia / dados.length) * 100).toFixed(1);
  
  // Empresas com atraso
  const empresasComAtraso = dados.filter(e => !e.emDia);
  const maiorAtraso = empresasComAtraso.length > 0 ? empresasComAtraso[0].diasSemLMC : 0;

  // Mostrar apenas resumo se não estiver expandido
  const exibidos = showAll ? dados.filter(e => !e.emDia) : [];

  return (
    <div className={styles.panel}>
      <h2 className={styles.titulo}>📦 Dias sem LMC</h2>

      <div className={styles.info}>
        <div className={styles.infoItem}>
          <div className={styles.infoLabel}>Total de Empresas</div>
          <div className={styles.infoValue}>{dados.length}</div>
        </div>
        <div className={styles.infoItem}>
          <div className={styles.infoLabel}>Empresas em Dia</div>
          <div className={styles.infoValue} style={{ color: '#27ae60' }}>
            {percentualEmDia}%
          </div>
        </div>
        <div className={styles.infoItem}>
          <div className={styles.infoLabel}>Empresas com Atraso</div>
          <div className={styles.infoValue} style={{ color: empresasComAtraso.length > 0 ? '#ff6b6b' : '#27ae60' }}>
            {empresasComAtraso.length}
          </div>
        </div>
        <div className={styles.infoItem}>
          <div className={styles.infoLabel}>Maior Atraso (dias)</div>
          <div className={styles.infoValue} style={{ color: maiorAtraso === 0 ? '#27ae60' : maiorAtraso <= 5 ? '#ff9800' : '#e74c3c' }}>
            {maiorAtraso}
          </div>
        </div>
      </div>

      {showAll && exibidos.length > 0 && (
        <div className={styles.gridDetalhe}>
          {exibidos.map((empresa) => {
            const isExpanded = expandidoMap.get(empresa.empresaId) || false;
            const statusColor = getCorTermometro(empresa.diasSemLMC, empresa.emDia);

            return (
              <div key={empresa.empresaId} className={styles.cardDetalhe}>
                <div 
                  className={styles.cardDetalheHeader}
                  onClick={() => toggleExpandir(empresa.empresaId)}
                  style={{ cursor: 'pointer' }}
                >
                  {empresa.empresaNome} {isExpanded ? '▼' : '▶'}
                </div>
                <div className={styles.cardDetalheRow}>
                  <span className={styles.cardDetalheLabel}>Último LMC</span>
                  <span className={styles.cardDetalheValue}>
                    {new Date(empresa.ultimoLMC).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className={styles.cardDetalheRow}>
                  <span className={styles.cardDetalheLabel}>Status</span>
                  <span className={styles.cardDetalheValue} style={{ color: statusColor }}>
                    {empresa.emDia ? 'Em Dia' : `${empresa.diasSemLMC} d`}
                  </span>
                </div>

                {isExpanded && empresa.produtos.length > 0 && (
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #eee' }}>
                    <div className={styles.cardDetalheLabel} style={{ marginBottom: '8px' }}>Produtos:</div>
                    {empresa.produtos.map((produto, idx) => (
                      <div key={idx} style={{ fontSize: '12px', color: '#666', marginBottom: '6px', paddingLeft: '10px' }}>
                        <div style={{ fontWeight: 600 }}>{produto.nome}</div>
                        <div style={{ color: '#999', fontSize: '11px' }}>
                          {new Date(produto.ultimoLMC).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
            : `Mostrar detalhes (${dados.length})`
          }
        </button>
      </div>
    </div>
  );
};

export default DiasLMCSemRegistros;


