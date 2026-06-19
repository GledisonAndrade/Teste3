/**
 * armazenamento.js - Gerenciador centralizado de dados
 * Versão 3.0 - Com validação e backup
 */

class GerenciadorDados {
    constructor() {
        this.dados = {
            glicemias: [],
            metas: [],
            alimentos: []
        };
        this.carregarDados();
    }

    /**
     * Carrega dados do localStorage
     */
    carregarDados() {
        try {
            for (const chave of Object.keys(CONFIG.storage)) {
                if (chave !== 'configuracoes') {
                    const storageKey = CONFIG.storage[chave];
                    const dadosStr = localStorage.getItem(storageKey);
                    if (dadosStr) {
                        this.dados[chave] = JSON.parse(dadosStr);
                    }
                }
            }
            console.log('✅ Dados carregados com sucesso');
        } catch (erro) {
            console.error('❌ Erro ao carregar dados:', erro);
            this.dados = { glicemias: [], metas: [], alimentos: [] };
        }
    }

    /**
     * Salva dados no localStorage com backup
     */
    salvarDados() {
        try {
            // Criar backup
            const backup = Utils.copiarProfundo(this.dados);
            localStorage.setItem('diabetescare_backup', JSON.stringify(backup));

            // Salvar dados principais
            for (const chave of Object.keys(this.dados)) {
                const storageKey = CONFIG.storage[chave];
                localStorage.setItem(storageKey, JSON.stringify(this.dados[chave]));
            }
            
            return { sucesso: true };
        } catch (erro) {
            console.error('❌ Erro ao salvar dados:', erro);
            return { sucesso: false, erro: erro.message };
        }
    }

    /**
     * Obtém todos os dados de glicemia
     * @param {object} filtros - Filtros opcionais { data, status }
     * @returns {array} Array de registros
     */
    obterGlicemias(filtros = {}) {
        let resultado = [...this.dados.glicemias];

        if (filtros.data) {
            resultado = resultado.filter(g => g.data === filtros.data);
        }

        if (filtros.status) {
            resultado = resultado.filter(g => g.statusClass === filtros.status);
        }

        if (filtros.dataInicio && filtros.dataFim) {
            resultado = resultado.filter(g => 
                g.data >= filtros.dataInicio && g.data <= filtros.dataFim
            );
        }

        return resultado.sort((a, b) => b.timestamp - a.timestamp);
    }

    /**
     * Adiciona novo registro de glicemia
     * @param {object} dados - { glicemia, data, hora, observacao }
     * @returns {object} { sucesso, registro, erro }
     */
    adicionarGlicemia(dados) {
        const validacao = Utils.validarGlicemia(dados.glicemia);
        if (!validacao.valido) {
            return { sucesso: false, erro: validacao.mensagem };
        }

        try {
            const registro = Utils.criarRegistroGlicemia(dados);
            this.dados.glicemias.push(registro);
            this.salvarDados();
            return { sucesso: true, registro };
        } catch (erro) {
            return { sucesso: false, erro: erro.message };
        }
    }

    /**
     * Exclui registro de glicemia
     * @param {number} id - ID do registro
     * @returns {object} { sucesso, erro }
     */
    excluirGlicemia(id) {
        const indice = this.dados.glicemias.findIndex(g => g.id === id);
        if (indice === -1) {
            return { sucesso: false, erro: 'Registro não encontrado' };
        }

        this.dados.glicemias.splice(indice, 1);
        this.salvarDados();
        return { sucesso: true };
    }

    /**
     * Obtém todas as metas
     * @param {string} filtro - 'todas', 'pendentes', 'concluidas'
     * @returns {array} Array de metas
     */
    obterMetas(filtro = 'todas') {
        let resultado = [...this.dados.metas];

        if (filtro === 'pendentes') {
            resultado = resultado.filter(m => !m.concluida);
        } else if (filtro === 'concluidas') {
            resultado = resultado.filter(m => m.concluida);
        }

        return resultado.sort((a, b) => {
            if (a.concluida === b.concluida) {
                return new Date(b.dataCriacao) - new Date(a.dataCriacao);
            }
            return a.concluida ? 1 : -1;
        });
    }

    /**
     * Adiciona nova meta
     * @param {object} dados - { descricao, dataLimite, categoria }
     * @returns {object} { sucesso, meta, erro }
     */
    adicionarMeta(dados) {
        if (!dados.descricao || dados.descricao.trim() === '') {
            return { sucesso: false, erro: 'Descrição é obrigatória' };
        }

        try {
            const meta = {
                id: Utils.gerarId(),
                descricao: dados.descricao.trim(),
                dataLimite: dados.dataLimite || '',
                categoria: dados.categoria || 'controle',
                concluida: false,
                dataCriacao: new Date().toISOString().split('T')[0]
            };

            this.dados.metas.push(meta);
            this.salvarDados();
            return { sucesso: true, meta };
        } catch (erro) {
            return { sucesso: false, erro: erro.message };
        }
    }

    /**
     * Marca meta como concluída
     * @param {string} id - ID da meta
     * @returns {object} { sucesso, erro }
     */
    concluirMeta(id) {
        const meta = this.dados.metas.find(m => m.id === id);
        if (!meta) {
            return { sucesso: false, erro: 'Meta não encontrada' };
        }

        meta.concluida = true;
        meta.dataConclusao = new Date().toISOString().split('T')[0];
        this.salvarDados();
        return { sucesso: true };
    }

    /**
     * Exclui meta
     * @param {string} id - ID da meta
     * @returns {object} { sucesso, erro }
     */
    excluirMeta(id) {
        const indice = this.dados.metas.findIndex(m => m.id === id);
        if (indice === -1) {
            return { sucesso: false, erro: 'Meta não encontrada' };
        }

        this.dados.metas.splice(indice, 1);
        this.salvarDados();
        return { sucesso: true };
    }

    /**
     * Obtém todos os alimentos
     * @param {string} categoria - Filtro opcional
     * @returns {array} Array de alimentos
     */
    obterAlimentos(categoria = '') {
        let resultado = [...this.dados.alimentos];

        if (categoria && categoria !== 'todos') {
            resultado = resultado.filter(a => a.categoria === categoria);
        }

        return resultado.sort((a, b) => new Date(b.data) - new Date(a.data));
    }

    /**
     * Adiciona novo alimento
     * @param {object} dados - { nome, quantidade, carboidratos, categoria, data, hora, observacao }
     * @returns {object} { sucesso, alimento, erro }
     */
    adicionarAlimento(dados) {
        if (!dados.nome || dados.nome.trim() === '') {
            return { sucesso: false, erro: 'Nome do alimento é obrigatório' };
        }

        try {
            const alimento = {
                id: Utils.gerarId(),
                nome: dados.nome.trim(),
                quantidade: parseInt(dados.quantidade) || 0,
                carboidratos: parseFloat(dados.carboidratos) || 0,
                categoria: dados.categoria || 'outros',
                data: dados.data,
                hora: dados.hora,
                observacao: dados.observacao || '',
                indiceGlicemico: dados.indiceGlicemico || 'Médio',
                timestamp: dados.data && dados.hora
                    ? new Date(`${dados.data}T${dados.hora}`).getTime()
                    : Date.now(),
                criado: new Date().toISOString()
            };

            this.dados.alimentos.push(alimento);
            this.salvarDados();
            return { sucesso: true, alimento };
        } catch (erro) {
            return { sucesso: false, erro: erro.message };
        }
    }

    /**
     * Exclui alimento
     * @param {string} id - ID do alimento
     * @returns {object} { sucesso, erro }
     */
    excluirAlimento(id) {
        const indice = this.dados.alimentos.findIndex(a => a.id === id);
        if (indice === -1) {
            return { sucesso: false, erro: 'Alimento não encontrado' };
        }

        this.dados.alimentos.splice(indice, 1);
        this.salvarDados();
        return { sucesso: true };
    }

    /**
     * Obtém estatísticas completas
     * @param {object} filtros - { dataInicio, dataFim }
     * @returns {object} Objeto com estatísticas
     */
    obterEstatisticas(filtros = {}) {
        const glicemias = this.obterGlicemias(filtros);
        const metas = this.obterMetas('todas');
        const metasConcluidas = metas.filter(m => m.concluida).length;

        return {
            glicemia: Utils.calcularEstatisticas(glicemias),
            metas: {
                total: metas.length,
                concluidas: metasConcluidas,
                percentualConclusao: metas.length > 0 ? Math.round((metasConcluidas / metas.length) * 100) : 0
            },
            registrosGlicemia: glicemias.length,
            periodoDias: filtros.dataInicio && filtros.dataFim 
                ? Utils.diferencaDias(filtros.dataInicio, filtros.dataFim)
                : null
        };
    }

    /**
     * Restaura dados do backup
     * @returns {object} { sucesso, erro }
     */
    restaurarBackup() {
        try {
            const backup = localStorage.getItem('diabetescare_backup');
            if (!backup) {
                return { sucesso: false, erro: 'Nenhum backup disponível' };
            }

            this.dados = JSON.parse(backup);
            this.salvarDados();
            return { sucesso: true };
        } catch (erro) {
            return { sucesso: false, erro: erro.message };
        }
    }

    /**
     * Limpa todos os dados (com confirmação)
     * @returns {object} { sucesso, erro }
     */
    limparTodosDados() {
        try {
            this.dados = { glicemias: [], metas: [], alimentos: [] };
            localStorage.clear();
            return { sucesso: true };
        } catch (erro) {
            return { sucesso: false, erro: erro.message };
        }
    }
}

// Criar instância global
window.ArmazenamentoDados = new GerenciadorDados();
