// js/script.js - Sistema principal com navegação funcional (VERSÃO CORRIGIDA - SEM CONFLITO COM RELATÓRIOS)

document.addEventListener('DOMContentLoaded', function() {
    // Elementos DOM
    const secoes = document.querySelectorAll('.secao');
    const linksMenu = document.querySelectorAll('.nav-link');
    const btnMenuMobile = document.getElementById('btn-menu-mobile');
    const mainNav = document.querySelector('.main-nav');
    const formGlicemia = document.getElementById('form-glicemia');
    const formMeta = document.getElementById('form-meta');
    const btnTestarAlerta = document.getElementById('testar-alerta');
    const btnLimparFiltro = document.getElementById('limpar-filtro');
    
    // NÃO declarar formRelatorio e btnBaixarPDF aqui para evitar conflito
    // Eles serão gerenciados exclusivamente pelo relatorios.js
    
    // Dados da aplicação
    window.dados = {
        glicemias: JSON.parse(localStorage.getItem('glicemias')) || [],
        metas: JSON.parse(localStorage.getItem('metas')) || [],
        alimentos: JSON.parse(localStorage.getItem('alimentos')) || []
    };
    
    // ===== FUNÇÕES GLOBAIS =====
    window.atualizarGrafico = function() {
        if (window.graficosSistema) {
            window.graficosSistema.atualizarGrafico();
        }
    };
    
    // Inicialização
    inicializarNavegacao();
    inicializarFormularios();
    inicializarDados();
    
    // ===== NAVEGAÇÃO =====
    function inicializarNavegacao() {
        // Menu mobile
        if (btnMenuMobile) {
            btnMenuMobile.addEventListener('click', function() {
                mainNav.classList.toggle('mostrar');
            });
        }
        
        // Navegação entre seções
        linksMenu.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Obter seção alvo
                const secaoAlvo = this.getAttribute('data-section');
                
                // Atualizar menu ativo
                linksMenu.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                
                // Mostrar seção
                mostrarSecao(secaoAlvo);
                
                // Fechar menu mobile se aberto
                if (window.innerWidth <= 768) {
                    mainNav.classList.remove('mostrar');
                }
                
                // Rolar para o topo suavemente
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });
        
        // Links do footer
        document.querySelectorAll('.footer-links a').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const secaoAlvo = this.getAttribute('data-section');
                
                linksMenu.forEach(l => l.classList.remove('active'));
                const linkAtivo = document.querySelector(`.nav-link[data-section="${secaoAlvo}"]`);
                if (linkAtivo) linkAtivo.classList.add('active');
                
                mostrarSecao(secaoAlvo);
            });
        });
    }
    
    function mostrarSecao(secaoId) {
        // Esconder todas as seções
        secoes.forEach(secao => {
            secao.classList.remove('ativa');
        });
        
        // Mostrar seção alvo
        const secaoAlvo = document.getElementById(secaoId);
        if (secaoAlvo) {
            secaoAlvo.classList.add('ativa');
            
            // Disparar evento personalizado
            const evento = new CustomEvent('secaoAtivada', { 
                detail: { secaoId: secaoId } 
            });
            document.dispatchEvent(evento);
            
            // Executar ações específicas da seção
            if (secaoId === 'grafico') {
                setTimeout(() => {
                    if (window.graficosSistema && typeof window.graficosSistema.inicializar === 'function') {
                        window.graficosSistema.inicializar();
                    }
                }, 300);
            }
            
            if (secaoId === 'relatorio') {
                setTimeout(() => {
                    if (window.relatoriosSistema && typeof window.relatoriosSistema.inicializar === 'function') {
                        window.relatoriosSistema.inicializar();
                    } else if (window.relatorioSys && typeof window.relatorioSys.inicializar === 'function') {
                        window.relatorioSys.inicializar();
                    }
                }, 300);
            }
            
            if (secaoId === 'indice') {
                setTimeout(() => {
                    if (window.indiceSistema && typeof window.indiceSistema.inicializar === 'function') {
                        window.indiceSistema.inicializar();
                    }
                }, 300);
            }
        }
    }
    
    // ===== FORMULÁRIOS (exceto relatório que é gerenciado pelo relatorios.js) =====
    function inicializarFormularios() {
        // Formulário de glicemia
        if (formGlicemia) {
            const hoje = new Date();
            document.getElementById('data').value = hoje.toISOString().split('T')[0];
            document.getElementById('hora').value = hoje.toTimeString().substring(0, 5);
            
            formGlicemia.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const glicemia = parseInt(document.getElementById('glicemia').value);
                const data = document.getElementById('data').value;
                const hora = document.getElementById('hora').value;
                const observacao = document.getElementById('observacao').value;
                
                if (!glicemia || glicemia < 20 || glicemia > 600) {
                    mostrarNotificacao('Valor de glicemia inválido (20-600 mg/dL)', 'erro');
                    return;
                }
                
                if (!data || !hora) {
                    mostrarNotificacao('Preencha data e hora', 'erro');
                    return;
                }
                
                let status = '';
                let statusClass = '';
                if (glicemia < 70) {
                    status = 'Baixa';
                    statusClass = 'baixa';
                } else if (glicemia <= 180) {
                    status = 'Normal';
                    statusClass = 'normal';
                } else if (glicemia <= 250) {
                    status = 'Alta';
                    statusClass = 'alta';
                } else {
                    status = 'Muito Alta';
                    statusClass = 'muito-alta';
                }
                
                const registro = {
                    id: Date.now(),
                    glicemia: glicemia,
                    data: data,
                    hora: hora,
                    observacao: observacao,
                    status: status,
                    statusClass: statusClass,
                    timestamp: new Date(`${data}T${hora}`).getTime()
                };
                
                window.dados.glicemias.push(registro);
                salvarDados();
                atualizarHistorico();
                
                if (window.atualizarGrafico) {
                    atualizarGrafico();
                }
                
                document.getElementById('glicemia').value = '';
                document.getElementById('observacao').value = '';
                
                mostrarNotificacao(`Glicemia registrada: ${glicemia} mg/dL`, 'sucesso');
            });
        }
        
        // Formulário de metas
        if (formMeta) {
            const hoje = new Date().toISOString().split('T')[0];
            document.getElementById('data-meta').min = hoje;
            
            formMeta.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const descricao = document.getElementById('descricao-meta').value;
                const dataLimite = document.getElementById('data-meta').value;
                const categoria = document.getElementById('categoria-meta').value;
                
                if (!descricao) {
                    mostrarNotificacao('Digite uma descrição para a meta', 'erro');
                    return;
                }
                
                const meta = {
                    id: Date.now(),
                    descricao: descricao,
                    dataLimite: dataLimite,
                    categoria: categoria,
                    concluida: false,
                    dataCriacao: new Date().toISOString().split('T')[0]
                };
                
                window.dados.metas.push(meta);
                salvarDados();
                atualizarMetas();
                
                this.reset();
                document.getElementById('data-meta').min = new Date().toISOString().split('T')[0];
                
                mostrarNotificacao('Meta adicionada com sucesso!', 'sucesso');
            });
        }
        
        // Botão de testar alerta
        if (btnTestarAlerta) {
            btnTestarAlerta.addEventListener('click', function() {
                const limite = document.getElementById('limite-baixo').value || '70';
                const contato = document.getElementById('contato-emergencia').value;
                
                if (!contato) {
                    mostrarNotificacao('Informe um contato de emergência', 'erro');
                    return;
                }
                
                mostrarNotificacao(`Alerta de teste! Mensagem seria enviada para ${contato} quando a glicemia estiver abaixo de ${limite} mg/dL`, 'info');
            });
        }
        
        // Botão limpar filtros
        if (btnLimparFiltro) {
            btnLimparFiltro.addEventListener('click', function() {
                document.getElementById('filtro-data').value = '';
                document.getElementById('filtro-status').value = 'todos';
                atualizarHistorico();
                mostrarNotificacao('Filtros limpos', 'sucesso');
            });
        }
        
        // Filtro de data no histórico
        const filtroData = document.getElementById('filtro-data');
        if (filtroData) {
            filtroData.addEventListener('change', function() {
                atualizarHistorico();
            });
        }
        
        // Filtro de status no histórico
        const filtroStatus = document.getElementById('filtro-status');
        if (filtroStatus) {
            filtroStatus.addEventListener('change', function() {
                atualizarHistorico();
            });
        }
        
        // NOTA: O formulário de relatório e botão de PDF NÃO são configurados aqui
        // para evitar conflito com o relatorios.js
    }
    
    // ===== INICIALIZAÇÃO DE DADOS =====
    function inicializarDados() {
        atualizarHistorico();
        atualizarMetas();
        
        if (document.getElementById('grafico')?.classList.contains('ativa')) {
            setTimeout(() => {
                if (window.graficosSistema && typeof window.graficosSistema.inicializar === 'function') {
                    window.graficosSistema.inicializar();
                }
            }, 500);
        }
        
        if (window.dados.glicemias.length === 0) {
            adicionarDadosDemo();
        }
    }
    
    // ===== FUNÇÕES DE DADOS =====
    function salvarDados() {
        localStorage.setItem('glicemias', JSON.stringify(window.dados.glicemias));
        localStorage.setItem('metas', JSON.stringify(window.dados.metas));
        localStorage.setItem('alimentos', JSON.stringify(window.dados.alimentos));
    }
    
    function atualizarHistorico() {
        const listaHistorico = document.getElementById('lista-historico');
        if (!listaHistorico) return;
        
        listaHistorico.innerHTML = '';
        
        let glicemiasFiltradas = [...window.dados.glicemias];
        
        const filtroData = document.getElementById('filtro-data');
        const filtroStatus = document.getElementById('filtro-status');
        
        if (filtroData && filtroData.value) {
            glicemiasFiltradas = glicemiasFiltradas.filter(g => g.data === filtroData.value);
        }
        
        if (filtroStatus && filtroStatus.value !== 'todos') {
            glicemiasFiltradas = glicemiasFiltradas.filter(g => g.statusClass === filtroStatus.value);
        }
        
        glicemiasFiltradas.sort((a, b) => b.timestamp - a.timestamp);
        
        if (glicemiasFiltradas.length === 0) {
            listaHistorico.innerHTML = `
                <div class="sem-dados">
                    <i class="fas fa-clipboard-list"></i>
                    <p>Nenhum registro encontrado</p>
                </div>
            `;
            return;
        }
        
        glicemiasFiltradas.forEach(registro => {
            const item = document.createElement('div');
            item.className = `registro-item ${registro.statusClass}`;
            item.innerHTML = `
                <div class="registro-info">
                    <div class="registro-valor">
                        <strong>${registro.glicemia} mg/dL</strong>
                        <span class="registro-status ${registro.statusClass}">${registro.status}</span>
                    </div>
                    <div class="registro-data">
                        ${formatarData(registro.data)} às ${registro.hora}
                    </div>
                    ${registro.observacao ? `<div class="registro-obs"><i class="fas fa-comment"></i> ${registro.observacao}</div>` : ''}
                </div>
                <button class="btn-excluir" data-id="${registro.id}" title="Excluir registro">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            listaHistorico.appendChild(item);
        });
        
        document.querySelectorAll('.btn-excluir').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                excluirRegistroGlicemia(id);
            });
        });
    }
    
    function atualizarMetas() {
        const listaPendentes = document.getElementById('lista-metas-pendentes');
        const listaConcluidas = document.getElementById('lista-metas-concluidas');
        
        if (!listaPendentes || !listaConcluidas) return;
        
        listaPendentes.innerHTML = '';
        listaConcluidas.innerHTML = '';
        
        const metasPendentes = window.dados.metas.filter(m => !m.concluida);
        const metasConcluidas = window.dados.metas.filter(m => m.concluida);
        
        if (metasPendentes.length === 0) {
            listaPendentes.innerHTML = '<p class="sem-dados">Nenhuma meta pendente</p>';
        } else {
            metasPendentes.forEach(meta => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div>
                        <strong>${meta.descricao}</strong>
                        <div class="meta-info">
                            <span class="meta-categoria"><i class="fas fa-tag"></i> ${formatarCategoria(meta.categoria)}</span>
                            ${meta.dataLimite ? `<span class="meta-data"><i class="fas fa-calendar"></i> ${formatarData(meta.dataLimite)}</span>` : ''}
                        </div>
                    </div>
                    <div class="meta-acoes">
                        <button class="btn-concluir" data-id="${meta.id}" title="Concluir"><i class="fas fa-check"></i></button>
                        <button class="btn-excluir" data-id="${meta.id}" title="Excluir"><i class="fas fa-trash"></i></button>
                    </div>
                `;
                listaPendentes.appendChild(li);
            });
        }
        
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
                            <span class="meta-categoria"><i class="fas fa-tag"></i> ${formatarCategoria(meta.categoria)}</span>
                            ${meta.dataLimite ? `<span class="meta-data"><i class="fas fa-calendar"></i> ${formatarData(meta.dataLimite)}</span>` : ''}
                        </div>
                    </div>
                    <button class="btn-excluir" data-id="${meta.id}" title="Excluir"><i class="fas fa-trash"></i></button>
                `;
                listaConcluidas.appendChild(li);
            });
        }
        
        document.querySelectorAll('.btn-concluir').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                concluirMeta(id);
            });
        });
        
        document.querySelectorAll('.btn-excluir').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                excluirMeta(id);
            });
        });
    }
    
    // ===== FUNÇÕES AUXILIARES =====
    function formatarData(data) {
        if (!data) return '';
        const [ano, mes, dia] = data.split('-');
        return `${dia}/${mes}/${ano}`;
    }
    
    function formatarCategoria(categoria) {
        const categorias = {
            'exercicio': 'Exercício',
            'alimentacao': 'Alimentação',
            'medicacao': 'Medicação',
            'controle': 'Controle'
        };
        return categorias[categoria] || categoria;
    }
    
    function excluirRegistroGlicemia(id) {
        if (confirm('Tem certeza que deseja excluir este registro?')) {
            window.dados.glicemias = window.dados.glicemias.filter(g => g.id !== id);
            salvarDados();
            atualizarHistorico();
            if (window.atualizarGrafico) atualizarGrafico();
            mostrarNotificacao('Registro excluído com sucesso', 'sucesso');
        }
    }
    
    function concluirMeta(id) {
        const meta = window.dados.metas.find(m => m.id === id);
        if (meta) {
            meta.concluida = true;
            meta.dataConclusao = new Date().toISOString().split('T')[0];
            salvarDados();
            atualizarMetas();
            mostrarNotificacao('Meta concluída!', 'sucesso');
        }
    }
    
    function excluirMeta(id) {
        if (confirm('Tem certeza que deseja excluir esta meta?')) {
            window.dados.metas = window.dados.metas.filter(m => m.id !== id);
            salvarDados();
            atualizarMetas();
            mostrarNotificacao('Meta excluída', 'sucesso');
        }
    }
    
    // ===== NOTIFICAÇÕES =====
    function mostrarNotificacao(mensagem, tipo) {
        const notificacao = document.createElement('div');
        notificacao.className = `notificacao notificacao-${tipo}`;
        notificacao.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${tipo === 'sucesso' ? '#2ecc71' : tipo === 'erro' ? '#e74c3c' : '#3498db'};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        notificacao.innerHTML = `<i class="fas fa-${tipo === 'sucesso' ? 'check-circle' : tipo === 'erro' ? 'exclamation-circle' : 'info-circle'}"></i> ${mensagem}`;
        document.body.appendChild(notificacao);
        
        setTimeout(() => {
            notificacao.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notificacao.remove(), 300);
        }, 3000);
    }
    
    // ===== DADOS DEMO =====
    function adicionarDadosDemo() {
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
        
        dadosDemo.forEach((dado, index) => {
            let status = '', statusClass = '';
            if (dado.glicemia < 70) { status = 'Baixa'; statusClass = 'baixa'; }
            else if (dado.glicemia <= 180) { status = 'Normal'; statusClass = 'normal'; }
            else if (dado.glicemia <= 250) { status = 'Alta'; statusClass = 'alta'; }
            else { status = 'Muito Alta'; statusClass = 'muito-alta'; }
            
            window.dados.glicemias.push({
                id: Date.now() + index,
                glicemia: dado.glicemia,
                data: dado.data,
                hora: dado.hora,
                observacao: dado.observacao,
                status: status,
                statusClass: statusClass,
                timestamp: new Date(`${dado.data}T${dado.hora}`).getTime()
            });
        });
        
        const metasDemo = [
            { descricao: 'Caminhar 30 minutos por dia', categoria: 'exercicio', dataLimite: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0], concluida: false },
            { descricao: 'Reduzir consumo de açúcar', categoria: 'alimentacao', dataLimite: new Date(Date.now() + 14*24*60*60*1000).toISOString().split('T')[0], concluida: true },
            { descricao: 'Tomar medicação corretamente', categoria: 'medicacao', dataLimite: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0], concluida: false }
        ];
        
        metasDemo.forEach((meta, index) => {
            window.dados.metas.push({
                id: Date.now() + 1000 + index,
                descricao: meta.descricao,
                categoria: meta.categoria,
                dataLimite: meta.dataLimite,
                concluida: meta.concluida,
                dataCriacao: new Date(Date.now() - (index+1)*2*24*60*60*1000).toISOString().split('T')[0]
            });
        });
        
        salvarDados();
        atualizarHistorico();
        atualizarMetas();
        console.log('Dados demo adicionados');
    }
});

// Adicionar animações CSS
const styleAnimations = document.createElement('style');
styleAnimations.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(styleAnimations);