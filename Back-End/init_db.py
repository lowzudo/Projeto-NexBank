import psycopg2
from psycopg2 import sql

print("🚀 O script iniciou!")

def init_db():
    try:
        conn = psycopg2.connect(
            host="localhost",
            database="NexBank",
            user="postgres",
            password="Vitinho07"
        )
        cur = conn.cursor()
        
        cur.execute("""
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                senha VARCHAR(255) NOT NULL,
                nome VARCHAR(255) NOT NULL,
                CPF VARCHAR(50) NOT NULL,
                data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        cur.execute("""
            CREATE TABLE IF NOT EXISTS contas (
                id SERIAL PRIMARY KEY,
                usuario_id INTEGER REFERENCES usuarios(id),
                saldo DECIMAL(15, 2) DEFAULT 0.00,
                numero_conta VARCHAR(20) UNIQUE NOT NULL,
                data_abertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        cur.execute("""
            CREATE TABLE IF NOT EXISTS transacoes (
                id SERIAL PRIMARY KEY,
                conta_origem_id INTEGER REFERENCES contas(id),
                conta_destino_id INTEGER REFERENCES contas(id),
                valor DECIMAL(15, 2) NOT NULL,
                tipo VARCHAR(50) NOT NULL,  -- 'deposito', 'saque', 'transferencia'
                descricao TEXT,
                data_transacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        cur.execute(
            "INSERT INTO usuarios (email, senha, nome, CPF) VALUES (%s, %s, %s, %s) ON CONFLICT (email) DO NOTHING RETURNING id",
            ("cliente@nexbank.com", "123456", "Cliente NexBank", "0001-1")
        )
        
        usuario_id = cur.fetchone()
        if usuario_id:
            usuario_id = usuario_id[0]
            
            cur.execute(
                "INSERT INTO contas (usuario_id, saldo, numero_conta) VALUES (%s, %s, %s) ON CONFLICT (numero_conta) DO NOTHING",
                (usuario_id, 1000.00, "0001")  
            )
            print("✅ Banco inicializado: Tabelas criadas e usuário padrão com conta adicionado!")
        
        conn.commit()
        
    except Exception as e:
        print(f"❌ Erro: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    init_db()
