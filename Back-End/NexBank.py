from flask import Flask, jsonify, request
from flask_cors import CORS
import psycopg2
from psycopg2 import sql
import os
import auth_service as auth_services
from decimal import Decimal
import sys
import traceback

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

def get_db_connection():
    try:
        conn = psycopg2.connect(
            host="localhost",
            database="NexBank",
            user="postgres",
            password="Vitinho07"
        )
        return conn
    except Exception as e:
        print(f"⚠️ Erro ao conectar ao banco: {e}", file=sys.stderr)
        raise


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
        
        # Validação básica de email
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


@app.route('/api/deposito', methods=['POST'])
def deposito():
    dados = request.get_json()
    
    if not all(k in dados for k in ['conta_id', 'valor']):
        return jsonify({'sucesso': False, 'mensagem': 'Dados incompletos'}), 400
    
    try:
        valor = Decimal(str(dados['valor']))
        if valor <= 0:
            return jsonify({'sucesso': False, 'mensagem': 'Valor inválido'}), 400
            
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute(
            "UPDATE contas SET saldo = saldo + %s WHERE id = %s RETURNING saldo",
            (valor, dados['conta_id'])
        )
        
        novo_saldo = cur.fetchone()[0]
        
        cur.execute(
            """INSERT INTO transacoes 
                (conta_origem_id, valor, tipo, descricao)
                VALUES (%s, %s, 'deposito', 'Depósito em conta')""",
            (dados['conta_id'], valor)
        )
        
        conn.commit()
        return jsonify({
            'sucesso': True,
            'mensagem': 'Depósito realizado com sucesso',
            'novo_saldo': float(novo_saldo)
        })
        
    except Exception as e:
        conn.rollback()
        print(f"Erro no depósito: {e}")
        return jsonify({'sucesso': False, 'mensagem': 'Erro no servidor'}), 500
    finally:
        cur.close()
        conn.close()

@app.route('/api/saque', methods=['POST'])
def saque():
    dados = request.get_json()
    
    if not all(k in dados for k in ['conta_id', 'valor']):
        return jsonify({'sucesso': False, 'mensagem': 'Dados incompletos'}), 400
    
    try:
        valor = Decimal(str(dados['valor']))
        if valor <= 0:
            return jsonify({'sucesso': False, 'mensagem': 'Valor inválido'}), 400
            
        conn = get_db_connection()
        cur = conn.cursor()
        

        cur.execute("SELECT saldo FROM contas WHERE id = %s FOR UPDATE", (dados['conta_id'],))
        saldo_atual = cur.fetchone()[0]
        
        if saldo_atual < valor:
            return jsonify({'sucesso': False, 'mensagem': 'Saldo insuficiente'}), 400
            

        cur.execute(
            "UPDATE contas SET saldo = saldo - %s WHERE id = %s RETURNING saldo",
            (valor, dados['conta_id'])
        )
        
        novo_saldo = cur.fetchone()[0]
        

        cur.execute(
            """INSERT INTO transacoes 
                (conta_origem_id, valor, tipo, descricao)
                VALUES (%s, %s, 'saque', 'Saque em conta')""",
            (dados['conta_id'], valor)
        )
        
        conn.commit()
        return jsonify({
            'sucesso': True,
            'mensagem': 'Saque realizado com sucesso',
            'novo_saldo': float(novo_saldo)
        })
        
    except Exception as e:
        conn.rollback()
        print(f"Erro no saque: {e}")
        return jsonify({'sucesso': False, 'mensagem': 'Erro no servidor'}), 500
    finally:
        cur.close()
        conn.close()

from decimal import Decimal
import traceback
from flask import request, jsonify

@app.route('/api/transferencia', methods=['POST'])
def transferencia():
    dados = request.get_json()

    if not all(k in dados for k in ['conta_origem_id', 'conta_destino_numero', 'valor']):
        return jsonify({'sucesso': False, 'mensagem': 'Dados incompletos'}), 400

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Busca o id da conta destino pelo número da conta
        cur.execute("SELECT id FROM contas WHERE numero_conta = %s", (dados['conta_destino_numero'],))
        conta_destino = cur.fetchone()

        if not conta_destino:
            return jsonify({'sucesso': False, 'mensagem': 'Conta destino não encontrada'}), 404

        conta_destino_id = conta_destino[0]

        valor = Decimal(str(dados['valor']))
        if valor <= 0:
            return jsonify({'sucesso': False, 'mensagem': 'Valor inválido'}), 400

        # Busca saldo da conta origem com lock para evitar race condition
        cur.execute("SELECT saldo FROM contas WHERE id = %s FOR UPDATE", (dados['conta_origem_id'],))
        saldo_atual = cur.fetchone()
        if not saldo_atual:
            return jsonify({'sucesso': False, 'mensagem': 'Conta origem não encontrada'}), 404

        saldo_atual = saldo_atual[0]
        if saldo_atual < valor:
            return jsonify({'sucesso': False, 'mensagem': 'Saldo insuficiente'}), 400

        # Debita da conta origem
        cur.execute(
            "UPDATE contas SET saldo = saldo - %s WHERE id = %s RETURNING saldo",
            (valor, dados['conta_origem_id'])
        )
        novo_saldo_origem = cur.fetchone()[0]

        # Credita na conta destino
        cur.execute(
            "UPDATE contas SET saldo = saldo + %s WHERE id = %s",
            (valor, conta_destino_id)
        )

        # Insere transação
        cur.execute(
            """INSERT INTO transacoes 
                (conta_origem_id, conta_destino_id, valor, tipo, descricao)
                VALUES (%s, %s, %s, 'transferencia', 'Transferência entre contas')""",
            (dados['conta_origem_id'], conta_destino_id, valor)
        )

        conn.commit()

        return jsonify({
            'sucesso': True,
            'mensagem': 'Transferência realizada com sucesso',
            'novo_saldo': float(novo_saldo_origem)
        })

    except Exception as e:
        conn.rollback()
        print(f"Erro na transferência: {e}")
        traceback.print_exc()
        return jsonify({'sucesso': False, 'mensagem': 'Erro no servidor'}), 500

    finally:
        cur.close()
        conn.close()



@app.route('/api/extrato/<int:conta_id>', methods=['GET'])
def extrato(conta_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT t.id, t.tipo, t.valor, t.data_transacao,
                    co.numero_conta as conta_origem,
                    cd.numero_conta as conta_destino,
                    t.descricao
            FROM transacoes t
            LEFT JOIN contas co ON t.conta_origem_id = co.id
            LEFT JOIN contas cd ON t.conta_destino_id = cd.id
            WHERE t.conta_origem_id = %s OR t.conta_destino_id = %s
            ORDER BY t.data_transacao DESC
            LIMIT 20
        """, (conta_id, conta_id))
        
        transacoes = []
        for t in cur.fetchall():
            transacoes.append({
                'id': t[0],
                'tipo': t[1],
                'valor': float(t[2]),
                'data': t[3].isoformat(),
                'conta_origem': t[4],
                'conta_destino': t[5],
                'descricao': t[6]
            })
        
        return jsonify({
            'sucesso': True,
            'transacoes': transacoes
        })
        
    except Exception as e:
        print(f"Erro ao obter extrato: {e}")
        return jsonify({'sucesso': False, 'mensagem': 'Erro no servidor'}), 500
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    try:
        # Verificação de conexão com o banco ao iniciar
        conn = get_db_connection()
        conn.close()
        print("✅ Banco de dados conectado com sucesso!")
    except Exception as e:
        print(f"❌ Falha crítica ao conectar ao banco: {e}", file=sys.stderr)
        sys.exit(1)
    
    app.run(port=5000, debug=True)