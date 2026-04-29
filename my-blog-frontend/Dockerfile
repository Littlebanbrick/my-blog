FROM nginx:stable-alpine

# 删除 Nginx 默认的静态文件
RUN rm -rf /usr/share/nginx/html/*

# 将本地构建输出的 dist 文件夹复制到 Nginx 目录
# 注意：这里路径相对于构建上下文（my-blog/ 根目录）
COPY my-blog-frontend/dist/ /usr/share/nginx/html/

# 复制 Nginx 配置文件
COPY my-blog-frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]