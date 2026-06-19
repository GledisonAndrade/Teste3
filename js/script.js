/**
 * script.js - Sistema principal de navegação e inicialização
 * Versão 3.0 - Profissionalizado com arquitetura modular
 * Desenvolvido por: Gledison Arruda Andrade
 * Data: 2025-06-19
 */

'use strict';

document.addEventListener('DOMContentLoaded', function() {
    // Elementos DOM principais
    const secoes = document.querySelectorAll('.secao');
    const linksMenu = document.querySelectorAll('.nav-link');
    const btnMenuMobile = document.getElementById('btn-menu-mobile');
    const mainNav = document.querySelector('.main-nav');
    const formGlicemia = document.getElementById('form-glicemia');
    const formMeta = document.getElementById('form-meta');
    const btnTestarAlerta = document.getElementById('testar-alerta');
    const btnLimparFiltro = document.getElementById('limpar-filtro');
    
    // Fazer dados globalmente acessíveis
    window.dados = ArmazenamentoDados.dados;
    
    // ===== FUNÇÕES GLOBAIS =====
    window.atualizarGrafico = function() {
        if (window.graficosSistema && typeof window.graficosSistema.atualizarGrafico === 'function') {
            window.graficosSistema.atualizarGrafico();
        }
    };
    
    window.atualizarDistribuicao = function() {
        if (window.pizzaSistema && typeof window.pizzaSistema.atualizarGrafico === 'function') {
            window.pizzaSistema.atualizarGrafico();
        }
    };
    
    // Inicialização do sistema
    inicializarSistema();
    
    // ===== INICIALIZAÇÃO DO SISTEMA =====
    function inicializarSistema() {
        console.log('🚀 Iniciando DiabetesCare v3.0...');
        
        inicializarNavegacao();
        inicializarFormularios();
        inicializarDados();
        
        console.log('✅ Sistema inicializado com sucesso');
    }
    
    // ===== NAVEGAÇÃO =====
    function inicializarNavegacao() {
        // Menu mobile
        if (btnMenuMobile) {
            btnMenuMobile.addEventListener('click', () => {
                mainNav.classList.toggle('mostrar');
                btnMenuMobile.setAttribute('aria-expanded', 
                    mainNav.classList.contains('mostrar') ? 'true' : 'false');
            });
        }
        
        // Navegação entre seções
        linksMenu.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                const secaoAlvo = link.getAttribute('data-section');
                
                // Atualizar menu ativo
                linksMenu.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                link.setAttribute('aria-current', 'page');
                
                // Mostrar seção
                mostrarSecao(secaoAlvo);
                
                // Fechar menu mobile
                if (window.innerWidth <= 768) {
                    mainNav.classList.remove('mostrar');
                    btnMenuMobile.setAttribute('aria-expanded', 'false');
                }
                
                // Rolar para o topo
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });
        
        // Links do footer
        document.querySelectorAll('.footer-links a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const secaoAlvo = link.getAttribute('data-section');
                
                linksMenu.forEach(l => l.classList.remove('active'));
                const linkAtivo = document.querySelector(`.nav-link[data-section="${secaoAlvo}"]`);
                if (linkAtivo) {
                    linkAtivo.classList.add('active');
                    linkAtivo.setAttribute('aria-current', 'page');
                }
                
                mostrarSecao(secaoAlvo);
            });
        });
    }
    
    function mostrarSecao(secaoId) {
        // Validar seção
        if (!secaoId) return;
        
        // Esconder todas as seções
        secoes.forEach(secao => {
            secao.classList.remove('ativa');
            secao.setAttribute('aria-hidden', 'true');
        });
        
        // Mostrar seção alvo
        const secaoAlvo = document.getElementById(secaoId);
        if (secaoAlvo) {
            secaoAlvo.classList.add('ativa');
            secaoAlvo.setAttribute('aria-hidden', 'false');
            
            // Disparar evento personalizado
            const evento = new CustomEvent('secaoAtivada', { 
                detail: { secaoId: secaoId } 
            });
            document.dispatchEvent(evento);
            
            // Inicializar componentes específicos
            inicializarComponentesSecao(secaoId);
        }
    }
    
    function inicializarComponentesSecao(secaoId) {
        switch(secaoId) {
            case 'grafico':
                setTimeout(() => {
                    if (window.graficosSistema?.inicializar) {
                        window.graficosSistema.inicializar();
                    }
                }, 300);
                break;
            
            case 'relatorio':
                setTimeout(() => {
                    const sistemaRelatorio = window.relatorioSistema || window.relatoriosSistema;
                    if (sistemaRelatorio?.inicializar) {
                        sistemaRelatorio.inicializar();
                    }
                }, 300);
                break;
            
            case 'pizza':
                setTimeout(() => {
                    if (window.pizzaSistema?.inicializar) {
                        window.pizzaSistema.inicializar();
                    }
                    if (window.pizzaSistema?.chartPizza) {
                        window.pizzaSistema.chartPizza.resize();
                    }
                    if (window.pizzaSistema?.atualizarGrafico) {
                        window.pizzaSistema.atualizarGrafico();
                    }
                }, 300);
                break;
            
            case 'indice':
                setTimeout(() => {
                    if (window.indiceSistema?.inicializar) {
                        window.indiceSistema.inicializar();
                    }
                }, 300);
                break;
            
            case 'alimentos':
                atualizarListaAlimentos();
                break;
        }
    }
    
    // ===== FORMULÁRIOS =====
    function inicializarFormularios() {
        inicializarFormularioGlicemia();
        inicializarFormularioMetas();
        inicializarBotoesAcao();
    }
    
    function inicializarFormularioGlicemia() {
        if (!formGlicemia) return;
        
        // Preencher data e hora atuais
        const agora = new Date();
        document.getElementById('data').value = agora.toISOString().split('T')[0];
        document.getElementById('hora').value = agora.toTimeString().substring(0, 5);
        
        formGlicemia.addEventListener('submit', (e) => {
            e.preventDefault();
            
            try {
                const glicemia = document.getElementById('glicemia').value;
                const data = document.getElementById('data').value;
                const hora = document.getElementById('hora').value;
                const observacao = document.getElementById('observacao').value;
                
                // Validar dados
                if (!glicemia || !data || !hora) {
                    Notificacoes.erro('Preencha todos os campos obrigatórios');
                    return;
                }
                
                // Adicionar glicemia via gerenciador
                const resultado = ArmazenamentoDados.adicionarGlicemia({
                    glicemia,
                    data,
                    hora,
                    observacao
                });
                
                if (!resultado.sucesso) {
                    Notificacoes.erro(resultado.erro);
                    return;
                }
                
                // Sucesso
                Notificacoes.sucesso(`Glicemia registrada: ${glicemia} mg/dL`);
                formGlicemia.reset();
                document.getElementById('data').value = new Date().toISOString().split('T')[0];
                document.getElementById('hora').value = new Date().toTimeString().substring(0, 5);
                
                // Atualizar exibições
                atualizarHistorico();
                atualizarGrafico();
                window.atualizarDistribuicao();
                
            } catch (erro) {
                console.error('Erro ao registrar glicemia:', erro);
                Notificacoes.erro('Erro ao registrar glicemia');
            }
        });
    }
    
    function inicializarFormularioMetas() {
        if (!formMeta) return;
        
        // Definir data mínima
        const hoje = new Date().toISOString().split('T')[0];
        document.getElementById('data-meta').min = hoje;
        
        formMeta.addEventListener('submit', (e) => {
            e.preventDefault();
            
            try {
                const descricao = document.getElementById('descricao-meta').value;
                const dataLimite = document.getElementById('data-meta').value;
                const categoria = document.getElementById('categoria-meta').value;
                
                const resultado = ArmazenamentoDados.adicionarMeta({
                    descricao,
                    dataLimite,
                    categoria
                });
                
                if (!resultado.sucesso) {
                    Notificacoes.erro(resultado.erro);
                    return;
                }
                
                Notificacoes.sucesso('Meta adicionada com sucesso!');
                formMeta.reset();
                document.getElementById('data-meta').min = hoje;
                
                atualizarMetas();
                window.atualizarDistribuicao();
                
            } catch (erro) {
                console.error('Erro ao adicionar meta:', erro);
                Notificacoes.erro('Erro ao adicionar meta');
            }
        });
    }
    
    function inicializarBotoesAcao() {
        // Botão testar alerta
        if (btnTestarAlerta) {
            btnTestarAlerta.addEventListener('click', () => {
                const limite = document.getElementById('limite-baixo').value || '70';
                const contato = document.getElementById('contato-emergencia').value;
                
                if (!contato) {
                    Notificacoes.erro('Informe um contato de emergência');
                    return;
                }
                
                Notificacoes.info(
                    `Alerta ativado! Mensagem será enviada para ${contato} quando glicemia < ${limite} mg/dL`,
                    5000
                );
            });
        }
        
        // Botão limpar filtros
        if (btnLimparFiltro) {
            btnLimparFiltro.addEventListener('click', () => {
                document.getElementById('filtro-data').value = '';
                document.getElementById('filtro-status').value = 'todos';
                atualizarHistorico();
                Notificacoes.sucesso('Filtros limpos');
            });
        }
        
        // Filtro de data
        const filtroData = document.getElementById('filtro-data');
        if (filtroData) {
            filtroData.addEventListener('change', atualizarHistorico);
        }
        
        // Filtro de status
        const filtroStatus = document.getElementById('filtro-status');
        if (filtroStatus) {
            filtroStatus.addEventListener('change', atualizarHistorico);
        }
    }
    
    // ===== INICIALIZAÇÃO DE DADOS =====
    function inicializarDados() {
        atualizarHistorico();
        atualizarMetas();
        window.atualizarDistribuicao();
        
        // Carregar dados de demonstração se não houver dados
        if (ArmazenamentoDados.dados.glicemias.length === 0) {
            adicionarDadosDemo();
        }
        
        console.log(`✅ ${ArmazenamentoDados.dados.glicemias.length} registros de glicemia carregados`);
    }
    
    // ===== ATUALIZAÇÃO DE HISTÓRICO =====
    function atualizarHistorico() {
        const listaHistorico = document.getElementById('lista-historico');
        if (!listaHistorico) return;
        
        listaHistorico.innerHTML = '';
        
        // Obter filtros
        const filtroData = document.getElementById('filtro-data')?.value || '';
        const filtroStatus = document.getElementById('filtro-status')?.value || 'todos';
        
        // Aplicar filtros
        const glicemias = ArmazenamentoDados.obterGlicemias({
            data: filtroData || undefined,
            status: filtroStatus !== 'todos' ? filtroStatus : undefined
        });
        
        if (glicemias.length === 0) {
            listaHistorico.innerHTML = `
                <div class="sem-dados">
                    <i class="fas fa-clipboard-list"></i>
                    <p>Nenhum registro encontrado</p>
                </div>
            `;
            return;
        }
        
        glicemias.forEach(registro => {
            const item = document.createElement('div');
            item.className = `registro-item ${registro.statusClass}`;
            item.innerHTML = `
                <div class="registro-info">
                    <div class="registro-valor">
                        <strong>${registro.glicemia} mg/dL</strong>
                        <span class="registro-status ${registro.statusClass}">${registro.status}</span>
                    </div>
                    <div class="registro-data">
                        ${Utils.formatarData(registro.data)} às ${registro.hora}
                    </div>
                    ${registro.observacao ? `
                        <div class="registro-obs">
                            <i class="fas fa-comment"></i> ${registro.observacao}
                        </div>
                    ` : ''}
                </div>
                <button class="btn-excluir" title="Excluir registro" aria-label="Excluir registro">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            
            const btnExcluir = item.querySelector('.btn-excluir');
            btnExcluir.addEventListener('click', () => {
                if (confirm('Tem certeza que deseja excluir este registro?')) {
                    const resultado = ArmazenamentoDados.excluirGlicemia(registro.id);
                    if (resultado.sucesso) {
                        Notificacoes.sucesso('Registro excluído com sucesso');
                        atualizarHistorico();
                        atualizarGrafico();
                        window.atualizarDistribuicao();
                    } else {
                        Notificacoes.erro(resultado.erro);
                    }
                }
            });
            
            listaHistorico.appendChild(item);
        });
    }
    
    // ===== ATUALIZAÇÃO DE METAS =====
    function atualizarMetas() {
        const listaPendentes = document.getElementById('lista-metas-pendentes');
        const listaConcluidas = document.getElementById('lista-metas-concluidas');
        
        if (!listaPendentes || !listaConcluidas) return;
        
        listaPendentes.innerHTML = '';
        listaConcluidas.innerHTML = '';
        
        const metasPendentes = ArmazenamentoDados.obterMetas('pendentes');
        const metasConcluidas = ArmazenamentoDados.obterMetas('concluidas');
        
        // Renderizar metas pendentes
        if (metasPendentes.length === 0) {
            listaPendentes.innerHTML = '<p class="sem-dados">Nenhuma meta pendente</p>';
        } else {
            metasPendentes.forEach(meta => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div>
                        <strong>${meta.descricao}</strong>
                        <div class="meta-info">
                            <span class="meta-categoria">
                                <i class="fas fa-tag"></i> 
                                ${Utils.formatarCategoria(meta.categoria, 'metas')}
                            </span>
                            ${meta.dataLimite ? `
                                <span class="meta-data">
                                    <i class="fas fa-calendar"></i> 
                                    ${Utils.formatarData(meta.dataLimite)}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                    <div class="meta-acoes">
                        <button class="btn-concluir" title="Concluir meta">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn-excluir" title="Excluir meta">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                
                li.querySelector('.btn-concluir').addEventListener('click', () => {
                    const resultado = ArmazenamentoDados.concluirMeta(meta.id);
                    if (resultado.sucesso) {
                        Notificacoes.sucesso('Meta concluída!');
                        atualizarMetas();
                        window.atualizarDistribuicao();
                    } else {
                        Notificacoes.erro(resultado.erro);
                    }
                });
                
                li.querySelector('.btn-excluir').addEventListener('click', () => {
                    if (confirm('Tem certeza que deseja excluir esta meta?')) {
                        const resultado = ArmazenamentoDados.excluirMeta(meta.id);
                        if (resultado.sucesso) {
                            Notificacoes.sucesso('Meta excluída');
                            atualizarMetas();
                            window.atualizarDistribuicao();
                        } else {
                            Notificacoes.erro(resultado.erro);
                        }
                    }
                });
                
                listaPendentes.appendChild(li);
            });
        }
        
        // Renderizar metas concluídas
        if (metasConcluidas.length === 0) {
            listaConcluidas.innerHTML = '<p class="sem-dados">Nenhuma meta concluída</p>';
        } else {
            metasConcluidas.forEach(meta => {
                const li = document.createElement('li');
                li.className = 'concluida';
                li.innerHTML = `
                    <div>
                        <strong><s>${meta.descricao}</s></strong>
                        <div class="meta-info">
                            <span class="meta-categoria">
                                <i class="fas fa-tag"></i> 
                                ${Utils.formatarCategoria(meta.categoria, 'metas')}
                            </span>
                            ${meta.dataLimite ? `
                                <span class="meta-data">
                                    <i class="fas fa-calendar"></i> 
                                    ${Utils.formatarData(meta.dataLimite)}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                    <button class="btn-excluir" title="Excluir meta">
                        <i class="fas fa-trash"></i>
                    </button>
                `;
                
                li.querySelector('.btn-excluir').addEventListener('click', () => {
                    if (confirm('Tem certeza que deseja excluir esta meta?')) {
                        const resultado = ArmazenamentoDados.excluirMeta(meta.id);
                        if (resultado.sucesso) {
                            Notificacoes.sucesso('Meta excluída');
                            atualizarMetas();
                            window.atualizarDistribuicao();
                        } else {
                            Notificacoes.erro(resultado.erro);
                        }
                    }
                });
                
                listaConcluidas.appendChild(li);
            });
        }
    }
    
    // ===== ATUALIZAÇÃO DE ALIMENTOS =====
    function atualizarListaAlimentos() {
        const listaAlimentos = document.getElementById('lista-alimentos');
        if (!listaAlimentos) return;
        
        const categoria = document.getElementById('filtro-alimento')?.value || '';
        const alimentos = ArmazenamentoDados.obterAlimentos(categoria);
        
        listaAlimentos.innerHTML = '';
        
        if (alimentos.length === 0) {
            listaAlimentos.innerHTML = `
                <div class="sem-dados">
                    <i class="fas fa-apple-alt"></i>
                    <p>Nenhum alimento registrado</p>
                </div>
            `;
            return;
        }
        
        alimentos.forEach(alimento => {
            const indiceGlicemico = alimento.indiceGlicemico || (
                Number(alimento.carboidratos) >= 30 ? 'Alto' : Number(alimento.carboidratos) > 0 ? 'Baixo-Médio' : 'Médio'
            );
            const corIndice = indiceGlicemico.toLowerCase().includes('baixo')
                ? '#2ecc71'
                : indiceGlicemico.toLowerCase().includes('alto')
                    ? '#e74c3c'
                    : '#f39c12';

            const item = document.createElement('div');
            item.className = 'alimento-item';
            item.innerHTML = `
                <div class="alimento-info">
                    <strong>${alimento.nome}</strong>
                    <div class="alimento-detalhes">
                        <span><i class="fas fa-weight"></i> ${alimento.quantidade}g</span>
                        <span><i class="fas fa-bread-slice"></i> ${alimento.carboidratos}g carb.</span>
                        <span><i class="fas fa-tag"></i> ${Utils.formatarCategoria(alimento.categoria, 'alimentos')}</span>
                        <span class="alimento-indice" style="background:${corIndice};color:#fff;border-radius:12px;padding:2px 8px;"><i class="fas fa-heartbeat"></i> ${indiceGlicemico}</span>
                        <span><i class="fas fa-calendar-alt"></i> ${Utils.formatarData(alimento.data)} ${alimento.hora}</span>
                    </div>
                    ${alimento.observacao ? `<p class="alimento-obs">${alimento.observacao}</p>` : ''}
                </div>
                <button class="btn-excluir" title="Excluir alimento">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            
            item.querySelector('.btn-excluir').addEventListener('click', () => {
                if (confirm('Tem certeza que deseja excluir este alimento?')) {
                    const resultado = ArmazenamentoDados.excluirAlimento(alimento.id);
                    if (resultado.sucesso) {
                        Notificacoes.sucesso('Alimento excluído');
                        atualizarListaAlimentos();
                        window.atualizarDistribuicao();
                    } else {
                        Notificacoes.erro(resultado.erro);
                    }
                }
            });
            
            listaAlimentos.appendChild(item);
        });
    }
    
    // ===== DADOS DE DEMONSTRAÇÃO =====
    function adicionarDadosDemo() {
        console.log('📊 Carregando dados de demonstração...');
        
        const hoje = new Date();
        const datas = [];
        for (let i = 6; i >= 0; i--) {
            const data = new Date();
            data.setDate(hoje.getDate() - i);
            datas.push(data.toISOString().split('T')[0]);
        }
        
        const dadosDemo = [
            { glicemia: 95, data: datas[0], hora: '08:00', observacao: 'Em jejum' },
            { glicemia: 120, data: datas[0], hora: '12:30', observacao: 'Após almoço' },
            { glicemia: 110, data: datas[0], hora: '18:00', observacao: 'Antes do jantar' },
            { glicemia: 98, data: datas[1], hora: '08:15', observacao: 'Em jejum' },
            { glicemia: 135, data: datas[1], hora: '13:00', observacao: 'Após almoço' },
            { glicemia: 115, data: datas[1], hora: '19:30', observacao: 'Antes do jantar' },
            { glicemia: 105, data: datas[2], hora: '07:45', observacao: 'Em jejum' },
            { glicemia: 128, data: datas[2], hora: '12:45', observacao: 'Após almoço' },
            { glicemia: 105, data: datas[2], hora: '18:30', observacao: 'Antes do jantar' },
            { glicemia: 92, data: datas[3], hora: '08:30', observacao: 'Em jejum' },
            { glicemia: 142, data: datas[3], hora: '13:15', observacao: 'Após almoço' },
            { glicemia: 118, data: datas[3], hora: '19:00', observacao: 'Antes do jantar' },
            { glicemia: 102, data: datas[4], hora: '07:30', observacao: 'Em jejum' },
            { glicemia: 125, data: datas[4], hora: '12:15', observacao: 'Após almoço' },
            { glicemia: 112, data: datas[4], hora: '18:45', observacao: 'Antes do jantar' },
            { glicemia: 88, data: datas[5], hora: '08:45', observacao: 'Em jejum' },
            { glicemia: 138, data: datas[5], hora: '13:30', observacao: 'Após almoço' },
            { glicemia: 122, data: datas[5], hora: '19:15', observacao: 'Antes do jantar' },
            { glicemia: 96, data: datas[6], hora: '07:15', observacao: 'Em jejum' },
            { glicemia: 132, data: datas[6], hora: '12:00', observacao: 'Após almoço' },
            { glicemia: 108, data: datas[6], hora: '18:15', observacao: 'Antes do jantar' }
        ];
        
        dadosDemo.forEach(dado => {
            ArmazenamentoDados.adicionarGlicemia(dado);
        });
        
        // Metas de demonstração
        const metasDemo = [
            { 
                descricao: 'Caminhar 30 minutos por dia', 
                categoria: 'exercicio', 
                dataLimite: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0],
                concluida: false 
            },
            { 
                descricao: 'Reduzir consumo de açúcar', 
                categoria: 'alimentacao', 
                dataLimite: new Date(Date.now() + 14*24*60*60*1000).toISOString().split('T')[0],
                concluida: true 
            },
            { 
                descricao: 'Tomar medicação corretamente', 
                categoria: 'medicacao', 
                dataLimite: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
                concluida: false 
            }
        ];
        
        metasDemo.forEach(meta => {
            ArmazenamentoDados.adicionarMeta(meta);
        });
        
        atualizarHistorico();
        atualizarMetas();
        atualizarGrafico();
        window.atualizarDistribuicao();
        console.log('✅ Dados de demonstração carregados');
    }
});

// Adicionar estilos de animação
const styleAnimacoes = document.createElement('style');
styleAnimacoes.textContent = `
    @keyframes slideIn {
        from { 
            transform: translateY(20px); 
            opacity: 0; 
        }
        to { 
            transform: translateY(0); 
            opacity: 1; 
        }
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
`;
document.head.appendChild(styleAnimacoes);