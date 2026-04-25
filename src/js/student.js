import { db } from './firebase-config.js';
import {
    doc,
    getDoc,
    updateDoc,
    collection,
    getDocs,
    addDoc,
    deleteDoc,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentUserCPF = null;
let activeScenarioId = null;

async function initializeStudentPage() {
    currentUserCPF = sessionStorage.getItem('userCPF');

    if (!currentUserCPF) {
        window.location.href = 'index.html';
        return;
    }

    loadUserData();
    setupModuleNavigation();
    setupLogout();
    await initializeScenarios();
}

async function loadUserData() {
    try {
        const docRef = doc(db, 'alunos', currentUserCPF);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            document.getElementById('userName').textContent = data.nome || '';
            document.getElementById('userCPF').textContent = formatCPFDisplay(currentUserCPF);
        } else {
            document.getElementById('userCPF').textContent = formatCPFDisplay(currentUserCPF);
        }
    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        document.getElementById('userCPF').textContent = formatCPFDisplay(currentUserCPF);
    }
}

function setupModuleNavigation() {
    const moduleBtns = document.querySelectorAll('.module-btn');

    moduleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const moduleName = btn.dataset.module;

            moduleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const modules = document.querySelectorAll('.module');
            modules.forEach(m => m.classList.remove('active'));

            const targetSection = document.getElementById(moduleName);
            if (targetSection) {
                targetSection.classList.add('active');
                // Forçar recarregamento de dados do módulo específico ao trocar de aba
                if (moduleName !== 'scenarios' && moduleName !== 'dashboard' && moduleName !== 'calculos') {
                    window.dispatchEvent(new CustomEvent('moduleSwitched', { detail: { module: moduleName } }));
                }
            }
        });
    });
}

async function initializeScenarios() {
    const scenarioSelect = document.getElementById('globalScenarioSelect');
    const newScenarioBtn = document.getElementById('createNewScenarioBtn');
    const newScenarioInput = document.getElementById('newScenarioName');

    // Ao mudar o cenário no dropdown global
    scenarioSelect.addEventListener('change', (e) => {
        activeScenarioId = e.target.value;
        // 🔹 ALTERAÇÃO FLUXO SALVAR→DASHBOARD: Renomeado key para cenarioAtivo
        sessionStorage.setItem('cenarioAtivo', activeScenarioId);
        
        // Notificar módulos que o cenário mudou
        window.dispatchEvent(new CustomEvent('scenarioChanged', { detail: { scenarioId: activeScenarioId } }));
    });

    // Botão de criar cenário
    newScenarioBtn.addEventListener('click', async () => {
        const nome = newScenarioInput.value.trim();
        if (!nome) return alert('Dê um nome ao cenário.');

        try {
            const scenariosRef = collection(db, 'alunos', currentUserCPF, 'cenarios');
            const newDoc = await addDoc(scenariosRef, {
                nome,
                dataCriacao: new Date().toISOString(),
                modulos: {}
            });
            
            newScenarioInput.value = '';
            await loadScenariosList();
            
            // Ativa o novo cenário automaticamente
            activeScenarioId = newDoc.id;
            // 🔹 ALTERAÇÃO FLUXO SALVAR→DASHBOARD: Renomeado key para cenarioAtivo
            sessionStorage.setItem('cenarioAtivo', activeScenarioId);
            await loadScenariosList(); // Atualiza dropdown
        } catch (error) {
            console.error('Erro ao criar cenário:', error);
        }
    });

    // 🔹 ALTERAÇÃO FLUXO SALVAR→DASHBOARD: Renomeado key para cenarioAtivo
    activeScenarioId = sessionStorage.getItem('cenarioAtivo');
    await loadScenariosList();
}

async function loadScenariosList() {
    const scenarioSelect = document.getElementById('globalScenarioSelect');
    const scenariosFullList = document.getElementById('scenariosFullList');
    
    try {
        const scenariosRef = collection(db, 'alunos', currentUserCPF, 'cenarios');
        const q = query(scenariosRef, orderBy('dataCriacao', 'desc'));
        const querySnapshot = await getDocs(q);

        scenarioSelect.innerHTML = '<option value="">-- Selecione o Cenário --</option>';
        scenariosFullList.innerHTML = '';

        if (querySnapshot.empty) {
            scenariosFullList.innerHTML = '<p class="empty-message">Crie seu primeiro cenário acima para começar.</p>';
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const scenario = docSnap.data();
            const id = docSnap.id;

            // Update Dropdown
            const option = document.createElement('option');
            option.value = id;
            option.textContent = scenario.nome;
            if (id === activeScenarioId) option.selected = true;
            scenarioSelect.appendChild(option);

            // Update Full List
            const card = document.createElement('div');
            card.className = `scenario-card ${id === activeScenarioId ? 'active' : ''}`;
            card.innerHTML = `
                <div class="scenario-header">
                    <h4>${scenario.nome}</h4>
                    <span class="badge ${id === activeScenarioId ? 'badge-active' : 'hidden'}">Ativo</span>
                </div>
                <div class="scenario-actions">
                    <button class="btn btn-primary btn-sm select-scenario" data-id="${id}">Selecionar</button>
                    <button class="btn btn-secondary btn-sm delete-scenario" data-id="${id}">Excluir</button>
                </div>
            `;

            card.querySelector('.select-scenario').addEventListener('click', () => {
                activeScenarioId = id;
                // 🔹 ALTERAÇÃO FLUXO SALVAR→DASHBOARD: Renomeado key para cenarioAtivo
                sessionStorage.setItem('cenarioAtivo', id);
                loadScenariosList();
                window.dispatchEvent(new CustomEvent('scenarioChanged', { detail: { scenarioId: id } }));
            });

            card.querySelector('.delete-scenario').addEventListener('click', async () => {
                if (confirm('Tem certeza que deseja excluir este cenário? Todos os cálculos dele serão perdidos.')) {
                    await deleteDoc(doc(db, 'alunos', currentUserCPF, 'cenarios', id));
                    if (activeScenarioId === id) {
                        activeScenarioId = null;
                        // 🔹 ALTERAÇÃO FLUXO SALVAR→DASHBOARD: Renomeado key para cenarioAtivo
                        sessionStorage.removeItem('cenarioAtivo');
                    }
                    loadScenariosList();
                }
            });

            scenariosFullList.appendChild(card);
        });
    } catch (error) {
        console.error('Erro ao listar cenários:', error);
    }
}

function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('userCPF');
        // 🔹 ALTERAÇÃO FLUXO SALVAR→DASHBOARD: Renomeado key para cenarioAtivo
        sessionStorage.removeItem('cenarioAtivo');
        window.location.href = 'index.html';
    });
}

function formatCPFDisplay(cpf) {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export async function saveModuleData(moduleName, inputs, outputs) {
    if (!currentUserCPF) return;
    // 🔹 ALTERAÇÃO FLUXO SALVAR→DASHBOARD: Renomeado key para cenarioAtivo
    const cenarioAtivo = sessionStorage.getItem('cenarioAtivo');

    if (!cenarioAtivo) {
        return;
    }

    try {
        const scenarioRef = doc(db, 'alunos', currentUserCPF, 'cenarios', cenarioAtivo);
        const timestamp = new Date().toISOString();

        await updateDoc(scenarioRef, {
            [`modulos.${moduleName}.inputs`]: inputs,
            [`modulos.${moduleName}.outputs`]: outputs,
            [`modulos.${moduleName}.timestamp`]: timestamp
        });
    } catch (error) {
        console.error(`Erro ao salvar dados do módulo ${moduleName}:`, error);
    }
}

export async function loadModuleData(moduleName) {
    if (!currentUserCPF) return null;
    // 🔹 ALTERAÇÃO FLUXO SALVAR→DASHBOARD: Renomeado key para cenarioAtivo
    const cenarioAtivo = sessionStorage.getItem('cenarioAtivo');

    if (!cenarioAtivo) return null;

    try {
        const scenarioRef = doc(db, 'alunos', currentUserCPF, 'cenarios', cenarioAtivo);
        const docSnap = await getDoc(scenarioRef);

        if (docSnap.exists() && docSnap.data().modulos && docSnap.data().modulos[moduleName]) {
            return docSnap.data().modulos[moduleName];
        }
        return null;
    } catch (error) {
        console.error(`Erro ao carregar dados do módulo ${moduleName}:`, error);
        return null;
    }
}

// 🔹 ALTERAÇÃO FLUXO SALVAR→DASHBOARD: Nova função de orquestração de salvamento
export async function handleModuleSave(moduloNome, inputs, outputs, btnId) {
    const cenarioAtivo = sessionStorage.getItem('cenarioAtivo');
    if (!cenarioAtivo) {
        alert('⚠️ Selecione ou crie um cenário ativo primeiro!');
        return false;
    }

    try {
        await saveModuleData(moduloNome, inputs, outputs);
        
        // Notificar o dashboard para recarregar
        window.dispatchEvent(new CustomEvent('scenarioChanged', { detail: { scenarioId: cenarioAtivo } }));
        
        showToast(`✅ ${moduloNome.toUpperCase()} salvo no cenário ativo!`);
        
        // Esconder botão após salvar
        if (btnId) {
            document.getElementById(btnId).style.display = 'none';
        }
        return true;
    } catch (error) {
        showToast('❌ Erro ao salvar dados.', 'error');
        return false;
    }
}

// 🔹 ALTERAÇÃO FLUXO SALVAR→DASHBOARD: Função utilitária para Toast
export function showToast(mensagem, tipo = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    toast.textContent = mensagem;
    
    const bgColor = tipo === 'success' ? '#4CAF50' : '#f44336';
    toast.style.cssText = `
        background: ${bgColor};
        color: white;
        padding: 12px 20px;
        margin: 10px 0;
        border-radius: 4px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        animation: slideIn 0.3s, fadeOut 0.3s 2.7s;
        font-family: inherit;
        font-size: 14px;
        min-width: 250px;
    `;
    
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 2700);
}

// Estilos de animação para o toast
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', initializeStudentPage);

export { loadModuleData, saveModuleData, handleModuleSave, showToast, loadUserData };
