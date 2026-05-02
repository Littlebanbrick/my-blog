FROM python:3.11-slim

WORKDIR /app

# 配置阿里云 pip 镜像源，加速下载
RUN pip config set global.index-url https://mirrors.aliyun.com/pypi/simple/

# requirements.txt 在项目根目录（因为上下文是 my-blog/）
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# 复制后端代码
COPY my-blog-backend/ .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]