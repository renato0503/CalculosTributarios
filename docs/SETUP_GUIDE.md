# Documentação Técnica - Setup e Configuração

## 1. Configuração do Firebase

### Pré-requisitos
- Conta Google ativa
- Projeto criado no [Firebase Console](https://console.firebase.google.com)

### Passos de Configuração

#### 1.1 Criar um projeto no Firebase
1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Clique em "Criar projeto"
3. Insira o nome: `calculos-tributarios`
4. Desabilite "Google Analytics" por enquanto
5. Clique em "Criar projeto"

#### 1.2 Ativar Firestore Database
1. No console do projeto, selecione "Firestore Database"
2. Clique em "Criar banco de dados"
3. Escolha modo **Teste** (para desenvolvimento)
4. Selecione a região mais próxima
5. Clique em "Ativar"

#### 1.3 Obter credenciais
1. Clique em "Project Settings" (ícone de engrenagem)
2. Na aba "Geral", role até "Seus aplicativos"
3. Clique em "</>" para adicionar um aplicativo web
4. Insira o apelido: `calculos-tributarios-web`
5. Clique em "Registrar app"
6. Copie o objeto `firebaseConfig`

#### 1.4 Atualizar arquivo de configuração
Abra `src/js/firebase-config.js` e substitua as credenciais:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",              // Cole aqui
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",        // Cole aqui
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

#### 1.5 Configurar regras de Firestore (Desenvolvimento)
No console Firebase → Firestore → Aba "Regras":

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /alunos/{document=**} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **Produção:** Use regras mais restritivas com autenticação real.

---

## 2. Variáveis de Configuração

### CPF do Administrador
Em `src/js/auth.js`, altere:

```javascript
const ADMIN_CPF = "12345678901"; // CPF do Prof. Renato Rosa
```

### Constantes Tributárias
Em `src/js/iss.js`:

```javascript
const ALIQUOTA_CBS_TESTE = 0.009;  // 0,9%
const ALIQUOTA_IBS_TESTE = 0.001;  // 0,1%
```

---

## 3. Fluxo de Autenticação

### Diagrama de Fluxo

```
┌──────────────────┐
│   index.html     │  ← Tela de Login (CPF)
└────────┬─────────┘
         │ Form Submit
         ▼
┌──────────────────────────────────┐
│  auth.js                         │
│  ├─ validateCPF()                │  ← Validação matemática
│  ├─ createStudentDocument()      │  ← Consulta/Cria no Firestore
│  └─ routeUser()                  │  ← Roteamento
└────┬────────────────────────┬────┘
     │                        │
     ├─ Se CPF == ADMIN_CPF   │
     │                        │
     ▼                        ▼
  admin.html              student.html
  (Dashboard Admin)       (Módulos Aluno)
```

### Validação de CPF

A validação segue o algoritmo matemático oficial da Receita Federal:

1. Calcula primeiro dígito verificador (posições 0-8)
2. Calcula segundo dígito verificador (posições 0-9)
3. Compara com dígitos fornecidos

CPFs inválidos:
- Com menos de 11 dígitos
- Com todos os dígitos iguais (11111111111, etc.)
- Com dígitos verificadores incorretos

---

## 4. Estrutura do Banco de Dados

### Coleção: `alunos`

```
alunos/
├── {cpf}/
│   ├── cpf: "12345678900"
│   ├── cpfFormatado: "123.456.789-00"
│   ├── dataAcesso: "2026-04-25T10:30:00Z"
│   ├── modulos/
│   │   ├── iss/
│   │   │   ├── inputs: { valor, municipio, aliquota }
│   │   │   ├── outputs: { iss_devido, cbs_teste_09, ibs_teste_01, total_retencao_1pct }
│   │   │   └── timestamp: "2026-04-25T10:31:00Z"
│   │   ├── icms/ { ... }
│   │   ├── ipi/ { ... }
│   │   ├── pisCofins/ { ... }
│   │   ├── irpj/ { ... }
│   │   └── csll/ { ... }
│   └── dashboard/
│       ├── resultadosConsolidados: { ... }
│       └── ultimaAtualizacao: "2026-04-25T10:31:00Z"
```

---

## 5. Funções JavaScript Principais

### `auth.js`

```javascript
validateCPF(cpf)                    // → boolean
formatCPF(cpf)                      // → string
createStudentDocument(cpf)          // → Promise { exists, data }
routeUser(cpf)                      // → Promise (redirect)
```

### `student.js`

```javascript
saveModuleData(moduleName, inputs, outputs)  // → Promise
loadModuleData(moduleName)                   // → Promise { data }
```

### `iss.js`

```javascript
calcularISS(valorServico, aliquotaISS)  // → { resultados }
```

---

## 6. Instruções de Desenvolvimento

### Estrutura para Novos Módulos

```javascript
// src/js/novo-modulo.js
import { saveModuleData, loadModuleData } from './student.js';

function initializeNovoModulo() {
    const form = document.getElementById('novoModuloForm');
    form.addEventListener('submit', handleCalculation);
    loadData();
}

async function handleCalculation(event) {
    event.preventDefault();
    
    // Capturar inputs
    const resultado = calcular(...);
    
    // Exibir resultado
    exibir(resultado);
    
    // Salvar no Firestore
    await saveModuleData('novoModulo', inputs, resultado);
}

function calcular(...) {
    // Lógica de cálculo
}

function exibir(resultado) {
    // Atualizar DOM
}

async function loadData() {
    // Carregar dados salvos
    const data = await loadModuleData('novoModulo');
}

document.addEventListener('DOMContentLoaded', initializeNovoModulo);
```

### Testes Locais

1. Abra o arquivo `index.html` no navegador (ou use Live Server no VS Code)
2. Insira um CPF válido (ex: 12345678900)
3. Sistema roteará para painel apropriado

CPF de teste válido: `12345678900`
CPF de teste para admin: `12345678901` (configure em `auth.js`)

---

## 7. Deploy

### Opção 1: Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### Opção 2: GitHub Pages

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

Configure GitHub Pages nas configurações do repositório.

---

## 8. Troubleshooting

### Erro: "Missing or insufficient permissions"
- Verificar regras do Firestore (use modo "Teste" para desenvolvimento)
- Confirmar se `projectId` está correto em `firebase-config.js`

### CPF não é reconhecido como válido
- Usar CPF de teste: `12345678900`
- Validar dígitos verificadores

### Dados não salvam no Firestore
- Verificar se há conexão com internet
- Verificar Console do navegador (F12 → Console) para erros
- Confirmar autenticação do Firebase

---

## 9. Referências

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [JavaScript ES6+ Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference)
