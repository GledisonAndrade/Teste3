// js/relatorios.js - versao 2.2 14/04/2026 (com modal para dados do paciente)

class RelatoriosSistema {
    constructor() {
        this.relatorioAtual = null;
        this.graficoRelatorio = null;
        this.bloquearDownload = false;
        this.inicializado = false;
    }

    inicializar() {
        if (this.inicializado) return;
        this.inicializado = true;
        
        this.configurarDatasPadrao();
        this.configurarEventos();
        
        console.log('✅ Sistema de relatórios inicializado');
        
        setTimeout(() => {
            const preview = document.getElementById('previa-relatorio');
            if (preview && preview.innerHTML === '') {
                this.mostrarInstrucaoInicial();
            }
        }, 500);
    }

    configurarDatasPadrao() {
        const fim = new Date();
        const inicio = new Date();
        inicio.setDate(inicio.getDate() - 30);
        
        const inicioInput = document.getElementById('relatorio-periodo-inicio');
        const fimInput = document.getElementById('relatorio-periodo-fim');
        
        if (inicioInput && fimInput) {
            inicioInput.value = inicio.toISOString().split('T')[0];
            fimInput.value = fim.toISOString().split('T')[0];
        }
    }

    configurarEventos() {
        document.querySelectorAll('.periodo-btn').forEach(btn => {
            btn.removeEventListener('click', this.periodoClickHandler);
            this.periodoClickHandler = (e) => {
                e.preventDefault();
                const dias = parseInt(btn.dataset.dias);
                this.configurarPeriodoRapido(dias);
                document.querySelectorAll('.periodo-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            };
            btn.addEventListener('click', this.periodoClickHandler);
        });

        const form = document.getElementById('form-relatorio');
        if (form && !form.hasAttribute('data-listener')) {
            form.setAttribute('data-listener', 'true');
            form.onsubmit = (e) => {
                e.preventDefault();
                this.gerarRelatorio();
            };
        }

        const btnBaixar = document.getElementById('baixar-relatorio-pdf');
        if (btnBaixar && !btnBaixar.hasAttribute('data-listener')) {
            btnBaixar.setAttribute('data-listener', 'true');
            const novoBotao = btnBaixar.cloneNode(true);
            btnBaixar.parentNode.replaceChild(novoBotao, btnBaixar);
            
            novoBotao.onclick = async (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (this.bloquearDownload) {
                    this.mostrarNotificacao('⏳ Download em andamento...', 'info');
                    return;
                }
                if (!this.relatorioAtual) {
                    this.mostrarNotificacao('❌ Gere um relatório primeiro', 'erro');
                    return;
                }
                await this.baixarPDF();
            };
        }
    }

    configurarPeriodoRapido(dias) {
        const fim = new Date();
        const inicio = new Date();
        inicio.setDate(inicio.getDate() - dias);
        
        const inicioInput = document.getElementById('relatorio-periodo-inicio');
        const fimInput = document.getElementById('relatorio-periodo-fim');
        
        if (inicioInput && fimInput) {
            inicioInput.value = inicio.toISOString().split('T')[0];
            fimInput.value = fim.toISOString().split('T')[0];
        }
    }

    mostrarInstrucaoInicial() {
        const container = document.getElementById('previa-relatorio');
        if (!container) return;
        container.innerHTML = `
            <div style="text-align:center; padding:40px;">
                <i class="fas fa-file-medical" style="font-size:64px; color:#4361ee;"></i>
                <h3>Gerar Relatório Médico</h3>
                <p>Configure o período e clique em "Gerar Relatório"</p>
                <div style="background:#e8f4ff; padding:20px; border-radius:10px; margin-top:20px;">
                    <strong>💡 Dica:</strong> Tenha pelo menos 7 dias de registros para melhores análises.
                </div>
            </div>
        `;
    }

    async gerarRelatorio() {
        const inicio = document.getElementById('relatorio-periodo-inicio').value;
        const fim = document.getElementById('relatorio-periodo-fim').value;

        if (!inicio || !fim) {
            this.mostrarNotificacao('Preencha as datas do relatório', 'erro');
            return;
        }

        if (new Date(inicio) > new Date(fim)) {
            this.mostrarNotificacao('Data inicial não pode ser maior que data final', 'erro');
            return;
        }

        this.mostrarLoading(true);

        try {
            const dados = this.obterDadosRelatorio(inicio, fim);
            
            if (dados.length === 0) {
                this.mostrarNotificacao('Nenhum registro encontrado no período selecionado', 'erro');
                this.mostrarLoading(false);
                document.getElementById('previa-relatorio').innerHTML = `<div style="text-align:center; padding:40px;"><i class="fas fa-database" style="font-size:64px; color:#e74c3c;"></i><h3>Nenhum dado encontrado</h3></div>`;
                return;
            }
            
            const stats = this.calcularEstatisticas(dados);
            const tendencia = this.calcularTendencia(dados);
            const horarios = this.analisarPorHorario(dados);
            
            stats.interpretacaoHbA1c = this.interpretarHbA1c(parseFloat(stats.hba1c));
            stats.corHbA1c = this.getCorHbA1c(parseFloat(stats.hba1c));
            
            const html = this.gerarHTMLRelatorioFinal(inicio, fim, dados, stats, tendencia, horarios);
            
            this.relatorioAtual = { inicio, fim, dados, stats, tendencia, horarios };
            document.getElementById('previa-relatorio').innerHTML = html;
            
            await new Promise(r => setTimeout(r, 300));
            this.renderizarGrafico();
            
            const btn = document.getElementById('baixar-relatorio-pdf');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-download"></i> Baixar PDF Completo';
            }
            
            this.mostrarNotificacao('Relatório gerado com sucesso!', 'sucesso');
        } catch (error) {
            console.error('Erro:', error);
            this.mostrarNotificacao('Erro ao gerar relatório', 'erro');
        } finally {
            this.mostrarLoading(false);
        }
    }

    obterDadosRelatorio(inicio, fim) {
        if (!window.dados) {
            window.dados = { glicemias: JSON.parse(localStorage.getItem('glicemias')) || [] };
        }
        return window.dados.glicemias.filter(g => g.data >= inicio && g.data <= fim)
            .sort((a, b) => new Date(`${a.data}T${a.hora}`) - new Date(`${b.data}T${b.hora}`));
    }

    calcularEstatisticas(dados) {
        if (dados.length === 0) return {};
        
        const valores = dados.map(g => g.glicemia);
        const media = valores.reduce((a, b) => a + b, 0) / valores.length;
        const minima = Math.min(...valores);
        const maxima = Math.max(...valores);
        const normais = dados.filter(g => g.glicemia >= 70 && g.glicemia <= 180).length;
        const percentualNormais = (normais / dados.length * 100).toFixed(1);
        const hipoglicemias = dados.filter(g => g.glicemia < 70).length;
        const hiperglicemias = dados.filter(g => g.glicemia > 180).length;
        const desvio = Math.sqrt(valores.reduce((sq, n) => sq + Math.pow(n - media, 2), 0) / valores.length);
        const variabilidade = (desvio / media * 100).toFixed(1);
        
        const jejum = dados.filter(g => { const h = parseInt(g.hora.split(':')[0]); return h >= 5 && h <= 9; });
        const mediaJejum = jejum.length ? jejum.reduce((a,b) => a + b.glicemia, 0) / jejum.length : 0;
        
        const pos = dados.filter(g => { const h = parseInt(g.hora.split(':')[0]); return (h >= 12 && h <= 14) || (h >= 19 && h <= 21); });
        const mediaPos = pos.length ? pos.reduce((a,b) => a + b.glicemia, 0) / pos.length : 0;
        
        const hba1c = (media + 46.7) / 28.7;
        
        return {
            media: media.toFixed(1), minima, maxima, percentualNormais,
            hipoglicemias, hiperglicemias, variabilidade,
            mediaJejum: mediaJejum.toFixed(1), mediaPos: mediaPos.toFixed(1),
            hba1c: hba1c.toFixed(1), total: dados.length, desvio: desvio.toFixed(1)
        };
    }

    interpretarHbA1c(hba1c) {
        if (hba1c < 5.7) return { classificacao: 'Normal', recomendacao: 'Mantenha os hábitos saudáveis.' };
        else if (hba1c < 6.5) return { classificacao: 'Pré-diabetes', recomendacao: 'Considere mudanças no estilo de vida.' };
        else if (hba1c < 7.0) return { classificacao: 'Diabetes - Na Meta', recomendacao: 'Continue com o tratamento atual.' };
        else if (hba1c < 8.0) return { classificacao: 'Diabetes - Regular', recomendacao: 'Consulte seu médico para ajustes.' };
        else return { classificacao: 'Diabetes - Inadequado', recomendacao: 'Procure seu médico urgentemente.' };
    }

    getCorHbA1c(hba1c) {
        if (hba1c < 5.7) return '#2ecc71';
        if (hba1c < 6.5) return '#f39c12';
        if (hba1c < 7.0) return '#3498db';
        if (hba1c < 8.0) return '#e67e22';
        return '#e74c3c';
    }

    calcularTendencia(dados) {
        if (dados.length < 3) return { direcao: 'estavel', variacao: 0 };
        const meio = Math.floor(dados.length / 2);
        const prim = dados.slice(0, meio);
        const seg = dados.slice(-meio);
        const m1 = prim.reduce((a,b) => a + b.glicemia, 0) / prim.length;
        const m2 = seg.reduce((a,b) => a + b.glicemia, 0) / seg.length;
        const varPct = ((m2 - m1) / m1 * 100).toFixed(1);
        let direcao = 'estavel';
        if (varPct > 10) direcao = 'crescendo';
        else if (varPct < -10) direcao = 'diminuindo';
        return { direcao, variacao: varPct };
    }

    analisarPorHorario(dados) {
        const grupos = { manha: [], tarde: [], noite: [], madrugada: [] };
        dados.forEach(g => {
            const h = parseInt(g.hora.split(':')[0]);
            if (h >= 5 && h < 12) grupos.manha.push(g.glicemia);
            else if (h >= 12 && h < 18) grupos.tarde.push(g.glicemia);
            else if (h >= 18 && h < 24) grupos.noite.push(g.glicemia);
            else grupos.madrugada.push(g.glicemia);
        });
        
        const nomes = { manha: '🌅 Manhã', tarde: '☀️ Tarde', noite: '🌙 Noite', madrugada: '🌃 Madrugada' };
        const resultado = {};
        for (const [key, valores] of Object.entries(grupos)) {
            const media = valores.length ? (valores.reduce((a,b) => a + b, 0) / valores.length).toFixed(1) : 0;
            resultado[key] = { nome: nomes[key], media, total: valores.length };
        }
        return resultado;
    }

    calcularIdade(dataNascimento) {
        if (!dataNascimento) return null;
        const hoje = new Date();
        const nasc = new Date(dataNascimento);
        let idade = hoje.getFullYear() - nasc.getFullYear();
        const mes = hoje.getMonth() - nasc.getMonth();
        if (mes < 0 || (mes === 0 && hoje.getDate() < nasc.getDate())) {
            idade--;
        }
        return idade;
    }
    
    calcularDadosPizza(dados) {
        const base = Array.isArray(dados) ? dados : [];
        
        const resultado = {
            hipoglicemias: 0,
            normais: 0,
            hiperglicemias: 0,
            total: base.length
        };
        
        base.forEach(registro => {
            const glicemia = Number(registro.glicemia);
            if (Number.isNaN(glicemia)) return;
            
            if (glicemia < 70) resultado.hipoglicemias++;
            else if (glicemia <= 180) resultado.normais++;
            else resultado.hiperglicemias++;
        });
        
        return resultado;
    }

    gerarHTMLRelatorioFinal(inicio, fim, dados, stats, tendencia, horarios) {
        const hoje = new Date().toLocaleDateString('pt-BR');
        const diasPeriodo = Math.ceil((new Date(fim) - new Date(inicio)) / (1000 * 60 * 60 * 24));
        const registrosOrdenados = [...dados].sort((a, b) => new Date(`${b.data}T${b.hora}`) - new Date(`${a.data}T${a.hora}`));
        const ultimos30 = registrosOrdenados.slice(0, 30);
        const nomePaciente = localStorage.getItem('nomePaciente') || 'Paciente';
        
        const dataNascimento = localStorage.getItem('dataNascimento');
        const idade = dataNascimento ? this.calcularIdade(dataNascimento) : null;
        
        const corTendencia = tendencia.direcao === 'crescendo' ? '#e74c3c' : (tendencia.direcao === 'diminuindo' ? '#3498db' : '#95a5a6');
        
        // Dados da distribuição no mesmo período do relatório
        const dadosPizza = this.calcularDadosPizza(dados);
        
        return `
        <div id="conteudo-pdf" style="font-family: Arial, Helvetica, sans-serif; width: 800px; margin: 0 auto; background: #ffffff; color: #1f2937; padding: 20px; box-sizing: border-box; border-radius: 14px; box-shadow: 0 10px 22px rgba(15, 23, 42, 0.08);">
            
            <!-- CABEÇALHO -->
            <div style="margin-bottom: 20px; border-bottom: 2px solid #4361ee; padding-bottom: 15px;">
                <div style="display: table; width: 100%;">
                    <div style="display: table-row;">
                        <div style="display: table-cell; vertical-align: middle;">
                            <span style="font-size: 32px;">🩺</span>
                            <h1 style="display: inline; color: #2c3e50; margin: 0 0 0 10px; font-size: 28px;">DiabetesCare</h1>
                            <p style="color: #666; margin: 2px 0 0;">Relatório de Monitoramento Glicêmico</p>
                        </div>
                        <div style="display: table-cell; text-align: right; vertical-align: middle;">
                            <p style="margin: 0; font-weight: bold;">${nomePaciente}${idade ? `, ${idade} anos` : ''}</p>
                            <p style="margin: 2px 0; font-size: 14px;">Período: ${this.formatarData(inicio)} - ${this.formatarData(fim)}</p>
                            <p style="margin: 2px 0; font-size: 14px;">Gerado: ${hoje} | Registros: ${stats.total}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- CARDS -->
            <div style="margin-bottom: 25px;">
                <div style="display: table; width: 100%;">
                    <div style="display: table-row;">
                        <div style="display: table-cell; padding: 0 6px 0 0; width: 25%;">
                            <div style="background-color: #4361ee; color: white; padding: 12px; border-radius: 10px;">
                                <div style="font-size: 12px;">HbA1c Estimada</div>
                                <div style="font-size: 28px; font-weight: bold; margin: 5px 0;">${stats.hba1c}%</div>
                                <div style="font-size: 11px;">${stats.interpretacaoHbA1c.classificacao}</div>
                            </div>
                        </div>
                        <div style="display: table-cell; padding: 0 6px; width: 25%;">
                            <div style="background-color: #2ecc71; color: white; padding: 12px; border-radius: 10px;">
                                <div style="font-size: 12px;">Tempo no Alvo</div>
                                <div style="font-size: 28px; font-weight: bold; margin: 5px 0;">${stats.percentualNormais}%</div>
                                <div style="font-size: 11px;">70-180 mg/dL</div>
                            </div>
                        </div>
                        <div style="display: table-cell; padding: 0 6px; width: 25%;">
                            <div style="background-color: #f39c12; color: white; padding: 12px; border-radius: 10px;">
                                <div style="font-size: 12px;">Variabilidade</div>
                                <div style="font-size: 28px; font-weight: bold; margin: 5px 0;">${stats.variabilidade}%</div>
                                <div style="font-size: 11px;">${stats.variabilidade > 30 ? 'Alta' : 'Normal'}</div>
                            </div>
                        </div>
                        <div style="display: table-cell; padding: 0 0 0 6px; width: 25%;">
                            <div style="background-color: ${corTendencia}; color: white; padding: 12px; border-radius: 10px;">
                                <div style="font-size: 12px;">Tendência</div>
                                <div style="font-size: 28px; font-weight: bold; margin: 5px 0;">${tendencia.direcao === 'crescendo' ? '↑' : tendencia.direcao === 'diminuindo' ? '↓' : '→'} ${tendencia.variacao}%</div>
                                <div style="font-size: 11px;">${tendencia.direcao === 'crescendo' ? 'Em alta' : tendencia.direcao === 'diminuindo' ? 'Em queda' : 'Estável'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- GRÁFICO LINHA -->
            <div style="margin-bottom: 25px; padding: 15px; background: #f8f9fa; border-radius: 10px; border: 1px solid #ddd;">
                <h3 style="margin: 0 0 15px 0; color: #2c3e50;">📊 Evolução Glicêmica</h3>
                <div style="height: 280px;">
                    <canvas id="grafico-relatorio-canvas" width="750" height="280" style="width: 100%; height: 100%; display: block;"></canvas>
                </div>
                <div style="display: flex; justify-content: center; gap: 20px; margin-top: 10px; font-size: 11px;">
                    <div><span style="background: #4cc9f0; display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-right: 5px;"></span> Hipoglicemia (<70)</div>
                    <div><span style="background: #2ecc71; display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-right: 5px;"></span> Normal (70-180)</div>
                    <div><span style="background: #e74c3c; display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-right: 5px;"></span> Hiperglicemia (>180)</div>
                </div>
            </div>
            
            <!-- GRÁFICO PIZZA (DISTRIBUIÇÃO) -->
            <div style="margin-bottom: 25px; padding: 15px; background: #f8f9fa; border-radius: 10px; border: 1px solid #ddd;">
                <h3 style="margin: 0 0 15px 0; color: #2c3e50;">🍰 Distribuição de Glicemia</h3>
                <div style="height: 250px;">
                    <canvas id="grafico-pizza-relatorio" width="750" height="250" style="width: 100%; height: 100%; display: block;"></canvas>
                </div>
                <div style="margin-top: 15px; display: table; width: 100%;">
                    <div style="display: table-row;">
                        <div style="display: table-cell; width: 33%; text-align: center; padding: 8px;">
                            <div style="font-size: 24px; font-weight: bold; color: #4cc9f0;">${dadosPizza.hipoglicemias}</div>
                            <div style="font-size: 11px; color: #666;">Hipoglicemia</div>
                            <div style="font-size: 10px; color: #999;">${dadosPizza.total > 0 ? ((dadosPizza.hipoglicemias / dadosPizza.total) * 100).toFixed(1) : 0}%</div>
                        </div>
                        <div style="display: table-cell; width: 33%; text-align: center; padding: 8px;">
                            <div style="font-size: 24px; font-weight: bold; color: #2ecc71;">${dadosPizza.normais}</div>
                            <div style="font-size: 11px; color: #666;">Normal</div>
                            <div style="font-size: 10px; color: #999;">${dadosPizza.total > 0 ? ((dadosPizza.normais / dadosPizza.total) * 100).toFixed(1) : 0}%</div>
                        </div>
                        <div style="display: table-cell; width: 33%; text-align: center; padding: 8px;">
                            <div style="font-size: 24px; font-weight: bold; color: #e74c3c;">${dadosPizza.hiperglicemias}</div>
                            <div style="font-size: 11px; color: #666;">Hiperglicemia</div>
                            <div style="font-size: 10px; color: #999;">${dadosPizza.total > 0 ? ((dadosPizza.hiperglicemias / dadosPizza.total) * 100).toFixed(1) : 0}%</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- ANÁLISE POR HORÁRIO -->
            
            <!-- ANÁLISE ESTATÍSTICA -->
            <div style="margin-bottom: 25px;">
                <h3 style="color: #2c3e50; margin-bottom: 10px;">📋 Análise Estatística</h3>
                <table style="width: 100%; border-collapse: collapse; background: white; border: 1px solid #ccc; font-size: 13px;">
                    <thead>
                        <tr style="background: #e9ecef; border-bottom: 2px solid #adb5bd;">
                            <th style="padding: 8px; text-align: left; border-right: 1px solid #ccc;">Parâmetro</th>
                            <th style="padding: 8px; text-align: left; border-right: 1px solid #ccc;">Valor</th>
                            <th style="padding: 8px; text-align: left;">Interpretação</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td style="padding: 6px 8px; border-bottom: 1px solid #ddd; border-right: 1px solid #ccc;">Glicemia Mínima</td><td style="padding: 6px 8px; border-bottom: 1px solid #ddd; border-right: 1px solid #ccc;">${stats.minima} mg/dL</td><td style="padding: 6px 8px; border-bottom: 1px solid #ddd;">${stats.minima < 70 ? '⚠️ Abaixo do ideal' : 'Dentro do esperado'}</td></tr>
                        <tr style="background: #f8f9fa;"><td style="padding: 6px 8px; border-bottom: 1px solid #ddd; border-right: 1px solid #ccc;">Glicemia Máxima</td><td style="padding: 6px 8px; border-bottom: 1px solid #ddd; border-right: 1px solid #ccc;">${stats.maxima} mg/dL</td><td style="padding: 6px 8px; border-bottom: 1px solid #ddd;">${stats.maxima > 180 ? '⚠️ Acima do ideal' : 'Dentro do esperado'}</td></tr>
                        <tr><td style="padding: 6px 8px; border-bottom: 1px solid #ddd; border-right: 1px solid #ccc;">Desvio Padrão</td><td style="padding: 6px 8px; border-bottom: 1px solid #ddd; border-right: 1px solid #ccc;">${stats.desvio} mg/dL</td><td style="padding: 6px 8px; border-bottom: 1px solid #ddd;">Medida de dispersão</td></tr>
                        <tr style="background: #f8f9fa;"><td style="padding: 6px 8px; border-bottom: 1px solid #ddd; border-right: 1px solid #ccc;">Hipoglicemias</td><td style="padding: 6px 8px; border-bottom: 1px solid #ddd; border-right: 1px solid #ccc;">${stats.hipoglicemias}</td><td style="padding: 6px 8px; border-bottom: 1px solid #ddd;">${stats.hipoglicemias > 0 ? '⚠️ Atenção' : 'Nenhum episódio'}</td></tr>
                        <tr><td style="padding: 6px 8px; border-bottom: 1px solid #ddd; border-right: 1px solid #ccc;">Hiperglicemias</td><td style="padding: 6px 8px; border-bottom: 1px solid #ddd; border-right: 1px solid #ccc;">${stats.hiperglicemias}</td><td style="padding: 6px 8px; border-bottom: 1px solid #ddd;">${stats.hiperglicemias > 0 ? '⚠️ Episódios de alta' : 'Nenhum episódio'}</td></tr>
                        <tr style="background: #f8f9fa;"><td style="padding: 6px 8px; border-bottom: 1px solid #ddd; border-right: 1px solid #ccc;">Média Jejum</td><td style="padding: 6px 8px; border-bottom: 1px solid #ddd; border-right: 1px solid #ccc;">${stats.mediaJejum > 0 ? stats.mediaJejum + ' mg/dL' : 'N/A'}</td><td style="padding: 6px 8px; border-bottom: 1px solid #ddd;">${stats.mediaJejum > 130 ? '⚠️ Elevada' : 'Normal'}</td></tr>
                        <tr><td style="padding: 6px 8px; border-bottom: 1px solid #ddd; border-right: 1px solid #ccc;">Média Pós-Prandial</td><td style="padding: 6px 8px; border-bottom: 1px solid #ddd; border-right: 1px solid #ccc;">${stats.mediaPos > 0 ? stats.mediaPos + ' mg/dL' : 'N/A'}</td><td style="padding: 6px 8px; border-bottom: 1px solid #ddd;">${stats.mediaPos > 180 ? '⚠️ Elevada' : 'Normal'}</td></tr>
                        <tr style="background: #f8f9fa;"><td style="padding: 6px 8px; border-right: 1px solid #ccc;">Frequência de medição</td><td style="padding: 6px 8px; border-right: 1px solid #ccc;">${(stats.total / diasPeriodo).toFixed(1)}/dia</td><td>${(stats.total / diasPeriodo) >= 2 ? '✅ Boa' : '⚠️ Baixa'}</td></tr>
                    </tbody>
                </table>
            </div>
            
            <!-- MÉDIA POR PERÍODO -->
            <div style="margin-bottom: 25px;">
                <h3 style="color: #2c3e50; margin-bottom: 10px;">⏰ Média por Período do Dia</h3>
                <div style="display: table; width: 100%;">
                    <div style="display: table-row;">
                        ${Object.values(horarios).map(h => `
                            <div style="display: table-cell; padding: 0 6px; width: 25%;">
                                <div style="background: #f1f3f5; border: 1px solid #ccc; border-radius: 8px; padding: 10px; text-align: center;">
                                    <div style="font-weight: bold; margin-bottom: 5px;">${h.nome}</div>
                                    <div style="font-size: 20px; font-weight: bold; color: ${h.media > 180 ? '#e74c3c' : '#333'};">${h.media > 0 ? h.media + ' mg/dL' : '—'}</div>
                                    <div style="font-size: 11px; color: #666;">${h.total} registro(s)</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <!-- REGISTROS -->
            <div style="margin-bottom: 25px;">
                <h3 style="color: #2c3e50; margin-bottom: 10px;">📝 Últimos Registros (${ultimos30.length})</h3>
                <table style="width: 100%; border-collapse: collapse; background: white; border: 1px solid #ccc; font-size: 12px;">
                    <thead>
                        <tr style="background: #e9ecef; border-bottom: 2px solid #adb5bd;">
                            <th style="padding: 6px; text-align: left; border-right: 1px solid #ccc;">Data</th>
                            <th style="padding: 6px; text-align: left; border-right: 1px solid #ccc;">Hora</th>
                            <th style="padding: 6px; text-align: left; border-right: 1px solid #ccc;">Glicemia</th>
                            <th style="padding: 6px; text-align: left; border-right: 1px solid #ccc;">Status</th>
                            <th style="padding: 6px; text-align: left;">Observação</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${ultimos30.map((r, i) => `
                            <tr style="border-bottom: 1px solid #ddd; ${i % 2 === 0 ? '' : 'background: #f8f9fa;'}">
                                <td style="padding: 5px 6px; border-right: 1px solid #ccc;">${this.formatarData(r.data)}</td>
                                <td style="padding: 5px 6px; border-right: 1px solid #ccc;">${r.hora}</td>
                                <td style="padding: 5px 6px; border-right: 1px solid #ccc; font-weight: bold;">${r.glicemia}</td>
                                <td style="padding: 5px 6px; border-right: 1px solid #ccc;"><span style="background: ${r.glicemia < 70 ? '#4cc9f0' : r.glicemia <= 180 ? '#2ecc71' : '#e74c3c'}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 10px;">${r.glicemia < 70 ? 'Baixa' : r.glicemia <= 180 ? 'Normal' : 'Alta'}</span></td>
                                <td style="padding: 5px 6px;">${r.observacao || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                ${stats.total > 30 ? `<p style="text-align: center; font-size: 11px; color: #666; margin-top: 5px;">* Exibindo 30 de ${stats.total} registros</p>` : ''}
            </div>
            
            <!-- RECOMENDAÇÕES -->
            <div style="margin-bottom: 25px; display: table; width: 100%;">
                <div style="display: table-row;">
                    <div style="display: table-cell; width: 50%; padding-right: 10px;">
                        <div style="background: #fff5f5; border-left: 4px solid #e74c3c; padding: 12px; border-radius: 6px;">
                            <h4 style="margin: 0 0 10px 0; color: #c0392b;">🔴 Ações Imediatas</h4>
                            <ul style="margin: 0; padding-left: 30px; line-height: 1.5;">
                                ${this.gerarRecomendacoesUrgentes(stats, tendencia)}
                            </ul>
                        </div>
                    </div>
                    <div style="display: table-cell; width: 50%; padding-left: 10px;">
                        <div style="background: #f0fdf4; border-left: 4px solid #2ecc71; padding: 12px; border-radius: 6px;">
                            <h4 style="margin: 0 0 10px 0; color: #27ae60;">✅ Manutenção</h4>
                            <ul style="margin: 0; padding-left: 30px; line-height: 1.5;">
                                ${this.gerarRecomendacoesManutencao(stats)}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- RESUMO MÉDICO -->
            <div style="margin-bottom: 20px; padding: 15px; background: #eef2ff; border: 1px solid #bdd3ff; border-radius: 10px;">
                <h3 style="margin: 0 0 15px 0; color: #1e3a8a;">👨‍⚕️ Resumo para o Médico</h3>
                <div style="display: table; width: 100%;">
                    <div style="display: table-row;">
                        <div style="display: table-cell; width: 33%; padding: 4px;"><strong>Paciente:</strong> ${nomePaciente}${idade ? ` (${idade} anos)` : ''}</div>
                        <div style="display: table-cell; width: 33%; padding: 4px;"><strong>Período:</strong> ${diasPeriodo} dias</div>
                        <div style="display: table-cell; width: 33%; padding: 4px;"><strong>Frequência:</strong> ${(stats.total / diasPeriodo).toFixed(1)}/dia</div>
                    </div>
                    <div style="display: table-row;">
                        <div style="display: table-cell; padding: 4px;"><strong>HbA1c estimada:</strong> ${stats.hba1c}% (${stats.interpretacaoHbA1c.classificacao})</div>
                        <div style="display: table-cell; padding: 4px;"><strong>Tempo no alvo:</strong> ${stats.percentualNormais}%</div>
                        <div style="display: table-cell; padding: 4px;"><strong>Variabilidade:</strong> ${stats.variabilidade}%</div>
                    </div>
                    <div style="display: table-row;">
                        <div style="display: table-cell; padding: 4px;"><strong>Hipoglicemias:</strong> ${stats.hipoglicemias}</div>
                        <div style="display: table-cell; padding: 4px;"><strong>Hiperglicemias:</strong> ${stats.hiperglicemias}</div>
                        <div style="display: table-cell; padding: 4px;"><strong>Tendência:</strong> ${tendencia.direcao === 'crescendo' ? 'Alta' : tendencia.direcao === 'diminuindo' ? 'Queda' : 'Estável'}</div>
                    </div>
                </div>
                <p style="margin-top: 15px; font-style: italic; color: #1e40af;">🔍 Avaliar necessidade de ajuste terapêutico devido à tendência de alta e episódios de hiperglicemia.</p>
            </div>
            
            <!-- RODAPÉ -->
            <div style="text-align: center; font-size: 10px; color: #999; margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd;">
                <p>DiabetesCare - Sistema de Monitoramento Glicêmico | Relatório gerado em ${hoje}</p>
                <p>Desenvolvido por Gledison Arruda Andrade | saudetec@gmail.com</p>
            </div>
        </div>
        `;
    }

    gerarRecomendacoesUrgentes(stats, tendencia) {
        const rec = [];
        if (stats.hiperglicemias > 0) rec.push(`<li><strong>Hiperglicemia detectada (${stats.hiperglicemias} episódio(s))</strong> - Avaliar ajuste terapêutico.</li>`);
        if (tendencia.direcao === 'crescendo') rec.push('<li><strong>Tendência de alta</strong> - Agende consulta para revisão do plano.</li>');
        if (stats.hipoglicemias > 0) rec.push(`<li><strong>Hipoglicemia (${stats.hipoglicemias} episódio(s))</strong> - Revisar doses e horários das refeições.</li>`);
        if (stats.mediaJejum > 130) rec.push('<li><strong>Glicemia de jejum elevada</strong> - Avaliar medicação noturna.</li>');
        if (rec.length === 0) rec.push('<li>✅ Nenhuma ação urgente necessária no momento.</li>');
        return rec.join('');
    }

    gerarRecomendacoesManutencao(stats) {
        const rec = [];
        if (stats.percentualNormais >= 70) rec.push('<li>👍 Bom controle glicêmico - Continue com o tratamento atual.</li>');
        else rec.push('<li>📊 Aumente a frequência de monitoramento para identificar padrões.</li>');
        if (stats.variabilidade > 30) rec.push('<li>🔄 Alta variabilidade - Mantenha horários regulares de refeições e atividades.</li>');
        rec.push('<li>🏥 Mantenha consultas periódicas com endocrinologista.</li>');
        rec.push('<li>📱 Continue registrando suas medições para análises mais precisas.</li>');
        return rec.join('');
    }

    formatarData(data) {
        if (!data) return '';
        const [ano, mes, dia] = data.split('-');
        return `${dia}/${mes}/${ano}`;
    }

    renderizarGrafico() {
        const canvas = document.getElementById('grafico-relatorio-canvas');
        if (!canvas || !this.relatorioAtual) return;
        
        const dados = this.relatorioAtual.dados;
        if (!dados || dados.length === 0) return;
        
        const dadosOrdenados = [...dados].sort((a, b) => new Date(`${a.data}T${a.hora}`) - new Date(`${b.data}T${b.hora}`));
        const labels = dadosOrdenados.map(g => `${g.data.slice(5)} ${g.hora.slice(0,5)}`);
        const valores = dadosOrdenados.map(g => g.glicemia);
        const cores = valores.map(v => v < 70 ? '#4cc9f0' : v <= 180 ? '#2ecc71' : '#e74c3c');
        
        if (this.graficoRelatorio) this.graficoRelatorio.destroy();
        
        this.graficoRelatorio = new Chart(canvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Glicemia (mg/dL)',
                    data: valores,
                    borderColor: '#4361ee',
                    backgroundColor: 'rgba(67, 97, 238, 0.05)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true,
                    pointBackgroundColor: cores,
                    pointBorderColor: '#fff',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBorderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: { callbacks: { label: (ctx) => `Glicemia: ${ctx.parsed.y} mg/dL` } },
                    legend: { display: false }
                },
                scales: {
                    y: { 
                        beginAtZero: false,
                        min: 40,
                        max: Math.max(...valores, 250) + 20,
                        ticks: { callback: v => v + ' mg/dL', stepSize: 50 },
                        grid: { color: '#e0e0e0' }
                    },
                    x: { 
                        ticks: { maxRotation: 45, autoSkip: true, maxTicksLimit: 8, font: { size: 9 } },
                        grid: { display: false }
                    }
                }
            }
        });

        // Renderizar gráfico de pizza também
        this.renderizarGraficoPizza();
    }

    renderizarGraficoPizza() {
        const canvas = document.getElementById('grafico-pizza-relatorio');
        if (!canvas) return;

        if (!this.relatorioAtual?.dados) return;
        const dadosPizza = this.calcularDadosPizza(this.relatorioAtual.dados);

        if (this.graficoPizzaRelatorio) this.graficoPizzaRelatorio.destroy();

        this.graficoPizzaRelatorio = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: ['Hipoglicemia (<70)', 'Normal (70-180)', 'Hiperglicemia (>180)'],
                datasets: [{
                    data: [dadosPizza.hipoglicemias, dadosPizza.normais, dadosPizza.hiperglicemias],
                    backgroundColor: ['#4cc9f0', '#2ecc71', '#e74c3c'],
                    borderColor: ['#36a3d9', '#27a745', '#c0392b'],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: { size: 10, weight: 'bold' },
                            padding: 10
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return ` ${value} registros (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // ========== NOVOS MÉTODOS PARA O MODAL ==========

    async baixarPDF() {
        if (this.bloquearDownload) {
            this.mostrarNotificacao('⏳ Download em andamento...', 'info');
            return;
        }
        
        if (!this.relatorioAtual) {
            this.mostrarNotificacao('❌ Gere um relatório primeiro', 'erro');
            return;
        }

        // Coleta/confirma os dados do paciente antes de gerar o PDF
        const dadosPaciente = await this.coletarDadosPaciente();
        if (!dadosPaciente) {
            // Usuário cancelou o modal
            return;
        }

        // Salva no localStorage para uso futuro
        localStorage.setItem('nomePaciente', dadosPaciente.nome);
        localStorage.setItem('dataNascimento', dadosPaciente.dataNascimento);

        // Atualiza o HTML do relatório com os novos dados (se já estiver visível)
        const preview = document.getElementById('previa-relatorio');
        if (preview) {
            const stats = this.relatorioAtual.stats;
            const tendencia = this.relatorioAtual.tendencia;
            const horarios = this.relatorioAtual.horarios;
            const dados = this.relatorioAtual.dados;
            const inicio = this.relatorioAtual.inicio;
            const fim = this.relatorioAtual.fim;
            
            const htmlAtualizado = this.gerarHTMLRelatorioFinal(inicio, fim, dados, stats, tendencia, horarios);
            preview.innerHTML = htmlAtualizado;
            await new Promise(r => setTimeout(r, 300));
            this.renderizarGrafico();
        }

        // Prossegue com a geração do PDF
        this.bloquearDownload = true;
        this.mostrarLoading(true);

        const btn = document.getElementById('baixar-relatorio-pdf');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando PDF...';
        }

        try {
            this.renderizarGrafico();
            await new Promise(r => setTimeout(r, 1000));

            const element = document.getElementById('conteudo-pdf');
            if (!element) throw new Error('Elemento não encontrado');

            if (typeof html2canvas === 'undefined') throw new Error('html2canvas não carregado');

            const scale = 2.5;
            const canvas = await html2canvas(element, {
                scale: scale,
                backgroundColor: '#ffffff',
                logging: false,
                useCORS: true,
                allowTaint: false,
                windowWidth: 800,
                onclone: (clonedDoc) => {
                    const clonedCanvas = clonedDoc.getElementById('grafico-relatorio-canvas');
                    if (clonedCanvas && this.relatorioAtual) {
                        const dados = this.relatorioAtual.dados;
                        const dadosOrdenados = [...dados].sort((a, b) => new Date(`${a.data}T${a.hora}`) - new Date(`${b.data}T${b.hora}`));
                        const labels = dadosOrdenados.map(g => `${g.data.slice(5)} ${g.hora.slice(0,5)}`);
                        const valores = dadosOrdenados.map(g => g.glicemia);
                        const cores = valores.map(v => v < 70 ? '#4cc9f0' : v <= 180 ? '#2ecc71' : '#e74c3c');

                        const ctx = clonedCanvas.getContext('2d');
                        new Chart(ctx, {
                            type: 'line',
                            data: {
                                labels: labels,
                                datasets: [{
                                    label: 'Glicemia (mg/dL)',
                                    data: valores,
                                    borderColor: '#4361ee',
                                    backgroundColor: 'rgba(67, 97, 238, 0.05)',
                                    borderWidth: 2,
                                    tension: 0.3,
                                    fill: true,
                                    pointBackgroundColor: cores,
                                    pointBorderColor: '#fff',
                                    pointRadius: 4,
                                    pointBorderWidth: 1
                                }]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: {
                                    y: {
                                        beginAtZero: false, min: 40, max: Math.max(...valores, 250) + 20,
                                        ticks: { callback: v => v + ' mg/dL' }
                                    },
                                    x: { ticks: { maxRotation: 45, autoSkip: true, maxTicksLimit: 8 } }
                                }
                            }
                        });
                    }
                }
            });

            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', 'a4');

            const pdfWidth = doc.internal.pageSize.getWidth();
            const pdfHeight = doc.internal.pageSize.getHeight();

            const imgProps = doc.getImageProperties(imgData);
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

            let heightLeft = imgHeight;
            let position = 0;
            let pageNum = 1;

            doc.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;

            while (heightLeft > 0 && pageNum < 20) {
                position = heightLeft - imgHeight;
                doc.addPage();
                doc.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                heightLeft -= pdfHeight;
                pageNum++;
            }

            const nomeArquivo = `Relatorio_DiabetesCare_${this.relatorioAtual.inicio.replace(/-/g, '')}_${this.relatorioAtual.fim.replace(/-/g, '')}.pdf`;
            doc.save(nomeArquivo);

            this.mostrarNotificacao(`✅ PDF gerado com sucesso! (${pageNum} página(s))`, 'sucesso');
        } catch (error) {
            console.error('Erro:', error);
            this.mostrarNotificacao('❌ Erro ao gerar PDF: ' + error.message, 'erro');
        } finally {
            this.bloquearDownload = false;
            this.mostrarLoading(false);
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-download"></i> Baixar PDF Completo';
            }
        }
    }

    // Exibe modal para coletar/confirmar dados do paciente
    coletarDadosPaciente() {
        return new Promise((resolve) => {
            // Valores atuais do localStorage
            const nomeSalvo = localStorage.getItem('nomePaciente') || '';
            const nascSalvo = localStorage.getItem('dataNascimento') || '';

            // Cria o overlay do modal
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10002;
            `;

            const modal = document.createElement('div');
            modal.style.cssText = `
                background: white;
                padding: 25px 30px;
                border-radius: 16px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                width: 380px;
                max-width: 90%;
                font-family: Arial, sans-serif;
            `;

            modal.innerHTML = `
                <h2 style="margin: 0 0 10px 0; color: #2c3e50; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-user-circle" style="color: #4361ee;"></i>
                    Dados do Paciente
                </h2>
                <p style="color: #666; margin-bottom: 20px; font-size: 14px;">
                    Preencha seu nome e data de nascimento para incluir no relatório.
                </p>

                <div style="margin-bottom: 18px;">
                    <label style="display: block; font-weight: bold; margin-bottom: 5px; color: #333;">Nome completo</label>
                    <input type="text" id="modal-nome-paciente" placeholder="Ex: João Silva" value="${this.escapeHtml(nomeSalvo)}"
                        style="width: 100%; padding: 10px 12px; border: 1px solid #ccc; border-radius: 8px; font-size: 14px; box-sizing: border-box;">
                </div>

                <div style="margin-bottom: 25px;">
                    <label style="display: block; font-weight: bold; margin-bottom: 5px; color: #333;">Data de nascimento</label>
                    <input type="date" id="modal-data-nascimento" value="${nascSalvo}"
                        style="width: 100%; padding: 10px 12px; border: 1px solid #ccc; border-radius: 8px; font-size: 14px; box-sizing: border-box;">
                    <p style="font-size: 12px; color: #888; margin-top: 5px;">Formato: DD/MM/AAAA</p>
                </div>

                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button id="modal-cancelar" style="
                        padding: 10px 20px;
                        border: 1px solid #ccc;
                        background: white;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: bold;
                        color: #555;
                    ">Cancelar</button>
                    <button id="modal-confirmar" style="
                        padding: 10px 20px;
                        background: #4361ee;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: bold;
                        box-shadow: 0 2px 6px rgba(67, 97, 238, 0.3);
                    ">Confirmar</button>
                </div>
            `;

            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            const nomeInput = document.getElementById('modal-nome-paciente');
            const dataInput = document.getElementById('modal-data-nascimento');
            const btnConfirmar = document.getElementById('modal-confirmar');
            const btnCancelar = document.getElementById('modal-cancelar');

            // Foco no campo nome
            setTimeout(() => nomeInput.focus(), 100);

            const limpar = () => {
                overlay.remove();
            };

            const confirmar = () => {
                const nome = nomeInput.value.trim();
                const dataNasc = dataInput.value;

                if (!nome) {
                    alert('Por favor, informe o nome do paciente.');
                    nomeInput.focus();
                    return;
                }

                // Validação simples da data (não obrigatória, mas se preenchida deve ser válida)
                if (dataNasc) {
                    const data = new Date(dataNasc);
                    if (isNaN(data.getTime())) {
                        alert('Data de nascimento inválida.');
                        dataInput.focus();
                        return;
                    }
                    // Data não pode ser futura
                    if (data > new Date()) {
                        alert('A data de nascimento não pode ser no futuro.');
                        dataInput.focus();
                        return;
                    }
                }

                limpar();
                resolve({ nome, dataNascimento: dataNasc });
            };

            btnConfirmar.addEventListener('click', confirmar);
            btnCancelar.addEventListener('click', () => {
                limpar();
                resolve(null); // cancelado
            });

            // Permite fechar com ESC
            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    limpar();
                    resolve(null);
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);

            // Impede clique no overlay fechar sem cancelar (melhor UX)
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    // opcional: não faz nada, apenas mantém aberto
                }
            });
        });
    }

    // Função auxiliar para evitar XSS simples
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    mostrarLoading(mostrar) {
        const preview = document.getElementById('previa-relatorio');
        if (!preview) return;
        
        if (mostrar) {
            let overlay = preview.querySelector('.loading-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'loading-overlay';
                overlay.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; z-index:1000; border-radius:12px;';
                overlay.innerHTML = '<div style="background:white; padding:30px; border-radius:12px; text-align:center;"><i class="fas fa-spinner fa-spin" style="font-size:48px; color:#4361ee;"></i><p style="margin-top:15px;">Gerando PDF, aguarde...</p></div>';
                preview.style.position = 'relative';
                preview.appendChild(overlay);
            }
        } else {
            const overlay = preview.querySelector('.loading-overlay');
            if (overlay) overlay.remove();
            preview.style.position = '';
        }
    }

    mostrarNotificacao(mensagem, tipo) {
        const notificacao = document.createElement('div');
        notificacao.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${tipo === 'sucesso' ? '#2ecc71' : tipo === 'erro' ? '#e74c3c' : '#3498db'};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 10001;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        notificacao.innerHTML = mensagem;
        document.body.appendChild(notificacao);
        setTimeout(() => notificacao.remove(), 3000);
    }
}

// Inicialização
let sistemaInicializado = false;
document.addEventListener('DOMContentLoaded', () => {
    window.relatorioSistema = new RelatoriosSistema();
    window.relatoriosSistema = window.relatorioSistema;
    
    const iniciarSistema = () => {
        if (!sistemaInicializado && document.getElementById('relatorio')?.classList.contains('ativa')) {
            window.relatorioSistema.inicializar();
            sistemaInicializado = true;
        }
    };
    
    document.addEventListener('secaoAtivada', (e) => {
        if (e.detail.secaoId === 'relatorio') iniciarSistema();
    });
    
    iniciarSistema();
});