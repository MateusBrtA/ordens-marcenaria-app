from flask import Blueprint, request, jsonify
from src.models.user import db, Delivery, Order
from src.routes.auth import token_required, admin_or_carpenter_required
from datetime import datetime, date

deliveries_bp = Blueprint('deliveries', __name__)

@deliveries_bp.route('/deliveries', methods=['GET'])
@token_required
def get_deliveries(current_user):
    try:
        deliveries = Delivery.query.all()
        return jsonify({
            'deliveries': [delivery.to_dict() for delivery in deliveries]
        }), 200
    except Exception as e:
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

@deliveries_bp.route('/deliveries', methods=['POST'])
@token_required
@admin_or_carpenter_required
def create_delivery(current_user):
    try:
        data = request.get_json()
        
        if not data or not data.get('id') or not data.get('orderId') or not data.get('deliveryDate') or not data.get('deliveryAddress'):
            return jsonify({'message': 'ID, ID da ordem, data de entrega e endereço de entrega são obrigatórios'}), 400
        
        if Delivery.query.get(data['id']):
            return jsonify({'message': 'ID da entrega já existe'}), 400

        if not Order.query.get(data['orderId']):
            return jsonify({'message': 'Ordem com o ID fornecido não existe'}), 400
        
        delivery_date = datetime.strptime(data['deliveryDate'], '%Y-%m-%d').date()
        
        delivery = Delivery(
            id=data['id'],
            order_id=data['orderId'],
            delivery_date=delivery_date,
            delivery_status=data.get('deliveryStatus', 'pendente'),
            delivery_address=data['deliveryAddress'],
            notes=data.get('notes')
        )
        
        db.session.add(delivery)
        db.session.commit()
        
        return jsonify({
            'message': 'Entrega criada com sucesso',
            'delivery': delivery.to_dict()
        }), 201
        
    except ValueError as e:
        return jsonify({'message': 'Formato de data inválido. Use YYYY-MM-DD'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

@deliveries_bp.route('/deliveries/<string:delivery_id>', methods=['GET'])
@token_required
def get_delivery(current_user, delivery_id):
    try:
        delivery = Delivery.query.get_or_404(delivery_id)
        return jsonify({'delivery': delivery.to_dict()}), 200
    except Exception as e:
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

@deliveries_bp.route('/deliveries/<string:delivery_id>', methods=['PUT'])
@token_required
@admin_or_carpenter_required
def update_delivery(current_user, delivery_id):
    try:
        delivery = Delivery.query.get_or_404(delivery_id)
        data = request.get_json()
        
        if 'orderId' in data:
            if not Order.query.get(data['orderId']):
                return jsonify({'message': 'Ordem com o ID fornecido não existe'}), 400
            delivery.order_id = data['orderId']
        if 'deliveryDate' in data:
            delivery.delivery_date = datetime.strptime(data['deliveryDate'], '%Y-%m-%d').date()
        if 'deliveryStatus' in data:
            delivery.delivery_status = data['deliveryStatus']
        if 'deliveryAddress' in data:
            delivery.delivery_address = data['deliveryAddress']
        if 'notes' in data:
            delivery.notes = data['notes']
        
        delivery.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Entrega atualizada com sucesso',
            'delivery': delivery.to_dict()
        }), 200
        
    except ValueError as e:
        return jsonify({'message': 'Formato de data inválido. Use YYYY-MM-DD'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

@deliveries_bp.route('/deliveries/<string:delivery_id>', methods=['DELETE'])
@token_required
@admin_or_carpenter_required
def delete_delivery(current_user, delivery_id):
    try:
        delivery = Delivery.query.get_or_404(delivery_id)
        
        db.session.delete(delivery)
        db.session.commit()
        
        return jsonify({'message': 'Entrega excluída com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500