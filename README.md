# Littlebanbrick's Full-Stack Blog

> **Notice**: This dynamic blog is planned to cease maintenance in **August 2026**, while the source code will remain intact on **GitHub**.

A modern, fully-featured personal blog platform built from scratch. It allows you to write and manage posts, interact with visitors through comments and likes, showcase your photography and projects, and even enjoy music integration – all while being easily deployable via Docker and automatically updated with CI/CD.

## Features

- **Rich Content Creation**: Markdown editor for posts and study notes, with syntax highlighting and HTML support.
- **Engagement**: Nested comments with replies, post likes, and a contact/messaging system between admin and users (with unread notifications).
- **Media Management**: Upload images for posts and a photography portfolio; look up songs via QQ Music API or upload MP3 for a customizable music player (APlayer + Meting).
- **Admin Dashboard**: Manage posts, comments, projects, notes, and music via an intuitive admin interface.
- **CLI Chatbot**: A fun terminal-style chatbot with custom commands (whoami, whatis, etc.).
- **GitHub Trending Digest**: Automatically fetches daily trending repositories and generates an AI-powered summary using DeepSeek.
- **Dark Mode**: Follows system preference; all components adapt beautifully.
- **Security**: JWT authentication (httpOnly cookies), email verification, CSRF protection, login rate limiting.
- **DevOps Ready**: Docker containerization for frontend (Nginx + React) and backend (FastAPI); GitHub Actions workflows for continuous deployment.
- **Remote Post Creation API**: Expose blog post creation as a REST endpoint with API key authentication, allowing AI assistants (Cursor, Claude Desktop) to create posts remotely.

## Tech Stack

| Frontend                   | Backend                     | Database                                       | DevOps                 |
| -------------------------- | --------------------------- | ---------------------------------------------- | ---------------------- |
| React (Vite)               | FastAPI (Python)            | SQLite (with SQLAlchemy, PostgreSQL-swappable) | Docker, Docker Compose |
| Bulma CSS                  | SQLAlchemy Core + databases |                                                | GitHub Actions         |
| React Router               | JWT, bcrypt                 |                                                | Nginx                  |
| APlayer, DOMPurify, Meting |                             |                                                |                        |

## Getting Started

### Prerequisites

- Docker & Docker Compose installed on your machine or server.
- A domain name and valid SSL certificate if deploying to production (see deployment notes below).

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/Littlebanbrick/my-blog.git
   cd my-blog
   ```
2. Create an `.env` file from the provided template and fill in your secrets:

   ```bash
   cp .env.example .env
   # edit .env with JWT_SECRET_KEY, ADMIN_SECRET_KEY, email credentials, etc.
   ```

   > **Important**: See the [Environment Variables](#environment-variables) table below for the full list.

3. Build and start all services:
   ```bash
   docker compose up -d --build
   ```
4. Open `http://localhost` in your browser. All API requests are proxied through Nginx on port 80; the backend is **not** directly exposed to the host.

### First-time Admin Setup

After the services are running, you need to create an admin user in the database:

```bash
# Open a shell in the running backend container
docker exec -it my-blog-backend-1 python3
```

```python
import asyncio
from database import database, users
from main import get_password_hash

async def init_admin():
    await database.connect()
    query = users.insert().values(
        username="admin",
        email="admin@blog.com",
        hashed_password=get_password_hash("your-admin-password"),
        role="admin",
        is_verified=1
    )
    await database.execute(query)
    print("Admin user created.")
    await database.disconnect()

asyncio.run(init_admin())
```

After that, you can log in via `/api/admin/login` using the `ADMIN_SECRET_KEY` from your `.env`.

### Deployment to Cloud Server

- The project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that deploys to your server on push to `main`. Configure the required secrets (`REMOTE_HOST`, `REMOTE_USER`, `SSH_PRIVATE_KEY`) in your GitHub repository.
- On your server, clone the repository and set up the `.env`:
  ```bash
  cd ~/blog && git clone https://github.com/Littlebanbrick/my-blog.git
  cd my-blog
  # create .env with your secrets
  docker compose up -d --build
  ```
- **SSL Certificate**: The included Nginx configuration and certbot service assume a Let's Encrypt setup for `littlebanbrick.cn`. For other domains, modify `nginx.conf` and run certbot manually first:
  ```bash
  docker compose run --rm certbot certonly --webroot -w /var/www/certbot -d yourdomain.com
  ```
  Then update the `ssl_certificate` paths in `nginx.conf` accordingly.
- Subsequent updates are handled automatically via the CI/CD workflow.

## Project Structure

```
my-blog/
├── my-blog-frontend/          # React app
│   ├── src/                   # Components, utils, styles
│   ├── public/                # Static assets (APlayer, Meting libs, images)
│   ├── Dockerfile
│   └── nginx.conf
├── my-blog-backend/           # FastAPI app
│   ├── main.py                # API endpoints
│   ├── database.py            # Database models & schema migration
│   ├── github_trending.py     # Trending scraper & AI summary
│   └── static/                # Uploaded files (photos, music, post images)
├── learning_notes/            # Development notes & documentation
├── data/                      # SQLite database (persistent volume)
├── .github/workflows/
│   └── deploy.yml             # CI/CD deployment workflow
├── requirements.txt           # Python dependencies (shared between root & backend)
├── package.json               # Node.js dev dependencies (prettier, etc.)
├── docker-compose.yml
├── .env.example
└── update.ps1                 # Local update script (Windows)
```

## Environment Variables

| Variable            | Required  | Description                                                                    |
| ------------------- | --------- | ------------------------------------------------------------------------------ |
| `JWT_SECRET_KEY`    | Yes       | Key for signing JWT tokens (generate with `openssl rand -hex 32`)              |
| `ADMIN_SECRET_KEY`  | Yes       | Secret key for admin login via `/api/admin/login`                              |
| `SENDER_EMAIL`      | For email | Email address for sending verification emails (163.com)                        |
| `SENDER_AUTH_CODE`  | For email | SMTP authorization code for the sender email                                   |
| `DEEPSEEK_API_KEY`  | For AI    | DeepSeek API key for GitHub Trending summaries and `@deepseek` comment replies |
| `MCP_SECRET_KEY`    | No        | Key for remote post creation API authentication                                |
| `FRONTEND_BASE_URL` | Yes       | Public URL of your frontend (used in email verification links)                 |
| `ENV`               | Yes       | Set to `production` for HTTPS cookies, `development` otherwise                 |

## Contributing

Contributions are welcome! Please open an issue or submit a pull request. For major changes, discuss first.

## License

MIT license
