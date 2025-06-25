#!/bin/bash
# O 'set -e' faz com que o script pare imediatamente se um comando falhar
set -e

# Define a variável de ambiente para o Flask CLI saber onde está nosso app
export FLASK_APP=src:create_app()

# Roda as migrações do banco de dados para criar/atualizar o ordens.db
echo "Running database migrations..."
flask db upgrade

# Inicia o servidor Gunicorn
echo "Starting Gunicorn..."
gunicorn --bind 0.0.0.0:$PORT "src:create_app()"