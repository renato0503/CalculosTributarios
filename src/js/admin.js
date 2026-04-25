import { db } from './firebase-config.js';
import {
    doc,
    getDoc,
    getDocs,
    collection,
    deleteDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const ADMIN_CPF = "05930662193";

let selectedStudentCPF = null;

async function initializeAdminPage() {
    const userCPF = sessionStorage.getItem('userCPF') || localStorage.getItem('adminCPF');

    if (!userCPF || userCPF !== ADMIN_CPF) {
        window.location.href = 'index.html';
        return;
    }

    localStorage.setItem('adminCPF', ADMIN_CPF);
    setupLogout();
    await loadStudentsList();
}

async function loadStudentsList() {
    try {
        const studentsCollection = collection(db, 'alunos');
        const studentsSnapshot = await getDocs(studentsCollection);

        const studentsList = document.getElementById('studentsList');
        studentsList.innerHTML = '';

        studentsSnapshot.forEach(docSnap => {
            const data = docSnap.data();
            const studentCard = createStudentCard(data);
            studentsList.appendChild(studentCard);
        });
    } catch (error) {
        console.error('Erro ao carregar lista de alunos:', error);
        alert('Erro ao carregar lista de alunos.');
    }
}

function createStudentCard(studentData) {
    const card = document.createElement('div');
    card.className = 'student-card';

    const cpfFormatted = studentData.cpfFormatado || formatCPFDisplay(studentData.cpf);
    const dataAcesso = new Date(studentData.dataAcesso).toLocaleDateString('pt-BR');

    card.innerHTML = `
        <h3>${studentData.nome || cpfFormatted}</h3>
        <p><strong>CPF:</strong> ${cpfFormatted}</p>
        <p><strong>Primeiro acesso:</strong> ${dataAcesso}</p>
        <p><strong>Módulos:</strong> ${countCompletedModules(studentData.modulos)}</p>
    `;

    card.addEventListener('click', () => {
        selectedStudentCPF = studentData.cpf;
        loadStudentDetails(studentData);
    });

    return card;
}

function countCompletedModules(modulos) {
    let count = 0;
    for (const key in modulos) {
        if (modulos[key].outputs && Object.keys(modulos[key].outputs).length > 0) {
            count++;
        }
    }
    return `${count}/6`;
}

async function loadStudentDetails(studentData) {
    const detailsSection = document.getElementById('studentDetails');
    const studentName = document.getElementById('studentName');
    const dataBody = document.getElementById('studentDataBody');

    // Mostra o nome se existir, senão o CPF
    studentName.textContent = studentData.nome || studentData.cpfFormatado || formatCPFDisplay(studentData.cpf);

    dataBody.innerHTML = '';

    const modulos = ['iss', 'icms', 'ipi', 'pisCofins', 'irpj', 'csll'];

    modulos.forEach(moduleName => {
        const moduloData = (studentData.modulos && studentData.modulos[moduleName]) || {};
        const row = document.createElement('tr');

        const inputsStr = JSON.stringify(moduloData.inputs || {});
        const outputsStr = JSON.stringify(moduloData.outputs || {});
        const timestamp = moduloData.timestamp ? new Date(moduloData.timestamp).toLocaleDateString('pt-BR') : 'N/A';

        row.innerHTML = `
            <td>${moduleName.toUpperCase()}</td>
            <td><code>${inputsStr.substring(0, 50)}${inputsStr.length > 50 ? '...' : ''}</code></td>
            <td><code>${outputsStr.substring(0, 50)}${outputsStr.length > 50 ? '...' : ''}</code></td>
            <td>${timestamp}</td>
        `;

        dataBody.appendChild(row);
    });

    await loadStudentScenarios(studentData.cpf);

    setupDetailButtons();
    detailsSection.classList.remove('hidden');
}

async function loadStudentScenarios(cpf) {
    const listContainer = document.getElementById('studentScenariosList');
    if (!listContainer) return;

    try {
        const scenariosRef = collection(db, 'alunos', cpf, 'cenarios');
        const querySnapshot = await getDocs(scenariosRef);

        if (querySnapshot.empty) {
            listContainer.innerHTML = '<p>Nenhum cenário salvo.</p>';
            return;
        }

        listContainer.innerHTML = '';
        querySnapshot.forEach(docSnap => {
            const scenario = docSnap.data();
            const card = document.createElement('div');
            card.className = 'scenario-card-mini';
            card.innerHTML = `
                <h5>${scenario.nome}</h5>
                <p>Tributos: R$ ${scenario.consolidado.totalTributos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <p>Teste 1%: R$ ${scenario.consolidado.totalCBS_IBS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            `;
            listContainer.appendChild(card);
        });
    } catch (error) {
        console.error('Erro ao carregar cenários do aluno:', error);
        listContainer.innerHTML = '<p>Erro ao carregar cenários.</p>';
    }
}

function setupDetailButtons() {
    const backBtn = document.getElementById('backBtn');
    const editBtn = document.getElementById('editBtn');
    const deleteBtn = document.getElementById('deleteBtn');

    backBtn.onclick = () => {
        document.getElementById('studentDetails').classList.add('hidden');
        selectedStudentCPF = null;
    };

    editBtn.onclick = () => {
        alert('Funcionalidade de edição em desenvolvimento.');
    };

    deleteBtn.onclick = async () => {
        if (!selectedStudentCPF) return;

        if (confirm('Tem certeza que deseja deletar este aluno?')) {
            try {
                await deleteDoc(doc(db, 'alunos', selectedStudentCPF));
                alert('Aluno deletado com sucesso.');
                document.getElementById('studentDetails').classList.add('hidden');
                await loadStudentsList();
            } catch (error) {
                console.error('Erro ao deletar aluno:', error);
                alert('Erro ao deletar aluno.');
            }
        }
    };
}

function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('adminCPF');
        sessionStorage.removeItem('userCPF');
        window.location.href = 'index.html';
    });
}

function formatCPFDisplay(cpf) {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

document.addEventListener('DOMContentLoaded', initializeAdminPage);
