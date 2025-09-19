# Beginner Development Setting Guide

*한국어 버전은 [이곳](https://github.com/BROTHERHOOD42/Polarius-web/blob/main/docs/Beginner_Development_Setting_Guide_kr.md)을 클릭해 주세요.

> **Summary (At a glance)**
>
> This document is a step-by-step guide to help beginners set up a local development environment for running a Matrix server (Dendrite) and desktop client (Polarius-desktop with web app). The guide ensures clarity and simplicity, so even first-time users can follow along. The main flow is:
>
> 1. Install WSL2 with Ubuntu
> 2. Install essential packages (Go, Node, PostgreSQL, etc.)
> 3. Configure PostgreSQL and create user/database
> 4. Edit Dendrite configuration file (`dendrite.yaml`)
> 5. Build Dendrite binaries and generate keys/certificates
> 6. Run Dendrite and create test accounts
> 7. Build Polarius-web (or element-web) → copy to Polarius-desktop/webapp
> 8. Start Polarius-desktop → connect to local Dendrite at `localhost`

---

## Audience

* Beginners exploring Matrix/Dendrite, Electron desktop apps, Node/Go builds
* Developers who want to run the full stack locally on Windows (via WSL2)

## Requirements

* Windows 10/11 (with admin privileges)
* Internet connection
* Basic command line knowledge (copy/paste, navigating directories, etc.)

> **Note**: Examples use `Polarius-web` and `Polarius-desktop` repositories. Replace with your actual repository names where appropriate. Some references use `element-web`/`element-desktop`—adapt accordingly.

---

# 1. Install WSL2 + Ubuntu (Windows)

1. Open PowerShell (as Administrator) and install Ubuntu with WSL:

```powershell
wsl --install -d Ubuntu
```

2. Reboot your PC after installation.
3. Launch the `Ubuntu` app in Windows and create a Linux username/password.

**Tip**: WSL2 shares networking with Windows, so services running inside WSL are often accessible via `localhost` on Windows.

---

# 2. Update System and Install Essential Packages (Ubuntu)

In Ubuntu terminal:

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Build tools and Git
sudo apt install -y build-essential git curl wget ca-certificates gnupg lsb-release

# PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Node.js & Yarn (for web/desktop builds)
# Example:
# curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
# sudo apt install -y nodejs

# Go (Golang)
# sudo apt install -y golang-go
```

**Tips**:

* The `golang-go` package may not be the latest version. If you encounter build issues, install the latest Go from the official site.
* Node.js and Yarn are required for building the web and desktop apps. If Yarn isn’t available, install with `npm i -g yarn` or follow Yarn’s official guide.

---

# 3. Configure PostgreSQL (Create DB and User for Dendrite)

1. Start PostgreSQL service if not running:

```bash
sudo service postgresql start
```

2. Create user and database:

```bash
sudo -u postgres createuser dendrite --pwprompt
sudo -u postgres createdb -O dendrite dendrite
```

3. Test connection:

```bash
psql -U dendrite -d dendrite -h localhost
# Inside psql: \l (list DBs), \du (list users), \q (quit)
```

**Troubleshooting**:

* If you see `role "dendrite" does not exist`, re-check user creation.
* Default port is `5432`. If using a different port, update it in `dendrite.yaml`.

---

# 4. Edit Dendrite Config: `dendrite.yaml`

Important sections:

* **Postgres connection URI** (line numbers vary):

```yaml
accounts:
  connection_string: "postgres://dendrite:YourPasswordHere@localhost:5432/dendrite?sslmode=disable"
```

* **Registration shared secret** (around line 180):

```yaml
registration_shared_secret: "mysecretkey123"
```

**Note**: Keep secrets and passwords safe. Don’t commit them to public repos.

---

# 5. Build Dendrite Binary

In the Dendrite source directory:

```bash
# Fetch dependencies
go mod download

# Build binaries into bin/
go build -o bin/ ./cmd/...
```

Check for `bin/dendrite` (or `dendrite.exe` on Windows).

**Common issues**:

* Go version mismatch (recommend 1.18+)
* Dependency errors → try `go mod tidy` or `go clean -modcache`

---

# 6. Generate Matrix Signing Key

```bash
./bin/generate-keys --private-key matrix_key.pem
# Windows: ./bin/generate-keys.exe --private-key matrix_key.pem
```

This generates the key file (e.g., `matrix_key.pem`).

---

# 7. Generate Local TLS Certificates (mkcert)

For HTTPS testing, use `mkcert`:

```powershell
Invoke-WebRequest -Uri "https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-windows-amd64.exe" -OutFile "mkcert.exe"

.\mkcert.exe -install
.\mkcert.exe localhost 127.0.0.1 ::1
```

This creates `localhost+2.pem` and `localhost+2-key.pem`.

---

# 8. Run Dendrite Server

```bash
./bin/dendrite --tls-cert localhost+2.pem --tls-key localhost+2-key.pem --config dendrite.yaml --really-enable-open-registration
```

Endpoints:

* HTTP: `http://localhost:8008`
* HTTPS: `https://localhost:8448`

---

# 9. Create Test Accounts

```bash
# Normal user
./bin/create-account --config dendrite.yaml --username alice --password alice_password

# Admin user
./bin/create-account --config dendrite.yaml --username admin --password admin_password --admin
```

---

# 10. Build Polarius-web

```bash
git clone <your-polarius-web-repo-url> polarius-web
cd polarius-web
yarn install
yarn build
```

The build output is usually in `webapp/` or `build/`.

---

# 11. Copy Webapp to Polarius-desktop and Start Desktop

Copy build to desktop app:

```powershell
robocopy path\to\polarius-web\webapp C:\Users\<YourUser>\Desktop\Polarius-desktop\webapp /E
```

Or from WSL:

```bash
cp -r ./webapp /mnt/c/Users/<YourUser>/Desktop/Polarius-desktop/webapp
```

Start desktop app:

```bash
cd ../Polarius-desktop
yarn install
yarn start
```

---

# 12. Verification Checklist

* Can connect to Postgres: `psql -U dendrite -d dendrite -h localhost`
* Dendrite listens on ports 8008/8448
* `https://localhost:8448` accessible (with browser warning)
* Desktop app can log in and send/receive messages

---

# 13. Common Issues

* **Port conflict** → change port or stop conflicting process.
* **Postgres auth failure** → check `pg_hba.conf` and credentials.
* **Go build errors** → verify Go environment with `go env`.
* **Node/yarn errors** → upgrade to Node LTS.
* **File copy issues (WSL ↔ Windows)** → use `robocopy` to avoid permission problems.

---

# 14. Security and Production Notes

* Local self-signed certs are for dev only. Use a domain + real SSL cert for production.
* Keep DB passwords and secrets out of public repos. Use `.env` or a secret manager.

---

# 15. Quick Commands Recap

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# PostgreSQL user & DB
sudo -u postgres createuser dendrite --pwprompt
sudo -u postgres createdb -O dendrite dendrite

# Dendrite build
go mod download
go build -o bin/ ./cmd/...

# Keys and certs
./bin/generate-keys --private-key matrix_key.pem

# Run Dendrite
./bin/dendrite --tls-cert localhost+2.pem --tls-key localhost+2-key.pem --config dendrite.yaml --really-enable-open-registration

# Webapp build
yarn install && yarn build

# Copy to desktop
cp -r ./webapp /mnt/c/Users/<YourUser>/Desktop/Polarius-desktop/webapp

# Start desktop
yarn install
yarn start
```

---

# Appendix: Example `dendrite.yaml`

```yaml
database:
  common:
    connection_string: "postgres://dendrite:YourPasswordHere@localhost:5432/dendrite?sslmode=disable"

registration_shared_secret: "mysecretkey123"
```

---

## Conclusion

This guide walks beginners through setting up a full Dendrite-based Matrix server with Polarius-web and Polarius-desktop locally. For production, add proper security, domains, SSL certs, and deployment practices.

Would you like me to also prepare a **ready-to-run script** (bash or PowerShell) that automates most of these steps?
