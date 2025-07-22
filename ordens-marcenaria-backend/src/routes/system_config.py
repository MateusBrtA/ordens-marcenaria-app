from flask import Blueprint, request, jsonify
from src.models.user import db, SystemConfig
from src.routes.auth import token_required, admin_required

system_config_bp = Blueprint("system_config", __name__)

@system_config_bp.route("/system/config", methods=["GET"])
@token_required
def get_all_configs(current_user):
    """Busca todas as configurações do sistema"""
    try:
        configs = SystemConfig.query.all()
        return jsonify({
            "configs": [config.to_dict() for config in configs]
        }), 200
    except Exception as e:
        return jsonify({"message": f"Erro interno: {str(e)}"}), 500

@system_config_bp.route("/system/config/<string:key>", methods=["GET"])
@token_required
def get_config(current_user, key):
    """Busca uma configuração específica"""
    try:
        config = SystemConfig.query.filter_by(key=key).first()
        if not config:
            return jsonify({"message": "Configuração não encontrada"}), 404
        
        return jsonify({
            "config": config.to_dict()
        }), 200
    except Exception as e:
        return jsonify({"message": f"Erro interno: {str(e)}"}), 500

@system_config_bp.route("/system/config/backend-url", methods=["GET"])
def get_backend_url():
    """Busca a URL do backend (rota pública para permitir configuração inicial)"""
    try:
        backend_url = SystemConfig.get_config("backend_url", "")
        return jsonify({
            "backend_url": backend_url
        }), 200
    except Exception as e:
        return jsonify({"message": f"Erro interno: {str(e)}"}), 500

@system_config_bp.route("/system/config", methods=["POST"])
@token_required
@admin_required
def set_config(current_user):
    """Define ou atualiza uma configuração"""
    try:
        data = request.get_json()
        
        if not data or not data.get("key") or not data.get("value"):
            return jsonify({"message": "Key e value são obrigatórios"}), 400
        
        key = data["key"]
        value = data["value"]
        description = data.get("description")
        
        # Validações específicas para certas configurações
        if key == "backend_url":
            # Validar se é uma URL válida
            if not value.startswith(("http://", "https://")):
                return jsonify({"message": "URL do backend deve começar com http:// ou https://"}), 400
        
        config = SystemConfig.set_config(
            key=key,
            value=value,
            description=description,
            user_id=current_user.id
        )
        
        return jsonify({
            "message": "Configuração salva com sucesso",
            "config": config.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Erro interno: {str(e)}"}), 500

@system_config_bp.route("/system/config/backend-url", methods=["POST"])
@token_required
@admin_required
def set_backend_url(current_user):
    """Define a URL do backend (rota específica para facilitar uso)"""
    try:
        data = request.get_json()
        
        if not data or not data.get("url"):
            return jsonify({"message": "URL é obrigatória"}), 400
        
        url = data["url"].strip()
        
        # Validar URL
        if not url.startswith(("http://", "https://")):
            return jsonify({"message": "URL deve começar com http:// ou https://"}), 400
        
        # Remover barra final se existir
        if url.endswith("/"):
            url = url[:-1]
        
        config = SystemConfig.set_config(
            key="backend_url",
            value=url,
            description="URL global do backend para todos os usuários",
            user_id=current_user.id
        )
        
        return jsonify({
            "message": "URL do backend atualizada com sucesso",
            "backend_url": url
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Erro interno: {str(e)}"}), 500

@system_config_bp.route("/system/config/<string:key>", methods=["DELETE"])
@token_required
@admin_required
def delete_config(current_user, key):
    """Remove uma configuração"""
    try:
        config = SystemConfig.query.filter_by(key=key).first()
        if not config:
            return jsonify({"message": "Configuração não encontrada"}), 404
        
        # Não permitir deletar configurações críticas
        if key in ["backend_url"]:
            return jsonify({"message": "Esta configuração não pode ser removida"}), 400
        
        db.session.delete(config)
        db.session.commit()
        
        return jsonify({"message": "Configuração removida com sucesso"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Erro interno: {str(e)}"}), 500