import os
import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Header
from jose import jwt, JWTError
from passlib.context import CryptContext
from dotenv import load_dotenv
from models import RegisterRequest, LoginRequest
from database import get_db

load_dotenv()

router = APIRouter()

SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 10080))

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(minutes=EXPIRE_MINUTES)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado")


# POST /api/auth/register
@router.post("/register", status_code=201)
def register(body: RegisterRequest):
    if not body.name or not body.email or not body.password:
        raise HTTPException(status_code=400, detail="Todos os campos são obrigatórios")

    with get_db() as conn:
        existing = conn.execute("SELECT id FROM users WHERE email = ?", (body.email,)).fetchone()
        if existing:
            raise HTTPException(status_code=409, detail="E-mail já cadastrado")

        user_id = str(uuid.uuid4())
        hashed = pwd_ctx.hash(body.password)
        conn.execute(
            "INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)",
            (user_id, body.name, body.email, hashed)
        )

    token = create_token({"sub": user_id, "email": body.email, "name": body.name})
    return {
        "token": token,
        "user": {"id": user_id, "name": body.name, "email": body.email}
    }


# POST /api/auth/login
@router.post("/login")
def login(body: LoginRequest):
    with get_db() as conn:
        user = conn.execute(
            "SELECT * FROM users WHERE email = ?", (body.email,)
        ).fetchone()

        if not user or not pwd_ctx.verify(body.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="E-mail ou senha inválidos")

        token = create_token({
            "sub": user["id"],
            "email": user["email"],
            "name": user["name"]
        })
        return {
            "token": token,
            "user": {"id": user["id"], "name": user["name"], "email": user["email"]}
        }


# GET /api/auth/me
@router.get("/me")
def me(authorization: str = Header(None), x_auth_token: str = Header(None)):
    raw_token = x_auth_token
    if not raw_token and authorization:
        # Support "Bearer <token>"
        parts = authorization.split()
        raw_token = parts[1] if len(parts) == 2 else authorization

    if not raw_token:
        raise HTTPException(status_code=401, detail="Token não fornecido")

    payload = decode_token(raw_token)
    return {
        "id": payload.get("sub"),
        "name": payload.get("name"),
        "email": payload.get("email")
    }
