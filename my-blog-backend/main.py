'''
main.py
'''

from fastapi import FastAPI, Body, HTTPException, Depends, status, Request, Response, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from fastapi.staticfiles import StaticFiles
from database import database, posts, comments, likes, users, projects_table, post_images, messages, song_config, deepseek_usage
from fastapi.responses import JSONResponse, FileResponse, RedirectResponse
from sqlalchemy import func, select, and_, desc, or_
from pydantic import BaseModel, EmailStr
import os
import shutil
import uuid
import time
from dotenv import load_dotenv, find_dotenv
from datetime import datetime, timedelta, timezone

dotenv_path = find_dotenv() or '/app/.env'
load_dotenv(dotenv_path)

import secrets
import re
import requests

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Email verification
import yagmail

# Login and registration
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone

# Password strength validation
import bcrypt

# Automatically eliminate unverified users
import asyncio

# 生成缩略图
from PIL import Image
Image.MAX_IMAGE_PIXELS = 89478485  # ~85 MP, prevent decompression bombs
THUMB_MAX_WIDTH = 600          # 缩略图最大宽度
THUMB_QUALITY = 75             # JPEG 质量

from github_trending import trending_scheduler, update_trending_post, process_deepseek_reply, process_deepseek_context_reply

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://littlebanbrick.cn", "https://littlebanbrick.cn", "http://www.littlebanbrick.cn", "https://www.littlebanbrick.cn"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "https://littlebanbrick.cn")
if not FRONTEND_BASE_URL:
    if os.getenv("ENV", "development") == "production":
        raise ValueError("FRONTEND_BASE_URL must be set in .env for production (e.g. https://littlebanbrick.cn)")
    FRONTEND_BASE_URL = "http://localhost"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ADMIN_SECRET_KEY = os.getenv("ADMIN_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

PHOTOS_DIR = os.path.join(os.path.dirname(__file__), "static/photos")
os.makedirs(PHOTOS_DIR, exist_ok=True)

NOTES_DIR = os.path.join(os.path.dirname(__file__), "static/notes")
os.makedirs(NOTES_DIR, exist_ok=True)

POST_IMAGES_DIR = os.path.join(os.path.dirname(__file__), "static/uploads/posts")
os.makedirs(POST_IMAGES_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.gif', '.bmp', 'nef'}

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

MCP_SECRET_KEY = os.getenv("MCP_SECRET_KEY", "")

if not JWT_SECRET_KEY or not ADMIN_SECRET_KEY:
    raise ValueError("FATAL: SECRET KEYS MISSING. Please set JWT_SECRET_KEY and ADMIN_SECRET_KEY in the .env file.")

class CommentRequest(BaseModel):
    content: str = Body(..., min_length=1, max_length=1000)
    parent_id: int | None = Body(None)

class UserRegister(BaseModel):
    username: str = Body(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Body(..., min_length=8)

class UserLogin(BaseModel):
    username: str
    password: str

class AdminLogin(BaseModel):
    admin_key: str

class TokenData(BaseModel):
    username: str | None = None
    role: str | None = None
    
class PostCreate(BaseModel):
    title: str = Body(..., min_length=1, max_length=200)
    preview: str = Body(..., min_length=1)  # a.k.a. content
    location: str = Body(..., max_length=100) # location can be empty but not null
    images: list[str] = Body([])    # The list of images' urls
    
class NoteCreate(BaseModel):
    title: str = Body(..., min_length=1, max_length=200)
    content: str = Body(..., min_length=1)

class NoteUpdate(BaseModel):
    title: str = Body(..., min_length=1, max_length=200)
    content: str = Body(..., min_length=1)
    
class MessageCreate(BaseModel):
    content: str = Body(..., min_length=1, max_length=1000)
    anonymous: bool = Body(False)
    quoted_id: int | None = Body(None)
    
class MessageReply(BaseModel):
    content: str = Body(..., min_length=1, max_length=1000)
    quoted_id: int | None = Body(None)

class SongUpdate(BaseModel):
    title: str = Body("")
    artist: str = Body("")
    url: str = Body("")
    cover: str = Body("")
    lrc: str = Body("")
    
def beijing_now():
    return datetime.now(timezone(timedelta(hours=8)))

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
    
def count_words(text):
    english_words = len(re.findall(r'[a-zA-Z]+', text))

    chinese_chars = len(re.findall(r'[\u4e00-\u9fff]', text))
    
    return english_words + chinese_chars

def get_current_time() -> str:
    return beijing_now().strftime("%Y-%m-%d %H:%M:%S")

async def check_post_exists(post_id: int) -> bool:
    query = posts.select().where(posts.c.id == post_id).with_only_columns(posts.c.id)
    return await database.fetch_one(query) is not None

def get_password_hash(password):
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8')[:72], salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str):
    return bcrypt.checkpw(plain_password.encode('utf-8')[:72], hashed_password.encode('utf-8'))
    
def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    jti = str(uuid.uuid4())
    to_encode.update({"jti": jti})
    if expires_delta:
        expire = beijing_now() + expires_delta
    else:
        expire = beijing_now() + timedelta(minutes=15)
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

    user_row = await database.fetch_one(users.select().where(users.c.username == username))
    if not user_row:
        raise credentials_exception

    return TokenData(username=username, role=role)

def send_verify_email(to_email: str, token: str):
    try:
        sender_email = os.getenv("SENDER_EMAIL")
        sender_auth_code = os.getenv("SENDER_AUTH_CODE")

        if not sender_email or not sender_auth_code:
            print("WARNING: Email credentials not set. Skipping email sending.")
            return

        verify_url = f"{FRONTEND_BASE_URL}/verify-email?token={token}"

        yag = yagmail.SMTP(
            user=sender_email,
            password=sender_auth_code,
            host='smtp.163.com',
            port=465,
            smtp_ssl=True
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
                
                <div style="text-align:center; margin:36px 36px;">
                    <a href="{verify_url}" style="display:inline-block;padding:13px 28px;background:#444444;color:#fff;border-radius:6px;text-decoration:none;font-size:15px;font-weight:500;line-height:1;mso-line-height-rule:exactly;">Activate Account</a>
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
        print("Verification email sent to", to_email)

    except Exception as e:
        print("Failed to send verification email:", str(e))
        
def allowed_file(filename):
    return os.path.splitext(filename)[1].lower() in ALLOWED_EXTENSIONS

def is_strong_password(password: str) -> bool:
    return bool(re.match(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};:\\|,.<>/?]).{8,}$', password))

def create_thumbnail(original_path: str, thumb_path: str):
    """生成缩略图并保存到 thumb_path"""
    os.makedirs(os.path.dirname(thumb_path), exist_ok=True)
    try:
        with Image.open(original_path) as img:
            # 保持宽高比缩放
            if img.width > THUMB_MAX_WIDTH:
                ratio = THUMB_MAX_WIDTH / img.width
                new_height = int(img.height * ratio)
                img = img.resize((THUMB_MAX_WIDTH, new_height), Image.Resampling.LANCZOS)
            # 转成 RGB（防止 PNG 透明通道问题），保存为 JPEG 并压缩
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')
            img.save(thumb_path, 'JPEG', quality=THUMB_QUALITY, optimize=True)
    except Exception as e:
        print(f"Thumbnail generation failed for {original_path}: {e}")

def safe_path(base_dir: str, filename: str) -> str:
    """Resolve file path and ensure it stays within base_dir. Raises HTTPException on escape attempt."""
    full_path = os.path.realpath(os.path.join(base_dir, filename))
    real_base = os.path.realpath(base_dir)
    if not full_path.startswith(real_base + os.sep) and full_path != real_base:
        raise HTTPException(status_code=400, detail="Invalid path")
    return full_path

async def verify_csrf(request: Request):
    if request.method == "OPTIONS":
        return
    csrf_cookie = request.cookies.get("csrf_token")
    csrf_header = request.headers.get("X-CSRF-Token")
    # CSRF DEBUG removed for security
    # CSRF debug lines removed for security
    # (removed)
    # (removed)
    if not csrf_cookie or not csrf_header or csrf_cookie != csrf_header:
        raise HTTPException(status_code=403, detail="CSRF validation failed")
    
async def check_deepseek_daily_limit(username: str):
    """检查用户今日 DeepSeek 调用是否超限（每天2次）。返回 (allowed: bool, remaining: int)"""
    today = beijing_now().strftime("%Y-%m-%d")
    row = await database.fetch_one(
        deepseek_usage.select().where(
            and_(deepseek_usage.c.username == username, deepseek_usage.c.date == today)
        )
    )
    count = row["count"] if row else 0
    return (count < 2, 2 - count)

async def record_deepseek_usage(username: str):
    """记录一次 DeepSeek 调用"""
    today = beijing_now().strftime("%Y-%m-%d")
    row = await database.fetch_one(
        deepseek_usage.select().where(
            and_(deepseek_usage.c.username == username, deepseek_usage.c.date == today)
        )
    )
    if row:
        await database.execute(
            deepseek_usage.update().where(deepseek_usage.c.id == row["id"]).values(count=row["count"] + 1)
        )
    else:
        await database.execute(
            deepseek_usage.insert().values(username=username, date=today, count=1)
        )

async def cleanup_unverified_users():
    while True:
        await asyncio.sleep(60)  # Check for every minute
        now = beijing_now().strftime("%Y-%m-%d %H:%M:%S")
        delete_query = users.delete().where(
            and_(
                users.c.is_verified == 0,
                users.c.verify_token_expire < now
            )
        )
        await database.execute(delete_query)
        
async def _create_post(post: PostCreate):
    """核心发帖逻辑，不依赖用户认证"""
    if len(post.images) > 9:
        return fail("Maximum 9 images allowed")
    now = get_current_time()
    query = posts.insert().values(
        date=now,
        title=post.title,
        preview=post.preview,
        location=post.location,
        comment_count=0,
        likes_count=0,
        word_count=f"{count_words(post.preview)} words"
    )
    last_id = await database.execute(query)
    for idx, img_url in enumerate(post.images):
        await database.execute(
            post_images.insert().values(post_id=last_id, url=img_url, order=idx)
        )
    return success(msg="Post created")

@app.on_event("startup")
async def startup():
    await database.connect()
    asyncio.create_task(cleanup_unverified_users())
    asyncio.create_task(trending_scheduler())

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

@app.get("/")
def read_root():
    return success(msg="Hello from fastAPI!")

@app.get("/api/posts")
async def get_posts():
    query = posts.select().order_by(desc(posts.c.date))
    rows = await database.fetch_all(query)

    trending = None
    others = []
    for row in rows:
        post = dict(row)
        imgs = await database.fetch_all(
            post_images.select()
            .where(post_images.c.post_id == post["id"])
            .order_by(post_images.c.order)
            .limit(4)
        )
        post["images"] = [img["url"] for img in imgs]

        if post["title"] == "🤖 GitHub Trending Today":
            trending = post
        else:
            others.append(post)

    result = [trending] + others if trending else others
    return success(data=result)

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
    post = await database.fetch_one(posts.select().where(posts.c.id == post_id))
    if not post:
        return fail(msg="Not found")
    post = dict(post)
    
    imgs = await database.fetch_all(
        post_images.select().where(post_images.c.post_id == post_id).order_by(post_images.c.order)
    )
    post["images"] = [img["url"] for img in imgs]
    return success(data=post)

@app.get("/api/posts/{post_id}/like_status")
async def get_like_status(post_id: int, current_user: TokenData = Depends(get_current_user)):
    user_name = current_user.username
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
    query = likes.select().where(likes.c.post_id == post_id).order_by(likes.c.created_at.desc())
    rows = await database.fetch_all(query)
    return success(data=[{"user_name": row["user_name"], "created_at": row["created_at"]} for row in rows])

@app.post("/api/posts/{post_id}/like")
@limiter.limit("20/minute")
async def toggle_like(
    request: Request,
    post_id: int,
    current_user: TokenData = Depends(get_current_user),
    _=Depends(verify_csrf)
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

@app.get("/api/posts/{post_id}/comments")
async def get_comments(
    post_id: int
):
    query = comments.select().where(comments.c.post_id == post_id).order_by(comments.c.created_at.asc())
    rows = await database.fetch_all(query)
    
    comment_dict = {row["id"]: dict(row) for row in rows}
    
    result = []
    for row in rows:
        c = dict(row)
        if c.get("parent_id"):
            parent = comment_dict.get(c["parent_id"])
            c["parent_author"] = parent["author"] if parent else "Unknown"
        else:
            c["parent_author"] = None
        result.append(c)
    return success(data=result)

@app.post("/api/posts/{post_id}/comments")
@limiter.limit("10/minute")
async def add_comment(
    request: Request,
    post_id: int,
    req: CommentRequest,
    current_user: TokenData = Depends(get_current_user),
    _=Depends(verify_csrf)
):
    author = current_user.username
    now = get_current_time()
    
    parent_author = None
    if req.parent_id:
        parent_comment = await database.fetch_one(
            comments.select().where(comments.c.id == req.parent_id)
        )
        if parent_comment:
            parent_author = parent_comment["author"]
    
    # 1. 在事务中同时插入评论和更新计数，保证原子性
    async with database.transaction():
        query = comments.insert().values(
            post_id=post_id,
            author=author,
            content=req.content,
            created_at=now,
            parent_id=req.parent_id,
            parent_author=parent_author
        )
        user_comment_id = await database.execute(query)
        
        await database.execute(
            posts.update().where(posts.c.id == post_id).values(
                comment_count=posts.c.comment_count + 1
            )
        )
    
    # 2. 事务提交成功后，检查是否触发 DeepSeek 自动回复
    post_row = await database.fetch_one(
        posts.select().where(posts.c.id == post_id)
    )
    if post_row and post_row["title"] == "🤖 GitHub Trending Today":
        content_lower = req.content.strip().lower()
        if content_lower.startswith("@deepseek"):
            # 非管理员用户检查 DeepSeek 每日调用配额（每天2次）
            if current_user.role != "admin":
                allowed, remaining = await check_deepseek_daily_limit(author)
                if not allowed:
                    return success(msg="Comment added. DeepSeek daily limit (2/day) reached.")
                await record_deepseek_usage(author)
            
            if content_lower.startswith("@deepseek-context"):
                asyncio.create_task(process_deepseek_context_reply(
                    post_id=post_id,
                    parent_comment_id=user_comment_id,
                    user_question=req.content,
                    asker_name=author
                ))
            else:
                asyncio.create_task(process_deepseek_reply(
                    post_id=post_id,
                    parent_comment_id=user_comment_id,
                    user_question=req.content,
                    asker_name=author
                ))
    
    return success(msg="Comment added")

@app.delete("/api/admin/posts/{post_id}")
async def admin_delete_post(
    post_id: int,
    current_user: TokenData = Depends(get_current_user),
    _=Depends(verify_csrf)
):    
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    image_records = await database.fetch_all(
        post_images.select().where(post_images.c.post_id == post_id)
    )

    for img in image_records:
        url = img["url"]
        relative = url.lstrip("/")
        file_path = os.path.join("/app", relative)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                print(f"Deleted: {file_path}")
            except Exception as e:
                print(f"Error deleting {file_path}: {e}")
        else:
            print(f"File not found (skip): {file_path}")

    async with database.transaction():
        await database.execute(post_images.delete().where(post_images.c.post_id == post_id))
        await database.execute(likes.delete().where(likes.c.post_id == post_id))
        await database.execute(comments.delete().where(comments.c.post_id == post_id))
        await database.execute(posts.delete().where(posts.c.id == post_id))

    return success(data={"deleted_post_id": post_id})

@app.post("/api/register")
@limiter.limit("10/hour")
async def register(request: Request, user: UserRegister):
    try:
        # Truncate password to 72 bytes, preserving complete UTF-8 characters
        while len(user.password.encode("utf-8")) > 72:
            user.password = user.password[:-1]
        
        username_exists = await database.fetch_one(users.select().where(users.c.username == user.username))
        if user.username.lower().strip() in ['anonymous', 'deepseek']:
            return {"code": 400, "msg": "Such username is invalid!'"}
        
        if username_exists:
            return {"code": 400, "msg": "Registration failed. Please check your input."}

        email_exists = await database.fetch_one(users.select().where(users.c.email == user.email))
        if email_exists:
            return {"code": 400, "msg": "Registration failed. Please check your input."}

        if not is_strong_password(user.password):
            return {"code": 400, "msg": "Password must be 8+ characters with uppercase, lowercase, number, and special character"}

        hashed_pw = get_password_hash(user.password)
        verify_token = secrets.token_urlsafe(32)
        
        expire_time = (beijing_now() + timedelta(minutes=15)).strftime("%Y-%m-%d %H:%M:%S")

        query = users.insert().values(
            username=user.username,
            email=user.email,
            hashed_password=hashed_pw,
            is_verified=False,
            verify_token=verify_token,
            verify_token_expire=expire_time,
            role="user"
        )
        await database.execute(query)

        try:
            send_verify_email(user.email, verify_token)
        except Exception:
            return {"code": 200, "msg": "Registered, but failed to send verification email"}

        return {"code": 200, "msg": "Registered successfully, please verify your email"}

    except HTTPException as he:
        return {"code": he.status_code, "msg": he.detail}
    except Exception as e:
        return {"code": 500, "msg": f"Internal server error: {str(e)}"}

@app.get("/api/verify-email")
@limiter.limit("20/minute")
async def verify_email(request: Request, token: str):
    try:
        user = await asyncio.wait_for(
            database.fetch_one(users.select().where(users.c.verify_token == token)),
            timeout=8.0
        )
        if not user:
            return {"code": 400, "msg": "Invalid or expired token"}

        expire_time_str = user["verify_token_expire"]
        if not expire_time_str:
            return {"code": 400, "msg": "Invalid or expired token"}

        bj_tz = timezone(timedelta(hours=8))
        expire_time = datetime.strptime(expire_time_str, "%Y-%m-%d %H:%M:%S").replace(tzinfo=bj_tz)
        if beijing_now() > expire_time:
            return {"code": 400, "msg": "Verification link expired (15min)"}

        await asyncio.wait_for(
            database.execute(
                users.update()
                .where(users.c.verify_token == token)
                .values(is_verified=1, verify_token=None, verify_token_expire=None)
            ),
            timeout=8.0
        )

        return {"code": 200, "msg": "Email verified successfully!"}

    except asyncio.TimeoutError:
        return {"code": 500, "msg": "Server busy, please try again"}
    except Exception as e:
        print("Verification error:", repr(e))
        return {"code": 500, "msg": str(e)}

@app.post("/api/login")
@limiter.limit("5/15min")
async def login(user: UserLogin, response: Response, request: Request):
    try:
        # Truncate password to 72 bytes, preserving complete UTF-8 characters
        while len(user.password.encode("utf-8")) > 72:
            user.password = user.password[:-1]
        
        query = users.select().where(users.c.username == user.username)
        row = await database.fetch_one(query)
        if not row or not verify_password(user.password, row["hashed_password"]):
            raise HTTPException(status_code=401, detail="Invalid username or password")

        if not row["is_verified"]:
            raise HTTPException(status_code=400, detail="Please verify your email before login")

        access_token = create_access_token(
            data={"sub": row["username"], "role": row["role"]},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )

        secure_flag = os.getenv("ENV", "development") == "production"

        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=secure_flag,
            samesite="Lax",
            max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            path="/"
        )

        csrf_token = secrets.token_hex(32)
        response.set_cookie(
            key="csrf_token",
            value=csrf_token,
            httponly=False,
            secure=secure_flag,
            samesite="Lax",
            max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            path="/"
        )

        return {
            "code": 200,
            "access_token": access_token,
            "token_type": "bearer",
            "csrf_token": csrf_token
        }

    except HTTPException as he:
        return {"code": he.status_code, "msg": he.detail}
    except Exception as e:
        return {"code": 500, "msg": f"Internal server error: {str(e)}"}

@app.post("/api/admin/login")
@limiter.limit("5/15min")
async def admin_login(request: Request, admin: AdminLogin, response: Response):
    try:
        if admin.admin_key != ADMIN_SECRET_KEY:
            raise HTTPException(status_code=403, detail="Invalid admin key")

        admin_user = await database.fetch_one(
            users.select().where(users.c.role == "admin")
        )
        if not admin_user:
            raise HTTPException(status_code=500, detail="No admin user found in database")

        token = create_access_token(
            data={"sub": admin_user["username"], "role": "admin"},
            expires_delta=timedelta(hours=24 * 7)
        )

        secure_flag = os.getenv("ENV", "development") == "production"

        response.set_cookie(
            key="access_token",
            value=token,
            httponly=True,
            secure=secure_flag,
            samesite="Lax",
            max_age=60 * 60 * 24 * 7,
            path="/"
        )

        csrf_token = secrets.token_hex(32)
        response.set_cookie(
            key="csrf_token",
            value=csrf_token,
            httponly=False,
            secure=secure_flag,
            samesite="Lax",
            max_age=60 * 60 * 10,
            path="/"
        )

        return {
            "code": 200,
            "token": token,
            "username": admin_user["username"],
            "role": "admin",
            "csrf_token": csrf_token
        }

    except HTTPException as he:
        return {"code": he.status_code, "msg": he.detail}
    except Exception as e:
        return {"code": 500, "msg": f"Internal server error: {str(e)}"}

@app.post("/api/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"code": 200, "msg": "Logged out"}

@app.get("/api/me")
async def me(current_user: TokenData = Depends(get_current_user)):
    return success(data={"username": current_user.username, "role": current_user.role})

#用户更名系统
class UsernameUpdate(BaseModel):
    new_username: str = Body(..., min_length=3, max_length=50)

@app.put("/api/user/username")
async def change_username(
    response: Response,
    req: UsernameUpdate,
    current_user: TokenData = Depends(get_current_user),
    _=Depends(verify_csrf)
):
    # 1. 检查新用户名合法性
    new_username = req.new_username.strip()
    if len(new_username) < 3 or len(new_username) > 50:
        return fail("Username must be 3-50 characters", 400)
    if new_username.lower() in ['anonymous', 'deepseek', 'admin']:
        return fail("This username is not allowed", 400)
    if not re.match(r'^[a-zA-Z0-9_]+$', new_username):
        return fail("Username can only contain letters, numbers and underscores", 400)
    if new_username == current_user.username:
        return fail("New username is the same as the current one. No change needed.", 400)

    # 2. 检查是否已存在
    existing = await database.fetch_one(users.select().where(users.c.username == new_username))
    if existing:
        return fail("Username already taken", 400)

    # 3. 获取当前用户信息，检查上次修改时间
    user_row = await database.fetch_one(users.select().where(users.c.username == current_user.username))
    if not user_row:
        return fail("User not found", 404)

    last_change_str = user_row.get("last_username_change")
    if last_change_str:
        try:
            last_change = datetime.strptime(last_change_str, "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone(timedelta(hours=8)))
            days_since = (beijing_now() - last_change).days
            if days_since < 30:
                return fail(f"You can only change username once every 30 days. {30 - days_since} days remaining.", 400)
        except:
            pass  # 如果格式错误，当作从未修改过

    # 4. 开始事务，更新所有相关表
    now_str = get_current_time()
    async with database.transaction():
        # 更新 users 表
        await database.execute(
            users.update()
            .where(users.c.username == current_user.username)
            .values(username=new_username, last_username_change=now_str)
        )

        # 更新 likes 表
        await database.execute(
            likes.update().where(likes.c.user_name == current_user.username).values(user_name=new_username)
        )
        # 更新 comments 表
        await database.execute(
            comments.update().where(comments.c.author == current_user.username).values(author=new_username)
        )
        # 同时更新 parent_author 字段（被回复的作者名）
        await database.execute(
            comments.update().where(comments.c.parent_author == current_user.username).values(parent_author=new_username)
        )
        # 更新 messages 表的发送者
        await database.execute(
            messages.update().where(messages.c.sender_username == current_user.username).values(sender_username=new_username)
        )
        # 更新 deepseek_usage 表
        await database.execute(
            deepseek_usage.update().where(deepseek_usage.c.username == current_user.username).values(username=new_username)
        )

    # 5. 生成新的 token 和 csrf_token，替换旧 cookie
    access_token = create_access_token(
        data={"sub": new_username, "role": user_row["role"]},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    csrf_token = secrets.token_hex(32)
    secure_flag = os.getenv("ENV", "development") == "production"

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=secure_flag,
        samesite="Lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
    )
    response.set_cookie(
        key="csrf_token",
        value=csrf_token,
        httponly=False,
        secure=secure_flag,
        samesite="Lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
    )

    return success(data={
        "username": new_username,
        "access_token": access_token,
        "csrf_token": csrf_token
    }, msg="Username updated successfully. Please refresh the page.")

@app.get("/wait-verification")
async def wait_verification():
    return RedirectResponse(f"{FRONTEND_BASE_URL}/wait-verification")

@app.get("/verify-email")
async def verify_email_page(request: Request):
    token = request.query_params.get("token", "")
    return RedirectResponse(f"{FRONTEND_BASE_URL}/verify-email?token={token}")

@app.get("/api/user/profile")
async def get_user_profile(current_user: TokenData = Depends(get_current_user)):
    if current_user.username == "admin":
        return success(data={
            "username": "admin",
            "email": "admin@blog.com",
            "role": "admin"
        })
    user = await database.fetch_one(users.select().where(users.c.username == current_user.username))
    return success(data={
        "username": user["username"],
        "email": user["email"],
        "role": user["role"],
        "is_verified": bool(user["is_verified"])
    })
    
@app.delete("/api/user/delete")
async def delete_user(current_user: TokenData = Depends(get_current_user), _=Depends(verify_csrf)):
    if current_user.role == "admin":
        return fail(msg="Admin cannot be deleted", code=403)

    async with database.transaction():
        # 1. 修复点赞计数：先查出该用户点过赞的帖子，减少对应 likes_count
        user_likes = await database.fetch_all(
            likes.select().where(likes.c.user_name == current_user.username)
        )
        for like in user_likes:
            await database.execute(
                posts.update().where(posts.c.id == like["post_id"]).values(
                    likes_count=posts.c.likes_count - 1
                )
            )
        # 删除点赞记录
        await database.execute(likes.delete().where(likes.c.user_name == current_user.username))

        # 2. 修复评论计数：查出该用户的所有评论，减少对应帖子的 comment_count
        user_comments = await database.fetch_all(
            comments.select().where(comments.c.author == current_user.username)
        )
        # 确定每个帖子需要减少的评论数
        from collections import Counter
        post_comment_counts = Counter(c["post_id"] for c in user_comments)
        for post_id, count in post_comment_counts.items():
            await database.execute(
                posts.update().where(posts.c.id == post_id).values(
                    comment_count=posts.c.comment_count - count
                )
            )
        # 删除评论记录
        await database.execute(comments.delete().where(comments.c.author == current_user.username))
        
        # 3. 删除该用户的所有留言会话（包括管理员回复）
        user_roots = await database.fetch_all(
            messages.select().where(
                and_(
                    messages.c.sender_username == current_user.username,
                    messages.c.parent_id == None
                )
            )
        )
        for root in user_roots:
            root_id = root["id"]
            await database.execute(messages.delete().where(messages.c.root_id == root_id))
            await database.execute(messages.delete().where(messages.c.id == root_id))

        # 4. 删除用户
        await database.execute(users.delete().where(users.c.username == current_user.username))

    response = JSONResponse(content=success(msg="Account deleted successfully"))
    response.delete_cookie("access_token", path="/")
    return response

@app.post("/api/admin/posts/create")
async def admin_create_post(
    post: PostCreate,
    current_user: TokenData = Depends(get_current_user),
    _=Depends(verify_csrf)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403)
    return await _create_post(post)

@app.delete("/api/admin/comments/{comment_id}")
async def admin_delete_comment(
    comment_id: int,
    current_user: TokenData = Depends(get_current_user),
    _=Depends(verify_csrf)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    # Get post id
    comment = await database.fetch_one(comments.select().where(comments.c.id == comment_id))
    if not comment: return fail(msg="Comment not found", code=404)

    async with database.transaction():
        await database.execute(comments.delete().where(comments.c.id == comment_id))
        # Update comment count
        await database.execute(
            posts.update().where(posts.c.id == comment["post_id"]).values(
                comment_count=posts.c.comment_count - 1
            )
        )
    return success(data={"deleted_comment_id": comment_id})

@app.post("/api/admin/photos/upload")
async def upload_photo(
    file: UploadFile = File(...),
    current_user: TokenData = Depends(get_current_user),
    _=Depends(verify_csrf)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    if not allowed_file(file.filename):
        raise HTTPException(status_code=400, detail="Unsupported file type")

    timestamp = str(int(time.time() * 1000))
    safe_name = f"{timestamp}_{os.path.basename(file.filename)}"
    file_path = os.path.join(PHOTOS_DIR, safe_name)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # 生成缩略图
    thumb_dir = os.path.join(PHOTOS_DIR, "thumbs")
    thumb_path = os.path.join(thumb_dir, safe_name)
    create_thumbnail(file_path, thumb_path)

    url = f"/photos/{safe_name}"
    return success(data={"url": url})

@app.get("/api/photos")
async def list_photos():
    if not os.path.exists(PHOTOS_DIR):
        return success(data=[])
    files = os.listdir(PHOTOS_DIR)
    
    photos = []
    for f in files:
        if allowed_file(f):
            photos.append(f"/photos/{f}")
    photos.sort(reverse=True)
    return success(data=photos)

@app.delete("/api/admin/photos/{filename}")
async def delete_photo(
    filename: str,
    current_user: TokenData = Depends(get_current_user),
    _=Depends(verify_csrf)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    file_path = safe_path(PHOTOS_DIR, filename)
    if os.path.exists(file_path):
        os.remove(file_path)
        return success(msg="Deleted")
    else:
        return fail(msg="File not found", code=404)
    
@app.get("/api/notes")
async def list_notes():
    beijing_tz = timezone(timedelta(hours=8))
    
    if not os.path.exists(NOTES_DIR):
        return success(data=[])
    files = os.listdir(NOTES_DIR)
    notes_list = []
    for f in files:
        if f.endswith('.md'):
            path = os.path.join(NOTES_DIR, f)
            with open(path, 'r', encoding='utf-8') as fp:
                raw = fp.read()
            lines = raw.strip().split('\n')
            # 取第一行（# 标题）作为标题，去掉 # 和首尾空格，保留原始大小写
            first_line = lines[0].lstrip('#').strip() if lines else ''
            # 如果有标题行就用它，否则回退到文件名
            title = first_line if first_line else f.replace('.md', '')
            summary = first_line
            notes_list.append({
                'id': f.replace('.md', ''),
                'title': title,
                'summary': summary,
                'filename': f,
                'updated_at': datetime.fromtimestamp(os.path.getmtime(path), tz=beijing_tz).strftime("%Y-%m-%d %H:%M:%S")
            })
    notes_list.sort(key=lambda x: x['updated_at'], reverse=True)
    return success(data=notes_list)

@app.get("/api/notes/{note_id}")
async def get_note(note_id: str):
    filename = note_id + '.md'
    path = safe_path(NOTES_DIR, filename)
    if not os.path.exists(path):
        return fail(msg="Note not found", code=404)
    with open(path, 'r', encoding='utf-8') as fp:
        content = fp.read()
    return success(data={
        'id': note_id,
        'title': note_id.replace('-', ' ').title(),
        'content': content
    })

@app.post("/api/admin/notes")
async def create_note(note: NoteCreate,
    current_user: TokenData = Depends(get_current_user),
    _=Depends(verify_csrf)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    base = re.sub(r'[^\w\s-]', '', note.title).strip()
    base = re.sub(r'[-\s]+', '-', base)[:50]
    filename = base + '.md'
    path = safe_path(NOTES_DIR, filename)
    if os.path.exists(path):
        filename = f"{base}-{uuid.uuid4().hex[:6]}.md"
        path = safe_path(NOTES_DIR, filename)
    with open(path, 'w', encoding='utf-8') as fp:
        fp.write(note.content)
    note_id = filename.replace('.md', '')
    return success(data={'id': note_id, 'title': note.title, 'content': note.content})

@app.put("/api/admin/notes/{note_id}")
async def update_note(note_id: str,
    note: NoteUpdate,
    current_user: TokenData = Depends(get_current_user),
    _=Depends(verify_csrf)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    old_file = note_id + '.md'
    old_path = safe_path(NOTES_DIR, old_file)
    if not os.path.exists(old_path):
        return fail(msg="Note not found", code=404)

    new_base = re.sub(r'[^\w\s-]', '', note.title).strip()
    new_base = re.sub(r'[-\s]+', '-', new_base)[:50]
    new_file = new_base + '.md'
    new_path = safe_path(NOTES_DIR, new_file)

    if old_file != new_file and not os.path.exists(new_path):
        os.rename(old_path, new_path)
        final_path = new_path
        final_id = new_file.replace('.md', '')
    else:
        final_path = old_path
        final_id = note_id

    with open(final_path, 'w', encoding='utf-8') as fp:
        fp.write(note.content)

    return success(data={'id': final_id, 'title': note.title, 'content': note.content})

@app.delete("/api/admin/notes/{note_id}")
async def delete_note(note_id: str,
    current_user: TokenData = Depends(get_current_user),
    _=Depends(verify_csrf)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    path = safe_path(NOTES_DIR, note_id + '.md')
    if os.path.exists(path):
        os.remove(path)
        return success(msg="Deleted")
    return fail(msg="Note not found", code=404)

@app.get("/api/projects")
async def get_projects():
    query = projects_table.select().order_by(projects_table.c.id.desc())
    rows = await database.fetch_all(query)
    return success(data=[dict(row) for row in rows])

@app.post("/api/admin/projects")
async def create_project(
    req: dict,
    current_user: TokenData = Depends(get_current_user),
    _=Depends(verify_csrf)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    now = beijing_now().strftime("%Y-%m-%d %H:%M:%S")
    query = projects_table.insert().values(
        name=req.get("name"),
        desc=req.get("desc", ""),
        link=req.get("link"),
        created_at=now
    )
    last_id = await database.execute(query)
    return success(data={"id": last_id, "msg": "Project created"})

@app.put("/api/admin/projects/{project_id}")
async def update_project(
    project_id: int,
    req: dict,
    current_user: TokenData = Depends(get_current_user),
    _=Depends(verify_csrf)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    query = projects_table.update().where(projects_table.c.id == project_id).values(
        name=req.get("name"),
        desc=req.get("desc", ""),
        link=req.get("link")
    )
    await database.execute(query)
    return success(data={"msg": "Project updated"})

@app.delete("/api/admin/projects/{project_id}")
async def delete_project(
    project_id: int,
    current_user: TokenData = Depends(get_current_user),
    _=Depends(verify_csrf)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    query = projects_table.delete().where(projects_table.c.id == project_id)
    await database.execute(query)
    return success(data={"msg": "Project deleted"})

@app.post("/api/admin/upload-post-image")
async def upload_post_image(
    file: UploadFile = File(...),
    current_user: TokenData = Depends(get_current_user),
    _=Depends(verify_csrf)
):
    """ 上传帖子配图，管理员专用 """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    if not allowed_file(file.filename):
        raise HTTPException(status_code=400, detail="Unsupported file type")

    try:
        ext = os.path.splitext(file.filename)[1]

        timestamp = str(int(time.time() * 1000))
        random_str = uuid.uuid4().hex[:8]
        safe_name = f"{timestamp}_{random_str}{ext}"
        file_path = os.path.join(POST_IMAGES_DIR, safe_name)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # 生成缩略图
        thumb_dir = os.path.join(POST_IMAGES_DIR, "thumbs")
        thumb_path = os.path.join(thumb_dir, safe_name)
        create_thumbnail(file_path, thumb_path)

        url = f"/static/uploads/posts/{safe_name}"
        return success(data={"url": url})
    except Exception as e:
        print("Upload post image error:", repr(e))
        raise HTTPException(status_code=500, detail="Internal server error")
    
@app.post("/api/messages")
@limiter.limit("5/minute")
async def send_message(
    request: Request,
    req: MessageCreate,
    current_user: TokenData = Depends(get_current_user),
    _=Depends(verify_csrf)
):
    sender = "Anonymous" if req.anonymous else current_user.username
    now = get_current_time()
    query = messages.insert().values(
        sender_username=sender,
        content=req.content,
        created_at=now,
        quoted_id=req.quoted_id,
        is_read=0
    )
    await database.execute(query)
    return success(msg="Message sent")

# For the admin. All msgs.
@app.get("/api/admin/messages")
async def get_admin_messages(current_user: TokenData = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    # Get all root msgs
    roots = await database.fetch_all(
        messages.select().where(messages.c.parent_id == None).order_by(messages.c.created_at.desc())
    )
    result = []
    for root in roots:
        root = dict(root)
        # Calculate the number of the unread msgs
        unread_replies = await database.fetch_val(
            select(func.count()).select_from(messages).where(
                and_(
                    messages.c.root_id == root["id"],
                    messages.c.is_read == 0,
                    messages.c.sender_username != current_user.username
                )
            )
        )
        root["unread_replies"] = unread_replies
        result.append(root)
    return success(data=result)

@app.put("/api/admin/messages/{message_id}/read")
async def admin_mark_read(message_id: int, current_user: TokenData = Depends(get_current_user), _=Depends(verify_csrf)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    async with database.transaction():
        await database.execute(
            messages.update().where(
                and_(messages.c.id == message_id, messages.c.is_read == 0)
            ).values(is_read=1)
        )
        await database.execute(
            messages.update().where(
                and_(
                    messages.c.root_id == message_id,
                    messages.c.is_read == 0,
                    messages.c.sender_username != current_user.username
                )
            ).values(is_read=1)
        )
    return success(msg="Marked as read")

@app.put("/api/messages/{message_id}/read")
async def user_mark_read(message_id: int, current_user: TokenData = Depends(get_current_user), _=Depends(verify_csrf)):
    root = await database.fetch_one(messages.select().where(messages.c.id == message_id))
    if not root:
        return fail(msg="Message not found", code=404)
    if current_user.username != root["sender_username"]:
        raise HTTPException(status_code=403, detail="Not your message")
    async with database.transaction():
        await database.execute(
            messages.update().where(
                and_(messages.c.id == message_id, messages.c.is_read == 0)
            ).values(is_read=1)
        )
        await database.execute(
            messages.update().where(
                and_(
                    messages.c.root_id == message_id,
                    messages.c.is_read == 0,
                    messages.c.sender_username != current_user.username
                )
            ).values(is_read=1)
        )
    return success(msg="Marked as read")
    
@app.get("/api/admin/messages/unread-count")
async def unread_count(current_user: TokenData = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    count = await database.fetch_val(
        select(func.count()).select_from(messages).where(
            and_(messages.c.is_read == 0, messages.c.sender_username != current_user.username)
        )
    )
    return success(data={"unread": count})

@app.get("/api/messages/unread-count")
async def user_unread_count(current_user: TokenData = Depends(get_current_user)):
    # 获取该用户发起的根消息ID列表
    root_rows = await database.fetch_all(
        select(messages.c.id).where(
            and_(
                messages.c.parent_id == None,
                messages.c.sender_username == current_user.username
            )
        )
    )
    root_ids = [r.id for r in root_rows]
    if not root_ids:
        return success(data={"unread": 0})

    count = await database.fetch_val(
        select(func.count()).select_from(messages).where(
            and_(
                messages.c.root_id.in_(root_ids),
                messages.c.is_read == 0,
                messages.c.sender_username != current_user.username
            )
        )
    )
    return success(data={"unread": count or 0})

# For the admin
@app.post("/api/admin/messages/{message_id}/reply")
async def reply_message(
    message_id: int,
    req: MessageReply,
    current_user: TokenData = Depends(get_current_user),
    _=Depends(verify_csrf)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    # Find the original msg
    original = await database.fetch_one(messages.select().where(messages.c.id == message_id))
    if not original:
        return fail(msg="Message not found", code=404)

    now = get_current_time()
    root_id = original["root_id"] or message_id  # If the original msg has no root, then itself is the root
    query = messages.insert().values(
        sender_username=current_user.username,   # Reply from the admin
        content=req.content,
        created_at=now,
        is_read=0,
        parent_id=message_id,
        root_id=root_id,
        quoted_id=req.quoted_id
    )
    await database.execute(query)
    
    if not original["is_read"]:
        await database.execute(
            messages.update().where(messages.c.id == message_id).values(is_read=1)
        )
    return success(msg="Reply sent")

# For the users
@app.post("/api/messages/{message_id}/reply")
async def user_reply(
    message_id: int,
    req: MessageReply,
    current_user: TokenData = Depends(get_current_user),
    _=Depends(verify_csrf)
):
    if current_user.role == "admin":
        raise HTTPException(status_code=400, detail="Admin should use /api/admin/...")
    original = await database.fetch_one(messages.select().where(messages.c.id == message_id))
    if not original:
        return fail(msg="Message not found", code=404)
    root_id = original["root_id"] or original["id"]
    root = await database.fetch_one(messages.select().where(messages.c.id == root_id))
    if not root or current_user.username != root["sender_username"]:
        raise HTTPException(status_code=403, detail="You can only reply to your own conversations")
    
    now = get_current_time()
    query = messages.insert().values(
        sender_username=current_user.username,
        content=req.content,
        created_at=now,
        is_read=0,
        parent_id=message_id,
        root_id=root_id,
        quoted_id=req.quoted_id
    )
    await database.execute(query)
    return success(msg="Reply sent")

@app.get("/api/admin/messages/{root_id}/conversation")
async def admin_get_conversation(
    root_id: int,
    current_user: TokenData = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    query = messages.select().where(
        or_(messages.c.id == root_id, messages.c.root_id == root_id)
    ).order_by(messages.c.created_at.asc())
    rows = await database.fetch_all(query)
    msgs = [dict(row) for row in rows]

    # 收集所有被引用的消息 ID
    quoted_ids = set()
    for m in msgs:
        if m.get("quoted_id"):
            quoted_ids.add(m["quoted_id"])
    
    # 批量查询被引用消息的内容
    quoted_content_map = {}
    if quoted_ids:
        quoted_rows = await database.fetch_all(
            messages.select().where(messages.c.id.in_(quoted_ids))
        )
        quoted_content_map = {r["id"]: r["content"] for r in quoted_rows}
    
    # 附加 quoted_content 字段
    for m in msgs:
        m["quoted_content"] = quoted_content_map.get(m.get("quoted_id"), "") if m.get("quoted_id") else ""
    
    return success(data=msgs)

# For the users. Relevant msgs only.
@app.get("/api/messages/my")
async def my_messages(current_user: TokenData = Depends(get_current_user)):
    query = messages.select().where(
        and_(
            messages.c.parent_id == None,
            messages.c.sender_username == current_user.username
        )
    ).order_by(messages.c.created_at.desc())
    roots = await database.fetch_all(query)
    result = []
    for row in roots:
        root = dict(row)
        unread = await database.fetch_val(
            select(func.count()).select_from(messages).where(
                and_(messages.c.root_id == root["id"],
                    messages.c.is_read == 0,
                    messages.c.sender_username != current_user.username
                )
            )
        )
        root["unread_replies"] = unread
        result.append(root)
    return success(data=result)
    
@app.get("/api/messages/{root_id}/conversation")
async def get_conversation(
    root_id: int,
    current_user: TokenData = Depends(get_current_user),
):
    root = await database.fetch_one(messages.select().where(messages.c.id == root_id))
    if not root:
        return fail(msg="Conversation not found", code=404)
    if current_user.role != "admin" and current_user.username != root["sender_username"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    query = messages.select().where(
        or_(messages.c.id == root_id, messages.c.root_id == root_id)
    ).order_by(messages.c.created_at.asc())
    rows = await database.fetch_all(query)
    msgs = [dict(row) for row in rows]

    # 收集所有被引用的消息 ID
    quoted_ids = set()
    for m in msgs:
        if m.get("quoted_id"):
            quoted_ids.add(m["quoted_id"])
    
    # 批量查询被引用消息的内容
    quoted_content_map = {}
    if quoted_ids:
        quoted_rows = await database.fetch_all(
            messages.select().where(messages.c.id.in_(quoted_ids))
        )
        quoted_content_map = {r["id"]: r["content"] for r in quoted_rows}
    
    # 附加 quoted_content 字段
    for m in msgs:
        m["quoted_content"] = quoted_content_map.get(m.get("quoted_id"), "") if m.get("quoted_id") else ""
    
    return success(data=msgs)

@app.delete("/api/admin/messages/{message_id}")
async def delete_message(message_id: int, current_user: TokenData = Depends(get_current_user), _=Depends(verify_csrf)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    # 删除该根消息及其所有回复
    async with database.transaction():
        await database.execute(messages.delete().where(messages.c.root_id == message_id))
        await database.execute(messages.delete().where(messages.c.id == message_id))
    return success(msg="Message deleted")

@app.get("/api/song")
async def get_song():
    row = await database.fetch_one(song_config.select().where(song_config.c.id == 1))
    if not row:
        return success(data=None)
    return success(data={
        "title": row["title"],
        "artist": row["artist"],
        "url": row["url"],
        "cover": row["cover"],
        "lrc": row["lrc"]
    })

@app.put("/api/admin/song")
async def set_song(req: SongUpdate, current_user: TokenData = Depends(get_current_user), _=Depends(verify_csrf)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    await database.execute(song_config.delete())
    await database.execute(song_config.insert().values(
        id=1,
        title=req.title,
        artist=req.artist,
        url=req.url,
        cover=req.cover,
        lrc=req.lrc
    ))
    return success(msg="Song updated")

# 管理员删除歌曲（可选，可以直接更新为空字符串）
@app.delete("/api/admin/song")
async def delete_song(current_user: TokenData = Depends(get_current_user), _=Depends(verify_csrf)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    await database.execute(song_config.delete())
    return success(msg="Song removed")

@app.post("/api/admin/song/lookup")
async def lookup_song(req: dict, current_user: TokenData = Depends(get_current_user), _=Depends(verify_csrf)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403)
    link = req.get("link", "").strip()
    if not link:
        return fail(msg="No link provided")

    patterns = [
        r'/songDetail/(\w+)',
        r'/song/(\w+)',
        r'songid=(\w+)',
    ]
    songid = None
    for pat in patterns:
        m = re.search(pat, link)
        if m:
            songid = m.group(1)
            break

    if not songid:
        return fail(msg="Could not extract song ID")
    return success(data={"song_id": songid})

@app.get("/api/song/detail")
async def song_detail(mid: str):
    if not mid:
        return fail("Missing song id")
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        # 使用相对稳定的接口获取歌曲信息
        resp = requests.get(
            f"https://api.qq.jsososo.com/api/song/url?id={mid}",
            headers=headers,
            timeout=10
        )
        if resp.status_code != 200 or resp.json().get("code") != 200:
            return fail("Failed to fetch song url")

        url_data = resp.json()["data"]
        # 获取最高音质
        audio_url = url_data.get("mp3_lq") or url_data.get("mp3_128k") or url_data.get("flac")
        song_name = url_data.get("songname", "")
        singer = url_data.get("singer_name", "")

        # 获取歌词
        lrc = ""
        try:
            lrc_resp = requests.get(
                f"https://api.qq.jsososo.com/api/lyric?id={mid}",
                headers=headers, timeout=5
            )
            if lrc_resp.status_code == 200 and lrc_resp.json().get("code") == 200:
                lrc = lrc_resp.json()["data"]["lyric"]
        except:
            pass

        # 封面图片
        cover = f"https://y.qq.com/music/photo_new/T002R300x300M000{mid}.jpg"

        return success(data={
            "title": song_name,
            "artist": singer,
            "cover": cover,
            "url": audio_url,
            "lrc": lrc
        })
    except Exception as e:
        return fail(f"Internal error: {e}")
    
@app.get("/api/admin/music-files")
async def get_music_files(current_user: TokenData = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    music_dir = os.path.join(os.path.dirname(__file__), "static/music")
    if not os.path.exists(music_dir):
        return success(data=[])
    files = [f for f in os.listdir(music_dir) if f.lower().endswith('.mp3')]
    return success(data=files)

@app.post("/api/mcp/create-post")
async def mcp_create_post(post: PostCreate, request: Request):
    mcp_key = request.headers.get("X-MCP-Key")
    if mcp_key != MCP_SECRET_KEY or not mcp_key:
        raise HTTPException(status_code=403, detail="Invalid MCP key")
    return await _create_post(post)

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content=fail(exc.detail, exc.status_code)
    )
    
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/photos", StaticFiles(directory="static/photos"), name="photos")