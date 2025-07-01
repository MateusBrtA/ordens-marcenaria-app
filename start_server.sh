#!/bin/bash

# Script para iniciar o Sistema de Ordens de Marcenaria
# Compatível com Linux e macOS

set -e

echo ""
echo "========================================"
echo "   Sistema de Ordens de Marcenaria"
echo "========================================"
echo ""

# Verificar se Python está instalado
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 não encontrado! Instale o Python primeiro."
    exit 1
fi

# Verificar se o arquivo de configuração existe
if [ ! -f "config.json" ]; then
    echo "❌ Arquivo config.json não encontrado!"
    echo "Certifique-se de que está executando na pasta correta."
    exit 1
fi

# Verificar se o script Python existe
if [ ! -f "start_server.py" ]; then
    echo "❌ Script start_server.py não encontrado!"
    exit 1
fi

echo "🚀 Iniciando servidor..."
echo ""

# Tornar o script Python executável
chmod +x start_server.py

# Executar o script Python
python3 start_server.py

echo ""
echo "🏁 Servidor finalizado."

