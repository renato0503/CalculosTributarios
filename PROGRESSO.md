# 📊 Sistema Educacional - Cálculos Tributários (EC 132/2023)

## 📋 Status Geral

| Item | Status |
|------|--------|
| Login CPF | ✅ Concluído |
| Cadastro Perfil | ✅ Concluído |
| Módulo ISS | ✅ Concluído |
| Módulo ICMS-ST | ✅ Concluído |
| Módulo IPI | ✅ Concluído |
| Módulo PIS/Cofins | ✅ Concluído |
| Módulo IRPJ | ✅ Concluído |
| Módulo CSLL | ✅ Concluído |
| Dashboard | ✅ Concluído |
| Painel Admin | ✅ Concluído |
| Reforma Tributária (CBS/IBS) | ✅ Concluído |
| Deploy Firebase | ✅ Concluído |

---

## 🎯 Objetivo Educacional
Este app é a ferramenta central do curso de pós-graduação em Direito/Contabilidade Tributária. O objetivo é permitir que o aluno aplique a teoria (CF/88, CTN, Leis Complementares) através de **Simulações de Cenários Comparativos**, projetando especialmente os impactos da Reforma Tributária.

---

## 🎓 Metodologia de Ensino: Aulas e Cenários
O curso é estruturado em módulos onde cada conceito teórico é testado em pelo menos 2 cenários no app.

### Aula 1: "Da Origem dos Tributos à Reforma de 2026"
- **Foco**: Fundamentos, Fato Gerador e o **Workflow de Cenários**.
- **Tarefa do Aluno**: Login → Perfil → Criar "Cenário Base 2026" → Calcular ISS → Comparar no Dashboard.
- **Avaliação**: Trabalho final baseado na comparação analítica entre múltiplos cenários salvos (Ex: Vigente vs Pós-Reforma 2027).

### Aula 2: "Substituição Tributária e Cadeias Produtivas"
- **Foco**: ICMS-ST, MVA, DIFAL e Não-Cumulatividade.
- **Tarefa do Aluno**: Simular a compra de bebidas (ST) de SP para MT, calculando Base ST e ICMS-ST a Recolher.

---

## 🧠 Lógica e Workflow do Aplicativo

O sistema foi desenhado para ser uma ferramenta de apoio à decisão e simulação tributária, permitindo comparações complexas de forma simples.

### 1. Fluxo de Trabalho (Workflow)
1.  **Login**: O aluno acessa com seu CPF. Se for o primeiro acesso, preenche seu perfil.
2.  **Criação de Cenário**: Antes de calcular, o aluno deve ir na aba **"Meus Cenários"** e criar uma simulação (Ex: "Empresa A - Lucro Real").
3.  **Seleção**: O aluno seleciona o cenário desejado no dropdown **"Cenário Ativo"** no topo da página.
4.  **Cálculo**: Ao navegar pelos módulos (ISS, ICMS, etc.), o aluno insere os dados. Ao clicar em "Calcular", os resultados são salvos **exclusivamente** para aquele cenário ativo.
5.  **Análise**: No **Dashboard**, o aluno visualiza a consolidação tributária (incluindo a simulação do IVA Dual da Reforma) específica do cenário selecionado.
6.  **Comparação**: O aluno pode criar um novo cenário (Ex: "Empresa A - Lucro Presumido"), alternar entre eles no header, e comparar como a carga tributária muda instantaneamente.

### 2. Estrutura de Dados (Firebase Firestore)
A persistência segue uma hierarquia de subcoleções para garantir integridade e isolamento:
```
/alunos/{cpf}/
   ├── nome: "Nome do Aluno"
   ├── whatsapp: "000..."
   └── cenarios/ (subcoleção)
          └── {id_cenario}/
                 ├── nome: "Nome da Simulação"
                 ├── dataCriacao: "timestamp"
                 └── modulos/ (mapa de objetos)
                        ├── iss: { inputs, outputs, timestamp }
                        ├── icms: { inputs, outputs, timestamp }
                        └── ...
```

---

## ✅ O que já foi feito (Histórico Técnico)

### 2026-04-24 - Implementação Final: IRPJ, CSLL e Dashboard Consolidado
- [x] **Módulo IRPJ**: Implementado cálculo de Lucro Real e Presumido, com Adicional de 10% e DRE simplificada.
- [x] **Módulo CSLL**: Integração reativa com a base do IRPJ e suporte a coeficientes de presunção.
- [x] **Dashboard 2.0**: Consolidação de todos os 6 tributos (ISS, ICMS, IPI, PIS/COFINS, IRPJ, CSLL).
- [x] **Split Test (Reforma)**: Comparação dinâmica entre a carga tributária vigente (2026) vs. Estimativa Pós-Reforma (2027+) com base no IVA de 26,5%.
- [x] **UI/UX Polish**: Adicionadas badges de alerta de impacto e gráficos de distribuição por tributo.
- [x] **Deploy Geral**: Hosting atualizado com a versão final da plataforma.

### 2026-04-24 - PIS/COFINS Avançado e Ajustes de Base
- [x] **Ajustes de Base (Lei 9.718/98)**: Implementados campos para refinar a Base de Cálculo Real:
    - **(+) Acréscimos**: Frete, Seguro e Outras Despesas cobradas do cliente.
    - **(-) Exclusões**: IPI destacado, Devoluções de Vendas e Descontos Incondicionais.
- [x] **Cálculo de Créditos**: Implementada lógica para o regime **Não Cumulativo**, com subtração de créditos e trava em zero (Saldo Credor).
- [x] **Feedback Visual**: Badge dinâmica para "Saldo credor" e destaques em PT-BR.
- [x] **Validação Cenário "Indústria de Móveis"**:
    - Faturamento 80k + Acréscimos (4,5k) - Exclusões (4,3k) = **Base 80.200**.
    - PIS (0,65%) = 521,30 | COFINS (3,00%) = 2.406,00.
    - Status: Validado e salvo com sucesso em produção.
- [x] **Reforma Tributária**: Integração do teste de 1% (IVA Dual) sincronizado com a Base de Cálculo Real.

### 2026-04-24 - Implementação Completa ICMS-ST (Aula 2)
- [x] **Módulo ICMS-ST**: Implementação completa da Substituição Tributária.
- [x] **Fórmula ST**: Lógica robusta para `Base ST = (Produto + Frete + IPI + Despesas) * (1 + MVA)`.
- [x] **DIFAL Inteligente**: Cálculo automático comparando Alíquota Interestadual (input) vs Alíquota Interna (tabela interna por estado).
- [x] **Tabela de Alíquotas Internas**: Mapeamento das 27 UFs para precisão em ST e DIFAL.
- [x] **UI Dinâmica**: Toggles automáticos que ocultam campos de MVA em operações "Normal" e campos de Crédito em "Substituição".
- [x] **Reforma Tributária (IVA Dual)**: Integração do teste de 1% (CBS/IBS) no cálculo de ICMS para visualização no Dashboard.
- [x] **Validação Técnica**: Cenário SP→MT (Bebidas) validado com sucesso.

### 2026-04-24 - Refatoração do Fluxo de Salvamento
- [x] **Workflow "Experimentar antes de Salvar"**: Implementado botão "💾 Salvar no Cenário".
- [x] **Orquestração de Dashboard**: Dashboards só atualizam após a confirmação de salvamento por módulo.
- [x] **Feedback via Toasts**: Implementado sistema de notificações para sucesso/erro de persistência.
- [x] **Isolamento Total**: Dados agora salvos em subcoleções Firestore `/cenarios/{id}/modulos/`.
- [x] **Deploy Geral**: Hosting sincronizado em https://calculostributarios-2d484.web.app

### 2026-04-23 (Pós-Handoff)
- [x] **Arquitetura Baseada em Cenários**: Transição de estado global para estado por cenário.
- [x] **Módulo "Meus Cenários"**: Interface completa para criar, selecionar e excluir simulações.
- [x] **Seletor Global de Cenário**: Dropdown no header para alternância dinâmica entre contextos.
- [x] **Sincronização Reativa**: Atualização automática de todos os campos de módulos ao mudar o cenário.
- [x] **Tabela Completa de Estados**: Incluídas todas as 27 UFs no ICMS.
- [x] **Correções de Bugs**: Resolvidos erros de sintaxe no IRPJ e referências nulas no CSLL/Profile.

### Outras Implementações
- **Login**: Validação matemática de CPF.
- **Painel Admin**: Gestão de alunos e visualização de cenários remotos.
- **Formatação PT-BR**: Todos os valores tratados como moeda brasileira.

---

## 🔗 Links Úteis
- **App:** https://calculostributarios-2d484.web.app
- **Firebase Console:** https://console.firebase.google.com/project/calculostributarios-2d484/overview

---

## 📁 Estrutura de Arquivos
```
├── index.html           # Login
├── profile-setup.html  # Perfil
├── student.html      # Painel Principal
├── admin.html       # Painel Admin
└── src/
    ├── js/ (Lógica por módulo)
    └── css/ (Layout e Estilo)
```