# ==============================================================================
# HACKATHON ENVIRONMENT PREFLIGHT CHECK (PowerShell)
# ==============================================================================
# Validates developer machine readiness before leaving home and at venue.
# Safe & non-destructive: does not kill processes, alter files, or expose secrets.
# ==============================================================================

[CmdletBinding()]
param()

$ErrorActionPreference = "Continue"

$PassCount = 0
$WarnCount = 0
$FailCount = 0

function Write-Header {
    param([string]$Title)
    Write-Host ""
    Write-Host "=================================================================" -ForegroundColor Cyan
    Write-Host "  $Title" -ForegroundColor Cyan
    Write-Host "=================================================================" -ForegroundColor Cyan
}

function Report-Pass {
    param([string]$Message)
    Write-Host "  [PASS] $Message" -ForegroundColor Green
    $script:PassCount++
}

function Report-Info {
    param([string]$Message, [string]$Advice = "")
    Write-Host "  [INFO] $Message" -ForegroundColor Cyan
    if ($Advice) {
        Write-Host "         -> $Advice" -ForegroundColor Gray
    }
}

function Report-Warn {
    param([string]$Message, [string]$Advice = "")
    Write-Host "  [WARN] $Message" -ForegroundColor Yellow
    if ($Advice) {
        Write-Host "         -> Fix: $Advice" -ForegroundColor Gray
    }
    $script:WarnCount++
}

function Report-Fail {
    param([string]$Message, [string]$Advice = "")
    Write-Host "  [FAIL] $Message" -ForegroundColor Red
    if ($Advice) {
        Write-Host "         -> Fix: $Advice" -ForegroundColor Magenta
    }
    $script:FailCount++
}

Write-Header "STAGE 1: CORE RUNTIME & TOOLING (REQUIRED)"

# 1. Node.js Check
try {
    $nodeVer = node -v 2>$null
    if ($nodeVer) {
        $nodeMajor = [int]($nodeVer -replace '^v(\d+)\..*$', '$1')
        if ($nodeMajor -ge 18) {
            Report-Pass "Node.js is installed ($nodeVer, meets requirement >= 18)"
        } else {
            Report-Fail "Node.js version is $nodeVer" "Node.js 18.x or 20+ LTS is required. Upgrade via https://nodejs.org or fnm/nvm."
        }
    } else {
        Report-Fail "Node.js is not found in PATH" "Install Node.js 20 LTS from https://nodejs.org/"
    }
} catch {
    Report-Fail "Failed to execute 'node -v'" "Ensure Node.js is installed and added to PATH."
}

# 2. npm Check
try {
    $npmVer = npm -v 2>$null
    if ($npmVer) {
        $npmMajor = [int]($npmVer -replace '^(\d+)\..*$', '$1')
        if ($npmMajor -ge 10) {
            Report-Pass "npm is installed (v$npmVer, meets requirement >= 10.x)"
        } else {
            Report-Warn "npm version is v$npmVer" "npm 10.x+ is recommended. Consider upgrading via 'npm install -g npm@latest'."
        }
    } else {
        Report-Fail "npm is not found in PATH" "Node.js bundled npm is missing. Reinstall Node.js or run 'npm install -g npm@10.9.2'."
    }
} catch {
    Report-Fail "Failed to check npm" "Ensure npm is installed and added to PATH."
}

# 3. Git Check
try {
    $gitVer = git --version 2>$null
    if ($gitVer) {
        Report-Pass "Git is installed ($gitVer)"
    } else {
        Report-Fail "Git is not installed or not in PATH" "Install Git from https://git-scm.com/"
    }
} catch {
    Report-Fail "Failed to check Git" "Ensure Git is installed."
}

Write-Header "STAGE 2: CONTAINERIZATION & DOCKER (RECOMMENDED)"

# 4. Docker CLI
$dockerCliAvailable = $false
try {
    $dockerVer = docker --version 2>$null
    if ($dockerVer) {
        Report-Pass "Docker CLI is available ($dockerVer)"
        $dockerCliAvailable = $true
    } else {
        Report-Warn "Docker CLI is not found" "If you need containerized PostgreSQL, install Docker Desktop from https://www.docker.com/products/docker-desktop/"
    }
} catch {
    Report-Warn "Docker CLI check failed" "Install Docker Desktop if using containers."
}

# 5. Docker Daemon
$dockerDaemonRunning = $false
if ($dockerCliAvailable) {
    try {
        $dockerInfo = docker info 2>&1
        if ($LASTEXITCODE -eq 0) {
            Report-Pass "Docker daemon is running and reachable"
            $dockerDaemonRunning = $true
        } else {
            Report-Warn "Docker daemon is not running" "Start Docker Desktop on Windows before running database containers."
        }
    } catch {
        Report-Warn "Could not reach Docker daemon" "Start Docker Desktop."
    }
}

Write-Header "STAGE 3: ENVIRONMENT CONFIGURATION (REQUIRED)"

$rootDir = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $rootDir ".env"
$envExamplePath = Join-Path $rootDir ".env.example"
$targetDbPort = 5435
$dbUser = "hackathon"
$dbName = "hackathon"

if (Test-Path $envPath) {
    Report-Pass ".env file exists at repository root"
    
    # Check for required variable keys without printing values
    $requiredKeys = @("PORT", "NEXT_PUBLIC_API_BASE_URL", "DATABASE_URL")
    $envContent = Get-Content $envPath
    $missingKeys = @()
    
    foreach ($key in $requiredKeys) {
        $found = $envContent | Where-Object { $_ -match "^\s*$key\s*=" }
        if (-not $found) {
            $missingKeys += $key
        }
    }
    
    if ($missingKeys.Count -eq 0) {
        Report-Pass "All essential environment keys are defined in .env"
    } else {
        Report-Warn "Missing keys in .env: $($missingKeys -join ', ')" "Review .env.example and add the missing keys to your .env."
    }

    $portMatch = $envContent | Where-Object { $_ -match "^\s*POSTGRES_PORT\s*=" } | Select-Object -First 1
    if ($portMatch -and $portMatch -match "^\s*POSTGRES_PORT\s*=\s*['""]?(\d+)['""]?") {
        $targetDbPort = [int]$matches[1]
    }
    $userMatch = $envContent | Where-Object { $_ -match "^\s*POSTGRES_USER\s*=" } | Select-Object -First 1
    if ($userMatch -and $userMatch -match "^\s*POSTGRES_USER\s*=\s*['""]?([^'""]+)['""]?") {
        $dbUser = $matches[1].Trim()
    }
    $nameMatch = $envContent | Where-Object { $_ -match "^\s*POSTGRES_DB\s*=" } | Select-Object -First 1
    if ($nameMatch -and $nameMatch -match "^\s*POSTGRES_DB\s*=\s*['""]?([^'""]+)['""]?") {
        $dbName = $matches[1].Trim()
    }
} else {
    Report-Warn ".env file does not exist yet" "Run 'Copy-Item .env.example .env' (PowerShell) or 'cp .env.example .env' (Bash) to initialize."
}

Write-Header "STAGE 4: LOCAL PORT AVAILABILITY CHECK"

function Test-LocalPort {
    param(
        [int]$Port,
        [string]$ServiceName,
        [bool]$IsInformational = $false
    )
    
    $connection = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    
    if ($connection) {
        $pidNum = $connection.OwningProcess
        $procName = "Unknown"
        try {
            $proc = Get-Process -Id $pidNum -ErrorAction SilentlyContinue
            if ($proc) { $procName = $proc.ProcessName }
        } catch {}

        if ($IsInformational) {
            Report-Info "Port $Port ($ServiceName) is in use by $procName (PID $pidNum)" "Notice: Port $Port is in use by another service/container; does not conflict with Hoollow-Offline PostgreSQL (port $targetDbPort)."
        } else {
            Report-Warn "Port $Port ($ServiceName) is occupied by process '$procName' (PID $pidNum)" "Port $Port is needed when running $ServiceName. Either stop PID $pidNum or change $ServiceName port in .env."
        }
    } else {
        if ($IsInformational) {
            Report-Info "Port $Port ($ServiceName) is free"
        } else {
            Report-Pass "Port $Port ($ServiceName) is free"
        }
    }
}

function Test-PostgresPort {
    param(
        [int]$Port,
        [string]$ServiceName
    )

    $connection = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1

    if (-not $connection) {
        Report-Pass "Port $Port ($ServiceName) is free"
        return
    }

    $pidNum = $connection.OwningProcess
    $procName = "Unknown"
    try {
        $proc = Get-Process -Id $pidNum -ErrorAction SilentlyContinue
        if ($proc) { $procName = $proc.ProcessName }
    } catch {}

    $containerName = "hackathon_postgres"

    if ($dockerDaemonRunning) {
        $inspectStatus = ""
        $inspectHealth = ""
        try {
            $inspectOut = docker inspect --format '{{.State.Status}}|{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' $containerName 2>$null
            if ($LASTEXITCODE -eq 0 -and $inspectOut) {
                $parts = $inspectOut.Trim().Split('|')
                $inspectStatus = $parts[0]
                if ($parts.Length -gt 1) { $inspectHealth = $parts[1] }
            }
        } catch {}

        if (-not $inspectStatus) {
            try {
                $composePsJson = docker compose -f (Join-Path $rootDir "docker-compose.yml") ps postgres --format json 2>$null
                if ($LASTEXITCODE -eq 0 -and $composePsJson) {
                    $composePs = $composePsJson | ConvertFrom-Json
                    $inspectStatus = $composePs.State
                    $inspectHealth = $composePs.Health
                }
            } catch {}
        }

        $publishedPort = ""
        try {
            $publishedPort = docker port $containerName 5432 2>$null
            if ($LASTEXITCODE -ne 0 -or -not $publishedPort) {
                $publishedPort = docker compose -f (Join-Path $rootDir "docker-compose.yml") port postgres 5432 2>$null
            }
        } catch {}

        $portMatches = $false
        if ($publishedPort -and $publishedPort -match ":$Port(\s|$)") {
            $portMatches = $true
        }

        if ($inspectStatus -eq "running" -and $portMatches) {
            $pgReady = $false
            try {
                $pgOut = docker exec $containerName pg_isready -U $dbUser -d $dbName 2>&1
                if ($LASTEXITCODE -eq 0 -and $pgOut -match "accepting connections") {
                    $pgReady = $true
                } else {
                    $pgOut = docker compose -f (Join-Path $rootDir "docker-compose.yml") exec -T postgres pg_isready -U $dbUser -d $dbName 2>&1
                    if ($LASTEXITCODE -eq 0 -and $pgOut -match "accepting connections") {
                        $pgReady = $true
                    }
                }
            } catch {}

            if ($inspectHealth -eq "healthy" -and $pgReady) {
                Report-Pass "Port $Port ($ServiceName) is bound to healthy container '$containerName' and accepting connections"
                return
            } elseif ($pgReady) {
                Report-Pass "Port $Port ($ServiceName) is bound to '$containerName' and accepting connections (pg_isready: pass)"
                return
            } else {
                Report-Warn "Port $Port ($ServiceName) is bound by container '$containerName', but database is not ready yet (pg_isready check failed)" "Check database logs with 'npm run db:logs' or wait for container initialization to complete."
                return
            }
        }
    }

    Report-Warn "Port $Port ($ServiceName) is occupied by process '$procName' (PID $pidNum)" "Port $Port is needed when running $ServiceName. Either stop PID $pidNum or change $ServiceName port in .env."
}

# Check port 3000 (Next.js web)
Test-LocalPort -Port 3000 -ServiceName "Frontend Web Server"

# Check port 3001 (NestJS API)
Test-LocalPort -Port 3001 -ServiceName "Backend API Server"

# Check port 5435 (Docker PostgreSQL container host port for Hoollow-Offline)
Test-PostgresPort -Port $targetDbPort -ServiceName "Hackathon PostgreSQL"

# Informational check on port 5434 (external project / traceback-postgres container)
if ($targetDbPort -ne 5434) {
    Test-LocalPort -Port 5434 -ServiceName "External Project PostgreSQL" -IsInformational $true
}

# Informational check on port 5432 (default host PostgreSQL)
if ($targetDbPort -ne 5432) {
    Test-LocalPort -Port 5432 -ServiceName "Default PostgreSQL (Host)" -IsInformational $true
}

Write-Header "STAGE 5: NETWORK & REGISTRY CONNECTIVITY"

try {
    $pingNpm = Test-NetConnection -ComputerName "registry.npmjs.org" -Port 443 -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($pingNpm) {
        Report-Pass "Internet connectivity to npm registry (registry.npmjs.org) confirmed"
    } else {
        Report-Warn "Could not reach registry.npmjs.org on port 443" "Verify Wi-Fi / proxy connection at venue if downloading packages."
    }
} catch {
    Report-Warn "Network connectivity check skipped or encountered error" "Ensure internet connection is active."
}

Write-Header "PREFLIGHT SUMMARY"

Write-Host "  Checks Passed:   $PassCount" -ForegroundColor Green
Write-Host "  Warnings:        $WarnCount" -ForegroundColor Yellow
Write-Host "  Errors/Failures: $FailCount" -ForegroundColor Red
Write-Host "-----------------------------------------------------------------" -ForegroundColor Cyan

if ($FailCount -eq 0) {
    Write-Host "  STATUS: READY FOR HACKATHON PREPARATION / VENUE CODING" -ForegroundColor Green
    exit 0
} else {
    Write-Host "  STATUS: ATTENTION REQUIRED - Resolve errors above before the event" -ForegroundColor Red
    exit 1
}
