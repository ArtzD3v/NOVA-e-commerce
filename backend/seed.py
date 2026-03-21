"""
seed.py — Populates the SQLite database with products from products.json
Run once: python seed.py
Safe to run multiple times (uses INSERT OR IGNORE).
"""
import json
import sys
import os

# Allow running from any directory
sys.path.insert(0, os.path.dirname(__file__))

from database import init_db, get_db

PRODUCTS_JSON = os.path.join(
    os.path.dirname(__file__), "..", "server", "data", "products.json"
)

def seed():
    print("🌱 Seeding database...")
    init_db()

    with open(PRODUCTS_JSON, encoding="utf-8") as f:
        products = json.load(f)

    with get_db() as conn:
        count = 0
        for p in products:
            conn.execute("""
                INSERT OR IGNORE INTO products
                    (id, name, description, price, original_price, category,
                     image, images, rating, reviews, stock, badge, features)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                p["id"],
                p["name"],
                p.get("description", ""),
                p["price"],
                p.get("originalPrice", p["price"]),
                p["category"],
                p.get("image", ""),
                json.dumps(p.get("images", [])),
                p.get("rating", 0),
                p.get("reviews", 0),
                p.get("stock", 0),
                p.get("badge", ""),
                json.dumps(p.get("features", [])),
            ))
            count += 1

    print(f"✅ Inserted {count} products into the database.")

if __name__ == "__main__":
    seed()
