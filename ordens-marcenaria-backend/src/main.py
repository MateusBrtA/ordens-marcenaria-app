import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory, jsonify
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

# Configurar CORS para permitir requisições do frontend
frontend_url = "https://ordens-marcenaria-app.vercel.app"
CORS(app, resources={r"/*": {"origins": [frontend_url, "http://localhost:3000", "http://127.0.0.1:3000"]}})

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
        # Remover todas as tabelas existentes e recriar (apenas para migração)
        db.drop_all()
        db.create_all()
        create_default_admin()
        print("Banco de dados SQLite inicializado com sucesso!")
        print(f"Banco de dados criado em: {database_path}")
    except Exception as e:
        print(f"Erro ao inicializar banco de dados: {e}")

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ok',
        'message': 'API do Sistema de Ordens de Marcenaria está funcionando'
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


