# my-blog-backend/database.py

import databases
import sqlalchemy
from sqlalchemy import create_engine, Column, Integer, String, Text

# Database connection URL（SQLite stored at root dir）
DATABASE_URL = "sqlite:///./blog.db"

# Database asynchronous connection instance
database = databases.Database(DATABASE_URL)

# Metadata. Used for defining all the tables
metadata = sqlalchemy.MetaData()

# ========== Table of Moments ==========
posts = sqlalchemy.Table(
    "posts",
    metadata,
    Column("id", Integer, primary_key=True),          
    Column("date", String),                           
    Column("title", String),                          
    Column("preview", Text),                           
    Column("location", String, nullable=True),         
    Column("comment_count", Integer, default=0),      
    Column("likes_count", Integer, default=0),         
    Column("word_count", String),                      
)

# ========== Table of comments  ==========
comments = sqlalchemy.Table(
    "comments",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("post_id", Integer),                  
    Column("author", String, default="anonymous"),   
    Column("content", Text),                          
    Column("created_at", String),                
)

# ========== Table of likes  ==========
likes = sqlalchemy.Table(
    "likes",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("user_name", String(50)),            # Username of the liker
    Column("post_id", Integer),            
    Column("created_at", String),         
    Column("parent_id", Integer, nullable=True),
)

# ========== Table of users  ==========
users = sqlalchemy.Table(
    "users",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("username", String(50), unique=True, nullable=False),
    Column("email", String(100), unique=True, nullable=False),
    Column("hashed_password", String(255), nullable=False),
    Column("created_at", String(50), nullable=False),
    Column("role", String(50), nullable=False, default="user"),  # User or admin
    Column("is_verified", Integer, default=0),
    Column("verify_token", String(255), nullable=True)
)

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)
metadata.create_all(engine)