# 📊 Sistema Educacional - Cálculos Tributários (EC 132/2023)

O **Cálculos Tributários** é uma plataforma estratégica Single Page Application (SPA) desenvolvida para o ensino prático de Direito e Contabilidade Tributária em níveis de pós-graduação. O sistema permite que alunos simulem a complexidade do sistema tributário brasileiro vigente e projetem os impactos da transição para o novo modelo de IVA Dual.

---

## 🚀 Funcionalidades Detalhadas

### 1. Gestão Avançada de Cenários
O sistema rompe com a lógica de cálculos estáticos. Cada aluno pode criar múltiplos "Cenários" (Simulações), permitindo:
- **Isolamento de Dados**: Cálculos realizados no Cenário A não afetam o Cenário B.
- **Comparação de Regimes**: Simular a mesma operação em Lucro Real e Lucro Presumido simultaneamente.
- **Persistência Seletiva**: Botão "Salvar no Cenário" garante que apenas cálculos validados componham o Dashboard final.

### 2. Módulo ICMS e Substituição Tributária (ST)
Implementação robusta da Aula 2, focada em cadeias produtivas e operações interestaduais:
- **Fórmula ST**: `Base ST = (Valor do Produto + Frete + IPI + Despesas) * (1 + MVA%)`.
- **DIFAL Inteligente**: Cálculo automatizado do Diferencial de Alíquota comparando a alíquota de origem (Interestadual) com a alíquota interna do destino (tabela mapeada para as 27 UFs).
- **Não-Cumulatividade**: Campo de créditos para entradas tributadas em operações normais.
- **Toggles Dinâmicos**: A interface oculta campos de ST em operações "Normal" para reduzir a carga cognitiva do aluno.

### 3. Módulo PIS e COFINS (Lei 9.718/98)
Evolução para simular a base de cálculo real do faturamento:
- **Ajustes de Base**: Inclusão de Frete/Seguro (Acréscimos) e exclusão de IPI/Devoluções/Descontos (Exclusões).
- **Regime Não Cumulativo**: Subtração de créditos sobre insumos com visualização de "Saldo Credor" para compensação futura.
- **Regime Cumulativo**: Simulação de alíquotas fixas (0,65% e 3,00%).

### 4. Simulação da Reforma Tributária (IVA Dual)
Antecipação do modelo da Emenda Constitucional 132/2023:
- **Split Test (1%)**: Aplicação automática de 0,9% (CBS) e 0,1% (IBS) sobre a base de cálculo de todos os tributos de consumo.
- **Dashboard de Transição**: Consolidação visual comparando a carga tributária atual vs. a carga simulada do novo modelo.

---

## 🛠️ Arquitetura Técnica

### Frontend & UI/UX
- **Vanilla JS (ES6+)**: Sem frameworks pesados para garantir velocidade e facilidade de manutenção.
- **Glassmorphism**: Interface moderna com transparências e efeitos de blur, proporcionando uma experiência "Premium".
- **Design Responsivo**: Adaptado para uso em desktops e tablets em sala de aula.

### Backend & Segurança
- **Firebase Firestore**: Banco de dados NoSQL escalável com subcoleções aninhadas.
- **Validação de CPF**: Algoritmo matemático para garantir a integridade dos dados de acesso.
- **Admin Lock**: Painel administrativo acessível apenas para o CPF master do professor.

### Estrutura de Dados (NoSQL)
```json
{
  "alunos": {
    "{cpf}": {
      "nome": "João Silva",
      "perfil": { "cargo": "Contador", "empresa": "ABC Ltda" },
      "cenarios": {
        "{id_cenario}": {
          "nome": "Simulação 2026",
          "modulos": {
            "icms": { "inputs": {...}, "outputs": {...} },
            "pisCofins": { "inputs": {...}, "outputs": {...} }
          }
        }
      }
    }
  }
}
```

---

## 📁 Guia de Arquivos Principais

- `index.html`: Gateway de entrada e validação de acesso.
- `student.html`: O coração do sistema; contém todos os módulos de cálculo e o Dashboard.
- `src/js/student.js`: Orquestrador global (Save/Load/Cenários).
- `src/js/icms.js`: Motor de cálculo do ICMS, ST e DIFAL.
- `src/js/pis-cofins.js`: Motor de cálculo do PIS e COFINS com ajustes de base.
- `src/js/dashboard.js`: Lógica de consolidação e visualização de dados.

---

## 🔗 Acesso e Deploy

- **Hospedagem**: Firebase Hosting
- **URL**: [https://calculostributarios-2d484.web.app](https://calculostributarios-2d484.web.app)
- **Documentação de Progresso**: [PROGRESSO.md](PROGRESSO.md)

---
**Projeto Acadêmico - Prof. Renato Rosa**
