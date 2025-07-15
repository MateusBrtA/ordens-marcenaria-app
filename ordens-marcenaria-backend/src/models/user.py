from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import jwt
from datetime import datetime, timedelta

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='visitante')  # administrador, marceneiro, visitante
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)

    def __repr__(self):
        return f'<User {self.username}>'

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def generate_token(self, secret_key):
        payload = {
            'user_id': self.id,
            'username': self.username,
            'role': self.role,
            'exp': datetime.utcnow() + timedelta(hours=24)
        }
        return jwt.encode(payload, secret_key, algorithm='HS256')

    @staticmethod
    def verify_token(token, secret_key):
        try:
            payload = jwt.decode(token, secret_key, algorithms=['HS256'])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'is_active': self.is_active
        }

class Order(db.Model):
    id = db.Column(db.String(50), primary_key=True)
    description = db.Column(db.Text, nullable=False)
    entry_date = db.Column(db.Date, nullable=False)
    exit_date = db.Column(db.Date, nullable=False)
    carpenter = db.Column(db.String(100))
    status = db.Column(db.String(20), nullable=False, default='recebida')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'))

    materials = db.relationship('Material', backref='order', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Order {self.id}>'

    def to_dict(self):
        return {
            'id': self.id,
            'description': self.description,
            'entryDate': self.entry_date.isoformat() if self.entry_date else None,
            'exitDate': self.exit_date.isoformat() if self.exit_date else None,
            'carpenter': self.carpenter,
            'status': self.status,
            'materials': [material.to_dict() for material in self.materials],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Material(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    description = db.Column(db.String(255), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    order_id = db.Column(db.String(50), db.ForeignKey('order.id'), nullable=False)

    def __repr__(self):
        return f'<Material {self.description}>'

    def to_dict(self):
        return {
            'id': self.id,
            'description': self.description,
            'quantity': self.quantity
        }

class Carpenter(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)

    def __repr__(self):
        return f'<Carpenter {self.name}>'

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'is_active': self.is_active
        }
    
class Delivery(db.Model):
    id = db.Column(db.String(50), primary_key=True)
    order_id = db.Column(db.String(50), db.ForeignKey("order.id"), nullable=True)
    order = db.relationship("Order", backref="deliveries", lazy=True)
    delivery_date = db.Column(db.Date, nullable=False)
    delivery_status = db.Column(db.String(50), nullable=False, default='pendente')
    delivery_address = db.Column(db.Text, nullable=False)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f' <Delivery {self.id}>'

    def to_dict(self):
        return {
            'id': self.id,
            'order_id': self.order_id,
            'deliveryDate': self.delivery_date.isoformat() if self.delivery_date else None,
            'deliveryStatus': self.delivery_status,
            'deliveryAddress': self.delivery_address,
            'notes': self.notes,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }


