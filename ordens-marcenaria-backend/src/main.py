import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS
from src.models.user import db, User, Carpenter
from src.routes.user import user_bp
from src.routes.auth import auth_bp
from src.routes.orders import orders_bp
from src.routes.carpenters import carpenters_bp

app = Flask(__name__)
app.config['SECRET_KEY'] = 'a1b9f7c3e8d2a6b0f4c5d9e1a7b8f3c2d6e0a9b4f8c1d5e7'

# Configuração do banco de dados - APENAS SUPABASE
app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql://postgres.wdtwdyfahpuomvjxloyi:SenhaTrevo123@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Configuração específica para ngrok
app.config['SERVER_NAME'] = None  # Permite qualquer host
app.config['APPLICATION_ROOT'] = '/'

# Inicializar SQLAlchemy com a aplicação Flask
db.init_app(app)

# Configuração CORS mais permissiva para ngrok
CORS(app, 
     resources={r"/*": {
         "origins": "*",  # Permite qualquer origem para desenvolvimento
         "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         "allow_headers": ["Content-Type", "Authorization", "ngrok-skip-browser-warning", "X-Requested-With"],
         "supports_credentials": True,
         "expose_headers": ["Content-Type", "Authorization"]
     }})

# Headers CORS manuais otimizados para ngrok
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = jsonify({'status': 'ok'})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add('Access-Control-Allow-Headers', "Content-Type,Authorization,ngrok-skip-browser-warning,X-Requested-With")
        response.headers.add('Access-Control-Allow-Methods', "GET,PUT,POST,DELETE,OPTIONS")
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response

@app.after_request
def after_request(response):
    # Headers CORS para todas as respostas
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,ngrok-skip-browser-warning,X-Requested-With')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    
    # Headers específicos para ngrok
    response.headers.add('X-Frame-Options', 'ALLOWALL')
    response.headers.add('X-Content-Type-Options', 'nosniff')
    
    return response

# Middleware para logging de requisições (útil para debug)
@app.before_request
def log_request_info():
    print(f"Request: {request.method} {request.url}")
    print(f"Headers: {dict(request.headers)}")
    if request.is_json:
        print(f"JSON: {request.get_json()}")

# Registrar blueprints
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(orders_bp, url_prefix='/api')
app.register_blueprint(carpenters_bp, url_prefix='/api')

def create_default_admin():
    """Cria usuário admin padrão se não existir"""
    try:
        admin = User.query.filter_by(username="admin").first()
        if not admin:
            from werkzeug.security import generate_password_hash
            admin_user = User(username="admin", email="admin@example.com", role="administrador")
            admin_user.set_password("admin_password")
            db.session.add(admin_user)
            db.session.commit()
            print("Usuário admin padrão criado com sucesso!")
    except Exception as e:
        print(f"Erro ao criar usuário admin padrão: {e}")
        db.session.rollback()

# Inicializar banco de dados e criar usuário admin
with app.app_context():
    try:
        db.create_all()
        create_default_admin()
        print("Banco de dados inicializado com sucesso!")
    except Exception as e:
        print(f"Erro ao inicializar banco de dados: {e}")

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ok',
        'message': 'API do Sistema de Ordens de Marcenaria está funcionando',
        'ngrok_ready': True
    }), 200

# Endpoint específico para testar CORS
@app.route('/api/test-cors', methods=['GET', 'POST', 'OPTIONS'])
def test_cors():
    return jsonify({
        'status': 'ok',
        'message': 'CORS está funcionando',
        'method': request.method,
        'headers': dict(request.headers)
    }), 200

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
        return jsonify({'message': 'API do Sistema de Ordens de Marcenaria - Ngrok Ready'}), 200

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return jsonify({'message': 'API do Sistema de Ordens de Marcenaria - Ngrok Ready'}), 200

# Error handlers para melhor debugging
@app.errorhandler(500)
def internal_error(error):
    print(f"Erro 500: {error}")
    return jsonify({
        'error': 'Erro interno do servidor',
        'message': str(error),
        'status': 500
    }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Endpoint não encontrado',
        'message': str(error),
        'status': 404
    }), 404

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Iniciando servidor Flask na porta {port}")
    print("Configurado para uso com ngrok")
    app.run(host='0.0.0.0', port=port, debug=True)

