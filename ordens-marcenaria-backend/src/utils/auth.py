from functools import wraps
from flask import request, jsonify, g
from src.models.auth import Usuario, Sessao

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Verificar se o token está no header Authorization
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]  # Bearer <token>
            except IndexError:
                return jsonify({'message': 'Token inválido'}), 401
        
        if not token:
            return jsonify({'message': 'Token é obrigatório'}), 401
        
        try:
            # Verificar o token
            payload = Usuario.verify_token(token)
            if payload is None:
                return jsonify({'message': 'Token inválido ou expirado'}), 401
            
            # Buscar o usuário
            current_user = Usuario.query.get(payload['user_id'])
            if not current_user or not current_user.ativo:
                return jsonify({'message': 'Usuário não encontrado ou inativo'}), 401
            
            # Verificar se a sessão ainda é válida
            sessao = Sessao.query.filter_by(token=token, ativo=True).first()
            if not sessao or not sessao.is_valid():
                return jsonify({'message': 'Sessão inválida ou expirada'}), 401
            
            g.current_user = current_user
            g.current_token = token
            
        except Exception as e:
            return jsonify({'message': 'Token inválido'}), 401
        
        return f(*args, **kwargs)
    
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not hasattr(g, 'current_user') or g.current_user.tipo_acesso != 'administrador':
            return jsonify({'message': 'Acesso negado. Apenas administradores podem realizar esta ação.'}), 403
        return f(*args, **kwargs)
    return decorated

def marceneiro_or_admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not hasattr(g, 'current_user') or g.current_user.tipo_acesso not in ['administrador', 'marceneiro']:
            return jsonify({'message': 'Acesso negado. Apenas marceneiros e administradores podem realizar esta ação.'}), 403
        return f(*args, **kwargs)
    return decorated

def get_user_permissions(tipo_acesso):
    """Retorna as permissões baseadas no tipo de acesso"""
    permissions = {
        'administrador': {
            'can_manage_orders': True,
            'can_manage_materials': True,
            'can_manage_marceneiros': True,
            'can_view_orders': True,
            'can_edit_orders': True,
            'can_delete_orders': True,
            'can_assign_marceneiro': True,
            'can_view_history': True
        },
        'marceneiro': {
            'can_manage_orders': False,
            'can_manage_materials': False,
            'can_manage_marceneiros': False,
            'can_view_orders': True,
            'can_edit_orders': True,
            'can_delete_orders': False,
            'can_assign_marceneiro': True,
            'can_view_history': True
        },
        'visitante': {
            'can_manage_orders': False,
            'can_manage_materials': False,
            'can_manage_marceneiros': False,
            'can_view_orders': True,
            'can_edit_orders': False,
            'can_delete_orders': False,
            'can_assign_marceneiro': False,
            'can_view_history': False
        }
    }
    return permissions.get(tipo_acesso, permissions['visitante'])

