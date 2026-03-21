import json
from typing import Optional
from fastapi import APIRouter, Query, HTTPException
from database import get_db

router = APIRouter()

def row_to_product(row):
    d = dict(row)
    d["images"] = json.loads(d.get("images") or "[]")
    d["features"] = json.loads(d.get("features") or "[]")
    d["originalPrice"] = d.pop("original_price")
    return d

# GET /api/products
@router.get("")
def list_products(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort: Optional[str] = Query(None),
    minPrice: Optional[float] = Query(None),
    maxPrice: Optional[float] = Query(None),
):
    with get_db() as conn:
        query = "SELECT * FROM products WHERE 1=1"
        params = []

        if category and category != "Todos":
            query += " AND category = ?"
            params.append(category)

        if search:
            query += " AND (LOWER(name) LIKE ? OR LOWER(description) LIKE ?)"
            q = f"%{search.lower()}%"
            params.extend([q, q])

        if minPrice is not None:
            query += " AND price >= ?"
            params.append(minPrice)

        if maxPrice is not None:
            query += " AND price <= ?"
            params.append(maxPrice)

        sort_map = {
            "price-asc": "price ASC",
            "price-desc": "price DESC",
            "rating": "rating DESC",
            "name": "name ASC",
        }
        if sort and sort in sort_map:
            query += f" ORDER BY {sort_map[sort]}"

        rows = conn.execute(query, params).fetchall()
        products = [row_to_product(r) for r in rows]
        return {"total": len(products), "products": products}


# GET /api/products/categories
@router.get("/categories")
def list_categories():
    with get_db() as conn:
        rows = conn.execute("SELECT DISTINCT category FROM products ORDER BY category").fetchall()
        return [r["category"] for r in rows]


# GET /api/products/{product_id}
@router.get("/{product_id}")
def get_product(product_id: str):
    with get_db() as conn:
        row = conn.execute("SELECT * FROM products WHERE id = ?", (product_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Produto não encontrado")

        product = row_to_product(row)
        related_rows = conn.execute(
            "SELECT * FROM products WHERE category = ? AND id != ? LIMIT 4",
            (product["category"], product_id)
        ).fetchall()
        related = [row_to_product(r) for r in related_rows]

        return {"product": product, "related": related}
