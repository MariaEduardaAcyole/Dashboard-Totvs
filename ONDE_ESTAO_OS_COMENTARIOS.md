# 🗂️ Mapa de Comentários - Dashboard LGPD

> **Guia rápido para encontrar cada seção do código comentada**

---

## 📂 Arquivos com Comentários

### 1. `app.js` - Lógica da Aplicação

| Seção | Descrição | Localização |
|-------|-----------|-----------|
| **ESTADO GLOBAL** | Variáveis compartilhadas | Início do arquivo (~5 linhas) |
| **UTILITÁRIOS** | Funções `normalizeText()`, `splitMulti()` | Logo após estado global |
| **NAVEGAÇÃO** | Função `switchTab()` - muda entre abas | Primeiras 50 linhas |
| **UPLOAD DE ARQUIVO** | Função `handleFileUpload()` - carrega Excel | Primeiras 100 linhas |
| **NORMALIZAÇÃO** | Função `normalizeData()` - processa dados brutos | Seções estruturadas por etapa |
| **FILTROS** | Funções `populateFilterOptions()`, `applyFilters()`, `resetFilters()` | Bloco intermediário |
| **KPIs** | Função `renderKPIs()` - exibe indicadores | Bloco intermediário |
| **TABELA** | Função `renderTable()` - renderiza subprocessos | Bloco intermediário |
| **AGREGAÇÃO** | Função `groupCount()` - conta valores únicos | Pré-gráficos |
| **GRÁFICOS** | Função `renderCharts()` + `createChart()` | Segundo metade do arquivo |
| **RENDERIZAÇÃO GERAL** | Função `renderAll()` - orquestra tudo | Próximo ao final |

#### 🔍 Como explorar:
1. Procure por `// ====> SEÇÃO ...` para encontrar cada bloco
2. Cada seção começa com um comentário descritivo
3. Funções críticas têm comentário antes da declaração

---

### 2. `index.html` - Estrutura e Layout

#### 🎯 Seção de Gráficos (Visão Geral)

**Local**: Dentro da `<div class="tab-panel" id="tab-visao-geral">`

Está organizada em **6 linhas lógicas** com comentários descritivos:

```
<!-- =================== GRÁFICOS VISÃO GERAL =================== -->
  ↓
  <!-- Linha 1: Indicadores de dados sensíveis e de menores -->
  ├─ Canvas: chartSensivel
  └─ Canvas: chartMenor
  
  <!-- Linha 2: Distribuição de subprocessos por área e bases legais -->
  ├─ Canvas: chartArea
  └─ Canvas: chartBaseLegal
  
  <!-- Linha 3: Transferências -->
  ├─ Canvas: chartTransfIntl
  └─ Canvas: chartComTerceiros
  
  <!-- Linha 4: Sistemas e terceiros -->
  ├─ Canvas: chartSistemas
  └─ Canvas: chartTerceiros
  
  <!-- Linha 5: Análise de transferências e empresas -->
  ├─ Canvas: chartPaises
  └─ Canvas: chartEmpresasSubprocessos
  
  <!-- Linha 6: Tipos de dados -->
  └─ Canvas: chartTiposDados
```

#### ✅ Outros comentários no HTML:
- **Seção de Inventário**: `<!-- =================== INVENTÁRIO =================== -->`
- Outros arquivos: Abas Riscos, Matriz, Plano, Heatmap (atualmente vazias)

---

### 3. `style.css` - Estilos (Sem comentários próprios)

Utiliza comentários em **seções principais**:
- `:root {}` - Variáveis CSS (cores, espaçamentos)
- `.table-wrap {}` - Corrigido para permitir scroll horizontal
- `.charts-grid {}` - Layout responsivo dos gráficos
- Classes de componentes: `.chart-card`, `.filter-bar`, `.sidebar`, etc.

---

### 4. `GUIA_CODIGO.md` - Documentação Completa

**Seções Principais**:

1. ✅ Estrutura de `app.js` (12 seções numeradas)
2. ✅ Estrutura de `index.html` (com novo detalhe sobre comentários)
3. ✅ Cores dos indicadores (referência visual)
4. ✅ Fluxo de dados (pipeline visual)
5. ✅ Dicas de desenvolvimento

**Nova seção adicionada**:
- 📌 **Comentários no HTML** - Explicação das 6 linhas de gráficos

---

## 🔍 Rápida Localização

### Preciso encontrar...

**...um gráfico específico?**
→ Procure em `app.js` → seção `GRÁFICOS - Renderização` → tabela de gráficos

**...como funciona o filtro?**
→ Procure em `app.js` → seção `FILTROS`

**...a estrutura do HTML?**
→ Abra `index.html` → Use Ctrl+F para procurar `====` (comentários principais)

**...como adicionar um novo gráfico?**
→ Leia `GUIA_CODIGO.md` → seção "Dicas de Desenvolvimento"

**...as cores usadas no dashboard?**
→ Procure em `style.css` → seção `:root {}`
ou em `GUIA_CODIGO.md` → seção "Cores dos Indicadores"

---

## 📋 Checklist de Comentários Adicionados

### `app.js`
- [x] Estado Global comentado
- [x] Cada função tem descrição
- [x] Seções separadas por delimitadores (`// ====>`)
- [x] Estrutura de dados explicada
- [x] Cálculos de risco documentados

### `index.html`
- [x] Seção de gráficos organizada em 6 linhas
- [x] Cada linha tem comentário descritivo
- [x] Canvas IDs correspondem aos comentários
- [x] Seções principais delimitadas

### `style.css`
- [x] Variáveis CSS comentadas (em `:root`)
- [x] Propriedades críticas de scroll documentadas
- [x] Layout responsivo explicado

### Documentação
- [x] `GUIA_CODIGO.md` criado e atualizado
- [x] `ONDE_ESTAO_OS_COMENTARIOS.md` (este arquivo)

---

## 🚀 Como Usar Este Guia

1. **Primeira vez explorando?**
   - Leia `GUIA_CODIGO.md` para entender a estrutura geral
   - Depois explore cada arquivo referenciado

2. **Procurando uma seção específica?**
   - Use Ctrl+F (Find) para procurar `====` ou o nome da seção
   - Por exemplo: `Ctrl+F` → Digite `FILTROS`

3. **Fazendo uma mudança?**
   - Identifique em qual arquivo precisa editar
   - Localize a seção usando os comentários como guia
   - Mantenha o padrão de comentários para consistência

4. **Adicionando nova funcionalidade?**
   - Consulte "Dicas de Desenvolvimento" em `GUIA_CODIGO.md`
   - Siga o mesmo padrão de comentários usados

---

## 💡 Padrões de Comentários Usados

### `app.js`
```javascript
// ====> NOME DA SEÇÃO
// Descrição breve
function minhaFuncao() {
  // Comentários inline para lógica complexa
}
```

### `index.html`
```html
<!-- =================== NOME DA SEÇÃO =================== -->
<!-- Descrição do conteúdo -->
<elemento id="descritivo">...</elemento>
```

---

**Versão**: 1.0  
**Última atualização**: 2025  
**Criado para**: Facilitar navegação e manutenção do Dashboard LGPD
