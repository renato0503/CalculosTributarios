# 📖 Guia de Cálculos: Memória Técnica e Didática
**Sistema Educacional "Cálculos Tributários" — Versão Consolidada Abril/2026**

Este documento é a bússola técnica para os alunos de pós-graduação, detalhando as equações parametrizadas no motor de cálculo da nossa SPA. Ele reflete as regras da Reforma Tributária (Ano de Teste 2026), a jurisprudência do STF (Temas 69 e 118) e a majoração do Lucro Presumido (LC 224/2025).

---

## 1. ISS (Imposto Sobre Serviços) - Foco Cuiabá/MT

**Fato Gerador:** Prestação de serviços da Lista Anexa à LC 116/2003.
**Alíquotas (LC 043/1997 - Cuiabá):** Variam de 2% a 5% conforme o CNAE.

### A Regra de Ouro (Fórmulas)
```excel
ISS_Devido = Valor_Serviço * (Alíquota_ISS / 100)
```

**O Olhar do Contador: Tema 118 do STF**
O sistema permite simular a exclusão do ISS da base de cálculo do PIS/COFINS através de um **Toggle ($T_i$)**. Se ativo, o valor do `ISS_Devido` é subtraído da receita bruta antes do cálculo das contribuições federais.

---

## 2. ICMS (Imposto sobre Circulação de Mercadorias) - Mato Grosso

**Regimes de Apuração:**
1. **Regime Normal (Débito e Crédito):** Confronto mensal.
2. **Substituição Tributária (MVA):** Antecipação do imposto da cadeia.
3. **Estimativa Simplificada (Carga Média - MT):** Regime específico do RICMS/MT onde a carga é fixa por CNAE e encerra a cadeia.

### A Regra de Ouro (Fórmulas)
*   **ICMS Normal:** `Saldo = (Faturamento * Alíquota) - Créditos_Entrada`
*   **ICMS ST (MVA):**
    ```excel
    Base_ST = (Produtos + Frete + IPI + Despesas) * (1 + MVA/100)
    ICMS_ST_Recolher = (Base_ST * Alíq_Interna) - ICMS_Próprio - Créditos_Entrada
    ```
*   **Carga Média (Estimativa Simplificada - MT):**
    ```excel
    Base_Carga_Média = Valor_Total_NF (Produtos + Frete + Seguro + IPI + Despesas)
    ICMS_Recolher = Base_Carga_Média * (Alíquota_CNAE / 100)
    ```

---

## 3. IPI (Imposto sobre Produtos Industrializados)

**Regra Geral (RIPI - Decreto 7.212/2010):** Incide sobre o valor do produto ou por unidade de medida.

### A Regra de Ouro (Fórmulas)
*   **Regime Ad Valorem (Sobre o Valor):**
    ```excel
    Base_IPI = Valor_Produto + Frete + Seguro + Outras_Despesas
    IPI_Devido = Base_IPI * (Alíquota_IPI / 100)
    Valor_Total_NF = Valor_Produto + Frete + Seguro + Outras_Despesas + IPI_Devido
    ```
*   **Regime Específico (Sobre a Unidade):**
    ```excel
    IPI_Devido = Quantidade * Valor_Fixo_Unidade
    Valor_Total_NF = (Quantidade * Valor_Unitário_Produto) + IPI_Devido
    ```

---

## 4. PIS e COFINS: Unificação e Neutralidade 2026

**O que mudou?** A base agora é unificada para todos os regimes, e o sistema integra a neutralidade do Ano de Teste da Reforma Tributária.

### A Regra de Ouro (Fórmulas)
*   **Base de Cálculo Real (Unificada):**
    ```excel
    Base_Efetiva = Faturamento_Bruto + Acréscimos - Exclusões - (ISS_Devido * Ti)
    ```
*   **Créditos (Regime Não Cumulativo):**
    O crédito não é a dedução da base de insumos, mas sim o **imposto recuperado**.
    ```excel
    Valor_Crédito = Base_Insumos * (Alíquota_PIS + Alíquota_COFINS)
    ```
*   **Neutralidade Financeira (Ano 2026 - IVA 1%):**
    O IVA de teste (0,9% CBS + 0,1% IBS) incide **apenas sobre o faturamento de bens e serviços**, servindo como crédito para abater o PIS/COFINS.
    ```excel
    IVA_Teste = Faturamento_Bruto * 1%
    Total_Líquido = max(0, Débito_Bruto - Valor_Crédito - IVA_Teste)
    ```

---

## 5. IRPJ e CSLL: A Fragmentação da LC 224/2025

**Mecânica de Cálculo:** Para empresas no Lucro Presumido, a presunção sofre majoração de 10% sobre o faturamento excedente a R$ 1,25M no trimestre.

### A Regra de Ouro (Fórmulas)
Limite Trimestral ($L_t$) = **R$ 1.250.000,00**.

Se Receita Trimestral ($R_t$) $\le L_t$:
```excel
Base_Presumida = Rt * Coeficiente (ex: 32%)
```
Se Receita Trimestral ($R_t$) $> L_t$ e **Liminar Inativa**:
```excel
Base_Presumida = (Lt * Coef) + [(Rt - Lt) * (Coef * 1.1)]
```

**Alíquotas IRPJ:**
*   15% sobre a Base Presumida.
*   Adicional de 10% sobre o que a Base Presumida exceder R$ 60.000,00 (no trimestre).

---

## 🎯 Gabarito de Cenários Práticos (Validação)

### Cenário 1: Serviço de Tecnologia (Efeito LC 224/2025)
*   **Faturamento Trimestral:** R$ 3.000.000,00.
*   **Coeficiente:** 32%. **Liminar:** OFF.
*   **Cálculo da Base:**
    *   Normal (até 1.25M): $1.250.000 \times 32\% = 400.000$
    *   Majorada (sobre 1.75M): $1.750.000 \times 35,2\% = 616.000$
    *   **Base Total: R$ 1.016.000,00**
*   **Imposto Total:** **R$ 248.000,00**.

### Cenário 2: Comércio de Bebidas (IPI Específico + PIS Neutralidade)
*   **IPI:** 10.000 unidades | Valor Fixo R$ 0,50/unid.
    *   **IPI Devido: R$ 5.000,00.**
*   **PIS/COFINS:** Faturamento 100k | Insumos 50k.
    *   Créditos (9,25%): R$ 4.625,00.
    *   IVA Teste (1%): R$ 1.000,00.
    *   **Abatimento Total: R$ 5.625,00.**
