# 🛠️ Elementos dos Módulos: Guia de Interface e UX
**Sistema Educacional "Cálculos Tributários" — Manual do Aluno**

Este documento descreve a anatomia de cada tela do sistema, explicando a função de cada campo, botão e controle, bem como a lógica de negócio que justifica sua existência.

---

## 🛒 1. Módulo: Meus Cenários (O Berço da Simulação)
Antes de qualquer cálculo, o aluno deve definir um **Cenário**. 

*   **Campo "Nome do Cenário":** Permite rotular a simulação (ex: "Empresa Lucro Real - Meta 2026").
*   **Botão "Criar Cenário":** Gera um novo contêiner no banco de dados para salvar os dados de todos os outros módulos.
*   **Selector Global (Header):** Presente em todas as telas, garante que o aluno saiba em qual contexto está trabalhando.
*   **Por que existe?** No planejamento tributário, nunca trabalhamos com dados isolados. Precisamos comparar hipóteses (Cenário A vs Cenário B) para decidir o melhor regime.

---

## 🏛️ 2. Módulo: ISS (Imposto Sobre Serviços)
Focado na prestação de serviços municipais.

*   **Valor do Serviço (R$):** Receita bruta da prestação.
*   **Município:** Campo informativo para identificar a competência.
*   **Alíquota ISS (%):** Varia de 2% a 5% (Limite constitucional).
*   **Botão "Salvar no Cenário":** Crucial para que o valor do ISS seja exportado para o módulo de PIS/COFINS (Tema 118).
*   **Por que existe?** Para simular a carga municipal e sua interação com tributos federais.

---

## 🚚 3. Módulo: ICMS (Circulação de Mercadorias)
O módulo mais denso, focado no RICMS/MT.

*   **Tipo de Operação (Dropdown):**
    *   **Normal:** Débito e Crédito padrão.
    *   **Substituição Tributária:** Calcula a retenção antecipada.
    *   **Estimativa Simplificada (Carga Média - MT):** Aplica a carga fixa por CNAE (exclusivo MT).
*   **Estado de Origem/Destino:** Gatilhos para o cálculo do **DIFAL** (Diferencial de Alíquota) e alíquotas interestaduais.
*   **MVA (%):** Margem de Valor Agregado para o cálculo da base da ST.
*   **Alíquota CNAE (%):** Campo reativo que aparece apenas no regime de Carga Média.
*   **Por que existe?** O ICMS é o imposto mais complexo do Brasil. O aluno precisa entender a diferença entre "encerrar a cadeia" (Carga Média) e "manter o crédito" (Normal).

---

## 🏭 4. Módulo: IPI (Produtos Industrializados)
Focado na indústria e importação.

*   **Tipo de Incidência (Toggle):**
    *   **Ad Valorem:** O imposto incide sobre o valor da nota (Produto + Frete + Despesas).
    *   **Específica:** O imposto incide sobre a quantidade (ex: R$ 0,50 por garrafa de bebida).
*   **Campos de Frete/Seguro:** No modo Ad Valorem, integram a base. No modo Específico, são ocultados para evitar erro conceitual.
*   **Por que existe?** O IPI é um imposto extrafiscal. O aluno deve aprender que nem todo imposto depende do preço de venda; alguns dependem apenas da unidade produzida.

---

## 🏦 5. Módulo: PIS e COFINS (Contribuições Sociais)
Focado na receita e na transição para a Reforma Tributária.

*   **Faturamento + Acréscimos - Exclusões:** Estrutura clássica de apuração contábil.
*   **Toggle "Excluir ISS da Base (Tema 118 STF)":** Simula a tese jurídica de que o ISS não é receita própria, logo não deve ser tributado pelo PIS/COFINS.
*   **Checkbox "Regime Cumulativo":** Aplica a redução de 65% na alíquota para empresas que não aproveitam créditos.
*   **Créditos de PIS/COFINS (Base):** Onde o aluno insere o valor dos insumos. O sistema calcula automaticamente o valor monetário do imposto recuperado.
*   **Por que existe?** É aqui que o aluno visualiza a **Neutralidade de 2026**. O sistema mostra o abatimento do IVA de teste (1%) para que o lucro líquido da empresa não seja afetado pela transição.

---

## 📈 6. Módulos: IRPJ e CSLL (Lucro das Empresas)
Focado no resultado trimestral.

*   **Regime de Apuração:** Permite escolher entre **Lucro Real** (baseado no lucro líquido) ou **Lucro Presumido** (baseado na receita).
*   **Checkbox "Liminar Ativa (LC 224/2025)":** O elemento mais moderno do sistema. Permite simular a suspensão da nova lei que majora a tributação para grandes empresas no Lucro Presumido.
*   **Adições/Exclusões (Lucro Real):** Campos para ajustes extra-contábeis (LALUR).
*   **Por que existe?** Para demonstrar o impacto da temporalidade (trimestre) e da estratégia jurídica (liminares) no caixa da empresa.

---

## 📊 7. Relatórios e Dashboard
Onde a estratégia se torna visível.

*   **Relatório Detalhado:** Uma auditoria "linha a linha" de cada conta matemática realizada pelo sistema. Essencial para o aluno conferir se sua "conta de padaria" bate com o motor do software.
*   **Dashboard (Gráfico):** Visualização da fatia de cada tributo na carga total.
*   **Split Test (🔍):** O "Coração da Reforma". Compara o cenário atual (2026) com a projeção pós-reforma total (2027+), aplicando a alíquota padrão de 26,5% do IVA Dual.
*   **Por que existe?** Para transformar dados em decisão. O aluno sai do papel de "calculador" e assume o papel de "estrategista".
