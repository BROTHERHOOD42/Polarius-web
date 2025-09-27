<div align="center"><br><img width="847" height="135" alt="Polarius" src="https://raw.githubusercontent.com/BROTHERHOOD42/Polarius-web/main/docs_img/Polarius.PNG" /></div><br>

### 요약  

공동의 목표에 대한 기여기반의 토큰 지급구조와 기여량 기반의 참정구조가 결합된 매트릭스 통신 클라이언트로, Element를 기반으로 제작되었습니다. 자세한 설명은 [Polarius_kr.md](https://github.com/BROTHERHOOD42/Polarius-web/blob/main/docs/Polarius_kr.md)문서에서 확인할 수 있습니다.  

## 시작하기  

Polarius 사용자는 https://brotherhood42.github.io 에 접속하여 바로 시작할 수 있습니다.  

### 권장 개발 환경 설정  

1. Dendrite 설정 [(가이드)](https://element-hq.github.io/dendrite/)  
2. Polarius-web 및 Polarius-desktop 클론  
3. Polarius-web 빌드 후, 생성된 결과물을 Polarius-desktop/webapp 폴더에 복사  
4. Polarius-desktop 실행 후 localhost:포트로 접속  

자세한 명령어는 [초보자 개발 가이드](https://github.com/BROTHERHOOD42/Polarius-web/blob/main/docs/Beginner_Development_Setting_Guide_kr.md)에서 확인하세요.  

## 워크플로우  

polarius-web에서 릴리스가 생성되면, polarius-desktop에서도 자동으로 해당 릴리스가 생성되며 https://brotherhood42.github.io 에 배포됩니다.  

### 세부 절차  

1. **웹 릴리스 트리거**  
   - polarius-web 저장소에서 `v`로 시작하는 태그와 함께 릴리스가 발행되면 자동으로 빌드 프로세스가 실행됩니다.  
   - 이 과정에서 polarius-web 저장소의 `webapp` 폴더가 최신 빌드로 갱신됩니다.  
  
2. **데스크톱 릴리스 자동화**  
   - `webapp` 폴더가 업데이트되면, polarius-desktop 저장소로 신호가 전송됩니다.  
   - 이후 업데이트된 `webapp` 및 생성된 `webapp.asar`을 기반으로 모든 지원 플랫폼에 대한 빌드가 진행됩니다:  
     + Windows (x64, ARM64)  
     + macOS  
     + Linux (amd64, ARM64)  

   - 빌드가 완료되면, polarius-desktop 저장소에 새로운 릴리스가 자동으로 생성됩니다.
  
## Info

Organization: https://github.com/BROTHERHOOD42  
Homepage: https://brotherhood42.github.io 
