from flask import Blueprint, jsonify, request, g
from datetime import datetime
from src.models.ordem import Ordem, OrdemMaterial, db
from src.models.auth import Usuario
from src.utils.auth import token_required, admin_required, marceneiro_or_admin_required

ordem_bp = Blueprint('ordem', __name__)

@ordem_bp.route('/ordens', methods=['GET'])
@token_required
def get_ordens():
    try:
        # Parâmetros de filtro
        status = request.args.get('status')
        marceneiro_id = request.args.get('marceneiro_id')
        cliente = request.args.get('cliente')
        
        query = Ordem.query
        
        if status:
            query = query.filter(Ordem.status == status)
        if marceneiro_id:
            query = query.filter(Ordem.marceneiro_id == marceneiro_id)
        if cliente:
            query = query.filter(Ordem.cliente.ilike(f'%{cliente}%'))
        
        ordens = query.order_by(Ordem.data_criacao.desc()).all()
        
        return jsonify([ordem.to_dict() for ordem in ordens]), 200
        
    except Exception as e:
        return jsonify({'message': f'Erro ao buscar ordens: {str(e)}'}), 500

@ordem_bp.route('/ordens/<int:ordem_id>', methods=['GET'])
@token_required
def get_ordem(ordem_id):
    try:
        ordem = Ordem.query.get_or_404(ordem_id)
        return jsonify(ordem.to_dict()), 200
    except Exception as e:
        return jsonify({'message': f'Erro ao buscar ordem: {str(e)}'}), 500

@ordem_bp.route('/ordens', methods=['POST'])
@token_required
@admin_required
def create_ordem():
    try:
        data = request.json
        
        # Validar dados obrigatórios
        if not data.get('numero_ordem') or not data.get('cliente') or not data.get('descricao'):
            return jsonify({'message': 'Número da ordem, cliente e descrição são obrigatórios'}), 400
        
        # Verificar se número da ordem já existe
        if Ordem.query.filter_by(numero_ordem=data['numero_ordem']).first():
            return jsonify({'message': 'Número da ordem já existe'}), 400
        
        # Criar nova ordem
        ordem = Ordem(
            numero_ordem=data['numero_ordem'],
            cliente=data['cliente'],
            descricao=data['descricao'],
            data_entrega=datetime.fromisoformat(data['data_entrega']) if data.get('data_entrega') else None,
            status=data.get('status', 'Pendente'),
            marceneiro_id=data.get('marceneiro_id'),
            observacoes=data.get('observacoes')
        )
        
        db.session.add(ordem)
        db.session.flush()  # Para obter o ID da ordem
        
        # Adicionar materiais se fornecidos
        if data.get('materiais'):
            valor_total = 0
            for material_data in data['materiais']:
                ordem_material = OrdemMaterial(
                    ordem_id=ordem.id,
                    material_id=material_data['material_id'],
                    quantidade=material_data['quantidade'],
                    preco_unitario=material_data['preco_unitario'],
                    subtotal=material_data['quantidade'] * material_data['preco_unitario']
                )
                valor_total += ordem_material.subtotal
                db.session.add(ordem_material)
            
            ordem.valor_total = valor_total
        
        db.session.commit()
        
        return jsonify({
            'message': 'Ordem criada com sucesso',
            'ordem': ordem.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro ao criar ordem: {str(e)}'}), 500

@ordem_bp.route('/ordens/<int:ordem_id>', methods=['PUT'])
@token_required
def update_ordem(ordem_id):
    try:
        ordem = Ordem.query.get_or_404(ordem_id)
        data = request.json
        
        # Verificar permissões
        if g.current_user.tipo_acesso == 'visitante':
            return jsonify({'message': 'Visitantes não podem editar ordens'}), 403
        
        # Campos que podem ser atualizados
        if 'cliente' in data and g.current_user.tipo_acesso == 'administrador':
            ordem.cliente = data['cliente']
        
        if 'descricao' in data and g.current_user.tipo_acesso == 'administrador':
            ordem.descricao = data['descricao']
        
        if 'data_entrega' in data:
            ordem.data_entrega = datetime.fromisoformat(data['data_entrega']) if data['data_entrega'] else None
        
        if 'status' in data:
            ordem.status = data['status']
        
        if 'marceneiro_id' in data:
            ordem.marceneiro_id = data['marceneiro_id']
        
        if 'observacoes' in data:
            ordem.observacoes = data['observacoes']
        
        # Atualizar materiais (apenas administradores)
        if 'materiais' in data and g.current_user.tipo_acesso == 'administrador':
            # Remover materiais existentes
            OrdemMaterial.query.filter_by(ordem_id=ordem_id).delete()
            
            # Adicionar novos materiais
            valor_total = 0
            for material_data in data['materiais']:
                ordem_material = OrdemMaterial(
                    ordem_id=ordem.id,
                    material_id=material_data['material_id'],
                    quantidade=material_data['quantidade'],
                    preco_unitario=material_data['preco_unitario'],
                    subtotal=material_data['quantidade'] * material_data['preco_unitario']
                )
                valor_total += ordem_material.subtotal
                db.session.add(ordem_material)
            
            ordem.valor_total = valor_total
        
        db.session.commit()
        
        return jsonify({
            'message': 'Ordem atualizada com sucesso',
            'ordem': ordem.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro ao atualizar ordem: {str(e)}'}), 500

@ordem_bp.route('/ordens/<int:ordem_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_ordem(ordem_id):
    try:
        ordem = Ordem.query.get_or_404(ordem_id)
        
        # Remover materiais associados (cascade já configurado no modelo)
        db.session.delete(ordem)
        db.session.commit()
        
        return jsonify({'message': 'Ordem deletada com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro ao deletar ordem: {str(e)}'}), 500

@ordem_bp.route('/ordens/<int:ordem_id>/materiais', methods=['POST'])
@token_required
@admin_required
def add_material_to_ordem(ordem_id):
    try:
        ordem = Ordem.query.get_or_404(ordem_id)
        data = request.json
        
        ordem_material = OrdemMaterial(
            ordem_id=ordem_id,
            material_id=data['material_id'],
            quantidade=data['quantidade'],
            preco_unitario=data['preco_unitario'],
            subtotal=data['quantidade'] * data['preco_unitario']
        )
        
        db.session.add(ordem_material)
        
        # Atualizar valor total da ordem
        ordem.valor_total = (ordem.valor_total or 0) + ordem_material.subtotal
        
        db.session.commit()
        
        return jsonify({
            'message': 'Material adicionado à ordem com sucesso',
            'ordem_material': ordem_material.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro ao adicionar material: {str(e)}'}), 500

@ordem_bp.route('/ordens/<int:ordem_id>/materiais/<int:material_id>', methods=['DELETE'])
@token_required
@admin_required
def remove_material_from_ordem(ordem_id, material_id):
    try:
        ordem = Ordem.query.get_or_404(ordem_id)
        ordem_material = OrdemMaterial.query.filter_by(
            ordem_id=ordem_id, 
            material_id=material_id
        ).first_or_404()
        
        # Atualizar valor total da ordem
        ordem.valor_total = (ordem.valor_total or 0) - ordem_material.subtotal
        
        db.session.delete(ordem_material)
        db.session.commit()
        
        return jsonify({'message': 'Material removido da ordem com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro ao remover material: {str(e)}'}), 500

@ordem_bp.route('/ordens/estatisticas', methods=['GET'])
@token_required
def get_estatisticas():
    try:
        total_ordens = Ordem.query.count()
        ordens_pendentes = Ordem.query.filter_by(status='Pendente').count()
        ordens_em_andamento = Ordem.query.filter_by(status='Em Andamento').count()
        ordens_concluidas = Ordem.query.filter_by(status='Concluída').count()
        
        valor_total = db.session.query(db.func.sum(Ordem.valor_total)).scalar() or 0
        
        return jsonify({
            'total_ordens': total_ordens,
            'ordens_pendentes': ordens_pendentes,
            'ordens_em_andamento': ordens_em_andamento,
            'ordens_concluidas': ordens_concluidas,
            'valor_total': valor_total
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Erro ao buscar estatísticas: {str(e)}'}), 500

