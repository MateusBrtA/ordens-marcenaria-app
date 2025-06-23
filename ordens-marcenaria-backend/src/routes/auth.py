from flask import Blueprint, jsonify, request, g
from datetime import datetime, timedelta
from src.models.auth import Usuario, Sessao, db
from src.utils.auth import token_required, admin_required, get_user_permissions

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.json
        
        # Validar dados obrigatórios
        if not data.get('username') or not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Username, email e password são obrigatórios'}), 400
        
        # Verificar se usuário já existe
        if Usuario.query.filter_by(username=data['username']).first():
            return jsonify({'message': 'Username já existe'}), 400
        
        if Usuario.query.filter_by(email=data['email']).first():
            return jsonify({'message': 'Email já existe'}), 400
        
        # Criar novo usuário
        usuario = Usuario(
            username=data['username'],
            email=data['email'],
            tipo_acesso=data.get('tipo_acesso', 'visitante')
        )
        usuario.set_password(data['password'])
        
        db.session.add(usuario)
        db.session.commit()
        
        return jsonify({
            'message': 'Usuário criado com sucesso',
            'usuario': usuario.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro ao criar usuário: {str(e)}'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.json
        
        if not data.get('username') or not data.get('password'):
            return jsonify({'message': 'Username e password são obrigatórios'}), 400
        
        # Buscar usuário
        usuario = Usuario.query.filter_by(username=data['username']).first()
        
        if not usuario or not usuario.check_password(data['password']):
            return jsonify({'message': 'Credenciais inválidas'}), 401
        
        if not usuario.ativo:
            return jsonify({'message': 'Usuário inativo'}), 401
        
        # Gerar token
        token = usuario.generate_token()
        
        # Criar sessão
        sessao = Sessao(
            usuario_id=usuario.id,
            token=token,
            data_expiracao=datetime.utcnow() + timedelta(hours=24),
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent', '')
        )
        
        # Atualizar último login
        usuario.ultimo_login = datetime.utcnow()
        
        db.session.add(sessao)
        db.session.commit()
        
        return jsonify({
            'message': 'Login realizado com sucesso',
            'token': token,
            'usuario': usuario.to_dict(),
            'permissions': get_user_permissions(usuario.tipo_acesso)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro ao fazer login: {str(e)}'}), 500

@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout():
    try:
        # Desativar sessão atual
        sessao = Sessao.query.filter_by(token=g.current_token, ativo=True).first()
        if sessao:
            sessao.ativo = False
            db.session.commit()
        
        return jsonify({'message': 'Logout realizado com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro ao fazer logout: {str(e)}'}), 500

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user():
    return jsonify({
        'usuario': g.current_user.to_dict(),
        'permissions': get_user_permissions(g.current_user.tipo_acesso)
    }), 200

@auth_bp.route('/usuarios', methods=['GET'])
@token_required
@admin_required
def get_usuarios():
    try:
        usuarios = Usuario.query.all()
        return jsonify([usuario.to_dict() for usuario in usuarios]), 200
    except Exception as e:
        return jsonify({'message': f'Erro ao buscar usuários: {str(e)}'}), 500

@auth_bp.route('/usuarios/<int:usuario_id>', methods=['PUT'])
@token_required
@admin_required
def update_usuario(usuario_id):
    try:
        usuario = Usuario.query.get_or_404(usuario_id)
        data = request.json
        
        if 'username' in data:
            # Verificar se username já existe (exceto o próprio usuário)
            existing = Usuario.query.filter_by(username=data['username']).first()
            if existing and existing.id != usuario_id:
                return jsonify({'message': 'Username já existe'}), 400
            usuario.username = data['username']
        
        if 'email' in data:
            # Verificar se email já existe (exceto o próprio usuário)
            existing = Usuario.query.filter_by(email=data['email']).first()
            if existing and existing.id != usuario_id:
                return jsonify({'message': 'Email já existe'}), 400
            usuario.email = data['email']
        
        if 'tipo_acesso' in data:
            usuario.tipo_acesso = data['tipo_acesso']
        
        if 'ativo' in data:
            usuario.ativo = data['ativo']
        
        if 'password' in data and data['password']:
            usuario.set_password(data['password'])
        
        db.session.commit()
        
        return jsonify({
            'message': 'Usuário atualizado com sucesso',
            'usuario': usuario.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro ao atualizar usuário: {str(e)}'}), 500

@auth_bp.route('/usuarios/<int:usuario_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_usuario(usuario_id):
    try:
        usuario = Usuario.query.get_or_404(usuario_id)
        
        # Não permitir deletar o próprio usuário
        if usuario.id == g.current_user.id:
            return jsonify({'message': 'Não é possível deletar seu próprio usuário'}), 400
        
        # Desativar todas as sessões do usuário
        Sessao.query.filter_by(usuario_id=usuario_id).update({'ativo': False})
        
        db.session.delete(usuario)
        db.session.commit()
        
        return jsonify({'message': 'Usuário deletado com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro ao deletar usuário: {str(e)}'}), 500

