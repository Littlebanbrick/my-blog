# Dockerization and ECS deployment
# Docker 化与 ECS 部署

> **What is dockerization and ECS?**  
> **什么是 Docker 化与 ECS？**
> 
> **Docker:** A platform that packages applications and their dependencies into lightweight, isolated containers. A container shares the host OS kernel but runs in its own user space, **ensuring consistent behaviour across different machines**.  
> **Docker：** 一个将应用及其依赖打包进轻量级、隔离的容器的平台。容器共享宿主操作系统的内核，但运行在自己的用户空间中，从而**确保在不同机器上行为一致**。
>
> **Dockerization:** The process of making an app runnable inside a Docker container. You write a Dockerfile (base image, copy files, install dependencies, set run command), run `docker build` to create an image, and then `docker run` on a Docker‑equipped host (like your ECS instance) to start the service.  
> **Docker 化：** 使应用能在 Docker 容器中运行的过程。你需要编写 Dockerfile（选择基础镜像、复制文件、安装依赖、设置启动命令），执行 `docker build` 生成镜像，然后在安装有 Docker 的主机（例如你的 ECS 实例）上通过 `docker run` 启动服务。
>
> **ECS (Elastic Compute Service):** An on‑demand virtual machine from Alibaba Cloud. You provision vCPUs, memory, and storage, then get full OS‑level root access over SSH. It’s “elastic” because you can resize it as needed and pay only for what you use.  
> **ECS（弹性计算服务）：** 阿里云提供的按需虚拟机。你分配 vCPU、内存和存储，随后可通过 SSH 获得完整的操作系统级 root 权限。之所以称其为“弹性”，是因为你可以按需调整实例规格，并只为实际使用的资源付费。

<span style="color:grey">In this doc, I will mainly show you how to dockerize and then deploy a personal blog website to the ECS.</span>   
<span style="color:grey">在本文中，我将主要展示如何将个人博客网站 Docker 化，然后部署到 ECS 上。</span>

## Why dockerization?
## 为什么需要 Docker 化？

I developed my personal blog website <span style="color:grey">littlebanbrick.cn</span> using FastAPI as the backend framework and React for the frontend. During local development, testing the site’s functionality required manually launching both services in separate terminals — running `uvicorn main:app --reload --host 0.0.0.0 --port 8000` for the backend and `npm run dev` for the frontend — a repetitive and error-prone workflow. Dockerization resolved these issues effectively: the entire codebase, together with all dependencies and config files, is packaged into container images. With a single `docker-compose up` command, both the frontend and backend services start in a unified, isolated environment, streamlining not only local testing but also the deployment process.  
我使用 FastAPI 作为后端框架、React 作为前端，开发了个人博客网站 <span style="color:grey">littlebanbrick.cn</span>。在本地开发过程中，每次测试网站功能都需要在两个终端中分别手动启动服务——用 `uvicorn main:app --reload --host 0.0.0.0 --port 8000` 启动后端，用 `npm run dev` 启动前端——这一流程重复且容易出错。Docker 化有效地解决了这些问题：整个代码库连同所有依赖和配置文件被打包进容器镜像。只需一条 `docker-compose up` 命令，前端和后端服务便在一个统一、隔离的环境中同时启动，不仅简化了本地测试，也简化了部署流程。

## How to dockerize?
## 如何实现 Docker 化？

Assume the entire project is organised as follows:  
假设整个项目的结构如下：

```
my-blog/
├─ my-blog-backend/
└─ my-blog-frontend/
```

where shared configuration files and environment variables reside at the project root. The dockerization process proceeds in three steps:  
其中共享的配置文件和环境变量位于项目根目录。Docker 化过程分为三步：

1. **Containerise the backend (FastAPI).** A `Dockerfile` is placed inside `my-blog-backend/`. It starts from a slim Python base image, copies the application code, installs dependencies from a `requirements.txt`, and exposes port 8000. The container’s entry point is the Uvicorn command, now baked into the image rather than typed manually.  
   **容器化后端（FastAPI）。** 在 `my-blog-backend/` 中放置一个 `Dockerfile`。它以精简的 Python 基础镜像为起点，复制应用代码，根据 `requirements.txt` 安装依赖，并暴露 8000 端口。容器的入口点是 Uvicorn 命令，它已经被固化在镜像中，无需手动输入。

2. **Containerise the frontend (React).** A `Dockerfile` inside `my-blog-frontend/` typically uses a multi‑stage build: the first stage compiles the React app with Node.js, and the second stage serves the static assets via a lightweight web server such as Nginx. This keeps the final image small and production‑ready.  
   **容器化前端（React）。** `my-blog-frontend/` 中的 `Dockerfile` 采用多阶段构建：第一阶段使用 Node.js 编译 React 应用，第二阶段通过轻量级 Web 服务器（如 Nginx）提供静态资源服务。这使最终镜像保持较小的体积并具备生产就绪状态。

3. **Orchestrate with Docker Compose.** At the root level (`my-blog/`), a `docker-compose.yml` file defines two services – `backend` and `frontend` – along with a custom bridge network so they can communicate. Environment variables (e.g., API base URL, CORS origins) are injected either directly in the Compose file or through a root-level `.env` file. Volumes can be mounted during development to enable hot‑reloading.  
   **通过 Docker Compose 编排。** 在根目录（`my-blog/`）下，`docker-compose.yml` 文件定义了两个服务——`backend` 和 `frontend`——并创建了自定义桥接网络以便它们相互通信。环境变量（如 API 基础 URL、CORS 来源）可以直接在 Compose 文件中注入，也可以通过根目录的 `.env` 文件注入。开发阶段可以挂载卷以实现热重载。

Once configured, the entire stack is launched with a single command:  
配置完成后，整个技术栈通过一条命令即可启动：

```bash
docker-compose up --build
```

This builds both images (if necessary), creates the containers, and starts the backend and frontend in a unified environment. Development and deployment therefore no longer require opening multiple terminals or remembering platform‑specific startup commands; the process is reproducible across any machine that has Docker installed.  
这条命令会构建（如有必要）两个镜像，创建容器，并在统一的环境中启动后端和前端。开发和部署从此不再需要打开多个终端或记忆平台相关的启动命令；只要机器安装了 Docker，整个流程即可复现。

The following blocks show how the `Dockerfile`s and the `docker-compose.yml` look like:  
以下代码块展示了 `Dockerfile` 和 `docker-compose.yml` 的实际内容：

```dockerfile
# Dockerfile in frontend

# Phase 1: Building the frontend in a Node container
FROM node:20 AS build

WORKDIR /app

# Copy dependent files (using cache layer)
COPY my-blog-frontend/package.json my-blog-frontend/package-lock.json ./
RUN npm ci

# Install build tools (to prevent errors from the native module of Rolldown)
RUN apt-get update && apt-get install -y python3 make g++ pkg-config libc6-dev

# Copy all frontend source code
COPY my-blog-frontend/ .

RUN npm run build

# Phase 2: Providing Services with Nginx
FROM nginx:stable-alpine

# Copy dist from the build phase
COPY --from=build /app/dist /usr/share/nginx/html

# Copy Nginx configuration
COPY my-blog-frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```dockerfile
# Dockerfile in backend

FROM python:3.11-slim

WORKDIR /app

# Configure Alibaba Cloud pip mirror source to accelerate downloads
RUN pip config set global.index-url https://mirrors.aliyun.com/pypi/simple/

# requirements.txt is located in the project root directory (as the context is my-blog/)
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY my-blog-backend/ .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```yml
# yml

services:
  backend:
    build:
      context: .
      dockerfile: my-blog-backend/Dockerfile
    ports:
      - "8000:8000"
    volumes:
      - ./data:/app/data
      - static_data:/app/static
    environment:
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
      - ADMIN_SECRET_KEY=${ADMIN_SECRET_KEY}
      - SENDER_EMAIL=${SENDER_EMAIL}
      - SENDER_AUTH_CODE=${SENDER_AUTH_CODE}
      - ENV=development   # Temporarily
    restart: unless-stopped

  frontend:
    build:
      context: .
      dockerfile: my-blog-frontend/Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  db_data:
  static_data:

```

In addition, for the sake of simplicity during development, I consolidated all the steps required to regenerate a fresh container stack into a single PowerShell script (`.ps1`) designed for Windows environments:  
此外，为了在开发过程中简化操作，我将重建全新容器栈所需的所有步骤整合进一个为 Windows 环境设计的 PowerShell 脚本（`.ps1`）中：

```powershell
Write-Host "Stopping containers..." -ForegroundColor Yellow
docker compose down

Write-Host "Removing old application images..." -ForegroundColor Yellow
docker rmi my-blog-backend 2>$null
docker rmi my-blog-frontend 2>$null

Write-Host "Cleaning build cache..." -ForegroundColor Yellow
docker builder prune -af

Write-Host "Building frontend static files..." -ForegroundColor Yellow
Set-Location my-blog-frontend
npm run build
Set-Location ..

Write-Host "Rebuilding images without cache..." -ForegroundColor Yellow
docker compose build --no-cache

Write-Host "Starting containers..." -ForegroundColor Yellow
docker compose up -d

Write-Host "Done! Visit http://localhost" -ForegroundColor Green
```

Through this script, the entire rebuild-and-launch workflow is reduced to a single command. It first gracefully tears down any running containers, removes the old application images (suppressing errors if they do not exist), and purges the Docker build cache to prevent stale layers from contaminating the new build. The frontend’s static assets are then compiled locally via `npm run build`, and the resulting production files are incorporated into the frontend Docker image during the subsequent `docker compose build --no-cache` step — an approach that avoids embedding a full Node.js toolchain in the final image. Finally, the services are started in detached mode, and the site is ready at `http://localhost`. This automation eliminated the repetitive manual sequence of building, cleaning, and launching, and served as a convenient bridge between local development and the eventual cloud deployment to ECS.  
通过这个脚本，整个重新构建和启动流程被压缩为一条命令。它首先优雅地停止并移除所有正在运行的容器，删除旧的应用镜像（如镜像不存在则忽略错误），并清理 Docker 构建缓存，以防止过期的层污染新的构建。随后，前端的静态资源通过 `npm run build` 在本地编译，生成的生产文件在后续的 `docker compose build --no-cache` 步骤中被纳入前端 Docker 镜像——这样做避免了在最终镜像中携带完整的 Node.js 工具链。最后，服务以分离模式启动，网站即可在 `http://localhost` 访问。这一自动化消除了手动依次构建、清理和启动的重复操作，也成为连接本地开发与后续云部署到 ECS 的一座便捷桥梁。

## How to deploy it in an ECS?
## 如何部署到 ECS？

Conceptually, deploying the containerised blog to an ECS instance is straightforward: lease a cloud server, install the Docker engine, pull the source code, build the images on the server, and start the stack. Since the project was already version‑controlled on GitHub, I avoided copying pre‑built images or the project directory manually — the entire deployment could be bootstrapped directly from the remote repository.  
从概念上讲，将已容器化的博客部署到 ECS 实例非常简单：租用一台云服务器，安装 Docker 引擎，拉取源代码，在服务器上构建镜像，然后启动服务栈。由于项目已经在 GitHub 上进行了版本控制，我无需手动复制预构建的镜像或项目目录——整个部署过程可以直接从远程仓库引导完成。

I provisioned an Alibaba Cloud ECS instance running **Ubuntu 22.04 (64‑bit)**, then proceeded through the following stages:  
我开通了一台运行 **Ubuntu 22.04（64 位）** 的阿里云 ECS 实例，然后按以下步骤操作：

1. **Connect and prepare the server.**  
    I accessed the instance via SSH using the key pair assigned during creation. Once logged in, I installed Docker Engine and Docker Compose using the official Docker repositories, ensuring the same toolchain as the local development environment was available. Enter and execute the following commands in the terminal:  
   **连接并准备服务器。**  
    我通过创建时分配的密钥对，使用 SSH 登录实例。登录后，我使用 Docker 官方仓库安装了 Docker Engine 和 Docker Compose，确保服务器拥有与本地开发环境相同的工具链。在终端中输入并执行以下命令：
    ```powershell
    ssh root@my.actual.public.ip

    apt update && apt upgrade -y    # Update the system pack. 更新系统包。

    curl -fsSL https://get.docker.com | bash    # Install Docker. 下载 Docker。

    apt install -y docker-compose-plugin        # Install Docker Compose plugins. 安装 Docker Compose 插件。

    # Create a new user and add it to the docker group. 创建新用户并加入 docker 组。
    adduser yourname
    usermod -aG sudo yourname
    usermod -aG docker yourname

    exit

    # Then login as the new user just created. 用新用户重新登录。
    ssh yourname@my.actual.public.ip

    # Configure firewall. 配置防火墙。
    sudo ufw allow 22
    sudo ufw allow 80
    sudo ufw allow 443
    sudo ufw enable
    ```

    Notice: During the initial SSH login process to an instance, you may encounter an issue where only SSH key login is currently allowed (on Alibaba Cloud). My solution to this is logging in through VNC and:  
    注意：初次SSH登录实例过程中可能会遇到当前只允许通过SSH密钥登录的问题（阿里云），对此我的解决办法是通过VNC登录，然后：
    ```bash
    passwd root  # Setup or change the password. 设置或更改你的密码。

    sed -i 's/^PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config  # Ensure password logging in is allowed. 确保SSH允许密码登录
    systemctl restart sshd
    ```
    At last, quit from VNC terminal.  
    最后退出VNC。

2. **Pull the source code.**  
    The entire project — the `my-blog/` directory containing the backend, frontend, and root‑level Docker Compose configuration — resided in a GitHub repository. I cloned it directly onto the ECS instance:  
   **拉取源代码。**  
    整个项目——包含后端、前端以及根目录下的 Docker Compose 配置的 `my-blog/` 目录——存放在 GitHub 仓库中。我将其直接克隆到 ECS 实例上：
    ```bash
    git clone https://github.com/littlebanbrick/my-blog.git
    cd my-blog
    ```

3. **Build the container images on the server.**  
    Because a `docker-compose.yml` file was already present and configured correctly, building the images required a single command. During the build process, Docker automatically pulls the specified base images (e.g., `python:3.11-slim`, `node:18-alpine`) from the public registry, installs dependencies, and produces the final application images for the backend and frontend:  
   **在服务器上构建容器镜像。**  
    由于 `docker-compose.yml` 文件已经存在且配置正确，只需一条命令即可完成镜像构建。在构建过程中，Docker 会自动从公共仓库拉取指定的基础镜像（如 `python:3.11-slim`、`node:18-alpine`），安装依赖，并生成后端与前端的最终应用镜像：
    ```bash
    docker compose build --no-cache
    ```
    The `--no-cache` flag guaranteed that old layers would not pollute the production images, yielding clean, reproducible builds every time.
    `--no-cache` 参数确保旧的构建层不会污染生产镜像，每次都能得到干净、可复现的构建结果。

4. **Start the application stack.**  
    With the images built, I launched the services in detached mode so they would persist after the SSH session ended:  
   **启动应用栈。**  
    镜像构建完成后，我以分离模式启动服务，使它们在 SSH 会话结束后仍能继续运行：
    ```bash
    docker compose up -d
    ```
    The frontend’s Nginx container was bound to port 80 on the host, while the backend listened on its internal port 8000, accessible only within the Docker network.
    前端的 Nginx 容器绑定到主机的 80 端口，后端则监听其内部端口 8000，仅限 Docker 网络内部访问。

    Or rather more simply, write a bash script as the `update.ps1` before to execute all the commands above automatically.
    或者更简单的方式是，像之前的 `update.ps1` 那样编写一个 bash 脚本，自动执行上述所有命令。

5. **Expose the service to the Internet.**  
    By default, the ECS security group blocks all inbound traffic. I added rules to allow TCP connections on port 80 (HTTP) from source `0.0.0.0/0`. Later, when SSL was configured, port 443 was also opened.  
   **将服务暴露到互联网。**  
    ECS 安全组默认会阻止所有入站流量。我添加了规则，允许来自源地址 `0.0.0.0/0` 的 TCP 连接访问 80 端口（HTTP）。之后配置 SSL 时，也开放了 443 端口。

6. **Point the custom domain.**  
    Finally, I updated the DNS A‑record for `littlebanbrick.cn` to the ECS instance’s public IP address. After a short propagation delay, the blog was reachable via the custom domain.  
   **指向自定义域名。**  
    最后，我将域名 `littlebanbrick.cn` 的 DNS A 记录更新为 ECS 实例的公网 IP 地址。经过短暂的传播延迟后，博客即可通过自定义域名访问。

This workflow directly mirrors the local development pattern: the same `docker compose` commands are used, the only difference being that the build step now runs on the cloud server rather than the local machine. The entire deployment from a newly provisioned Ubuntu instance to a live website required only Docker, Git, and the repository URL — no manual file transfers or pre‑exported archives.  
这一工作流直接复刻了本地开发的模式：使用相同的 `docker compose` 命令，唯一的区别是将构建步骤从本地机器搬到了云服务器上。从一台全新的 Ubuntu 实例到上线的网站，整个部署过程仅需 Docker、Git 和仓库地址——不需要手动传输文件或预先导出的归档文件。

<br>

---
<br>

<span style="color:grey">The following appendix was generated by a large language model based on my real experiences during the development process.  
以下内容由大语言模型基于本人开发过程中真实经历生成。</span>
<br>

## Appendix1: About "When to dockerize?"
## 附录1：关于“何时开始 Docker 化？”

The experience of retrofitting an existing codebase for containerization often raises a natural question: would it have been better to containerize from the very beginning? The answer is more nuanced than a simple yes or no.  
在改造已有代码以适应容器化的过程中，人们常常会自然地问：是不是从一开始就容器化更好？答案并非简单的“是”或“否”。

In the earliest stages of a project, running services directly on the host machine (“bare metal”) is a pragmatic choice. At that point, the primary goal is to make application logic work. Adding Dockerfiles, compose configurations, and networking complexities too early can overwhelm a learner — or even an experienced developer — and delay visible progress. Moreover, bare‑metal development offers near‑instant hot‑reloading (Vite, Uvicorn `--reload`), allowing rapid trial‑and‑error without waiting for image rebuilds. Dependencies, directory layouts, and environment specifics are still in flux; premature containerization forces constant rewrites of the Docker configuration, creating friction rather than benefit.  
在项目的最初阶段，直接在宿主机（“裸机”）上运行服务是一种务实的选择。那时的主要目标是跑通应用逻辑。过早地加入 Dockerfile、compose 配置和网络复杂性，既可能让初学者（甚至经验丰富的开发者）感到难以招架，也会推迟可见的进展。此外，裸机开发提供了近乎即时的热重载（Vite、Uvicorn 的 `--reload`），允许快速试错而无需等待镜像重建。依赖关系、目录结构、环境细节仍在变动之中；过早的容器化会迫使开发者不断重写 Docker 配置，带来的不是便利而是羁绊。

However, the moment the core application skeleton stabilizes — a working API and a first front‑end component are in place — the incentive shifts. Introducing Docker at this inflection point catches environment mismatches (file paths, timezones, CORS rules, proxy requirements) while the codebase is still small enough to adjust easily. Every subsequent feature is then developed and tested inside the container, which mirrors production. The painful retrofitting process you endured — adjusting hard‑coded paths, re‑designing request flows, correcting timezone assumptions — becomes unnecessary. Deployment, in turn, reduces to a single `docker compose up` command, because the container image has already been production‑validated throughout the entire development lifecycle.  
然而，一旦应用核心骨架稳定下来——一个可工作的 API 和第一个前端组件就位——策略就应该转变。在这个转折点引入 Docker，能在代码库仍较小、易于调整时，就捕获环境差异（文件路径、时区、CORS 规则、代理需求等）。此后，所有功能都在与生产环境一致的容器内开发和测试。人们所经历的那些痛苦改造——调整硬编码路径、重新设计请求流、修正时区设定——便不再需要。部署，也因此被简化成一条 `docker compose up` 命令，因为容器镜像在整个开发周期中，已经接受过生产环境的验证。

A highly effective workflow for a project is to prototype the first critical features on bare metal (approximately one to two days), then immediately create a development‑oriented Docker Compose file that mounts local source code as volumes and retains hot‑reloading capabilities. This “Dev Container” approach combines environment consistency with fast iteration. Once the project is feature‑complete, a production Dockerfile can be derived from the development version with minimal effort — often just by switching from a dev server to a static file server or a production ASGI runner. The lesson is clear: containerize early enough to let the container shape the development habits, but not so early that it obstructs the initial learning and exploration.  
对于一个项目，一种高效的流程是：先在裸机上把首批关键功能跑通（大约一到两天），然后立即创建一个面向开发的 Docker Compose 文件，将本地代码通过卷挂载到容器中，并保留热重载能力。这种“开发容器”的方法，把环境一致性与快速迭代结合了起来。在项目功能完成后，只需最小的工作量——通常只是将开发服务器更换为静态文件服务器或生产级 ASGI 运行器——就能从开发版 Dockerfile 派生出生产版。这条经验很清楚：尽早容器化，让容器塑造开发习惯；但不要太早，以免阻碍最初的学习与探索。

## Appendix2: Issues about ICP Filing in China mainland
## 附录2：关于中国大陆地区 ICP 备案诸事项

If you choose to host a personal blog on a cloud server located in the Chinese mainland (such as an Alibaba Cloud ECS instance) and use a domain name registered or administered under Chinese regulations (e.g., `.cn` or `.com.cn` domains), you are legally required to complete **ICP Filing (Internet Content Provider Filing)** before the website can be accessed publicly.  
如果你选择在中国大陆境内的云服务器（如阿里云 ECS 实例）上托管个人博客，并使用受中国域名管理政策管辖的域名（例如 `.cn` 或 `.中国` 等），那么在网站可被公开访问之前，你必须依法完成 **ICP 备案（互联网内容提供者备案）**。

ICP Filing is a registration system administered by the Ministry of Industry and Information Technology (MIIT) for non‑commercial internet information services. Upon approval, you receive a unique **ICP Filing Number** that must be displayed on your website (typically in the footer). Without a valid filing, your cloud service provider will block HTTP/HTTPS traffic to your domain, making the site unreachable.  
ICP 备案是由工业和信息化部（MIIT）针对非经营性互联网信息服务实施的登记制度。审核通过后，你会获得一个唯一的 **ICP 备案号**，必须在网站上（通常置于页脚）展示。没有有效备案，你的云服务提供商会阻断指向该域名的 HTTP/HTTPS 流量，使网站无法被访问。

For a personal blog like this one, the filing process generally follows these steps:  
对于像本项目这样的个人博客，备案流程通常包括以下步骤：

1. **Prepare supporting documents.** As an individual, you need to provide a scanned copy of your Chinese national ID card, a domain certificate, and basic server information. If you are a foreign national, the requirements differ and may involve additional verification steps.  
   **准备备案材料。** 作为个人备案，你需要提供身份证扫描件、域名证书和基本服务器信息。若为非中国籍人士，要求有所不同，可能需要额外的核验环节。

2. **Submit the filing through your cloud provider.** Services like Alibaba Cloud act as access providers and offer online filing platforms. They will perform an initial review of your documents and content description before forwarding the application to the local Communications Administration.
   **通过云服务商提交备案。** 阿里云等云服务商会作为接入商提供在线备案平台。他们会对你的材料和网站内容说明进行初步审核，然后将申请提交至当地通信管理局。

3. **Wait for the government review.** The official review period can take up to 20 working days. During this time, the domain must remain inaccessible; any public content may cause the application to be rejected.  
   **等待管局审核。** 官方审核周期最长可达 20 个工作日。在此期间域名必须保持无法访问；任何公开内容都可能导致申请被驳回。

4. **Obtain the ICP number and restore service.** Once approved, you will receive the filing number. Place it on your website, and then update the DNS and cloud security group rules to allow public traffic. Your cloud provider will unblock the domain.  
   **获取备案号并恢复服务。** 审核通过后，你将获得备案号。将其放置在网站中，然后更新 DNS 和云安全组规则以允许公开流量。云服务商会解除域名的访问限制。

A few practical notes from this project’s experience: (a) ensure the domain registrant’s name matches the filer’s identity exactly; (b) a personal ICP filing permits only non‑commercial, individual content — blogs, portfolios, and study notes are fine, but anything resembling e‑commerce, paid memberships, or news aggregation may be rejected; (c) after obtaining the ICP filing, you also need to complete a **Public Security Bureau (PSB) Filing** within 30 days, which is another quick registration for cybersecurity oversight. Many hosting providers also offer integrated tools for this step.  
在本项目的经历中，有几点实践经验值得注意：（a）域名持有者姓名必须与备案主体身份完全一致；（b）个人 ICP 备案仅允许非商业、个人性质的内容——博客、作品集、学习笔记均可，但任何近似电商、付费会员、新闻聚合的内容都可能被拒绝；（c）在获得 ICP 备案号后，你还需要在 30 天内进行 **公安机关互联网备案（公安备案）**，这是另一项针对网络安全的快速登记，许多云服务商也提供了集成办理工具。

Completing the ICP filing is a one‑time effort that transforms your cloud server from an isolated virtual machine into a fully legitimate public website capable of serving visitors across China. It is an essential step for any college student running a personal site on a domestic server, and understanding the process early will serve well in future projects.  
完成 ICP 备案是一项一次性的工作，它将你的云服务器从一台孤立的虚拟机转变为一个完全合规的、可向全国访客提供服务的公开网站。这是任何在国内服务器上运行个人站点的学生必须经历的一步，尽早理解这一流程将对未来的项目大有裨益。