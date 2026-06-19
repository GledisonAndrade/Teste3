# DiabetesCare - Sistema de Monitoramento de Glicemia

## 📋 Descrição

**DiabetesCare** é um sistema web profissional de monitoramento e controle de diabetes, desenvolvido com tecnologias modernas e foco em usabilidade, acessibilidade e performance.

**Versão:** 3.0  
**Desenvolvido por:** Gledison Arruda Andrade  
**Data:** 19 de junho de 2025

---

## ✨ Funcionalidades Principais

### 📊 Registro de Glicemia
- Registre seus níveis de glicemia com data, hora e observações
- Indicador visual de status (Baixa, Normal, Alta, Muito Alta)
- Validação automática de valores
- Histórico completo com filtros por data e status

### 📈 Gráficos Interativos
- Visualização gráfica da evolução de glicemia
- Períodos pré-definidos: 7, 14, 30, 60, 90 dias
- Período personalizado
- Atualização automática de dados

### 🎯 Metas de Tratamento
- Defina e acompanhe metas pessoais
- Categorias: Exercício, Alimentação, Medicação, Controle
- Marque metas como concluídas
- Acompanhe percentual de conclusão

### 🍎 Registro de Alimentos
- Registre alimentos consumidos
- Rastreie carboidratos e quantidade
- Filtre por categoria
- Relacione com impacto na glicemia

### 📋 Índice Glicêmico
- Calcule estatísticas: média, mínimo, máximo, mediana
- Análise por período
- Relatório de desempenho

### 📄 Relatórios em PDF
- Gere relatórios completos ou simples
- Inclua gráficos e estatísticas
- Personalize períodos
- Baixe como PDF para compartilhar com médico

### 🔔 Alertas e Notificações
- Configure alertas para níveis críticos
- Sistema inteligente de notificações
- Contato de emergência configurável

### 🎨 Temas Personalizados
- Tema Claro
- Tema Escuro
- Tema Verde
- Tema Azul

### ♿ Acessibilidade
- Navegação por teclado completa
- Labels semânticas
- Suporte a leitores de tela
- Contraste adequado

---

## 🚀 Como Usar

### Instalação
1. Baixe os arquivos do repositório
2. Coloque em um servidor web (localhost, XAMPP, etc.)
3. Abra `index.html` no navegador
4. Sistema está pronto para usar!

### Primeiro Acesso
- Dados de demonstração são carregados automaticamente
- Você pode excluir e adicionar seus próprios dados
- Todos os dados são armazenados localmente no navegador

### Registrar Glicemia
1. Na seção "Registrar"
2. Insira o valor de glicemia
3. Selecione data e hora
4. (Opcional) Adicione observações
5. Clique em "Registrar Glicemia"

### Visualizar Histórico
1. Acesse "Histórico"
2. Filtre por data ou status
3. Veja todos os seus registros
4. Exclua registros clicando no ícone de lixeira

### Criar Metas
1. Na seção "Metas"
2. Descreva sua meta
3. (Opcional) Defina data limite e categoria
4. Clique em "Adicionar Meta"
5. Marque como concluída quando atingir

### Gerar Relatórios
1. Acesse "Relatórios"
2. Escolha o período desejado
3. Selecione o tipo de relatório
4. Clique em "Gerar Relatório"
5. Baixe como PDF

---

## 📁 Estrutura de Arquivos

```
teste3/
├── index.html              # Arquivo principal
├── js/
│   ├── config.js           # Configurações centralizadas (NEW)
│   ├── utils.js            # Funções utilitárias (NEW)
│   ├── notificacoes.js     # Sistema de notificações (NEW)
│   ├── armazenamento.js    # Gerenciador de dados (NEW)
│   ├── script.js           # Lógica principal (REFATORADO)
│   ├── temas.js            # Sistema de temas
│   ├── graficos.js         # Gráficos com Chart.js
│   ├── relatorios.js       # Geração de relatórios
│   ├── indice.js           # Cálculo de índices
│   └── alimentos.js        # Gerenciamento de alimentos
├── css/
│   ├── style.css           # Estilos principais
│   ├── temas.css           # Estilos dos temas
│   ├── profissional.css    # Estilos profissionais
│   ├── graficos.css        # Estilos dos gráficos
│   └── aprimoramentos.css  # Melhorias e refinamentos (NEW)
├── imagens/
│   └── diabetes.png        # Logo do sistema
└── README.md               # Este arquivo
```

---

## 🛠️ Melhorias na Versão 3.0

### Arquitetura
- ✅ Modularização completa
- ✅ Padrões de design profissionais
- ✅ Separação de responsabilidades
- ✅ Código mais limpo e manutenível

### Dados
- ✅ Gerenciador centralizado
- ✅ Validação robusto
- ✅ Sistema de backup automático
- ✅ Melhor estrutura de dados

### UI/UX
- ✅ Animações suaves
- ✅ Feedback visual melhorado
- ✅ Notificações profissionais
- ✅ Responsividade otimizada
- ✅ Acessibilidade WCAG 2.1

### Performance
- ✅ Código otimizado
- ✅ Lazy loading onde apropriado
- ✅ Menor consumo de memória
- ✅ Carregamento mais rápido

### Segurança
- ✅ Validação de entrada
- ✅ Proteção XSS
- ✅ Dados locais (sem servidor)
- ✅ Backup automático

---

## 💾 Armazenamento de Dados

Todos os dados são armazenados **localmente** no navegador usando `localStorage`:

- **Glicemias:** Máximo 5-10 MB (depende do navegador)
- **Metas:** Sem limite prático
- **Alimentos:** Sem limite prático
- **Backup automático:** A cada salvamento

### Exportar Dados
Abra o console do navegador (F12) e execute:
```javascript
localStorage.getItem('glicemias')
localStorage.getItem('metas')
localStorage.getItem('alimentos')
```

### Limpar Dados (Cuidado!)
```javascript
localStorage.clear() // Apaga TUDO
```

---

## 🔧 Configuração Técnica

### Navegadores Suportados
- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Opera 76+

### Dependências Externas
- **Chart.js** - Gráficos interativos
- **jsPDF** - Geração de PDF
- **html2canvas** - Captura de tela
- **Font Awesome** - Ícones
- **Google Fonts** - Tipografia

### Requerimentos
- Navegador moderno com suporte a:
  - ES6+ JavaScript
  - localStorage
  - Canvas API
  - CSS Grid/Flexbox

---

## 📞 Suporte e Contato

**Desenvolvedor:** Gledison Arruda Andrade  
**Email:** saudetec@gmail.com  
**Versão:** 3.0 (19/06/2025)

---

## ⚠️ Aviso Importante

⚠️ **ESTE SISTEMA NÃO SUBSTITUI ATENDIMENTO MÉDICO**

- Consulte sempre seu médico regularmente
- Use este sistema como ferramenta de apoio
- Mantenha registros médicos oficiais
- Em caso de emergência, procure atendimento médico imediatamente

---

## 📝 Licença

Uso pessoal e educacional permitido.

---

## 🚀 Próximas Melhorias Planejadas

- [ ] Sincronização em nuvem
- [ ] Aplicativo mobile
- [ ] Integração com wearables
- [ ] API para médicos
- [ ] Análise por IA
- [ ] Compartilhamento seguro
- [ ] Multi-usuário

---

**Última atualização:** 19 de junho de 2025  
**Versão:** 3.0
