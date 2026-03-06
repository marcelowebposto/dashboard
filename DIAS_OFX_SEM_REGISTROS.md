# Componente: Dias OFX Sem Registros

## Descrição

O componente `DiasOFXSemRegistros` monitora e exibe os dias úteis (segunda a sexta) nos quais não foram importados registros de OFX, excluindo automaticamente fins de semana e feriados brasileiros.

## Localização

- Componente: `src/components/DiasOFXSemRegistros.tsx`
- Estilos: `src/components/DiasOFXSemRegistros.module.css`
- Serviço: `src/services/feriadosService.ts`

## Funcionalidades

### 1. Análise de Dias Sem Registros
- Identifica automaticamente quais dias úteis não têm registros OFX importados
- Agrupa os resultados para melhor visualização
- Calcula percentual de cobertura

### 2. Filtro de Dias Úteis
- Exclui fins de semana (sábados e domingos)
- Exclui feriados brasileiros fixos e móveis
- Análise configurável por período (1, 3 ou 6 últimos meses)

### 3. Feriados Suportados
- **Feriados Fixos**: Novo Ano, Tiradentes, Dia do Trabalho, Independência, Nossa Senhora Aparecida, Finados, Proclamação da República, Consciência Negra, Natal
- **Feriados Móveis (2025 e 2026)**: Carnaval, Páscoa, Corpus Christi

## Resumo de Informações

O componente exibe três cards principais:

1. **Dias sem registros**: Quantidade de dias úteis sem importação de OFX (com percentual)
2. **Dias com registros**: Quantidade de dias úteis com registros importados (com percentual de cobertura)
3. **Total de dias úteis**: Total de dias considerados na análise (seg-sex, sem feriados)

## Serviço de Feriados (feriadosService.ts)

Funções disponíveis:

- `eFinaldeSemana(data: Date): boolean` - Verifica se é fim de semana
- `eFeriado(data: Date): boolean` - Verifica se é feriado
- `eDiaUtil(data: Date): boolean` - Verifica se é dia útil
- `parseData(dataStr: string): Date | null` - Converte string em Date
- `formatarData(data: Date): string` - Formata para DD/MM/YYYY
- `getNomeDiaSemana(data: Date): string` - Retorna nome do dia
- `gerarDiasUteis(dataInicio, dataFim): Date[]` - Gera array de dias úteis
- `identificarDiasSemRegistros(datasDosRegistros, dataInicio, dataFim)` - Identifica dias faltando

## Visualização

O componente renderiza:
- Controle de período (último mês, últimos 3 meses, últimos 6 meses)
- Cards de resumo com números destacados
- Lista de dias sem registros (se existirem)
- Mensagem de sucesso quando todos os dias úteis têm registros
- Nota de disclaimer explicando o filtro

## Integração ao Dashboard

O componente foi adicionado automaticamente ao Dashboard, aparecendo após o gráfico de OFX conciliados.

### Posicionamento
```tsx
<CaixasAbertosPanel indicadores={indicadores} />
<ConsolidacaoCaixasPanel indicadores={indicadores} />
<GraficoOFX refreshKey={refreshKey} />
<DiasOFXSemRegistros refreshKey={refreshKey} /> {/* ← Novo componente */}
<GraficoCartoes refreshKey={refreshKey} />
```

## Próximas Melhorias

1. **Adicionar mais feriados móveis** para anos adicionais
2. **Exportar relatório** dos dias sem registros em PDF/Excel
3. **Notificações automáticas** quando dias críticos sem registros são identificados
4. **Filtro por empresa** para análise granular
5. **Gráfico de tendência** mostrando evolução histórica de cobertura
6. **Integração com calendário** visual para melhor compreensão

## Dados Esperados da API

O componente utiliza os dados do endpoint `/PAINEL_OPERACAO/OFX`:
```typescript
{
  registrosPorData: [
    {
      empresaId: 1,
      quantidadeRegistros: 250,
      data: '15/02/2026' ou '2026-02-15',
      quantidadeConciliados: 150,
      quantidadeNaoConciliados: 100
    }
  ]
}
```

## Notas de Implementação

- O componente usa `useMemo` para otimizar cálculos
- Suporta dois formatos de data: DD/MM/YYYY e YYYY-MM-DD
- Respeitoso com a internacionalização (locales pt-BR)
- Responsivo para telas pequenas
