import { db } from './firebase-config.js';
import {
    doc,
    getDoc,
    setDoc,
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Configure o CPF do administrador no arquivo .env ou variáveis de ambiente
// Exemplo: const ADMIN_CPF = "12345678901";
// Deixe vazio para desabilitar o painel admin temporariamente
const ADMIN_CPF = "";

function validateCPF(cpf) {
    const cleanCPF = cpf.replace(/\D/g, '');

    if (cleanCPF.length !== 11) {
        return false;
    }

    if (/^(\d)\1{10}$/.test(cleanCPF)) {
        return false;
    }

    let sum = 0;
    let remainder;

    for (let i = 1; i <= 9; i++) {
        sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
    }

    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) {
        remainder = 0;
    }

    if (remainder !== parseInt(cleanCPF.substring(9, 10))) {
        return false;
    }

    sum = 0;
    for (let i = 1; i <= 10; i++) {
        sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
    }

    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) {
        remainder = 0;
    }

    if (remainder !== parseInt(cleanCPF.substring(10, 11))) {
        return false;
    }

    return true;
}

function formatCPF(cpf) {
    const cleanCPF = cpf.replace(/\D/g, '');
    return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

async function createStudentDocument(cpf) {
    const formattedCPF = formatCPF(cpf);
    const docRef = doc(db, 'alunos', cpf);

    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return { exists: true, data: docSnap.data() };
    } else {
        const newStudent = {
            cpf: cpf,
            cpfFormatado: formattedCPF,
            dataAcesso: new Date().toISOString(),
            modulos: {
                iss: { inputs: {}, outputs: {}, timestamp: null },
                icms: { inputs: {}, outputs: {}, timestamp: null },
                ipi: { inputs: {}, outputs: {}, timestamp: null },
                pisCofins: { inputs: {}, outputs: {}, timestamp: null },
                irpj: { inputs: {}, outputs: {}, timestamp: null },
                csll: { inputs: {}, outputs: {}, timestamp: null }
            },
            dashboard: {
                resultadosConsolidados: {},
                ultimaAtualizacao: new Date().toISOString()
            }
        };

        await setDoc(docRef, newStudent);
        return { exists: false, data: newStudent };
    }
}

async function routeUser(cpf) {
    const cleanCPF = cpf.replace(/\D/g, '');

    if (cleanCPF === ADMIN_CPF) {
        sessionStorage.setItem('userCPF', cleanCPF);
        window.location.href = 'admin.html';
    } else {
        sessionStorage.setItem('userCPF', cleanCPF);
        window.location.href = 'profile-setup.html';
    }
}

async function handleLogin(event) {
    event.preventDefault();

    const cpfInput = document.getElementById('cpfInput');
    const cpfError = document.getElementById('cpfError');
    const loginError = document.getElementById('loginError');
    const loginBtn = document.getElementById('loginBtn');
    const loadingSpinner = document.getElementById('loadingSpinner');

    const cpf = cpfInput.value.trim();

    cpfError.textContent = '';
    loginError.classList.add('hidden');

    if (!cpf) {
        cpfError.textContent = 'Digite um CPF válido.';
        return;
    }

    if (!validateCPF(cpf)) {
        cpfError.textContent = 'CPF inválido. Verifique os dígitos verificadores.';
        cpfInput.focus();
        return;
    }

    loginBtn.disabled = true;
    loadingSpinner.classList.remove('hidden');

    try {
        const cleanCPF = cpf.replace(/\D/g, '');
        await routeUser(cleanCPF);
    } catch (error) {
        console.error('Erro de autenticação:', error);
        loginError.textContent = 'Erro ao conectar ao servidor. Tente novamente.';
        loginError.classList.remove('hidden');

        loginBtn.disabled = false;
        loadingSpinner.classList.add('hidden');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const cpfInput = document.getElementById('cpfInput');

    loginForm.addEventListener('submit', handleLogin);

    cpfInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');

        if (value.length > 11) {
            value = value.substring(0, 11);
        }

        const formatted = value
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
            .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');

        e.target.value = formatted;
    });
});

export { validateCPF, formatCPF, createStudentDocument, routeUser };
