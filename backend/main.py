import os
import sys
from pathlib import Path

# Allow running from any directory
sys.path.insert(0, str(Path(__file__).parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import init_db
from routes import products, auth, cart, orders

app = FastAPI(
    title="NOVA E-commerce API",
    description="Backend API para o e-commerce NOVA. Documentação interativa disponível abaixo.",
    version="1.0.0",
)

# CORS — allow requests from the frontend (file:// and localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
def startup():
    init_db()

# API routes
app.include_router(products.router, prefix="/api/products", tags=["Produtos"])
app.include_router(auth.router,     prefix="/api/auth",     tags=["Autenticação"])
app.include_router(cart.router,     prefix="/api/cart",     tags=["Carrinho"])
app.include_router(orders.router,   prefix="/api/orders",   tags=["Pedidos"])

# Serve the frontend static files
client_dir = Path(__file__).parent.parent / "client"
if client_dir.exists():
    app.mount("/", StaticFiles(directory=str(client_dir), html=True), name="static")

@app.get("/api")
def root():
    return {"message": "🚀 NOVA E-commerce API está rodando!", "docs": "/docs"}
