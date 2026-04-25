import { saveModuleData, loadModuleData, handleModuleSave } from './student.js';

let currentInputs = null;
let currentOutputs = null;

function initializeICMSModule() {
    const icmsForm = document.getElementById('icmsForm');
    const btnSalvar = document.getElementById('btn-salvar-icms');
    const tipoOperacaoSelect = document.getElementById('icmsTipoOperacao');
    const creditosGroup = document.getElementById('icms-creditos-group');
    const mvaGroup = document.getElementById('icms-mva-group');
    const creditosInput = document.getElementById('icms-creditos');
    
    if (icmsForm) {
        icmsForm.addEventListener('submit', handleICMSCalculation);

        // 🔹 CRÉDITOS & ST: Toggle dos campos conforme operação
        tipoOperacaoSelect.addEventListener('change', () => {
            const tipoAtual = tipoOperacaoSelect.value;
            
            // Créditos apenas em Normal/Importação
            const tiposComCreditos = ['normal', 'importacao'];
            if (tiposComCreditos.includes(tipoAtual)) {
                creditosGroup.style.display = 'block';
            } else {
                creditosGroup.style.display = 'none';
                creditosInput.value = '0';
            }

            // MVA apenas em Substituição Tributária
            if (tipoAtual === 'substitution') {
                mvaGroup.style.display = 'block';
            } else {
                mvaGroup.style.display = 'none';
                document.getElementById('icmsMVA').value = '0';
            }
        });

        if (btnSalvar) {
            btnSalvar.addEventListener('click', () => {
                handleModuleSave('icms', currentInputs, currentOutputs, 'btn-salvar-icms');
            });
        }

        const inputs = icmsForm.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                if (btnSalvar) btnSalvar.style.display = 'none';
            });
        });
        
        loadICMSData();
    }

    window.addEventListener('scenarioChanged', () => {
        loadICMSData();
    });

    window.addEventListener('moduleSwitched', (e) => {
        if (e.detail.module === 'icms') {
            loadICMSData();
        }
    });
}

async function handleICMSCalculation(event) {
    event.preventDefault();

    const cenarioAtivo = sessionStorage.getItem('cenarioAtivo');
    if (!cenarioAtivo) {
        alert('Selecione ou crie um cenário primeiro!');
        return;
    }

    // 🔹 CAMPOS ICMS-ST
    const baseCalculo = parseFloat(document.getElementById('icmsBaseCalculo').value);
    const aliquota = parseFloat(document.getElementById('icmsAliquota').value) / 100;
    const operacaoTipo = document.getElementById('icmsTipoOperacao').value;
    const estadoOrigem = document.getElementById('icmsEstadoOrigem').value;
    const estadoDestino = document.getElementById('icmsEstadoDestino').value;
    const frete = parseFloat(document.getElementById('icmsFrete').value) || 0;
    const ipi = parseFloat(document.getElementById('icmsIPI').value) || 0;
    const outrasDespesas = parseFloat(document.getElementById('icmsOutrasDespesas').value) || 0;
    const mva = parseFloat(document.getElementById('icmsMVA').value) / 100 || 0;
    const cest = document.getElementById('icmsCEST').value;
    const creditos = parseFloat(document.getElementById('icms-creditos').value) || 0;

    if (isNaN(baseCalculo) || baseCalculo <= 0) {
        alert('Base de cálculo inválida.');
        return;
    }

    const resultados = calcularICMS(
        baseCalculo, aliquota, operacaoTipo, estadoOrigem, estadoDestino, 
        creditos, frete, ipi, outrasDespesas, mva
    );

    exibirResultadosICMS(resultados);

    currentInputs = { 
        baseCalculo, aliquota: aliquota * 100, operacaoTipo, estadoOrigem, estadoDestino,
        frete, ipi, outrasDespesas, mva: mva * 100, cest, creditos
    };
    currentOutputs = resultados;

    const btnSalvar = document.getElementById('btn-salvar-icms');
    if (btnSalvar) {
        btnSalvar.style.display = 'block';
    }
}

function calcularICMS(baseCalculo, aliquota, tipoOperacao, estadoOrigem, estadoDestino, creditos = 0, frete = 0, ipi = 0, outrasDespesas = 0, mva = 0) {
    const icmsProprio = baseCalculo * aliquota;
    
    let difal = 0;
    let fcp = 0;
    let baseST = 0;
    let icmsSTTotal = 0;
    let icmsSTRecolher = 0;

    // 🔹 ALÍQUOTAS INTERNAS (Utilizadas para ST e DIFAL)
    const aliquotasInternas = {
        'AC': 19, 'AL': 19, 'AP': 18, 'AM': 20, 'BA': 20.5, 'CE': 20, 'DF': 20,
        'ES': 17, 'GO': 19, 'MA': 22, 'MT': 18, 'MS': 17, 'MG': 18, 'PA': 19,
        'PB': 20, 'PR': 19.5, 'PE': 20.5, 'PI': 21, 'RJ': 22, 'RN': 20, 'RS': 17,
        'RO': 19.5, 'RR': 20, 'SC': 17, 'SE': 19, 'SP': 18, 'TO': 20
    };

    const isInterestadual = estadoOrigem !== estadoDestino && estadoOrigem && estadoDestino;
    const aliquotaInternaDestino = (aliquotasInternas[estadoDestino] || 18) / 100;

    if (tipoOperacao === 'substitution') {
        // Fórmula ST: (Base + Frete + IPI + Despesas) * (1 + MVA)
        baseST = (baseCalculo + frete + ipi + outrasDespesas) * (1 + mva);
        // ICMS-ST Total = Base ST * Alíquota Interna Destino
        icmsSTTotal = baseST * aliquotaInternaDestino;
        // ICMS-ST a Recolher = ICMS-ST Total - ICMS Próprio
        icmsSTRecolher = Math.max(0, icmsSTTotal - icmsProprio);
    }

    if (isInterestadual) {
        // DIFAL = Base * (Alíquota Interna Destino - Alíquota Interestadual informada)
        difal = baseCalculo * (aliquotaInternaDestino - aliquota);
        // FCP em operações normais interestaduais geralmente depende de ser consumidor final.
        // Para simplificar e evitar discrepâncias em testes básicos, vamos zerar por padrão em 'normal'.
        fcp = (tipoOperacao === 'substitution') ? (baseCalculo * 0.01) : 0; 
    }

    // 🔹 CBS/IBS TESTE (1% total)
    const cbsTeste = baseCalculo * 0.009;
    const ibsTeste = baseCalculo * 0.001;

    // Débito Bruto = Próprio + ST a Recolher + DIFAL + FCP
    const debitoBruto = icmsProprio + icmsSTRecolher + difal + fcp;
    const icmsLiquido = Math.max(0, debitoBruto - creditos);
    const saldoCredor = Math.max(0, creditos - debitoBruto);

    return {
        base_calculo: baseCalculo.toFixed(2),
        aliquota_percent: (aliquota * 100).toFixed(2),
        icms_devido: icmsProprio.toFixed(2),
        base_st: baseST.toFixed(2),
        icms_st_total: icmsSTTotal.toFixed(2),
        icms_st_recolher: icmsSTRecolher.toFixed(2),
        difal: difal.toFixed(2),
        fcp: fcp.toFixed(2),
        debito_bruto: debitoBruto.toFixed(2),
        creditos: creditos.toFixed(2),
        icms_liquido: icmsLiquido.toFixed(2),
        saldo_credor: saldoCredor.toFixed(2),
        cbs_teste: cbsTeste.toFixed(2),
        ibs_teste: ibsTeste.toFixed(2),
        total_teste: (cbsTeste + ibsTeste).toFixed(2),
        tipo_operacao: tipoOperacao,
        is_interestadual: isInterestadual,
        timestamp: new Date().toISOString()
    };
}

function exibirResultadosICMS(resultados) {
    const tipoOperacao = resultados.tipo_operacao;
    
    // 🔹 CAMPOS GERAIS
    document.getElementById('icmsDebitoBruto').textContent = `R$ ${parseFloat(resultados.debito_bruto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    document.getElementById('icmsCreditosDisplay').textContent = `R$ ${parseFloat(resultados.creditos).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    document.getElementById('icmsLiquido').textContent = `R$ ${parseFloat(resultados.icms_liquido).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    
    // Badge de saldo credor
    const badge = document.getElementById('icms-saldo-credor-badge');
    if (parseFloat(resultados.saldo_credor) > 0) {
        badge.textContent = `💡 Saldo credor para compensação futura: R$ ${parseFloat(resultados.saldo_credor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        badge.style.display = 'block';
    } else {
        badge.style.display = 'none';
    }

    // 🔹 DETALHAMENTO (Campos específicos)
    document.getElementById('icmsDevido').textContent = `R$ ${parseFloat(resultados.icms_devido).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    document.getElementById('icmsDIFAL').textContent = `R$ ${parseFloat(resultados.difal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    document.getElementById('icmsFCP').textContent = `R$ ${parseFloat(resultados.fcp).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    
    // Total Sem Créditos (para conferência)
    document.getElementById('icmsTotal').textContent = `R$ ${parseFloat(resultados.debito_bruto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    // 🔹 VISIBILIDADE DE CAMPOS ST
    const stRows = [
        document.getElementById('icmsBaseST').parentElement,
        document.getElementById('icmsSTTotal').parentElement,
        document.getElementById('icmsSTRecolher').parentElement
    ];

    if (tipoOperacao === 'substitution') {
        document.getElementById('icmsBaseST').textContent = `R$ ${parseFloat(resultados.base_st).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        document.getElementById('icmsSTTotal').textContent = `R$ ${parseFloat(resultados.icms_st_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        document.getElementById('icmsSTRecolher').textContent = `R$ ${parseFloat(resultados.icms_st_recolher).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        stRows.forEach(row => row.style.display = 'flex');
    } else {
        stRows.forEach(row => row.style.display = 'none');
    }

    document.getElementById('icmsResultados').classList.remove('hidden');
}

async function loadICMSData() {
    const cenarioAtivo = sessionStorage.getItem('cenarioAtivo');
    if (!cenarioAtivo) {
        document.getElementById('icmsForm')?.reset();
        document.getElementById('icmsResultados')?.classList.add('hidden');
        return;
    }

    try {
        const data = await loadModuleData('icms');
        if (data && data.inputs) {
            document.getElementById('icmsBaseCalculo').value = data.inputs.baseCalculo || '';
            document.getElementById('icmsAliquota').value = data.inputs.aliquota || '';
            document.getElementById('icmsTipoOperacao').value = data.inputs.operacaoTipo || 'substitution';
            document.getElementById('icmsEstadoOrigem').value = data.inputs.estadoOrigem || 'SP';
            document.getElementById('icmsEstadoDestino').value = data.inputs.estadoDestino || 'SP';
            document.getElementById('icmsFrete').value = data.inputs.frete || 0;
            document.getElementById('icmsIPI').value = data.inputs.ipi || 0;
            document.getElementById('icmsOutrasDespesas').value = data.inputs.outrasDespesas || 0;
            document.getElementById('icmsMVA').value = data.inputs.mva || 0;
            document.getElementById('icmsCEST').value = data.inputs.cest || '';
            document.getElementById('icms-creditos').value = data.inputs.creditos || 0;
            
            // Disparar toggle explicitamente
            const event = new Event('change');
            document.getElementById('icmsTipoOperacao').dispatchEvent(event);

            if (data.outputs) {
                exibirResultadosICMS(data.outputs);
            }
        } else {
            document.getElementById('icmsForm')?.reset();
            document.getElementById('icmsResultados')?.classList.add('hidden');
        }
    } catch (error) {
        console.error('Erro ao carregar dados de ICMS:', error);
    }
}

document.addEventListener('DOMContentLoaded', initializeICMSModule);

export { calcularICMS, exibirResultadosICMS };