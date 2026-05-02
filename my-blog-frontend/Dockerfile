# 第一阶段：在 Node 容器中构建前端
FROM node:20 AS build

WORKDIR /app

# 复制依赖文件（利用缓存层）
COPY my-blog-frontend/package.json my-blog-frontend/package-lock.json ./
RUN npm ci

# 安装构建工具（防止 rolldown 原生模块报错）
# RUN apt-get update && apt-get install -y python3 make g++ pkg-config libc6-dev

# 复制所有前端源码
COPY my-blog-frontend/ .

RUN npm run build

# 第二阶段：用 Nginx 提供服务
FROM nginx:stable-alpine

# 从构建阶段复制 dist
COPY --from=build /app/dist /usr/share/nginx/html

# 复制 Nginx 配置
COPY my-blog-frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]