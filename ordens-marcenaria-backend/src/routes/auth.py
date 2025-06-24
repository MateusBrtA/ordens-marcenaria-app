from flask import Blueprint, request, jsonify, current_app
from src.models.user import db, User
from functools import wraps

auth_bp = Blueprint('auth', __name__)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]  # Bearer TOKEN
            except IndexError:
                return jsonify({'message': 'Token inválido'}), 401
        
        if not token:
            return jsonify({'message': 'Token é obrigatório'}), 401
        
        try:
            data = User.verify_token(token, current_app.config['SECRET_KEY'])
            if data is None:
                return jsonify({'message': 'Token inválido ou expirado'}), 401
            
            current_user = User.query.get(data['user_id'])
            if not current_user or not current_user.is_active:
                return jsonify({'message': 'Usuário não encontrado ou inativo'}), 401
                
        except Exception as e:
            return jsonify({'message': 'Token inválido'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if current_user.role != 'administrador':
            return jsonify({'message': 'Acesso negado. Apenas administradores.'}), 403
        return f(current_user, *args, **kwargs)
    return decorated

def admin_or_carpenter_required(f):
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if current_user.role not in ['administrador', 'marceneiro']:
            return jsonify({'message': 'Acesso negado. Apenas administradores ou marceneiros.'}), 403
        return f(current_user, *args, **kwargs)
    return decorated

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        if not data or not data.get('username') or not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Username, email e password são obrigatórios'}), 400
        
        # Verificar se usuário já existe
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'message': 'Username já existe'}), 400
        
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'message': 'Email já existe'}), 400
        
        # Criar novo usuário
        user = User(
            username=data['username'],
            email=data['email'],
            role=data.get('role', 'visitante')  # Default: visitante
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'message': 'Usuário criado com sucesso',
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data or not data.get('username') or not data.get('password'):
            return jsonify({'message': 'Username e password são obrigatórios'}), 400
        
        user = User.query.filter_by(username=data['username']).first()
        
        if not user or not user.check_password(data['password']):
            return jsonify({'message': 'Credenciais inválidas'}), 401
        
        if not user.is_active:
            return jsonify({'message': 'Usuário inativo'}), 401
        
        token = user.generate_token(current_app.config['SECRET_KEY'])
        
        return jsonify({
            'message': 'Login realizado com sucesso',
            'token': token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    return jsonify({'user': current_user.to_dict()}), 200

@auth_bp.route('/users', methods=['GET'])
@token_required
@admin_required
def get_users(current_user):
    try:
        users = User.query.all()
        return jsonify({
            'users': [user.to_dict() for user in users]
        }), 200
    except Exception as e:
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

@auth_bp.route('/users/<int:user_id>', methods=['PUT'])
@token_required
@admin_required
def update_user(current_user, user_id):
    try:
        user = User.query.get_or_404(user_id)
        data = request.get_json()
        
        if 'role' in data:
            user.role = data['role']
        if 'is_active' in data:
            user.is_active = data['is_active']
        if 'email' in data:
            user.email = data['email']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Usuário atualizado com sucesso',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

