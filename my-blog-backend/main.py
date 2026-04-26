'''
main.py

To run this application, enter `uvicorn main:app --reload --port 8000` in the terminal.
'''

from fastapi import FastAPI, Body, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from database import database, posts, comments, likes, users
from fastapi.responses import JSONResponse
from sqlalchemy import func, select, and_
from pydantic import BaseModel, EmailStr
import os
from dotenv import load_dotenv

# Login and registration
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta

app = FastAPI()

load_dotenv()  # Load environment variables from .env file

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ADMIN_SECRET_KEY = os.getenv("ADMIN_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7   # 7 day

# Stop server if secret keys are missing
if not JWT_SECRET_KEY or not ADMIN_SECRET_KEY:
    raise ValueError("FATAL: SECRET KEYS MISSING. Please set JWT_SECRET_KEY and ADMIN_SECRET_KEY in the .env file.  ")

class LikeRequest(BaseModel):
    user_name: str
    
class CommentRequest(BaseModel):
    author: str
    content: str = Body(..., min_length=1, max_length=1000)  # Ensure content is not empty and constrain its max length
    
class UserRegister(BaseModel):
    username: str = Body(..., min_length=3, max_length=50)  # Username constraints
    email: EmailStr
    password: str = Body(..., min_length=8)  # Password must be at least 8 characters long
    
class UserLogin(BaseModel):
    username: str
    password: str
    
class AdminLogin(BaseModel):
    admin_key: str
    
class TokenData(BaseModel):
    username: str | None = None
    role: str | None = None

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],    # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def success(data=None, msg="Success"):
    return {
        "code": 200,
        "msg": msg,
        "data": data
    }
    
def fail(msg="Error", code=400):
    return {
        "code": code,
        "msg": msg,
        "data": None
    }

def get_current_time() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

async def check_post_exists(post_id: int) -> bool:
    query = posts.select().where(posts.c.id == post_id).with_only_columns([posts.c.id])
    return await database.fetch_one(query) is not None

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

# Generating JWT token
def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username, role=role)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except JWTError:
        raise credentials_exception
    return token_data

@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

@app.get("/")
def read_root():
    return success(msg="Hello from fastAPI!")

@app.get("/api/posts")
async def get_posts():
    query = posts.select()
    return await database.fetch_all(query)

@app.get("/api/profile")
async def get_profile():
    total_posts = await database.fetch_val(select(func.count()).select_from(posts))
    total_likes = await database.fetch_val(select(func.sum(posts.c.likes_count))) or 0
    total_comments = await database.fetch_val(select(func.sum(posts.c.comment_count))) or 0

    return {
        "avatar": "/myAvatar.jpg",
        "name": "Johnny Wang",
        "motto": "Be unique, be yourself, be a monster!",
        "location": "Hangzhou, China",
        "posts": total_posts,
        "likes": total_likes,
        "comments": total_comments
    }
    
@app.get("/api/posts/{post_id}")
async def get_post_detail(post_id: int):
    query = posts.select().where(posts.c.id == post_id)
    return await database.fetch_one(query)
    
@app.get("/api/posts/{post_id}/like_status")
async def get_like_status(post_id: int, user_name: str = "anonymous"):
    # Check if the user has already liked the post
    check_query = likes.select().where(
        and_(
            likes.c.post_id == post_id,
            likes.c.user_name == user_name
        )
    )
    existing = await database.fetch_one(check_query)
    return success(data={"liked": existing is not None})

@app.get("/api/posts/{post_id}/likes")
async def get_likes(post_id: int):
    query = likes.select().where(likes.c.post_id == post_id).order_by(likes.c.created_at.asc())
    rows = await database.fetch_all(query)
    return success(data=[{"user_name": row["user_name"], "created_at": row["created_at"]} for row in rows])

@app.post("/api/posts/{post_id}/like")
async def toggle_like(
    post_id: int, 
    req: LikeRequest, 
    current_user: TokenData = Depends(get_current_user)
):
    user_name = current_user.username

    if not await check_post_exists(post_id):
        return fail(msg=f"Post {post_id} does not exist", code=404)
    
    check_query = likes.select().where(
        and_(
            likes.c.post_id == post_id,
            likes.c.user_name == user_name
        )
    )

    async with database.transaction():
        existing = await database.fetch_one(check_query)
        
        if existing:
            delete_query = likes.delete().where(likes.c.id == existing["id"])
            await database.execute(delete_query)

            update_query = posts.update().where(posts.c.id == post_id).values(
                likes_count=posts.c.likes_count - 1
            )
            await database.execute(update_query)
            liked = False
        else:
            now = get_current_time()
            insert_query = likes.insert().values(
                user_name=user_name,
                post_id=post_id,
                created_at=now
            )
            await database.execute(insert_query)

            update_query = posts.update().where(posts.c.id == post_id).values(
                likes_count=posts.c.likes_count + 1
            )
            await database.execute(update_query)
            liked = True

    count_query = select(posts.c.likes_count).where(posts.c.id == post_id)
    new_likes_count = await database.fetch_val(count_query)

    likers_query = likes.select().where(likes.c.post_id == post_id).order_by(likes.c.created_at.desc())
    likers_rows = await database.fetch_all(likers_query)
    likers = [{"user_name": row["user_name"], "created_at": row["created_at"]} for row in likers_rows]

    return success(data={
        "liked": liked,
        "likes_count": new_likes_count,
        "likers": likers
    })
    
# Get comments (no auth required)
@app.get("/api/posts/{post_id}/comments")
async def get_comments(post_id: int):
    query = comments.select().where(comments.c.post_id == post_id).order_by(comments.c.created_at.asc())
    return await database.fetch_all(query)

# Add comment (MUST login)
@app.post("/api/posts/{post_id}/comments")
async def add_comment(
    post_id: int,
    req: CommentRequest,
    current_user: TokenData = Depends(get_current_user)
):
    # Get username from token (cannot be faked)
    author = current_user.username

    now = get_current_time()
    query = comments.insert().values(
        post_id=post_id,
        author=author,
        content=req.content,
        created_at=now
    )
    await database.execute(query)

    update_query = posts.update().where(posts.c.id == post_id).values(
        comment_count=posts.c.comment_count + 1
    )
    await database.execute(update_query)

    return success(msg="Comment added")

@app.delete("/api/admin/posts/{post_id}")
async def admin_delete_post(
    post_id: int,
    current_user: TokenData = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    if not await check_post_exists(post_id):
        return fail(msg=f"Post {post_id} not found", code=404)

    async with database.transaction():
        delete_likes_query = likes.delete().where(likes.c.post_id == post_id)
        await database.execute(delete_likes_query)

        delete_post_query = posts.delete().where(posts.c.id == post_id)
        await database.execute(delete_post_query)

    return success(data={"deleted_post_id": post_id})

import re
def is_strong_password(password: str) -> bool:
    # 至少8位，包含大小写字母、数字、特殊字符
    return bool(re.match(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};:\\|,.<>/?]).{8,}$', password))

@app.post("/api/register")
async def register(user: UserRegister):
    username_exists = await database.fetch_one(
        users.select().where(users.c.username == user.username)
    )
    if username_exists:
        raise HTTPException(400, "Username already exists")

    email_exists = await database.fetch_one(
        users.select().where(users.c.email == user.email)
    )
    if email_exists:
        raise HTTPException(400, "Email already exists")

    if not is_strong_password(user.password):
        raise HTTPException(400, "Password must be at least 8 characters and include upper, lower, number, and special char")

    hashed_pw = pwd_context.hash(user.password)
    now = get_current_time()

    await database.execute(
        users.insert().values(
            username=user.username,
            email=user.email,
            hashed_password=hashed_pw,
            created_at=now,
            role="user"
        )
    )
    return {"code": 200, "msg": "Register success"}

from sqlalchemy import select
@app.post("/api/login")
async def login(user: UserLogin):
    # Query the user from the database (async)
    query = users.select().where(users.c.username == user.username)
    db_user = await database.fetch_one(query)
    if not db_user or not verify_password(user.password, db_user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    access_token = create_access_token(
        data={
            "sub": db_user["username"],
            "role": db_user["role"]
        },
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/admin/login")
async def admin_login(admin: AdminLogin):
    if admin.admin_key != ADMIN_SECRET_KEY:
        raise HTTPException(403, "Invalid admin key")
    # 只允许数据库中role为admin的用户登录
    query = users.select().where(users.c.role == "admin")
    db_admin = await database.fetch_one(query)
    if not db_admin:
        raise HTTPException(403, "No admin user found in database")
    token = jwt.encode(
        {"sub": db_admin["username"], "role": "admin"},
        JWT_SECRET_KEY, algorithm=ALGORITHM
    )
    return {"code": 200, "token": token, "username": db_admin["username"], "role": "admin"}

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content=fail(exc.detail, exc.status_code)
    )