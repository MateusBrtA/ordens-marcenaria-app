#!/usr/bin/env python3
"""
Script para iniciar automaticamente o backend Flask e o ngrok
Atualiza automaticamente a URL do ngrok no frontend
"""

import os
import sys
import json
import time
import subprocess
import threading
import requests
import signal
from pathlib import Path

# Configurações
CONFIG_FILE = "config.json"
FLASK_DIR = "ordens-marcenaria-backend"
FRONTEND_API_FILE = "ordens-marcenaria-frontend/src/services/api.js"

class ServerManager:
    def __init__(self):
        self.config = self.load_config()
        self.flask_process = None
        self.ngrok_process = None
        self.project_root = Path(__file__).parent.absolute()
        
    def load_config(self):
        """Carrega configurações do arquivo JSON"""
        try:
            with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"❌ Arquivo {CONFIG_FILE} não encontrado!")
            sys.exit(1)
        except json.JSONDecodeError:
            print(f"❌ Erro ao ler {CONFIG_FILE}!")
            sys.exit(1)
    
    def check_dependencies(self):
        """Verifica se as dependências estão instaladas"""
        print("🔍 Verificando dependências...")
        
        # Verificar Python
        if sys.version_info < (3, 6):
            print("❌ Python 3.6+ é necessário!")
            return False
        
        # Verificar ngrok
        try:
            result = subprocess.run(['ngrok', 'version'], 
                                  capture_output=True, text=True, timeout=10)
            if result.returncode != 0:
                print("❌ ngrok não encontrado! Instale o ngrok primeiro.")
                return False
            print(f"✅ ngrok encontrado: {result.stdout.strip()}")
        except (subprocess.TimeoutExpired, FileNotFoundError):
            print("❌ ngrok não encontrado! Instale o ngrok primeiro.")
            return False
        
        # Verificar Flask
        flask_main = self.project_root / FLASK_DIR / "src" / "main.py"
        if not flask_main.exists():
            print(f"❌ Arquivo Flask não encontrado: {flask_main}")
            return False
        
        print("✅ Todas as dependências verificadas!")
        return True
    
    def setup_ngrok_auth(self):
        """Configura o token de autenticação do ngrok"""
        authtoken = self.config.get('ngrok', {}).get('authtoken')
        if not authtoken or authtoken == "SEU_NGROK_AUTHTOKEN_AQUI":
            print("⚠️  Token do ngrok não configurado!")
            print("1. Acesse https://dashboard.ngrok.com/get-started/your-authtoken")
            print("2. Copie seu token de autenticação")
            print(f"3. Edite o arquivo {CONFIG_FILE} e substitua 'SEU_NGROK_AUTHTOKEN_AQUI' pelo seu token")
            
            # Tentar configurar interativamente
            token = input("Cole seu token do ngrok aqui (ou pressione Enter para pular): ").strip()
            if token:
                self.config['ngrok']['authtoken'] = token
                with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
                    json.dump(self.config, f, indent=2, ensure_ascii=False)
                print("✅ Token salvo no arquivo de configuração!")
            else:
                print("⚠️  Continuando sem configurar o token...")
                return False
        
        # Configurar token no ngrok
        try:
            result = subprocess.run(['ngrok', 'config', 'add-authtoken', authtoken], 
                                  capture_output=True, text=True, timeout=30)
            if result.returncode == 0:
                print("✅ Token do ngrok configurado!")
                return True
            else:
                print(f"⚠️  Erro ao configurar token: {result.stderr}")
                return False
        except subprocess.TimeoutExpired:
            print("⚠️  Timeout ao configurar token do ngrok")
            return False
    
    def start_flask(self):
        """Inicia o servidor Flask"""
        print("🚀 Iniciando servidor Flask...")
        
        flask_dir = self.project_root / FLASK_DIR
        flask_main = flask_dir / "src" / "main.py"
        
        # Configurar ambiente
        env = os.environ.copy()
        env['PYTHONPATH'] = str(flask_dir)
        env['FLASK_ENV'] = 'development'
        env['FLASK_DEBUG'] = '1'
        
        # Iniciar Flask
        try:
            self.flask_process = subprocess.Popen(
                [sys.executable, str(flask_main)],
                cwd=str(flask_dir),
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                universal_newlines=True,
                bufsize=1
            )
            
            # Aguardar Flask inicializar
            print("⏳ Aguardando Flask inicializar...")
            time.sleep(5)
            
            # Verificar se Flask está rodando
            if self.flask_process.poll() is None:
                print("✅ Flask iniciado com sucesso!")
                return True
            else:
                print("❌ Erro ao iniciar Flask!")
                return False
                
        except Exception as e:
            print(f"❌ Erro ao iniciar Flask: {e}")
            return False
    
    def start_ngrok(self):
        """Inicia o ngrok"""
        print("🌐 Iniciando ngrok...")
        
        port = self.config.get('flask', {}).get('port', 5000)
        region = self.config.get('ngrok', {}).get('region', 'us')
        
        try:
            # Iniciar ngrok
            self.ngrok_process = subprocess.Popen(
                ['ngrok', 'http', str(port), '--region', region],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                universal_newlines=True
            )
            
            # Aguardar ngrok inicializar
            print("⏳ Aguardando ngrok inicializar...")
            time.sleep(8)
            
            # Obter URL do ngrok
            ngrok_url = self.get_ngrok_url()
            if ngrok_url:
                print(f"✅ ngrok iniciado: {ngrok_url}")
                return ngrok_url
            else:
                print("❌ Erro ao obter URL do ngrok!")
                return None
                
        except Exception as e:
            print(f"❌ Erro ao iniciar ngrok: {e}")
            return None
    
    def get_ngrok_url(self):
        """Obtém a URL pública do ngrok"""
        try:
            # Tentar obter URL da API do ngrok
            response = requests.get('http://localhost:4040/api/tunnels', timeout=10)
            if response.status_code == 200:
                data = response.json()
                tunnels = data.get('tunnels', [])
                for tunnel in tunnels:
                    if tunnel.get('proto') == 'https':
                        return tunnel.get('public_url')
                    elif tunnel.get('proto') == 'http':
                        # Preferir HTTPS, mas aceitar HTTP se necessário
                        return tunnel.get('public_url').replace('http://', 'https://')
        except Exception as e:
            print(f"⚠️  Erro ao obter URL do ngrok: {e}")
        
        return None
    
    def update_frontend_api(self, ngrok_url):
        """Atualiza a URL da API no frontend"""
        print("🔄 Atualizando URL da API no frontend...")
        
        api_file = self.project_root / FRONTEND_API_FILE
        if not api_file.exists():
            print(f"❌ Arquivo da API não encontrado: {api_file}")
            return False
        
        try:
            # Ler arquivo atual
            with open(api_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Substituir URL
            lines = content.split('\n')
            updated = False
            
            for i, line in enumerate(lines):
                if 'API_BASE_URL' in line and '=' in line:
                    # Encontrar linha com API_BASE_URL
                    if 'let API_BASE_URL' in line or 'const API_BASE_URL' in line:
                        lines[i] = f"let API_BASE_URL = '{ngrok_url}/api';"
                        updated = True
                        break
            
            if updated:
                # Salvar arquivo atualizado
                with open(api_file, 'w', encoding='utf-8') as f:
                    f.write('\n'.join(lines))
                print(f"✅ URL da API atualizada: {ngrok_url}/api")
                return True
            else:
                print("⚠️  Não foi possível encontrar a linha API_BASE_URL para atualizar")
                return False
                
        except Exception as e:
            print(f"❌ Erro ao atualizar arquivo da API: {e}")
            return False
    
    def monitor_processes(self):
        """Monitora os processos Flask e ngrok"""
        print("👁️  Monitorando processos...")
        
        while True:
            try:
                # Verificar Flask
                if self.flask_process and self.flask_process.poll() is not None:
                    print("❌ Flask parou de funcionar!")
                    break
                
                # Verificar ngrok
                if self.ngrok_process and self.ngrok_process.poll() is not None:
                    print("❌ ngrok parou de funcionar!")
                    break
                
                # Aguardar antes da próxima verificação
                time.sleep(10)
                
            except KeyboardInterrupt:
                print("\n🛑 Interrompido pelo usuário")
                break
    
    def cleanup(self):
        """Limpa os processos"""
        print("🧹 Finalizando processos...")
        
        if self.flask_process:
            try:
                self.flask_process.terminate()
                self.flask_process.wait(timeout=5)
                print("✅ Flask finalizado")
            except:
                try:
                    self.flask_process.kill()
                    print("⚠️  Flask forçadamente finalizado")
                except:
                    pass
        
        if self.ngrok_process:
            try:
                self.ngrok_process.terminate()
                self.ngrok_process.wait(timeout=5)
                print("✅ ngrok finalizado")
            except:
                try:
                    self.ngrok_process.kill()
                    print("⚠️  ngrok forçadamente finalizado")
                except:
                    pass
    
    def run(self):
        """Executa o servidor completo"""
        print("🎯 Iniciando Sistema de Ordens de Marcenaria")
        print("=" * 50)
        
        try:
            # Verificar dependências
            if not self.check_dependencies():
                return False
            
            # Configurar ngrok
            if not self.setup_ngrok_auth():
                print("⚠️  Continuando sem token do ngrok...")
            
            # Iniciar Flask
            if not self.start_flask():
                return False
            
            # Iniciar ngrok
            ngrok_url = self.start_ngrok()
            if not ngrok_url:
                return False
            
            # Atualizar frontend
            if not self.update_frontend_api(ngrok_url):
                print("⚠️  Continuando sem atualizar o frontend...")
            
            print("\n" + "=" * 50)
            print("🎉 SISTEMA INICIADO COM SUCESSO!")
            print(f"🌐 URL Pública: {ngrok_url}")
            print(f"🏠 URL Local: http://localhost:{self.config.get('flask', {}).get('port', 5000)}")
            print("=" * 50)
            print("💡 Dicas:")
            print("- Use a URL pública para acessar de outros dispositivos")
            print("- O frontend no Vercel deve usar a URL pública")
            print("- Pressione Ctrl+C para parar o servidor")
            print("=" * 50)
            
            # Monitorar processos
            self.monitor_processes()
            
        except KeyboardInterrupt:
            print("\n🛑 Parando servidor...")
        except Exception as e:
            print(f"❌ Erro inesperado: {e}")
        finally:
            self.cleanup()
        
        return True

def main():
    """Função principal"""
    # Configurar handler para sinais
    def signal_handler(signum, frame):
        print("\n🛑 Recebido sinal de interrupção...")
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Executar servidor
    manager = ServerManager()
    success = manager.run()
    
    if success:
        print("✅ Servidor finalizado com sucesso!")
    else:
        print("❌ Erro ao executar servidor!")
        sys.exit(1)

if __name__ == "__main__":
    main()

