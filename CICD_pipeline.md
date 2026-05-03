# CI/CD Pipeline with GitHub Actions and ECS Deployment
# 基于 GitHub Actions 与 ECS 部署的 CI/CD 流水线

> **What is CI/CD and GitHub Actions?**  
> **什么是 CI/CD 与 GitHub Actions？**
> 
> **CI/CD:** An acronym for Continuous Integration and Continuous Delivery (or Deployment). CI refers to the practice of automatically integrating code changes from multiple contributors into a shared repository and verifying them through builds and tests. CD extends this by automating the delivery of verified code to a target environment. Together, they form a pipeline that takes source code from a commit to a live service without manual intervention.  
> **CI/CD：** 持续集成（Continuous Integration）与持续交付/部署（Continuous Delivery/Deployment）的缩写。CI 指自动将多个贡献者的代码变更集成到共享仓库，并通过构建和测试进行验证的实践。CD 则进一步将验证通过的代码自动交付到目标环境。二者共同构成一条将源代码从提交变为线上服务的自动化流水线。
>
> **GitHub Actions:** A workflow automation platform built into GitHub. It is event‑driven: when a specified event occurs (e.g., a push to the `main` branch), GitHub spawns a temporary runner (a virtual machine) and executes a sequence of steps defined in a YAML file. Steps can run shell commands, use pre‑built actions from the marketplace, and securely access repository secrets.  
> **GitHub Actions：** 内置于 GitHub 的工作流自动化平台。它由事件驱动：当指定事件发生（例如向 `main` 分支推送代码），GitHub 会启动一个临时的运行器（虚拟机），并执行 YAML 文件中定义的一系列步骤。步骤可以运行 Shell 命令、使用市场中的预置动作，并安全地访问仓库 Secrets。
>
> **Workflow / Job / Step / Runner:** A workflow is the entire automated process (the YAML file). A workflow can contain multiple jobs that run in parallel or sequentially. Each job consists of a series of steps. The runner is the machine that executes the jobs — either a GitHub‑hosted runner (e.g., `ubuntu-latest`) or a self‑hosted one.  
> **Workflow / Job / Step / Runner：** Workflow（工作流）是整个自动化流程（YAML 文件）。一个 workflow 可以包含多个 Job（并行或串行执行）。每个 Job 由一系列 Step 组成。Runner（运行器）是执行 Job 的机器——可以是 GitHub 托管的运行器（如 `ubuntu-latest`），也可以是自托管运行器。

<span style="color:grey">In this doc, I document how to configure a CI/CD pipeline that automatically rebuilds and restarts my personal blog website on an Alibaba Cloud ECS instance when I push code to GitHub.</span>  
<span style="color:grey">在本文中，我将记录如何配置 CI/CD 流水线，使得当我向 GitHub 推送代码时，阿里云 ECS 实例上的个人博客网站能够自动重新构建并重启服务。</span>

## Why CI/CD?
## 为什么需要 CI/CD？

After containerizing the blog and establishing a manual deployment workflow, the remaining friction was the repetitive terminal work. Every time I modified the source code on my local machine, I had to push to GitHub, then open an SSH session to the ECS instance, pull the changes, rebuild the Docker images, and restart the stack. This sequence was predictable, tedious, and prone to human error — forgetting to purge the build cache, starting the wrong version, or leaving a container in a broken state.  
在博客容器化并建立起手动部署流程之后，仍然存在的痛点就是重复性终端操作。每次我在本地修改源代码后，都必须推送到 GitHub，然后打开到 ECS 实例的 SSH 会话，拉取变更，重建 Docker 镜像，再重启服务栈。这个流程是可预测、枯燥且容易出错的——忘记清理构建缓存、启动了错误版本、或让容器处于异常状态，都是可能发生的。

CI/CD addresses exactly this: once configured, a single `git push` triggers the entire pipeline. The cloud server updates itself automatically, and within minutes the latest version of the blog is live. For a single‑developer personal project, the immediate benefit is not velocity but reliability and mental overhead reduction — you focus on writing code, and the machine handles the deployment.  
CI/CD 正是为了解决这个问题：一旦配置完成，一次 `git push` 就能触发整条流水线。云服务器自动更新自身，几分钟之内最新版本的博客即告上线。对于单人开发的个人项目，直接受益的并非开发速度，而是可靠性与心智负担的降低——你专注于写代码，机器负责部署。

## How to configure the pipeline
## 如何配置流水线

The pipeline design is straightforward: a GitHub Actions workflow listens for push events on the `main` branch. When triggered, it establishes an SSH connection to the ECS instance, pulls the latest code, and rebuilds and restarts the Docker containers — all within a single remote script.  
该流水线的设计简明：一个 GitHub Actions 工作流监听对 `main` 分支的推送事件。当事件触发时，它通过 SSH 连接到 ECS 实例，拉取最新代码，并在一个远程脚本中重建并重启 Docker 容器。

### 1. SSH keypair setup / SSH 密钥对配置

To allow GitHub Actions to authenticate against the ECS instance without a password, an SSH keypair is created. The private key is stored as a GitHub repository secret; the public key is installed on the server.  
为让 GitHub Actions 免密码登录 ECS 实例，需要生成 SSH 密钥对。私钥被存储为 GitHub 仓库的 Secret；公钥则被安装到服务器上。

- **On the local machine (host):** Generate a new keypair. The private key file should be added to `.gitignore` so it is never committed.  
  **在本地宿主机上：** 生成新的密钥对。私钥文件应加入 `.gitignore`，确保不会被提交到仓库。
  ```bash
  ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/myblog_deploy_key
  ```
- **On the ECS instance:** Append the public key to `~/.ssh/authorized_keys`.  
  **在 ECS 实例上：** 将公钥追加到 `~/.ssh/authorized_keys`。
  ```bash
  cat ~/.ssh/myblog_deploy_key.pub >> ~/.ssh/authorized_keys
  ```
- **In the GitHub repository:** Navigate to Settings → Secrets and variables → Actions, and store:  
  **在 GitHub 仓库中：** 进入 Settings → Secrets and variables → Actions，并存储以下 Secret：
  - `SSH_PRIVATE_KEY`: the entire content of the private key file
  - `SSH_PRIVATE_KEY`：私钥文件的完整内容
  - `REMOTE_HOST`: the public IP address of the ECS instance
  - `REMOTE_HOST`：ECS 实例的公网 IP 地址
  - `REMOTE_USER`: the SSH username (e.g., `root` or a non-root user)
  - `REMOTE_USER`：SSH 用户名（例如 `root` 或非 root 用户）

### 2. Workflow file definition / 工作流文件定义

The workflow YAML file is placed at `.github/workflows/deploy.yml`. It uses the widely adopted `appleboy/ssh-action` to handle the SSH connection internally, removing the need to manage `known_hosts` or SSH options manually.  
工作流 YAML 文件位于 `.github/workflows/deploy.yml`。它使用了广泛采用的 `appleboy/ssh-action` 来在内部处理 SSH 连接，避免了手动管理 `known_hosts` 或 SSH 选项的需要。

```yaml
name: Deploy to Cloud Server

on:
  push:
    branches: [ main ] 

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy via SSH
        uses: appleboy/ssh-action@v0.1.10
        with:
          host: ${{ secrets.REMOTE_HOST }}
          username: ${{ secrets.REMOTE_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd ~/blog/my-blog
            git pull origin main
            docker compose down
            docker compose up -d --build
```

**Trigger explanation:** The `on.push.branches: [main]` clause starts the workflow automatically on every push to the `main` branch. No manual trigger is configured here, but `workflow_dispatch` could be added later if a one‑click rebuild button is desired from the Actions tab.  
**触发器说明：** `on.push.branches: [main]` 会在每次向 `main` 分支推送时自动启动工作流。这里没有配置手动触发，但若希望从 Actions 标签页一键重建，后期可以添加 `workflow_dispatch`。

**Connection details:** The `appleboy/ssh-action` takes the `host`, `username`, and `key` from the repository secrets, establishes the SSH session, and executes the provided script block. Because the action handles host key verification internally, there is no need for an explicit `StrictHostKeyChecking=no` flag.  
**连接细节：** `appleboy/ssh-action` 从仓库 Secret 中获取主机、用户名和密钥，建立 SSH 会话，并执行提供的脚本块。由于该 Action 在内部处理了主机密钥验证，无需显式使用 `StrictHostKeyChecking=no`。

**Remote script execution:** Once connected, the workflow runs four commands on the server:  
**远程脚本执行：** 连接成功后，工作流在服务器上依次执行四条命令：

1. `cd ~/blog/my-blog` — navigate to the project directory. / 进入项目目录。
2. `git pull origin main` — fetch the latest changes from the remote `main` branch and merge them into the local working tree. This preserves any uncommitted local modifications (unlike `git reset --hard`) but will fail if a merge conflict arises, requiring manual intervention on the server. / 从远程 `main` 分支拉取最新变更并合并到本地工作树。这保留了任何未提交的本地修改（与 `git reset --hard` 不同），但如果出现合并冲突则会失败，需要手动登录服务器干预。
3. `docker compose down` — stop and remove the running containers. / 停止并移除正在运行的容器。
4. `docker compose up -d --build` — rebuild the images from the updated source code (utilising Docker’s build cache for unchanged layers) and start the containers in detached mode. / 从更新后的源代码重建镜像（未变更的层会利用 Docker 构建缓存），并以分离模式启动容器。

### 3. Handling conflicts on the server / 处理服务器上的冲突

Because the remote script uses `git pull` rather than a forced reset, the workflow can fail if the server’s local repository contains changes that conflict with the incoming commits — for instance, if you once logged into the server and edited a tracked file directly. In such a case, the merge stops in progress, `docker compose up -d --build` is never reached, and the site remains in its previous state (since `docker compose down` has already been executed, the old containers are gone). To recover, you must SSH into the ECS instance, resolve the conflict manually (e.g., by running `git stash` or `git reset --hard origin/main`), and then either push a dummy commit to trigger the workflow again or run the deployment commands by hand.  
由于远程脚本使用的是 `git pull` 而非强制重置，如果服务器本地的仓库包含与拉取内容冲突的修改——例如，你曾直接登录服务器编辑了一个跟踪文件——工作流就会失败。此时合并会在中途停止，永远不会执行 `docker compose up -d --build`，而网站则停留在先前状态（因为 `docker compose down` 已经执行过，旧容器已被移除）。要恢复，你必须 SSH 登录到 ECS 实例，手动解决冲突（例如执行 `git stash` 或 `git reset --hard origin/main`），然后要么推送一个空 commit 以重新触发工作流，要么手动执行部署命令。

For a single‑developer project where all changes are pushed from the local machine, this situation is rare. Nevertheless, it is the primary robustness trade‑off of using `git pull` instead of `git reset --hard`: the former avoids accidentally deleting server‑side debug logs or configuration tweaks, at the cost of occasionally requiring manual intervention.  
对于所有变更都从本地推送的单人项目，这种情况很少见。不过，这正是使用 `git pull` 而非 `git reset --hard` 的主要鲁棒性权衡：前者避免意外删除服务器上的调试日志或配置调整，代价是偶尔需要人工干预。

### 4. Branching considerations / 分支策略考量

While the example above targets `main`, the same pattern can be extended to other branches by expanding `on.push.branches` or by copying the workflow file. For a personal blog, a single‑branch pipeline is perfectly adequate. If the need arises to deploy a staging version, a second workflow listening on a `staging` branch and targeting a different directory or server is a clean extension.  
上述例子以 `main` 为目标分支，但相同的模式可以扩展到其他分支，只需扩展 `on.push.branches` 数组或复制工作流文件即可。对于个人博客，单分支流水线完全足够。如果未来需要部署预发布（staging）版本，可以创建第二个工作流，监听 `staging` 分支，并指向不同的目录或服务器，这是一种干净的扩展方式。

## Appendix: Notes on SSH Host Key Verification
## 附录：关于 SSH 主机密钥验证的说明

In the workflow above, `StrictHostKeyChecking=no` is used when invoking the SSH command. This bypasses the interactive prompt that would appear when connecting to a host for the first time. In production environments, it is better to pre‑populate the runner’s `known_hosts` file with the server’s host key — for instance, by using the `ssh-keyscan` command and storing the output as a GitHub secret. For a personal project on a transient GitHub runner, the convenience outweighs the negligible security risk. If stricter security is desired, you can replace the relevant step with:  
在上述工作流中，SSH 命令使用了 `StrictHostKeyChecking=no` 来跳过首次连接主机时的交互式提示。在生产环境中，更安全的做法是预先将服务器主机密钥写入运行器的 `known_hosts` 文件——例如使用 `ssh-keyscan` 命令，并将输出存储为 GitHub Secret。对于基于 GitHub 临时运行器的个人项目，便利性远超微不足道的安全风险。如果需要更严格的安全性，可以将相关步骤替换为：

```bash
ssh-keyscan ${{ secrets.SERVER_HOST }} >> ~/.ssh/known_hosts
ssh -o StrictHostKeyChecking=yes ...
```

This ensures the connection is only made to a server whose identity is verified against the pre‑registered host key.  
这确保仅连接到身份已通过预注册主机密钥验证的服务器。