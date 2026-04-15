# Build Docker images for Docker Swarm
$services = @("photo-prestige", "auth-service", "target-service", "register-service", "score-service", "clock-service", "mail-service", "read-service")

foreach ($service in $services) {
  Write-Host "Building $service`:swarm..." -ForegroundColor Cyan
  docker build -t "${service}:swarm" "./$service"
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build $service" -ForegroundColor Red
    exit 1
  }
}

Write-Host "All images built successfully!" -ForegroundColor Green
