import { saveModuleData, loadModuleData, handleModuleSave } from './student.js';

const ALIQUOTA_PIS_TESTE = 0.0065;
const ALIQUOTA_COFINS_TESTE = 0.058;
const ALIQUOTA_CBS_TESTE = 0.009;
const ALIQUOTA_IBS_TESTE = 0.001;

// 🔹 ALTERAÇÃO FLUXO SALVAR→DASHBOARD: Variáveis para controle do estado atual
let currentInputs = null;
let currentOutputs = null;

function initializePISCofinsModule() {
    const pisForm = document.getElementById('pisCofinsForm');
    const tipoTributacaoSelect = document.getElementById('pisTipoTributacao');
    const creditosGroup = document.getElementById('pis-cofins-creditos-group');
    const creditosInput = document.getElementById('pis-cofins-creditos');
    const cumulativoCheckbox = document.getElementById('pisCumulativo');
    const btnSalvar = document.getElementById('btn-salvar-pis-cofins');
    
    if (pisForm) {
        pisForm.addEventListener('submit', handlePISCofinsCalculation);
        
        // 🔹 ALTERAÇÃO: Comportamento dinâmico para exibir/esconder créditos
        tipoTributacaoSelect.addEventListener('change', () => {
            if (tipoTributacaoSelect.value === 'nao_cumulativo') {
                creditosGroup.style.display = 'block';
                creditosInput.focus();
            } else {
                creditosGroup.style.display = 'none';
                creditosInput.value = '0';
                if (tipoTributacaoSelect.value === 'cumulativo') {
                    cumulativoCheckbox.checked = false;
                }
            }
        });

        // 🔹 ALTERAÇÃO FLUXO SALVAR→DASHBOARD: Listener para o botão de salvar
        if (btnSalvar) {
            btnSalvar.addEventListener('click', () => {
                handleModuleSave('pisCofins', currentInputs, currentOutputs, 'btn-salvar-pis-cofins');
            });
        }

        // Esconder botão salvar se qualquer input mudar
        const inputs = pisForm.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                if (btnSalvar) btnSalvar.style.display = 'none';
            });
        });

        loadPISCofinsData();
    }
}

async function handlePISCofinsCalculation(event) {
    event.preventDefault();

    const faturamento = parseFloat(document.getElementById('pisBaseCalculo').value);
    const acrescimos = parseFloat(document.getElementById('pisAcrescimos').value) || 0;
    const exclusoes = parseFloat(document.getElementById('pisExclusoes').value) || 0;
    const aliquotaPIS = parseFloat(document.getElementById('pisAliquota').value) / 100;
    const aliquotaCofins = parseFloat(document.getElementById('cofinsAliquota').value) / 100;
    const tipoTributacao = document.getElementById('pisTipoTributacao').value;
    const cumulativo = document.getElementById('pisCumulativo').checked;
    const creditos = parseFloat(document.getElementById('pis-cofins-creditos').value) || 0;

    if (isNaN(faturamento) || faturamento < 0) {
        alert('Faturamento inválido.');
        return;
    }

    const resultados = calcularPISCofins(
        faturamento, acrescimos, exclusoes, aliquotaPIS, aliquotaCofins, 
        tipoTributacao, cumulativo, creditos
    );

    exibirResultadosPISCofins(resultados);

    currentInputs = { 
        faturamento, acrescimos, exclusoes,
        aliquotaPIS: aliquotaPIS * 100, 
        aliquotaCofins: aliquotaCofins * 100, 
        tipoTributacao, cumulativo, creditos 
    };
    currentOutputs = resultados;

    const btnSalvar = document.getElementById('btn-salvar-pis-cofins');
    if (btnSalvar) {
        btnSalvar.style.display = 'block';
    }
}

function calcularPISCofins(faturamento, acrescimos, exclusoes, aliquotaPIS, aliquotaCofins, tipoTributacao, cumulativo, creditos = 0) {
    const baseCalculoReal = Math.max(0, faturamento + acrescimos - exclusoes);
    
    // 🔹 VALIDAÇÃO AULA 3: 
    // No Regime Cumulativo (tipoTributacao = 'cumulativo'), as alíquotas JÁ SÃO reduzidas
    // PIS cumulativo = 0,65% | COFINS cumulativo = 3,00%
    // O código aplica 65% das alíquotas quando:
    // 1. O tipo de tributação é "cumulativo" (regime cumulativo)
    // 2. O tipo é "nao_cumulativo" E o checkbox cumulativo está marcado
    
    let aplicarReducao = false;
    
    if (tipoTributacao === 'cumulativo') {
        aplicarReducao = true;
    } else if (tipoTributacao === 'nao_cumulativo' && cumulativo) {
        aplicarReducao = true;
    }
    
    let pisAliquotaCalc = aliquotaPIS;
    let cofinsAliquotaCalc = aliquotaCofins;
    
    if (aplicarReducao) {
        pisAliquotaCalc = aliquotaPIS * 0.65;
        cofinsAliquotaCalc = aliquotaCofins * 0.65;
    }
    
    const debitoPis = baseCalculoReal * pisAliquotaCalc;
    const debitoCofins = baseCalculoReal * cofinsAliquotaCalc;
    const debitoBruto = debitoPis + debitoCofins;
    
    const totalLiquido = Math.max(0, debitoBruto - creditos);
    const saldoCredor = Math.max(0, creditos - debitoBruto);

    const cbsTeste = baseCalculoReal * ALIQUOTA_CBS_TESTE;
    const ibsTeste = baseCalculoReal * ALIQUOTA_IBS_TESTE;
    const totalTeste = cbsTeste + ibsTeste;

    let pisRetido = 0;
    let cofinsRetido = 0;

    if (tipoTributacao === 'retencao') {
        pisRetido = baseCalculoReal * 0.0065;
        cofinsRetido = baseCalculoReal * 0.054;
    }

    let aliquotaEfetiva = 0;
    if (aplicarReducao) {
        aliquotaEfetiva = (aliquotaPIS + aliquotaCofins) * 0.65;
    } else {
        aliquotaEfetiva = aliquotaPIS + aliquotaCofins;
    }

    return {
        faturamento: faturamento.toFixed(2),
        acrescimos: acrescimos.toFixed(2),
        exclusoes: exclusoes.toFixed(2),
        base_calculo: baseCalculoReal.toFixed(2),
        pis_devido: debitoPis.toFixed(2),
        cofins_devido: debitoCofins.toFixed(2),
        debito_bruto: debitoBruto.toFixed(2),
        creditos: creditos.toFixed(2),
        total_liquido: totalLiquido.toFixed(2),
        saldo_credor: saldoCredor.toFixed(2),
        pis_retencao: pisRetido.toFixed(2),
        cofins_retencao: cofinsRetido.toFixed(2),
        cbs_teste: cbsTeste.toFixed(2),
        ibs_teste: ibsTeste.toFixed(2),
        total_teste: totalTeste.toFixed(2),
        aliquota_efetiva: (aliquotaEfetiva * 100).toFixed(2),
        tipo_tributacao: tipoTributacao,
        cumulativo: aplicarReducao,
        timestamp: new Date().toISOString()
    };
}

function exibirResultadosPISCofins(resultados) {
    document.getElementById('pisCofinsBaseReal').textContent = `R$ ${parseFloat(resultados.base_calculo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    document.getElementById('pisCofinsDebitoBruto').textContent = `R$ ${parseFloat(resultados.debito_bruto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    document.getElementById('pisCofinsCreditosDisplay').textContent = `R$ ${parseFloat(resultados.creditos).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    document.getElementById('pisCofinsTotal').textContent = `R$ ${parseFloat(resultados.total_liquido).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    
    // 🔹 ALTERAÇÃO: Badge de saldo credor com formatação pt-BR
    const msgContainer = document.getElementById('pisCofinsMensagemContainer');
    msgContainer.innerHTML = '';
    if (parseFloat(resultados.saldo_credor) > 0) {
        const badge = document.createElement('div');
        badge.className = 'badge badge-info';
        badge.style.marginTop = '10px';
        badge.style.display = 'inline-block';
        badge.textContent = `💡 Saldo credor para compensação futura: R$ ${parseFloat(resultados.saldo_credor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        msgContainer.appendChild(badge);
    }

    document.getElementById('pisDevido').textContent = `R$ ${parseFloat(resultados.pis_devido).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    document.getElementById('cofinsDevido').textContent = `R$ ${parseFloat(resultados.cofins_devido).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    document.getElementById('pisCbs').textContent = `R$ ${parseFloat(resultados.cbs_teste).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    document.getElementById('pisIbs').textContent = `R$ ${parseFloat(resultados.ibs_teste).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    document.getElementById('pisTotalTeste').textContent = `R$ ${parseFloat(resultados.total_teste).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    document.getElementById('pisCofinsResultados').classList.remove('hidden');
}

async function loadPISCofinsData() {
    try {
        const data = await loadModuleData('pisCofins');
        if (data && data.inputs) {
            document.getElementById('pisBaseCalculo').value = data.inputs.faturamento || data.inputs.baseCalculo || '';
            document.getElementById('pisAcrescimos').value = data.inputs.acrescimos || 0;
            document.getElementById('pisExclusoes').value = data.inputs.exclusoes || 0;
            document.getElementById('pisAliquota').value = data.inputs.aliquotaPIS || '0.65';
            document.getElementById('cofinsAliquota').value = data.inputs.aliquotaCofins || '3.0';
            
            const tipoTributacao = data.inputs.tipoTributacao || 'cumulativo';
            document.getElementById('pisTipoTributacao').value = tipoTributacao;
            
            // Disparar evento de change para ajustar visibilidade do campo de créditos
            document.getElementById('pisTipoTributacao').dispatchEvent(new Event('change'));
            
            document.getElementById('pisCumulativo').checked = data.inputs.cumulativo || false;
            document.getElementById('pis-cofins-creditos').value = data.inputs.creditos || 0;

            if (data.outputs) {
                exibirResultadosPISCofins(data.outputs);
            }
        }
    } catch (error) {
        console.error('Erro ao carregar dados de PIS/Cofins:', error);
    }
}

document.addEventListener('DOMContentLoaded', initializePISCofinsModule);

export { calcularPISCofins, exibirResultadosPISCofins };