# 🌀 Storm VPS Manager

A full-featured VPS management suite with admin panel, user dashboard, and real-time console, all styled with a vibrant RGB neon theme.

## Features
- **Admin login**: `vmallu` / `vmallu` (hardcoded)
- Admin can create users and provision Debian VPS with custom CPU/RAM/disk (choose from plans).
- Users see their own VPS details with **Start / Stop / Reboot** controls.
- Interactive WebSocket console.
- RGB animated background and glowing cards.
- Built with Node.js, PostgreSQL, Sequelize, JWT, SSH2, and vanilla JS.

## Deployment on Railway
1. Fork this repository.
2. Create a new Railway project from your GitHub repo.
3. Add a PostgreSQL service (Railway auto‑sets `DATABASE_URL`).
4. Set environment variables:
   - `JWT_SECRET` – generate a random string.
   - `DO_API_TOKEN` – your DigitalOcean API token.
   - `DO_REGION` – e.g., `nyc1`.
   - `DO_SIZE` – fallback default (optional).
   - `ADMIN_USER` – defaults to `vmallu`.
   - `ADMIN_PASS` – defaults to `vmallu`.
5. Deploy! The app will be available at your Railway URL.

## Local Development
```bash
git clone <your-repo>
cd vps-manager
cp .env.example .env
# Edit .env with your DO token and DB URL
docker-compose up -d
