from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from src.models.user import db

class Ordem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    numero_ordem = db.Column(db.String(50), unique=True, nullable=False)
    cliente = db.Column(db.String(100), nullable=False)
    descricao = db.Column(db.Text, nullable=False)
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)
    data_entrega = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(50), default='Pendente')
    marceneiro_id = db.Column(db.Integer, db.ForeignKey('marceneiro.id'), nullable=True)
    valor_total = db.Column(db.Float, default=0.0)
    observacoes = db.Column(db.Text, nullable=True)
    
    # Relacionamentos
    marceneiro = db.relationship('Marceneiro', backref='ordens')
    materiais = db.relationship('OrdemMaterial', backref='ordem', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Ordem {self.numero_ordem}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'numero_ordem': self.numero_ordem,
            'cliente': self.cliente,
            'descricao': self.descricao,
            'data_criacao': self.data_criacao.isoformat() if self.data_criacao else None,
            'data_entrega': self.data_entrega.isoformat() if self.data_entrega else None,
            'status': self.status,
            'marceneiro_id': self.marceneiro_id,
            'marceneiro': self.marceneiro.to_dict() if self.marceneiro else None,
            'valor_total': self.valor_total,
            'observacoes': self.observacoes,
            'materiais': [material.to_dict() for material in self.materiais]
        }

class Marceneiro(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    telefone = db.Column(db.String(20), nullable=True)
    especialidade = db.Column(db.String(100), nullable=True)
    ativo = db.Column(db.Boolean, default=True)
    
    def __repr__(self):
        return f'<Marceneiro {self.nome}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'email': self.email,
            'telefone': self.telefone,
            'especialidade': self.especialidade,
            'ativo': self.ativo
        }

class Material(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    unidade = db.Column(db.String(20), nullable=False)  # m², m³, kg, unidade, etc.
    preco_unitario = db.Column(db.Float, nullable=False)
    estoque_atual = db.Column(db.Float, default=0.0)
    estoque_minimo = db.Column(db.Float, default=0.0)
    fornecedor = db.Column(db.String(100), nullable=True)
    ativo = db.Column(db.Boolean, default=True)
    
    def __repr__(self):
        return f'<Material {self.nome}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'unidade': self.unidade,
            'preco_unitario': self.preco_unitario,
            'estoque_atual': self.estoque_atual,
            'estoque_minimo': self.estoque_minimo,
            'fornecedor': self.fornecedor,
            'ativo': self.ativo
        }

class OrdemMaterial(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ordem_id = db.Column(db.Integer, db.ForeignKey('ordem.id'), nullable=False)
    material_id = db.Column(db.Integer, db.ForeignKey('material.id'), nullable=False)
    quantidade = db.Column(db.Float, nullable=False)
    preco_unitario = db.Column(db.Float, nullable=False)  # Preço no momento da ordem
    subtotal = db.Column(db.Float, nullable=False)
    
    # Relacionamentos
    material = db.relationship('Material')
    
    def __repr__(self):
        return f'<OrdemMaterial {self.ordem_id}-{self.material_id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'ordem_id': self.ordem_id,
            'material_id': self.material_id,
            'material': self.material.to_dict() if self.material else None,
            'quantidade': self.quantidade,
            'preco_unitario': self.preco_unitario,
            'subtotal': self.subtotal
        }

