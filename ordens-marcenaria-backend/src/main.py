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

# Configuração do banco de dados - SQLite Local
database_path = os.path.join(os.path.dirname(__file__), 'database', 'ordens_marcenaria.db')
os.makedirs(os.path.dirname(database_path), exist_ok=True)
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{database_path}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Inicializar SQLAlchemy com a aplicação Flask
db.init_app(app)

CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

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

def create_sample_data():
    """Cria dados de exemplo se o banco estiver vazio"""
    try:
        # Verificar se já existem dados
        existing_orders = db.session.execute(db.text("SELECT COUNT(*) FROM orders")).scalar()
        existing_carpenters = db.session.execute(db.text("SELECT COUNT(*) FROM carpenters")).scalar()
        
        if existing_orders == 0 and existing_carpenters == 0:
            print("Criando dados de exemplo...")
            
            # Criar marceneiros de exemplo
            sample_carpenters = ["João Silva", "Maria Santos", "Pedro Oliveira"]
            for name in sample_carpenters:
                carpenter = Carpenter(name=name)
                db.session.add(carpenter)
            
            db.session.commit()
            print("Dados de exemplo criados com sucesso!")
    except Exception as e:
        print(f"Erro ao criar dados de exemplo: {e}")
        db.session.rollback()

# Inicializar banco de dados e criar usuário admin - CORRIGIDO para não resetar o banco
with app.app_context():
    try:
        # Verificar se o banco existe
        db_exists = os.path.exists(database_path)
        
        if not db_exists:
            print("Banco de dados não existe. Criando novo banco...")
            db.create_all()
            create_default_admin()
            create_sample_data()
        else:
            print("Banco de dados existente encontrado. Verificando estrutura...")
            # Apenas criar tabelas que não existem
            db.create_all()
            # Verificar se admin existe
            admin = User.query.filter_by(username="admin").first()
            if not admin:
                create_default_admin()
            
        print("Banco de dados SQLite inicializado com sucesso!")
        print(f"Banco de dados localizado em: {database_path}")
    except Exception as e:
        print(f"Erro ao inicializar banco de dados: {e}")

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ok',
        'message': 'API do Sistema de Ordens de Marcenaria está funcionando',
        'cors_enabled': True
    }), 200

# Rota específica para testar CORS
@app.route('/api/test-cors', methods=['GET', 'POST', 'OPTIONS'])
def test_cors():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight OK'}), 200
    return jsonify({
        'message': 'CORS está funcionando',
        'method': request.method,
        'headers': dict(request.headers)
    }), 200

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
        return jsonify({'message': 'API do Sistema de Ordens de Marcenaria'}), 200

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return jsonify({'message': 'API do Sistema de Ordens de Marcenaria'}), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)

