# add_test_posts.py
from database import engine, posts
from sqlalchemy import insert
from datetime import datetime

test_posts = [
    {
        "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "title": "欢迎来到我的博客",
        "preview": "这是我的第一篇测试文章。在这里可以分享技术心得、生活感悟等内容。",
        "location": "杭州",
        "comment_count": 0,
        "likes_count": 0,
        "word_count": "50"
    },
    {
        "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "title": "React 学习笔记",
        "preview": "React 是一个用于构建用户界面的 JavaScript 库。本文记录了一些核心概念和实践经验。",
        "location": "线上",
        "comment_count": 0,
        "likes_count": 0,
        "word_count": "120"
    },
    {
        "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "title": "Python FastAPI 入门",
        "preview": "FastAPI 是一个现代、快速的 Web 框架，用于构建 API。本文介绍其基本用法。",
        "location": "上海",
        "comment_count": 0,
        "likes_count": 0,
        "word_count": "200"
    }
]

with engine.connect() as conn:
    for post in test_posts:
        stmt = insert(posts).values(**post)
        conn.execute(stmt)
    conn.commit()

print(f"成功插入 {len(test_posts)} 条测试帖子。")
