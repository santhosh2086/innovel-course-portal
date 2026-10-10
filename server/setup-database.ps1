$ErrorActionPreference = 'Stop'

Write-Host "`nINNOVEL database setup" -ForegroundColor Cyan

# Locate PostgreSQL's command-line client even if it is not in PATH.
$psqlCommand = Get-Command psql -ErrorAction SilentlyContinue
$psql = if ($psqlCommand) { $psqlCommand.Source } else { $null }
if (-not $psql) {
  $candidates = @(
    "$env:ProgramFiles\PostgreSQL\18\bin\psql.exe",
    "$env:ProgramFiles\PostgreSQL\17\bin\psql.exe",
    "$env:ProgramFiles\PostgreSQL\16\bin\psql.exe",
    "$env:ProgramFiles\PostgreSQL\15\bin\psql.exe",
    "$env:ProgramFiles\PostgreSQL\14\bin\psql.exe"
  )
  $psql = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
}
if (-not $psql) {
  Write-Host "Could not find psql.exe. Install PostgreSQL with Command Line Tools, or add its bin folder to PATH." -ForegroundColor Red
  Write-Host "Download: https://www.postgresql.org/download/windows/"
  exit 1
}

$serverDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$envFile = Join-Path $serverDir '.env'
if (-not (Test-Path $envFile)) {
  Write-Host "server/.env is missing. Copy .env.example to .env and set DATABASE_URL first." -ForegroundColor Red
  exit 1
}

$databaseUrlLine = Get-Content $envFile | Where-Object { $_ -match '^\s*DATABASE_URL\s*=' } | Select-Object -First 1
if (-not $databaseUrlLine) { throw 'DATABASE_URL is missing from server/.env' }
$dbUrl = ($databaseUrlLine -split '=', 2)[1].Trim().Trim('"').Trim("'")
try { $uri = [System.Uri]$dbUrl } catch { throw 'DATABASE_URL in server/.env is not a valid PostgreSQL URL.' }
$dbName = $uri.AbsolutePath.TrimStart('/')
if (-not $dbName) { throw 'Database name is missing from DATABASE_URL.' }
$dbUser = if ($uri.UserInfo) { [System.Uri]::UnescapeDataString(($uri.UserInfo -split ':', 2)[0]) } else { 'postgres' }
$dbHost = if ($uri.Host) { $uri.Host } else { 'localhost' }
$dbPort = if ($uri.Port -gt 0) { $uri.Port } else { 5432 }

Write-Host "Using psql: $psql"
Write-Host "Target database: $dbName at ${dbHost}:$dbPort (user $dbUser)"
Write-Host 'PostgreSQL may ask for the database administrator password.'

# Create the target database if it does not exist. The administrator account is postgres.
$exists = & $psql -h $dbHost -p $dbPort -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$($dbName.Replace("'", "''"))'" 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host $exists
  Write-Host 'Could not connect to PostgreSQL. Check that its service is running and the postgres password is correct.' -ForegroundColor Red
  exit 1
}
if (($exists | Out-String).Trim() -ne '1') {
  & $psql -h $dbHost -p $dbPort -U postgres -d postgres -c "CREATE DATABASE `"$dbName`";"
  if ($LASTEXITCODE -ne 0) { throw 'Could not create the database.' }
} else {
  Write-Host "Database '$dbName' already exists."
}

# Run the schema against the same database specified in .env.
& $psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -v ON_ERROR_STOP=1 -f (Join-Path $serverDir 'schema.sql')
if ($LASTEXITCODE -ne 0) { throw 'Schema setup failed. Confirm the database user/password and DATABASE_URL.' }

Push-Location $serverDir
try {
  node .\seed.mjs
  if ($LASTEXITCODE -ne 0) { throw 'Seed failed. Confirm Node.js is installed and server dependencies are installed.' }
} finally { Pop-Location }

Write-Host "`nSetup complete. Restart the backend with: npm start" -ForegroundColor Green
