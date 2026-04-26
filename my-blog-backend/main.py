'''
main.py

To run this application, enter `uvicorn main:app --reload --port 8000` in the terminal.
'''

from fastapi import FastAPI, Body, HTTPException, Depends, status, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from database import database, posts, comments, likes, users
from fastapi.responses import JSONResponse
from sqlalchemy import func, select, and_
from pydantic import BaseModel, EmailStr
import os
import uuid
from dotenv import load_dotenv

# Email verification
import yagmail
import secrets

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
    
class CommentRequest(BaseModel):
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
    query = posts.select().where(posts.c.id == post_id).with_only_columns(posts.c.id)
    return await database.fetch_one(query) is not None

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

# Generating JWT token
def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    jti = str(uuid.uuid4())
    to_encode.update({"jti": jti})
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(request: Request):
    token = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]

    if not token:
        token = request.cookies.get("access_token")

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
    )
    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    if username == "admin":
        return TokenData(username=username, role=role)

    user_row = await database.fetch_one(users.select().where(users.c.username == username))
    if not user_row:
        raise credentials_exception

    return TokenData(username=username, role=role)

def send_verify_email(to_email: str, token: str):
    sender_email = os.getenv("SENDER_EMAIL")
    sender_auth_code = os.getenv("SENDER_AUTH_CODE")
    
    if not sender_email or not sender_auth_code:
        print("WARNING: Email credentials not set. Skipping email sending.")
        return
    
    verify_url = f"http://localhost:8000/verify-email?token={token}"
    
    yag = yagmail.SMTP(
        user=sender_email,
        password=sender_auth_code,
        host='smtp.163.com',
        port=465,
        smtps_ssl=True
    )
    
    subject = "Please verify your email for My Blog"
    content = f"""
<div style="max-width:560px; margin:30px auto; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; border:1px solid #eee; border-radius:8px; overflow:hidden;">
    <div style="padding:28px 32px; background:#333333; text-align:center;">
        <h2 style="color:#fff; margin:0; font-weight:500; font-size:20px;">Account Activation</h2>
    </div>
    <div style="padding:40px 36px; background:#ffffff;">
        <p style="font-size:15px; color:#333; line-height:1.6; margin:0 0 16px 0;">Hello,</p>
        <p style="font-size:15px; color:#333; line-height:1.6; margin:0 0 28px 0;">Please click the button below to activate your blog account.</p>
        
        <div style="text-align:center; margin:36px 0;">
            <a href="{verify_url}" 
               style="display:inline-block; padding:13px 28px; background:#444444; color:#fff; 
                      border-radius:6px; text-decoration:none; font-size:15px; font-weight:500;">
                Activate Account
            </a>
        </div>

        <p style="font-size:13px; color:#666; margin-bottom:8px;">If the button doesn't work, copy and open this link:</p>
        <p style="font-size:13px; color:#555; background:#f7f7f7; padding:12px; border-radius:6px; word-break:break-all;">{verify_url}</p>
        
        <p style="font-size:13px; color:#999; margin-top:24px;">This link is valid for 15 minutes.</p>
    </div>
    <div style="padding:22px; text-align:center; font-size:12px; color:#aaa; background:#f9f9f9;">
        This is an automated message, please do not reply.
    </div>
</div>
    """
    
    yag.send(to=to_email, subject=subject, contents=content)

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
    data = await database.fetch_all(query)
    return success(data=data)

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
    data = await database.fetch_one(query)
    return success(data=data)
    
@app.get("/api/posts/{post_id}/like_status")
async def get_like_status(post_id: int, current_user: TokenData = Depends(get_current_user)):
    # 只允许查询自己的点赞状态，防止枚举攻击
    user_name = current_user.username
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

# 移除不需要的 LikeRequest，直接从 token 取用户
@app.post("/api/posts/{post_id}/like")
async def toggle_like(
    post_id: int, 
    current_user: TokenData = Depends(get_current_user)
):
    # 从 token 中获取用户名（绝对安全）
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
    data = await database.fetch_all(query)
    return success(data=data)

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
    username_exists = await database.fetch_one(users.select().where(users.c.username == user.username))
    if username_exists:
        raise HTTPException(status_code=400, detail="Username already exists")

    email_exists = await database.fetch_one(users.select().where(users.c.email == user.email))
    if email_exists:
        raise HTTPException(status_code=400, detail="Email already exists")

    if not is_strong_password(user.password):
        raise HTTPException(status_code=400, detail="Password is not strong enough")

    hashed_pw = get_password_hash(user.password)
    verify_token = secrets.token_urlsafe(32)

    query = users.insert().values(
        username=user.username,
        email=user.email,
        hashed_password=hashed_pw,
        is_verified=False,
        verify_token=verify_token,
        created_at=datetime.now(),
        role="user"
    )

    await database.execute(query)
    send_verify_email(user.email, verify_token)

    return {"code": 200, "msg": "Register successful. Please check your email to verify your account."}

@app.get("/api/verify-email")
async def verify_email(token: str):
    user = await database.fetch_one(users.select().where(users.c.verify_token == token))
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification link")

    await database.execute(
        users.update()
            .where(users.c.verify_token == token)
            .values(is_verified=True, verify_token=None)
    )
    return {"msg": "Verification successful! You can now log in."}

@app.post("/api/login")
async def login(user: UserLogin, response: Response):
    # 使用数据库查询 users 表
    query = users.select().where(users.c.username == user.username)
    row = await database.fetch_one(query)
    if not row or not verify_password(user.password, row["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    # 未激活邮箱禁止登录
    if not row["is_verified"]:
        raise HTTPException(status_code=400, detail="Please verify your email before login")

    access_token = create_access_token(
        data={"sub": row["username"], "role": row["role"]},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    # 在开发环境（localhost）允许 secure=False，生产部署时务必设为 True
    secure_flag = os.getenv("ENV", "development") == "production"

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=secure_flag,        # production: True
        samesite="Lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
    )

    # 兼容旧客户端：仍返回 token 在 JSON（可选）；前端默认不再存储
    return {"code": 200, "access_token": access_token, "token_type": "bearer"}

@app.post("/api/admin/login")
async def admin_login(admin: AdminLogin, response: Response):
    if admin.admin_key != ADMIN_SECRET_KEY:
        raise HTTPException(status_code=403, detail="Invalid admin key")

    token = create_access_token(
        data={"sub": "admin", "role": "admin"},
        expires_delta=timedelta(hours=1)
    )

    secure_flag = os.getenv("ENV", "development") == "production"
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=secure_flag,
        samesite="Lax",
        max_age=60 * 60 * 10,  # 10 hour
        path="/"
    )

    return {"code": 200, "token": token, "username": "admin", "role": "admin"}

# Logout by clearing the cookie
@app.post("/api/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"code": 200, "msg": "Logged out"}

@app.get("/api/me")
async def me(current_user: TokenData = Depends(get_current_user)):
    # current_user 是 TokenData(username, role)
    return success(data={"username": current_user.username, "role": current_user.role})

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content=fail(exc.detail, exc.status_code)
    )