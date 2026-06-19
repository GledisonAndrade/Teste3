// js/pizza.js - Sistema de gráficos de pizza (distribuição de glicemia)

class PizzaSistema {
    constructor() {
        this.chartPizza = null;
        this.periodo = 30;
        this.dataInicio = null;
        this.dataFim = null;
        this.inicializado = false;
        this.canvasId = 'grafico-pizza';
    }

    inicializar() {
        if (this.inicializado) return;
        
        this.configurarDataPadrao();
        this.configurarEventos();
        
        const canvas = document.getElementById(this.canvasId);
        if (!canvas) {
            console.error(`Canvas com ID '${this.canvasId}' não encontrado!`);
            return;
        }
        
        if (typeof Chart === 'undefined') {
            console.error('Chart.js não está carregado!');
            return;
        }
        
        this.criarGrafico();
        this.atualizarGrafico();
        this.inicializado = true;
        
        console.log('✅ Sistema de pizza inicializado');
    }

    configurarDataPadrao() {
        const fim = new Date();
        const inicio = new Date();
        inicio.setDate(inicio.getDate() - this.periodo);
        
        this.dataInicio = inicio.toISOString().split('T')[0];
        this.dataFim = fim.toISOString().split('T')[0];
        
        const inputInicio = document.getElementById('pizza-inicio');
        const inputFim = document.getElementById('pizza-fim');
        
        if (inputInicio) inputInicio.value = this.dataInicio;
        if (inputFim) inputFim.value = this.dataFim;
    }

    configurarEventos() {
        const selectPeriodo = document.getElementById('periodo-pizza');
        if (selectPeriodo) {
            selectPeriodo.addEventListener('change', (e) => {
                if (e.target.value === 'personalizado') {
                    const periodoPersonalizado = document.getElementById('periodo-personalizado-pizza');
                    if (periodoPersonalizado) {
                        periodoPersonalizado.style.display = 'block';
                        const hoje = new Date();
                        const umaSemanaAtras = new Date();
                        umaSemanaAtras.setDate(hoje.getDate() - 7);
                        
                        document.getElementById('pizza-inicio').value = umaSemanaAtras.toISOString().split('T')[0];
                        document.getElementById('pizza-fim').value = hoje.toISOString().split('T')[0];
                        
                        this.dataInicio = umaSemanaAtras.toISOString().split('T')[0];
                        this.dataFim = hoje.toISOString().split('T')[0];
                        this.atualizarGrafico();
                    }
                } else {
                    const periodoPersonalizado = document.getElementById('periodo-personalizado-pizza');
                    if (periodoPersonalizado) periodoPersonalizado.style.display = 'none';
                    this.periodo = parseInt(e.target.value);
                    this.configurarDataPadrao();
                    this.atualizarGrafico();
                }
            });
        }

        const inputInicio = document.getElementById('pizza-inicio');
        const inputFim = document.getElementById('pizza-fim');
        
        if (inputInicio) {
            inputInicio.addEventListener('change', () => {
                this.dataInicio = inputInicio.value;
                this.atualizarGrafico();
            });
        }
        
        if (inputFim) {
            inputFim.addEventListener('change', () => {
                this.dataFim = inputFim.value;
                this.atualizarGrafico();
            });
        }
    }

    criarGrafico() {
        const ctx = document.getElementById(this.canvasId).getContext('2d');
        const corTexto = getComputedStyle(document.body).getPropertyValue('--cor-texto').trim() || '#1f2937';
        
        this.chartPizza = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [
                    'Hipoglicemia (<70)',
                    'Normal (70-180)',
                    'Hiperglicemia (>180)',
                    'Metas alcançadas',
                    'Metas pendentes',
                    'Alimentos bons',
                    'Alimentos ruins'
                ],
                datasets: [{
                    data: [0, 0, 0, 0, 0, 0, 0],
                    backgroundColor: ['#4cc9f0', '#2ecc71', '#e74c3c', '#4361ee', '#f39c12', '#16a34a', '#dc2626'],
                    borderColor: ['#36a3d9', '#27a745', '#c0392b', '#3652c7', '#d8870a', '#15803d', '#b91c1c'],
                    borderWidth: 2,
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: corTexto,
                            font: { size: 12, weight: 'bold' },
                            padding: 15,
                            generateLabels(chart) {
                                const data = chart.data;
                                if (data.labels.length && data.datasets.length) {
                                    return data.labels.map((label, i) => ({
                                        text: label,
                                        fillStyle: data.datasets[0].backgroundColor[i],
                                        hidden: false,
                                        index: i
                                    }));
                                }
                                return [];
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    atualizarGrafico() {
        const dados = Array.isArray(window.dados?.glicemias) ? window.dados.glicemias : [];
        const filtrados = this.filtrarPorPeriodo(dados, this.dataInicio, this.dataFim);
        
        const distribuicao = this.calcularDistribuicao(filtrados);
        const resumo = this.calcularResumoGeral(this.dataInicio, this.dataFim);
        
        if (this.chartPizza) {
            const corTexto = getComputedStyle(document.body).getPropertyValue('--cor-texto').trim() || '#1f2937';
            this.chartPizza.options.plugins.legend.labels.color = corTexto;
            this.chartPizza.data.datasets[0].data = [
                distribuicao.hipoglicemias,
                distribuicao.normais,
                distribuicao.hiperglicemias,
                resumo.metasAlcancadas,
                resumo.metasPendentes,
                resumo.alimentosBons,
                resumo.alimentosRuins
            ];
            this.chartPizza.update();
        }
        
        this.atualizarLegenda(distribuicao, filtrados.length, resumo);
        this.atualizarResumo(resumo, filtrados.length);
    }

    filtrarPorPeriodo(dados, dataInicio, dataFim) {
        if (!Array.isArray(dados) || !dataInicio || !dataFim) return [];
        
        const inicio = new Date(`${dataInicio}T00:00:00`);
        const fim = new Date(`${dataFim}T23:59:59`);
        
        return dados.filter(d => {
            const dataRegistro = d.timestamp ? new Date(d.timestamp) : new Date(`${d.data}T${d.hora || '00:00'}`);
            if (Number.isNaN(dataRegistro.getTime())) return false;
            return dataRegistro >= inicio && dataRegistro <= fim;
        });
    }

    calcularDistribuicao(dados) {
        let hipoglicemias = 0;
        let normais = 0;
        let hiperglicemias = 0;
        
        dados.forEach(d => {
            const glicemia = parseInt(d.glicemia);
            if (glicemia < 70) hipoglicemias++;
            else if (glicemia <= 180) normais++;
            else hiperglicemias++;
        });
        
        return { hipoglicemias, normais, hiperglicemias };
    }
    
    classificarAlimento(alimento) {
        const indice = (alimento.indiceGlicemico || '').toLowerCase();
        if (indice.includes('baixo')) return 'bom';
        if (indice.includes('alto')) return 'ruim';
        
        const categoria = (alimento.categoria || '').toLowerCase();
        if (['vegetais', 'frutas', 'proteinas', 'laticinios'].includes(categoria)) return 'bom';
        if (['doces', 'bebidas'].includes(categoria)) return 'ruim';
        
        const carboidratos = Number(alimento.carboidratos) || 0;
        if (carboidratos >= 30) return 'ruim';
        if (carboidratos > 0 && carboidratos <= 15) return 'bom';
        return 'neutro';
    }
    
    calcularResumoGeral(dataInicio, dataFim) {
        const metas = Array.isArray(window.dados?.metas) ? window.dados.metas : [];
        const alimentos = Array.isArray(window.dados?.alimentos) ? window.dados.alimentos : [];
        
        const alimentosPeriodo = this.filtrarPorPeriodo(alimentos, dataInicio, dataFim);
        
        let alimentosBons = 0;
        let alimentosRuins = 0;
        
        alimentosPeriodo.forEach(alimento => {
            const classificacao = this.classificarAlimento(alimento);
            if (classificacao === 'bom') alimentosBons++;
            if (classificacao === 'ruim') alimentosRuins++;
        });
        
        return {
            metasAlcancadas: metas.filter(meta => meta.concluida).length,
            metasPendentes: metas.filter(meta => !meta.concluida).length,
            alimentosBons,
            alimentosRuins
        };
    }

    atualizarLegenda(distribuicao, total, resumo) {
        const legenda = document.getElementById('pizza-legenda');
        if (!legenda) return;
        
        const calcPercentual = (valor) => {
            return total > 0 ? ((valor / total) * 100).toFixed(1) : 0;
        };
        
        const html = `
            <div class="legenda-pizza-item">
                <div class="legenda-pizza-cor" style="background: #4cc9f0;"></div>
                <div class="legenda-pizza-info">
                    <strong>Hipoglicemia</strong>
                    <span>${distribuicao.hipoglicemias} registros (${calcPercentual(distribuicao.hipoglicemias)}%)</span>
                </div>
            </div>
            <div class="legenda-pizza-item">
                <div class="legenda-pizza-cor" style="background: #2ecc71;"></div>
                <div class="legenda-pizza-info">
                    <strong>Normal</strong>
                    <span>${distribuicao.normais} registros (${calcPercentual(distribuicao.normais)}%)</span>
                </div>
            </div>
            <div class="legenda-pizza-item">
                <div class="legenda-pizza-cor" style="background: #e74c3c;"></div>
                <div class="legenda-pizza-info">
                    <strong>Hiperglicemia</strong>
                    <span>${distribuicao.hiperglicemias} registros (${calcPercentual(distribuicao.hiperglicemias)}%)</span>
                </div>
            </div>
            <div class="legenda-pizza-item">
                <div class="legenda-pizza-cor" style="background: #4361ee;"></div>
                <div class="legenda-pizza-info">
                    <strong>Metas alcançadas</strong>
                    <span>${resumo.metasAlcancadas} meta(s)</span>
                </div>
            </div>
            <div class="legenda-pizza-item">
                <div class="legenda-pizza-cor" style="background: #f39c12;"></div>
                <div class="legenda-pizza-info">
                    <strong>Metas pendentes</strong>
                    <span>${resumo.metasPendentes} meta(s)</span>
                </div>
            </div>
            <div class="legenda-pizza-item">
                <div class="legenda-pizza-cor" style="background: #16a34a;"></div>
                <div class="legenda-pizza-info">
                    <strong>Alimentos bons</strong>
                    <span>${resumo.alimentosBons} registro(s)</span>
                </div>
            </div>
            <div class="legenda-pizza-item">
                <div class="legenda-pizza-cor" style="background: #dc2626;"></div>
                <div class="legenda-pizza-info">
                    <strong>Alimentos ruins</strong>
                    <span>${resumo.alimentosRuins} registro(s)</span>
                </div>
            </div>
        `;
        
        legenda.innerHTML = html;
    }
    
    atualizarResumo(resumo, totalGlicemias) {
        const resumoEl = document.getElementById('pizza-resumo');
        if (!resumoEl) return;
        
        resumoEl.innerHTML = `
            <div class="pizza-resumo-item"><strong>${totalGlicemias}</strong><span>Registros de glicemia</span></div>
            <div class="pizza-resumo-item"><strong>${resumo.metasAlcancadas}</strong><span>Metas alcançadas</span></div>
            <div class="pizza-resumo-item"><strong>${resumo.metasPendentes}</strong><span>Metas pendentes</span></div>
            <div class="pizza-resumo-item"><strong>${resumo.alimentosBons}</strong><span>Alimentos bons</span></div>
            <div class="pizza-resumo-item"><strong>${resumo.alimentosRuins}</strong><span>Alimentos ruins</span></div>
        `;
    }

    obterDadosPizza() {
        const dados = Array.isArray(window.dados?.glicemias) ? window.dados.glicemias : [];
        const filtrados = this.filtrarPorPeriodo(dados, this.dataInicio, this.dataFim);
        const distribuicao = this.calcularDistribuicao(filtrados);
        const resumo = this.calcularResumoGeral(this.dataInicio, this.dataFim);
        
        return {
            hipoglicemias: distribuicao.hipoglicemias,
            normais: distribuicao.normais,
            hiperglicemias: distribuicao.hiperglicemias,
            total: filtrados.length,
            periodoInicio: this.dataInicio,
            periodoFim: this.dataFim,
            metasAlcancadas: resumo.metasAlcancadas,
            metasPendentes: resumo.metasPendentes,
            alimentosBons: resumo.alimentosBons,
            alimentosRuins: resumo.alimentosRuins
        };
    }
}

// Inicializar ao carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.pizzaSistema = new PizzaSistema();
        window.pizzaSistema.inicializar();
    });
} else {
    window.pizzaSistema = new PizzaSistema();
    window.pizzaSistema.inicializar();
}
