<div align="center"><br><img width="847" height="135" alt="Polarius" src="https://raw.githubusercontent.com/BROTHERHOOD42/Polarius-web/main/docs_img/Polarius.PNG" /></div><br>

### 요약  

공동의 목표에 대한 기여증명 화폐 발행구조와 기여량 기반의 참정구조가 결합된 매트릭스 클라이언트로, Element를 기반으로 제작되었습니다. 자세한 설명은 [Polarius_kr.md](https://github.com/BROTHERHOOD42/Polarius-web/blob/main/docs/Polarius_kr.md)문서에서 확인할 수 있습니다.  

## 시작하기  

Polarius 사용자는 https://brotherhood42.github.io 에 접속하여 바로 시작할 수 있습니다.  

### 권장 개발 환경 설정  

1. Dendrite 설정 [(가이드)](https://element-hq.github.io/dendrite/)  
2. Polarius-web 및 Polarius-desktop 클론  
3. Polarius-web 빌드 후, 생성된 결과물을 Polarius-desktop/webapp 폴더에 복사  
4. Polarius-desktop 실행 후 localhost:포트로 접속  

자세한 명령어는 [초보자 개발 가이드](https://github.com/BROTHERHOOD42/Polarius-web/blob/main/docs/Beginner_Development_Setting_Guide_kr.md)에서 확인하세요.  

## 기여하기  

누구나 Polarius-web 코드에 기여할 수 있으며, 기여도 증명(Proof of Contribution)을 통해 BROTHERHOOD 화폐를 받을 수 있습니다.  

### 기여 절차  

1. GitHub에서 Polarius-web을 포크합니다.  
  
2. 개발 환경에서 수정 및 테스트 후 Pull Request(PR)를 생성합니다.  
  
   **PR 설명에는 반드시 다음을 포함해야 합니다:**  
   - 본인의 BROTHERHOOD DAO 지갑 공개키  
   - 변경 사유 및 내용  
   - 기존 문제점과 해결 방법  
   - 변경 전후 비교 스크린샷  
   - 테스트 방법  
   - 코드 내부 주석 추가  
  
   **Polarius 클라이언트에서 BROTHERHOOD DAO 지갑 생성 방법:**  
   - Polarius를 실행하고 로그인한 뒤, 클라이언트 검색창에서 **#brotherhood42:matrix.org** 를 검색해 방에 참여하세요.  
   - DAO Space 안에서 **"새 지갑 생성(Create New Wallet)"** 버튼을 클릭합니다.  
   - 생성된 니모닉 구문과 공개키(지갑 주소)는 반드시 안전하게 보관하세요.
  
     *DAO시스템을 원활하게 이용하기 위해서는 DAO스페이스의 원장룸(ledger)과 하위 스페이스인 GOV스페이스 및 DCA스페이스에 참가해야 합니다.

3. 리뷰 및 머지  

4. 'Polarius Development' 방에서 기여 증명  

   - 이 방은 BROTHERHOOD 스페이스의 **DCA 공간** 안에 있습니다.  
   - 이곳에서 본인의 PR 링크와 간단한 요청 코멘트를 남길 수 있습니다.  
   - DCA 방의 검증자가 PR을 확인하고 승인 시 Kubos를 남겨줍니다.  
   - 그 후 Kubos의 값에 따라 상응하는 BROTHERHOOD 토큰이 DAO 지갑에 자동 분배됩니다.  
   - (PR이 이미 머지된 이후에도 코멘트를 남겨도 괜찮습니다.)  

   **BROTHERHOOD (B)** 는 기여도를 기반으로 발행되는 새로운 형태의 화폐입니다.  
   이는 사용자 간의 교환 및 거래에 자유롭게 사용할 수 있습니다.  
   또한 GOV Space에서 제안이 생성될 때, 스냅샷 과정에서 본인의 BROTHERHOOD (B) 잔고가 참조되며 DAO 거버넌스 참여가 가능합니다.  

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
Giveth: https://giveth.io/project/support-polarius  
