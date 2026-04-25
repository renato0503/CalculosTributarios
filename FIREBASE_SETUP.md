# Configuração do Firebase

Este projeto usa Firebase Firestore. Para configurar:

## 1. Crie um projeto no Firebase Console
Acesse: https://console.firebase.google.com/

## 2. Ative o Firestore
- No console do Firebase, vá em "Firestore Database"
- Clique em "Criar banco de dados"
- Escolha o modo de teste (para desenvolvimento)

## 3. Configure o arquivo de configuração

Edite o arquivo `src/js/firebase-config.js` com suas credenciais:

```javascript
const firebaseConfig = {
    apiKey: "SUA_API_KEY",
    authDomain: "seu-projeto.firebaseapp.com",
    projectId: "seu-projeto",
    storageBucket: "seu-projeto.firebasestorage.app",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abc123",
    measurementId: "G-XXXXXXXXXX"
};
```

## 4. Configure o CPF de Administrador (opcional)

No arquivo `src/js/auth.js`, defina o CPF do administrador:

```javascript
const ADMIN_CPF = "12345678901"; // Seu CPF sem pontos
```

## Regras do Firestore (para modo de teste)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

## Deploy no Firebase Hosting

```bash
firebase init hosting
firebase deploy
```