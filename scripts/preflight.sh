#!/usr/bin/env bash
# ==============================================================================
# HACKATHON ENVIRONMENT PREFLIGHT CHECK (Bash / macOS / Linux / Git Bash)
# ==============================================================================
# Validates developer machine readiness before leaving home and at venue.
# Safe & non-destructive: does not kill processes, alter files, or expose secrets.
# ==============================================================================

set -u

PASS_COUNT=0
WARN_COUNT=0
FAIL_COUNT=0

report_pass() {
  echo -e "\033[0;32m  [PASS]\033[0m $1"
  PASS_COUNT=$((PASS_COUNT + 1))
}

report_info() {
  echo -e "\033[0;36m  [INFO]\033[0m $1"
  if [ -n "${2:-}" ]; then
    echo -e "         -> $2"
  fi
}

report_warn() {
  echo -e "\033[1;33m  [WARN]\033[0m $1"
  if [ -n "${2:-}" ]; then
    echo -e "         -> Fix: $2"
  fi
  WARN_COUNT=$((WARN_COUNT + 1))
}

report_fail() {
  echo -e "\033[0;31m  [FAIL]\033[0m $1"
  if [ -n "${2:-}" ]; then
    echo -e "         -> Fix: $2"
  fi
  FAIL_COUNT=$((FAIL_COUNT + 1))
}

print_header() {
  echo ""
  echo -e "\033[0;36m=================================================================\033[0m"
  echo -e "\033[0;36m  $1\033[0m"
  echo -e "\033[0;36m=================================================================\033[0m"
}

print_header "STAGE 1: CORE RUNTIME & TOOLING (REQUIRED)"

# 1. Node.js
if command -v node >/dev/null 2>&1; then
  NODE_VER=$(node -v)
  NODE_MAJOR=$(echo "$NODE_VER" | sed -E 's/^v([0-9]+)\..*/\1/')
  if [ "$NODE_MAJOR" -ge 18 ]; then
    report_pass "Node.js is installed ($NODE_VER, meets requirement >= 18)"
  else
    report_fail "Node.js version is $NODE_VER" "Node.js 18.x or 20+ LTS is required."
  fi
else
  report_fail "Node.js is not found in PATH" "Install Node.js 20 LTS from https://nodejs.org/"
fi

# 2. npm
if command -v npm >/dev/null 2>&1; then
  NPM_VER=$(npm -v)
  NPM_MAJOR=$(echo "$NPM_VER" | sed -E 's/^([0-9]+)\..*/\1/')
  if [ "$NPM_MAJOR" -ge 10 ]; then
    report_pass "npm is installed (v$NPM_VER, meets requirement >= 10.x)"
  else
    report_warn "npm version is v$NPM_VER" "npm 10.x+ is recommended."
  fi
else
  report_fail "npm is not found in PATH" "Node.js bundled npm is missing. Reinstall Node.js."
fi

# 3. Git
if command -v git >/dev/null 2>&1; then
  GIT_VER=$(git --version)
  report_pass "Git is installed ($GIT_VER)"
else
  report_fail "Git is not installed or not in PATH" "Install Git from https://git-scm.com/"
fi

print_header "STAGE 2: CONTAINERIZATION & DOCKER (RECOMMENDED)"

# 4. Docker CLI
DOCKER_CLI_AVAIL=0
if command -v docker >/dev/null 2>&1; then
  DOCKER_VER=$(docker --version)
  report_pass "Docker CLI is available ($DOCKER_VER)"
  DOCKER_CLI_AVAIL=1
else
  report_warn "Docker CLI is not found" "Install Docker Desktop if using containers."
fi

# 5. Docker Daemon
DOCKER_DAEMON_RUNNING=0
if [ "$DOCKER_CLI_AVAIL" -eq 1 ]; then
  if docker info >/dev/null 2>&1; then
    report_pass "Docker daemon is running and reachable"
    DOCKER_DAEMON_RUNNING=1
  else
    report_warn "Docker daemon is not running" "Start Docker Desktop before running database containers."
  fi
fi

print_header "STAGE 3: ENVIRONMENT CONFIGURATION (REQUIRED)"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"
TARGET_DB_PORT=5435
DB_USER="hackathon"
DB_NAME="hackathon"

if [ -f "$ENV_FILE" ]; then
  report_pass ".env file exists at repository root"
  
  REQUIRED_KEYS=("PORT" "NEXT_PUBLIC_API_BASE_URL" "DATABASE_URL")
  MISSING_KEYS=()
  for key in "${REQUIRED_KEYS[@]}"; do
    if ! grep -q -E "^\s*${key}\s*=" "$ENV_FILE"; then
      MISSING_KEYS+=("$key")
    fi
  done
  
  if [ ${#MISSING_KEYS[@]} -eq 0 ]; then
    report_pass "All essential environment keys are defined in .env"
  else
    report_warn "Missing keys in .env: ${MISSING_KEYS[*]}" "Review .env.example and add missing keys."
  fi

  PORT_VAL=$(grep -E "^\s*POSTGRES_PORT\s*=" "$ENV_FILE" 2>/dev/null | head -n 1 | sed -E 's/^\s*POSTGRES_PORT\s*=\s*['"'"'"]?([0-9]+)['"'"'"]?.*$/\1/')
  if [ -n "$PORT_VAL" ]; then
    TARGET_DB_PORT="$PORT_VAL"
  fi
  USER_VAL=$(grep -E "^\s*POSTGRES_USER\s*=" "$ENV_FILE" 2>/dev/null | head -n 1 | sed -E 's/^\s*POSTGRES_USER\s*=\s*['"'"'"]?([^'"'"'"[:space:]]+)['"'"'"]?.*$/\1/')
  if [ -n "$USER_VAL" ]; then
    DB_USER="$USER_VAL"
  fi
  NAME_VAL=$(grep -E "^\s*POSTGRES_DB\s*=" "$ENV_FILE" 2>/dev/null | head -n 1 | sed -E 's/^\s*POSTGRES_DB\s*=\s*['"'"'"]?([^'"'"'"[:space:]]+)['"'"'"]?.*$/\1/')
  if [ -n "$NAME_VAL" ]; then
    DB_NAME="$NAME_VAL"
  fi
else
  report_warn ".env file does not exist yet" "Run 'cp .env.example .env' to initialize."
fi

print_header "STAGE 4: LOCAL PORT AVAILABILITY CHECK"

is_port_in_use() {
  local port=$1
  if command -v lsof >/dev/null 2>&1; then
    if lsof -i ":$port" -sTCP:LISTEN -t >/dev/null 2>&1; then
      return 0
    fi
  fi
  if command -v ss >/dev/null 2>&1; then
    if ss -tuln 2>/dev/null | grep -q -E "[:.]$port[[:space:]]"; then
      return 0
    fi
  fi
  if command -v netstat >/dev/null 2>&1; then
    if netstat -tuln 2>/dev/null | grep -q -E "[:.]$port[[:space:]]"; then
      return 0
    fi
    if netstat -ano 2>/dev/null | grep -q -E "[:.]$port[[:space:]]+.*LISTENING"; then
      return 0
    fi
  fi
  if (echo > "/dev/tcp/127.0.0.1/$port") 2>/dev/null; then
    return 0
  fi
  return 1
}

check_port() {
  local port=$1
  local name=$2
  local is_informational=${3:-0}

  if is_port_in_use "$port"; then
    if [ "$is_informational" -eq 1 ]; then
      report_info "Port $port ($name) is in use on host" "Notice: External port; does not conflict with Hoollow-Offline PostgreSQL (port $TARGET_DB_PORT)."
    else
      report_warn "Port $port ($name) is currently occupied" "Stop the occupying process or change $name port in .env."
    fi
  else
    if [ "$is_informational" -eq 1 ]; then
      report_info "Port $port ($name) is free"
    else
      report_pass "Port $port ($name) is free"
    fi
  fi
}

check_postgres_port() {
  local port=$1
  local name=$2
  local container="hackathon_postgres"

  if ! is_port_in_use "$port"; then
    report_pass "Port $port ($name) is free"
    return
  fi

  if [ "$DOCKER_DAEMON_RUNNING" -eq 1 ]; then
    local status=""
    local health=""
    local inspect_out
    inspect_out=$(docker inspect --format '{{.State.Status}}|{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$container" 2>/dev/null || true)
    if [ -n "$inspect_out" ]; then
      status=$(echo "$inspect_out" | cut -d'|' -f1)
      health=$(echo "$inspect_out" | cut -d'|' -f2)
    fi

    if [ -z "$status" ]; then
      local compose_status
      compose_status=$(docker compose -f "$ROOT_DIR/docker-compose.yml" ps postgres --format json 2>/dev/null || true)
      if [ -n "$compose_status" ]; then
        status=$(echo "$compose_status" | grep -o '"State":"[^"]*"' | head -n 1 | cut -d'"' -f4)
        health=$(echo "$compose_status" | grep -o '"Health":"[^"]*"' | head -n 1 | cut -d'"' -f4)
      fi
    fi

    local pub_port
    pub_port=$(docker port "$container" 5432 2>/dev/null || true)
    if [ -z "$pub_port" ]; then
      pub_port=$(docker compose -f "$ROOT_DIR/docker-compose.yml" port postgres 5432 2>/dev/null || true)
    fi

    local port_matches=0
    if echo "$pub_port" | grep -q -E ":$port(\$|[[:space:]])"; then
      port_matches=1
    fi

    if [ "$status" = "running" ] && [ "$port_matches" -eq 1 ]; then
      local pg_ready=0
      local pg_out
      pg_out=$(docker exec "$container" pg_isready -U "$DB_USER" -d "$DB_NAME" 2>&1 || true)
      if echo "$pg_out" | grep -q "accepting connections"; then
        pg_ready=1
      else
        pg_out=$(docker compose -f "$ROOT_DIR/docker-compose.yml" exec -T postgres pg_isready -U "$DB_USER" -d "$DB_NAME" 2>&1 || true)
        if echo "$pg_out" | grep -q "accepting connections"; then
          pg_ready=1
        fi
      fi

      if [ "$health" = "healthy" ] && [ "$pg_ready" -eq 1 ]; then
        report_pass "Port $port ($name) is bound to healthy container '$container' and accepting connections"
        return
      elif [ "$pg_ready" -eq 1 ]; then
        report_pass "Port $port ($name) is bound to '$container' and accepting connections (pg_isready: pass)"
        return
      else
        report_warn "Port $port ($name) is bound by '$container', but database is not ready yet (pg_isready check failed)" "Check database logs with 'npm run db:logs' or wait for container initialization to complete."
        return
      fi
    fi
  fi

  report_warn "Port $port ($name) is currently occupied" "Port $port is needed when running $name. Either stop the occupying process or change $name port in .env."
}

check_port 3000 "Frontend Web Server" 0
check_port 3001 "Backend API Server" 0
check_postgres_port "$TARGET_DB_PORT" "Hackathon PostgreSQL"
if [ "$TARGET_DB_PORT" != "5434" ]; then
  check_port 5434 "External Project PostgreSQL" 1
fi
if [ "$TARGET_DB_PORT" != "5432" ]; then
  check_port 5432 "Default PostgreSQL (Host)" 1
fi

print_header "STAGE 5: NETWORK & REGISTRY CONNECTIVITY"

if command -v curl >/dev/null 2>&1; then
  if curl -s --connect-timeout 5 https://registry.npmjs.org/ >/dev/null 2>&1; then
    report_pass "Internet connectivity to npm registry confirmed"
  else
    report_warn "Could not reach registry.npmjs.org" "Verify Wi-Fi / proxy connection at venue."
  fi
fi

print_header "PREFLIGHT SUMMARY"
echo -e "\033[0;32m  Checks Passed:   $PASS_COUNT\033[0m"
echo -e "\033[1;33m  Warnings:        $WARN_COUNT\033[0m"
echo -e "\033[0;31m  Errors/Failures: $FAIL_COUNT\033[0m"
echo -e "\033[0;36m-----------------------------------------------------------------\033[0m"

if [ "$FAIL_COUNT" -eq 0 ]; then
  echo -e "\033[0;32m  STATUS: READY FOR HACKATHON PREPARATION / VENUE CODING\033[0m"
  exit 0
else
  echo -e "\033[0;31m  STATUS: ATTENTION REQUIRED - Resolve errors above before the event\033[0m"
  exit 1
fi
