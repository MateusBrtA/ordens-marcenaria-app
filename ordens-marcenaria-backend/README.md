# 🔨 Backend - Sistema de Gerenciamento de Ordens de Marcenaria

Backend completo para sistema de gerenciamento de ordens de marcenaria com autenticação, autorização por níveis de acesso, histórico de alterações e deploy gratuito.

## 🚀 Deploy Ativo

**URL:** https://mzhyi8cqonpd.manus.space

O backend está deployado e funcionando, pronto para integração com o frontend.

## ✨ Funcionalidades

- ✅ **Autenticação JWT** com 3 níveis de acesso
- ✅ **CRUD completo** para ordens, marceneiros e materiais
- ✅ **Controle de estoque** em tempo real
- ✅ **Histórico de alterações** com auditoria completa
- ✅ **Relatórios e estatísticas**
- ✅ **API REST** documentada
- ✅ **CORS habilitado** para integração frontend
- ✅ **Deploy gratuito** e permanente

## 🔐 Níveis de Acesso

### 👤 Administrador
- Gerencia ordens (CRUD completo)
- Gerencia materiais e estoque
- Gerencia marceneiros
- Acesso ao histórico completo
- Gera relatórios

### 🔨 Marceneiro
- Visualiza todas as ordens
- Edita status e observações
- Troca responsável pela ordem
- Acesso ao histórico

### 👁️ Visitante
- Visualização somente leitura
- Pode organizar e filtrar

## 🧪 Usuários de Teste

| Usuário | Senha | Tipo |
|---------|-------|------|
| `admin` | `admin123` | Administrador |
| `joao_marceneiro` | `marceneiro123` | Marceneiro |
| `visitante` | `visitante123` | Visitante |

## 📡 Principais Endpoints

### Autenticação
```
POST /api/auth/login          # Login
POST /api/auth/logout         # Logout
GET  /api/auth/me            # Usuário atual
```

### Ordens
```
GET    /api/ordens           # Listar ordens
POST   /api/ordens           # Criar ordem (admin)
PUT    /api/ordens/{id}      # Atualizar ordem
DELETE /api/ordens/{id}      # Deletar ordem (admin)
GET    /api/ordens/estatisticas  # Estatísticas
```

### Marceneiros
```
GET    /api/marceneiros      # Listar marceneiros
POST   /api/marceneiros      # Criar marceneiro (admin)
PUT    /api/marceneiros/{id} # Atualizar marceneiro (admin)
DELETE /api/marceneiros/{id} # Deletar marceneiro (admin)
```

### Materiais
```
GET    /api/materiais        # Listar materiais
POST   /api/materiais        # Criar material (admin)
PUT    /api/materiais/{id}   # Atualizar material (admin)
PUT    /api/materiais/{id}/estoque  # Atualizar estoque (admin)
GET    /api/materiais/estoque-baixo # Materiais com estoque baixo
```

### Histórico
```
GET /api/historico           # Histórico de alterações
GET /api/historico/estatisticas  # Estatísticas (admin)
GET /api/historico/relatorio     # Relatório (admin)
```

## 🔧 Exemplo de Uso

### Login
```javascript
const response = await fetch('https://mzhyi8cqonpd.manus.space/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'admin',
    password: 'admin123'
  })
});

const { token, usuario, permissions } = await response.json();
```

### Buscar Ordens
```javascript
const response = await fetch('https://mzhyi8cqonpd.manus.space/api/ordens', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const ordens = await response.json();
```

### Criar Ordem (Admin)
```javascript
const response = await fetch('https://mzhyi8cqonpd.manus.space/api/ordens', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    numero_ordem: 'ORD-2025-004',
    cliente: 'João Silva',
    descricao: 'Mesa de escritório',
    status: 'Pendente',
    marceneiro_id: 1
  })
});

const { ordem } = await response.json();
```

## 📊 Estrutura do Banco

- **Usuario** - Usuários com diferentes níveis de acesso
- **Sessao** - Controle de sessões JWT
- **Ordem** - Ordens de marcenaria
- **Marceneiro** - Cadastro de marceneiros
- **Material** - Catálogo de materiais com estoque
- **OrdemMaterial** - Materiais utilizados por ordem
- **HistoricoAlteracao** - Log completo de alterações

## 🛠️ Tecnologias

- **Flask** - Framework web Python
- **SQLAlchemy** - ORM
- **SQLite** - Banco de dados
- **Flask-CORS** - Suporte CORS
- **PyJWT** - Autenticação JWT
- **Werkzeug** - Criptografia

## 📋 Dados de Exemplo

O sistema vem com dados pré-carregados:
- 3 usuários (admin, marceneiro, visitante)
- 3 marceneiros com especialidades
- 6 materiais com controle de estoque
- 3 ordens em diferentes status

## 🔄 Integração Frontend

Para integrar com seu frontend React:

1. **Configure a URL base:** `https://mzhyi8cqonpd.manus.space`
2. **Implemente autenticação JWT**
3. **Use os hooks fornecidos** no guia de integração
4. **Controle permissões** baseado no tipo de usuário

## 📚 Documentação Completa

- [📖 Documentação Detalhada](./documentacao_backend.md)
- [🔗 Guia de Integração Frontend](./guia_integracao.md)

## 🚀 Deploy

O backend está deployado permanentemente e gratuitamente. Não requer configuração adicional para uso.

## 📞 Suporte

O código está bem estruturado e documentado para facilitar manutenções futuras. Todas as funcionalidades solicitadas foram implementadas com foco em segurança e escalabilidade.

---

**✅ Backend completo e funcional - Pronto para integração!**

