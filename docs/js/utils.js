/**
 * utils.js - Funções utilitárias compartilhadas
 * Versão 3.0 - Profissionalizado
 */

class Utils {
    /**
     * Formata data para formato brasileiro
     * @param {string} data - Data em formato ISO (YYYY-MM-DD)
     * @returns {string} Data formatada (DD/MM/YYYY)
     */
    static formatarData(data) {
        if (!data || typeof data !== 'string') return '';
        const [ano, mes, dia] = data.split('-');
        return `${dia}/${mes}/${ano}`;
    }

    /**
     * Converte data brasileira para ISO
     * @param {string} dataBr - Data em formato brasileiro (DD/MM/YYYY)
     * @returns {string} Data em formato ISO (YYYY-MM-DD)
     */
    static dataBrParaISO(dataBr) {
        if (!dataBr) return '';
        const [dia, mes, ano] = dataBr.split('/');
        return `${ano}-${mes}-${dia}`;
    }

    /**
     * Obtém a categoria de glicemia baseada no valor
     * @param {number} glicemia - Valor de glicemia
     * @returns {object} Objeto com status e statusClass
     */
    static obterCategoriaGlicemia(glicemia) {
        const g = parseInt(glicemia);
        
        if (g < CONFIG.glicemia.baixa) {
            return {
                status: CONFIG.glicemia.categorias.baixa.label,
                statusClass: 'baixa',
                cor: CONFIG.glicemia.categorias.baixa.cor
            };
        } else if (g <= CONFIG.glicemia.alvo_maximo) {
            return {
                status: CONFIG.glicemia.categorias.normal.label,
                statusClass: 'normal',
                cor: CONFIG.glicemia.categorias.normal.cor
            };
        } else if (g <= CONFIG.glicemia.alta) {
            return {
                status: CONFIG.glicemia.categorias.alta.label,
                statusClass: 'alta',
                cor: CONFIG.glicemia.categorias.alta.cor
            };
        } else {
            return {
                status: CONFIG.glicemia.categorias.muito_alta.label,
                statusClass: 'muito-alta',
                cor: CONFIG.glicemia.categorias.muito_alta.cor
            };
        }
    }

    /**
     * Valida valor de glicemia
     * @param {number} glicemia - Valor a validar
     * @returns {object} { valido: boolean, mensagem: string }
     */
    static validarGlicemia(glicemia) {
        const g = parseInt(glicemia);
        
        if (isNaN(g)) {
            return { valido: false, mensagem: 'Glicemia deve ser um número' };
        }
        
        if (g < CONFIG.glicemia.minimo || g > CONFIG.glicemia.maximo) {
            return { 
                valido: false, 
                mensagem: `Glicemia deve estar entre ${CONFIG.glicemia.minimo} e ${CONFIG.glicemia.maximo} mg/dL` 
            };
        }
        
        return { valido: true, mensagem: '' };
    }

    /**
     * Formata nome de categoria
     * @param {string} categoria - Categoria a formatar
     * @param {string} tipo - Tipo de categoria (metas, alimentos)
     * @returns {string} Categoria formatada
     */
    static formatarCategoria(categoria, tipo = 'metas') {
        if (tipo === 'alimentos') {
            return CONFIG.alimentos.categorias[categoria] || categoria;
        }
        return CONFIG.metas.categorias[categoria] || categoria;
    }

    /**
     * Cria objeto de registro de glicemia
     * @param {object} dados - Dados do registro
     * @returns {object} Registro com estrutura completa
     */
    static criarRegistroGlicemia(dados) {
        const { glicemia, data, hora, observacao } = dados;
        const categoria = Utils.obterCategoriaGlicemia(glicemia);
        
        return {
            id: Date.now(),
            glicemia: parseInt(glicemia),
            data,
            hora,
            observacao: observacao || '',
            status: categoria.status,
            statusClass: categoria.statusClass,
            timestamp: new Date(`${data}T${hora}`).getTime(),
            criado: new Date().toISOString()
        };
    }

    /**
     * Calcula estatísticas de glicemia
     * @param {array} glicemias - Array de registros de glicemia
     * @returns {object} Objeto com estatísticas
     */
    static calcularEstatisticas(glicemias) {
        if (!glicemias || glicemias.length === 0) {
            return {
                total: 0,
                media: 0,
                minimo: 0,
                maximo: 0,
                mediana: 0
            };
        }

        const valores = glicemias.map(g => g.glicemia);
        const total = valores.length;
        const media = Math.round(valores.reduce((a, b) => a + b, 0) / total);
        const minimo = Math.min(...valores);
        const maximo = Math.max(...valores);
        
        const ordenados = [...valores].sort((a, b) => a - b);
        const mediana = total % 2 === 0
            ? Math.round((ordenados[total / 2 - 1] + ordenados[total / 2]) / 2)
            : ordenados[Math.floor(total / 2)];

        return { total, media, minimo, maximo, mediana };
    }

    /**
     * Gera ID único
     * @returns {string} ID único baseado em timestamp
     */
    static gerarId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Cria uma cópia profunda de um objeto
     * @param {object} obj - Objeto a copiar
     * @returns {object} Cópia profunda
     */
    static copiarProfundo(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    /**
     * Formata número com separador de milhares
     * @param {number} num - Número a formatar
     * @returns {string} Número formatado
     */
    static formatarNumero(num) {
        return new Intl.NumberFormat('pt-BR').format(num);
    }

    /**
     * Obtém diferença entre datas em dias
     * @param {string} data1 - Data inicial (ISO)
     * @param {string} data2 - Data final (ISO)
     * @returns {number} Diferença em dias
     */
    static diferencaDias(data1, data2) {
        const d1 = new Date(data1);
        const d2 = new Date(data2);
        const diffTime = Math.abs(d2 - d1);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
}

// Exportar para uso global
window.Utils = Utils;
