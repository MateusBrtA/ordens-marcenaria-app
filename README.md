# Sistema de Ordens de Marcenaria

Sistema completo para gerenciamento de ordens de serviço de marcenaria, com backend Flask, frontend React e automação para ngrok.

## 🚀 Início Rápido

### Pré-requisitos

1. **Python 3.6+** instalado
2. **ngrok** instalado ([Download aqui](https://ngrok.com/download))
3. **Node.js** (para desenvolvimento do frontend)

### Configuração Inicial

1. **Configure seu token do ngrok:**
   - Acesse [https://dashboard.ngrok.com/get-started/your-authtoken](https://dashboard.ngrok.com/get-started/your-authtoken)
   - Copie seu token de autenticação
   - Edite o arquivo `config.json` e substitua `SEU_NGROK_AUTHTOKEN_AQUI` pelo seu token

2. **Instale as dependências do backend:**
   ```bash
   cd ordens-marcenaria-backend
   pip install -r requirements.txt
   ```

3. **Instale as dependências do frontend (se necessário):**
   ```bash
   cd ordens-marcenaria-frontend
   npm install
   ```

### Executar o Sistema

#### Windows
```bash
start_server.bat
```

#### Linux/Mac
```bash
./start_server.sh
```

#### Manualmente
```bash
python start_server.py
```

## 📋 Funcionalidades

### ✅ Problemas Corrigidos

- **Persistência de dados:** O banco SQLite agora mantém os dados entre reinicializações
- **Login no Vercel:** Corrigido problemas de autenticação e CORS
- **Aba de marceneiros:** Agora mostra corretamente os marceneiros e suas estatísticas
- **Exportação Excel:** Exporta todos os dados do banco, não apenas do frontend
- **URL dinâmica:** O frontend agora pode ser configurado para qualquer URL do ngrok
- **Recarregamento automático:** Dados são atualizados automaticamente a cada 30 segundos

### 🔧 Melhorias Implementadas

- **Configuração dinâmica do backend:** Interface para alterar a URL do ngrok sem editar código
- **Automação completa:** Script que inicia Flask e ngrok automaticamente
- **Monitoramento de conexão:** Indicador visual do status da conexão com o backend
- **Logs detalhados:** Sistema de logs para facilitar debugging
- **Tratamento de erros:** Melhor tratamento de erros de rede e timeout

## 🏗️ Arquitetura

```
ordens-marcenaria-app/
├── ordens-marcenaria-backend/     # Backend Flask
│   ├── src/
│   │   ├── main.py               # Aplicação principal
│   │   ├── models/               # Modelos do banco de dados
│   │   └── routes/               # Rotas da API
│   └── requirements.txt
├── ordens-marcenaria-frontend/    # Frontend React
│   ├── src/
│   │   ├── components/           # Componentes React
│   │   ├── services/             # Serviços de API
│   │   └── utils/                # Utilitários
│   └── package.json
├── config.json                   # Configurações do sistema
├── start_server.py              # Script principal de automação
├── start_server.bat             # Script para Windows
├── start_server.sh              # Script para Linux/Mac
└── README.md                    # Esta documentação
```

## 🔧 Configuração

### config.json

```json
{
  "ngrok": {
    "authtoken": "seu_token_aqui",
    "region": "us",
    "port": 5000
  },
  "flask": {
    "host": "0.0.0.0",
    "port": 5000,
    "debug": true
  },
  "frontend": {
    "api_file": "ordens-marcenaria-frontend/src/services/api.js"
  }
}
```

### Usuário Padrão

- **Usuário:** admin
- **Senha:** admin_password
- **Papel:** administrador

## 🌐 Deploy

### Frontend (Vercel)

1. Faça deploy do frontend no Vercel normalmente
2. Configure a URL do backend usando o botão "Backend" na interface
3. A URL será salva no localStorage do navegador

### Backend (Local + ngrok)

1. Execute o script de automação
2. A URL pública será gerada automaticamente
3. Configure esta URL no frontend

## 🐛 Solução de Problemas

### Erro: "ngrok não encontrado"
- Instale o ngrok: [https://ngrok.com/download](https://ngrok.com/download)
- Adicione o ngrok ao PATH do sistema

### Erro: "Token do ngrok inválido"
- Verifique se o token está correto no `config.json`
- Obtenha um novo token em: [https://dashboard.ngrok.com/get-started/your-authtoken](https://dashboard.ngrok.com/get-started/your-authtoken)

### Erro: "Não foi possível conectar com o backend"
- Verifique se o Flask está rodando
- Verifique se o ngrok está ativo
- Configure a URL correta no frontend

### Dados não persistem
- Verifique se o banco SQLite está sendo criado em `ordens-marcenaria-backend/src/database/`
- Não delete a pasta `database` durante o desenvolvimento

## 📊 Banco de Dados

O sistema usa SQLite local com as seguintes tabelas:

- **users:** Usuários do sistema
- **orders:** Ordens de serviço
- **materials:** Materiais das ordens
- **carpenters:** Marceneiros

### Backup

Para fazer backup dos dados, copie o arquivo:
```
ordens-marcenaria-backend/src/database/ordens_marcenaria.db
```

## 🔄 Atualizações

Para atualizar o sistema:

1. Faça backup do banco de dados
2. Substitua os arquivos do projeto
3. Execute o script de inicialização
4. Os dados existentes serão preservados

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs no terminal
2. Confirme que todas as dependências estão instaladas
3. Verifique a configuração do `config.json`
4. Teste a conectividade com o backend usando o botão "Backend" na interface

## 📝 Changelog

### Versão Atual
- ✅ Corrigido problema de persistência de dados
- ✅ Corrigido erro de login no Vercel
- ✅ Corrigido aba de marceneiros
- ✅ Melhorada exportação Excel
- ✅ Adicionada configuração dinâmica de URL
- ✅ Adicionada automação completa
- ✅ Melhorado tratamento de erros
- ✅ Adicionado recarregamento automático de dados

