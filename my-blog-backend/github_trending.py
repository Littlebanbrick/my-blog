import requests
from bs4 import BeautifulSoup
import os
import asyncio
from datetime import datetime, timezone, timedelta
from database import database, posts, post_images, likes, comments, recent_repos

TZ_BEIJING = timezone(timedelta(hours=8))
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1"

def beijing_date() -> str:
    """返回北京时间今天的日期字符串 YYYY-MM-DD"""
    return datetime.now(TZ_BEIJING).strftime("%Y-%m-%d")

def fetch_github_trending():
    """抓取 GitHub Trending 页面，返回前三个仓库信息"""
    url = "https://github.com/trending"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    try:
        resp = requests.get(url, headers=headers, timeout=15)
        if resp.status_code != 200:
            print(f"Failed to fetch trending: {resp.status_code}")
            return []

        soup = BeautifulSoup(resp.text, "lxml")
        repos = []
        # 选取所有文章卡片
        articles = soup.select("article.Box-row")[:12]  # 取前12个，保证至多去重9个之后仍有可选
        for article in articles:
            # 仓库名
            h2 = article.select_one("h2")
            if not h2:
                continue
            full_name = h2.get_text(strip=True).replace(" ", "").replace("\n", "")
            # 描述
            desc_p = article.select_one("p[class*='col-9']")
            description = desc_p.get_text(strip=True) if desc_p else ""
            # 语言
            lang_span = article.select_one("span[itemprop='programmingLanguage']")
            language = lang_span.get_text(strip=True) if lang_span else "Unknown"
            # 今日 stars
            stars_span = article.select_one("span.d-inline-block.float-sm-right")
            stars_today = stars_span.get_text(strip=True) if stars_span else "0"
            # 总 stars
            total_stars = article.select_one("a[href*='/stargazers']")
            total_stars_text = total_stars.get_text(strip=True) if total_stars else "0"

            repos.append({
                "full_name": full_name,
                "description": description,
                "language": language,
                "stars_today": stars_today,
                "total_stars": total_stars_text
            })
        return repos
    except Exception as e:
        print(f"Trending scraping error: {e}")
        return []

def generate_trending_summary(repos):
    """用 LLM 生成英文总结"""
    if not repos:
        return "No trending repos found today."

    # 构建简洁的仓库描述
    repo_lines = []
    for r in repos:
        repo_lines.append(f"- **{r['full_name']}** ({r['language']}, {r['total_stars']} total stars, {r['stars_today']} today): {r['description']}")

    prompt = f"""Here are the top 3 trending GitHub repositories right now.
Write a brief, engaging summary (about 200-250 words) in English.
For each project, explain what it does and why it's interesting.
End with a short recommendation for developers.

Repositories:
{chr(10).join(repo_lines)}"""

    if not DEEPSEEK_API_KEY:
        return "LLM not configured."

    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "deepseek-v4-flash",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7,
        "max_tokens": 3000
    }

    try:
        resp = requests.post(
            f"{DEEPSEEK_BASE_URL}/chat/completions",
            headers=headers,
            json=payload,
            timeout=180
        )
        if resp.status_code == 200:
            return resp.json()["choices"][0]["message"]["content"]
        else:
            return f"LLM error: {resp.status_code} {resp.text}"
    except Exception as e:
        return f"LLM request failed: {e}"

async def update_trending_post():
    """抓取 → 去重 → 生成新帖 → 插入成功后再删除旧 GTT → 记录仓库 → 清理旧记录"""
    from main import database, posts, get_current_time

    # 防重复：若今天已有 GTT 帖子则跳过
    today_start = beijing_date() + " 00:00:00"
    existing = await database.fetch_one(
        posts.select()
        .where(posts.c.title == "🤖 GitHub Trending Today")
        .where(posts.c.date >= today_start)
    )
    if existing:
        print(f"GTT already exists for {beijing_date()}, skipping.")
        return

    # 1. 抓取当前 Top 仓库（失败则保留旧帖，不做任何删除）
    all_repos = fetch_github_trending()
    if not all_repos:
        print("Scraping failed — old GTT preserved, no new post generated.")
        return

    # 2. 获取近 3 天已出现的仓库名（去重用）
    recent = await get_recent_repos(days=3)

    # 3. 选择 3 个不重复的仓库
    selected = []
    for r in all_repos:
        if r["full_name"] not in recent:
            selected.append(r)
            if len(selected) == 3:
                break

    # 如果热门仓库太少，用剩余的不重复仓库补齐（可能允许重复）
    if len(selected) < 3:
        for r in all_repos:
            if r not in selected:
                selected.append(r)
                if len(selected) == 3:
                    break

    # 4. 生成 AI 摘要（LLM 失败则保留旧帖）
    summary = generate_trending_summary(selected)
    if summary.startswith("LLM error") or summary.startswith("LLM request failed"):
        print(f"LLM generation failed — old GTT preserved: {summary}")
        return

    now = get_current_time()

    # 5. 插入新帖子（必须先成功，再删旧的）
    query = posts.insert().values(
        date=now,
        title="🤖 GitHub Trending Today",
        preview=summary,
        location="Auto-generated by DeepSeek",
        comment_count=0,
        likes_count=0,
        word_count=f"{len(summary)} chars"
    )
    await database.execute(query)

    # 6. 新帖已落库，安全删除所有旧 GTT 帖子及其关联数据
    old_rows = await database.fetch_all(
        posts.select().where(posts.c.title == "🤖 GitHub Trending Today")
        .where(posts.c.date < today_start)  # 排除刚刚插入的新帖
    )
    for row in old_rows:
        post_id = row["id"]
        # 删除帖子图片文件
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
                    print(f"Deleted image file: {file_path}")
                except Exception as e:
                    print(f"Error deleting {file_path}: {e}")
        # 删除数据库记录
        await database.execute(post_images.delete().where(post_images.c.post_id == post_id))
        await database.execute(likes.delete().where(likes.c.post_id == post_id))
        await database.execute(comments.delete().where(comments.c.post_id == post_id))
        await database.execute(posts.delete().where(posts.c.id == post_id))

    # 7. 记录今天选中的仓库
    await save_today_repos([r["full_name"] for r in selected])

    # 8. 清理 3 天前的记录（只保留近 3 天）
    await clean_old_repos(days=3)

async def trending_scheduler():
    """每天 0 点（北京时间）执行一次"""
    while True:
        now = datetime.now(TZ_BEIJING)
        next_midnight = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
        wait_seconds = (next_midnight - now).total_seconds()
        await asyncio.sleep(wait_seconds)

        try:
            await update_trending_post()
        except Exception as e:
            print(f"Trending update failed: {e}")
            
async def get_recent_repos(days=3) -> set:
    """获取近 days 天内已出现在 GTT 中的仓库名称集合"""
    since_date = (datetime.now(TZ_BEIJING) - timedelta(days=days)).strftime("%Y-%m-%d")
    rows = await database.fetch_all(
        recent_repos.select().where(recent_repos.c.date >= since_date)
    )
    return {row["repo_name"] for row in rows}

async def save_today_repos(repo_names: list):
    """将今天选中的仓库名批量写入 recent_repos 表"""
    today_str = beijing_date()
    for name in repo_names:
        await database.execute(
            recent_repos.insert().values(repo_name=name, date=today_str)
        )

async def clean_old_repos(days=3):
    """删除 days 天前的仓库记录"""
    cutoff = (datetime.now(TZ_BEIJING) - timedelta(days=days)).strftime("%Y-%m-%d")
    await database.execute(
        recent_repos.delete().where(recent_repos.c.date < cutoff)
    )

def _ask_deepseek_sync(prompt: str, system_msg: str = "You are a helpful assistant.", 
                       max_tokens: int = 2000, timeout: int = 120) -> str:
    if not DEEPSEEK_API_KEY:
        return "DeepSeek API key is not configured."
    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "deepseek-v4-flash",
        "messages": [
            {"role": "system", "content": system_msg},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "max_tokens": max_tokens
    }
    try:
        resp = requests.post(
            f"{DEEPSEEK_BASE_URL}/chat/completions",
            headers=headers,
            json=payload,
            timeout=timeout
        )
        if resp.status_code == 200:
            return resp.json()["choices"][0]["message"]["content"]
        else:
            return f"Sorry, the AI service returned an error (status {resp.status_code})."
    except Exception as e:
        return f"Sorry, AI request failed: {e}"

async def ask_deepseek(question: str) -> str:
    """异步调用 DeepSeek，通过线程池执行同步请求"""
    return await asyncio.to_thread(_ask_deepseek_sync, question)

# 无上下文版本
async def process_deepseek_reply(post_id: int, parent_comment_id: int, user_question: str, asker_name: str):
    from main import database, posts, comments, get_current_time
    try:
        question = user_question[len("@deepseek"):].strip()
        if not question:
            return
        answer = await asyncio.to_thread(
            _ask_deepseek_sync,
            prompt=question,
            system_msg="You are a helpful assistant answering questions about GitHub trending repositories. Keep answers concise. No markdown format should be used.",
            max_tokens=2000,
            timeout=120
        )
        now = get_current_time()
        insert_query = comments.insert().values(
            post_id=post_id,
            author="DeepSeek",
            content=f"{answer}",
            created_at=now,
            parent_id=parent_comment_id,
            parent_author=asker_name
        )
        await database.execute(insert_query)
        await database.execute(
            posts.update().where(posts.c.id == post_id).values(
                comment_count=posts.c.comment_count + 1
            )
        )
    except Exception as e:
        print(f"DeepSeek reply error: {e}")
        
async def process_deepseek_context_reply(post_id: int, parent_comment_id: int, user_question: str, asker_name: str):
    from main import database, posts, comments, get_current_time
    try:
        question = user_question[len("@deepseek-context"):].strip()
        if not question:
            return
        post = await database.fetch_one(posts.select().where(posts.c.id == post_id))
        if not post:
            return
        gtt_content = post["preview"]
        prompt = f"""You are a helpful assistant that answers questions about today's GitHub Trending repositories.
Here is today's GitHub Trending summary for reference:
---
{gtt_content}
---
Based on the above summary, answer the user's question. Be concise and informative.
User question: {question}"""
        answer = await asyncio.to_thread(
            _ask_deepseek_sync,
            prompt=prompt,
            system_msg="You are a helpful assistant that answers questions based on the provided GitHub Trending context. No markdown format should be used.",
            max_tokens=5000,
            timeout=300
        )
        now = get_current_time()
        insert_query = comments.insert().values(
            post_id=post_id,
            author="DeepSeek",
            content=f"{answer}",
            created_at=now,
            parent_id=parent_comment_id,
            parent_author=asker_name
        )
        await database.execute(insert_query)
        await database.execute(
            posts.update().where(posts.c.id == post_id).values(
                comment_count=posts.c.comment_count + 1
            )
        )
    except Exception as e:
        print(f"DeepSeek context reply error: {e}")

async def ensure_daily_gtt():
    """每小时检查一次，如果当天没有 GTT 帖子则立即生成"""
    while True:
        await asyncio.sleep(3600)  # 每小时一次
        try:
            from main import database, posts
            today_start = beijing_date() + " 00:00:00"   # 北京时间今日开始
            # 查询今天是否已有 GTT 帖子
            existing = await database.fetch_one(
                posts.select()
                .where(posts.c.title == "🤖 GitHub Trending Today")
                .where(posts.c.date >= today_start)
            )
            if not existing:
                print(f"Compensating missing GTT for {beijing_date()}")
                await update_trending_post()
        except Exception as e:
            print(f"Daily GTT compensation check error: {e}")
