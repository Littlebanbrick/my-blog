'''
main.py

To run this application, enter `uvicorn main:app --reload --port 8000` in the terminal.
'''

from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
from database import database, posts, comments, likes
from sqlalchemy import func, select, and_
from pydantic import BaseModel

app = FastAPI()

class LikeRequest(BaseModel):
    user_name: str = "Littlebanbrick"
    
class CommentRequest(BaseModel):
    author: str = "Littlebanbrick"
    content: str

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],    # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI!"}

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
    return {"liked": existing is not None}

@app.get("/api/posts/{post_id}/likes")
async def get_likes(post_id: int):
    query = likes.select().where(likes.c.post_id == post_id).order_by(likes.c.created_at.asc())
    rows = await database.fetch_all(query)
    return [{"user_name": row["user_name"], "created_at": row["created_at"]} for row in rows]
    
@app.post("/api/posts/{post_id}/like")
async def toggle_like(post_id: int, req: LikeRequest):
    user_name = req.user_name
    """
    Toggle the like status of a post:
    - If the user has already liked the post, remove the like (delete likes record, decrement likes_count)
    - If the user has not liked the post, add a like (insert likes record, increment likes_count)
    """
    # 1. Check if the user has already liked this post
    check_query = likes.select().where(
        and_(
            likes.c.post_id == post_id,
            likes.c.user_name == user_name
        )
    )
    existing = await database.fetch_one(check_query)

    # 2. Toggle like status within a transaction to ensure data consistency
    async with database.transaction():
        if existing:
            # Cancel like
            delete_query = likes.delete().where(likes.c.id == existing["id"])
            await database.execute(delete_query)

            # likes_count of the post minus 1
            update_query = posts.update().where(posts.c.id == post_id).values(
                likes_count=posts.c.likes_count - 1
            )
            await database.execute(update_query)
            liked = False
        else:
            # Add like
            from datetime import datetime
            now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            insert_query = likes.insert().values(
                user_name=user_name,
                post_id=post_id,
                created_at=now
            )
            await database.execute(insert_query)

            # likes_count of the post plus 1
            update_query = posts.update().where(posts.c.id == post_id).values(
                likes_count=posts.c.likes_count + 1
            )
            await database.execute(update_query)
            liked = True

    # 3. Get the updated likes_count and the list of likers for this post
    count_query = select(posts.c.likes_count).where(posts.c.id == post_id)
    new_likes_count = await database.fetch_val(count_query)

    likers_query = likes.select().where(likes.c.post_id == post_id).order_by(likes.c.created_at.desc())
    likers_rows = await database.fetch_all(likers_query)
    likers = [{"user_name": row["user_name"], "created_at": row["created_at"]} for row in likers_rows]

    return {
        "liked": liked,
        "likes_count": new_likes_count,
        "likers": likers
    }
    
@app.get("/api/posts/{post_id}/comments")
async def get_comments(post_id: int):
    query = comments.select().where(comments.c.post_id == post_id).order_by(comments.c.created_at.asc())
    return await database.fetch_all(query)

@app.post("/api/posts/{post_id}/comments")
async def add_comment(post_id: int, req: CommentRequest):
    from datetime import datetime
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    query = comments.insert().values(
        post_id=post_id,
        author=req.author,
        content=req.content,
        created_at=now
    )
    await database.execute(query)

    # Update comment_count
    update_query = posts.update().where(posts.c.id == post_id).values(
        comment_count=posts.c.comment_count + 1
    )
    await database.execute(update_query)

    return {"message": "Comment added"}