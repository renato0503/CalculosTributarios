import { loadModuleData } from './student.js';

async function atualizarDashboard(forcarAtualizacao = false) {
    const cenarioAtivo = sessionStorage.getItem('cenarioAtivo');
    
    if (!cenarioAtivo) {
        const container = document.getElementById('dashboardContent');
        if (container) {
            container.innerHTML = '<p class="empty-message">Selecione ou crie um cenário para visualizar o dashboard.</p>';
        }
        return;
    }

    console.log('[Dashboard] Atualizando para o cenário:', cenarioAtivo, '- Forçado:', forcarAtualizacao);

    // Carregar dados de todos os módulos em paralelo
    const [dadosISS, dadosICMS, dadosIPI, dadosPIS, dadosIRPJ, dadosCSLL] = await Promise.all([
        loadModuleData('iss'),
        loadModuleData('icms'),
        loadModuleData('ipi'),
        loadModuleData('pisCofins'),
        loadModuleData('irpj'),
        loadModuleData('csll')
    ]);

    // Extrair os outputs de forma segura (fallback para evitar quebra)
    const outISS = dadosISS?.outputs || {};
    const outICMS = dadosICMS?.outputs || {};
    const outIPI = dadosIPI?.outputs || {};
    const outPIS = dadosPIS?.outputs || {};
    const outIRPJ = dadosIRPJ?.outputs || {};
    const outCSLL = dadosCSLL?.outputs || {};

    const tributos = {
        'ISS': parseFloat(outISS.issDevido) || parseFloat(outISS.total) || 0,
        'ICMS': parseFloat(outICMS.icmsLiquido) || parseFloat(outICMS.debitoBruto) || parseFloat(outICMS.icmsSTaRecolher) || parseFloat(outICMS.icmsTotal) || 0,
        'IPI': parseFloat(outIPI.ipiDevido) || parseFloat(outIPI.total) || 0,
        'PIS/COFINS': parseFloat(outPIS.total_liquido) || parseFloat(outPIS.totalPisCofins) || 0,
        'IRPJ': parseFloat(outIRPJ.irpjTotal) || 0,
        'CSLL': parseFloat(outCSLL.csllTotal) || 0
    };

    let totalTributos = Object.values(tributos).reduce((a, b) => a + b, 0);
    
    // CBS/IBS Teste (1%) para consolidado educacional
    let totalCBSTeste = 0;
    totalCBSTeste += (parseFloat(outISS.cbsTeste) || 0) + (parseFloat(outISS.ibsTeste) || 0);
    totalCBSTeste += (parseFloat(outICMS.cbs_teste) || 0) + (parseFloat(outICMS.ibs_teste) || 0);
    totalCBSTeste += (parseFloat(outPIS.cbs_teste) || 0) + (parseFloat(outPIS.ibs_teste) || 0);

    // Atualizar UI Geral
    const format = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('total-tributos').textContent = format(totalTributos);
    document.getElementById('total-cbs-teste').textContent = format(totalCBSTeste);

    const receitaTotal = parseFloat(dadosIRPJ?.inputs?.receita) || 0;
    if (receitaTotal > 0) {
        const cargaPercentual = (totalTributos / receitaTotal) * 100;
        document.getElementById('carga-percentual').textContent = cargaPercentual.toFixed(2) + '%';
    } else {
        document.getElementById('carga-percentual').textContent = '0.00%';
    }

    renderizarGrafico(tributos);
    
    // Passamos todos os outputs simulando o objeto antigo `modulos`
    executarSplitTest({
        iss: { outputs: outISS },
        icms: { outputs: outICMS },
        ipi: { outputs: outIPI },
        pisCofins: { outputs: outPIS },
        irpj: { inputs: dadosIRPJ?.inputs, outputs: outIRPJ },
        csll: { outputs: outCSLL }
    }, receitaTotal, totalTributos);
}

function renderizarGrafico(dist) {
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js não carregado. Pulando renderização do gráfico.');
        return;
    }

    const labels = Object.keys(dist).filter(k => dist[k] > 0);
    const data = labels.map(k => dist[k]);
    const ctx = document.getElementById('grafico-distribuicao').getContext('2d');

    if (window.myChart) window.myChart.destroy();

    window.myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff', '#ff9f40'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.label}: ${ctx.parsed.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
                    }
                }
            }
        }
    });
}

function executarSplitTest(modulos, receita, cargaVigenteTotal) {
    // 1. Carga Vigente calculada no dashboard superior
    let cargaVigente = cargaVigenteTotal;

    // 2. Carga Pós-Reforma (Simplificação Educacional)
    // Alíquota média 26.5% conforme debates técnicos
    const aliquotaIVA = 0.265;
    const custosTributaveis = (parseFloat(modulos.irpj?.inputs?.custos) || 0) + (parseFloat(modulos.irpj?.inputs?.despesas) || 0);
    
    // Créditos estimados: assumimos que 40% dos custos geram crédito pleno de 26,5%
    const creditosEstimados = custosTributaveis * aliquotaIVA * 0.40;
    const cbsIbsLiquido = Math.max(0, (receita * aliquotaIVA) - creditosEstimados);
    
    // IRPJ e CSLL não mudam na reforma do consumo
    const irpjCsll = (parseFloat(modulos.irpj?.outputs?.irpjTotal) || 0) + (parseFloat(modulos.csll?.outputs?.csllTotal) || 0);
    const cargaPosReforma = cbsIbsLiquido + irpjCsll;

    // 3. Comparação
    const diferenca = cargaPosReforma - cargaVigente;
    const percMudanca = cargaVigente > 0 ? (diferenca / cargaVigente) * 100 : 0;

    // 4. Update UI
    const format = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('split-vigente').textContent = format(cargaVigente);
    document.getElementById('split-pos-reforma').textContent = format(cargaPosReforma);
    
    const diffEl = document.getElementById('split-diferenca');
    diffEl.textContent = `${diferenca > 0 ? '+' : ''}${format(diferenca)} (${percMudanca.toFixed(2)}%)`;
    diffEl.style.color = diferenca > 0 ? '#ff6384' : '#4bc0c0';

    const alertEl = document.getElementById('split-alert');
    if (diferenca > 0) {
        alertEl.className = 'badge badge-danger';
        alertEl.textContent = '⚠️ Aumento de Carga';
    } else if (diferenca < 0) {
        alertEl.className = 'badge badge-success';
        alertEl.textContent = '✅ Redução de Carga';
    } else {
        alertEl.className = 'badge badge-info';
        alertEl.textContent = '➡️ Neutro';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    atualizarDashboard(true);
    
    // Atualiza quando o cenário muda
    document.addEventListener('scenarioChanged', () => {
        console.log('[Dashboard] Evento scenarioChanged detectado');
        atualizarDashboard(true);
    });
    
    // Atualiza quando o usuário navega para a aba Dashboard
    document.addEventListener('moduleSwitched', (e) => {
        if (e.detail.module === 'dashboard') {
            console.log('[Dashboard] Navegação para Dashboard detectada');
            atualizarDashboard(true);
        }
    });
});

// Alias for compatibility
const updateDashboard = atualizarDashboard;
export { updateDashboard, atualizarDashboard };