# Real Ritual RPC Setup Guide

This document outlines the steps to switch from a local development environment (Hardhat/Anvil) to a real Ritual node.

## 1. Prerequisites
- A real Ritual node RPC endpoint (e.g., `https://ritual.meechain.live`)
- Docker and Docker Compose installed
- Caddy installed (if using reverse proxy)

## 2. Environment Switching
Use the helper scripts in `/scripts` to switch between environments:

### Windows (PowerShell)
```powershell
.\scripts\switch-env.ps1 ritual   # Switch to Ritual
.\scripts\switch-env.ps1 hardhat  # Switch back to Hardhat
```

### Linux (Bash)
```bash
chmod +x ./scripts/switch-env.sh
./scripts/switch-env.sh ritual   # Switch to Ritual
./scripts/switch-env.sh hardhat  # Switch back to Hardhat
```

## 3. Docker Compose Configuration
The `deploy/docker-compose.yml` file includes both `hardhat-node` and `ritual-node`. The `caddy` service routes traffic based on the `USE_ENV` environment variable.

### Start Services
```bash
cd deploy
docker compose up -d
```

### Restart Caddy after switching environment
```bash
docker compose restart caddy
```

## 4. Verification
Run the RPC check script to verify the endpoint:
```bash
npm run check:rpc
```

If successful, you will see:
```
✅ RPC check passed! Ready for deployment.
```

## 5. Deployment
Once the RPC check passes, run the deployment script:
```bash
npm run deploy
```

## 6. Troubleshooting
- **Block Number is 0:** The node is not synced or is a fresh local instance.
- **Client Version is Hardhat:** You are still pointing to a local development node.
- **Connection Failed:** Check your network settings and the `RITUAL_RPC_URL` in `.env`.
