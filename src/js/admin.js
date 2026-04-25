import { db } from './firebase-config.js';
import {
    doc,
    getDoc,
    getDocs,
    collection,
    deleteDoc,
    query,
    orderBy,
    limit
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const ADMIN_CPF = "05930662193";

let allStudents = [];
let filteredStudents = [];
let currentView = 'list';

const moduleLabels = {
    iss: 'ISS - Imposto sobre Serviços',
    icms: 'ICMS - Imposto sobre Circulação',
    ipi: 'IPI - Imposto sobre Produtos Industrializados',
    pisCofins: 'PIS/COFINS - Contribuições Federais',
    irpj: 'IRPJ - Imposto de Renda PJ',
    csll: 'CSLL - Contribuição Social'
};

const moduleColors = {
    iss: '#28a745',
    icms: '#17a2b8',
    ipi: '#ffc107',
    pisCofins: '#dc3545',
    irpj: '#6f42c1',
    csll: '#fd7e14'
};

function getSafeValue(obj, path, defaultValue = null) {
    if (!obj) return defaultValue;
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
        if (current === null || current === undefined) return defaultValue;
        current = current[part];
    }
    return current !== null && current !== undefined ? current : defaultValue;
}

function formatCurrency(value) {
    const num = parseFloat(value);
    if (isNaN(num)) return 'R$ 0,00';
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(date) {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatDateShort(date) {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getStudentStatus(ultimoAcesso) {
    if (!ultimoAcesso) return { status: 'inactive', label: 'Sem acesso', color: '#6c757d' };
    
    const now = new Date();
    const acesso = ultimoAcesso.toDate ? ultimoAcesso.toDate() : new Date(ultimoAcesso);
    const diffDays = Math.floor((now - acesso) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 7) return { status: 'active', label: '🟢 Ativo', color: '#28a745' };
    if (diffDays <= 30) return { status: 'inactive', label: '🟡 Inativo', color: '#ffc107' };
    return { status: 'abandoned', label: '🔴 Abandonou', color: '#dc3545' };
}

async function initializeAdminPage() {
    const userCPF = sessionStorage.getItem('userCPF') || localStorage.getItem('adminCPF');

    if (!userCPF || userCPF !== ADMIN_CPF) {
        window.location.href = 'index.html';
        return;
    }

    localStorage.setItem('adminCPF', ADMIN_CPF);
    setupLogout();
    setupSearchAndFilters();
    await loadAllStudents();
}

async function loadAllStudents() {
    try {
        showLoading(true);
        const studentsCollection = collection(db, 'alunos');
        const snapshot = await getDocs(studentsCollection);
        
        allStudents = [];
        
        for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            const cpf = docSnap.id;
            
            const scenariosSnapshot = await getDocs(collection(db, 'alunos', cpf, 'cenarios'));
            const scenarios = [];
            scenariosSnapshot.forEach(scenDoc => {
                scenarios.push({ id: scenDoc.id, ...scenDoc.data() });
            });
            
            const modulosUsados = new Set();
            scenarios.forEach(s => {
                if (s.modulos) {
                    Object.keys(s.modulos).forEach(m => modulosUsados.add(m));
                }
            });
            
            const statusInfo = getStudentStatus(data.ultimoAcesso || data.dataAcesso);
            
            allStudents.push({
                cpf: cpf,
                cpfFormatado: data.cpfFormatado || formatCPFDisplay(cpf),
                nome: data.nome || 'Nome não informado',
                whatsapp: data.whatsapp || '',
                primeiroAcesso: data.dataAcesso,
                ultimoAcesso: data.ultimoAcesso,
                totalCenarios: scenarios.length,
                modulosUsados: Array.from(modulosUsados),
                statusInfo: statusInfo
            });
        }
        
        allStudents.sort((a, b) => {
            const dateA = a.ultimoAcesso?.toDate?.() || new Date(0);
            const dateB = b.ultimoAcesso?.toDate?.() || new Date(0);
            return dateB - dateA;
        });
        
        filteredStudents = [...allStudents];
        updateDashboardStats();
        renderStudentsList();
        showLoading(false);
        
    } catch (error) {
        console.error('Erro ao carregar alunos:', error);
        showLoading(false);
        alert('Erro ao carregar lista de alunos: ' + error.message);
    }
}

function updateDashboardStats() {
    const totalAlunos = allStudents.length;
    const ativos = allStudents.filter(s => s.statusInfo.status === 'active').length;
    const inativos = allStudents.filter(s => s.statusInfo.status === 'inactive').length;
    const abandonados = allStudents.filter(s => s.statusInfo.status === 'abandoned').length;
    
    const moduloCount = {};
    allStudents.forEach(s => {
        s.modulosUsados.forEach(m => {
            moduloCount[m] = (moduloCount[m] || 0) + 1;
        });
    });
    
    const moduloMaisUsado = Object.entries(moduloCount)
        .sort((a, b) => b[1] - a[1])[0];
    
    document.getElementById('totalAlunos').textContent = totalAlunos;
    document.getElementById('alunosAtivos').textContent = ativos;
    document.getElementById('alunosInativos').textContent = inativos;
    document.getElementById('alunosAbandonados').textContent = abandonados;
    document.getElementById('moduloMaisUsado').textContent = moduloMaisUsado ? 
        (moduleLabels[moduloMaisUsado[0]] || moduloMaisUsado[0]) : 'N/A';
}

function renderStudentsList() {
    const container = document.getElementById('studentsList');
    
    if (filteredStudents.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Nenhum aluno encontrado.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filteredStudents.map(student => `
        <div class="student-card" onclick="loadStudentDetails('${student.cpf}')">
            <div class="student-card-header">
                <div class="student-info">
                    <h3>${student.nome}</h3>
                    <p class="cpf">CPF: ${student.cpfFormatado}</p>
                </div>
                <span class="student-status-badge" style="background: ${student.statusInfo.color}20; color: ${student.statusInfo.color}">
                    ${student.statusInfo.label}
                </span>
            </div>
            <div class="student-card-stats">
                <div class="stat">
                    <span class="stat-value">${student.totalCenarios}</span>
                    <span class="stat-label">Cenários</span>
                </div>
                <div class="stat">
                    <span class="stat-value">${student.modulosUsados.length}/6</span>
                    <span class="stat-label">Módulos</span>
                </div>
                <div class="stat">
                    <span class="stat-value">${student.ultimoAcesso ? formatTimeAgo(student.ultimoAcesso) : 'N/A'}</span>
                    <span class="stat-label">Último acesso</span>
                </div>
            </div>
            <div class="student-card-modules">
                ${student.modulosUsados.map(m => `<span class="module-tag" style="background: ${moduleColors[m]}">${m.toUpperCase()}</span>`).join('')}
            </div>
        </div>
    `).join('');
}

function formatTimeAgo(date) {
    if (!date) return 'N/A';
    const now = new Date();
    const d = date.toDate ? date.toDate() : new Date(date);
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return formatDateShort(date);
}

window.loadStudentDetails = async function(cpf) {
    try {
        showLoading(true);
        
        const docRef = doc(db, 'alunos', cpf);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            alert('Aluno não encontrado');
            showLoading(false);
            return;
        }
        
        const studentData = docSnap.data();
        
        const scenariosRef = collection(db, 'alunos', cpf, 'cenarios');
        const scenariosSnapshot = await getDocs(query(scenariosRef, orderBy('dataCriacao', 'desc')));
        
        const scenarios = [];
        scenariosSnapshot.forEach(scenDoc => {
            scenarios.push({ id: scenDoc.id, ...scenDoc.data() });
        });
        
        renderStudentDetails(studentData, cpf, scenarios);
        showLoading(false);
        
    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
        showLoading(false);
        alert('Erro ao carregar detalhes: ' + error.message);
    }
};

function renderStudentDetails(studentData, cpf, scenarios) {
    const detailsSection = document.getElementById('studentDetails');
    const studentName = document.getElementById('studentName');
    const studentHeader = document.getElementById('studentHeader');
    
    if (studentName) {
        studentName.textContent = studentData.nome || 'Aluno';
    }
    
    const statusInfo = getStudentStatus(studentData.ultimoAcesso || studentData.dataAcesso);
    
    studentHeader.innerHTML = `
        <button id="backBtn" class="btn btn-secondary" onclick="showStudentsList()">← Voltar</button>
        <div class="student-header-info">
            <h2>${studentData.nome || 'Aluno'}</h2>
            <div class="student-badges">
                <span class="badge" style="background: ${statusInfo.color}20; color: ${statusInfo.color}">${statusInfo.label}</span>
                <span class="badge">📊 ${scenarios.length} cenários</span>
                <span class="badge">📅 Primeiro acesso: ${formatDateShort(studentData.dataAcesso)}</span>
            </div>
        </div>
        <div class="student-actions-header">
            ${studentData.whatsapp ? `<a href="https://wa.me/55${studentData.whatsapp}" target="_blank" class="btn btn-whatsapp">💬 WhatsApp</a>` : ''}
            <button onclick="exportStudentData('${cpf}')" class="btn btn-primary">📄 Exportar</button>
        </div>
    `;
    
    const totalTributos = scenarios.reduce((sum, s) => {
        return sum + calculateScenarioTotal(s);
    }, 0);
    
    const modulesStats = {};
    scenarios.forEach(s => {
        if (s.modulos) {
            Object.keys(s.modulos).forEach(m => {
                modulesStats[m] = (modulesStats[m] || 0) + 1;
            });
        }
    });
    
    const statsHtml = `
        <div class="student-stats-grid">
            <div class="stat-card">
                <h4>Total de Cenários</h4>
                <p class="stat-number">${scenarios.length}</p>
            </div>
            <div class="stat-card">
                <h4>Carga Tributária Total</h4>
                <p class="stat-number">${formatCurrency(totalTributos)}</p>
            </div>
            <div class="stat-card">
                <h4>Módulo Mais Usado</h4>
                <p class="stat-number">${Object.entries(modulesStats).sort((a, b) => b[1] - a[1])[0]?.[0]?.toUpperCase() || 'N/A'}</p>
            </div>
        </div>
    `;
    
    document.getElementById('studentStats').innerHTML = statsHtml;
    
    const timeline = buildTimeline(scenarios);
    const timelineHtml = timeline.slice(0, 10).map(event => `
        <div class="timeline-item">
            <span class="timeline-time">${formatDateShort(event.date)}</span>
            <span class="timeline-action">${event.action}</span>
        </div>
    `).join('');
    
    document.getElementById('studentTimeline').innerHTML = timelineHtml || '<p>Nenhuma atividade registrada.</p>';
    
    const scenariosHtml = scenarios.map(scenario => {
        const scenarioTotal = calculateScenarioTotal(scenario);
        const modulos = scenario.modulos || {};
        const modulosKeys = Object.keys(modulos);
        const dataMod = scenario.dataModificacao || scenario.dataCriacao;
        
        return `
            <div class="scenario-expander">
                <div class="scenario-summary" onclick="toggleScenarioDetails('${scenario.id}')">
                    <div class="scenario-info">
                        <span class="scenario-name">📁 ${scenario.nome || 'Cenário sem nome'}</span>
                        <span class="scenario-date">${formatDateShort(dataMod)}</span>
                    </div>
                    <div class="scenario-modules">
                        ${modulosKeys.map(m => `<span class="module-tag" style="background: ${moduleColors[m]}">${m.toUpperCase()}</span>`).join('')}
                    </div>
                    <div class="scenario-total">
                        Total: ${formatCurrency(scenarioTotal)}
                    </div>
                    <span class="expand-icon">▼</span>
                </div>
                <div id="scenario-${scenario.id}" class="scenario-details">
                    ${modulosKeys.map(modulo => renderModuleDetails(modulo, modulos[modulo])).join('')}
                </div>
            </div>
        `;
    }).join('');
    
    document.getElementById('studentScenariosList').innerHTML = scenariosHtml || '<p>Nenhum cenário salvo.</p>';
    
    setupDetailButtons(cpf);
    detailsSection.classList.remove('hidden');
    document.querySelector('.students-list').classList.add('hidden');
    currentView = 'details';
}

function calculateScenarioTotal(scenario) {
    const modulos = scenario.modulos || {};
    let total = 0;
    
    const valuesToSum = {
        iss: ['iss_devido'],
        icms: ['icms_liquido', 'icms_devido', 'debito_bruto'],
        ipi: ['ipi_devido'],
        pisCofins: ['total_liquido', 'pis_devido', 'cofins_devido'],
        irpj: ['irpjTotal', 'irpj-total', 'irpj_total'],
        csll: ['csllTotal', 'csll-total', 'csll_total']
    };
    
    Object.entries(modulos).forEach(([modulo, data]) => {
        const outputs = data.outputs || {};
        const keys = valuesToSum[modulo] || [];
        for (const key of keys) {
            const val = parseFloat(outputs[key]);
            if (!isNaN(val)) {
                total += val;
                break;
            }
        }
    });
    
    return total;
}

function renderModuleDetails(modulo, data) {
    const inputs = data.inputs || {};
    const outputs = data.outputs || {};
    
    const inputRows = Object.entries(inputs).slice(0, 5).map(([key, val]) => `
        <div class="detail-row">
            <span class="detail-label">${key}:</span>
            <span class="detail-value">${typeof val === 'number' ? formatCurrency(val) : val}</span>
        </div>
    `).join('');
    
    const outputRows = Object.entries(outputs).filter(([k]) => k !== 'timestamp').slice(0, 8).map(([key, val]) => {
        const isMonetary = key.includes('total') || key.includes('devido') || key.includes('liquido') || key.includes('bruto') || key.includes('base');
        return `
            <div class="detail-row">
                <span class="detail-label">${key}:</span>
                <span class="detail-value ${isMonetary ? 'monetary' : ''}">${isMonetary ? formatCurrency(val) : val}</span>
            </div>
        `;
    }).join('');
    
    return `
        <div class="module-detail" style="border-left: 3px solid ${moduleColors[modulo]}">
            <h5>${moduleLabels[modulo] || modulo.toUpperCase()}</h5>
            ${inputRows ? `<div class="detail-section"><strong>Inputs:</strong>${inputRows}</div>` : ''}
            ${outputRows ? `<div class="detail-section"><strong>Outputs:</strong>${outputRows}</div>` : ''}
            <div class="detail-timestamp">Última atualização: ${formatDate(data.timestamp)}</div>
        </div>
    `;
}

function buildTimeline(scenarios) {
    const events = [];
    
    scenarios.forEach(scenario => {
        if (scenario.dataCriacao) {
            events.push({
                date: scenario.dataCriacao,
                action: `Criou cenário "${scenario.nome || 'Sem nome'}"`
            });
        }
        
        if (scenario.modulos) {
            Object.entries(scenario.modulos).forEach(([modulo, data]) => {
                if (data.timestamp) {
                    events.push({
                        date: data.timestamp,
                        action: `Calculou ${(moduleLabels[modulo] || modulo).split(' - ')[0]}`
                    });
                }
            });
        }
    });
    
    return events.sort((a, b) => {
        const dateA = a.date?.toDate?.() || new Date(a.date);
        const dateB = b.date?.toDate?.() || new Date(b.date);
        return dateB - dateA;
    });
}

window.toggleScenarioDetails = function(scenarioId) {
    const details = document.getElementById(`scenario-${scenarioId}`);
    const summary = details.previousElementSibling;
    
    if (details.classList.contains('expanded')) {
        details.classList.remove('expanded');
        summary.querySelector('.expand-icon').textContent = '▼';
    } else {
        details.classList.add('expanded');
        summary.querySelector('.expand-icon').textContent = '▲';
    }
};

window.showStudentsList = function() {
    document.getElementById('studentDetails').classList.add('hidden');
    document.querySelector('.students-list').classList.remove('hidden');
    currentView = 'list';
};

function setupDetailButtons(cpf) {
    const deleteBtn = document.getElementById('deleteBtn');
    
    deleteBtn.onclick = async () => {
        if (!cpf) return;
        
        if (confirm('Tem certeza que deseja deletar este aluno? Todos os dados serão perdidos.')) {
            try {
                await deleteDoc(doc(db, 'alunos', cpf));
                alert('Aluno deletado com sucesso.');
                showStudentsList();
                await loadAllStudents();
            } catch (error) {
                console.error('Erro ao deletar:', error);
                alert('Erro ao deletar aluno: ' + error.message);
            }
        }
    };
}

function setupSearchAndFilters() {
    const searchInput = document.getElementById('searchStudent');
    const filterStatus = document.getElementById('filterStatus');
    const filterModule = document.getElementById('filterModule');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterStudents();
        });
    }
    
    if (filterStatus) {
        filterStatus.addEventListener('change', () => {
            filterStudents();
        });
    }
    
    if (filterModule) {
        filterModule.addEventListener('change', () => {
            filterStudents();
        });
    }
}

function filterStudents() {
    const search = document.getElementById('searchStudent')?.value?.toLowerCase() || '';
    const status = document.getElementById('filterStatus')?.value || 'all';
    const module = document.getElementById('filterModule')?.value || 'all';
    
    filteredStudents = allStudents.filter(student => {
        const matchSearch = !search || 
            student.nome.toLowerCase().includes(search) || 
            student.cpf.includes(search) ||
            student.cpfFormatado.includes(search);
        
        const matchStatus = status === 'all' || student.statusInfo.status === status;
        
        const matchModule = module === 'all' || student.modulosUsados.includes(module);
        
        return matchSearch && matchStatus && matchModule;
    });
    
    renderStudentsList();
}

window.exportStudentData = async function(cpf) {
    try {
        const docRef = doc(db, 'alunos', cpf);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            alert('Aluno não encontrado');
            return;
        }
        
        const studentData = docSnap.data();
        const scenariosSnapshot = await getDocs(collection(db, 'alunos', cpf, 'cenarios'));
        
        let csv = 'Aluno;CPF;Primeiro Acesso;Último Acesso\n';
        csv += `${studentData.nome || ''};${studentData.cpfFormatado || ''};${formatDate(studentData.dataAcesso)};${formatDate(studentData.ultimoAcesso)}\n\n`;
        
        csv += 'CENÁRIOS\n';
        csv += 'Nome;Data Criação;Módulos;Total Tributos\n';
        
        scenariosSnapshot.forEach(scenDoc => {
            const s = scenDoc.data();
            const modulos = s.modulos ? Object.keys(s.modulos).join(', ') : '';
            const total = calculateScenarioTotal(s);
            csv += `${s.nome || ''};${formatDate(s.dataCriacao)};${modulos};${total}\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `aluno_${cpf}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
    } catch (error) {
        console.error('Erro ao exportar:', error);
        alert('Erro ao exportar dados: ' + error.message);
    }
};

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

function showLoading(show) {
    const loading = document.getElementById('loadingIndicator');
    if (loading) {
        loading.classList.toggle('hidden', !show);
    }
}

window.exportAllStudents = function() {
    if (allStudents.length === 0) {
        alert('Nenhum aluno para exportar.');
        return;
    }
    
    let csv = 'NOME;CPF;STATUS;CENÁRIOS;MÓDULOS;PRIMEIRO ACESSO;ÚLTIMO ACESSO\n';
    
    allStudents.forEach(student => {
        csv += `${student.nome || ''};`;
        csv += `${student.cpfFormatado || ''};`;
        csv += `${student.statusInfo.label};`;
        csv += `${student.totalCenarios};`;
        csv += `${student.modulosUsados.join(', ')};`;
        csv += `${formatDate(student.primeiroAcesso)};`;
        csv += `${formatDate(student.ultimoAcesso)}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `todos_alunos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
};

document.addEventListener('DOMContentLoaded', initializeAdminPage);