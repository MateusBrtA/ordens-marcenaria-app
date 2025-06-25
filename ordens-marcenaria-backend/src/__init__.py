# Em ordens-marcenaria-backend/src/__init__.py

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
import os

# Defina as extensões no topo, sem inicializá-las
db = SQLAlchemy()
migrate = Migrate()

# Esta é a sua "Application Factory"
def create_app(config_class=None):
    # PASSO 1: A aplicação é criada AQUI.
    app = Flask(__name__)

    # PASSO 2: As configurações são movidas para DENTRO da função.
    # Agora a variável 'app' já existe e pode ser configurada.
    app.config['SECRET_KEY'] = 'a1b9f7c3e8d2a6b0f4c5d9e1a7b8f3c2d6e0a9b4f8c1d5e7' 
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///ordens.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Configurar CORS (como já estava)
    main_branch_url = "https://ordens-marcenaria-app-git-main-mateus-projects-5311c5cf.vercel.app"
    production_url = "https://ordens-marcenaria-app.vercel.app" 
    allowed_origins = [main_branch_url, production_url]
    CORS(app, resources={r"/*": {"origins": allowed_origins}}) # Mudei para /* para cobrir todas as rotas
    
    # PASSO 3: Inicialize as extensões com a aplicação criada
    db.init_app(app)
    migrate.init_app(app, db)

    # PASSO 4: Registre os Blueprints
    from .routes.auth import auth_bp
    from .routes.order_routes import order_bp
    
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(order_bp, url_prefix='/orders')

    # PASSO 5: Retorne a aplicação configurada
    return app