import { db } from './firebase-config.js';
import { doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentUserCPF = null;

async function initApp() {
    console.log('Iniciando app...');
    console.log('DB:', db);
    
    if (!db) {
        console.log('Aguardando Firebase...');
        document.getElementById('statusText').textContent = 'Aguardando Firebase...';
        setTimeout(initApp, 500);
        return;
    }

    currentUserCPF = sessionStorage.getItem('userCPF');
    console.log('CPF:', currentUserCPF);

    if (!currentUserCPF) {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('statusText').textContent = 'Complete seu cadastro';
    document.getElementById('profileSection').style.display = 'block';

    await checkProfile();
    setupFormatters();
}

async function checkProfile() {
    try {
        const docRef = doc(db, 'alunos', currentUserCPF);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.nome && data.whatsapp) {
                window.location.href = 'student.html';
            } else {
                document.getElementById('alunoNome').value = data.nome || '';
                document.getElementById('alunoWhatsapp').value = data.whatsapp || '';
            }
        }
    } catch (error) {
        console.error('Erro ao verificar perfil:', error);
    }
}

function setupFormatters() {
    const whatsappInput = document.getElementById('alunoWhatsapp');
    
    whatsappInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) {
            value = value.substring(0, 11);
        }
        e.target.value = value;
    });
}

async function handleProfileSave(event) {
    event.preventDefault();

    // Redundant safety check to prevent 'indexOf' null error
    if (!currentUserCPF) {
        currentUserCPF = sessionStorage.getItem('userCPF');
    }

    if (!currentUserCPF) {
        console.error('Sessão expirada ou CPF não encontrado.');
        window.location.href = 'index.html';
        return;
    }

    const nomeInput = document.getElementById('alunoNome');
    const whatsappInput = document.getElementById('alunoWhatsapp');
    const saveBtn = document.getElementById('saveProfileBtn');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const profileError = document.getElementById('profileError');

    const nome = nomeInput.value.trim();
    const whatsapp = whatsappInput.value.trim();

    profileError.classList.add('hidden');

    if (!nome || nome.length < 3) {
        profileError.textContent = 'Digite seu nome completo (mínimo 3 caracteres).';
        profileError.classList.remove('hidden');
        return;
    }

    if (!whatsapp || whatsapp.length < 8) {
        profileError.textContent = 'Digite um WhatsApp válido.';
        profileError.classList.remove('hidden');
        return;
    }

    saveBtn.disabled = true;
    loadingSpinner.classList.remove('hidden');

    try {
        const docRef = doc(db, 'alunos', currentUserCPF);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            await updateDoc(docRef, {
                nome: nome,
                whatsapp: whatsapp,
                dataAtualizacao: new Date().toISOString()
            });
        } else {
            await setDoc(docRef, {
                cpf: currentUserCPF,
                nome: nome,
                whatsapp: whatsapp,
                disciplina: 'Cálculos Tributários',
                dataAcesso: new Date().toISOString(),
                dataAtualizacao: new Date().toISOString(),
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
            });
        }

        window.location.href = 'student.html';
    } catch (error) {
        console.error('Erro ao salvar perfil:', error);
        profileError.textContent = 'Erro ao conectar com o banco de dados. Tente novamente.';
        profileError.classList.remove('hidden');
        saveBtn.disabled = false;
        loadingSpinner.classList.add('hidden');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('profileForm').addEventListener('submit', handleProfileSave);
    initApp();
});