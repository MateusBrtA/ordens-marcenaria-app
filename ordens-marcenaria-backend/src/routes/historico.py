from flask import Blueprint, jsonify, request, g
from datetime import datetime, timedelta
from src.models.historico import HistoricoAlteracao, db
from src.utils.auth import token_required, admin_required

historico_bp = Blueprint('historico', __name__)

@historico_bp.route('/historico', methods=['GET'])
@token_required
def get_historico():
    try:
        # Verificar permissões - apenas administradores e marceneiros podem ver histórico
        if g.current_user.tipo_acesso == 'visitante':
            return jsonify({'message': 'Acesso negado. Visitantes não podem ver o histórico.'}), 403
        
        # Parâmetros de filtro
        tabela = request.args.get('tabela')
        registro_id = request.args.get('registro_id')
        operacao = request.args.get('operacao')
        usuario_id = request.args.get('usuario_id')
        data_inicio = request.args.get('data_inicio')
        data_fim = request.args.get('data_fim')
        limite = request.args.get('limite', 100, type=int)
        pagina = request.args.get('pagina', 1, type=int)
        
        query = HistoricoAlteracao.query
        
        # Aplicar filtros
        if tabela:
            query = query.filter(HistoricoAlteracao.tabela == tabela)
        
        if registro_id:
            query = query.filter(HistoricoAlteracao.registro_id == registro_id)
        
        if operacao:
            query = query.filter(HistoricoAlteracao.operacao == operacao)
        
        if usuario_id:
            query = query.filter(HistoricoAlteracao.usuario_id == usuario_id)
        
        if data_inicio:
            data_inicio_dt = datetime.fromisoformat(data_inicio)
            query = query.filter(HistoricoAlteracao.data_alteracao >= data_inicio_dt)
        
        if data_fim:
            data_fim_dt = datetime.fromisoformat(data_fim)
            query = query.filter(HistoricoAlteracao.data_alteracao <= data_fim_dt)
        
        # Ordenar por data mais recente primeiro
        query = query.order_by(HistoricoAlteracao.data_alteracao.desc())
        
        # Paginação
        offset = (pagina - 1) * limite
        historico_items = query.offset(offset).limit(limite).all()
        total_items = query.count()
        
        return jsonify({
            'historico': [item.to_dict() for item in historico_items],
            'total_items': total_items,
            'pagina_atual': pagina,
            'total_paginas': (total_items + limite - 1) // limite,
            'itens_por_pagina': limite
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Erro ao buscar histórico: {str(e)}'}), 500

@historico_bp.route('/historico/<int:historico_id>', methods=['GET'])
@token_required
def get_historico_item(historico_id):
    try:
        # Verificar permissões
        if g.current_user.tipo_acesso == 'visitante':
            return jsonify({'message': 'Acesso negado. Visitantes não podem ver o histórico.'}), 403
        
        historico_item = HistoricoAlteracao.query.get_or_404(historico_id)
        return jsonify(historico_item.to_dict()), 200
        
    except Exception as e:
        return jsonify({'message': f'Erro ao buscar item do histórico: {str(e)}'}), 500

@historico_bp.route('/historico/tabela/<string:tabela>/registro/<int:registro_id>', methods=['GET'])
@token_required
def get_historico_registro(tabela, registro_id):
    try:
        # Verificar permissões
        if g.current_user.tipo_acesso == 'visitante':
            return jsonify({'message': 'Acesso negado. Visitantes não podem ver o histórico.'}), 403
        
        historico_items = HistoricoAlteracao.query.filter_by(
            tabela=tabela,
            registro_id=registro_id
        ).order_by(HistoricoAlteracao.data_alteracao.desc()).all()
        
        return jsonify([item.to_dict() for item in historico_items]), 200
        
    except Exception as e:
        return jsonify({'message': f'Erro ao buscar histórico do registro: {str(e)}'}), 500

@historico_bp.route('/historico/estatisticas', methods=['GET'])
@token_required
@admin_required
def get_estatisticas_historico():
    try:
        # Estatísticas dos últimos 30 dias
        data_limite = datetime.utcnow() - timedelta(days=30)
        
        # Total de alterações por operação
        operacoes = db.session.query(
            HistoricoAlteracao.operacao,
            db.func.count(HistoricoAlteracao.id).label('total')
        ).filter(
            HistoricoAlteracao.data_alteracao >= data_limite
        ).group_by(HistoricoAlteracao.operacao).all()
        
        # Total de alterações por tabela
        tabelas = db.session.query(
            HistoricoAlteracao.tabela,
            db.func.count(HistoricoAlteracao.id).label('total')
        ).filter(
            HistoricoAlteracao.data_alteracao >= data_limite
        ).group_by(HistoricoAlteracao.tabela).all()
        
        # Total de alterações por usuário
        usuarios = db.session.query(
            HistoricoAlteracao.usuario_id,
            db.func.count(HistoricoAlteracao.id).label('total')
        ).filter(
            HistoricoAlteracao.data_alteracao >= data_limite
        ).group_by(HistoricoAlteracao.usuario_id).all()
        
        # Alterações por dia (últimos 7 dias)
        alteracoes_por_dia = []
        for i in range(7):
            data = datetime.utcnow() - timedelta(days=i)
            data_inicio = data.replace(hour=0, minute=0, second=0, microsecond=0)
            data_fim = data_inicio + timedelta(days=1)
            
            total = HistoricoAlteracao.query.filter(
                HistoricoAlteracao.data_alteracao >= data_inicio,
                HistoricoAlteracao.data_alteracao < data_fim
            ).count()
            
            alteracoes_por_dia.append({
                'data': data_inicio.strftime('%Y-%m-%d'),
                'total': total
            })
        
        return jsonify({
            'periodo': '30 dias',
            'operacoes': [{'operacao': op[0], 'total': op[1]} for op in operacoes],
            'tabelas': [{'tabela': tab[0], 'total': tab[1]} for tab in tabelas],
            'usuarios': [{'usuario_id': usr[0], 'total': usr[1]} for usr in usuarios],
            'alteracoes_por_dia': list(reversed(alteracoes_por_dia))
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Erro ao buscar estatísticas do histórico: {str(e)}'}), 500

@historico_bp.route('/historico/relatorio', methods=['GET'])
@token_required
@admin_required
def get_relatorio_historico():
    try:
        # Parâmetros para o relatório
        data_inicio = request.args.get('data_inicio')
        data_fim = request.args.get('data_fim')
        formato = request.args.get('formato', 'json')  # json ou csv
        
        query = HistoricoAlteracao.query
        
        if data_inicio:
            data_inicio_dt = datetime.fromisoformat(data_inicio)
            query = query.filter(HistoricoAlteracao.data_alteracao >= data_inicio_dt)
        
        if data_fim:
            data_fim_dt = datetime.fromisoformat(data_fim)
            query = query.filter(HistoricoAlteracao.data_alteracao <= data_fim_dt)
        
        historico_items = query.order_by(HistoricoAlteracao.data_alteracao.desc()).all()
        
        if formato == 'csv':
            # Gerar CSV (implementação básica)
            import csv
            import io
            
            output = io.StringIO()
            writer = csv.writer(output)
            
            # Cabeçalho
            writer.writerow([
                'ID', 'Tabela', 'Registro ID', 'Operação', 'Usuário', 
                'Data Alteração', 'Campos Alterados', 'IP', 'Observações'
            ])
            
            # Dados
            for item in historico_items:
                writer.writerow([
                    item.id,
                    item.tabela,
                    item.registro_id,
                    item.operacao,
                    item.usuario.username if item.usuario else '',
                    item.data_alteracao.strftime('%Y-%m-%d %H:%M:%S') if item.data_alteracao else '',
                    ', '.join(item.get_campos_alterados()),
                    item.ip_address or '',
                    item.observacoes or ''
                ])
            
            csv_content = output.getvalue()
            output.close()
            
            return csv_content, 200, {
                'Content-Type': 'text/csv',
                'Content-Disposition': 'attachment; filename=historico_alteracoes.csv'
            }
        
        else:
            # Retornar JSON
            return jsonify({
                'relatorio': [item.to_dict() for item in historico_items],
                'total_items': len(historico_items),
                'periodo': {
                    'data_inicio': data_inicio,
                    'data_fim': data_fim
                }
            }), 200
        
    except Exception as e:
        return jsonify({'message': f'Erro ao gerar relatório: {str(e)}'}), 500

