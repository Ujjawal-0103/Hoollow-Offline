# ==============================================================================
# VENUE KICKOFF AUTOMATION SCRIPT (npm edition)
# ==============================================================================
# Run this script ONLY AT THE VENUE when the hackathon starts and the problem
# statement is announced, or if organizers have explicitly permitted starter scaffolding.
# ==============================================================================

[CmdletBinding()]
param(
    [switch]$SkipDocker = $false
)

$ErrorActionPreference = "Stop"

$rootDir = Split-Path -Parent $PSScriptRoot
Set-Location $rootDir

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  HACKATHON VENUE KICKOFF - RAPID SCAFFOLDING (NPM)" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# 1. Environment file check
$envPath = Join-Path $rootDir ".env"
$envExamplePath = Join-Path $rootDir ".env.example"
if (-not (Test-Path $envPath)) {
    Write-Host "[1/5] Copying .env.example to .env..." -ForegroundColor Yellow
    Copy-Item $envExamplePath $envPath
} else {
    Write-Host "[1/5] .env file already exists. Preserving." -ForegroundColor Green
}

# 2. Workspace configuration in root package.json
$pkgJsonPath = Join-Path $rootDir "package.json"
Write-Host "[2/5] Configuring npm workspaces in package.json..." -ForegroundColor Yellow
$pkgJson = Get-Content $pkgJsonPath -Raw | ConvertFrom-Json

# Clean up legacy pnpm-workspace.yaml if it exists
$pnpmWorkspace = Join-Path $rootDir "pnpm-workspace.yaml"
if (Test-Path $pnpmWorkspace) {
    Remove-Item -Force $pnpmWorkspace
}

if (-not $pkgJson.workspaces) {
    $pkgJson | Add-Member -MemberType NoteProperty -Name "workspaces" -Value @("apps/*", "packages/*") -Force
    $pkgJson | ConvertTo-Json -Depth 10 | Set-Content $pkgJsonPath -Encoding UTF8
    Write-Host "      Configured npm workspaces: apps/*, packages/*" -ForegroundColor Green
} else {
    Write-Host "      npm workspaces already configured in package.json." -ForegroundColor Green
}

# 3. Start PostgreSQL container if Docker is running
if (-not $SkipDocker) {
    Write-Host "[3/5] Starting PostgreSQL container on host port 5435..." -ForegroundColor Yellow
    try {
        docker compose up -d postgres
        Write-Host "      PostgreSQL container started successfully." -ForegroundColor Green
    } catch {
        Write-Host "      Docker not available or daemon stopped. Skipping container start." -ForegroundColor Gray
    }
} else {
    Write-Host "[3/5] Skipping Docker container start as requested." -ForegroundColor Gray
}

# 4. Next.js Frontend Scaffolding
$webDir = Join-Path $rootDir "apps\web"
if (-not (Test-Path $webDir)) {
    Write-Host "[4/5] Initializing Next.js in apps/web using npm..." -ForegroundColor Yellow
    npx --yes create-next-app@latest apps/web --typescript --tailwind --eslint --app --src-dir false --import-alias "@/*" --use-npm --skip-install
    
    # Write initial web .env.local
    $webEnv = Join-Path $webDir ".env.local"
    Set-Content -Path $webEnv -Value "NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api`n"
    Write-Host "      Next.js scaffolded in apps/web." -ForegroundColor Green
} else {
    Write-Host "[4/5] apps/web directory already exists. Preserving existing content." -ForegroundColor Green
}

# 5. NestJS Backend Scaffolding
$apiDir = Join-Path $rootDir "apps\api"
if (-not (Test-Path $apiDir)) {
    Write-Host "[5/5] Initializing NestJS in apps/api using npm..." -ForegroundColor Yellow
    npx --yes @nestjs/cli@latest new apps/api --package-manager npm --skip-git --skip-install
    Write-Host "      NestJS scaffolded in apps/api." -ForegroundColor Green
} else {
    Write-Host "[5/5] apps/api directory already exists. Preserving existing content." -ForegroundColor Green
}

Write-Host ""
Write-Host "=================================================================" -ForegroundColor Green
Write-Host "  VENUE KICKOFF COMPLETE!" -ForegroundColor Green
Write-Host "  Run 'npm install' then start building your solution." -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green
