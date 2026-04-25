import { saveModuleData, loadModuleData, handleModuleSave } from './student.js';

const ALIQUOTA_CBS_TESTE = 0.009;
const ALIQUOTA_IBS_TESTE = 0.001;

let currentInputs = null;
let currentOutputs = null;

function initializeISSModule() {
    const issForm = document.getElementById('issForm');
    const btnSalvar = document.getElementById('btn-salvar-iss');
    
    if (issForm) {
        issForm.addEventListener('submit', handleISSCalculation);

        if (btnSalvar) {
            btnSalvar.addEventListener('click', () => {
                handleModuleSave('iss', currentInputs, currentOutputs, 'btn-salvar-iss');
            });
        }

        const inputs = issForm.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                if (btnSalvar) btnSalvar.style.display = 'none';
            });
        });
    }

    loadISSData();

    // Escuta mudanças de cenário
    window.addEventListener('scenarioChanged', () => {
        loadISSData();
    });

    // Escuta troca de aba para este módulo
    window.addEventListener('moduleSwitched', (e) => {
        if (e.detail.module === 'iss') {
            loadISSData();
        }
    });
}

async function handleISSCalculation(event) {
    event.preventDefault();

    const cenarioAtivo = sessionStorage.getItem('cenarioAtivo');
    if (!cenarioAtivo) {
        alert('Selecione ou crie um cenário primeiro!');
        return;
    }

    const valor = parseFloat(document.getElementById('issValor').value);
    const municipio = document.getElementById('issMunicipio').value;
    const aliquota = parseFloat(document.getElementById('issAliquota').value) / 100;

    if (isNaN(valor) || isNaN(aliquota) || valor <= 0) {
        alert('Valores inválidos. Verifique os dados de entrada.');
        return;
    }

    const resultados = calcularISS(valor, aliquota);

    exibirResultados(resultados);

    currentInputs = { valor, municipio, aliquota: aliquota * 100 };
    currentOutputs = resultados;

    const btnSalvar = document.getElementById('btn-salvar-iss');
    if (btnSalvar) {
        btnSalvar.style.display = 'block';
    }
}

function calcularISS(valorServico, aliquotaISS) {
    const issDevido = valorServico * aliquotaISS;
    const cbsTeste = valorServico * ALIQUOTA_CBS_TESTE;
    const ibsTeste = valorServico * ALIQUOTA_IBS_TESTE;
    const totalRetencao = cbsTeste + ibsTeste;

    return {
        valor_servico: valorServico.toFixed(2),
        aliquota_iss_percent: (aliquotaISS * 100).toFixed(2),
        iss_devido: issDevido.toFixed(2),
        cbs_teste_09: cbsTeste.toFixed(2),
        ibs_teste_01: ibsTeste.toFixed(2),
        total_retencao_1pct: totalRetencao.toFixed(2),
        timestamp: new Date().toISOString()
    };
}

function exibirResultados(resultados) {
    document.getElementById('issDevido').textContent = `R$ ${parseFloat(resultados.iss_devido).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('issCBS').textContent = `R$ ${parseFloat(resultados.cbs_teste_09).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('issIBS').textContent = `R$ ${parseFloat(resultados.ibs_teste_01).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('issTotalRetencao').textContent = `R$ ${parseFloat(resultados.total_retencao_1pct).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    document.getElementById('issResultados').classList.remove('hidden');
}

async function loadISSData() {
    const cenarioAtivo = sessionStorage.getItem('cenarioAtivo');
    if (!cenarioAtivo) {
        // Limpa formulário e esconde resultados se não houver cenário
        document.getElementById('issForm')?.reset();
        document.getElementById('issResultados')?.classList.add('hidden');
        return;
    }

    try {
        const data = await loadModuleData('iss');

        if (data && data.inputs) {
            document.getElementById('issValor').value = data.inputs.valor || '';
            document.getElementById('issMunicipio').value = data.inputs.municipio || '';
            document.getElementById('issAliquota').value = data.inputs.aliquota || '';

            if (data.outputs) {
                exibirResultados(data.outputs);
            }
        } else {
            // Se não houver dados no cenário para este módulo, limpa o estado anterior
            document.getElementById('issForm')?.reset();
            document.getElementById('issResultados')?.classList.add('hidden');
        }
    } catch (error) {
        console.error('Erro ao carregar dados de ISS:', error);
    }
}

document.addEventListener('DOMContentLoaded', initializeISSModule);

export { calcularISS, exibirResultados };
