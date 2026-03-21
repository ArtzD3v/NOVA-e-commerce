import json
import uuid
from fastapi import APIRouter, Header, HTTPException
from models import AddToCartRequest, UpdateCartRequest
from database import get_db

router = APIRouter()


def get_token(x_auth_token: str = None, authorization: str = None) -> str:
    if x_auth_token:
        return x_auth_token
    if authorization:
        parts = authorization.split()
        return parts[1] if len(parts) == 2 else authorization
    return "guest"


def calculate_totals(items: list) -> dict:
    subtotal = sum(i["price"] * i["quantity"] for i in items)
    shipping = 0 if subtotal > 299.90 else 29.90
    discount = sum((i.get("originalPrice", i["price"]) - i["price"]) * i["quantity"] for i in items)
    total = subtotal + shipping
    return {
        "subtotal": round(subtotal, 2),
        "shipping": round(shipping, 2),
        "discount": round(discount, 2),
        "total": round(total, 2),
        "itemCount": sum(i["quantity"] for i in items),
    }


def get_cart_items(conn, token: str) -> list:
    rows = conn.execute("""
        SELECT ci.id, ci.product_id AS productId, ci.quantity,
               p.name, p.price, p.original_price AS originalPrice,
               p.image
        FROM cart_items ci
        JOIN products p ON p.id = ci.product_id
        WHERE ci.user_token = ?
    """, (token,)).fetchall()
    return [dict(r) for r in rows]


# GET /api/cart
@router.get("")
def get_cart(
    x_auth_token: str = Header(None),
    authorization: str = Header(None)
):
    token = get_token(x_auth_token, authorization)
    with get_db() as conn:
        items = get_cart_items(conn, token)
    return {"items": items, **calculate_totals(items)}


# POST /api/cart — add item
@router.post("")
def add_to_cart(
    body: AddToCartRequest,
    x_auth_token: str = Header(None),
    authorization: str = Header(None),
):
    token = get_token(x_auth_token, authorization)
    with get_db() as conn:
        product = conn.execute("SELECT * FROM products WHERE id = ?", (body.productId,)).fetchone()
        if not product:
            raise HTTPException(status_code=404, detail="Produto não encontrado")

        existing = conn.execute(
            "SELECT id, quantity FROM cart_items WHERE user_token = ? AND product_id = ?",
            (token, body.productId)
        ).fetchone()

        if existing:
            conn.execute(
                "UPDATE cart_items SET quantity = quantity + ? WHERE id = ?",
                (body.quantity, existing["id"])
            )
        else:
            conn.execute(
                "INSERT INTO cart_items (id, user_token, product_id, quantity) VALUES (?, ?, ?, ?)",
                (str(uuid.uuid4()), token, body.productId, body.quantity)
            )

        items = get_cart_items(conn, token)
    return {"items": items, **calculate_totals(items)}


# PUT /api/cart/{item_id} — update quantity
@router.put("/{item_id}")
def update_cart_item(
    item_id: str,
    body: UpdateCartRequest,
    x_auth_token: str = Header(None),
    authorization: str = Header(None),
):
    token = get_token(x_auth_token, authorization)
    with get_db() as conn:
        item = conn.execute(
            "SELECT id FROM cart_items WHERE id = ? AND user_token = ?", (item_id, token)
        ).fetchone()
        if not item:
            raise HTTPException(status_code=404, detail="Item não encontrado no carrinho")

        if body.quantity <= 0:
            conn.execute("DELETE FROM cart_items WHERE id = ?", (item_id,))
        else:
            conn.execute("UPDATE cart_items SET quantity = ? WHERE id = ?", (body.quantity, item_id))

        items = get_cart_items(conn, token)
    return {"items": items, **calculate_totals(items)}


# DELETE /api/cart/{item_id} — remove item
@router.delete("/{item_id}")
def remove_cart_item(
    item_id: str,
    x_auth_token: str = Header(None),
    authorization: str = Header(None),
):
    token = get_token(x_auth_token, authorization)
    with get_db() as conn:
        conn.execute("DELETE FROM cart_items WHERE id = ? AND user_token = ?", (item_id, token))
        items = get_cart_items(conn, token)
    return {"items": items, **calculate_totals(items)}


# DELETE /api/cart — clear cart
@router.delete("")
def clear_cart(
    x_auth_token: str = Header(None),
    authorization: str = Header(None),
):
    token = get_token(x_auth_token, authorization)
    with get_db() as conn:
        conn.execute("DELETE FROM cart_items WHERE user_token = ?", (token,))
    return {"items": [], "subtotal": 0, "shipping": 0, "discount": 0, "total": 0, "itemCount": 0}
