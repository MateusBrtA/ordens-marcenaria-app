# Guia de Hospedagem - Sistema de Ordens de Marcenaria

## Sobre a Aplicação

Esta é uma aplicação web completa para gerenciar ordens de marcenaria, desenvolvida em React com as seguintes funcionalidades:

### Funcionalidades Implementadas:
- ✅ **Adicionar Ordens**: Criar novas ordens com ID, descrição, datas, marceneiro e materiais
- ✅ **Gerenciar Marceneiros**: Adicionar/remover marceneiros e visualizar estatísticas
- ✅ **Exportar Excel**: Exportar todas as ordens para arquivo .xlsx
- ✅ **Filtros Avançados**: Buscar por ID, filtrar por marceneiro e status
- ✅ **Visualização Dupla**: Modo cards (colunas) e modo tabela (linhas)
- ✅ **Status Automático**: Atualização automática de status baseada nas datas
- ✅ **Gerenciar Materiais**: Adicionar/remover materiais de cada ordem
- ✅ **Interface Responsiva**: Funciona em desktop e mobile

### Status Disponíveis:
- **Atrasada**: Automaticamente aplicado quando passa da data de saída
- **Para Hoje**: Automaticamente aplicado no dia da estimativa de saída
- **Em Processo**: Status manual para ordens em andamento
- **Recebida**: Status inicial das novas ordens
- **Concluída**: Status final das ordens finalizadas

---

## Opções de Hospedagem Gratuita

### 1. Vercel (Recomendado) ⭐

**Vantagens**: Deploy automático, domínio gratuito, SSL, muito fácil de usar

**Passos**:
1. Acesse [vercel.com](https://vercel.com)
2. Faça login com GitHub, GitLab ou Bitbucket
3. Clique em "New Project"
4. Conecte seu repositório ou faça upload da pasta `dist/`
5. Configure:
   - Framework Preset: "Other"
   - Build Command: `pnpm run build`
   - Output Directory: `dist`
6. Clique em "Deploy"

**Resultado**: Sua aplicação estará disponível em `https://seu-projeto.vercel.app`

### 2. Netlify

**Vantagens**: Drag & drop deploy, formulários gratuitos, domínio personalizado

**Passos**:
1. Acesse [netlify.com](https://netlify.com)
2. Faça cadastro/login
3. Arraste a pasta `dist/` para a área de deploy
4. Ou conecte com Git para deploy automático

**Resultado**: Aplicação disponível em `https://random-name.netlify.app`

### 3. GitHub Pages

**Vantagens**: Integração total com GitHub, versionamento

**Passos**:
1. Crie um repositório no GitHub
2. Faça upload de todos os arquivos do projeto
3. Vá em Settings > Pages
4. Configure Source: "GitHub Actions"
5. Crie arquivo `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - uses: actions/setup-node@v2
      with:
        node-version: '18'
    - run: npm install -g pnpm
    - run: pnpm install
    - run: pnpm run build
    - uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

### 4. Firebase Hosting

**Vantagens**: Google Cloud, SSL automático, CDN global

**Passos**:
1. Instale Firebase CLI: `npm install -g firebase-tools`
2. Execute `firebase login`
3. Execute `firebase init hosting`
4. Configure public directory como `dist`
5. Execute `firebase deploy`

### 5. Surge.sh

**Vantagens**: Deploy via linha de comando, muito simples

**Passos**:
1. Instale: `npm install -g surge`
2. Na pasta do projeto: `cd dist`
3. Execute: `surge`
4. Siga as instruções para escolher domínio

---

## Hospedagem no Seu Próprio Computador

### Opção 1: Servidor Local Simples

```bash
# Instalar servidor HTTP simples
npm install -g http-server

# Navegar para pasta dist
cd ordens-marcenaria/dist

# Iniciar servidor na porta 8080
http-server -p 8080

# Acessar em: http://localhost:8080
```

### Opção 2: Usando Python (se disponível)

```bash
# Python 3
cd ordens-marcenaria/dist
python -m http.server 8080

# Python 2
python -m SimpleHTTPServer 8080
```

### Opção 3: Expor para Internet (Temporário)

Para tornar acessível externamente, você pode usar:

1. **ngrok** (Recomendado):
   ```bash
   # Instalar ngrok
   npm install -g ngrok
   
   # Expor porta local
   ngrok http 8080
   ```

2. **localtunnel**:
   ```bash
   npm install -g localtunnel
   lt --port 8080
   ```

---

## Configuração de Domínio Personalizado

### Para Vercel:
1. Vá em Project Settings > Domains
2. Adicione seu domínio
3. Configure DNS conforme instruções

### Para Netlify:
1. Vá em Site Settings > Domain Management
2. Adicione custom domain
3. Configure DNS records

---

## Backup e Manutenção

### Backup dos Dados:
- A aplicação armazena dados no localStorage do navegador
- Use a função "Exportar Excel" regularmente para backup
- Para backup automático, considere integrar com Google Sheets API

### Atualizações:
1. Faça alterações no código
2. Execute `pnpm run build`
3. Faça novo deploy da pasta `dist/`

---

## Solução de Problemas

### Problema: Página em branco após deploy
**Solução**: Verifique se o caminho base está correto no `vite.config.js`

### Problema: Arquivos não carregam
**Solução**: Certifique-se de que todos os arquivos da pasta `dist/` foram enviados

### Problema: Funcionalidades não funcionam
**Solução**: Verifique o console do navegador para erros JavaScript

---

## Próximos Passos (Melhorias Futuras)

1. **Banco de Dados**: Integrar com Firebase/Supabase para persistência real
2. **Autenticação**: Adicionar login de usuários
3. **Notificações**: Alertas para ordens atrasadas
4. **Relatórios**: Gráficos e estatísticas avançadas
5. **API**: Backend para múltiplos usuários
6. **PWA**: Transformar em Progressive Web App
7. **Sincronização**: Backup automático na nuvem

---

## Suporte

Para dúvidas ou problemas:
1. Verifique o console do navegador (F12)
2. Teste em modo incógnito
3. Limpe cache do navegador
4. Verifique se JavaScript está habilitado

**Aplicação desenvolvida com React + Vite + TailwindCSS + shadcn/ui**

