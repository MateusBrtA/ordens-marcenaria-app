from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from src.models.user import db
import json

class HistoricoAlteracao(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    tabela = db.Column(db.String(50), nullable=False)  # nome da tabela afetada
    registro_id = db.Column(db.Integer, nullable=False)  # ID do registro afetado
    operacao = db.Column(db.String(20), nullable=False)  # CREATE, UPDATE, DELETE
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    data_alteracao = db.Column(db.DateTime, default=datetime.utcnow)
    dados_anteriores = db.Column(db.Text, nullable=True)  # JSON dos dados antes da alteração
    dados_novos = db.Column(db.Text, nullable=True)  # JSON dos dados após a alteração
    campos_alterados = db.Column(db.Text, nullable=True)  # Lista dos campos que foram alterados
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.String(500), nullable=True)
    observacoes = db.Column(db.Text, nullable=True)
    
    # Relacionamento
    usuario = db.relationship('Usuario', backref='historico_alteracoes')
    
    def __repr__(self):
        return f'<HistoricoAlteracao {self.tabela}:{self.registro_id} - {self.operacao}>'
    
    def set_dados_anteriores(self, dados):
        """Converte dados para JSON string"""
        if dados:
            self.dados_anteriores = json.dumps(dados, default=str, ensure_ascii=False)
    
    def set_dados_novos(self, dados):
        """Converte dados para JSON string"""
        if dados:
            self.dados_novos = json.dumps(dados, default=str, ensure_ascii=False)
    
    def get_dados_anteriores(self):
        """Retorna dados anteriores como dict"""
        if self.dados_anteriores:
            return json.loads(self.dados_anteriores)
        return None
    
    def get_dados_novos(self):
        """Retorna dados novos como dict"""
        if self.dados_novos:
            return json.loads(self.dados_novos)
        return None
    
    def set_campos_alterados(self, campos):
        """Converte lista de campos para JSON string"""
        if campos:
            self.campos_alterados = json.dumps(campos, ensure_ascii=False)
    
    def get_campos_alterados(self):
        """Retorna campos alterados como lista"""
        if self.campos_alterados:
            return json.loads(self.campos_alterados)
        return []
    
    def to_dict(self):
        return {
            'id': self.id,
            'tabela': self.tabela,
            'registro_id': self.registro_id,
            'operacao': self.operacao,
            'usuario_id': self.usuario_id,
            'usuario': self.usuario.to_dict() if self.usuario else None,
            'data_alteracao': self.data_alteracao.isoformat() if self.data_alteracao else None,
            'dados_anteriores': self.get_dados_anteriores(),
            'dados_novos': self.get_dados_novos(),
            'campos_alterados': self.get_campos_alterados(),
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'observacoes': self.observacoes
        }

def registrar_alteracao(tabela, registro_id, operacao, usuario_id, dados_anteriores=None, 
                       dados_novos=None, campos_alterados=None, ip_address=None, 
                       user_agent=None, observacoes=None):
    """
    Função utilitária para registrar alterações no histórico
    
    Args:
        tabela: Nome da tabela afetada
        registro_id: ID do registro afetado
        operacao: Tipo de operação (CREATE, UPDATE, DELETE)
        usuario_id: ID do usuário que fez a alteração
        dados_anteriores: Dados antes da alteração (dict)
        dados_novos: Dados após a alteração (dict)
        campos_alterados: Lista de campos alterados
        ip_address: IP do usuário
        user_agent: User agent do navegador
        observacoes: Observações adicionais
    """
    try:
        historico = HistoricoAlteracao(
            tabela=tabela,
            registro_id=registro_id,
            operacao=operacao,
            usuario_id=usuario_id,
            ip_address=ip_address,
            user_agent=user_agent,
            observacoes=observacoes
        )
        
        historico.set_dados_anteriores(dados_anteriores)
        historico.set_dados_novos(dados_novos)
        historico.set_campos_alterados(campos_alterados)
        
        db.session.add(historico)
        db.session.commit()
        
        return historico
        
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao registrar histórico: {str(e)}")
        return None

def comparar_dados(dados_anteriores, dados_novos):
    """
    Compara dois dicionários e retorna os campos que foram alterados
    
    Args:
        dados_anteriores: Dict com dados anteriores
        dados_novos: Dict com dados novos
    
    Returns:
        Lista de campos alterados
    """
    campos_alterados = []
    
    if not dados_anteriores:
        return list(dados_novos.keys()) if dados_novos else []
    
    if not dados_novos:
        return []
    
    for campo, valor_novo in dados_novos.items():
        valor_anterior = dados_anteriores.get(campo)
        
        # Comparar valores, considerando tipos diferentes
        if str(valor_anterior) != str(valor_novo):
            campos_alterados.append(campo)
    
    return campos_alterados

