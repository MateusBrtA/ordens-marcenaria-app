#!/usr/bin/env python3
"""
Script para inicializar o banco de dados com dados de exemplo
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from src.main import app
from src.models.user import db
from src.models.auth import Usuario
from src.models.ordem import Marceneiro, Material, Ordem, OrdemMaterial
from datetime import datetime, timedelta

def init_database():
    """Inicializa o banco de dados com dados de exemplo"""
    with app.app_context():
        # Criar todas as tabelas
        db.create_all()
        
        # Verificar se já existem dados
        if Usuario.query.first():
            print("Banco de dados já possui dados. Pulando inicialização.")
            return
        
        print("Inicializando banco de dados com dados de exemplo...")
        
        # Criar usuários
        admin = Usuario(
            username='admin',
            email='admin@marcenaria.com',
            tipo_acesso='administrador',
            ativo=True
        )
        admin.set_password('admin123')
        
        marceneiro_user = Usuario(
            username='joao_marceneiro',
            email='joao@marcenaria.com',
            tipo_acesso='marceneiro',
            ativo=True
        )
        marceneiro_user.set_password('marceneiro123')
        
        visitante = Usuario(
            username='visitante',
            email='visitante@marcenaria.com',
            tipo_acesso='visitante',
            ativo=True
        )
        visitante.set_password('visitante123')
        
        db.session.add_all([admin, marceneiro_user, visitante])
        db.session.commit()
        
        # Criar marceneiros
        joao = Marceneiro(
            nome='João Silva',
            email='joao.silva@marcenaria.com',
            telefone='(11) 99999-1111',
            especialidade='Móveis sob medida',
            ativo=True
        )
        
        maria = Marceneiro(
            nome='Maria Santos',
            email='maria.santos@marcenaria.com',
            telefone='(11) 99999-2222',
            especialidade='Restauração de móveis',
            ativo=True
        )
        
        pedro = Marceneiro(
            nome='Pedro Costa',
            email='pedro.costa@marcenaria.com',
            telefone='(11) 99999-3333',
            especialidade='Carpintaria geral',
            ativo=True
        )
        
        db.session.add_all([joao, maria, pedro])
        db.session.commit()
        
        # Criar materiais
        materiais_exemplo = [
            {
                'nome': 'Madeira MDF 15mm',
                'unidade': 'm²',
                'preco_unitario': 45.50,
                'estoque_atual': 100.0,
                'estoque_minimo': 20.0,
                'fornecedor': 'Madeireira São Paulo'
            },
            {
                'nome': 'Madeira Pinus 20mm',
                'unidade': 'm²',
                'preco_unitario': 35.00,
                'estoque_atual': 80.0,
                'estoque_minimo': 15.0,
                'fornecedor': 'Madeireira São Paulo'
            },
            {
                'nome': 'Parafuso Phillips 4x40mm',
                'unidade': 'unidade',
                'preco_unitario': 0.25,
                'estoque_atual': 1000.0,
                'estoque_minimo': 200.0,
                'fornecedor': 'Ferragens Central'
            },
            {
                'nome': 'Cola para madeira',
                'unidade': 'litro',
                'preco_unitario': 12.50,
                'estoque_atual': 25.0,
                'estoque_minimo': 5.0,
                'fornecedor': 'Química Industrial'
            },
            {
                'nome': 'Verniz acetinado',
                'unidade': 'litro',
                'preco_unitario': 28.90,
                'estoque_atual': 15.0,
                'estoque_minimo': 3.0,
                'fornecedor': 'Tintas Premium'
            },
            {
                'nome': 'Dobradiça comum 3"',
                'unidade': 'unidade',
                'preco_unitario': 8.50,
                'estoque_atual': 50.0,
                'estoque_minimo': 10.0,
                'fornecedor': 'Ferragens Central'
            }
        ]
        
        for material_data in materiais_exemplo:
            material = Material(**material_data)
            db.session.add(material)
        
        db.session.commit()
        
        # Criar ordens de exemplo
        ordens_exemplo = [
            {
                'numero_ordem': 'ORD-2025-001',
                'cliente': 'Ana Paula Oliveira',
                'descricao': 'Guarda-roupa planejado para quarto casal - 3 portas com espelho',
                'data_entrega': datetime.now() + timedelta(days=15),
                'status': 'Em Andamento',
                'marceneiro_id': joao.id,
                'observacoes': 'Cliente solicitou acabamento em verniz acetinado'
            },
            {
                'numero_ordem': 'ORD-2025-002',
                'cliente': 'Carlos Eduardo Santos',
                'descricao': 'Mesa de jantar em madeira maciça para 6 pessoas',
                'data_entrega': datetime.now() + timedelta(days=20),
                'status': 'Pendente',
                'marceneiro_id': maria.id,
                'observacoes': 'Verificar disponibilidade de madeira maciça'
            },
            {
                'numero_ordem': 'ORD-2025-003',
                'cliente': 'Fernanda Lima',
                'descricao': 'Estante para livros com 5 prateleiras',
                'data_entrega': datetime.now() + timedelta(days=10),
                'status': 'Concluída',
                'marceneiro_id': pedro.id,
                'observacoes': 'Entregue no prazo'
            }
        ]
        
        for ordem_data in ordens_exemplo:
            ordem = Ordem(**ordem_data)
            db.session.add(ordem)
        
        db.session.commit()
        
        # Adicionar materiais às ordens
        # Ordem 1 - Guarda-roupa
        ordem1 = Ordem.query.filter_by(numero_ordem='ORD-2025-001').first()
        mdf = Material.query.filter_by(nome='Madeira MDF 15mm').first()
        parafuso = Material.query.filter_by(nome='Parafuso Phillips 4x40mm').first()
        verniz = Material.query.filter_by(nome='Verniz acetinado').first()
        dobradiça = Material.query.filter_by(nome='Dobradiça comum 3"').first()
        
        materiais_ordem1 = [
            OrdemMaterial(ordem_id=ordem1.id, material_id=mdf.id, quantidade=8.5, 
                         preco_unitario=mdf.preco_unitario, subtotal=8.5 * mdf.preco_unitario),
            OrdemMaterial(ordem_id=ordem1.id, material_id=parafuso.id, quantidade=50, 
                         preco_unitario=parafuso.preco_unitario, subtotal=50 * parafuso.preco_unitario),
            OrdemMaterial(ordem_id=ordem1.id, material_id=verniz.id, quantidade=2, 
                         preco_unitario=verniz.preco_unitario, subtotal=2 * verniz.preco_unitario),
            OrdemMaterial(ordem_id=ordem1.id, material_id=dobradiça.id, quantidade=6, 
                         preco_unitario=dobradiça.preco_unitario, subtotal=6 * dobradiça.preco_unitario)
        ]
        
        for material_ordem in materiais_ordem1:
            db.session.add(material_ordem)
        
        ordem1.valor_total = sum(m.subtotal for m in materiais_ordem1)
        
        # Ordem 2 - Mesa de jantar
        ordem2 = Ordem.query.filter_by(numero_ordem='ORD-2025-002').first()
        pinus = Material.query.filter_by(nome='Madeira Pinus 20mm').first()
        cola = Material.query.filter_by(nome='Cola para madeira').first()
        
        materiais_ordem2 = [
            OrdemMaterial(ordem_id=ordem2.id, material_id=pinus.id, quantidade=4.0, 
                         preco_unitario=pinus.preco_unitario, subtotal=4.0 * pinus.preco_unitario),
            OrdemMaterial(ordem_id=ordem2.id, material_id=cola.id, quantidade=1, 
                         preco_unitario=cola.preco_unitario, subtotal=1 * cola.preco_unitario),
            OrdemMaterial(ordem_id=ordem2.id, material_id=verniz.id, quantidade=1.5, 
                         preco_unitario=verniz.preco_unitario, subtotal=1.5 * verniz.preco_unitario)
        ]
        
        for material_ordem in materiais_ordem2:
            db.session.add(material_ordem)
        
        ordem2.valor_total = sum(m.subtotal for m in materiais_ordem2)
        
        db.session.commit()
        
        print("✅ Banco de dados inicializado com sucesso!")
        print("\n📋 Usuários criados:")
        print("   👤 Admin: admin / admin123")
        print("   🔨 Marceneiro: joao_marceneiro / marceneiro123")
        print("   👁️  Visitante: visitante / visitante123")
        print("\n📊 Dados de exemplo:")
        print(f"   • {Usuario.query.count()} usuários")
        print(f"   • {Marceneiro.query.count()} marceneiros")
        print(f"   • {Material.query.count()} materiais")
        print(f"   • {Ordem.query.count()} ordens")

if __name__ == '__main__':
    init_database()

