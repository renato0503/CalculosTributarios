import { saveModuleData, loadModuleData, handleModuleSave } from './student.js';

function initializeCSLLModule() {
    const csllForm = document.getElementById('csllForm');
    const usarIRPJCheckbox = document.getElementById('csll-usar-irpj');
    const csllRegime = document.getElementById('csll-regime');
    const btnSalvar = document.getElementById('btn-salvar-csll');

    if (csllForm) {
        csllForm.addEventListener('submit', handleCSLLCalculation);

        usarIRPJCheckbox.addEventListener('change', function() {
            document.getElementById('csll-manual-fields').style.display = 
                this.checked ? 'none' : 'block';
        });

        csllRegime.addEventListener('change', function() {
            document.getElementById('csll-presumido-fields').style.display = 
                this.value === 'presumido' ? 'block' : 'none';
        });

        if (btnSalvar) {
            btnSalvar.addEventListener('click', async () => {
                const inputs = await getCSLLInputs();
                if (!inputs) return;
                const outputs = calcularCSLLLogic(inputs);
                handleModuleSave('csll', inputs, outputs, 'btn-salvar-csll');
            });
        }

        csllForm.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('input', () => {
                if (btnSalvar) btnSalvar.style.display = 'none';
            });
        });

        loadCSLLData();
    }
}

async function getCSLLInputs() {
    const usarIRPJ = document.getElementById('csll-usar-irpj').checked;
    const regime = document.getElementById('csll-regime').value;
    let baseCalculo;

    if (usarIRPJ) {
        const dadosIRPJ = await loadModuleData('irpj');
        if (dadosIRPJ && dadosIRPJ.outputs) {
            baseCalculo = dadosIRPJ.outputs.baseCalculo;
        } else {
            window.showToast('⚠️ Calcule e salve o IRPJ primeiro ou use a base manual!', 'warning');
            return null;
        }
    } else {
        baseCalculo = parseFloat(document.getElementById('csll-base').value) || 0;
    }

    return {
        usarIRPJ,
        regime,
        baseCalculo,
        coeficiente: parseFloat(document.getElementById('csll-coeficiente').value) || 32,
        receitaManual: parseFloat(document.getElementById('csll-base').value) || 0,
        receitaIrpj: parseFloat(document.getElementById('irpj-receita')?.value) || 0,
        liminar: document.getElementById('csllLiminarLC224').checked
    };
}

async function handleCSLLCalculation(event) {
    event.preventDefault();
    const inputs = await getCSLLInputs();
    if (!inputs) return;
    const resultados = calcularCSLLLogic(inputs);
    exibirResultadosCSLL(resultados);
    document.getElementById('btn-salvar-csll').style.display = 'block';
}

function calcularCSLLLogic(inputs) {
    let baseFinal = inputs.baseCalculo;
    const regime = inputs.regime;
    const liminarAtiva = inputs.liminar === true;

    if (regime === 'presumido' && !inputs.usarIRPJ) {
        const LIMITE_TRIMESTRAL = 1250000.00;
        const coefPadrao = parseFloat(inputs.coeficiente) / 100;
        const receita = parseFloat(inputs.receitaManual) || 0;

        console.log(`[CSLL] Calculando Presumido. Receita: ${receita}, Coef: ${coefPadrao}, Liminar: ${liminarAtiva}`);

        if (liminarAtiva) {
            baseFinal = receita * coefPadrao;
        } else if (receita > LIMITE_TRIMESTRAL) {
            const parcelaNormal = LIMITE_TRIMESTRAL * coefPadrao;
            const valorExcedente = receita - LIMITE_TRIMESTRAL;
            const coefMajorado = coefPadrao * 1.10;
            const parcelaMajorada = valorExcedente * coefMajorado;
            
            baseFinal = parcelaNormal + parcelaMajorada;
            console.log(`[CSLL] LC 224 Aplicada. Base: ${baseFinal}`);
        } else {
            baseFinal = receita * coefPadrao;
        }
    }

    const aliquota = 0.09;
    const csllTotal = baseFinal * aliquota;

    return {
        baseCalculo: baseFinal,
        aliquota: 0.09,
        csllTotal,
        majorada: (regime === 'presumido' && !liminarAtiva && (inputs.usarIRPJ ? false : (parseFloat(inputs.receitaManual) || 0) > 1250000)),
        timestamp: new Date().toISOString()
    };
}


function exibirResultadosCSLL(res) {
    const format = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('csll-base-calc').textContent = format(res.baseCalculo);
    document.getElementById('csll-aliquota').textContent = '9%';
    document.getElementById('csll-total').textContent = format(res.csllTotal);
    
    // Alerta de Majoração
    const resultsDiv = document.getElementById('csllResultados');
    let alertBox = document.getElementById('csll-alerta-majoracao');
    if (res.majorada) {
        if (!alertBox) {
            alertBox = document.createElement('div');
            alertBox.id = 'csll-alerta-majoracao';
            alertBox.className = 'badge badge-warning';
            alertBox.style.marginTop = '10px';
            alertBox.style.display = 'block';
            resultsDiv.insertBefore(alertBox, resultsDiv.firstChild);
        }
        alertBox.textContent = '⚠️ Majoração LC 224/2025 aplicada (Excedente R$ 1,25M)';
    } else if (alertBox) {
        alertBox.remove();
    }

    resultsDiv.classList.remove('hidden');
}

async function loadCSLLData() {
    const data = await loadModuleData('csll');
    if (data && data.inputs) {
        document.getElementById('csll-usar-irpj').checked = data.inputs.usarIRPJ ?? true;
        document.getElementById('csll-base').value = data.inputs.baseCalculo || 0;
        document.getElementById('csll-regime').value = data.inputs.regime || 'real';
        document.getElementById('csll-coeficiente').value = data.inputs.coeficiente || 32;
        document.getElementById('csllLiminarLC224').checked = data.inputs.liminar || false;

        document.getElementById('csll-usar-irpj').dispatchEvent(new Event('change'));
        document.getElementById('csll-regime').dispatchEvent(new Event('change'));

        if (data.outputs) {
            exibirResultadosCSLL(data.outputs);
        }
    }
}

document.addEventListener('DOMContentLoaded', initializeCSLLModule);
export { calcularCSLLLogic };