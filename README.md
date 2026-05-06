# Littlebanbrick's Full-Stack Blog

A modern, fully-featured personal blog platform built from scratch. It allows you to write and manage posts, interact with visitors through comments and likes, showcase your photography and projects, and even enjoy music integration – all while being easily deployable via Docker and automatically updated with CI/CD.

## Features

- **Rich Content Creation**: Markdown editor for posts and study notes, with syntax highlighting and HTML support.
- **Engagement**: Nested comments with replies, post likes, and a contact/messaging system between admin and users (with unread notifications).
- **Media Management**: Upload images for posts and a photography portfolio; upload MP3 for a customizable music player (APlayer).
- **Admin Dashboard**: Manage posts, comments, projects, notes, and music via an intuitive admin interface.
- **CLI Chatbot**: A fun terminal-style chatbot with custom commands (whoami, whatis, etc.).
- **GitHub Trending Digest**: Automatically fetches daily trending repositories and generates an AI-powered summary using DeepSeek.
- **Dark Mode**: Follows system preference; all components adapt beautifully.
- **Security**: JWT authentication, email verification, CSRF protection, login rate limiting.
- **DevOps Ready**: Docker containerization for frontend (Nginx + React) and backend (FastAPI); GitHub Actions workflows for continuous deployment.
- **MCP Integration**: Expose blog functions as MCP tools, allowing AI assistants (Cursor, Claude Desktop) to create posts remotely.

## Tech Stack

| Frontend | Backend | Database | DevOps |
|----------|---------|----------|--------|
| React (Vite) | FastAPI (Python) | SQLite (production-ready with PostgreSQL easy swap) | Docker, Docker Compose |
| Bulma CSS | SQLAlchemy | | GitHub Actions |
| React Router | JWT, bcrypt | | Nginx |
| APlayer, DOMPurify | | | |

## Getting Started

### Prerequisites
- Docker & Docker Compose installed on your machine or server.

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
3. Build and start all services:
   ```bash
   docker compose up -d --build
   ```
4. Open `http://localhost` in your browser. The frontend runs on port 80, backend API on port 8000.

### Deployment to Cloud Server
- The project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically deploys to your server on push to `main`. Configure the required secrets (`REMOTE_HOST`, `REMOTE_USER`, `SSH_PRIVATE_KEY`) in your GitHub repository.
- On your server, simply clone the repository, set up the `.env`, and run `docker compose up -d --build`. The CI/CD will handle subsequent updates.

## Project Structure
```
my-blog/
├── my-blog-frontend/          # React app
│   ├── src/                   # Components, utils, styles
│   ├── public/                # Static assets
│   ├── Dockerfile
│   └── nginx.conf
├── my-blog-backend/           # FastAPI app
│   ├── main.py                # API endpoints
│   ├── database.py            # ORM models
│   ├── github_trending.py     # Trending scraper & AI summary
│   ├── static/                # Uploaded files (images, music)
│   ├── Dockerfile
│   └── requirements.txt
├── docker-compose.yml
├── .env.example
└── .github/workflows/deploy.yml
```

## Environment Variables
| Variable | Description |
|----------|-------------|
| `JWT_SECRET_KEY` | Key for signing JWT tokens (generate with `openssl rand -hex 32`) |
| `ADMIN_SECRET_KEY` | Secret key for admin login via `/api/admin/login` |
| `SENDER_EMAIL` | Email address for sending verification emails (163.com) |
| `SENDER_AUTH_CODE` | SMTP authorization code for the sender email |
| `MCP_SECRET_KEY` | Key for MCP server authentication (optional) |
| `FRONTEND_BASE_URL` | Public URL of your frontend (used in email links) |
| `ENV` | Set to `production` for HTTPS cookies, `development` otherwise |

## Running Tests (Coming Soon)
Currently, tests are under development. You can manually verify all endpoints by importing the provided Postman collection.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request. For major changes, discuss first.

## License
This project is open source, which will be available under the MIT License in the near future.