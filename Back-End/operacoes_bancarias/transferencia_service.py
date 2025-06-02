from database import get_db_connection
from flask import Blueprint, jsonify, request
import traceback
from decimal import Decimal

transferencia_bp = Blueprint('transferencia', __name__)

@transferencia_bp.route('/api/transferencia', methods=['POST'])
def transferencia():
    dados = request.get_json()

    if not all(k in dados for k in ['conta_origem_id', 'conta_destino_numero', 'valor']):
        return jsonify({'sucesso': False, 'mensagem': 'Dados incompletos'}), 400

    try:
        conn = get_db_connection()
        cur = conn.cursor()


        cur.execute("SELECT id FROM contas WHERE numero_conta = %s", (dados['conta_destino_numero'],))
        conta_destino = cur.fetchone()

        if not conta_destino:
            return jsonify({'sucesso': False, 'mensagem': 'Conta destino não encontrada'}), 404

        conta_destino_id = conta_destino[0]

        valor = Decimal(str(dados['valor']))
        if valor <= 0:
            return jsonify({'sucesso': False, 'mensagem': 'Valor inválido'}), 400

        cur.execute("SELECT saldo FROM contas WHERE id = %s FOR UPDATE", (dados['conta_origem_id'],))
        saldo_atual = cur.fetchone()
        if not saldo_atual:
            return jsonify({'sucesso': False, 'mensagem': 'Conta origem não encontrada'}), 404

        saldo_atual = saldo_atual[0]
        if saldo_atual < valor:
            return jsonify({'sucesso': False, 'mensagem': 'Saldo insuficiente'}), 400

        cur.execute(
            "UPDATE contas SET saldo = saldo - %s WHERE id = %s RETURNING saldo",
            (valor, dados['conta_origem_id'])
        )
        novo_saldo_origem = cur.fetchone()[0]

        cur.execute(
            "UPDATE contas SET saldo = saldo + %s WHERE id = %s",
            (valor, conta_destino_id)
        )

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