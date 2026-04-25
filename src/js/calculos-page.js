import { loadModuleData } from './student.js';
import { db } from './firebase-config.js';
import { collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const moduleConfig = {
    iss: { label: 'ISS', fullName: 'Imposto sobre Serviços', icon: '🏢', color: '#28a745' },
    icms: { label: 'ICMS', fullName: 'Imposto sobre Circulação de Mercadorias', icon: '🚚', color: '#17a2b8' },
    ipi: { label: 'IPI', fullName: 'Imposto sobre Produtos Industrializados', icon: '🏭', color: '#ffc107' },
    pisCofins: { label: 'PIS/COFINS', fullName: 'Contribuições Federais', icon: '💰', color: '#dc3545' },
    irpj: { label: 'IRPJ', fullName: 'Imposto de Renda Pessoa Jurídica', icon: '📊', color: '#6f42c1' },
    csll: { label: 'CSLL', fullName: 'Contribuição Social sobre Lucro Líquido', icon: '📈', color: '#fd7e14' }
};

const formatBRL = (value) => {
    if (!value && value !== 0) return 'R$ 0,00';
    const num = parseFloat(value);
    if (isNaN(num)) return 'R$ 0,00';
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const fieldLabels = {
    valor: 'Valor do Serviço', valor_servico: 'Valor do Serviço', municipio: 'Município',
    aliquota: 'Alíquota (%)', aliquota_iss_percent: 'Alíquota ISS', iss_devido: 'ISS Devido',
    cbs_teste_09: 'CBS (0,9%)', ibs_teste_01: 'IBS (0,1%)', total_retencao_1pct: 'Total Retenção (1%)',
    baseCalculo: 'Base de Cálculo', base_calculo: 'Base de Cálculo', icms_devido: 'ICMS Próprio',
    creditos: 'Créditos', icms_liquido: 'ICMS Líquido', debito_bruto: 'Débito Bruto',
    base_st: 'Base ST', icms_st_total: 'ICMS-ST Total', icms_st_recolher: 'ICMS-ST a Recolher',
    difal: 'DIFAL', fcp: 'FCP', saldo_credor: 'Saldo Credor', total: 'Total',
    operacaoTipo: 'Tipo de Operação', estadoOrigem: 'Estado de Origem', estadoDestino: 'Estado de Destino',
    frete: 'Frete', ipi: 'IPI', outrasDespesas: 'Outras Despesas', mva: 'MVA (%)', cest: 'CEST',
    faturamento: 'Faturamento', acrescimos: 'Acréscimos', exclusoes: 'Exclusões',
    aliquotaPIS: 'Alíquota PIS', aliquotaCofins: 'Alíquota COFINS', tipoTributacao: 'Tipo de Tributação',
    cumulativo: 'Regime Cumulativo', pis_devido: 'PIS Devido', cofins_devido: 'COFINS Devido',
    total_liquido: 'Total Líquido', cbs_teste: 'CBS Teste', ibs_teste: 'IBS Teste',
    total_teste: 'Total Teste', receita: 'Receita Bruta', custos: 'Custos', despesas: 'Despesas',
    financ: 'Resultado Financeiro', regime: 'Regime de Apuração', adicoes: 'Adições',
    compensacoes: 'Compensações', irpjBasico: 'IRPJ Básico (15%)', irpjAdicional: 'Adicional (10%)',
    irpjTotal: 'Total IRPJ', lucroContabil: 'Lucro Contábil', irpj_total: 'Total IRPJ',
    irpj_basico: 'IRPJ Básico', irpj_adicional: 'IRPJ Adicional', irpj_base: 'Base de Cálculo',
    irpj_lucro: 'Lucro', coeficiente: 'Coeficiente', usarIRPJ: 'Usar base do IRPJ',
    csllTotal: 'Total CSLL', ipi_devido: 'IPI Devido'
};

const isMonetaryField = (key) => {
    const monetaryKeys = ['total', 'devido', 'liquido', 'bruto', 'base', 'credor', 'recolher', 'teste', 'receita', 'lucro', 'calculo', 'faturamento', 'acrescimos', 'exclusoes', 'frete', 'ipi', 'despesas', 'custos', 'valor'];
    return monetaryKeys.some(k => key.toLowerCase().includes(k));
};

const formatFieldName = (key) => {
    if (fieldLabels[key]) return fieldLabels[key];
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
};

async function loadUserData() {
    const cpf = sessionStorage.getItem('userCPF');
    if (!cpf) return;
    try {
        const docRef = doc(db, 'alunos', cpf);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            const userNameEl = document.getElementById('userName');
            const userCPFEl = document.getElementById('userCPF');
            if (userNameEl) userNameEl.textContent = data.nome || '';
            if (userCPFEl) userCPFEl.textContent = cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        }
    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
    }
}

async function loadAllScenarios() {
    const cpf = sessionStorage.getItem('userCPF');
    if (!cpf) return [];
    try {
        const querySnapshot = await getDocs(collection(db, 'alunos', cpf, 'cenarios'));
        const scenarios = [];
        querySnapshot.forEach(doc => {
            scenarios.push({ id: doc.id, ...doc.data() });
        });
        return scenarios;
    } catch (error) {
        console.error('Erro ao carregar cenários:', error);
        return [];
    }
}

function renderModuleCard(moduloNome, dados) {
    const config = moduleConfig[moduloNome];
    if (!config) return '';
    
    const hasData = dados && dados.inputs && Object.keys(dados.inputs).length > 0;
    const timestamp = dados?.outputs?.timestamp || dados?.inputs?.timestamp;
    
    let mainValue = 0;
    let mainLabel = 'Total';
    
    const valorKeys = {
        iss: ['iss_devido'], icms: ['icms_liquido', 'icms_st_recolher'], ipi: ['ipi_devido'],
        pisCofins: ['total_liquido'], irpj: ['irpjTotal'], csll: ['csllTotal']
    };
    
    const keys = valorKeys[moduloNome] || [];
    if (dados?.outputs) {
        for (const key of keys) {
            const val = parseFloat(dados.outputs[key]);
            if (!isNaN(val)) { mainValue = val; break; }
        }
    }
    
    mainLabel = { iss: 'ISS Devido', icms: 'ICMS Total', ipi: 'IPI Devido', pisCofins: 'Total PIS/COFINS', irpj: 'Total IRPJ', csll: 'Total CSLL' }[moduloNome] || 'Total';
    
    let html = `
        <div class="modulo-card" data-modulo="${moduloNome}">
            <div class="modulo-header">
                <div class="modulo-icon">${config.icon}</div>
                <div class="modulo-title">
                    <h3>${config.label}</h3>
                    <span>${config.fullName}</span>
                </div>
                <div class="modulo-status ${hasData ? 'calculado' : 'pendente'}">
                    ${hasData ? '✓ Calculado' : '⏳ Pendente'}
                </div>
            </div>
    `;
    
    if (hasData) {
        const inputs = dados.inputs;
        const outputs = dados.outputs || {};
        
        html += `<div class="modulo-body">
            <div class="modulo-destaque">
                <span class="destaque-label">${mainLabel}</span>
                <div class="destaque-valor">${formatBRL(mainValue)}</div>
            </div>`;
        
        const inputKeys = Object.keys(inputs).filter(k => inputs[k] !== undefined && inputs[k] !== null && inputs[k] !== '');
        if (inputKeys.length > 0) {
            html += `<div class="detalhes-section">
                <div class="section-header"><span class="section-icon">📥</span><span>Dados de Entrada</span></div>
                <div class="detalhes-grid">`;
            inputKeys.forEach(key => {
                const formattedKey = formatFieldName(key);
                const value = inputs[key];
                const isMonetary = isMonetaryField(key);
                const formattedValue = isMonetary ? formatBRL(value) : value;
                html += `<div class="detalhe-item"><span class="detalhe-key">${formattedKey}</span><span class="detalhe-value ${isMonetary ? 'monetario' : ''}">${formattedValue}</span></div>`;
            });
            html += `</div></div>`;
        }
        
        const outputKeys = Object.keys(outputs).filter(k => outputs[k] !== undefined && outputs[k] !== null && k !== 'timestamp' && k !== 'tipo_operacao' && k !== 'tipo_tributacao' && k !== 'cumulativo' && k !== 'is_interestadual');
        if (outputKeys.length > 0) {
            html += `<div class="detalhes-section">
                <div class="section-header"><span class="section-icon">📤</span><span>Resultados Detalhados</span></div>
                <div class="detalhes-grid">`;
            outputKeys.forEach(key => {
                const formattedKey = formatFieldName(key);
                const value = outputs[key];
                const isMonetary = isMonetaryField(key);
                let formattedValue = isMonetary ? formatBRL(value) : (typeof value === 'number' ? value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : String(value));
                html += `<div class="detalhe-item"><span class="detalhe-key">${formattedKey}</span><span class="detalhe-value ${isMonetary ? 'monetario' : ''}">${formattedValue}</span></div>`;
            });
            html += `</div></div>`;
        }
        
        html += `</div><div class="modulo-timestamp">Última atualização: ${formatDate(timestamp)}</div>`;
    } else {
        html += `<div class="modulo-body" style="text-align: center; padding: 40px 20px; color: #666;"><p style="margin: 0; font-size: 14px;">Nenhum cálculo realizado ainda.</p><p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.7;">Preencha os dados no módulo e clique em "Salvar no Cenário"</p></div>`;
    }
    
    html += `</div>`;
    return html;
}

function updateResumo(modulos) {
    const getValue = (outputs, keys) => {
        if (!outputs) return 0;
        for (const key of keys) {
            const val = parseFloat(outputs[key]);
            if (!isNaN(val)) return val;
        }
        return 0;
    };
    
    const totals = {
        iss: getValue(modulos[0]?.dados?.outputs, ['iss_devido', 'total']),
        icms: getValue(modulos[1]?.dados?.outputs, ['icms_liquido', 'icmsTotal', 'debito_bruto', 'icms_st_recolher']),
        ipi: getValue(modulos[2]?.dados?.outputs, ['ipi_devido', 'total']),
        pis: getValue(modulos[3]?.dados?.outputs, ['total_liquido', 'totalPisCofins']),
        irpj: getValue(modulos[4]?.dados?.outputs, ['irpjTotal', 'irpj-total']),
        csll: getValue(modulos[5]?.dados?.outputs, ['csllTotal', 'csll-total'])
    };
    
    document.getElementById('resumoISS').textContent = formatBRL(totals.iss);
    document.getElementById('resumoICMS').textContent = formatBRL(totals.icms);
    document.getElementById('resumoIPI').textContent = formatBRL(totals.ipi);
    document.getElementById('resumoPIS').textContent = formatBRL(totals.pis);
    document.getElementById('resumoIRPJ').textContent = formatBRL(totals.irpj);
    document.getElementById('resumoCSLL').textContent = formatBRL(totals.csll);
    
    const totalGeral = Object.values(totals).reduce((a, b) => a + b, 0);
    document.getElementById('resumoTotal').textContent = formatBRL(totalGeral);
    
    document.getElementById('calculosResumo').style.display = 'block';
}

async function renderCalculos(cenarioId) {
    const loadingEl = document.getElementById('loadingCalculos');
    const contentEl = document.getElementById('calculosContent');
    const emptyEl = document.getElementById('emptyState');
    const resumoEl = document.getElementById('calculosResumo');
    
    if (!cenarioId) {
        loadingEl.style.display = 'none';
        contentEl.style.display = 'none';
        resumoEl.style.display = 'none';
        emptyEl.style.display = 'block';
        return;
    }
    
    loadingEl.style.display = 'block';
    contentEl.style.display = 'none';
    resumoEl.style.display = 'none';
    emptyEl.style.display = 'none';
    
    try {
        const [iss, icms, ipi, pisCofins, irpj, csll] = await Promise.all([
            loadModuleData('iss'), loadModuleData('icms'), loadModuleData('ipi'),
            loadModuleData('pisCofins'), loadModuleData('irpj'), loadModuleData('csll')
        ]);
        
        const modulos = [
            { nome: 'iss', dados: iss }, { nome: 'icms', dados: icms },
            { nome: 'ipi', dados: ipi }, { nome: 'pisCofins', dados: pisCofins },
            { nome: 'irpj', dados: irpj }, { nome: 'csll', dados: csll }
        ];
        
        const temAlgumDado = modulos.some(m => m.dados && m.dados.inputs && Object.keys(m.dados.inputs).length > 0);
        
        if (!temAlgumDado) {
            loadingEl.style.display = 'none';
            contentEl.style.display = 'none';
            resumoEl.style.display = 'none';
            emptyEl.style.display = 'block';
            return;
        }
        
        let html = '';
        modulos.forEach(modulo => { html += renderModuleCard(modulo.nome, modulo.dados); });
        
        contentEl.innerHTML = html;
        updateResumo(modulos);
        
        loadingEl.style.display = 'none';
        contentEl.style.display = 'grid';
        
    } catch (error) {
        console.error('Erro ao carregar cálculos:', error);
        loadingEl.innerHTML = `<div style="color: #dc3545;"><h3>❌ Erro ao carregar cálculos</h3><p>Tente novamente em alguns instantes.</p></div>`;
    }
}

async function populateScenarioSelect() {
    const select = document.getElementById('calculosScenarioSelect');
    const scenarios = await loadAllScenarios();
    
    select.innerHTML = '<option value="">Selecione um cenário...</option>';
    scenarios.forEach(scenario => {
        const option = document.createElement('option');
        option.value = scenario.id;
        option.textContent = scenario.nome || `Cenário ${scenario.id.substring(0, 8)}`;
        select.appendChild(option);
    });
}

function exportarPDF() {
    window.print();
}

document.addEventListener('DOMContentLoaded', async () => {
    const cpf = sessionStorage.getItem('userCPF');
    if (!cpf) { window.location.href = 'index.html'; return; }
    
    await loadUserData();
    
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn?.addEventListener('click', () => {
        sessionStorage.removeItem('userCPF');
        sessionStorage.removeItem('cenarioAtivo');
        window.location.href = 'index.html';
    });
    
    await populateScenarioSelect();
    
    const globalSelect = document.getElementById('globalScenarioSelect');
    const localSelect = document.getElementById('calculosScenarioSelect');
    
    if (globalSelect && localSelect) {
        const scenarios = await loadAllScenarios();
        globalSelect.innerHTML = '<option value="">Selecione um cenário...</option>';
        scenarios.forEach(scenario => {
            const opt = document.createElement('option');
            opt.value = scenario.id;
            opt.textContent = scenario.nome || `Cenário ${scenario.id.substring(0, 8)}`;
            globalSelect.appendChild(opt);
        });
        
        const activeScenario = sessionStorage.getItem('cenarioAtivo');
        if (activeScenario) {
            globalSelect.value = activeScenario;
            localSelect.value = activeScenario;
        }
        
        globalSelect.addEventListener('change', (e) => {
            localSelect.value = e.target.value;
            sessionStorage.setItem('cenarioAtivo', e.target.value);
            renderCalculos(e.target.value);
        });
        
        localSelect.addEventListener('change', (e) => {
            globalSelect.value = e.target.value;
            sessionStorage.setItem('cenarioAtivo', e.target.value);
            renderCalculos(e.target.value);
        });
    }
    
    const activeScenario = sessionStorage.getItem('cenarioAtivo');
    if (activeScenario) {
        await renderCalculos(activeScenario);
    }
    
    window.addEventListener('scenarioChanged', async (e) => {
        const scenarioId = e.detail?.scenarioId || sessionStorage.getItem('cenarioAtivo');
        if (localSelect) localSelect.value = scenarioId;
        if (globalSelect) globalSelect.value = scenarioId;
        await renderCalculos(scenarioId);
    });
});