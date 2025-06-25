# Dentro da função create_app() no seu arquivo src/__init__.py

app.config['SECRET_KEY'] = 'uma-chave-super-secreta' 
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///ordens.db' 
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False