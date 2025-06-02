import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    """Estabelece conexão com o banco de dados"""
    conn = psycopg2.connect(
        host="localhost",
        database="NexBank",
        user="postgres",
        password="Vitinho07"
    )
    return conn