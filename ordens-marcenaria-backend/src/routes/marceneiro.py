from flask import Blueprint, jsonify, request, g
from src.models.ordem import Marceneiro, db
from src.utils.auth import token_required, admin_required

marceneiro_bp = Blueprint('marceneiro', __name__)

@marceneiro_bp.route('/marceneiros', methods=['GET'])
@token_required
def get_marceneiros():
    try:
        # Parâmetro para filtrar apenas ativos
        apenas_ativos = request.args.get('apenas_ativos', 'false').lower() == 'true'
        
        query = Marceneiro.query
        if apenas_ativos:
            query = query.filter_by(ativo=True)
        
        marceneiros = query.order_by(Marceneiro.nome).all()
        
        return jsonify([marceneiro.to_dict() for marceneiro in marceneiros]), 200
        
    except Exception as e:
        return jsonify({'message': f'Erro ao buscar marceneiros: {str(e)}'}), 500

@marceneiro_bp.route('/marceneiros/<int:marceneiro_id>', methods=['GET'])
@token_required
def get_marceneiro(marceneiro_id):
    try:
        marceneiro = Marceneiro.query.get_or_404(marceneiro_id)
        return jsonify(marceneiro.to_dict()), 200
    except Exception as e:
        return jsonify({'message': f'Erro ao buscar marceneiro: {str(e)}'}), 500

@marceneiro_bp.route('/marceneiros', methods=['POST'])
@token_required
@admin_required
def create_marceneiro():
    try:
        data = request.json
        
        # Validar dados obrigatórios
        if not data.get('nome') or not data.get('email'):
            return jsonify({'message': 'Nome e email são obrigatórios'}), 400
        
        # Verificar se email já existe
        if Marceneiro.query.filter_by(email=data['email']).first():
            return jsonify({'message': 'Email já existe'}), 400
        
        # Criar novo marceneiro
        marceneiro = Marceneiro(
            nome=data['nome'],
            email=data['email'],
            telefone=data.get('telefone'),
            especialidade=data.get('especialidade'),
            ativo=data.get('ativo', True)
        )
        
        db.session.add(marceneiro)
        db.session.commit()
        
        return jsonify({
            'message': 'Marceneiro criado com sucesso',
            'marceneiro': marceneiro.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro ao criar marceneiro: {str(e)}'}), 500

@marceneiro_bp.route('/marceneiros/<int:marceneiro_id>', methods=['PUT'])
@token_required
@admin_required
def update_marceneiro(marceneiro_id):
    try:
        marceneiro = Marceneiro.query.get_or_404(marceneiro_id)
        data = request.json
        
        # Verificar se email já existe (exceto o próprio marceneiro)
        if 'email' in data:
            existing = Marceneiro.query.filter_by(email=data['email']).first()
            if existing and existing.id != marceneiro_id:
                return jsonify({'message': 'Email já existe'}), 400
            marceneiro.email = data['email']
        
        if 'nome' in data:
            marceneiro.nome = data['nome']
        
        if 'telefone' in data:
            marceneiro.telefone = data['telefone']
        
        if 'especialidade' in data:
            marceneiro.especialidade = data['especialidade']
        
        if 'ativo' in data:
            marceneiro.ativo = data['ativo']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Marceneiro atualizado com sucesso',
            'marceneiro': marceneiro.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro ao atualizar marceneiro: {str(e)}'}), 500

@marceneiro_bp.route('/marceneiros/<int:marceneiro_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_marceneiro(marceneiro_id):
    try:
        marceneiro = Marceneiro.query.get_or_404(marceneiro_id)
        
        # Verificar se há ordens associadas
        if marceneiro.ordens:
            return jsonify({
                'message': 'Não é possível deletar marceneiro com ordens associadas. Desative-o em vez disso.'
            }), 400
        
        db.session.delete(marceneiro)
        db.session.commit()
        
        return jsonify({'message': 'Marceneiro deletado com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro ao deletar marceneiro: {str(e)}'}), 500

@marceneiro_bp.route('/marceneiros/<int:marceneiro_id>/ordens', methods=['GET'])
@token_required
def get_ordens_marceneiro(marceneiro_id):
    try:
        marceneiro = Marceneiro.query.get_or_404(marceneiro_id)
        
        # Parâmetros de filtro
        status = request.args.get('status')
        
        ordens = marceneiro.ordens
        if status:
            ordens = [ordem for ordem in ordens if ordem.status == status]
        
        # Ordenar por data de criação (mais recentes primeiro)
        ordens = sorted(ordens, key=lambda x: x.data_criacao, reverse=True)
        
        return jsonify([ordem.to_dict() for ordem in ordens]), 200
        
    except Exception as e:
        return jsonify({'message': f'Erro ao buscar ordens do marceneiro: {str(e)}'}), 500

@marceneiro_bp.route('/marceneiros/<int:marceneiro_id>/estatisticas', methods=['GET'])
@token_required
def get_estatisticas_marceneiro(marceneiro_id):
    try:
        marceneiro = Marceneiro.query.get_or_404(marceneiro_id)
        
        total_ordens = len(marceneiro.ordens)
        ordens_pendentes = len([o for o in marceneiro.ordens if o.status == 'Pendente'])
        ordens_em_andamento = len([o for o in marceneiro.ordens if o.status == 'Em Andamento'])
        ordens_concluidas = len([o for o in marceneiro.ordens if o.status == 'Concluída'])
        
        valor_total = sum(ordem.valor_total or 0 for ordem in marceneiro.ordens)
        
        return jsonify({
            'marceneiro': marceneiro.to_dict(),
            'total_ordens': total_ordens,
            'ordens_pendentes': ordens_pendentes,
            'ordens_em_andamento': ordens_em_andamento,
            'ordens_concluidas': ordens_concluidas,
            'valor_total': valor_total
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Erro ao buscar estatísticas do marceneiro: {str(e)}'}), 500

