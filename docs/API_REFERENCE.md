# Referência de API - Funções JavaScript

## Módulo: `auth.js`

### `validateCPF(cpf: string): boolean`

Valida matematicamente um CPF usando algoritmo oficial da Receita Federal.

**Parâmetros:**
- `cpf`: String com CPF (com ou sem formatação)

**Retorno:** `true` se válido, `false` caso contrário

**Exemplo:**
```javascript
validateCPF("123.456.789-00")  // → true
validateCPF("11111111111")     // → false (todos iguais)
validateCPF("123.456.789-99")  // → false (verificador inválido)
```

---

### `formatCPF(cpf: string): string`

Formata CPF para padrão brasileiro (XXX.XXX.XXX-XX).

**Parâmetros:**
- `cpf`: String com apenas dígitos

**Retorno:** String formatada

**Exemplo:**
```javascript
formatCPF("12345678900") → "123.456.789-00"
```

---

### `createStudentDocument(cpf: string): Promise<{exists, data}>`

Cria ou consulta documento do aluno no Firestore.

**Parâmetros:**
- `cpf`: CPF do aluno (sem formatação)

**Retorno:** Promise com objeto `{ exists, data }`
- `exists`: boolean
- `data`: Objeto com dados do aluno

**Exemplo:**
```javascript
const result = await createStudentDocument("12345678900");
console.log(result.exists); // → false (novo aluno)
console.log(result.data);   // → { cpf, cpfFormatado, modulos, ... }
```

---

### `routeUser(cpf: string): Promise<void>`

Redireciona usuário baseado no CPF (admin ou aluno).

**Parâmetros:**
- `cpf`: CPF do usuário

**Comportamento:**
- Se CPF === `ADMIN_CPF` → redireciona para `admin.html`
- Caso contrário → salva em sessionStorage e redireciona para `student.html`

**Exemplo:**
```javascript
await routeUser("12345678900"); // → Redireciona para student.html
```

---

## Módulo: `student.js`

### `saveModuleData(moduleName: string, inputs: object, outputs: object): Promise<void>`

Salva dados de módulo no Firestore em tempo real.

**Parâmetros:**
- `moduleName`: Nome do módulo (ex: 'iss', 'icms')
- `inputs`: Objeto com valores de entrada
- `outputs`: Objeto com resultados de saída

**Exemplo:**
```javascript
await saveModuleData('iss', 
    { valor: 1000, municipio: 'Cuiabá', aliquota: 2.5 },
    { iss_devido: 25.00, cbs_teste_09: 9.00, ibs_teste_01: 1.00 }
);
```

**Estrutura no Firestore:**
```
/alunos/{cpf}/modulos/iss/
├── inputs: { ... }
├── outputs: { ... }
└── timestamp: "2026-04-25T10:31:00Z"
```

---

### `loadModuleData(moduleName: string): Promise<object|null>`

Carrega dados salvos de um módulo do Firestore.

**Parâmetros:**
- `moduleName`: Nome do módulo

**Retorno:** Promise com objeto de dados ou `null` se não existir

**Exemplo:**
```javascript
const data = await loadModuleData('iss');
if (data) {
    console.log(data.inputs);
    console.log(data.outputs);
}
```

---

## Módulo: `iss.js`

### `calcularISS(valorServico: number, aliquotaISS: number): object`

Calcula ISS e simula teste de alíquota de 1% (CBS 0,9% + IBS 0,1%).

**Parâmetros:**
- `valorServico`: Valor do serviço em reais (number)
- `aliquotaISS`: Alíquota ISS em decimal (ex: 0.025 = 2,5%)

**Retorno:** Objeto com resultados
```javascript
{
    valor_servico: "1000.00",
    aliquota_iss_percent: "2.50",
    iss_devido: "25.00",
    cbs_teste_09: "9.00",
    ibs_teste_01: "1.00",
    total_retencao_1pct: "10.00",
    timestamp: "2026-04-25T10:31:00Z"
}
```

**Exemplo:**
```javascript
const resultado = calcularISS(1000, 0.025);
console.log(resultado.iss_devido);       // → "25.00"
console.log(resultado.total_retencao_1pct); // → "10.00"
```

---

### `exibirResultados(resultados: object): void`

Atualiza o DOM com resultados de cálculo.

**Parâmetros:**
- `resultados`: Objeto com cálculos (retorno de `calcularISS`)

**Exemplo:**
```javascript
const resultados = calcularISS(1000, 0.025);
exibirResultados(resultados);
// Atualiza elementos:
// #issDevido → R$ 25,00
// #issCBS → R$ 9,00
// #issIBS → R$ 1,00
```

---

## Módulo: `admin.js`

### Funções Internas (não exportadas)

#### `loadStudentsList(): Promise<void>`
Carrega lista completa de alunos do Firestore e renderiza cards.

#### `loadStudentDetails(studentData: object): Promise<void>`
Carrega detalhes de um aluno específico em tabela.

#### `createStudentCard(studentData: object): HTMLElement`
Cria elemento DOM de card para aluno.

---

## Constantes Globais

### `auth.js`
```javascript
const ADMIN_CPF = "12345678901"  // CPF do administrador
```

### `iss.js`
```javascript
const ALIQUOTA_CBS_TESTE = 0.009  // 0,9%
const ALIQUOTA_IBS_TESTE = 0.001  // 0,1%
```

---

## Erros Comuns

### "CPF inválido"
Causas:
- CPF com dígitos verificadores incorretos
- CPF com menos de 11 dígitos
- CPF com todos os dígitos iguais

Solução: Usar CPF válido ou revisar algoritmo de validação.

### "Missing or insufficient permissions"
Causas:
- Regras do Firestore não configuradas
- `projectId` incorreto em `firebase-config.js`

Solução: Verificar console do navegador (F12) e regras do Firestore.

### "Dados não salvam"
Causas:
- Sem conexão com internet
- Sem permissão de escrita no Firestore
- CPF do usuário não existe em sessionStorage

Solução: Verificar console e network (F12 → Network/Console).

---

## Exemplo Completo de Uso

```html
<!-- student.html -->
<form id="issForm">
    <input type="number" id="issValor" placeholder="1000.00">
    <input type="text" id="issMunicipio" placeholder="Cuiabá">
    <input type="number" id="issAliquota" placeholder="2.5">
    <button type="submit">Calcular</button>
</form>
<div id="issResultados" class="resultados hidden">
    <span id="issDevido"></span>
</div>
```

```javascript
// iss.js
import { saveModuleData } from './student.js';

document.getElementById('issForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const valor = parseFloat(document.getElementById('issValor').value);
    const aliquota = parseFloat(document.getElementById('issAliquota').value) / 100;
    
    const resultado = calcularISS(valor, aliquota);
    exibirResultados(resultado);
    
    await saveModuleData('iss', { valor, aliquota }, resultado);
});
```

---

## Stack Técnico

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| HTML5 | - | Estrutura semântica |
| CSS3 | - | Grid/Flexbox responsivo |
| JavaScript | ES6+ | Lógica e DOM manipulation |
| Firebase | 10.7.1 | Backend/Database |
| Firestore | - | Real-time database |

