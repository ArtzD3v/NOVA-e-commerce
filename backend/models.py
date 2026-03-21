from typing import Optional, List
from pydantic import BaseModel, EmailStr

# ─── Product ───────────────────────────────────────────────────────────────

class ProductBase(BaseModel):
    id: str
    name: str
    description: Optional[str] = ""
    price: float
    original_price: float
    category: str
    image: Optional[str] = ""
    images: Optional[List[str]] = []
    rating: Optional[float] = 0.0
    reviews: Optional[int] = 0
    stock: Optional[int] = 0
    badge: Optional[str] = ""
    features: Optional[List[str]] = []

class ProductFilter(BaseModel):
    category: Optional[str] = None
    search: Optional[str] = None
    sort: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None

# ─── Auth ──────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    id: str
    name: str
    email: str

class TokenResponse(BaseModel):
    token: str
    user: UserOut

# ─── Cart ──────────────────────────────────────────────────────────────────

class AddToCartRequest(BaseModel):
    productId: str
    quantity: int = 1

class UpdateCartRequest(BaseModel):
    quantity: int

# ─── Orders ────────────────────────────────────────────────────────────────

class ShippingInfo(BaseModel):
    name: Optional[str] = ""
    address: Optional[str] = ""
    city: Optional[str] = ""
    state: Optional[str] = ""
    zip: Optional[str] = ""

class PaymentInfo(BaseModel):
    method: Optional[str] = "credit"
    cardNumber: Optional[str] = ""

class CreateOrderRequest(BaseModel):
    items: list
    shipping: Optional[ShippingInfo] = None
    payment: Optional[PaymentInfo] = None
    subtotal: float
    total: float
