# switch-env.ps1 - PowerShell script to switch between Hardhat and Ritual environments
# Usage: .\switch-env.ps1 ritual   OR   .\switch-env.ps1 hardhat

param (
    [Parameter(Mandatory=$true)]
    [ValidateSet("ritual", "hardhat")]
    [string]$EnvName
)

$EnvFile = ".env"
$ExampleFile = "deploy/.env.example"

# Check if .env exists, if not create from example
if (-not (Test-Path $EnvFile)) {
    Write-Host "Creating .env from $ExampleFile..." -ForegroundColor Cyan
    Copy-Item $ExampleFile $EnvFile
}

# Read current .env content
$Content = Get-Content $EnvFile

# Update USE_ENV value
$NewContent = $Content | ForEach-Object {
    if ($_ -match "^USE_ENV=") {
        "USE_ENV=$EnvName"
    } else {
        $_
    }
}

# Save updated .env
$NewContent | Set-Content $EnvFile

Write-Host "Environment switched to: $EnvName" -ForegroundColor Green
Write-Host "Please restart Docker Compose for changes to take effect: docker compose restart caddy" -ForegroundColor Yellow
