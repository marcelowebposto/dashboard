# Dashboard PDV

Dashboard para monitorar indicadores de Pontos de Venda (PDVs), incluindo informações sobre caixas em aberto, datas de fechamento e consolidação, e tempo médio de consolidação.

## 🚀 Recursos

- Monitoramento de múltiplos PDVs
- Indicadores em tempo real:
  - Número de caixas em aberto
  - Menor data do caixa em aberto
  - Quantidade de caixas fechados
  - Menor data sem consolidar
  - Tempo médio de consolidação
- Interface responsiva
- Atualização automática a cada 30 segundos
- Design moderno com temas claros e escuros

## 📋 Pré-requisitos

- Node.js >= 16
- npm ou yarn

## 💻 Instalação

1. Clone o repositório:
```bash
git clone <seu-repositorio>
cd dashboard
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite o arquivo .env com as URLs da sua API
```

## 🔧 Configuração

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_API_URL=http://localhost:3001/api
```

## 🏃 Como executar

### Modo desenvolvimento:
```bash
npm run dev
```

O dashboard será aberto automaticamente em `http://localhost:5173`

### Build para produção:
```bash
npm run build
```

### Visualizar a build:
```bash
npm run preview
```

## 📁 Estrutura do projeto

```
src/
├── components/
│   ├── Dashboard.tsx           # Componente principal
│   ├── PDVIndicadores.tsx      # Componente para indicadores de um PDV
│   └── IndicadorCard.tsx       # Card para exibir um indicador
├── services/
│   └── pdvService.ts           # Serviço para comunicação com API
├── types/
│   └── index.ts                # Tipos TypeScript
├── App.tsx                      # Componente raiz
├── main.tsx                     # Entrada da aplicação
└── index.css                    # Estilos globais
```

## 🔌 API Esperada

### GET `/api/pdv/indicadores`

Retorna um array de indicadores para todos os PDVs:

```typescript
[
  {
    pdvId: string;
    pdvNome: string;
    numeroCaixasAbertos: number;
    menorDataCaixaAberto?: string;
    numeroCaixasFechados: number;
    menorDataSemConsolidar?: string;
    tempoMedioConsolidacao: number;
  }
]
```

### GET `/api/pdv/{pdvId}/indicadores`

Retorna indicadores de um PDV específico.

### GET `/api/dashboard`

Retorna dados completos do dashboard com timestamp de atualização.

## 🎨 Personalização

### Temas de cores

Os cards de indicadores suportam os seguintes temas:
- `primario`: Azul
- `sucesso`: Verde
- `aviso`: Amarelo
- `perigo`: Vermelho

Edite o arquivo `src/components/IndicadorCard.module.css` para personalizar as cores.

## 📦 Dependências principais

- **React 18**: Biblioteca UI
- **TypeScript**: Tipagem estática
- **Vite**: Build tool
- **Axios**: Cliente HTTP

## 🛠️ Scripts disponíveis

- `npm run dev` - Iniciar servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm run preview` - Visualizar build
- `npm run lint` - Verificar linting

## 📄 Licença

MIT

## 👥 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request
