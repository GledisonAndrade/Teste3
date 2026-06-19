/**
 * notificacoes.js - Sistema de notificações profissional
 * Versão 3.0 - Com fila e tipos variados
 */

class SistemaNotificacoes {
    constructor() {
        this.fila = [];
        this.exibindo = false;
        this.duracao = CONFIG.notificacoes.duracao || 3000;
        this.criarConteiner();
    }

    criarConteiner() {
        let conteiner = document.getElementById('notificacoes-conteiner');
        if (!conteiner) {
            conteiner = document.createElement('div');
            conteiner.id = 'notificacoes-conteiner';
            conteiner.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: 400px;
            `;
            document.body.appendChild(conteiner);
        }
        return conteiner;
    }

    /**
     * Exibe notificação
     * @param {string} mensagem - Texto da notificação
     * @param {string} tipo - Tipo: 'sucesso', 'erro', 'info', 'aviso'
     * @param {number} duracao - Duração em ms (opcional)
     */
    exibir(mensagem, tipo = 'info', duracao = null) {
        this.fila.push({ mensagem, tipo, duracao: duracao || this.duracao });
        this.processarFila();
    }

    processarFila() {
        if (this.exibindo || this.fila.length === 0) return;
        
        this.exibindo = true;
        const { mensagem, tipo, duracao } = this.fila.shift();
        this.mostrarNotificacao(mensagem, tipo, duracao);
    }

    mostrarNotificacao(mensagem, tipo, duracao) {
        const conteiner = this.criarConteiner();
        const notif = document.createElement('div');
        
        const estilos = {
            sucesso: {
                bg: '#10b981',
                icon: 'check-circle',
                border: '1px solid #059669'
            },
            erro: {
                bg: '#ef4444',
                icon: 'exclamation-circle',
                border: '1px solid #dc2626'
            },
            info: {
                bg: '#3b82f6',
                icon: 'info-circle',
                border: '1px solid #1d4ed8'
            },
            aviso: {
                bg: '#f59e0b',
                icon: 'alert-triangle',
                border: '1px solid #d97706'
            }
        };

        const estilo = estilos[tipo] || estilos.info;

        notif.className = `notificacao notificacao-${tipo}`;
        notif.style.cssText = `
            background: ${estilo.bg};
            color: white;
            padding: 14px 16px;
            border-radius: 8px;
            border: ${estilo.border};
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 12px;
            animation: slideInRight 0.3s ease;
            font-size: 14px;
            font-weight: 500;
        `;

        notif.innerHTML = `
            <i class="fas fa-${estilo.icon}"></i>
            <span>${mensagem}</span>
            <button class="fechar-notif" style="
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                margin-left: auto;
                opacity: 0.7;
                transition: opacity 0.2s;
            ">
                <i class="fas fa-times"></i>
            </button>
        `;

        conteiner.appendChild(notif);

        const fecharBtn = notif.querySelector('.fechar-notif');
        const fechar = () => {
            notif.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                notif.remove();
                this.exibindo = false;
                this.processarFila();
            }, 300);
        };

        fecharBtn.addEventListener('click', fechar);
        
        setTimeout(() => {
            if (notif.parentNode) fechar();
        }, duracao);
    }

    sucesso(mensagem, duracao) {
        this.exibir(mensagem, 'sucesso', duracao);
    }

    erro(mensagem, duracao) {
        this.exibir(mensagem, 'erro', duracao);
    }

    info(mensagem, duracao) {
        this.exibir(mensagem, 'info', duracao);
    }

    aviso(mensagem, duracao) {
        this.exibir(mensagem, 'aviso', duracao);
    }

    limpar() {
        const conteiner = document.getElementById('notificacoes-conteiner');
        if (conteiner) {
            conteiner.innerHTML = '';
            this.fila = [];
            this.exibindo = false;
        }
    }
}

// Criar instância global
window.Notificacoes = new SistemaNotificacoes();

// Adicionar estilos de animação
const styleAnimacoes = document.createElement('style');
styleAnimacoes.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }

    .fechar-notif:hover {
        opacity: 1 !important;
    }
`;
document.head.appendChild(styleAnimacoes);
