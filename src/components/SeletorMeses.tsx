import React, { useState, useRef, useEffect } from 'react';
import styles from './SeletorMeses.module.css';

export interface MesSelecionado {
  ano: number;
  mes: number;
  chave: string; // formato "YYYY-MM"
  label: string; // formato "jan/26"
}

interface SeletorMesesProps {
  mesesSelecionados: MesSelecionado[];
  onChange: (meses: MesSelecionado[]) => void;
  mesesDisponiveis?: number; // Quantos meses para trás mostrar (padrão: 12)
}

const NOMES_MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export function gerarMesAtual(): MesSelecionado {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth() + 1;
  return {
    ano,
    mes,
    chave: `${ano}-${String(mes).padStart(2, '0')}`,
    label: `${NOMES_MESES[mes - 1]}/${ano % 100}`,
  };
}

export function gerarMesesDisponiveis(quantidade: number = 12): MesSelecionado[] {
  const meses: MesSelecionado[] = [];
  const hoje = new Date();
  
  for (let i = 0; i < quantidade; i++) {
    const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const ano = data.getFullYear();
    const mes = data.getMonth() + 1;
    meses.push({
      ano,
      mes,
      chave: `${ano}-${String(mes).padStart(2, '0')}`,
      label: `${NOMES_MESES[mes - 1]}/${ano % 100}`,
    });
  }
  
  return meses;
}

export function mesParaLabel(ano: number, mes: number): string {
  return new Date(ano, mes - 1).toLocaleString('pt-BR', { year: 'numeric', month: 'long' });
}

export const SeletorMeses: React.FC<SeletorMesesProps> = ({
  mesesSelecionados,
  onChange,
  mesesDisponiveis = 12,
}) => {
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const todosMeses = gerarMesesDisponiveis(mesesDisponiveis);
  
  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickFora = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setAberto(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, []);

  const toggleMes = (mes: MesSelecionado) => {
    const existe = mesesSelecionados.some(m => m.chave === mes.chave);
    if (existe) {
      // Não permitir remover se for o último
      if (mesesSelecionados.length > 1) {
        onChange(mesesSelecionados.filter(m => m.chave !== mes.chave));
      }
    } else {
      onChange([...mesesSelecionados, mes].sort((a, b) => a.chave.localeCompare(b.chave)));
    }
  };

  const selecionarTodos = () => {
    onChange([...todosMeses].sort((a, b) => a.chave.localeCompare(b.chave)));
  };

  const selecionarUltimos = (n: number) => {
    const ultimos = todosMeses.slice(0, n);
    onChange(ultimos.sort((a, b) => a.chave.localeCompare(b.chave)));
  };

  const textoResumo = () => {
    if (mesesSelecionados.length === 0) return 'Selecione meses';
    if (mesesSelecionados.length === 1) return mesesSelecionados[0].label;
    if (mesesSelecionados.length === todosMeses.length) return 'Todos os meses';
    
    // Verificar se são meses consecutivos
    const sorted = [...mesesSelecionados].sort((a, b) => a.chave.localeCompare(b.chave));
    const primeiro = sorted[0];
    const ultimo = sorted[sorted.length - 1];
    
    return `${primeiro.label} - ${ultimo.label} (${mesesSelecionados.length})`;
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <button 
        className={styles.botaoSeletor}
        onClick={() => setAberto(!aberto)}
        type="button"
      >
        <span className={styles.textoSeletor}>{textoResumo()}</span>
        <span className={styles.icone}>{aberto ? '▲' : '▼'}</span>
      </button>
      
      {aberto && (
        <div className={styles.dropdown}>
          <div className={styles.atalhos}>
            <button type="button" onClick={() => selecionarUltimos(1)}>Último mês</button>
            <button type="button" onClick={() => selecionarUltimos(3)}>3 meses</button>
            <button type="button" onClick={() => selecionarUltimos(6)}>6 meses</button>
            <button type="button" onClick={selecionarTodos}>Todos</button>
          </div>
          
          <div className={styles.listaMeses}>
            {todosMeses.map((mes) => {
              const selecionado = mesesSelecionados.some(m => m.chave === mes.chave);
              return (
                <label key={mes.chave} className={`${styles.itemMes} ${selecionado ? styles.selecionado : ''}`}>
                  <input
                    type="checkbox"
                    checked={selecionado}
                    onChange={() => toggleMes(mes)}
                  />
                  <span>{mes.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SeletorMeses;
