# 📊 Relatório de Auditoria: Sistema de Cálculos Tributários
**Data:** 25 de Abril de 2026  
**Objetivo:** Validar a conformidade das calculadoras (.js) com o Guia de Fórmulas (formulas.md).

---

## 🔍 Resumo da Auditoria

Após analisar os motores de cálculo e as regras de negócio, identifiquei que a maioria dos módulos está operando corretamente segundo as fórmulas gerais. No entanto, existem **inconsistências críticas** em relação às particularidades de Mato Grosso (ICMS Carga Média) e à neutralidade da Reforma Tributária 2026 (PIS/COFINS).

---

## 📈 Análise por Módulo

### 1. ISS (`iss.js`)
*   **Status:** ✅ Correto.
*   **Análise:** A fórmula `valor * aliquota` está correta. O sistema permite alíquotas entre 2% e 5% conforme o Código Tributário de Cuiabá. A projeção de 1% para 2026 está implementada como visualização.

### 2. ICMS (`icms.js`)
*   **Status:** ⚠️ Inconsistência Detectada (Carga Média).
*   **Inconsistência:** O motor atual foca 100% no regime de **MVA/ST Nacional**. Não existe uma função ou "toggle" para o **Regime de Estimativa Simplificada (Carga Média - MT)** conforme o Anexo XIII do RICMS/MT.
*   **Impacto:** Para o Cenário 2 do Guia, o app tentará calcular MVA e abater o ICMS próprio da origem, o que resultará em um valor diferente dos R$ 11.900,00 esperados (Carga Média pura sobre o total da NF).
*   **Recomendação:** Adicionar a opção "Estimativa Simplificada (MT)" no seletor de tipo de operação e implementar a fórmula `BaseTotalNF * AliquotaCNAE` sem deduções.

### 3. IPI (`ipi.js`)
*   **Status:** ✅ Correto.
*   **Análise:** A composição da base incluindo frete e despesas acessórias está conforme o RIPI (Decreto 7.212/2010).

### 4. PIS e COFINS (`pis-cofins.js`)
*   **Status:** ❌ Inconsistência Crítica (Neutralidade 2026).
*   **Inconsistência:** O `formulas.md` afirma que os valores de CBS/IBS (1%) devem ser **abatidos** do valor devido de PIS/COFINS para garantir neutralidade. O código atual calcula o PIS/COFINS e o Teste de 1% de forma **independente e aditiva**.
*   **Impacto:** O aluno verá um aumento de carga no Dashboard, quando o esperado em 2026 é que o destaque de 1% reduza o valor a pagar das contribuições atuais.
*   **Recomendação:** Subtrair o `total_teste` (1%) do `total_liquido` de PIS/COFINS no motor de cálculo.

### 5. IRPJ e CSLL (`irpj.js` / `csll.js`)
*   **Status:** ✅ Correto.
*   **Análise:** 
    *   O Adicional de 10% está corretamente configurado sobre a base que excede R$ 60.000,00 trimestrais (R$ 20k/mês).
    *   A CSLL aplica corretamente os 9% sobre a base de presunção.
    *   A integração entre IRPJ e CSLL (compartilhamento de base) funciona como planejado.

### 6. Dashboard e Split Test (`dashboard.js`)
*   **Status:** ✅ Correto.
*   **Análise:** A projeção do cenário pós-reforma utilizando a alíquota de 26,5% e créditos estimados de 40% sobre custos segue a melhor prática para simulações educacionais baseadas na EC 132/23.

---

## 🎯 Validação dos Cenários de Teste

| Cenário | Resultado no Sistema Atual | Resultado Esperado (Guia) | Status |
| :--- | :--- | :--- | :--- |
| **Cenário 1 (ISS/Cuiabá)** | R$ 18.530,00 (Total) | R$ 18.530,00 | ✅ Aprovado |
| **Cenário 2 (ICMS/MT)** | Erro (Tenta abater crédito e usar MVA) | R$ 11.900,00 | ❌ Reprovado |

---

## 🛠️ Plano de Ação Sugerido

1.  **Refatorar `icms.js`**: Adicionar suporte ao regime de Carga Média de Mato Grosso.
2.  **Ajustar `pis-cofins.js`**: Implementar a compensação financeira do Teste de 1% (abatimento no valor final de PIS/COFINS).
3.  **Atualizar `student.html`**: Incluir o campo "Alíquota CNAE (Carga Média)" no módulo de ICMS quando o regime de MT for selecionado.
