import { loadModuleData } from './student.js';

const formatCurrency = (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return 'R$ 0,00';
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatNumber = (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return '0,00';
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const moduleConfig = {
    iss: {
        label: 'ISS',
        fullName: 'Imposto sobre Serviços',
        icon: '🏢',
        color: '#28a745',
        bgColor: 'rgba(40, 167, 69, 0.1)',
        borderColor: '#28a745'
    },
    icms: {
        label: 'ICMS',
        fullName: 'Imposto sobre Circulação de Mercadorias',
        icon: '🚚',
        color: '#17a2b8',
        bgColor: 'rgba(23, 162, 184, 0.1)',
        borderColor: '#17a2b8'
    },
    ipi: {
        label: 'IPI',
        fullName: 'Imposto sobre Produtos Industrializados',
        icon: '🏭',
        color: '#ffc107',
        bgColor: 'rgba(255, 193, 7, 0.1)',
        borderColor: '#ffc107'
    },
    pisCofins: {
        label: 'PIS/COFINS',
        fullName: 'Contribuições Federais',
        icon: '💰',
        color: '#dc3545',
        bgColor: 'rgba(220, 53, 69, 0.1)',
        borderColor: '#dc3545'
    },
    irpj: {
        label: 'IRPJ',
        fullName: 'Imposto de Renda Pessoa Jurídica',
        icon: '📊',
        color: '#6f42c1',
        bgColor: 'rgba(111, 66, 193, 0.1)',
        borderColor: '#6f42c1'
    },
    csll: {
        label: 'CSLL',
        fullName: 'Contribuição Social sobre o Lucro Líquido',
        icon: '📈',
        color: '#fd7e14',
        bgColor: 'rgba(253, 126, 20, 0.1)',
        borderColor: '#fd7e14'
    }
};

function formatKey(key) {
    const mappings = {
        'valor': 'Valor do Serviço',
        'valor_servico': 'Valor do Serviço',
        'municipio': 'Município',
        'aliquota': 'Alíquota',
        'aliquota_iss_percent': 'Alíquota ISS',
        'aliquota_percent': 'Alíquota',
        'iss_devido': 'ISS Devido',
        'cbs_teste_09': 'CBS (0,9%)',
        'ibs_teste_01': 'IBS (0,1%)',
        'total_retencao_1pct': 'Total Retenção (1%)',
        'baseCalculo': 'Base de Cálculo',
        'base_calculo': 'Base de Cálculo',
        'icms_devido': 'ICMS Próprio',
        'creditos': 'Créditos',
        'icms_liquido': 'ICMS Líquido',
        'debito_bruto': 'Débito Bruto',
        'base_st': 'Base ST',
        'icms_st_total': 'ICMS-ST Total',
        'icms_st_recolher': 'ICMS-ST a Recolher',
        'difal': 'DIFAL',
        'fcp': 'FCP',
        'saldo_credor': 'Saldo Credor',
        'total': 'Total',
        'operacaoTipo': 'Tipo de Operação',
        'estadoOrigem': 'Estado de Origem',
        'estadoDestino': 'Estado de Destino',
        'frete': 'Frete',
        'ipi': 'IPI',
        'outrasDespesas': 'Outras Despesas',
        'mva': 'MVA',
        'cest': 'CEST',
        'faturamento': 'Faturamento',
        'acrescimos': 'Acréscimos',
        'exclusoes': 'Exclusões',
        'aliquotaPIS': 'Alíquota PIS',
        'aliquotaCofins': 'Alíquota COFINS',
        'tipoTributacao': 'Tipo de Tributação',
        'cumulativo': 'Regime Cumulativo',
        'pis_devido': 'PIS Devido',
        'cofins_devido': 'COFINS Devido',
        'total_liquido': 'Total Líquido',
        'cbs_teste': 'CBS Teste',
        'ibs_teste': 'IBS Teste',
        'total_teste': 'Total Teste',
        'receita': 'Receita Bruta',
        'custos': 'Custos',
        'despesas': 'Despesas',
        'financ': 'Resultado Financeiro',
        'regime': 'Regime de Apuração',
        'adicoes': 'Adições',
        'compensacoes': 'Compensações',
        'irpjBasico': 'IRPJ Básico (15%)',
        'irpjAdicional': 'Adicional (10%)',
        'irpjTotal': 'Total IRPJ',
        'lucroContabil': 'Lucro Contábil',
        'irpj-total': 'Total IRPJ',
        'irpj-basico': 'IRPJ Básico',
        'irpj-adicional': 'IRPJ Adicional',
        'irpj-base': 'Base de Cálculo',
        'irpj-lucro': 'Lucro',
        'coeficiente': 'Coeficiente',
        'usarIRPJ': 'Usar base do IRPJ',
        'csllTotal': 'Total CSLL',
        'base_st': 'Base ST',
        'icms_st_total': 'ICMS-ST Total',
        'icms_st_recolher': 'ICMS-ST a Recolher',
        'pis_retencao': 'PIS Retido',
        'cofins_retencao': 'COFINS Retido',
        'aliquota_efetiva': 'Alíquota Efetiva'
    };

    if (mappings[key]) return mappings[key];
    
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
}

function isMonetaryField(key) {
    const monetaryKeys = [
        'total', 'tot', 'devido', 'liquido', 'bruto', 'base', 
        'credor', 'recolher', 'teste', 'receita', 'lucro', 
        'calculo', 'faturamento', 'acrescimos', 'exclusoes',
        'frete', 'ipi', 'despesas', 'custos', 'valor'
    ];
    return monetaryKeys.some(k => key.toLowerCase().includes(k));
}

function renderModuleCard(moduloNome, dados) {
    const config = moduleConfig[moduloNome];
    if (!config) return '';
    
    const hasData = dados && dados.inputs && Object.keys(dados.inputs).length > 0;
    const timestamp = dados?.outputs?.timestamp || dados?.inputs?.timestamp || null;
    
    let html = `
        <div class="tributo-card" style="--tributo-color: ${config.color}; --tributo-bg: ${config.bgColor};">
            <div class="tributo-header">
                <div class="tributo-icon">${config.icon}</div>
                <div class="tributo-title">
                    <h3>${config.label}</h3>
                    <span class="tributo-subtitle">${config.fullName}</span>
                </div>
                <div class="tributo-status ${hasData ? 'status-ok' : 'status-pending'}">
                    ${hasData ? '✓ Calculado' : '⏳ Pendente'}
                </div>
            </div>
    `;

    if (hasData) {
        const inputs = dados.inputs;
        const outputs = dados.outputs || {};
        
        const mainOutputKey = getMainOutputKey(moduloNome, outputs);
        const mainOutputValue = mainOutputKey ? outputs[mainOutputKey] : null;
        
        if (mainOutputValue) {
            html += `
                <div class="tributo-highlight">
                    <span class="highlight-label">Valor a Pagar</span>
                    <span class="highlight-value">${formatCurrency(mainOutputValue)}</span>
                </div>
            `;
        }

        html += `<div class="tributo-details">`;
        
        // Seção de Inputs
        const inputKeys = Object.keys(inputs).filter(k => 
            inputs[k] !== undefined && inputs[k] !== null && inputs[k] !== ''
        );
        
        if (inputKeys.length > 0) {
            html += `
                <div class="detail-section">
                    <div class="section-title">
                        <span class="section-icon">📥</span>
                        <span>Dados de Entrada</span>
                    </div>
                    <div class="detail-grid">
            `;
            
            inputKeys.forEach(key => {
                const formattedKey = formatKey(key);
                const value = inputs[key];
                const isMonetary = isMonetaryField(key);
                const formattedValue = isMonetary ? formatCurrency(value) : value;
                
                html += `
                    <div class="detail-item">
                        <span class="detail-key">${formattedKey}</span>
                        <span class="detail-value ${isMonetary ? 'monetary' : ''}">${formattedValue}</span>
                    </div>
                `;
            });
            
            html += `</div></div>`;
        }

        // Seção de Outputs (excluindo o principal que já foi mostrado)
        const outputKeys = Object.keys(outputs).filter(k => 
            outputs[k] !== undefined && outputs[k] !== null && 
            k !== 'timestamp' && k !== 'tipo_operacao' && k !== 'tipo_tributacao' &&
            k !== 'cumulativo' && k !== 'is_interestadual' &&
            k !== mainOutputKey
        );
        
        if (outputKeys.length > 0) {
            html += `
                <div class="detail-section">
                    <div class="section-title">
                        <span class="section-icon">📤</span>
                        <span>Resultados Detalhados</span>
                    </div>
                    <div class="detail-grid">
            `;
            
            outputKeys.forEach(key => {
                const formattedKey = formatKey(key);
                const value = outputs[key];
                const isMonetary = isMonetaryField(key);
                
                let formattedValue;
                if (isMonetary) {
                    formattedValue = formatCurrency(value);
                } else if (typeof value === 'number') {
                    formattedValue = formatNumber(value);
                } else {
                    formattedValue = String(value);
                }
                
                html += `
                    <div class="detail-item">
                        <span class="detail-key">${formattedKey}</span>
                        <span class="detail-value ${isMonetary ? 'monetary' : ''}">${formattedValue}</span>
                    </div>
                `;
            });
            
            html += `</div></div>`;
        }

        html += `
            <div class="tributo-timestamp">
                Última atualização: ${formatDate(timestamp)}
            </div>
        </div>`;
    } else {
        html += `
            <div class="tributo-empty">
                <p>Nenhum cálculo realizado ainda.</p>
                <p class="tributo-hint">Preencha os dados no módulo e clique em "Salvar no Cenário"</p>
            </div>
        `;
    }

    html += `</div>`;
    return html;
}

function getMainOutputKey(moduloNome, outputs) {
    const keys = {
        iss: 'iss_devido',
        icms: 'icms_liquido',
        ipi: 'ipi_devido',
        pisCofins: 'total_liquido',
        irpj: 'irpjTotal',
        csll: 'csllTotal'
    };
    
    const key = keys[moduloNome];
    return key && outputs[key] ? key : null;
}

async function renderizarCalculosPorCenario(idCenario) {
    const container = document.getElementById('calculos-content');
    const resumo = document.getElementById('calculos-resumo');
    
    if (!idCenario) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <h3>Nenhum cenário selecionado</h3>
                <p>Selecione um cenário acima para visualizar os cálculos detalhados.</p>
            </div>
        `;
        if (resumo) resumo.style.display = 'none';
        return;
    }

    try {
        const [iss, icms, ipi, pisCofins, irpj, csll] = await Promise.all([
            loadModuleData('iss'),
            loadModuleData('icms'),
            loadModuleData('ipi'),
            loadModuleData('pisCofins'),
            loadModuleData('irpj'),
            loadModuleData('csll')
        ]);

        const modulos = [
            { nome: 'iss', dados: iss },
            { nome: 'icms', dados: icms },
            { nome: 'ipi', dados: ipi },
            { nome: 'pisCofins', dados: pisCofins },
            { nome: 'irpj', dados: irpj },
            { nome: 'csll', dados: csll }
        ];

        const temAlgumDado = modulos.some(m => m.dados && m.dados.inputs && Object.keys(m.dados.inputs).length > 0);

        if (!temAlgumDado) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🧮</div>
                    <h3>Nenhum cálculo realizado</h3>
                    <p>Volte aos módulos de cálculo, insira os dados e salve no cenário.</p>
                </div>
            `;
            if (resumo) resumo.style.display = 'none';
            return;
        }

        let html = '';
        modulos.forEach(modulo => {
            html += renderModuleCard(modulo.nome, modulo.dados);
        });

        container.innerHTML = html;
        atualizarResumo(modulos);

    } catch (error) {
        console.error('Erro ao carregar cálculos:', error);
        container.innerHTML = `
            <div class="error-state">
                <div class="empty-icon">❌</div>
                <h3>Erro ao carregar cálculos</h3>
                <p>Tente novamente em alguns instantes.</p>
            </div>
        `;
    }
}

function atualizarResumo(modulos) {
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

    const config = moduleConfig;
    
    const getIcon = (nome) => config[nome]?.icon || '💵';
    const getColor = (nome) => config[nome]?.color || '#666';

    document.getElementById('resumo-iss').innerHTML = `<span style="color: ${getColor('iss')}">${getIcon('iss')} ${formatCurrency(totals.iss)}</span>`;
    document.getElementById('resumo-icms').innerHTML = `<span style="color: ${getColor('icms')}">${getIcon('icms')} ${formatCurrency(totals.icms)}</span>`;
    document.getElementById('resumo-ipi').innerHTML = `<span style="color: ${getColor('ipi')}">${getIcon('ipi')} ${formatCurrency(totals.ipi)}</span>`;
    document.getElementById('resumo-pis').innerHTML = `<span style="color: ${getColor('pisCofins')}">${getIcon('pisCofins')} ${formatCurrency(totals.pis)}</span>`;
    document.getElementById('resumo-irpj').innerHTML = `<span style="color: ${getColor('irpj')}">${getIcon('irpj')} ${formatCurrency(totals.irpj)}</span>`;
    document.getElementById('resumo-csll').innerHTML = `<span style="color: ${getColor('csll')}">${getIcon('csll')} ${formatCurrency(totals.csll)}</span>`;

    const totalGeral = Object.values(totals).reduce((a, b) => a + b, 0);
    document.getElementById('resumo-total').textContent = formatCurrency(totalGeral);

    if (document.getElementById('calculos-resumo')) {
        document.getElementById('calculos-resumo').style.display = 'block';
    }
}

function sincronizarDropdownCenarios() {
    const globalSelect = document.getElementById('globalScenarioSelect');
    const localSelect = document.getElementById('calculos-scenario-select');
    
    if (!globalSelect || !localSelect) return;

    localSelect.innerHTML = globalSelect.innerHTML;
    localSelect.value = globalSelect.value;
}

function initializeCalculossModule() {
    const localSelect = document.getElementById('calculos-scenario-select');
    const exportBtn = document.getElementById('btn-exportar-calculos');

    sincronizarDropdownCenarios();

    if (localSelect) {
        localSelect.addEventListener('change', (e) => {
            const selectedId = e.target.value;
            if (selectedId) {
                sessionStorage.setItem('cenarioAtivo', selectedId);
                window.dispatchEvent(new CustomEvent('scenarioChanged', { detail: { scenarioId: selectedId } }));
            }
            renderizarCalculosPorCenario(selectedId);
        });
    }

    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            window.print();
        });
    }

    window.addEventListener('scenarioChanged', () => {
        sincronizarDropdownCenarios();
        const activeScenario = sessionStorage.getItem('cenarioAtivo');
        renderizarCalculosPorCenario(activeScenario);
    });

    document.addEventListener('moduleSwitched', (e) => {
        if (e.detail.module === 'calculos') {
            sincronizarDropdownCenarios();
            const activeScenario = sessionStorage.getItem('cenarioAtivo');
            if (localSelect) localSelect.value = activeScenario || '';
            renderizarCalculosPorCenario(activeScenario);
        }
    });

    const currentScenario = sessionStorage.getItem('cenarioAtivo');
    if (currentScenario) {
        if (localSelect) localSelect.value = currentScenario;
        renderizarCalculosPorCenario(currentScenario);
    }
}

document.addEventListener('DOMContentLoaded', initializeCalculossModule);

export { renderizarCalculosPorCenario };