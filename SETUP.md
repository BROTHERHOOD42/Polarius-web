# Polarius 워크플로우 설정 가이드

## 🔐 GitHub Secrets 설정

### Polarius-web 레포지토리
다음 시크릿을 설정해야 합니다:

1. **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

#### 필요한 시크릿:
- `DESKTOP_TRIGGER_TOKEN`: Polarius-desktop 레포지토리를 트리거할 수 있는 Personal Access Token

### Polarius-desktop 레포지토리
다음 시크릿을 설정해야 합니다:

#### 필요한 시크릿:
- `WEBAPP_DOWNLOAD_TOKEN`: Polarius-web 레포지토리에서 artifact를 다운로드할 수 있는 Personal Access Token

## 🎯 Personal Access Token 생성 방법

1. **GitHub** → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. **Generate new token (classic)** 클릭
3. **권한 설정:**
   - `repo` (전체 레포지토리 접근)
   - `workflow` (워크플로우 실행)
   - `actions:read` (Actions 읽기)
4. **Generate token** 클릭
5. **토큰을 복사하여 각 레포지토리의 시크릿으로 설정**

## 🚀 워크플로우 사용 방법

### 1. 웹 릴리스 생성
```bash
# Polarius-web 레포지토리에서
git tag v1.0.0
git push origin v1.0.0

# GitHub에서 릴리스 생성
# - Tag: v1.0.0
# - Title: Polarius Web v1.0.0
# - Description: 릴리스 노트
```

### 2. 자동 프로세스
1. **Polarius-web**에서 `release-webapp.yml` 실행
2. webapp 빌드 및 artifact 업로드
3. **Polarius-desktop**에서 `build-desktop.yml` 자동 트리거
4. 멀티플랫폼 빌드 (Windows x64/ARM64, macOS, Linux AMD64/ARM64)
5. **Polarius-desktop**에 자동 릴리스 생성

## 📋 체크리스트

- [ ] Polarius-web에 `DESKTOP_TRIGGER_TOKEN` 시크릿 설정
- [ ] Polarius-desktop에 `WEBAPP_DOWNLOAD_TOKEN` 시크릿 설정
- [ ] 두 레포지토리 모두에 워크플로우 파일 업로드
- [ ] 첫 번째 릴리스 테스트

## 🔍 문제 해결

### 워크플로우가 실행되지 않는 경우:
1. 시크릿이 올바르게 설정되었는지 확인
2. Personal Access Token 권한 확인
3. 레포지토리 이름이 정확한지 확인 (BROTHERHOOD42/Polarius-web, BROTHERHOOD42/Polarius-desktop)

### 빌드 실패 시:
1. Actions 탭에서 로그 확인
2. artifact 다운로드 성공 여부 확인
3. package.json 버전 업데이트 확인
