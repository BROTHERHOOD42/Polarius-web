# 개발환경 구축 가이드
  
*Please click [here](https://github.com/BROTHERHOOD42/Polarius-web/blob/main/docs/Beginner_Development_Setting_Guide.md) for the English version.
  
> **요약 (한눈에 보기)**
>
> 이 문서는 로컬 개발환경에서 Matrix 서버(덴드라이트 Dendrite)와 데스크탑용 클라이언트(Polarius-desktop, web 앱 포함)를 빠르고 안전하게 띄워서 테스트할 수 있도록 초심자도 따라오기 쉽게 단계별로 정리한 가이드입니다. 핵심 흐름은 다음과 같습니다:
>
> 1. WSL2에 Ubuntu 설치
> 2. 필수 패키지(Go, Node, PostgreSQL 등) 설치
> 3. PostgreSQL 설정 및 사용자/DB 생성
> 4. Dendrite 설정 파일(dendrite.yaml) 편집
> 5. Dendrite 바이너리 빌드 및 키/인증서 생성
> 6. Dendrite 실행 및 테스트 계정 생성
> 7. Polarius-web(또는 element-web) 빌드 → 데스크탑 앱의 `webapp` 폴더로 복사
> 8. Polarius-desktop 시작 → 앱에서 `localhost`의 Dendrite에 연결

---

## 대상 독자

* Matrix/Dendrite, Electron 기반 데스크탑 앱, Node/Golang 빌드에 익숙해지려는 초심자
* Windows(WSL2) 환경에서 로컬로 전체 스택을 띄워보고 싶은 개발자

## 전제조건

* Windows 10/11 (관리자 권한이 있는 사용자 계정)
* 인터넷 연결
* 기본적인 커맨드 라인 사용법(복사/붙여넣기, 디렉터리 이동 등)

> **참고**: 가이드의 예시 명령어들은 당신의 리포지터리 이름(예: `Polarius-web`, `Polarius-desktop`)과 경로에 맞춰 변형해서 사용하세요. 일부 예시는 `element-web`/`element-desktop`으로 되어 있으니 실제 프로젝트명으로 바꾸어 적용하면 됩니다.

---

# 1. WSL2 + Ubuntu 설치 (Windows)

1. PowerShell(관리자)에서 WSL 설치 및 기본 우분투 배포판 설치:

```powershell
wsl --install -d Ubuntu
```

2. 설치가 끝나면 PC를 재부팅합니다.
3. 재부팅 후 Windows에서 `Ubuntu` 앱을 실행하고, 로그인할 리눅스 사용자 계정(사용자명 + 비밀번호)을 만듭니다.

**팁**: WSL2는 Windows와 네트워크 포트를 일부 공유합니다. 로컬에서 `localhost`로 접근하면 WSL 내부에서 띄운 서버에 접근 가능한 경우가 많습니다.

---

# 2. 시스템 업데이트 및 필수 패키지 설치 (Ubuntu)

Ubuntu 터미널에서:

```bash
# 패키지 인덱스 업데이트
sudo apt update && sudo apt upgrade -y

# 기본 빌드 도구 및 Git 등
sudo apt install -y build-essential git curl wget ca-certificates gnupg lsb-release

# PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Node.js & Yarn (웹/데스크탑 빌드용) - Node LTS 권장
# (아래는 예시. 환경에 맞게 설치 방법을 선택하세요)
# curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
# sudo apt install -y nodejs

# Go (Golang) - apt로 설치 가능하지만 최신 버전이 필요하면 공식 tarball 설치 권장
# sudo apt install -y golang-go
```

**설치 팁**:

* `apt`로 설치되는 `golang-go`는 배포판의 버전일 수 있습니다. Dendrite 빌드에 문제가 생긴다면 공식 Go 바이너리(tar.gz)를 내려받아 `/usr/local`에 설치하고 `PATH`를 설정하는 방법을 권장합니다.
* Node.js와 Yarn은 웹 빌드에 필수입니다. `yarn`이 없다면 `npm i -g yarn` 또는 Yarn 공식 설치 방법을 사용하세요.

---

# 3. PostgreSQL 설정 (Dendrite용 DB 생성)

1. PostgreSQL 서비스 시작(만약 자동 시작되지 않았다면):

```bash
sudo service postgresql start
```

2. Dendrite용 DB와 사용자 생성 (비밀번호 입력 프롬프트가 뜹니다):

```bash
sudo -u postgres createuser dendrite --pwprompt
sudo -u postgres createdb -O dendrite dendrite
```

3. 연결 확인:

```bash
# psql로 접속 테스트
psql -U dendrite -d dendrite -h localhost
# psql 내부에서: \l   (데이터베이스 목록)
#                   \du  (유저 목록)
#                   \q   (종료)
```

**문제 해결**:

* `role "dendrite" does not exist` 같은 오류가 나면 `createuser`가 제대로 실행되지 않은 것입니다. `sudo -u postgres psql`로 접속해 수동으로 유저/권한을 확인하세요.
* 포트 번호는 기본 `5432`입니다. 다른 포트를 사용했다면 Dendrite 설정 파일에 동일한 포트로 기입해야 합니다.

---

# 4. Dendrite 설정 파일: `dendrite.yaml` 편집

`dendrite.yaml`에는 데이터베이스 연결, 서버 주소, 레지스트레이션 시크릿 등 여러 설정이 있습니다. 꼭 수정해야 하는 항목만 요약합니다.

**중요 항목**:

* **Postgres 연결 URI** (`43-47줄` 위치는 예시이며 파일 버전에 따라 다릅니다):

```yaml
# 예시
media_api:
  connection_string: "postgres://dendrite:YourPasswordHere@localhost:5432/dendrite?sslmode=disable"

# 또는 repository 관련 섹션에서
accounts:
  connection_string: "postgres://dendrite:YourPasswordHere@localhost:5432/dendrite?sslmode=disable"
```

* **registration\_shared\_secret** (대략 180번째 줄 근처):

```yaml
registration_shared_secret: "mysecretkey123"
```

> **주의**: 실제 운영 환경에서는 `registration_shared_secret`와 DB 비밀번호를 안전하게 보관하세요. 로컬 테스트용이라도 추후 공개 저장소에 커밋하지 않도록 `.gitignore`나 비밀관리 방식을 고려하세요.

---

# 5. Dendrite 바이너리 빌드

Dendrite 소스 디렉터리(예: `dendrite/`)에서:

```bash
# 의존성 다운로드
go mod download

# 빌드 (모든 실행파일을 bin/에 생성)
go build -o bin/ ./cmd/...
```

성공하면 `bin/dendrite` 등 실행파일들이 생성됩니다. (Windows 환경에서 빌드 시 `.exe` 확장자가 붙을 수 있습니다.)

**빌드 실패 주요 원인**:

* Go 버전 불일치 (권장: Go 1.18 이상)
* `go.mod`에 명시된 모듈 의존성 문제 → `go mod tidy` 또는 `go clean -modcache` 후 재시도

---

# 6. Matrix 서명 키 생성

Dendrite(또는 관련 툴)가 사용하는 서명용 개인키를 생성합니다:

```bash
# 예시 (빌드된 도구 사용)
./bin/generate-keys --private-key matrix_key.pem

# Windows에서 빌드한 경우
./bin/generate-keys.exe --private-key matrix_key.pem
```

이 명령은 Matrix가 사용하는 개인키(예: `matrix_key.pem`)를 생성합니다. 파일 권한을 안전하게 설정하세요.

---

# 7. 로컬 TLS 인증서 생성 (mkcert 사용 예시)

개발환경에서 HTTPS를 테스트하려면 자체 서명 인증서가 필요합니다. `mkcert`는 로컬 개발용 인증서 발급을 간단히 해줍니다.

**Windows PowerShell 예시**:

```powershell
# mkcert 실행 파일 다운로드 (예시: v1.4.4)
Invoke-WebRequest -Uri "https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-windows-amd64.exe" -OutFile "mkcert.exe"

# 루트 인증서 설치
.\mkcert.exe -install

# localhost용 인증서 발급 (localhost + 127.0.0.1 + ::1)
.\mkcert.exe localhost 127.0.0.1 ::1

# 결과: localhost+2.pem, localhost+2-key.pem 같은 파일이 생성됩니다.
```

**Linux(WSL)에서의 대안**: `mkcert`를 리눅스 바이너리로 설치하거나 패키지 매니저(또는 `brew`/`apt` 방식)로 설치 후 같은 방식으로 인증서를 발급하세요.

---

# 8. Dendrite 서버 실행

생성된 TLS 인증서와 설정 파일을 사용하여 Dendrite를 실행합니다:

```bash
# Linux / WSL에서
./bin/dendrite --tls-cert localhost+2.pem --tls-key localhost+2-key.pem --config dendrite.yaml --really-enable-open-registration

# Windows에서 .exe 확장자 사용 시
./bin/dendrite.exe --tls-cert localhost+2.pem --tls-key localhost+2-key.pem --config dendrite.yaml --really-enable-open-registration
```

실행 후 기본 엔드포인트는 다음과 같습니다:

* HTTP: `http://localhost:8008`
* HTTPS: `https://localhost:8448`

> **주의**: `--really-enable-open-registration`는 개발/테스트 전용입니다. 실제 서비스 운영 시에는 인증/등록 정책을 신중히 설정하세요.

---

# 9. 테스트 계정(일반/관리자) 생성

```bash
# 일반 사용자 생성
./bin/create-account --config dendrite.yaml --username alice --password alice_password

# 관리자 사용자 생성
./bin/create-account --config dendrite.yaml --username admin --password admin_password --admin
```

(Windows에서는 `.exe` 확장자 사용)

로그인 후 클라이언트에서 동작 확인하세요.

---

# 10. Polarius-web (웹앱) 빌드

1. 소스 클론 후 프로젝트 디렉터리로 이동:

```bash
# 예시
git clone <your-polarius-web-repo-url> polarius-web
cd polarius-web
```

2. 의존성 설치 및 빌드

```bash
# Yarn 사용
yarn install
yarn build

# 또는 npm 사용
# npm install
# npm run build
```

빌드 결과물은 일반적으로 `webapp/` 또는 `build/` 디렉터리 안에 생성됩니다. (프로젝트 설정에 따라 다름)

---

# 11. Polarius-desktop에 웹앱 복사 및 데스크탑 시작

**웹앱을 데스크탑 앱으로 배포(개발용)**

* Windows(로컬): `robocopy` 사용 예시

```powershell
# PowerShell에서
robocopy path\to\polarius-web\webapp C:\Users\<YourUser>\Desktop\Polarius-desktop\webapp /E
```

* WSL에서 Windows 경로로 복사하는 방법

```bash
# 예: 빌드 결과가 ./webapp 일 때
cp -r ./webapp /mnt/c/Users/<YourUser>/Desktop/Polarius-desktop/webapp
```

**데스크탑 앱 빌드 / 실행**

```bash
cd ../Polarius-desktop
yarn install
# 개발 모드 실행
yarn start

# 패키징(프로덕션) 예시
# yarn build
```

데스크탑 앱은 내부적으로 로컬 `webapp`을 불러와 실행하며, Dendrite의 `localhost:8008/8448` 엔드포인트에 연결하도록 설정되어야 합니다.

---

# 12. 확인 포인트 (무엇을 확인할지)

* PostgreSQL 연결 정상( `psql -U dendrite -d dendrite -h localhost`)
* Dendrite가 포트 8008/8448에서 리스닝하는지 확인 (`ss -tlnp | grep 8008`)
* 브라우저에서 `https://localhost:8448` 접속(자체 서명 경고가 뜰 수 있음)
* 데스크탑 앱에서 계정 로그인 및 메시지 송수신 테스트

---

# 13. 자주 겪는 문제와 해결법

* **포트 충돌**: 이미 포트가 사용 중이면 `address already in use` 오류가 납니다. 어떤 프로세스가 점유하는지 확인 후 종료하거나 Dendrite 포트를 변경하세요.
* **Postgres 인증 실패**: `pg_hba.conf`의 인증 방식 또는 DB 유저/비밀번호를 다시 확인하세요.
* **Go 빌드 에러**: `go env`로 `GOPATH`/`GOROOT`가 올바른지 확인하고 `go mod tidy`를 시도하세요.
* **Node/yarn 문제**: Node 버전이 너무 낮으면 종속성 충돌이 발생합니다. LTS 버전 설치를 권장합니다.
* **Windows ↔ WSL 파일 복사 문제**: 권한(퍼미션) 문제로 인해 복사 실패할 수 있습니다. `cp` 대신 Windows 쪽에서 `robocopy`로 복사하면 권한 충돌을 피할 수 있습니다.

---

# 14. 보안 및 운영 관련 메모

* 로컬 개발에서의 자체 서명 인증서는 운영 환경에서 사용할 수 없습니다. 실제 네트워크 서비스로 운영하려면 도메인(DNS)과 공인 SSL(예: Let's Encrypt) 인증서를 사용해야 합니다.
* 비밀번호, `registration_shared_secret` 같은 민감정보는 절대로 공개 저장소에 커밋하지 마세요. `.env` 또는 시크릿 매니저 사용을 권장합니다.

---

# 15. 빠른 명령 모음 (핵심만)

```bash
# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# PostgreSQL: 유저/DB 생성
sudo -u postgres createuser dendrite --pwprompt
sudo -u postgres createdb -O dendrite dendrite

# Dendrite 빌드
go mod download
go build -o bin/ ./cmd/...

# 키/인증서 (예시)
./bin/generate-keys --private-key matrix_key.pem
# mkcert(Windows PowerShell 예)
# .\mkcert.exe -install
# .\mkcert.exe localhost 127.0.0.1 ::1

# Dendrite 실행
./bin/dendrite --tls-cert localhost+2.pem --tls-key localhost+2-key.pem --config dendrite.yaml --really-enable-open-registration

# Web앱 빌드
cd polarius-web
yarn install && yarn build

# Webapp 복사 (WSL -> Windows)
cp -r ./webapp /mnt/c/Users/<YourUser>/Desktop/Polarius-desktop/webapp

# 데스크탑 실행
cd ../Polarius-desktop
yarn install
yarn start
```

---

# 부록: 예시 `dendrite.yaml` 연결 문자열 스니펫

```yaml
# DB 연결 예시
database:
  common:
    connection_string: "postgres://dendrite:YourPasswordHere@localhost:5432/dendrite?sslmode=disable"

# registration_shared_secret 예시
registration_shared_secret: "mysecretkey123"
```

---

## 마무리

이 가이드는 로컬 개발환경에서 Dendrite 기반 Matrix 서버와 데스크탑 클라이언트를 띄우는 데 필요한 주요 단계를 초심자 친화적으로 정리한 것입니다. 실제 환경(도메인, 공인 인증서, 방화벽, 리버스 프록시 등)을 구성할 때는 추가 보안 설정과 배포 절차가 필요합니다.

원하시면 이 문서를 기반으로 사용자가 바로 복사/붙여넣기해서 쓸 수 있는 **스크립트(설치 스크립트, 빌드 스크립트)** 또는 `dendrite.yaml`의 전체 예시 파일을 만들어 드릴게요. 어떤 걸 먼저 도와드릴까요?
