# Book Editor Scripts

## Quick Start

### Windows
```bat
scripts\start.bat
```

### Linux/Mac
```bash
chmod +x scripts/start.sh
./scripts/start.sh
```

## Scripts

| File | Description |
|------|-------------|
| `start.bat` | Windows - Installs deps (if needed) + starts frontend & backend |
| `start.sh` | Unix/Linux/Mac - Installs deps (if needed) + starts frontend & backend |
| `stop.bat` | Windows - Stops all Book Editor services |
| `run_frontend_backend.bat` | Windows - Starts both services (no install) |
| `run_frontend_backend.sh` | Unix/Linux/Mac - Starts both services (no install) |

## Ports

- **Backend:** http://localhost:3001
- **Frontend:** http://localhost:5173
- **API Proxy:** Frontend proxies `/api/*` to Backend

## Services

The start script will:
1. Check and install root dependencies (concurrently)
2. Check and install backend dependencies
3. Check and install frontend dependencies
4. Start backend on port 3001
5. Start frontend on port 5173

To stop services, close the terminal windows or run `stop.bat`.