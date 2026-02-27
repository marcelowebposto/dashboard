import React from 'react';
import styles from './IndicadorCard.module.css';

interface IndicadorCardProps {
  titulo: string;
  valor: string | number;
  unidade?: string;
  tema?: 'primario' | 'sucesso' | 'aviso' | 'perigo';
}

export const IndicadorCard: React.FC<IndicadorCardProps> = ({
  titulo,
  valor,
  unidade,
  tema = 'primario',
}) => {
  return (
    <div className={`${styles.card} ${styles[tema]}`}>
      <h3 className={styles.titulo}>{titulo}</h3>
      <div className={styles.conteudo}>
        <span className={styles.valor}>{valor}</span>
        {unidade && <span className={styles.unidade}>{unidade}</span>}
      </div>
    </div>
  );
};

export default IndicadorCard;
