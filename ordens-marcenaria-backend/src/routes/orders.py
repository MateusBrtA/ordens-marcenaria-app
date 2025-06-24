from flask import Blueprint, request, jsonify
from src.models.user import db, Order, Material
from src.routes.auth import token_required, admin_or_carpenter_required
from datetime import datetime, date

orders_bp = Blueprint('orders', __name__)

def update_order_status(order):
    """Atualiza o status da ordem baseado na data"""
    if order.status == 'concluida':
        return order.status
    
    today = date.today()
    exit_date = order.exit_date
    
    if exit_date < today:
        return 'atrasada'
    elif exit_date == today:
        return 'paraHoje'
    
    return order.status

@orders_bp.route('/orders', methods=['GET'])
@token_required
def get_orders(current_user):
    try:
        orders = Order.query.all()
        
        # Atualizar status automaticamente
        for order in orders:
            new_status = update_order_status(order)
            if new_status != order.status:
                order.status = new_status
        
        db.session.commit()
        
        return jsonify({
            'orders': [order.to_dict() for order in orders]
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

@orders_bp.route('/orders', methods=['POST'])
@token_required
@admin_or_carpenter_required
def create_order(current_user):
    try:
        data = request.get_json()
        
        if not data or not data.get('id') or not data.get('description'):
            return jsonify({'message': 'ID e descrição são obrigatórios'}), 400
        
        # Verificar se ID já existe
        if Order.query.get(data['id']):
            return jsonify({'message': 'ID da ordem já existe'}), 400
        
        # Converter datas
        entry_date = datetime.strptime(data['entryDate'], '%Y-%m-%d').date()
        exit_date = datetime.strptime(data['exitDate'], '%Y-%m-%d').date()
        
        order = Order(
            id=data['id'],
            description=data['description'],
            entry_date=entry_date,
            exit_date=exit_date,
            carpenter=data.get('carpenter'),
            status=data.get('status', 'recebida'),
            created_by=current_user.id
        )
        
        # Atualizar status automaticamente
        order.status = update_order_status(order)
        
        db.session.add(order)
        
        # Adicionar materiais se fornecidos
        if 'materials' in data and data['materials']:
            for material_data in data['materials']:
                material = Material(
                    description=material_data['description'],
                    quantity=material_data.get('quantity', 1),
                    order_id=order.id
                )
                db.session.add(material)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Ordem criada com sucesso',
            'order': order.to_dict()
        }), 201
        
    except ValueError as e:
        return jsonify({'message': 'Formato de data inválido. Use YYYY-MM-DD'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

@orders_bp.route('/orders/<string:order_id>', methods=['GET'])
@token_required
def get_order(current_user, order_id):
    try:
        order = Order.query.get_or_404(order_id)
        
        # Atualizar status automaticamente
        new_status = update_order_status(order)
        if new_status != order.status:
            order.status = new_status
            db.session.commit()
        
        return jsonify({'order': order.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

@orders_bp.route('/orders/<string:order_id>', methods=['PUT'])
@token_required
@admin_or_carpenter_required
def update_order(current_user, order_id):
    try:
        order = Order.query.get_or_404(order_id)
        data = request.get_json()
        
        if 'description' in data:
            order.description = data['description']
        if 'entryDate' in data:
            order.entry_date = datetime.strptime(data['entryDate'], '%Y-%m-%d').date()
        if 'exitDate' in data:
            order.exit_date = datetime.strptime(data['exitDate'], '%Y-%m-%d').date()
        if 'carpenter' in data:
            order.carpenter = data['carpenter']
        if 'status' in data:
            order.status = data['status']
        
        order.updated_at = datetime.utcnow()
        
        # Atualizar status automaticamente se não foi definido manualmente
        if 'status' not in data:
            order.status = update_order_status(order)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Ordem atualizada com sucesso',
            'order': order.to_dict()
        }), 200
        
    except ValueError as e:
        return jsonify({'message': 'Formato de data inválido. Use YYYY-MM-DD'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

@orders_bp.route('/orders/<string:order_id>', methods=['DELETE'])
@token_required
@admin_or_carpenter_required
def delete_order(current_user, order_id):
    try:
        order = Order.query.get_or_404(order_id)
        
        db.session.delete(order)
        db.session.commit()
        
        return jsonify({'message': 'Ordem excluída com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

@orders_bp.route('/orders/<string:order_id>/materials', methods=['POST'])
@token_required
@admin_or_carpenter_required
def add_material(current_user, order_id):
    try:
        order = Order.query.get_or_404(order_id)
        data = request.get_json()
        
        if not data or not data.get('description'):
            return jsonify({'message': 'Descrição do material é obrigatória'}), 400
        
        material = Material(
            description=data['description'],
            quantity=data.get('quantity', 1),
            order_id=order_id
        )
        
        db.session.add(material)
        db.session.commit()
        
        return jsonify({
            'message': 'Material adicionado com sucesso',
            'material': material.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

@orders_bp.route('/orders/<string:order_id>/materials/<int:material_id>', methods=['PUT'])
@token_required
@admin_or_carpenter_required
def update_material(current_user, order_id, material_id):
    try:
        material = Material.query.filter_by(id=material_id, order_id=order_id).first_or_404()
        data = request.get_json()
        
        if 'description' in data:
            material.description = data['description']
        if 'quantity' in data:
            material.quantity = data['quantity']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Material atualizado com sucesso',
            'material': material.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

@orders_bp.route('/orders/<string:order_id>/materials/<int:material_id>', methods=['DELETE'])
@token_required
@admin_or_carpenter_required
def delete_material(current_user, order_id, material_id):
    try:
        material = Material.query.filter_by(id=material_id, order_id=order_id).first_or_404()
        
        db.session.delete(material)
        db.session.commit()
        
        return jsonify({'message': 'Material excluído com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

