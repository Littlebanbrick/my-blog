# MCP-Enabled Agent for Auto-Posting and AI-Generated GitHub Trending Analysis
# 基于 MCP 的 Agent 自动发帖与 AI 生成 GitHub Trending 分析

> **What is MCP (Model Context Protocol)?**  
> **什么是 MCP（模型上下文协议）？**
>
> **MCP:** An open protocol standardised by Anthropic that allows AI models (like those inside Cursor) to interact with external tools and data sources through a unified interface. An MCP **Server** exposes specific capabilities — such as reading files, querying APIs, or in our case, publishing blog posts. An MCP **Client** (the AI host, e.g., Cursor) can discover and call these tools dynamically, turning natural‑language instructions into concrete actions without the user ever leaving the editor.  
> **MCP：** 由 Anthropic 标准化的开放协议，它使 AI 模型（如 Cursor 内置的模型）能够通过统一接口与外部工具和数据源交互。一个 MCP **Server** 暴露特定的能力——比如读取文件、查询 API，或是我们接下来的场景：发布博客帖子。MCP **Client**（AI 宿主，例如 Cursor）可以动态发现并调用这些工具，将自然语言指令转化为具体操作，用户无需离开编辑器。

<span style="color:grey">In this doc, I demonstrate how I built an MCP tool that lets me publish blog posts directly from Cursor via natural language. I also detail a scheduled pipeline that automatically fetches GitHub Trending repositories, summarises them using DeepSeek, and updates the blog every midnight (Beijing time).</span>  
<span style="color:grey">在本文中，我将展示如何构建一个 MCP 工具，使我能够通过自然语言直接在 Cursor 中发布博客帖子。同时，我也会详细说明一个定时流水线，它每天（北京时间午夜）自动抓取 GitHub Trending 仓库、使用 DeepSeek 生成总结并更新博客。</span>

## Why MCP and automated trending posts?
## 为什么需要 MCP 和自动化 Trending 帖子？

Previously, publishing a blog post required logging into a custom admin panel, filling a form, and manually handling CSRF tokens. This broke the writing flow — switching from the editor to a browser, copy‑pasting Markdown, and verifying the result. With an MCP‑exposed endpoint and a simple tool definition, I can now type a sentence like *“Post a new article titled ‘Hello World’ with preview ‘This is a test’”* directly in Cursor’s chat, and the post appears on my blog seconds later. The agent handles authentication, HTTP calls, and error reporting automatically.  
此前，发布一篇博客需要登录自定义管理后台，填写表单并手动处理 CSRF 令牌。这打断了写作流——从编辑器切换到浏览器，复制粘贴 Markdown，再验证结果。有了 MCP 暴露的端点和一个简单的工具定义，我现在可以直接在 Cursor 的对话中输入 *“Post a new article titled ‘Hello World’ with preview ‘This is a test’”*，几秒钟后帖子就出现在我的博客上。Agent 可以自动处理认证、HTTP 调用和错误报告。

The second part — automated GitHub Trending summaries — grew from a desire to keep the blog fresh without routine manual effort. By combining web scraping, a large language model (DeepSeek), and the same internal blog API, the site now re‑publishes a daily “🤖 GitHub Trending Today” post every midnight. Readers get a concise, AI‑written summary of the top three trending repositories, and I get a set‑and‑forget content pipeline.  
第二部分——自动化 GitHub Trending 总结——源于希望博客能保持新鲜感而无须日常手工操作。通过将网页抓取、大语言模型（DeepSeek）和同一个内部博客 API 组合起来，网站现在每天午夜重新发布一篇“🤖 GitHub Trending Today”帖子。读者可以得到由 AI 撰写的前三个热门仓库的简洁总结，而我则拥有了一条设置好即可忘掉的内容流水线。

## Exposing a blog‑posting tool via MCP
## 通过 MCP 暴露博客发布工具

### 1. The MCP Server (server.py) / MCP 服务器（server.py）

The server is a minimal Python script using the `mcp` library. It declares a single tool, `create_blog_post`, and forwards calls to the blog’s internal HTTP API protected by a static key. This key is injected via the environment variable `MCP_SECRET_KEY`, which is also expected by the backend’s `/api/mcp/create-post` route.  
该 Server 是一个使用 `mcp` 库的轻量 Python 脚本。它声明了单个工具 `create_blog_post`，并将调用转发到由静态密钥保护的博客内部 HTTP API。该密钥通过环境变量 `MCP_SECRET_KEY` 注入，后端 `/api/mcp/create-post` 路由同样期望这个密钥。

```python
# server.py (abridged)
import json, os, requests
from mcp.server import Server
from mcp.types import Tool, TextContent

API_BASE = "http://8.149.141.64/api"
MCP_KEY = os.getenv("MCP_SECRET_KEY")

def create_post(title: str, preview: str, location: str = "", images: list = None):
    headers = {"X-MCP-Key": MCP_KEY, "Content-Type": "application/json"}
    payload = {"title": title, "preview": preview, "location": location, "images": images or []}
    resp = requests.post(f"{API_BASE}/mcp/create-post", headers=headers, json=payload)
    data = resp.json()
    if resp.status_code == 200 and data.get("code") == 200:
        return f"Post '{title}' published successfully!"
    return f"Failed to create post: {data.get('msg', resp.text)}"

app = Server("blog-mcp")

@app.list_tools()
async def list_tools():
    return [Tool(
        name="create_blog_post",
        description="Publish a new blog post. Requires title and preview...",
        inputSchema={...}
    )]

@app.call_tool()
async def call_tool(name, arguments):
    if name == "create_blog_post":
        result = create_post(**arguments)
        return [TextContent(type="text", text=result)]
    ...
```

The tool schema specifies required fields (`title`, `preview`) and optional ones (`location`, `images`), allowing the AI model to know exactly what information to ask the user.  
工具模式中明确了必填字段（`title`, `preview`）和可选字段（`location`, `images`），使得 AI 模型能确切了解需要向用户索取哪些信息。

### 2. Backend adaptation: a CSRF‑free route / 后端适配：一个无 CSRF 的路由

Because the MCP Server cannot participate in the browser’s CSRF lifecycle, the blog backend exposes a separate endpoint (`/api/mcp/create-post`) that validates the `X-MCP-Key` header instead of a CSRF token. This keeps the standard form‑based creation flow intact while giving the automated tool a secure alternative.  
由于 MCP Server 无法参与浏览器的 CSRF 生命周期，博客后端暴露了一个单独的端点（`/api/mcp/create-post`），它验证 `X-MCP-Key` 请求头而非 CSRF 令牌。这保持了一般的表单式创建流程不变，同时为自动化工具提供了一个安全的替代方案。

```python
# main.py (backend)
@app.post("/api/mcp/create-post")
async def mcp_create_post(post: PostCreate, request: Request):
    mcp_key = request.headers.get("X-MCP-Key")
    if mcp_key != MCP_SECRET_KEY or not mcp_key:
        raise HTTPException(status_code=403, detail="Invalid MCP key")
    return await _create_post(post)
```

### 3. Connecting Cursor to the MCP Server / 将 Cursor 连接到 MCP Server

Cursor’s MCP integration is configured through a JSON file (usually `mcp.json`). Here I specify a `stdio` transport that launches `python` with the server script. Cursor then handles all the process lifecycle and communication automatically.  
Cursor 的 MCP 集成通过一个 JSON 文件（通常是 `mcp.json`）进行配置。这里我指定了一个 `stdio` 传输方式，它会用 Python 启动 Server 脚本。Cursor 随后自动处理所有的进程生命周期和通信。

```json
{
  "mcpServers": {
    "blog": {
      "name": "Blog Manager",
      "type": "stdio",
      "command": "python",
      "args": ["C:\\Users\\Littlebanbrick\\desktop\\my-blog\\server.py"]
    }
  }
}
```

**Usage flow:** When I ask Cursor’s agent to “create a post titled X with body Y”, the agent discovers the `create_blog_post` tool, prompts me for any missing arguments, and executes the call. In my initial test, the built‑in MCP bridge reported a proxy misconfiguration, so the fallback path executed the same HTTP logic directly from the script — nevertheless, the tool integration worked end‑to‑end.  
**使用流程：** 当我让 Cursor 的 Agent“创建一个标题为 X、内容为 Y 的帖子”时，Agent 发现 `create_blog_post` 工具，提示我补充缺失的参数，然后执行调用。在初次测试中，内建 MCP 桥接报告了代理配置错误，因此回退路径直接从脚本执行了相同的 HTTP 逻辑——但工具集成端到端仍然正常工作。

## Automating GitHub Trending summaries
## 自动化 GitHub Trending 总结

### 1. Fetching trending repositories / 抓取 Trending 仓库

The function `fetch_github_trending()` scrapes the GitHub Trending page (`github.com/trending`) using `requests` and `BeautifulSoup`. It extracts the top three repositories' names, descriptions, languages, total stars, and today’s star count.  
函数 `fetch_github_trending()` 使用 `requests` 和 `BeautifulSoup` 抓取 GitHub Trending 页面（`github.com/trending`），并提取前三个仓库的名称、描述、语言、总 star 数和今日新增 star 数。

```python
def fetch_github_trending():
    url = "https://github.com/trending"
    headers = {"User-Agent": "Mozilla/5.0 ..."}
    resp = requests.get(url, headers=headers, timeout=15)
    soup = BeautifulSoup(resp.text, "lxml")
    repos = []
    for article in soup.select("article.Box-row")[:3]:
        # ... extract fields
        repos.append({...})
    return repos
```

### 2. Generating an AI summary with DeepSeek / 使用 DeepSeek 生成 AI 总结

The raw repository data is formatted into a prompt and sent to the DeepSeek API (`deepseek-v4-flash`). The prompt asks for an engaging 200‑250 word summary in English, with a short recommendation for developers.  
原始仓库数据被格式化为提示词，并发送至 DeepSeek API（`deepseek-v4-flash`）。提示词要求生成一段约 200–250 词的英文总结，并附上一小段给开发者的推荐。

```python
prompt = f"""Here are the top 3 trending GitHub repositories right now.
Write a brief, engaging summary (about 200-250 words) in English...
Repositories:
{chr(10).join(repo_lines)}"""

resp = requests.post(
    f"{DEEPSEEK_BASE_URL}/chat/completions",
    headers={"Authorization": f"Bearer {DEEPSEEK_API_KEY}"},
    json={"model": "deepseek-v4-flash", "messages": [...]}
)
```

### 3. Updating the blog post / 更新博客帖子

The function `update_trending_post()` is the glue. It deletes the previous trending post (identified by the fixed title “🤖 GitHub Trending Today”), fetches the latest repos, generates the summary, and inserts a new post directly into the blog’s database. This bypasses the HTTP API entirely because the function runs inside the same FastAPI application — it can reuse the same database connection pool and utility functions.  
函数 `update_trending_post()` 是粘合剂。它删除上一篇 Trending 帖子（通过固定标题“🤖 GitHub Trending Today”识别），获取最新的仓库，生成总结，并将新帖子直接写入博客数据库。由于该函数运行在同一个 FastAPI 应用内部，它可以复用数据库连接池和工具函数，完全绕过 HTTP API。

```python
async def update_trending_post():
    await database.execute(posts.delete().where(posts.c.title == "🤖 GitHub Trending Today"))
    repos = fetch_github_trending()
    summary = generate_trending_summary(repos)
    now = get_current_time()
    query = posts.insert().values(date=now, title="🤖 GitHub Trending Today",
                                  preview=summary, location="Auto-generated by DeepSeek", ...)
    await database.execute(query)
```

### 4. The daily scheduler / 每日定时器

A lightweight async loop (`trending_scheduler`) calculates the seconds until the next midnight (Beijing time) and sleeps. When it wakes, it invokes `update_trending_post()` and then recalculates the next trigger. This loop runs inside the same Uvicorn process that serves the blog, so no external cron job or GitHub Action is needed.  
一个轻量级异步循环（`trending_scheduler`）计算距离下一个北京时间午夜的秒数并休眠。唤醒后，它调用 `update_trending_post()`，然后重新计算下一次触发时间。该循环与服务博客的 Uvicorn 进程在同一进程内运行，因此不需要外部 cron 或 GitHub Action。

```python
async def trending_scheduler():
    while True:
        now = datetime.now(TZ_BEIJING)
        next_midnight = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
        wait_seconds = (next_midnight - now).total_seconds()
        await asyncio.sleep(wait_seconds)
        try:
            await update_trending_post()
        except Exception as e:
            print(f"Trending update failed: {e}")
```

## Appendix1: Extending the system — ideas and future-proofing
## 附录1：扩展系统——灵感与预留设计

The current MCP setup is intentionally minimal — it only creates posts. However, the protocol is designed for growth. Possible future tools include:  
当前的 MCP 设置刻意保持最小化——它只创建帖子。但协议本身是为扩展而设计的。未来可添加的工具包括：

- **Cyber‑audit:** An MCP tool that runs periodically (or as a background process) to scan new comments for toxic, violent, or pornographic content, and automatically deletes or flags them. This would require converting the MCP Server from a one‑shot script into a long‑running process that can both answer on‑demand tool calls and execute scheduled checks.  
  **赛博审核：** 一个定期运行（或作为后台进程）的 MCP 工具，扫描新评论中的不良、暴力或色情内容，并自动删除或标记。这需要将 MCP Server 从一次性脚本转化为一个长期运行的进程，既能响应按需工具调用，又能执行定期检查。

- **Analytics summary:** A command like “Summarise this week’s blog traffic” could trigger a tool that queries server logs and returns a simple report.  
  **统计数据总结：** 诸如“总结本周博客流量”之类的命令可以触发一个工具，查询服务器日志并返回简单报告。

- **Draft approval:** The agent could create a post in “draft” mode, send a preview to a private Telegram channel, and wait for explicit confirmation before publishing.  
  **草稿审批：** Agent 可以以“草稿”模式创建帖子，将预览发送到私有 Telegram 频道，等待明确确认后再发布。

To support background workloads like cyber‑audit, the MCP Server can be adapted to run inside a persistent process (e.g., a small FastAPI sub‑app or an `asyncio` service) while still exposing its tools over `stdio` or a future network transport. The cleanup of the proxy issue in Cursor’s built‑in bridge will also be investigated in parallel, as it currently forces a direct HTTP fallback — but the architectural separation remains sound.  
为了支持赛博审核这类后台工作负载，MCP Server 可以改造为在持久进程中运行（例如一个轻量 FastAPI 子应用或 `asyncio` 服务），同时依然通过 `stdio` 或未来的网络传输暴露其工具。Cursor 内建桥接的代理问题也将同步排查，因为它目前强制回退到直接 HTTP 路径——但架构层面的分离始终是合理的。

The daily trending pipeline is already self‑contained and resilient: failures are caught and logged, and the scheduler never exits. Future enhancements could include sending a webhook notification when the summary post is live, or expanding to summarise weekly/monthly trends in addition to the daily one.  
每日 Trending 流水线已自成一体且具备韧性：异常被捕获并记录，调度器永不退出。未来的增强功能可以包括在总结帖子发布后发送 webhook 通知，或在每日总结之外扩展出每周/每月的趋势总结。

## Appendix2: Choosing an MCP Tool and Framework
## 附录2：MCP 工具与框架的选择

A natural question that arises from this project is: why use Cursor's built‑in MCP agent instead of **Claude Code**, which is often cited as a superior terminal‑native coding agent? The answer, for this particular setup, involves a mix of practical constraints and a broader survey of the MCP ecosystem.  
从本项目中自然会引出一个问题：为什么使用 Cursor 内置的 MCP Agent，而不是常被誉为更强大的终端原生编程 Agent 的 **Claude Code**？这个选择背后，既有现实约束，也涉及对 MCP 生态的广泛审视。

### 1. Claude Code: what it is and why it remains aspirational / Claude Code：它是什么，为何仍令人向往

Claude Code is Anthropic's terminal‑native AI coding agent. Unlike IDE‑integrated assistants, it runs directly in the command line and can independently read codebases, execute shell commands, edit files, and interact with version control — all through natural‑language instructions. In benchmark comparisons, Claude Code has been praised for its strong global understanding of large projects and its ability to handle complex, multi‑file refactors autonomously. Many professional developers now adopt a "dual‑wielding" strategy — using Cursor for focused, real‑time editing, and Claude Code for heavy automated tasks where they can step away and return to review a completed feature.  
Claude Code 是 Anthropic 推出的终端原生 AI 编程 Agent。与集成在 IDE 中的助手不同，它直接在命令行中运行，能够独立阅读代码库、执行 Shell 命令、编辑文件、与版本控制交互——全部通过自然语言指令完成。在基准测试中，Claude Code 因其对大型项目的强大全局理解能力，以及自主处理复杂多文件重构的能力而备受赞誉。如今，许多专业开发者采用“双持”策略——使用 Cursor 进行专注的实时编辑，而将繁重的自动化任务交给 Claude Code，然后离开桌面，待回来时审视已完成的功能。

### 2. The practical barrier: Anthropic's regional restrictions / 现实障碍：Anthropic 的地区限制

Despite its strengths, Claude Code is effectively inaccessible to most developers in mainland China. As of late 2025, Anthropic formally restricted access to its services — including Claude Code, the Claude API, and the Claude web interface — from China and several other regions. The registration process requires an overseas phone number and email address, and domestic Chinese phone numbers are outright rejected. These restrictions effectively make Claude Code an unreliable choice for a production development environment on the Chinese mainland.  
尽管优势明显，但对于大多数中国大陆开发者而言，Claude Code 几乎无法使用。截至 2025 年底，Anthropic 正式限制了中国及其他几个地区对其服务的访问——包括 Claude Code、Claude API 和 Claude 网页端。注册流程需要海外手机号和邮箱，国内手机号会被直接拒绝。这些限制使得 Claude Code 实际上难以成为中国大陆生产开发环境的可靠选择。

Cursor, by contrast, is fully accessible without VPN workarounds. Since Cursor's agent mode can be configured to use alternative models (including DeepSeek) and supports MCP tool integration natively, it provides a functional proxy for most agent‑driven workflows — including the blog‑posting automation described in the main text — without requiring a Claude account.  
相比之下，Cursor 无需 VPN 即可完全访问。由于 Cursor 的 Agent 模式可以配置使用其他模型（包括 DeepSeek），并原生支持 MCP 工具集成，它在不依赖 Claude 账号的前提下，为大多数 Agent 驱动的工作流——包括正文中描述的博客自动发帖——提供了功能等效的替代方案。

### 3. Key differences in usage patterns / 使用模式的关键差异

Beyond the accessibility issue, the two tools embody different philosophies in the AI‑assisted development space. Cursor positions itself as an "AI‑native IDE + agent workbench": the default assumption is that most of the developer's time is spent inside the editor, and the AI serves editing, navigation, diff review, and real‑time completion. Claude Code, on the other hand, is closer to an "agentic coding tool" that reads the codebase, modifies files, runs commands, and connects to development tools — all from the terminal. A practical summary from the developer community: Cursor grants more control and is ideal for focused work where the developer remains an active participant; Claude Code excels at automated work where the developer can delegate a task and come back to review the result.  
除了可访问性问题，这两款工具在 AI 辅助开发领域也体现了不同的哲学。Cursor 将自己定位为“AI 原生 IDE + Agent 工作台”：其默认假设是，开发者大部分时间都在编辑器内，AI 服务于编辑、导航、diff 审查和实时补全。Claude Code 则更接近一个“Agents 编程工具”，阅读代码库、修改文件、运行命令、连接开发工具——这些都发生在终端中。开发者社区的一个实用总结：Cursor 给予更多掌控，适合开发者主动参与的专注性工作；Claude Code 则擅长自动化工作，开发者可以将任务委派出去，稍后回来审视结果。

In the current workflow — writing blog posts from within the editor and occasionally asking the agent to publish them via MCP — Cursor's IDE‑native integration is actually the more natural fit. If a future project demands autonomous, multi‑step refactoring, Claude Code (assuming regional restrictions ease) would be worth revisiting.  
在当前的工作流中——在编辑器内撰写博文，偶尔让 Agent 通过 MCP 将其发布——Cursor 的 IDE 原生集成实际上天然更为契合。如果未来的项目需要自主、多步骤的重构，Claude Code（假若地区限制放宽）将值得重新评估。

### 4. Other MCP‑compatible frameworks / 其他兼容 MCP 的框架

The MCP ecosystem extends well beyond Cursor and Claude Code. Several open‑source agent frameworks have incorporated MCP support, forming a growing landscape of options for different complexity levels. For a lightweight project like this blog automation, a few notable frameworks are worth mentioning:  
MCP 生态系统远不止 Cursor 和 Claude Code。多个开源代理框架已纳入 MCP 支持，为不同复杂程度的需求提供了日益丰富的选择。对于像博客自动化这样的轻量级项目，有几个值得注意的框架值得一提：

- **LangChain:** The most prominent Python‑based agent framework, providing a broad ecosystem of tools and integrations. Its MCP support allows developers to wire MCP servers into agent workflows alongside LangChain's own tooling.  
  **LangChain：** 最主流的 Python Agent 框架，提供了广泛的工具生态和集成。其 MCP 支持允许开发者将 MCP Server 与 LangChain 自身的工具一同接入 Agent 工作流。
- **CrewAI:** Focuses on multi‑agent workflows, where different agents specialise in specific subtasks and coordinate through defined role schemas. It is particularly well‑suited for orchestrating complex, multi‑step processes.  
  **CrewAI：** 专注于多 Agent 工作流，不同 Agent 各自专注特定子任务，并通过定义的角色模式进行协调。它特别适合编排复杂的多步骤流程。
- **AutoGen (Microsoft):** Designed for delegation patterns and task collaboration between multiple AI agents. It supports MCP alongside its native conversation‑based coordination mechanisms.  
  **AutoGen（Microsoft）：** 设计用于委托模式和多 AI Agent 之间的任务协作。它在原生对话式协调机制之外也支持 MCP。
- **FastMCP:** Rather than a full agent framework, FastMCP is a Python library that drastically simplifies the creation of MCP servers. It wraps the low‑level protocol implementations, allowing developers to define tools as decorated Python functions — much like the `server.py` in this project, but with less boilerplate. For building your own MCP server, FastMCP is the recommended starting point.  
  **FastMCP：** 并非完整的 Agent 框架，而是一个极大简化 MCP Server 创建的 Python 库。它将底层协议实现封装起来，开发者只需将被装饰的 Python 函数定义为工具——与本项目的 `server.py` 类似，但样板代码更少。如需构建自己的 MCP Server，FastMCP 是推荐的上手选择。

### 5. The feasibility of building your own MCP server / 自行实现 MCP Server 的可行性

As this project demonstrates, building a custom MCP server is not only feasible but also relatively straightforward. The minimum requirements are: (a) a Python (or Node.js, Go, Rust, etc.) script that declares tools with input schemas and descriptions; (b) a transport mechanism — `stdio` for local use, or HTTP/SSE for remote deployment; and (c) integration of the server into an MCP‑compatible client (Cursor, Claude Desktop, etc.) through a simple JSON configuration file. The official MCP SDK and community‑driven libraries like FastMCP have substantially lowered the barrier to entry.  
如本项目所展示的，构建自定义 MCP Server 不仅可行，而且相对简单。最低要求是：（a）一个 Python（或 Node.js、Go、Rust 等）脚本，声明了带有输入模式和描述的工具；（b）一个传输机制——本地使用 `stdio`，或远程部署使用 HTTP/SSE；（c）通过一个简洁的 JSON 配置文件，将 Server 集成到兼容 MCP 的客户端（Cursor、Claude Desktop 等）中。官方 MCP SDK 和 FastMCP 等社区驱动库已大幅降低了入门门槛。

For the current project, staying with a hand‑written `server.py` provides maximum transparency and control — every line is understood and modifiable. Should the toolset grow beyond a handful of functions (e.g., adding comment moderation, analytics queries, draft management), migrating to FastMCP or adopting a framework like LangChain would reduce maintenance overhead while preserving the same MCP interface.  
对于本项目而言，保留手写 `server.py` 提供了最大的透明度和可控性——每一行代码都可理解、可修改。如果工具集扩充到超过少量几个函数（例如，加入评论审核、统计查询、草稿管理），迁移到 FastMCP 或采用 LangChain 等框架将在降低维护负担的同时，保持相同的 MCP 接口。

The choice of tooling, ultimately, is subordinate to the goal: building a system that is reliable, maintainable, and accessible under the real constraints of one's development environment. Cursor + a custom MCP server achieves exactly that for this stage of the project.  
工具的选择，最终服务于目标：在真实的开发环境约束下，构建一个可靠、可维护、可访问的系统。Cursor + 自定义 MCP Server 的组合，在当前项目阶段恰恰实现了这一点。