from database import get_db_connection
from flask import Blueprint, jsonify, request
from decimal import Decimal

pix_bp = Blueprint('pix', __name__)

VALID_TIPOS_CHAVE = {'cpf', 'email', 'telefone', 'aleatoria'} 


@pix_bp.route('/api/pix', methods=['POST'])
def pix():
    dados = request.get_json()

    if not all(k in dados for k in ['conta_origem_id', 'chave_destino', 'valor']):
        return jsonify({'sucesso': False, 'mensagem': 'Dados incompletos'}), 400

    conta_origem_id = dados['conta_origem_id']
    chave_destino = dados['chave_destino']
    
    try:
        valor = Decimal(str(dados['valor']))
    except:
        return jsonify({'sucesso': False, 'mensagem': 'Valor inválido'}), 400
    
    descricao = dados.get('descricao', '')

    if valor <= 0:
        return jsonify({'sucesso': False, 'mensagem': 'Valor deve ser positivo'}), 400

    conn = get_db_connection()
    cur = conn.cursor()

    try:    
        cur.execute("SELECT saldo FROM contas WHERE id = %s", (conta_origem_id,))
        resultado = cur.fetchone()
        if not resultado:
            return jsonify({'sucesso': False, 'mensagem': 'Conta de origem não encontrada'}), 404

        saldo_origem = resultado[0]
        if saldo_origem < valor:
            return jsonify({'sucesso': False, 'mensagem': 'Saldo insuficiente'}), 400


        cur.execute("SELECT conta_id FROM chaves_pix WHERE chave = %s", (chave_destino,))
        destino = cur.fetchone()
        if not destino:
            return jsonify({'sucesso': False, 'mensagem': 'Chave Pix não encontrada'}), 404

        conta_destino_id = destino[0]


        cur.execute("UPDATE contas SET saldo = saldo - %s WHERE id = %s", (valor, conta_origem_id))
        cur.execute("UPDATE contas SET saldo = saldo + %s WHERE id = %s", (valor, conta_destino_id))

        cur.execute("""
            INSERT INTO pix (conta_origem_id, chave_destino, valor, descricao)
            VALUES (%s, %s, %s, %s)
        """, (conta_origem_id, chave_destino, valor, descricao))

        cur.execute("""
            INSERT INTO transacoes (conta_origem_id, conta_destino_id, valor, tipo, descricao)
            VALUES (%s, %s, %s, %s, %s)
        """, (conta_origem_id, conta_destino_id, valor, 'transferencia', descricao or 'Pix'))


        cur.execute("SELECT saldo FROM contas WHERE id = %s", (conta_origem_id,))
        novo_saldo = cur.fetchone()[0]

        conn.commit()

        return jsonify({
            'sucesso': True,
            'mensagem': 'Pix realizado com sucesso',
            'novo_saldo': float(novo_saldo)
        }), 200

    except Exception as e:
        conn.rollback()
        print(f"Erro no Pix: {e}")
        return jsonify({'sucesso': False, 'mensagem': 'Erro interno no servidor'}), 500

    finally:
        cur.close()
        conn.close()


@pix_bp.route('/api/chaves_pix', methods=['POST'])
def cadastrar_chave_pix():
    dados = request.get_json()

    if not all(k in dados for k in ('numero_conta', 'tipo_chave', 'chave')):
        return jsonify({'sucesso': False, 'mensagem': 'Dados incompletos'}), 400

    numero_conta = dados['numero_conta']
    tipo_chave = dados['tipo_chave'].lower()
    chave = dados['chave']

    if tipo_chave not in VALID_TIPOS_CHAVE:
        return jsonify({'sucesso': False, 'mensagem': f'Tipo de chave inválido. Tipos aceitos: {", ".join(VALID_TIPOS_CHAVE)}'}), 400

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute("SELECT id FROM contas WHERE numero_conta = %s", (numero_conta,))
        conta = cur.fetchone()
        if not conta:
            return jsonify({'sucesso': False, 'mensagem': 'Conta não encontrada'}), 404

        conta_id = conta[0]

        cur.execute("SELECT id FROM chaves_pix WHERE chave = %s", (chave,))
        if cur.fetchone():
            return jsonify({'sucesso': False, 'mensagem': 'Chave Pix já cadastrada'}), 409

        cur.execute("""
            INSERT INTO chaves_pix (conta_id, tipo_chave, chave)
            VALUES (%s, %s, %s)
        """, (conta_id, tipo_chave, chave))

        conn.commit()
        return jsonify({'sucesso': True, 'mensagem': 'Chave Pix cadastrada com sucesso'}), 201

    except Exception as e:
        conn.rollback()
        print(f"Erro ao cadastrar chave Pix: {e}")
        return jsonify({'sucesso': False, 'mensagem': 'Erro interno no servidor'}), 500

    finally:
        cur.close()
        conn.close()
