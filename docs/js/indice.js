// js/indice.js - Cálculo de índices glicêmicos
document.addEventListener('DOMContentLoaded', function() {
    const formIndice = document.getElementById('form-indice');
    const resultadoIndice = document.getElementById('resultado-indice');
    const filtroPeriodo = document.getElementById('filtro-periodo-indice');
    const blocoPersonalizado = document.getElementById('periodo-indice-personalizado');
    const btnCalcularIndice = document.getElementById('btn-calcular-indice');
    const inputInicio = document.getElementById('indice-inicio');
    const inputFim = document.getElementById('indice-fim');

    let modoPersonalizado = false;

    function obterRegistrosPeriodo(inicioStr, fimStr) {
        if (!window.dados?.glicemias || !inicioStr || !fimStr) return [];

        const inicio = new Date(`${inicioStr}T00:00:00`);
        const fim = new Date(`${fimStr}T23:59:59`);

        return window.dados.glicemias
            .filter(g => {
                const dataRegistro = g.timestamp ? new Date(g.timestamp) : new Date(`${g.data}T${g.hora || '00:00'}`);
                if (Number.isNaN(dataRegistro.getTime())) return false;
                return dataRegistro >= inicio && dataRegistro <= fim;
            })
            .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    }

    function diasEntre(inicioStr, fimStr) {
        const inicio = new Date(`${inicioStr}T00:00:00`);
        const fim = new Date(`${fimStr}T00:00:00`);
        return Math.max(1, Math.floor((fim - inicio) / (1000 * 60 * 60 * 24)) + 1);
    }

    function definirIntervalo(periodoDias) {
        const fim = new Date();
        const inicio = new Date();
        inicio.setDate(inicio.getDate() - (periodoDias - 1));

        const inicioStr = inicio.toISOString().split('T')[0];
        const fimStr = fim.toISOString().split('T')[0];

        if (inputInicio) inputInicio.value = inicioStr;
        if (inputFim) inputFim.value = fimStr;

        return { inicioStr, fimStr };
    }

    function calcularIndicePeriodo(periodoDias) {
        const { inicioStr, fimStr } = definirIntervalo(periodoDias);
        const glicemiasPeriodo = obterRegistrosPeriodo(inicioStr, fimStr);
        return calcularEstatisticasIndice(glicemiasPeriodo, diasEntre(inicioStr, fimStr));
    }

    function alternarModoPersonalizado(ativo) {
        modoPersonalizado = ativo;

        if (blocoPersonalizado) {
            blocoPersonalizado.style.display = ativo ? 'grid' : 'none';
        }

        if (btnCalcularIndice) {
            btnCalcularIndice.style.display = ativo ? 'inline-flex' : 'none';
        }

        if (inputInicio) inputInicio.required = ativo;
        if (inputFim) inputFim.required = ativo;
    }

    function calcularEstatisticasIndice(glicemias, periodoDias) {
        if (!glicemias || glicemias.length === 0) {
            return {
                periodo: periodoDias,
                totalRegistros: 0,
                media: 0,
                desvioPadrao: 0,
                maxima: 0,
                minima: 0,
                dentroAlvo: 0,
                percentualAlvo: 0,
                variabilidade: 0,
                tendencia: 'estável',
                classificacao: 'sem dados',
                recomendacoes: ['Nenhum registro encontrado no período selecionado.']
            };
        }

        const valores = glicemias.map(g => g.glicemia);
        const media = valores.reduce((a, b) => a + b, 0) / valores.length;
        const maxima = Math.max(...valores);
        const minima = Math.min(...valores);

        const desvio = Math.sqrt(
            valores.reduce((sq, n) => sq + Math.pow(n - media, 2), 0) / valores.length
        );

        const dentroAlvo = glicemias.filter(g => g.glicemia >= 70 && g.glicemia <= 180).length;
        const percentualAlvo = (dentroAlvo / glicemias.length * 100).toFixed(1);

        const variabilidade = calcularVariabilidadeGlicemica(glicemias);
        const tendencia = determinarTendencia(glicemias);
        const classificacao = classificarControle(media, percentualAlvo, variabilidade);
        const recomendacoes = gerarRecomendacoes(media, percentualAlvo, variabilidade, glicemias);

        return {
            periodo: periodoDias,
            totalRegistros: glicemias.length,
            media: parseFloat(media.toFixed(1)),
            desvioPadrao: parseFloat(desvio.toFixed(1)),
            maxima,
            minima,
            dentroAlvo,
            percentualAlvo,
            variabilidade: parseFloat(variabilidade.toFixed(1)),
            tendencia,
            classificacao,
            recomendacoes
        };
    }

    function calcularVariabilidadeGlicemica(glicemias) {
        if (glicemias.length < 2) return 0;

        const valores = glicemias.map(g => g.glicemia);
        const media = valores.reduce((a, b) => a + b, 0) / valores.length;
        const desvios = valores.map(v => Math.pow(v - media, 2));
        const variancia = desvios.reduce((a, b) => a + b, 0) / valores.length;
        return Math.sqrt(variancia);
    }

    function determinarTendencia(glicemias) {
        if (glicemias.length < 3) return 'estável';

        const tamanhoGrupo = Math.max(1, Math.floor(glicemias.length / 3));
        const primeiros = glicemias.slice(0, tamanhoGrupo);
        const ultimos = glicemias.slice(-tamanhoGrupo);

        const mediaInicial = primeiros.reduce((a, b) => a + b.glicemia, 0) / primeiros.length;
        const mediaFinal = ultimos.reduce((a, b) => a + b.glicemia, 0) / ultimos.length;
        const diferenca = mediaFinal - mediaInicial;

        if (diferenca > 15) return 'crescendo 📈';
        if (diferenca < -15) return 'decrescendo 📉';
        return 'estável →';
    }

    function classificarControle(media, percentualAlvo, variabilidade) {
        if (percentualAlvo >= 70 && media <= 154 && variabilidade <= 36) {
            return 'Excelente 👑';
        } else if (percentualAlvo >= 50 && media <= 180 && variabilidade <= 50) {
            return 'Bom 👍';
        } else if (percentualAlvo >= 30 && media <= 200 && variabilidade <= 70) {
            return 'Regular ⚠️';
        } else {
            return 'Precisa de Ajuste 🚨';
        }
    }

    function gerarRecomendacoes(media, percentualAlvo, variabilidade, glicemias) {
        const recomendacoes = [];

        if (media > 180) {
            recomendacoes.push('Considere ajustar a medicação ou dieta para reduzir a glicemia média');
        } else if (media < 70) {
            recomendacoes.push('Atenção: risco de hipoglicemia. Avalie necessidade de reduzir medicação');
        }

        if (percentualAlvo < 50) {
            recomendacoes.push('Aumente o monitoramento para identificar padrões de variação');
        }

        if (variabilidade > 50) {
            recomendacoes.push('Alta variabilidade: tente manter horários regulares de refeições e medicação');
        }

        const hipoglicemias = glicemias.filter(g => g.glicemia < 70).length;
        if (hipoglicemias > 0) {
            recomendacoes.push(`${hipoglicemias} episódio(s) de hipoglicemia registrado(s). Fique atento aos sintomas`);
        }

        recomendacoes.push('Continue monitorando regularmente');
        recomendacoes.push('Compartilhe esses dados com seu médico na próxima consulta');
        return recomendacoes;
    }

    function atualizarResultadoIndice(estatisticas) {
        if (!resultadoIndice) return;

        const cores = {
            'Excelente 👑': '#2ecc71',
            'Bom 👍': '#3498db',
            'Regular ⚠️': '#f39c12',
            'Precisa de Ajuste 🚨': '#e74c3c',
            'sem dados': '#95a5a6'
        };

        const corClassificacao = cores[estatisticas.classificacao] || '#95a5a6';

        resultadoIndice.innerHTML = `
            <div class="indice-header">
                <h3>Resultado do Índice Glicêmico</h3>
                <span class="periodo-info">Período: ${estatisticas.periodo} dias</span>
            </div>
            
            <div class="indice-resumo">
                <div class="classificacao-indice" style="background: ${corClassificacao}">
                    ${estatisticas.classificacao}
                </div>
                
                <div class="estatisticas-indice">
                    <div class="estatistica">
                        <div class="valor">${estatisticas.media}</div>
                        <div class="label">Média (mg/dL)</div>
                    </div>
                    <div class="estatistica">
                        <div class="valor">${estatisticas.percentualAlvo}%</div>
                        <div class="label">Dentro do Alvo</div>
                    </div>
                    <div class="estatistica">
                        <div class="valor">${estatisticas.variabilidade}</div>
                        <div class="label">Variabilidade</div>
                    </div>
                    <div class="estatistica">
                        <div class="valor">${estatisticas.tendencia}</div>
                        <div class="label">Tendência</div>
                    </div>
                </div>
                
                <div class="detalhes-indice">
                    <h4>Detalhes Estatísticos</h4>
                    <table>
                        <tr><td>Total de Registros:</td><td><strong>${estatisticas.totalRegistros}</strong></td></tr>
                        <tr><td>Glicemia Máxima:</td><td><strong>${estatisticas.maxima} mg/dL</strong></td></tr>
                        <tr><td>Glicemia Mínima:</td><td><strong>${estatisticas.minima} mg/dL</strong></td></tr>
                        <tr><td>Desvio Padrão:</td><td><strong>${estatisticas.desvioPadrao}</strong></td></tr>
                    </table>
                </div>
                
                <div class="recomendacoes-indice">
                    <h4>Recomendações</h4>
                    <ul>${estatisticas.recomendacoes.map(rec => `<li>${rec}</li>`).join('')}</ul>
                </div>
                
                <div class="legenda-indice">
                    <p><small>⚠️ Alvo glicêmico: 70-180 mg/dL | Variabilidade ideal: ≤36</small></p>
                </div>
            </div>
        `;
    }

    if (formIndice) {
        definirIntervalo(30);
        alternarModoPersonalizado(false);

        formIndice.addEventListener('submit', function(e) {
            e.preventDefault();

            if (!modoPersonalizado) {
                mostrarNotificacao('Use "Personalizado" para cálculo manual por datas', 'info');
                return;
            }

            const inicio = inputInicio?.value;
            const fim = inputFim?.value;

            if (!inicio || !fim) {
                mostrarNotificacao('Selecione o período para cálculo', 'erro');
                return;
            }

            if (inicio > fim) {
                mostrarNotificacao('A data inicial não pode ser maior que a data final', 'erro');
                return;
            }

            const glicemiasPeriodo = obterRegistrosPeriodo(inicio, fim);
            const estatisticas = calcularEstatisticasIndice(glicemiasPeriodo, diasEntre(inicio, fim));
            atualizarResultadoIndice(estatisticas);
            mostrarNotificacao('Índice personalizado calculado com sucesso!', 'sucesso');
        });
    }

    if (filtroPeriodo) {
        filtroPeriodo.addEventListener('change', function(e) {
            const valor = e.target.value;

            if (valor === 'personalizado') {
                alternarModoPersonalizado(true);
                return;
            }

            const periodo = parseInt(valor, 10);
            if (!Number.isNaN(periodo) && periodo > 0) {
                alternarModoPersonalizado(false);
                const estatisticas = calcularIndicePeriodo(periodo);
                atualizarResultadoIndice(estatisticas);
            }
        });
    }

    setTimeout(() => {
        const estatisticas = calcularIndicePeriodo(30);
        atualizarResultadoIndice(estatisticas);
    }, 200);

    function mostrarNotificacao(mensagem, tipo) {
        const notificacao = document.createElement('div');
        notificacao.className = `notificacao notificacao-${tipo}`;
        notificacao.innerHTML = `
            <i class="fas fa-${tipo === 'sucesso' ? 'check-circle' : tipo === 'erro' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${mensagem}</span>
        `;

        document.body.appendChild(notificacao);

        setTimeout(() => {
            notificacao.classList.add('fade-out');
            setTimeout(() => {
                if (notificacao.parentNode) {
                    notificacao.parentNode.removeChild(notificacao);
                }
            }, 300);
        }, 3000);
    }
});
