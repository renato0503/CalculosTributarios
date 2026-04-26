import { saveModuleData, loadModuleData, handleModuleSave } from './student.js';

let currentInputs = null;
let currentOutputs = null;

function initializeIPIModule() {
    const ipiForm = document.getElementById('ipiForm');
    const btnSalvar = document.getElementById('btn-salvar-ipi');
    const tipoIncidencia = document.getElementById('ipiTipoIncidencia');
    
    if (ipiForm) {
        ipiForm.addEventListener('submit', handleIPICalculation);

        // Reatividade da Interface: Troca de Incidência
        if (tipoIncidencia) {
            tipoIncidencia.addEventListener('change', function() {
                const isEspecífica = this.value === 'especifica';
                document.getElementById('ipi-ad-valorem-fields').style.display = isEspecífica ? 'none' : 'block';
                document.getElementById('ipi-especifica-fields').style.display = isEspecífica ? 'block' : 'none';
                
                // Limpar campos ao trocar para evitar cálculos residuais
                if (btnSalvar) btnSalvar.style.display = 'none';
            });
        }

        if (btnSalvar) {
            btnSalvar.addEventListener('click', () => {
                handleModuleSave('ipi', currentInputs, currentOutputs, 'btn-salvar-ipi');
            });
        }

        ipiForm.querySelectorAll('input, select').forEach(input => {
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
        window.showToast('⚠️ Selecione ou crie um cenário primeiro!', 'warning');
        return;
    }

    const inputs = {
        tipoIncidencia: document.getElementById('ipiTipoIncidencia').value,
        baseCalculo: parseFloat(document.getElementById('ipiBaseCalculo').value) || 0,
        aliquota: parseFloat(document.getElementById('ipiAliquota').value) || 0,
        valorFrete: parseFloat(document.getElementById('ipiFrete').value) || 0,
        valorSeguro: parseFloat(document.getElementById('ipiSeguro').value) || 0,
        outrasDespesas: parseFloat(document.getElementById('ipiOutrasDespesas').value) || 0,
        quantidade: parseFloat(document.getElementById('ipiQuantidade').value) || 0,
        valorFixo: parseFloat(document.getElementById('ipiValorFixo').value) || 0,
        valorUnitarioProd: parseFloat(document.getElementById('ipiValorUnitarioProd').value) || 0
    };

    const resultados = calcularIPI(inputs);
    exibirResultadosIPI(resultados);

    currentInputs = inputs;
    currentOutputs = resultados;

    const btnSalvar = document.getElementById('btn-salvar-ipi');
    if (btnSalvar) {
        btnSalvar.style.display = 'block';
    }
}

function calcularIPI(inputs) {
    let ipiDevido = 0;
    let baseExibicao = 0;
    let valorTotalNota = 0;
    const { tipoIncidencia, baseCalculo, aliquota, valorFrete, valorSeguro, outrasDespesas, quantidade, valorFixo, valorUnitarioProd } = inputs;

    if (tipoIncidencia === 'ad_valorem') {
        // Lógica Ad Valorem (Base = Produto + Acessórios)
        const baseIPI = baseCalculo + valorFrete + valorSeguro + outrasDespesas;
        ipiDevido = baseIPI * (aliquota / 100);
        baseExibicao = baseIPI;
        valorTotalNota = baseCalculo + valorFrete + valorSeguro + outrasDespesas + ipiDevido;
    } else {
        // Lógica Específica (IPI = Quantidade * Valor Fixo)
        ipiDevido = quantidade * valorFixo;
        baseExibicao = quantidade;
        // Total Nota = (Quantidade * Valor Unitário) + IPI
        valorTotalNota = (quantidade * valorUnitarioProd) + ipiDevido;
    }

    return {
        tipo_incidencia: tipoIncidencia,
        base_exibicao: baseExibicao.toFixed(2),
        ipi_devido: ipiDevido.toFixed(2),
        preco_venda: valorTotalNota.toFixed(2), // Mantendo nome de campo para compatibilidade de UI
        timestamp: new Date().toISOString()
    };
}

function exibirResultadosIPI(res) {
    const format = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const isEspecífica = res.tipo_incidencia === 'especifica';

    document.getElementById('ipiBaseTotal').textContent = isEspecífica ? 
        parseFloat(res.base_exibicao).toFixed(0) : 
        format(parseFloat(res.base_exibicao));
        
    document.getElementById('ipiDevido').textContent = format(parseFloat(res.ipi_devido));
    document.getElementById('ipiPrecoVenda').textContent = format(parseFloat(res.preco_venda));

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
            const inputs = data.inputs;
            document.getElementById('ipiTipoIncidencia').value = inputs.tipoIncidencia || 'ad_valorem';
            document.getElementById('ipiBaseCalculo').value = inputs.baseCalculo || '';
            document.getElementById('ipiAliquota').value = inputs.aliquota || '';
            document.getElementById('ipiFrete').value = inputs.valorFrete || '';
            document.getElementById('ipiSeguro').value = inputs.valorSeguro || '';
            document.getElementById('ipiOutrasDespesas').value = inputs.outrasDespesas || '';
            document.getElementById('ipiQuantidade').value = inputs.quantidade || '';
            document.getElementById('ipiValorFixo').value = inputs.valorFixo || '';
            document.getElementById('ipiValorUnitarioProd').value = inputs.valorUnitarioProd || '';

            // Disparar o evento de mudança para ajustar a visibilidade
            document.getElementById('ipiTipoIncidencia').dispatchEvent(new Event('change'));

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