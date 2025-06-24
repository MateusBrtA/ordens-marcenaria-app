#!/bin/bash

echo "=== Instalação do Sistema de Ordens de Marcenaria ==="
echo ""

# Verificar se Python está instalado
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 não encontrado. Por favor, instale Python 3.11 ou superior."
    exit 1
fi

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale Node.js 18 ou superior."
    exit 1
fi

# Verificar se pnpm está instalado
if ! command -v pnpm &> /dev/null; then
    echo "⚠️  pnpm não encontrado. Instalando..."
    npm install -g pnpm
fi

echo "✅ Pré-requisitos verificados"
echo ""

# Instalar dependências do backend
echo "📦 Instalando dependências do backend..."
cd ordens-marcenaria-backend
source venv/bin/activate
pip install -r requirements.txt
cd ..

# Instalar dependências do frontend
echo "📦 Instalando dependências do frontend..."
pnpm install

echo ""
echo "✅ Instalação concluída!"
echo ""
echo "Para executar o sistema:"
echo ""
echo "1. Backend (Terminal 1):"
echo "   cd ordens-marcenaria-backend"
echo "   source venv/bin/activate"
echo "   python src/main.py"
echo ""
echo "2. Frontend (Terminal 2):"
echo "   pnpm run dev --host 0.0.0.0"
echo ""
echo "3. Acesse: http://localhost:5173"
echo "   Usuário: admin"
echo "   Senha: admin123"
echo ""
echo "📖 Leia o README_COMPLETO.md para mais informações"

