# Plano — Sistema de Análise de TIR | Prizma Investimentos

## 1. Objetivo

Construir um sistema web com dashboard para analisar a **TIR (Taxa Interna de Retorno)** dos
projetos da Prizma, comparando sempre **a expectativa inicial (marco / baseline)** com o
**realizado / reprojetado** ao longo do tempo.

A análise é separada por **dois ramos**, que têm naturezas financeiras distintas:

| Ramo | Natureza | Estrutura | TIR |
|------|----------|-----------|-----|
| **Hoteleiro** | Operação contínua (perpétua) | Participação societária (50%) | TIR contínua: aportes vs. distribuições + valor de mercado atual + projeção futura |
| **Imobiliário** | Projetos com início-meio-fim | 1 SPE por obra | TIR fechada por SPE (do landbanking à entrega/liquidação) |

### Princípio central: Projetado vs. Realizado
Para todo projeto existe:
1. **Marco inicial (baseline congelado)** — premissas e fluxo de caixa projetados na aprovação.
2. **Acompanhamento** — fluxo realizado + reprojeção do que falta.
3. **Fechamento / variância** — quão aderente o realizado foi ao projetado.

---

## 2. Carteira atual (estado inicial dos dados)

### Hoteleiro
- **1 projeto**, participação de **50%**, operação contínua.
- Analisar: total investido (histórico de aportes) × retorno atual (distribuições recebidas)
  × valor atual da participação (marcação) × expectativa de retorno futuro.

### Imobiliário (SPEs)
- **2 obras entregues** → TIR realizada (ciclo completo ou quase).
- **1 obra em construção** → realizado parcial + reprojeção.
- **1 para lançamento em breve** → baseline + aportes iniciais.
- **4 em landbanking** → apenas baseline (estudo de viabilidade).

---

## 3. Stack técnica

- **Frontend/Backend:** Next.js (App Router) + TypeScript
- **Banco:** PostgreSQL + Prisma (ORM e migrations versionadas)
- **Cálculo financeiro:** módulo TS próprio (XIRR/XNPV) com cobertura de testes
- **Gráficos:** Recharts (ou Visx)
- **Entrada de dados:** importação de planilhas (CSV/XLSX) + edição/ajuste nas telas
- **Testes:** Vitest (unit/integração) + Playwright (e2e do dashboard)

> A entrada principal é **importação de planilhas existentes**; o sistema vira a fonte da
> verdade após importar, permitindo correção manual e versionamento dos marcos.

---

## 4. Conceitos financeiros (definições que o sistema implementa)

- **Fluxo de caixa datado:** lista de eventos `{data, valor, tipo}` onde aportes são negativos
  e distribuições/recebimentos são positivos. Datas irregulares → usar **XIRR** (não IRR de
  período fixo).
- **TIR realizada:** XIRR só com eventos efetivamente ocorridos. Para projeto vivo, adiciona-se
  um **valor terminal de marcação a mercado** na data de hoje como fluxo positivo.
- **TIR projetada (baseline):** XIRR sobre o fluxo projetado completo, incluindo valor de saída
  esperado.
- **TIR esperada corrente:** realizado até hoje + reprojeção do que falta.
- **MOIC / Múltiplo:** total recebido ÷ total aportado.
- **DPI / RVPI / TVPI:** (distribuído, valor residual, total) sobre o capital — métricas de
  fundo, úteis para o hoteleiro contínuo.
- **Aplicação da participação:** no hoteleiro, todos os fluxos do projeto são multiplicados pela
  fração de propriedade (50%) para obter a posição da Prizma.

---

## 5. Modelo de dados (alto nível)

- **Branch** (ramo: HOTELEIRO | IMOBILIARIO)
- **Project** — nome, ramo, participação (%), estágio
  (LANDBANKING | LANCAMENTO | CONSTRUCAO | ENTREGUE | OPERACAO_CONTINUA), datas-chave
- **CashFlowEvent** — `projectId`, data, valor, tipo (APORTE | DISTRIBUICAO | RECEBIMENTO_VENDA |
  CUSTO | VALOR_TERMINAL), origem (REALIZADO | PROJETADO), `scenarioId`
- **Baseline (Marco)** — snapshot congelado de premissas + fluxo projetado + TIR/MOIC esperados,
  com `versão` e `dataCongelamento` (imutável após congelar)
- **Valuation** — marcação a mercado da participação numa data (para terminal value do hoteleiro)
- **ImportBatch** — rastreio de cada importação de planilha (arquivo, data, linhas, erros)

---

## 6. Etapas (cada uma com critério de teste)

### Etapa 0 — Fundação do projeto
**Entrega:** repositório Next.js + TS, PostgreSQL + Prisma, CI, lint, estrutura de pastas.
**Teste:** `npm run build`, lint e migration sobem limpos; healthcheck `/api/health` retorna OK;
pipeline de CI verde.

### Etapa 1 — Motor financeiro (núcleo)
**Entrega:** funções puras `xnpv`, `xirr`, `moic`, `tvpi/dpi/rvpi` em TS, sem dependência de UI.
**Teste (crítico):** suíte unitária Vitest com casos conhecidos validados contra o **XIRR do
Excel/Sheets** (mesmas planilhas da Prizma). Cobrir: fluxos só negativos (sem solução),
múltiplas raízes, datas irregulares, projeto de 1 evento, tolerância de convergência.
Meta: 100% dos casos de referência batendo com o Excel (erro < 1e-6).

### Etapa 2 — Modelo de dados + migrations
**Entrega:** schema Prisma das entidades do item 5, seed com a carteira atual (8 projetos + hotel).
**Teste:** migration aplica/reverte; testes de integração de CRUD; seed cria exatamente
1 hoteleiro + 8 imobiliários nos estágios corretos.

### Etapa 3 — Importação de planilhas
**Entrega:** upload CSV/XLSX → parser → validação → `CashFlowEvent`. Tela de pré-visualização e
relatório de erros por linha. Registro em `ImportBatch`.
**Teste:** importar planilhas-amostra (1 por tipo); asserts de contagem/soma de eventos;
planilha malformada gera erros legíveis sem corromper dados (transação atômica).

### Etapa 4 — Marco inicial (baseline congelado)
**Entrega:** capturar premissas + fluxo projetado de um projeto e **congelar** como versão
imutável; calcular TIR/MOIC esperados do marco.
**Teste:** após congelar, tentativas de alterar o marco são bloqueadas; recalcular gera a mesma
TIR; criar nova versão preserva a anterior (histórico).

### Etapa 5 — Módulo Imobiliário (SPE, ciclo fechado)
**Entrega:** cálculo por SPE de TIR realizada (entregues), realizado+reprojeção (construção/
lançamento) e só baseline (landbanking). Curva de aportes/recebimentos por obra.
**Teste:** as 2 obras entregues batem com TIR calculada à mão/Excel; obra em construção mostra
realizado parcial + projeção coerente; landbanking exibe apenas projetado.

### Etapa 6 — Módulo Hoteleiro (operação contínua, 50%)
**Entrega:** TIR contínua aplicando participação de 50%; terminal value = valuation atual;
TIR esperada com projeção operacional futura; métricas TVPI/DPI/RVPI.
**Teste:** fluxos multiplicados por 50% corretamente; TIR realizada-até-hoje usa valuation como
terminal; mudar a valuation atual move a TIR como esperado; projeção futura altera a TIR esperada.

### Etapa 7 — Comparação Projetado × Realizado (variância)
**Entrega:** por projeto e consolidado: TIR baseline vs. realizada/esperada, MOIC baseline vs.
real, desvios em p.p. e %, e curva projetado-vs-realizado no tempo. Marco de fechamento por SPE.
**Teste:** projeto fictício com realizado = baseline → variância zero; cenários acima/abaixo do
plano produzem sinal e magnitude corretos; fechamento de SPE grava o resultado final vs. marco.

### Etapa 8 — Dashboard
**Entrega:**
- Visão **consolidada Prizma** (TIR/MOIC por ramo, capital investido vs. distribuído).
- Aba **Hoteleiro** (operação contínua, evolução, projeção).
- Aba **Imobiliário** (carteira de SPEs por estágio, funil landbanking→entregue).
- Drill-down por projeto com gráfico projetado vs. realizado e tabela de fluxos.
**Teste:** e2e Playwright — carregar dashboard, alternar abas, abrir um projeto, conferir que os
números exibidos == saída do motor financeiro (sem divergência de arredondamento).

### Etapa 9 — Relatórios e fechamento
**Entrega:** exportar relatório por projeto e consolidado (PDF/Excel); registro de fechamento com
aderência ao marco; histórico de versões de baseline.
**Teste:** export reproduz os números do dashboard; relatório de fechamento lista
projetado/realizado/desvio para todos os projetos encerrados.

---

## 7. Ordem de dependências
0 → 1 → 2 → 3 → 4 → (5 e 6 em paralelo) → 7 → 8 → 9

A Etapa 1 (motor financeiro) é o coração e deve ser a mais testada — tudo depende dela estar
100% aderente ao XIRR que a Prizma já usa hoje no Excel.

---

## 8. Riscos e decisões a validar
- **Convenção de datas/parciais:** vendas "na planta" e distribuições mensais do hotel exigem
  XIRR (datas reais), não IRR de período fixo. ✔ contemplado.
- **Valor terminal do hoteleiro:** depende de uma valuation periódica confiável da participação.
- **Versionamento de marcos:** reprojeções não devem sobrescrever o baseline original — manter
  histórico para a análise de aderência ser honesta.
- **Moeda/inflação:** definir se a TIR é nominal ou real (corrigida por IPCA/INCC) — decidir
  antes da Etapa 1.
