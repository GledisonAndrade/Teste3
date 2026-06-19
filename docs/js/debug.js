/**
 * GUIA DE SOLUÇÃO DE PROBLEMAS - DiabetesCare v3.0
 * 
 * Se você encontrar algum problema, siga este guia.
 */

// ===== PROBLEMAS COMUNS E SOLUÇÕES =====

PROBLEMAS_E_SOLUCOES = {
    "Página em branco": {
        causa: "Scripts não carregados ou erro de sintaxe",
        solucao: [
            "1. Abra o console (F12)",
            "2. Procure por erros em vermelho",
            "3. Verifique se todos os arquivos .js estão na pasta 'js'",
            "4. Confirme que o caminho no HTML está correto",
            "5. Recarregue a página (Ctrl+F5)"
        ]
    },
    
    "Dados não salvam": {
        causa: "localStorage desabilitado ou cheio",
        solucao: [
            "1. Verifique se está usando HTTPS ou localhost",
            "2. Limpe o cache do navegador",
            "3. Cheque espaço disponível em localStorage",
            "4. Abra console e digite: localStorage.getItem('glicemias')",
            "5. Se vazio, os dados não foram salvos"
        ]
    },
    
    "Gráfico não aparece": {
        causa: "Chart.js não carregou ou canvas não existe",
        solucao: [
            "1. Confirme que Chart.js CDN está acessível",
            "2. Verifique se há dados de glicemia registrados",
            "3. Abra console e digite: typeof Chart",
            "4. Deve retornar 'function', não 'undefined'",
            "5. Recarregue a página se Chart.js foi adicionado"
        ]
    },
    
    "Relatório não gera": {
        causa: "jsPDF ou html2canvas não carregaram",
        solucao: [
            "1. Verifique conexão internet",
            "2. Abra console e procure por erros de CORS",
            "3. Digite em console: typeof jspdf",
            "4. Tente usar período padrão (30 dias)",
            "5. Se persistir, use navegador diferente"
        ]
    },
    
    "Notificações não aparecem": {
        causa: "Container não criado ou CSS faltando",
        solucao: [
            "1. Verifique se notificacoes.js carregou",
            "2. Procure por 'notificacoes-conteiner' no HTML",
            "3. Teste em console: Notificacoes.sucesso('Teste')",
            "4. Se não aparecer, há erro de CSS",
            "5. Confira arquivo aprimoramentos.css"
        ]
    },
    
    "Temas não mudam": {
        causa: "temas.js não carregou ou CSS variáveis erradas",
        solucao: [
            "1. Abra console e verifique se temas.js carregou",
            "2. Clique em Tema e veja se menu abre",
            "3. Se abre mas cores não mudam, problema é CSS",
            "4. Verifique se temas.css está carregando",
            "5. Procure por --cor-primaria em style.css"
        ]
    },
    
    "Erro 'Notificacoes is not defined'": {
        causa: "notificacoes.js não carregou antes do script.js",
        solucao: [
            "1. Verifique ordem dos scripts no HTML",
            "2. notificacoes.js DEVE estar antes de script.js",
            "3. Ordem correta:",
            "   - config.js",
            "   - utils.js",
            "   - notificacoes.js",
            "   - armazenamento.js",
            "   - script.js (e outros)"
        ]
    },
    
    "Erro 'Utils is not defined'": {
        causa: "utils.js não carregou antes de armazenamento.js",
        solucao: [
            "1. Verifique se utils.js está no HTML",
            "2. Deve estar ANTES de armazenamento.js",
            "3. Recarregue página (Ctrl+F5)",
            "4. Limpe cache do navegador"
        ]
    },
    
    "Alimentos não aparecem": {
        causa: "alimentos.js não inicializou ou há erro de DOM",
        solucao: [
            "1. Verifique console para erros",
            "2. Clique em Alimentos para ativar seção",
            "3. Adicione um alimento",
            "4. Se não aparecer, abra DevTools",
            "5. Procure por id 'lista-alimentos' no HTML"
        ]
    },
    
    "Página lenta": {
        causa: "Muitos registros ou animações pesadas",
        solucao: [
            "1. Abra DevTools > Performance",
            "2. Grave uma sessão",
            "3. Procure por gargalos",
            "4. Se tiver 1000+ registros, esperado ser lento",
            "5. Considere arquivar dados antigos",
            "6. Desabilite animações em navegadores lentos"
        ]
    },
    
    "Botões não respondem": {
        causa: "Event listeners não anexados ou JavaScript bloqueado",
        solucao: [
            "1. Abra console (F12)",
            "2. Digite: document.querySelector('button').click()",
            "3. Se não funcionar, JS está bloqueado",
            "4. Verifique proteção do navegador",
            "5. Tente desabilitar extensões"
        ]
    }
};

// ===== VERIFICAÇÃO DE AMBIENTE =====

function verificarAmbiente() {
    console.log('🔍 VERIFICAÇÃO DE AMBIENTE:\n');
    
    const checks = {
        'LocalStorage': typeof localStorage !== 'undefined',
        'SessionStorage': typeof sessionStorage !== 'undefined',
        'LocalStorage disponível': (() => {
            try {
                localStorage.setItem('test', 'test');
                localStorage.removeItem('test');
                return true;
            } catch(e) {
                return false;
            }
        })(),
        'JavaScript habilitado': true,
        'DOM carregado': document.readyState === 'complete',
        'Módulo CONFIG': typeof CONFIG !== 'undefined',
        'Módulo Utils': typeof Utils !== 'undefined',
        'Módulo Notificacoes': typeof Notificacoes !== 'undefined',
        'Módulo Armazenamento': typeof ArmazenamentoDados !== 'undefined',
        'Chart.js': typeof Chart !== 'undefined',
        'jsPDF': typeof jspdf !== 'undefined',
        'html2canvas': typeof html2canvas !== 'undefined'
    };
    
    for (const [check, resultado] of Object.entries(checks)) {
        console.log(`${resultado ? '✅' : '❌'} ${check}`);
    }
    
    console.log('\n');
}

// ===== DEBUG DE DADOS =====

function debugarDados() {
    console.log('📊 DEBUG DE DADOS:\n');
    
    console.log('Glicemias:', ArmazenamentoDados.dados.glicemias.length);
    console.log('Metas:', ArmazenamentoDados.dados.metas.length);
    console.log('Alimentos:', ArmazenamentoDados.dados.alimentos.length);
    
    if (ArmazenamentoDados.dados.glicemias.length > 0) {
        const primeira = ArmazenamentoDados.dados.glicemias[0];
        console.log('\nPrimeiro registro:', primeira);
    }
    
    console.log('\nEspaço usado:', (() => {
        const str = JSON.stringify(localStorage);
        return (str.length / 1024).toFixed(2) + ' KB';
    })());
}

// ===== TESTE DE VELOCIDADE =====

function testarVelocidade() {
    console.log('⚡ TESTE DE VELOCIDADE:\n');
    
    console.time('Carregamento de dados');
    const dados = ArmazenamentoDados.obterGlicemias();
    console.timeEnd('Carregamento de dados');
    
    console.time('Cálculo de estatísticas');
    const stats = Utils.calcularEstatisticas(dados);
    console.timeEnd('Cálculo de estatísticas');
    
    console.log('Estatísticas:', stats);
}

// ===== FUNÇÃO DE DIAGNÓSTICO COMPLETO =====

function diagnosticoCompleto() {
    console.clear();
    console.log('🔧 DIAGNÓSTICO COMPLETO DO SISTEMA\n');
    console.log('=' .repeat(50) + '\n');
    
    verificarAmbiente();
    debugarDados();
    testarVelocidade();
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Diagnóstico concluído\n');
}

// ===== EXPORTAR DADOS PARA BACKUP =====

function exportarDados() {
    const dados = {
        glicemias: ArmazenamentoDados.dados.glicemias,
        metas: ArmazenamentoDados.dados.metas,
        alimentos: ArmazenamentoDados.dados.alimentos,
        exportado: new Date().toISOString()
    };
    
    const json = JSON.stringify(dados, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diabetescare-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    console.log('✅ Backup exportado:', a.download);
}

// ===== IMPORTAR DADOS DO BACKUP =====

function importarDados(arquivo) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const dados = JSON.parse(e.target.result);
            ArmazenamentoDados.dados = dados;
            ArmazenamentoDados.salvarDados();
            console.log('✅ Dados importados com sucesso');
            window.location.reload();
        } catch(err) {
            console.error('❌ Erro ao importar:', err);
        }
    };
    reader.readAsText(arquivo);
}

// ===== LISTAR COMANDOS DISPONÍVEIS =====

console.log('\n💡 COMANDOS DE DEBUG DISPONÍVEIS:\n');
console.log('verificarAmbiente()    - Verificar se tudo está carregado');
console.log('debugarDados()         - Ver quantidade de dados');
console.log('testarVelocidade()     - Testar performance');
console.log('diagnosticoCompleto()  - Diagnóstico completo');
console.log('exportarDados()        - Baixar backup em JSON');
console.log('limparConsole()        - Limpar console');
console.log('\n');

// Executar verificação automática
verificarAmbiente();
