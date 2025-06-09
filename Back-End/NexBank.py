from flask import Flask, jsonify, request
from flask_cors import CORS
import sys

from database import get_db_connection
import auth_service as auth_services

from operacoes_bancarias.transferencia_service import transferencia_bp
from operacoes_bancarias.deposito_service import deposito_bp
from operacoes_bancarias.saque_service import saque_bp
from operacoes_bancarias.extrato_service import extrato_bp
from operacoes_bancarias.pix_service import pix_bp

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

app.register_blueprint(extrato_bp)
app.register_blueprint(transferencia_bp)
app.register_blueprint(deposito_bp)
app.register_blueprint(saque_bp)
app.register_blueprint(pix_bp)


@app.route('/api/login', methods=['POST'])
def login_route():
    try:
        dados = request.get_json()
        if not dados or "email" not in dados or "senha" not in dados:
            return jsonify({'sucesso': False, 'mensagem': 'Credenciais não fornecidas'}), 400
        
        resposta = auth_services.login(dados['email'], dados['senha'])
        
        # Log para depuração
        print(f"🔑 Tentativa de login: {dados['email']} - {'Sucesso' if resposta['sucesso'] else 'Falha'}")
        
        return jsonify(resposta)
    
    except Exception as e:
        print(f"🔥 Erro crítico no login: {e}", file=sys.stderr)
        return jsonify({'sucesso': False, 'mensagem': 'Erro interno no servidor'}), 500

@app.route('/api/cadastrar', methods=['POST'])
def cadastro():
    try:
        dados = request.get_json()
        campos_obrigatorios = ['email', 'senha', 'nome', 'CPF']
        
        if not all(k in dados for k in campos_obrigatorios):
            missing = [k for k in campos_obrigatorios if k not in dados]
            return jsonify({
                'sucesso': False,
                'mensagem': f'Dados incompletos. Faltando: {", ".join(missing)}'
            }), 400
        
        if '@' not in dados['email']:
            return jsonify({'sucesso': False, 'mensagem': 'Email inválido'}), 400
            
        return auth_services.registrar_usuario(
            dados['email'],
            dados['senha'],
            dados['nome'],
            dados['CPF']
        )
        
    except Exception as e:
        print(f"🔥 Erro no cadastro: {e}", file=sys.stderr)
        return jsonify({'sucesso': False, 'mensagem': 'Erro no servidor'}), 500


@app.route('/api/conta/<int:usuario_id>', methods=['GET'])
def obter_conta(usuario_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT c.id, c.numero_conta as numero, c.saldo, u.nome
            FROM contas c
            JOIN usuarios u ON c.usuario_id = u.id
            WHERE u.id = %s
        """, (usuario_id,))
        
        conta = cur.fetchone()
        
        if conta:
            return jsonify({
                'sucesso': True,
                'conta': {
                    'id': conta[0],
                    'numero': conta[1],
                    'saldo': float(conta[2]),
                    'titular': conta[3]
                }
            })
        return jsonify({'sucesso': False, 'mensagem': 'Conta não encontrada'}), 404
        
    except Exception as e:
        print(f"Erro ao obter conta: {e}")
        return jsonify({'sucesso': False, 'mensagem': 'Erro no servidor'}), 500
    finally:
        cur.close()
        conn.close()

if __name__ == '__main__':
    app.run(port=5000, debug=True)
