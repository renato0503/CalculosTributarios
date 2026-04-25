import { saveModuleData, loadModuleData, handleModuleSave } from './student.js';

function initializeIRPJModule() {
    const irpjForm = document.getElementById('irpjForm');
    const irpjRegime = document.getElementById('irpj-regime');
    const btnSalvar = document.getElementById('btn-salvar-irpj');

    if (irpjForm) {
        irpjForm.addEventListener('submit', handleIRPJCalculation);

        // Toggle de campos conforme regime
        irpjRegime.addEventListener('change', function() {
            const regime = this.value;
            document.getElementById('irpj-real-fields').style.display = 
                regime === 'real' ? 'block' : 'none';
            document.getElementById('irpj-presumido-fields').style.display = 
                regime === 'presumido' ? 'block' : 'none';
        });

        // Configurar botão de salvar
        if (btnSalvar) {
            btnSalvar.addEventListener('click', () => {
                const cenarioAtivo = sessionStorage.getItem('cenarioAtivo');
                if (!cenarioAtivo) {
                    window.showToast('⚠️ Selecione um cenário ativo primeiro!', 'warning');
                    return;
                }
                const inputs = getIRPJInputs();
                const outputs = calcularIRPJLogic(inputs);
                handleModuleSave('irpj', inputs, outputs, 'btn-salvar-irpj');
            });
        }

        // Esconder botão salvar ao mudar inputs
        irpjForm.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('input', () => {
                if (btnSalvar) btnSalvar.style.display = 'none';
            });
        });

        loadIRPJData();
    }
}

function getIRPJInputs() {
    return {
        receita: parseFloat(document.getElementById('irpj-receita').value) || 0,
        custos: parseFloat(document.getElementById('irpj-custos').value) || 0,
        despesas: parseFloat(document.getElementById('irpj-despesas').value) || 0,
        financ: parseFloat(document.getElementById('irpj-financ').value) || 0,
        regime: document.getElementById('irpj-regime').value,
        adicoes: parseFloat(document.getElementById('irpj-adicoes').value) || 0,
        exclusoes: parseFloat(document.getElementById('irpj-exclusoes').value) || 0,
        compensacoes: parseFloat(document.getElementById('irpj-compensacoes').value) || 0,
        cnae: parseFloat(document.getElementById('irpj-cnae').value) || 32
    };
}

async function handleIRPJCalculation(event) {
    event.preventDefault();
    const inputs = getIRPJInputs();
    const resultados = calcularIRPJLogic(inputs);
    exibirResultadosIRPJ(resultados);
    document.getElementById('btn-salvar-irpj').style.display = 'block';
}

function calcularIRPJLogic(inputs) {
    let lucroContabil, baseCalculo;
    
    if (inputs.regime === 'real') {
        lucroContabil = inputs.receita - inputs.custos - inputs.despesas + inputs.financ;
        baseCalculo = lucroContabil + inputs.adicoes - inputs.exclusoes;
        
        // Limite de compensação: 30% do lucro real
        const limiteCompensacao = Math.max(0, baseCalculo * 0.30);
        const compensacaoAplicavel = Math.min(inputs.compensacoes, limiteCompensacao);
        baseCalculo = Math.max(0, baseCalculo - compensacaoAplicavel);
    } else {
        const coeficiente = inputs.cnae / 100;
        baseCalculo = inputs.receita * coeficiente;
        lucroContabil = baseCalculo; // Para fins de exibição simplificada
    }
    
    const irpjBasico = baseCalculo * 0.15;
    const limiteIsencao = 60000; // Trimestral
    const excedente = Math.max(0, baseCalculo - limiteIsencao);
    const irpjAdicional = excedente * 0.10;
    const irpjTotal = irpjBasico + irpjAdicional;

    return {
        lucroContabil,
        baseCalculo,
        irpjBasico,
        irpjAdicional,
        irpjTotal,
        timestamp: new Date().toISOString()
    };
}

function exibirResultadosIRPJ(res) {
    const format = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    document.getElementById('irpj-lucro').textContent = format(res.lucroContabil);
    document.getElementById('irpj-base').textContent = format(res.baseCalculo);
    document.getElementById('irpj-basico').textContent = format(res.irpjBasico);
    document.getElementById('irpj-adicional').textContent = format(res.irpjAdicional);
    document.getElementById('irpj-total').textContent = format(res.irpjTotal);
    
    document.getElementById('irpjResultados').classList.remove('hidden');
}

async function loadIRPJData() {
    const data = await loadModuleData('irpj');
    if (data && data.inputs) {
        document.getElementById('irpj-receita').value = data.inputs.receita || 0;
        document.getElementById('irpj-custos').value = data.inputs.custos || 0;
        document.getElementById('irpj-despesas').value = data.inputs.despesas || 0;
        document.getElementById('irpj-financ').value = data.inputs.financ || 0;
        document.getElementById('irpj-regime').value = data.inputs.regime || 'real';
        document.getElementById('irpj-adicoes').value = data.inputs.adicoes || 0;
        document.getElementById('irpj-exclusoes').value = data.inputs.exclusoes || 0;
        document.getElementById('irpj-compensacoes').value = data.inputs.compensacoes || 0;
        document.getElementById('irpj-cnae').value = data.inputs.cnae || 32;

        document.getElementById('irpj-regime').dispatchEvent(new Event('change'));

        if (data.outputs) {
            exibirResultadosIRPJ(data.outputs);
        }
    }
}

document.addEventListener('DOMContentLoaded', initializeIRPJModule);
export { calcularIRPJLogic };