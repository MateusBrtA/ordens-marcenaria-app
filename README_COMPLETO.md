# Sistema de Ordens de Marcenaria - Versão Completa

## 🚀 Visão Geral

Este é um sistema completo de gerenciamento de ordens de marcenaria com:
- **Backend Flask** com API REST
- **Frontend React** moderno e responsivo
- **Sistema de autenticação** com JWT
- **Diferentes níveis de acesso** (Administrador, Marceneiro, Visitante)
- **Persistência de dados online** com SQLite
- **Interface moderna** com TailwindCSS e shadcn/ui

## 🔐 Sistema de Autenticação

### Níveis de Acesso

1. **Administrador**
   - Acesso completo ao sistema
   - Pode criar, editar e excluir ordens
   - Pode gerenciar marceneiros
   - Pode gerenciar usuários

2. **Marceneiro**
   - Pode criar, editar e excluir ordens
   - Pode gerenciar marceneiros
   - Visualização completa do sistema

3. **Visitante**
   - Apenas visualização
   - Não pode editar ou criar dados
   - Pode exportar relatórios

### Usuário Padrão
- **Usuário:** admin
- **Senha:** admin123
- **Tipo:** Administrador

## 🛠️ Tecnologias Utilizadas

### Backend
- **Flask** - Framework web Python
- **SQLAlchemy** - ORM para banco de dados
- **SQLite** - Banco de dados
- **JWT** - Autenticação
- **Flask-CORS** - Suporte a CORS
- **Werkzeug** - Hashing de senhas

### Frontend
- **React 19** - Framework JavaScript
- **Vite** - Build tool
- **TailwindCSS** - Framework CSS
- **shadcn/ui** - Componentes UI
- **Axios** - Cliente HTTP
- **Lucide React** - Ícones

## 📦 Estrutura do Projeto

```
ordens-marcenaria-app/
├── ordens-marcenaria-backend/          # Backend Flask
│   ├── src/
│   │   ├── models/
│   │   │   └── user.py                 # Modelos do banco de dados
│   │   ├── routes/
│   │   │   ├── auth.py                 # Rotas de autenticação
│   │   │   ├── orders.py               # Rotas de ordens
│   │   │   ├── carpenters.py           # Rotas de marceneiros
│   │   │   └── user.py                 # Rotas de usuários
│   │   ├── database/
│   │   │   └── app.db                  # Banco SQLite
│   │   └── main.py                     # Arquivo principal
│   ├── venv/                           # Ambiente virtual Python
│   └── requirements.txt                # Dependências Python
├── src/                                # Frontend React
│   ├── components/
│   │   ├── ui/                         # Componentes shadcn/ui
│   │   └── LoginPage.jsx               # Página de login
│   ├── contexts/
│   │   └── AuthContext.jsx             # Contexto de autenticação
│   ├── services/
│   │   └── api.js                      # Cliente da API
│   ├── utils/
│   │   └── excelExport.js              # Exportação Excel
│   └── App.jsx                         # Componente principal
├── .env                                # Variáveis de ambiente
├── package.json                        # Dependências Node.js
└── README.md                           # Este arquivo
```

## 🚀 Instalação e Execução

### Pré-requisitos
- Python 3.11+
- Node.js 18+
- pnpm (ou npm)

### 1. Backend (Flask)

```bash
# Navegar para o diretório do backend
cd ordens-marcenaria-backend

# Ativar ambiente virtual
source venv/bin/activate

# Instalar dependências (já instaladas)
pip install -r requirements.txt

# Executar o servidor
python src/main.py
```

O backend estará disponível em: `http://localhost:5000`

### 2. Frontend (React)

```bash
# Navegar para o diretório raiz
cd ..

# Instalar dependências (já instaladas)
pnpm install

# Executar em desenvolvimento
pnpm run dev --host 0.0.0.0
```

O frontend estará disponível em: `http://localhost:5173`

## 🔧 Configuração

### Variáveis de Ambiente

Arquivo `.env` na raiz do projeto:
```env
VITE_API_URL=http://localhost:5000/api
```

### Configuração do Backend

O backend está configurado para:
- Escutar em `0.0.0.0:5000`
- Permitir CORS de qualquer origem
- Usar SQLite como banco de dados
- Criar usuário administrador padrão automaticamente

## 📊 Funcionalidades

### Gerenciamento de Ordens
- ✅ Criar novas ordens com ID único
- ✅ Definir descrição, datas e marceneiro responsável
- ✅ Status automático baseado em datas (Atrasada, Para Hoje, etc.)
- ✅ Gerenciar lista de materiais
- ✅ Editar e excluir ordens (com permissão)

### Gerenciamento de Marceneiros
- ✅ Adicionar e remover marceneiros
- ✅ Visualizar estatísticas por marceneiro
- ✅ Atribuir marceneiros às ordens

### Sistema de Filtros
- ✅ Buscar por ID da ordem
- ✅ Filtrar por marceneiro
- ✅ Filtrar por status
- ✅ Combinação de múltiplos filtros

### Visualização
- ✅ Modo Cards (Kanban)
- ✅ Modo Tabela
- ✅ Interface responsiva

### Exportação
- ✅ Exportar para Excel
- ✅ Backup completo dos dados

## 🔒 Segurança

- Senhas criptografadas com Werkzeug
- Autenticação JWT com expiração de 24 horas
- Validação de permissões em todas as rotas
- Sanitização de dados de entrada
- CORS configurado adequadamente

## 🌐 API Endpoints

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `GET /api/auth/me` - Dados do usuário atual
- `GET /api/auth/users` - Listar usuários (admin)

### Ordens
- `GET /api/orders` - Listar ordens
- `POST /api/orders` - Criar ordem
- `GET /api/orders/{id}` - Obter ordem
- `PUT /api/orders/{id}` - Atualizar ordem
- `DELETE /api/orders/{id}` - Excluir ordem

### Materiais
- `POST /api/orders/{id}/materials` - Adicionar material
- `PUT /api/orders/{id}/materials/{material_id}` - Atualizar material
- `DELETE /api/orders/{id}/materials/{material_id}` - Excluir material

### Marceneiros
- `GET /api/carpenters` - Listar marceneiros
- `GET /api/carpenters/names` - Nomes dos marceneiros
- `POST /api/carpenters` - Criar marceneiro
- `PUT /api/carpenters/{id}` - Atualizar marceneiro
- `DELETE /api/carpenters/{id}` - Excluir marceneiro

## 🚀 Deploy

### Opções de Deploy

1. **Servidor Local**
   - Execute os comandos de instalação
   - Configure um proxy reverso (nginx)
   - Use um gerenciador de processos (PM2, systemd)

2. **Heroku**
   - Configure Procfile para Flask
   - Use PostgreSQL addon
   - Configure variáveis de ambiente

3. **Vercel (Frontend) + Railway (Backend)**
   - Deploy do frontend no Vercel
   - Deploy do backend no Railway
   - Configure CORS adequadamente

4. **Docker**
   - Crie Dockerfiles para frontend e backend
   - Use docker-compose para orquestração

### Build para Produção

```bash
# Frontend
pnpm run build

# Backend - já está pronto para produção
# Configure um servidor WSGI como Gunicorn
```

## 🔧 Desenvolvimento

### Adicionando Novas Funcionalidades

1. **Backend**: Adicione rotas em `src/routes/`
2. **Frontend**: Adicione componentes em `src/components/`
3. **Banco**: Modifique modelos em `src/models/user.py`

### Estrutura de Permissões

```python
# Decoradores disponíveis
@token_required                    # Usuário logado
@admin_required                    # Apenas administradores
@admin_or_carpenter_required       # Admin ou marceneiro
```

## 🐛 Solução de Problemas

### Backend não inicia
- Verifique se o ambiente virtual está ativo
- Verifique se todas as dependências estão instaladas
- Verifique se a porta 5000 não está em uso

### Frontend não conecta com backend
- Verifique se o backend está rodando
- Verifique a variável VITE_API_URL no .env
- Verifique se CORS está configurado

### Problemas de autenticação
- Verifique se o token não expirou
- Limpe localStorage e faça login novamente
- Verifique se o usuário existe no banco

## 📈 Melhorias Futuras

- [ ] Notificações push para ordens atrasadas
- [ ] Relatórios avançados com gráficos
- [ ] Anexos de arquivos/fotos nas ordens
- [ ] Histórico de alterações
- [ ] API para aplicativo mobile
- [ ] Integração com sistemas externos
- [ ] Backup automático na nuvem

## 📄 Licença

Este projeto foi desenvolvido como solução personalizada para gerenciamento de marcenaria.

## 🤝 Suporte

Para dúvidas ou problemas:
1. Verifique esta documentação
2. Verifique os logs do backend e frontend
3. Teste em modo incógnito
4. Verifique se todas as dependências estão instaladas

---

**Desenvolvido com ❤️ para otimizar o gerenciamento de ordens de marcenaria**

