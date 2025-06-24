from flask import Blueprint, request, jsonify
from src.models.user import db, Carpenter, Order
from src.routes.auth import token_required, admin_or_carpenter_required

carpenters_bp = Blueprint('carpenters', __name__)

@carpenters_bp.route('/carpenters', methods=['GET'])
@token_required
def get_carpenters(current_user):
    try:
        carpenters = Carpenter.query.filter_by(is_active=True).all()
        
        # Adicionar estatísticas para cada marceneiro
        carpenters_with_stats = []
        for carpenter in carpenters:
            orders = Order.query.filter_by(carpenter=carpenter.name).all()
            
            stats = {
                'total': len(orders),
                'atrasada': len([o for o in orders if o.status == 'atrasada']),
                'paraHoje': len([o for o in orders if o.status == 'paraHoje']),
                'emProcesso': len([o for o in orders if o.status == 'emProcesso']),
                'recebida': len([o for o in orders if o.status == 'recebida']),
                'concluida': len([o for o in orders if o.status == 'concluida'])
            }
            
            carpenter_data = carpenter.to_dict()
            carpenter_data['stats'] = stats
            carpenters_with_stats.append(carpenter_data)
        
        return jsonify({
            'carpenters': carpenters_with_stats
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

@carpenters_bp.route('/carpenters', methods=['POST'])
@token_required
@admin_or_carpenter_required
def create_carpenter(current_user):
    try:
        data = request.get_json()
        
        if not data or not data.get('name'):
            return jsonify({'message': 'Nome do marceneiro é obrigatório'}), 400
        
        # Verificar se marceneiro já existe
        existing_carpenter = Carpenter.query.filter_by(name=data['name']).first()
        if existing_carpenter:
            if existing_carpenter.is_active:
                return jsonify({'message': 'Marceneiro já existe'}), 400
            else:
                # Reativar marceneiro inativo
                existing_carpenter.is_active = True
                db.session.commit()
                return jsonify({
                    'message': 'Marceneiro reativado com sucesso',
                    'carpenter': existing_carpenter.to_dict()
                }), 200
        
        carpenter = Carpenter(name=data['name'])
        
        db.session.add(carpenter)
        db.session.commit()
        
        return jsonify({
            'message': 'Marceneiro criado com sucesso',
            'carpenter': carpenter.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

@carpenters_bp.route('/carpenters/<int:carpenter_id>', methods=['PUT'])
@token_required
@admin_or_carpenter_required
def update_carpenter(current_user, carpenter_id):
    try:
        carpenter = Carpenter.query.get_or_404(carpenter_id)
        data = request.get_json()
        
        if 'name' in data:
            # Verificar se novo nome já existe
            existing = Carpenter.query.filter_by(name=data['name']).filter(Carpenter.id != carpenter_id).first()
            if existing:
                return jsonify({'message': 'Nome já existe para outro marceneiro'}), 400
            
            # Atualizar nome nas ordens
            orders = Order.query.filter_by(carpenter=carpenter.name).all()
            for order in orders:
                order.carpenter = data['name']
            
            carpenter.name = data['name']
        
        if 'is_active' in data:
            carpenter.is_active = data['is_active']
            
            # Se desativando, remover das ordens
            if not data['is_active']:
                orders = Order.query.filter_by(carpenter=carpenter.name).all()
                for order in orders:
                    order.carpenter = None
        
        db.session.commit()
        
        return jsonify({
            'message': 'Marceneiro atualizado com sucesso',
            'carpenter': carpenter.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

@carpenters_bp.route('/carpenters/<int:carpenter_id>', methods=['DELETE'])
@token_required
@admin_or_carpenter_required
def delete_carpenter(current_user, carpenter_id):
    try:
        carpenter = Carpenter.query.get_or_404(carpenter_id)
        
        # Remover marceneiro das ordens
        orders = Order.query.filter_by(carpenter=carpenter.name).all()
        for order in orders:
            order.carpenter = None
        
        # Marcar como inativo ao invés de deletar
        carpenter.is_active = False
        
        db.session.commit()
        
        return jsonify({'message': 'Marceneiro removido com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

@carpenters_bp.route('/carpenters/names', methods=['GET'])
@token_required
def get_carpenter_names(current_user):
    """Retorna apenas os nomes dos marceneiros ativos para compatibilidade com o frontend"""
    try:
        carpenters = Carpenter.query.filter_by(is_active=True).all()
        names = [carpenter.name for carpenter in carpenters]
        
        return jsonify({
            'carpenters': names
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

