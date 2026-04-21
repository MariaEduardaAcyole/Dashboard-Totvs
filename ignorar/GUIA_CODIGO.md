# 📘 Guia de Navegação do Código - Dashboard LGPD

## 📍 Estrutura do Arquivo `app.js`

### 1️⃣ ESTADO GLOBAL (linhas ~1-10)
Variáveis compartilhadas em todo o código:
- `rawData` - dados brutos carregados do Excel
- `data` - dados processados e normalizados
- `filtered` - dados após aplicação de filtros
- `activeFilters` - objeto com filtros ativos
- `charts` - dicionário com instâncias dos gráficos

### 2️⃣ UTILITÁRIOS (linhas ~12-35)
Funções auxiliares:
- `normalizeText(v)` - converte texto para lowercase e remove espaços
- `splitMulti(value)` - divide strings por `;` em array e remove duplicatas

### 3️⃣ NAVEGAÇÃO (linhas ~37-50)
- `switchTab(tabId)` - muda entre abas (Visão Geral, Inventário, etc)
- Atualiza: título da página, aba ativa, menu lateral

### 4️⃣ UPLOAD DE ARQUIVO (linhas ~52-105)
- `handleFileUpload(event)` - carrega arquivo Excel (.xlsx, .xlsm, .csv)
- Lê dados da aba "Inventário NomeCliente"
- Chama `normalizeData()` para processar

### 5️⃣ NORMALIZAÇÃO DE DADOS (linhas ~110-155)
- `normalizeData()` - converte dados brutos em estrutura útil
- **Calcula**: sensível, menor, nivelRisco, etc
- **Estrutura retornada**:
  - Campos simples: id, subprocesso, armazenamento
  - Campos array: empresa, area, processo, dados, baseLegal, sistemas, nomeTerceiro, paises

### 6️⃣ FILTROS (linhas ~160-210)
- `populateFilterOptions()` - preenche os combos de filtro
- `applyFilters()` - aplica filtros escolhidos e chama `renderAll()`
- `resetFilters()` - limpa todos os filtros

### 7️⃣ KPIs - Indicadores-Chave (linhas ~215-250)
- `renderKPIs()` - exibe números no topo
- **Indicadores**:
  - Número de Empresas
  - Total de Subprocessos
  - Subprocessos com Dados Sensíveis
  - Subprocessos com Dados de Menores
  - Total de Processos

### 8️⃣ TABELA (linhas ~255-290)
- `renderTable()` - renderiza tabela de subprocessos
- Implementa busca por texto (campo tableSearch)
- Mostra colunas: ID, Empresa, Área, Processo, Subprocesso, Sensível, Menor, Armazenamento, Terceiros, Transf. Intl., Base Legal

### 9️⃣ GRÁFICOS - Agregação (linhas ~295-305)
- `groupCount(field)` - conta ocorrências de cada valor em um campo
- Filtra: valores vazios, "não informado", "undefined"

### 🔟 GRÁFICOS - Renderização (linhas ~310-380)
- `renderCharts()` - cria todos os gráficos da página

#### **Gráficos Disponíveis**:

| Gráfico | ID | Tipo | O que mostra |
|---------|----|----|-------------|
| Subprocessos por Área | `chartArea` | bar | Quantidade de subprocessos em cada área |
| Bases Legais Utilizadas | `chartBaseLegal` | doughnut | Distribuição das bases legais |
| Dados Sensíveis | `chartSensivel` | doughnut | Sim/Não - tem dados sensíveis |
| Dados de Menores | `chartMenor` | doughnut | Sim/Não - tem dados de menores |
| Transferência Internacional | `chartTransfIntl` | doughnut | Processos com transf. intl |
| Compartilhamento com Terceiros | `chartComTerceiros` | doughnut | Processos com compartilhamento |
| Sistemas | `chartSistemas` | bar | Quais sistemas são utilizados |
| Nomes dos Terceiros | `chartTerceiros` | bar | Nomes dos terceiros que recebem dados |
| Países | `chartPaises` | bar | Quais países recebem transferências |
| Empresas x Subprocessos | `chartEmpresasSubprocessos` | bar | Quantidade de subprocessos por empresa |
| Tipos de Dados | `chartTiposDados` | doughnut | Quais tipos de dados são usados (CPF, email, etc) |

### 1️⃣1️⃣ CRIAR GRÁFICO (linhas ~385-445)
- `createChart(id, dataset, type, direction)` - função genérica
- **Parâmetros**:
  - `id` - ID do elemento canvas no HTML
  - `dataset` - objeto com {label: valor}
  - `type` - 'bar' ou 'doughnut'
- Configura cores, tooltips, legendas, escalas

### 1️⃣2️⃣ RENDERIZAÇÃO GERAL (linhas ~450-455)
- `renderAll()` - atualiza tudo
- Chamada após cada mudança de filtro
- Sequência: renderKPIs() → renderCharts() → renderTable()

---

## 📄 Estrutura do Arquivo `index.html`

### Principais Seções:
1. **SIDEBAR** (navegação) - abas do dashboard
2. **TOPBAR** (topo) - título, botões upload/export
3. **CONTENT**:
   - **tab-visao-geral** - KPIs e 11 gráficos
     - Linha 1: Dados Sensíveis / Dados de Menores
     - Linha 2: Subprocessos por Área / Bases Legais
     - Linha 3: Transferência Internacional / Compartilhamento com Terceiros
     - Linha 4: Sistemas / Nomes dos Terceiros
     - Linha 5: Países com Transferência / Empresas x Subprocessos
     - Linha 6: Tipos de Dados
   - **tab-inventario** - tabela de subprocessos
   - **tab-riscos** - (futuro)
   - **tab-matriz** - (futuro)
   - **tab-plano** - (futuro)
   - **tab-heatmap** - (futuro)

### 📌 Comentários no HTML (Seção de Gráficos):

Os 11 gráficos estão organizados em 6 linhas lógicas, cada uma com um comentário descritivo:

```html
<!-- Linha 1: Indicadores de dados sensíveis e de menores (doughnut charts) -->
<!-- Linha 2: Distribuição de subprocessos por área (bar chart) e bases legais (doughnut) -->
<!-- Linha 3: Transferências (doughnut charts Com/Sem) -->
<!-- Linha 4: Sistemas e terceiros (bar charts) -->
<!-- Linha 5: Análise de transferências internacionais e empresas (bar charts) -->
<!-- Linha 6: Tipos de dados processados (doughnut chart) -->
```

A seção de gráficos começa com: `<!-- =================== GRÁFICOS VISÃO GERAL =================== -->`

---



## 🎨 Cores dos Indicadores

| Cor | Uso |
|-----|-----|
| `--accent` (#4f8ef7) | Azul principal - links, botões |
| `--risk-high` (#ef4444) | Vermelho - alto risco, dados sensíveis |
| `--risk-med` (#f59e0b) | Laranja - risco médio |
| `--risk-low` (#22c55e) | Verde - baixo risco |
| `--risk-crit` (#c026d3) | Roxo - risco crítico |

---

## 🔄 Fluxo de Dados

```
arquivo.xlsx
    ↓
handleFileUpload()
    ↓
rawData[] (dados brutos)
    ↓
normalizeData()
    ↓
data[] (dados normalizados)
    ↓
applyFilters()
    ↓
filtered[] (após filtros)
    ↓
renderAll()
    ├─ renderKPIs()
    ├─ renderCharts()
    └─ renderTable()
```

---

## 📝 Dicas de Desenvolvimento

1. **Adicionar novo gráfico**:
   - Crie um novo canvas em `index.html` com ID único
   - Chame `createChart("novoId", dados, tipo)` em `renderCharts()`

2. **Adicionar novo filtro**:
   - Adicione `<select>` em `index.html`
   - Atualize `populateFilterOptions()` e `applyFilters()`

3. **Adicionar nova coluna de dados**:
   - Adicione campo no objeto retornado por `normalizeData()`
   - Use em KPIs, gráficos ou tabela conforme necessário

4. **Depuração**:
   - `console.log(data)` - veja dados normalizados
   - `console.log(filtered)` - veja dados após filtros
   - `console.log(charts)` - veja instâncias dos gráficos
