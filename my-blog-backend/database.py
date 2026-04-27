# my-blog-backend/database.py

import databases
import sqlalchemy
from sqlalchemy import create_engine, Column, Integer, String, Text, text

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
    Column("role", String(50), nullable=False, default="user"),  # User or admin
    Column("is_verified", Integer, default=0),
    Column("verify_token", String(255), nullable=True)
)

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

# Fix missing columns in the user table without dropping the table
def fix_missing_columns():
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN hashed_password VARCHAR(255) DEFAULT ''"))
            conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'user'"))
            conn.execute(text("ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0"))
            conn.execute(text("ALTER TABLE users ADD COLUMN verify_token VARCHAR(255) NULL"))
            conn.commit()
            print("Missing columns added successfully")
    except Exception as e:
        # If the columns already exist, we can ignore the error
        print("Columns already exist")

fix_missing_columns()

metadata.create_all(engine)