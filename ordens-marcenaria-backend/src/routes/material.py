from flask import Blueprint, jsonify, request, g
from src.models.ordem import Material, db
from src.utils.auth import token_required, admin_required

material_bp = Blueprint('material', __name__)

@material_bp.route('/materiais', methods=['GET'])
@token_required
def get_materiais():
    try:
        # Parâmetros de filtro
        apenas_ativos = request.args.get('apenas_ativos', 'false').lower() == 'true'
        estoque_baixo = request.args.get('estoque_baixo', 'false').lower() == 'true'
        
        query = Material.query
        
        if apenas_ativos:
            query = query.filter_by(ativo=True)
        
        if estoque_baixo:
            query = query.filter(Material.estoque_atual <= Material.estoque_minimo)
        
        materiais = query.order_by(Material.nome).all()
        
        return jsonify([material.to_dict() for material in materiais]), 200
        
    except Exception as e:
        return jsonify({'message': f'Erro ao buscar materiais: {str(e)}'}), 500

@material_bp.route('/materiais/<int:material_id>', methods=['GET'])
@token_required
def get_material(material_id):
    try:
        material = Material.query.get_or_404(material_id)
        return jsonify(material.to_dict()), 200
    except Exception as e:
        return jsonify({'message': f'Erro ao buscar material: {str(e)}'}), 500

@material_bp.route('/materiais', methods=['POST'])
@token_required
@admin_required
def create_material():
    try:
        data = request.json
        
        # Validar dados obrigatórios
        if not data.get('nome') or not data.get('unidade') or data.get('preco_unitario') is None:
            return jsonify({'message': 'Nome, unidade e preço unitário são obrigatórios'}), 400
        
        # Verificar se nome já existe
        if Material.query.filter_by(nome=data['nome']).first():
            return jsonify({'message': 'Material com este nome já existe'}), 400
        
        # Criar novo material
        material = Material(
            nome=data['nome'],
            unidade=data['unidade'],
            preco_unitario=data['preco_unitario'],
            estoque_atual=data.get('estoque_atual', 0.0),
            estoque_minimo=data.get('estoque_minimo', 0.0),
            fornecedor=data.get('fornecedor'),
            ativo=data.get('ativo', True)
        )
        
        db.session.add(material)
        db.session.commit()
        
        return jsonify({
            'message': 'Material criado com sucesso',
            'material': material.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro ao criar material: {str(e)}'}), 500

@material_bp.route('/materiais/<int:material_id>', methods=['PUT'])
@token_required
@admin_required
def update_material(material_id):
    try:
        material = Material.query.get_or_404(material_id)
        data = request.json
        
        # Verificar se nome já existe (exceto o próprio material)
        if 'nome' in data:
            existing = Material.query.filter_by(nome=data['nome']).first()
            if existing and existing.id != material_id:
                return jsonify({'message': 'Material com este nome já existe'}), 400
            material.nome = data['nome']
        
        if 'unidade' in data:
            material.unidade = data['unidade']
        
        if 'preco_unitario' in data:
            material.preco_unitario = data['preco_unitario']
        
        if 'estoque_atual' in data:
            material.estoque_atual = data['estoque_atual']
        
        if 'estoque_minimo' in data:
            material.estoque_minimo = data['estoque_minimo']
        
        if 'fornecedor' in data:
            material.fornecedor = data['fornecedor']
        
        if 'ativo' in data:
            material.ativo = data['ativo']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Material atualizado com sucesso',
            'material': material.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro ao atualizar material: {str(e)}'}), 500

@material_bp.route('/materiais/<int:material_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_material(material_id):
    try:
        material = Material.query.get_or_404(material_id)
        
        # Verificar se há ordens usando este material
        from src.models.ordem import OrdemMaterial
        ordens_com_material = OrdemMaterial.query.filter_by(material_id=material_id).first()
        
        if ordens_com_material:
            return jsonify({
                'message': 'Não é possível deletar material que está sendo usado em ordens. Desative-o em vez disso.'
            }), 400
        
        db.session.delete(material)
        db.session.commit()
        
        return jsonify({'message': 'Material deletado com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro ao deletar material: {str(e)}'}), 500

@material_bp.route('/materiais/<int:material_id>/estoque', methods=['PUT'])
@token_required
@admin_required
def update_estoque(material_id):
    try:
        material = Material.query.get_or_404(material_id)
        data = request.json
        
        if 'quantidade' not in data or 'operacao' not in data:
            return jsonify({'message': 'Quantidade e operação são obrigatórios'}), 400
        
        quantidade = data['quantidade']
        operacao = data['operacao']  # 'adicionar' ou 'remover'
        
        if operacao == 'adicionar':
            material.estoque_atual += quantidade
        elif operacao == 'remover':
            if material.estoque_atual < quantidade:
                return jsonify({'message': 'Estoque insuficiente'}), 400
            material.estoque_atual -= quantidade
        else:
            return jsonify({'message': 'Operação inválida. Use "adicionar" ou "remover"'}), 400
        
        db.session.commit()
        
        return jsonify({
            'message': f'Estoque {operacao}do com sucesso',
            'material': material.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro ao atualizar estoque: {str(e)}'}), 500

@material_bp.route('/materiais/estoque-baixo', methods=['GET'])
@token_required
def get_materiais_estoque_baixo():
    try:
        materiais = Material.query.filter(
            Material.estoque_atual <= Material.estoque_minimo,
            Material.ativo == True
        ).order_by(Material.nome).all()
        
        return jsonify([material.to_dict() for material in materiais]), 200
        
    except Exception as e:
        return jsonify({'message': f'Erro ao buscar materiais com estoque baixo: {str(e)}'}), 500

@material_bp.route('/materiais/relatorio-estoque', methods=['GET'])
@token_required
def get_relatorio_estoque():
    try:
        materiais = Material.query.filter_by(ativo=True).order_by(Material.nome).all()
        
        relatorio = []
        for material in materiais:
            status_estoque = 'Normal'
            if material.estoque_atual <= material.estoque_minimo:
                status_estoque = 'Baixo'
            elif material.estoque_atual == 0:
                status_estoque = 'Zerado'
            
            relatorio.append({
                **material.to_dict(),
                'status_estoque': status_estoque,
                'valor_estoque': material.estoque_atual * material.preco_unitario
            })
        
        valor_total_estoque = sum(item['valor_estoque'] for item in relatorio)
        
        return jsonify({
            'materiais': relatorio,
            'valor_total_estoque': valor_total_estoque,
            'total_materiais': len(relatorio),
            'materiais_estoque_baixo': len([m for m in relatorio if m['status_estoque'] == 'Baixo'])
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Erro ao gerar relatório de estoque: {str(e)}'}), 500

