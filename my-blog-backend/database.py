# my-blog-backend/database.py

import databases
import sqlalchemy
from sqlalchemy import create_engine, Column, Integer, String, Text, text

# Database connection URL（SQLite stored at root dir）
DATABASE_URL = "sqlite:///./data/blog.db"

# Database asynchronous connection instance
database = databases.Database(DATABASE_URL)

# Metadata. Used for defining all the tables
metadata = sqlalchemy.MetaData()

# ========== Table of Posts ==========
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

# ========== Table of Post Images ==========
post_images = sqlalchemy.Table(
    "post_images",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("post_id", Integer, nullable=False),
    Column("url", String(300), nullable=False),
    Column("order", Integer, default=0),
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
    Column("parent_id", Integer, nullable=True),
    Column("parent_author", String, nullable=True),
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
    Column("verify_token", String(255), nullable=True),
    Column("verify_token_expire", String(255), nullable=True)
)

# ========== Table of projects  ==========
projects_table = sqlalchemy.Table(
    "projects",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("name", String(100), nullable=False),
    Column("desc", String(200)),
    Column("link", String(300), nullable=False),
    Column("created_at", String(20)),
)

# ========== Table of messages  ==========
messages = sqlalchemy.Table(
    "messages",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("sender_username", String(50)),
    Column("content", Text, nullable=False),
    Column("created_at", String(20)),
    Column("is_read", Integer, default=0),
    Column("parent_id", Integer, nullable=True),
    Column("root_id", Integer, nullable=True),
)

# ========== Table of song configs  ==========
song_config = sqlalchemy.Table(
    "song_config",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("iframe_code", Text),
)

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

# Fix missing columns in the user table without dropping the table
def fix_missing_columns():
    def column_exists(table_name, column_name):
        with engine.connect() as conn:
            cursor = conn.execute(text(f"PRAGMA table_info({table_name})"))
            columns = [row[1] for row in cursor.fetchall()]
            return column_name in columns

    try:
        with engine.connect() as conn:
            if not column_exists("users", "hashed_password"):
                conn.execute(text("ALTER TABLE users ADD COLUMN hashed_password VARCHAR(255) DEFAULT ''"))
            
            if not column_exists("users", "role"):
                conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'user'"))
            
            if not column_exists("users", "is_verified"):
                conn.execute(text("ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0"))
            
            if not column_exists("users", "verify_token"):
                conn.execute(text("ALTER TABLE users ADD COLUMN verify_token VARCHAR(255) NULL"))
            
            if not column_exists("users", "verify_token_expire"):
                conn.execute(text("ALTER TABLE users ADD COLUMN verify_token_expire VARCHAR(255) NULL"))
                
            if not column_exists("comments", "parent_id"):
                conn.execute(text("ALTER TABLE comments ADD COLUMN parent_id INTEGER"))
                
            if not column_exists("comments", "parent_author"):
                conn.execute(text("ALTER TABLE comments ADD COLUMN parent_author VARCHAR(255)"))
                
            if not column_exists("post_images", "id"):
                conn.execute(text("ALTER TABLE post_images ADD COLUMN id INTEGER"))
                
            if not column_exists("post_images", "post_id"):
                conn.execute(text("ALTER TABLE post_images ADD COLUMN post_id INTEGER"))
            
            if not column_exists("post_images", "url"):
                conn.execute(text("ALTER TABLE post_images ADD COLUMN url VARCHAR(300)"))
                
            if not column_exists("post_images", "order"):
                conn.execute(text("ALTER TABLE post_images ADD COLUMN order INTEGER"))
                
            if not column_exists("messages", "id"):
                conn.execute(text("ALTER TABLE messages ADD COLUMN id INTEGER"))
                
            if not column_exists("messages", "sender_username"):
                conn.execute(text("ALTER TABLE messages ADD COLUMN sender_username VARCHAR(50)"))
                
            if not column_exists("messages", "content"):
                conn.execute(text("ALTER TABLE messages ADD COLUMN content VARCHAR(2000)"))
                
            if not column_exists("messages", "created_at"):
                conn.execute(text("ALTER TABLE messages ADD COLUMN created_at VARCHAR(20)"))
                
            if not column_exists("messages", "is_read"):
                conn.execute(text("ALTER TABLE messages ADD COLUMN is_read INTEGER DEFAULT 0"))
                
            if not column_exists("messages", "parent_id"):
                conn.execute(text("ALTER TABLE messages ADD COLUMN parent_id INTEGER"))
                
            if not column_exists("messages", "root_id"):
                conn.execute(text("ALTER TABLE messages ADD COLUMN root_id INTEGER"))
            
            conn.commit()
            print("All missing columns added successfully!")
    except Exception as e:
        print(f"Error adding columns: {str(e)}")

fix_missing_columns()

metadata.create_all(engine)