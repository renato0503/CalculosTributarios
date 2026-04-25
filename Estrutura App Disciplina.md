### **Roadmap de Desenvolvimento do Sistema: Cálculos Tributários e Transição (2026-2033)**

**Arquitetura Base:** Aplicação Single Page Application (SPA) utilizando HTML5, CSS3 (Flexbox/Grid) e Vanilla JavaScript (ES6+). Ambiente de desenvolvimento: Visual Studio Code.

---

#### **Turno 1 (25/04 \- Sábado, Manhã): Setup e Fase de Testes do IVA Dual**

**Objetivo Prático:** Inicialização do projeto, modelagem da interface principal e implementação do motor de cálculo de retenções e testes do IVA Dual para o ano-calendário 2026\.

* **Estrutura HTML/CSS:**  
  * Criação do index.html com a estrutura semântica (\<header\>, \<nav\>, \<main\>).  
  * Desenvolvimento do formulário de entrada para o **Módulo de Serviços**: campos de input para *Valor do Serviço*, *Alíquota ISS Município* e *CNAE*.  
* **Lógica JavaScript:**  
  * Declaração das constantes globais para a fase de testes da EC 132/2023:  
    const ALIQUOTA\_CBS\_TESTE \= 0.009;  
    const ALIQUOTA\_IBS\_TESTE \= 0.001;  
  * Criação da função calcularISS().  
  * Criação da função simularDestaqueNF2026() que aplica o 1% sobre o faturamento.  
  * Implementação de rotina para abater o valor do teste (1%) do saldo figurativo de PIS/Cofins, manipulando o DOM para exibir os resultados (tags virtuais XML) e o valor líquido.

#### **Turno 2 (25/04 \- Sábado, Tarde): Matrizes Multidimensionais e Depreciação do ICMS**

**Objetivo Prático:** Estruturação de bancos de dados estáticos em memória e algoritmos de cálculo de Substituição Tributária e Diferencial de Alíquota.

* **Estrutura HTML/CSS:**  
  * Criação do painel do **Módulo ICMS**. Inserção de seletores \<select\> para Unidade Federativa de origem e destino, e inputs numéricos para custos.  
* **Lógica JavaScript:**  
  * Construção de *Arrays de Objetos* mapeando as Margens de Valor Agregado (MVA) do Estado de Mato Grosso por código CEST (ex: Cervejas \= 73,63%, Autopeças \= 65,29%).  
  * Programação da função calcularICMS\_ST() aplicando a equação matemática da presunção:  
    $Base\_{ST} \= (Valor\_{Produto} \+ Frete \+ IPI) \\times (1 \+ MVA\_{Ajustada})$  
  * Desenvolvimento de um laço de repetição temporal (for loop de 2029 a 2032\) utilizando o método .map(). A rotina aplicará os deflatores do ICMS (1/10 a 4/10) em contraposição à majoração do IBS, gerando uma tabela de projeção de custos para o aluno analisar a transição.

#### **Turno 3 (26/04 \- Domingo, Manhã): Algoritmos de Filtragem e Imposto Seletivo**

**Objetivo Prático:** Operacionalização da não cumulatividade plena e programação das restrições do Imposto Seletivo.

* **Estrutura HTML/CSS:**  
  * Construção do **Módulo de Compras/Insumos**. Inserção de interface para cadastro de notas fiscais de entrada contendo *checkboxes* para parâmetros qualificadores.  
* **Lógica JavaScript:**  
  * Programação das regras de creditamento utilizando o método .filter().  
  * **Filtro Legado (PIS/Cofins):** Extração de dados baseada em operadores booleanos de essencialidade ou relevância (Jurisprudência Tema 779 STJ).  
  * **Filtro IVA Dual (CBS):** Modificação estrutural do algoritmo para validar apenas o uso e consumo corporativo e o recolhimento antecedente.  
  * Criação da função calcularImpostoSeletivo() com condicionais (if/else ou switch) para aplicar limites estatutários, como o teto de 1% escalonado para bebidas açucaradas e extração mineral.

#### **Turno 4 (16/05 \- Sábado, Manhã): Estruturas de DRE e e-LALUR**

**Objetivo Prático:** Processamento em lote de demonstrações contábeis e consolidação do Imposto de Renda Pessoa Jurídica.

* **Estrutura HTML/CSS:**  
  * Desenvolvimento do **Módulo IRPJ**. Layout em formato de tabela para inserção de dados da Demonstração do Resultado do Exercício (DRE).  
* **Lógica JavaScript:**  
  * Criação de um simulador de Livro de Apuração do Lucro Real (e-LALUR).  
  * Utilização do método .reduce() para iterar sobre *arrays* de lançamentos contábeis (Adições Legais e Exclusões).  
  * Programação da função de cálculo do IRPJ Trimestral/Anual, incluindo a lógica do adicional de 10% sobre o excedente da presunção legal.

#### **Turno 5 (16/05 \- Sábado, Tarde): Simulador de Presunção e API Interna**

**Objetivo Prático:** Implementação da CSLL e modelagem das alterações de base de cálculo referentes à LC 224/2025.

* **Estrutura HTML/CSS:**  
  * Adição de um componente *Toggle Switch* na interface para alternar entre "Regra Histórica" e "Regra LC 224/2025".  
* **Lógica JavaScript:**  
  * Construção de uma base de dados JSON interna que associa os códigos CNAE aos respectivos coeficientes de presunção (Art. 15, Lei 9.249/95).  
  * Programação da função calcularPresuncaoMajorada() para aplicar o acréscimo técnico de 10% aos percentuais do Lucro Presumido para a CSLL.  
  * Integração dos outputs das funções do Lucro Real (Turno 4\) e Lucro Presumido (Turno 5), gerando um comparativo de carga tributária e atratividade societária por regime.

#### **Turno 6 (17/05 \- Domingo, Manhã): Dashboard de Viabilidade e Split Test**

**Objetivo Prático:** Consolidação dos módulos em um painel interativo, implementação do cálculo *markup* e simulação do *Split Payment*.

* **Estrutura HTML/CSS:**  
  * Construção do **Dashboard Final**. Agrupamento dos resultados em painéis visuais de fácil leitura.  
* **Lógica JavaScript:**  
  * Programação da função de precificação baseada na mecânica legada "Por Dentro":  
    $Preço\_{Legado} \= \\frac{Receita\_{Líquida}}{1 \- \\sum Alíquotas\_{(PIS+Cofins+ISS)}}$  
  * Programação da função de precificação baseada no IVA Dual "Por Fora" (alíquota combinada estimada de 26,5% a 28%), deduzindo o filtro de créditos apurado no Turno 3\.  
  * Simulação do *Split Payment*: criação de rotina que fraciona o valor final de uma transação hipotética, destinando as variáveis "Receita\_Liquida" para uma conta empresarial e "IBS\_CBS\_Devido" para a conta do Comitê Gestor.  
  * Integração de biblioteca de renderização de gráficos (opcional, como Chart.js via CDN) para plotagem das variações da margem de contribuição.

