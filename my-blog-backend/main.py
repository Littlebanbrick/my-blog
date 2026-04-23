'''
main.py

To run this application, enter `uvicorn main:app --reload --port 8000` in the terminal.
'''

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import database, posts, comments
from sqlalchemy import func, select

app = FastAPI()

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
    total_posts = await database.fetch_val(
        select(func.count()).select_from(posts)
    )
    total_likes = await database.fetch_val(
        select(func.coalesce(func.sum(posts.c.likes_count), 0))
    )
    total_comments = await database.fetch_val(
        select(func.count()).select_from(comments)
    )

    return {
        "avatar": "/myAvatar.jpg",
        "name": "Johnny Wang",
        "motto": "Be unique, be yourself, be a monster!",
        "location": "Hangzhou, China",
        "posts": total_posts,
        "likes": total_likes,
        "comments": total_comments
    }