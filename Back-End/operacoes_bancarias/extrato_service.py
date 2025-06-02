from flask import Blueprint, jsonify
from database import get_db_connection 

extrato_bp = Blueprint('extrato', __name__)

@extrato_bp.route('/api/extrato/<int:conta_id>', methods=['GET'])
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
