import json
import uuid
from fastapi import APIRouter, Header, HTTPException
from models import CreateOrderRequest
from database import get_db

router = APIRouter()


def get_token(x_auth_token: str = None, authorization: str = None) -> str:
    if x_auth_token:
        return x_auth_token
    if authorization:
        parts = authorization.split()
        return parts[1] if len(parts) == 2 else authorization
    return "guest"


# POST /api/orders — create order
@router.post("", status_code=201)
def create_order(
    body: CreateOrderRequest,
    x_auth_token: str = Header(None),
    authorization: str = Header(None),
):
    token = get_token(x_auth_token, authorization)

    if not body.items:
        raise HTTPException(status_code=400, detail="Carrinho vazio")

    order_id = str(uuid.uuid4())
    payment_safe = {}
    if body.payment:
        payment_safe = {
            "method": body.payment.method,
            "last4": body.payment.cardNumber[-4:] if body.payment.cardNumber else "****"
        }

    with get_db() as conn:
        conn.execute("""
            INSERT INTO orders (id, user_token, items, shipping, payment, subtotal, total, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Confirmado')
        """, (
            order_id,
            token,
            json.dumps(body.items),
            json.dumps(body.shipping.dict() if body.shipping else {}),
            json.dumps(payment_safe),
            body.subtotal,
            body.total,
        ))

        # Clear the user's cart after placing order
        conn.execute("DELETE FROM cart_items WHERE user_token = ?", (token,))

        order = conn.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()

    return {
        "id": order["id"],
        "items": json.loads(order["items"]),
        "shipping": json.loads(order["shipping"]),
        "payment": json.loads(order["payment"]),
        "subtotal": order["subtotal"],
        "total": order["total"],
        "status": order["status"],
        "createdAt": order["created_at"],
    }


# GET /api/orders — list user orders
@router.get("")
def list_orders(
    x_auth_token: str = Header(None),
    authorization: str = Header(None),
):
    token = get_token(x_auth_token, authorization)
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM orders WHERE user_token = ? ORDER BY created_at DESC", (token,)
        ).fetchall()

    return [
        {
            "id": r["id"],
            "items": json.loads(r["items"]),
            "shipping": json.loads(r["shipping"]),
            "payment": json.loads(r["payment"]),
            "subtotal": r["subtotal"],
            "total": r["total"],
            "status": r["status"],
            "createdAt": r["created_at"],
        }
        for r in rows
    ]


# GET /api/orders/{order_id}
@router.get("/{order_id}")
def get_order(
    order_id: str,
    x_auth_token: str = Header(None),
    authorization: str = Header(None),
):
    token = get_token(x_auth_token, authorization)
    with get_db() as conn:
        row = conn.execute(
            "SELECT * FROM orders WHERE id = ? AND user_token = ?", (order_id, token)
        ).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")

    return {
        "id": row["id"],
        "items": json.loads(row["items"]),
        "shipping": json.loads(row["shipping"]),
        "payment": json.loads(row["payment"]),
        "subtotal": row["subtotal"],
        "total": row["total"],
        "status": row["status"],
        "createdAt": row["created_at"],
    }
