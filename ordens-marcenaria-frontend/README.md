# Sistema de Gerenciamento de Ordens de Marcenaria

Uma aplicação web moderna e responsiva para gerenciar ordens de serviço de marcenaria, desenvolvida com React, TailwindCSS e shadcn/ui.

![Sistema de Ordens](https://img.shields.io/badge/Status-Pronto-green)
![React](https://img.shields.io/badge/React-18.x-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-blue)

## 🚀 Funcionalidades

### ✅ Gerenciamento de Ordens
- Criar novas ordens com ID único
- Definir descrição detalhada do serviço
- Configurar datas de entrada e saída
- Atribuir marceneiros responsáveis
- Gerenciar lista de materiais necessários

### ✅ Controle de Status Automático
- **Atrasada**: Automaticamente aplicado quando passa da data de saída
- **Para Hoje**: Aplicado no dia da estimativa de saída
- **Em Processo**: Status manual para ordens em andamento
- **Recebida**: Status inicial das novas ordens
- **Concluída**: Status final das ordens finalizadas

### ✅ Gerenciamento de Marceneiros
- Adicionar e remover marceneiros
- Visualizar estatísticas por marceneiro
- Contagem de ordens por status
- Histórico de trabalhos realizados

### ✅ Filtros e Busca Avançada
- Buscar ordens por número/ID
- Filtrar por marceneiro responsável
- Filtrar por status específicos
- Combinação de múltiplos filtros

### ✅ Modos de Visualização
- **Modo Cards**: Visualização em colunas por status (como Kanban)
- **Modo Tabela**: Visualização em linhas com informações condensadas
- Alternância rápida entre os modos

### ✅ Exportação de Dados
- Exportar todas as ordens para arquivo Excel (.xlsx)
- Backup completo dos dados
- Formato compatível com planilhas

### ✅ Interface Responsiva
- Funciona perfeitamente em desktop e mobile
- Design moderno e intuitivo
- Cores e layout baseados nas especificações fornecidas

## 🛠️ Tecnologias Utilizadas

- **React 18** - Framework JavaScript
- **Vite** - Build tool e dev server
- **TailwindCSS** - Framework CSS utilitário
- **shadcn/ui** - Componentes UI modernos
- **Lucide React** - Ícones
- **XLSX** - Exportação para Excel
- **pnpm** - Gerenciador de pacotes

## 📦 Instalação e Execução

### Pré-requisitos
- Node.js 18+ 
- pnpm (ou npm/yarn)

### Passos para executar localmente:

1. **Clone ou baixe o projeto**
   ```bash
   # Se usando Git
   git clone <url-do-repositorio>
   cd ordens-marcenaria
   ```

2. **Instale as dependências**
   ```bash
   pnpm install
   # ou
   npm install
   ```

3. **Execute em modo desenvolvimento**
   ```bash
   pnpm run dev
   # ou
   npm run dev
   ```

4. **Acesse a aplicação**
   - Abra o navegador em `http://localhost:5173`

### Build para produção:
```bash
pnpm run build
# ou
npm run build
```

Os arquivos de produção estarão na pasta `dist/`

## 🌐 Hospedagem

Para hospedar a aplicação online gratuitamente, consulte o arquivo `GUIA_HOSPEDAGEM.md` que contém instruções detalhadas para:

- **Vercel** (Recomendado)
- **Netlify** 
- **GitHub Pages**
- **Firebase Hosting**
- **Surge.sh**
- **Servidor próprio**

## 📱 Como Usar

### 1. Adicionar Nova Ordem
1. Clique em "Adicionar Ordem"
2. Preencha os campos obrigatórios:
   - Número da ordem (ex: OS-123)
   - Descrição do serviço
   - Data de entrada
   - Estimativa de saída
3. Opcionalmente:
   - Selecione um marceneiro
   - Adicione materiais iniciais
4. Clique em "Salvar Ordem"

### 2. Gerenciar Marceneiros
1. Clique em "Gerenciar Marceneiros"
2. Digite o nome do novo marceneiro
3. Clique em "Adicionar"
4. Visualize estatísticas de cada marceneiro
5. Remova marceneiros se necessário

### 3. Editar Ordens
- **Alterar Status**: Use o dropdown na própria ordem
- **Gerenciar Materiais**: Clique no botão "Materiais"
- **Excluir Ordem**: Clique no ícone de lixeira

### 4. Filtrar e Buscar
- Use a barra de busca para encontrar ordens por ID
- Selecione marceneiro específico no filtro
- Marque/desmarque status para filtrar visualização

### 5. Alternar Visualização
- Use os botões de grade/lista no canto superior direito
- **Modo Cards**: Melhor para visão geral do fluxo
- **Modo Tabela**: Melhor para visualizar muitas ordens

### 6. Exportar Dados
1. Clique em "Exportar Excel"
2. O arquivo será baixado automaticamente
3. Abra com Excel, LibreOffice ou Google Sheets

## 💾 Armazenamento de Dados

A aplicação utiliza o **localStorage** do navegador para armazenar os dados localmente. Isso significa:

- ✅ **Vantagens**: Funciona offline, sem necessidade de servidor
- ⚠️ **Limitações**: Dados ficam apenas no navegador atual
- 📋 **Backup**: Use a função "Exportar Excel" regularmente

## 🔧 Personalização

### Cores e Estilos
Os estilos podem ser modificados em:
- `src/App.css` - Estilos customizados
- `tailwind.config.js` - Configuração do TailwindCSS

### Adicionar Funcionalidades
A estrutura modular permite fácil extensão:
- Novos componentes em `src/components/`
- Utilitários em `src/utils/`
- Hooks customizados em `src/hooks/`

## 🐛 Solução de Problemas

### Aplicação não carrega
1. Verifique se Node.js está instalado
2. Execute `pnpm install` novamente
3. Limpe cache: `pnpm run dev --force`

### Dados perdidos
1. Verifique se está no mesmo navegador
2. Não use modo incógnito para uso regular
3. Faça backup regular com "Exportar Excel"

### Problemas de performance
1. Feche outras abas do navegador
2. Atualize a página (F5)
3. Limpe cache do navegador

## 📈 Próximas Melhorias

- [ ] Integração com banco de dados (Firebase/Supabase)
- [ ] Sistema de autenticação de usuários
- [ ] Notificações push para ordens atrasadas
- [ ] Relatórios e gráficos avançados
- [ ] API REST para múltiplos clientes
- [ ] Progressive Web App (PWA)
- [ ] Sincronização automática na nuvem
- [ ] Impressão de ordens de serviço
- [ ] Histórico de alterações
- [ ] Anexos de arquivos/fotos

## 📄 Licença

Este projeto foi desenvolvido como solução personalizada para gerenciamento de marcenaria.

## 🤝 Suporte

Para dúvidas ou problemas:
1. Verifique este README
2. Consulte o `GUIA_HOSPEDAGEM.md`
3. Verifique o console do navegador (F12)
4. Teste em modo incógnito

---

**Desenvolvido com ❤️ para otimizar o gerenciamento de ordens de marcenaria**

