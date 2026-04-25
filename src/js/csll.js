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
        receitaIrpj: parseFloat(document.getElementById('irpj-receita')?.value) || 0
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

    if (inputs.regime === 'presumido' && !inputs.usarIRPJ) {
        const coef = inputs.coeficiente / 100;
        baseFinal = inputs.receitaIrpj * coef;
    }

    const aliquota = 0.09;
    const csllTotal = baseFinal * aliquota;

    return {
        baseCalculo: baseFinal,
        aliquota: 0.09,
        csllTotal,
        timestamp: new Date().toISOString()
    };
}

function exibirResultadosCSLL(res) {
    const format = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('csll-base-calc').textContent = format(res.baseCalculo);
    document.getElementById('csll-aliquota').textContent = '9%';
    document.getElementById('csll-total').textContent = format(res.csllTotal);
    document.getElementById('csllResultados').classList.remove('hidden');
}

async function loadCSLLData() {
    const data = await loadModuleData('csll');
    if (data && data.inputs) {
        document.getElementById('csll-usar-irpj').checked = data.inputs.usarIRPJ ?? true;
        document.getElementById('csll-base').value = data.inputs.baseCalculo || 0;
        document.getElementById('csll-regime').value = data.inputs.regime || 'real';
        document.getElementById('csll-coeficiente').value = data.inputs.coeficiente || 32;

        document.getElementById('csll-usar-irpj').dispatchEvent(new Event('change'));
        document.getElementById('csll-regime').dispatchEvent(new Event('change'));

        if (data.outputs) {
            exibirResultadosCSLL(data.outputs);
        }
    }
}

document.addEventListener('DOMContentLoaded', initializeCSLLModule);
export { calcularCSLLLogic };