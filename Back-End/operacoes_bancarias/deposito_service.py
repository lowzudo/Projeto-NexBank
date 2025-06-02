from database import get_db_connection
from flask import Blueprint, jsonify,request
from decimal import Decimal

deposito_bp = Blueprint('deposito', __name__)

@deposito_bp.route('/api/deposito', methods=['POST'])
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