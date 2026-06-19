/**
 * config.js - Configurações centralizadas do DiabetesCare
 * Versão 3.0 - Profissionalizado
 */

const CONFIG = {
    // Limites de glicemia (mg/dL)
    glicemia: {
        minimo: 20,
        maximo: 600,
        baixa: 70,
        alvo_minimo: 70,
        alvo_maximo: 180,
        alta: 250,
        categorias: {
            baixa: { label: 'Baixa', cor: '#e74c3c', icon: 'arrow-down' },
            normal: { label: 'Normal', cor: '#2ecc71', icon: 'check' },
            alta: { label: 'Alta', cor: '#f39c12', icon: 'arrow-up' },
            muito_alta: { label: 'Muito Alta', cor: '#c0392b', icon: 'exclamation' }
        }
    },

    // Categorias de metas
    metas: {
        categorias: {
            exercicio: 'Exercício',
            alimentacao: 'Alimentação',
            medicacao: 'Medicação',
            controle: 'Controle'
        }
    },

    // Categorias de alimentos
    alimentos: {
        categorias: {
            cereais: 'Cereais',
            frutas: 'Frutas',
            vegetais: 'Vegetais',
            proteinas: 'Proteínas',
            laticinios: 'Laticínios',
            doces: 'Doces',
            bebidas: 'Bebidas',
            outros: 'Outros'
        }
    },

    // Períodos para gráficos
    periodos: [7, 14, 30, 60, 90],

    // Notificações
    notificacoes: {
        duracao: 3000,
        posicao: { bottom: '20px', right: '20px' }
    },

    // Storage
    storage: {
        glicemias: 'glicemias',
        metas: 'metas',
        alimentos: 'alimentos',
        configuracoes: 'diabetescare_config'
    }
};

// Exportar para uso global
window.CONFIG = CONFIG;
