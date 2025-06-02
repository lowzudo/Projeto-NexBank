import psycopg2
from psycopg2 import sql, errors
import random

def get_db_connection():
    """Estabelece conexão com o banco de dados"""
    conn = psycopg2.connect(
        host="localhost",
        database="NexBank",
        user="postgres",
        password="Vitinho07"
    )
    return conn


def criar_tabelas():
    """Cria as tabelas necessárias se não existirem"""
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        # Tabela de usuários
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

        # Tabela de contas
        cur.execute("""
            CREATE TABLE IF NOT EXISTS contas (
                id SERIAL PRIMARY KEY,
                usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
                numero_conta VARCHAR(20) UNIQUE NOT NULL,
                saldo NUMERIC(12, 2) DEFAULT 0.00
            )
        """)

        # Tabela de transações
        cur.execute("""
            CREATE TABLE IF NOT EXISTS transacoes (
                id SERIAL PRIMARY KEY,
                conta_origem_id INTEGER REFERENCES contas(id) ON DELETE SET NULL,
                conta_destino_id INTEGER REFERENCES contas(id) ON DELETE SET NULL,
                valor NUMERIC(12, 2) NOT NULL,
                tipo VARCHAR(50) NOT NULL,
                descricao VARCHAR(255),
                data_transacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        conn.commit()
        print("✅ Tabelas verificadas/criadas com sucesso")

    except Exception as e:
        print(f"🔥 Erro ao criar tabelas: {e}")
    finally:
        cur.close()
        conn.close()


def gerar_numero_conta():
    """Gera um número de conta fictício no formato 99999-9"""
    return f"{random.randint(10000, 99999)}-{random.randint(0,9)}"


def login(email, senha):
    """Autentica um usuário"""
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            "SELECT id, nome, CPF FROM usuarios WHERE email = %s AND senha = %s",
            (email, senha)
        )
        usuario = cur.fetchone()

        if usuario:
            return {
                "sucesso": True,
                "usuario": {
                    "id": usuario[0],
                    "nome": usuario[1],
                    "CPF": usuario[2]
                }
            }
        return {"sucesso": False, "mensagem": "Usuário ou senha inválidos."}

    except Exception as e:
        print(f"Erro no login: {e}")
        return {"sucesso": False, "mensagem": "Erro no servidor"}
    finally:
        cur.close()
        conn.close()


def registrar_usuario(email, senha, nome, CPF):
    """Registra um novo usuário e cria uma conta vinculada"""
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            "INSERT INTO usuarios (email, senha, nome, CPF) VALUES (%s, %s, %s, %s) RETURNING id",
            (email, senha, nome, CPF)
        )
        usuario_id = cur.fetchone()[0]

        # Gera número de conta único
        numero_conta = gerar_numero_conta()

        # Insere na tabela de contas
        cur.execute(
            "INSERT INTO contas (usuario_id, numero_conta) VALUES (%s, %s)",
            (usuario_id, numero_conta)
        )

        conn.commit()

        return {
            "sucesso": True,
            "mensagem": "Usuário e conta criados com sucesso"
        }

    except errors.UniqueViolation:
        conn.rollback()
        return {"sucesso": False, "mensagem": "Email já cadastrado"}

    except Exception as e:
        conn.rollback()
        print(f"🔥 Erro ao registrar usuário: {e}")
        return {"sucesso": False, "mensagem": "Erro no servidor"}

    finally:
        cur.close()
        conn.close()


# Cria as tabelas ao iniciar
criar_tabelas()
