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