import { saveModuleData, loadModuleData, handleModuleSave } from './student.js';

let currentInputs = null;
let currentOutputs = null;

function initializeIPIModule() {
    const ipiForm = document.getElementById('ipiForm');
    const btnSalvar = document.getElementById('btn-salvar-ipi');
    
    if (ipiForm) {
        ipiForm.addEventListener('submit', handleIPICalculation);

        if (btnSalvar) {
            btnSalvar.addEventListener('click', () => {
                handleModuleSave('ipi', currentInputs, currentOutputs, 'btn-salvar-ipi');
            });
        }

        const inputs = ipiForm.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                if (btnSalvar) btnSalvar.style.display = 'none';
            });
        });
        
        loadIPIData();
    }

    window.addEventListener('scenarioChanged', () => {
        loadIPIData();
    });

    window.addEventListener('moduleSwitched', (e) => {
        if (e.detail.module === 'ipi') {
            loadIPIData();
        }
    });
}

async function handleIPICalculation(event) {
    event.preventDefault();

    const cenarioAtivo = sessionStorage.getItem('cenarioAtivo');
    if (!cenarioAtivo) {
        alert('Selecione ou crie um cenário primeiro!');
        return;
    }

    const baseCalculo = parseFloat(document.getElementById('ipiBaseCalculo').value);
    const aliquota = parseFloat(document.getElementById('ipiAliquota').value) / 100;
    const tipoIncidencia = document.getElementById('ipiTipoIncidencia').value;
    const valorFrete = parseFloat(document.getElementById('ipiFrete').value) || 0;
    const valorSeguro = parseFloat(document.getElementById('ipiSeguro').value) || 0;
    const outrasDespesas = parseFloat(document.getElementById('ipiOutrasDespesas').value) || 0;

    if (isNaN(baseCalculo) || baseCalculo <= 0) {
        alert('Base de cálculo inválida.');
        return;
    }

    const resultados = calcularIPI(baseCalculo, aliquota, tipoIncidencia, valorFrete, valorSeguro, outrasDespesas);

    exibirResultadosIPI(resultados);

    currentInputs = { baseCalculo, aliquota: aliquota * 100, tipoIncidencia, valorFrete, valorSeguro, outrasDespesas };
    currentOutputs = resultados;

    const btnSalvar = document.getElementById('btn-salvar-ipi');
    if (btnSalvar) {
        btnSalvar.style.display = 'block';
    }
}

function calcularIPI(baseCalculo, aliquota, tipoIncidencia, valorFrete, valorSeguro, outrasDespesas) {
    const baseTotal = baseCalculo + valorFrete + valorSeguro + outrasDespesas;
    
    const ipiDevido = baseTotal * aliquota;
    const precoVenda = baseCalculo + ipiDevido;

    let classificacao = 'NCM genérico';
    let tipoAliquota = 'ad valorem';

    if (tipoIncidencia === 'especifica') {
        tipoAliquota = 'específica';
    }

    return {
        base_produto: baseCalculo.toFixed(2),
        valor_frete: valorFrete.toFixed(2),
        valor_seguro: valorSeguro.toFixed(2),
        outras_despesas: outrasDespesas.toFixed(2),
        base_ipi: baseTotal.toFixed(2),
        aliquota_percent: (aliquota * 100).toFixed(2),
        ipi_devido: ipiDevido.toFixed(2),
        preco_venda: precoVenda.toFixed(2),
        tipo_incidencia: tipoIncidencia,
        classificacao_tributaria: classificacao,
        timestamp: new Date().toISOString()
    };
}

function exibirResultadosIPI(resultados) {
    document.getElementById('ipiDevido').textContent = `R$ ${parseFloat(resultados.ipi_devido).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    document.getElementById('ipiBaseTotal').textContent = `R$ ${parseFloat(resultados.base_ipi).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    document.getElementById('ipiPrecoVenda').textContent = `R$ ${parseFloat(resultados.preco_venda).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    document.getElementById('ipiResultados').classList.remove('hidden');
}

async function loadIPIData() {
    const cenarioAtivo = sessionStorage.getItem('cenarioAtivo');
    if (!cenarioAtivo) {
        document.getElementById('ipiForm')?.reset();
        document.getElementById('ipiResultados')?.classList.add('hidden');
        return;
    }

    try {
        const data = await loadModuleData('ipi');
        if (data && data.inputs) {
            document.getElementById('ipiBaseCalculo').value = data.inputs.baseCalculo || '';
            document.getElementById('ipiAliquota').value = data.inputs.aliquota || '';
            document.getElementById('ipiTipoIncidencia').value = data.inputs.tipoIncidencia || 'ad_valorem';
            document.getElementById('ipiFrete').value = data.inputs.valorFrete || '';
            document.getElementById('ipiSeguro').value = data.inputs.valorSeguro || '';
            document.getElementById('ipiOutrasDespesas').value = data.inputs.outrasDespesas || '';
            if (data.outputs) {
                exibirResultadosIPI(data.outputs);
            }
        } else {
            document.getElementById('ipiForm')?.reset();
            document.getElementById('ipiResultados')?.classList.add('hidden');
        }
    } catch (error) {
        console.error('Erro ao carregar dados de IPI:', error);
    }
}

document.addEventListener('DOMContentLoaded', initializeIPIModule);

export { calcularIPI, exibirResultadosIPI };