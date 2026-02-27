# Dashboard PDV - Instruções de Desenvolvimento

## Configuração do Workspace

O projeto foi estruturado com React 18 + TypeScript + Vite para um dashboard de monitoramento de PDVs.

### Tecnologias principais
- **Frontend**: React 18, TypeScript, Vite
- **HTTP Client**: Axios
- **Gráficos**: Recharts
- **Styling**: CSS Modules
- **Build Tool**: Vite

### Estrutura do projeto

```
src/
├── components/          # Componentes React reutilizáveis
├── services/           # Serviços de integração com API
├── types/              # Definições de tipos TypeScript
├── App.tsx             # Componente raiz
└── main.tsx            # Ponto de entrada
```

## Scripts Disponíveis

- `npm run dev` - Iniciar servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm run preview` - Visualizar versão de produção
- `npm run lint` - Verificar código

## Configuração de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_API_URL=http://localhost:3001/api
```

## Componentes Principais

### Dashboard
Componente principal que gerencia o carregamento de dados e exibição dos indicadores de todas as empresas.

### GraficoOFX
Componente que exibe um gráfico de rosca e tabela completa comparativa de registros OFX conciliados vs não conciliados por empresa. Mostra:
- Gráfico com proporção geral de conciliação
- Top 10 empresas com menor conciliação (que requerem atenção)
- Tabela completa com filtros e ordenação por nome ou percentual de conciliação
- Barras de progresso coloridas indicando nível de conciliação

### EmpresaIndicadores (antes PDVIndicadores)
Exibe os 5 indicadores principais para uma empresa:
1. Número de caixas em aberto
2. Menor data do caixa em aberto
3. Quantidade de caixas fechados
4. Menor data sem consolidar
5. Tempo médio de consolidação

### IndicadorCard
Card reutilizável para exibição de indicadores individuais com temas variáveis.

### GraficoOFX
Componente que exibe um gráfico de barras comparativo de registros OFX conciliados vs não conciliados por empresa. Mostra:
- Gráfico com barras para cada empresa
- Resumo de totalizadores
- Barras de progresso com percentual de conciliação por empresa

## API Esperada

A aplicação espera uma API rodando em `http://localhost:3001` com os seguintes endpoints:

- **GET `/api/empresas/indicadores`** - Lista de indicadores de todas as empresas
- **GET `/api/empresas/{empresaId}/indicadores`** - Indicadores de uma empresa específica
- **GET `/api/ofx/relatorio`** - Relatório completo de OFX com todas as empresas
- **GET `/api/dashboard`** - Dados completos do dashboard

## Próximos Passos

1. Conectar a uma API real
2. Implementar filtros por PDV
3. Adicionar gráficos de tendência
4. Implementar alertas automáticos
5. Adicionar exportação de relatórios
