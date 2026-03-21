import sqlite3
import os
from contextlib import contextmanager

DATABASE_PATH = os.path.join(os.path.dirname(__file__), ".data", "ecommerce.db")

def get_connection():
    os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

@contextmanager
def get_db():
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db():
    """Create all tables if they don't exist."""
    with get_db() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS products (
                id              TEXT PRIMARY KEY,
                name            TEXT NOT NULL,
                description     TEXT,
                price           REAL NOT NULL,
                original_price  REAL NOT NULL,
                category        TEXT NOT NULL,
                image           TEXT,
                images          TEXT DEFAULT '[]',
                rating          REAL DEFAULT 0,
                reviews         INTEGER DEFAULT 0,
                stock           INTEGER DEFAULT 0,
                badge           TEXT DEFAULT '',
                features        TEXT DEFAULT '[]',
                created_at      TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS users (
                id              TEXT PRIMARY KEY,
                name            TEXT NOT NULL,
                email           TEXT UNIQUE NOT NULL,
                password_hash   TEXT NOT NULL,
                created_at      TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS cart_items (
                id          TEXT PRIMARY KEY,
                user_token  TEXT NOT NULL,
                product_id  TEXT NOT NULL,
                quantity    INTEGER NOT NULL DEFAULT 1,
                added_at    TEXT DEFAULT (datetime('now')),
                FOREIGN KEY (product_id) REFERENCES products(id)
            );

            CREATE TABLE IF NOT EXISTS orders (
                id          TEXT PRIMARY KEY,
                user_token  TEXT NOT NULL,
                items       TEXT NOT NULL,
                shipping    TEXT DEFAULT '{}',
                payment     TEXT DEFAULT '{}',
                subtotal    REAL NOT NULL,
                total       REAL NOT NULL,
                status      TEXT DEFAULT 'Confirmado',
                created_at  TEXT DEFAULT (datetime('now'))
            );

            CREATE INDEX IF NOT EXISTS idx_cart_token ON cart_items(user_token);
            CREATE INDEX IF NOT EXISTS idx_orders_token ON orders(user_token);
            CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
        """)
    print("✅ Database initialized at", DATABASE_PATH)
