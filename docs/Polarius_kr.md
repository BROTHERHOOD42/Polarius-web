<div align="center"><br><img width="128" height="128" alt="Polarius_overview" src="https://raw.githubusercontent.com/BROTHERHOOD42/Polarius-web/main/docs_img/Polarius_overview.png" /></div><br>

[Polarius](https://brotherhood42.github.io)는 공동 목표에 대한 기여기반 토큰 발급과 기여량 기반의 참정구조가 결합된 협업 친화적 메시지 클라이언트입니다. 

## Polarius, 기여기반 협업 클라이언트

Polarius는 엘리먼트 클라이언트상의 기존 스페이스 생성기능에 기여기반 토큰지급공간과 스냅샷 거버넌스가 포함된 DAO 스페이스 생성을 추가한 메시지 클라이언트입니다. DAO 내 DCA 스페이스에서는 공동체의 공동 목표에 대한 기여활동을 기반으로 토큰를 지급합니다. 이러한 지급구조에서의 토큰 보유량은 곧 정량화된 기여량이며, 보유량에 대한 시점 고정형 거버넌스를 구축하여 "기여한 만큼의 투표권"을 구현합니다. 그리고 이 모든것은 분산형 통신규약인 Matrix상에서 작동함과 더불어 종단간 암호화를 지원하여 탈중앙성 및 검열저항성을 확보합니다. 이는 마치 탈중앙화된 협업 친화적 디스코드처럼 보일 수 있습니다.

<div align="center"><br><img width="1157" height="654" alt="Polarius drawio" src="https://raw.githubusercontent.com/BROTHERHOOD42/Polarius-web/main/docs_img/Polarius.drawio.png" /></div><br>

### 사용자 가이드: DAO스페이스 생성 및 DCA스페이스 사용법

**로그인**  
*클라이언트는 https://brotherhood42.github.io 에서 제공됩니다.
<img width="1264" height="603" alt="1" src="https://raw.githubusercontent.com/BROTHERHOOD42/Polarius-web/main/docs_img/1.PNG" />
<img width="1262" height="605" alt="2" src="https://raw.githubusercontent.com/BROTHERHOOD42/Polarius-web/main/docs_img/2.png" />
<img width="1267" height="617" alt="3" src="https://raw.githubusercontent.com/BROTHERHOOD42/Polarius-web/main/docs_img/3.png" />  
  
  
**DAO 생성**  
*DAO생성시 DAO space 하위에 ledger room 및 GOV space, DCA space가 자동생성됩니다. 이 세가지 요소는 DAO의 필수 기능을 수행합니다. 
<img width="1263" height="625" alt="4" src="https://raw.githubusercontent.com/BROTHERHOOD42/Polarius-web/main/docs_img/4.PNG" />
<img width="1265" height="621" alt="5" src="https://raw.githubusercontent.com/BROTHERHOOD42/Polarius-web/main/docs_img/5.PNG" />
<img width="1269" height="626" alt="6" src="https://raw.githubusercontent.com/BROTHERHOOD42/Polarius-web/main/docs_img/6.PNG" />  
  
  
**DAO Wallet 생성**  
*Wallet생성시 표시되는 니모닉 문구를 저장하세요. 니모닉 문구가 없으면 토큰지갑을 복구할 수 없습니다.
<img width="1258" height="621" alt="7" src="https://raw.githubusercontent.com/BROTHERHOOD42/Polarius-web/main/docs_img/7.PNG" />
<img width="1252" height="628" alt="8" src="https://raw.githubusercontent.com/BROTHERHOOD42/Polarius-web/main/docs_img/8.PNG" />
<img width="1254" height="622" alt="9" src="https://raw.githubusercontent.com/BROTHERHOOD42/Polarius-web/main/docs_img/9.PNG" />  
  
  
**DCA room 생성**
<img width="1256" height="617" alt="10" src="https://raw.githubusercontent.com/BROTHERHOOD42/Polarius-web/main/docs_img/10.PNG" />
<img width="1262" height="627" alt="11" src="https://raw.githubusercontent.com/BROTHERHOOD42/Polarius-web/main/docs_img/11.PNG" />
<img width="1261" height="616" alt="12" src="https://raw.githubusercontent.com/BROTHERHOOD42/Polarius-web/main/docs_img/12.PNG" />
<img width="1246" height="609" alt="13" src="https://raw.githubusercontent.com/BROTHERHOOD42/Polarius-web/main/docs_img/13.PNG" />  
  
  
**기여증명 (검증자 시점)**  
*기여증명 및 지갑복구를 포함한 DAO시스템을 원활하게 이용하기 위해서 기여자는 ledger room 및 GOV spacce, DCA space를 참가해야 합니다.  
*기여증명은 공개키를 매개로한 Kudos권한자의 검증으로 이루어지며, 검증시 기여자에게 Kudos Value만큼의 토큰이 지급됨과 동시에 트랜잭션이 ledger room(원장)에서 자동 생성 및 기록됩니다.  
<img width="1248" height="602" alt="14" src="https://raw.githubusercontent.com/BROTHERHOOD42/Polarius-web/main/docs_img/14.PNG" />
<img width="1248" height="604" alt="15" src="https://raw.githubusercontent.com/BROTHERHOOD42/Polarius-web/main/docs_img/15.PNG" />
<img width="1248" height="606" alt="16" src="https://raw.githubusercontent.com/BROTHERHOOD42/Polarius-web/main/docs_img/16.PNG" />
<img width="1250" height="599" alt="17" src="https://raw.githubusercontent.com/BROTHERHOOD42/Polarius-web/main/docs_img/17.PNG" />  

Kudos권한자(검증자)의 자기검증은 기본적으로 활성화 되어있습니다. Room Settings 내 DCA Settings메뉴에서 비활성화 할 수 있습니다.
<img width="1256" height="611" alt="DCAsetting1" src="https://raw.githubusercontent.com/BROTHERHOOD42/Polarius-web/main/docs_img/DCAsetting1.PNG" />
<img width="1256" height="604" alt="DCAsetting2" src="https://raw.githubusercontent.com/BROTHERHOOD42/Polarius-web/main/docs_img/DCAsetting2.PNG" />

  
**검증권한 부여 (선택사항)**  
*검증권한 레벨 설정은 DAO space 및 DCA room 'Settings' 내 Roles & Permissions 메뉴 하단 'Kudos'란에서 가능합니다. (기본값: 25)
<img width="1256" height="611" alt="18" src="https://raw.githubusercontent.com/BROTHERHOOD42/Polarius-web/main/docs_img/18.PNG" />
<img width="1256" height="604" alt="19" src="https://raw.githubusercontent.com/BROTHERHOOD42/Polarius-web/main/docs_img/19.PNG" />  
  
  
### 사용자 가이드: GOV스페이스 사용법
  
  
**안건 생성 조건설정**  
*관리자는 GOV space 설정의 GOV Settings메뉴에서 'Required B Token Amount'를 설정하여 안건생성에 대한 토큰보유량 조건을 설정할 수 있습니다.
<img width="1257" height="619" alt="20" src="https://raw.githubusercontent.com/BROTHERHOOD42/Polarius-web/main/docs_img/20.PNG" />  
  
  
*GOV space에서의 룸 생성 권한(Manage rooms in this space) 레벨의 기본값은 25이며, 0(Default)으로 바꾸지 않으면 Default권한의 일반 기여자는 'Required B Token Amount'를 충족해도 안건을 생성할 수 없습니다. 이를 유지하여 권한자만 안건생성에 접근토록 할 수 있지만, 0(Default)으로 바꾸어 순수히 기여에 대한 안건생성을 가능하게 할 수도 있습니다.
<img width="1237" height="612" alt="image" src="https://raw.githubusercontent.com/BROTHERHOOD42/Polarius-web/main/docs_img/21.PNG" />
<img width="1246" height="615" alt="22" src="https://raw.githubusercontent.com/BROTHERHOOD42/Polarius-web/main/docs_img/22.PNG" />

**안건 생성**  
*기여자는 해당 DAO의 토큰보유량 조건을 충족하면 안건을 생성할 수 있습니다.  
<img width="1256" height="663" alt="23" src="https://raw.githubusercontent.com/BROTHERHOOD42/Polarius-web/main/docs_img/23.PNG" />
<img width="1260" height="663" alt="24" src="https://raw.githubusercontent.com/BROTHERHOOD42/Polarius-web/main/docs_img/24.PNG" />
<img width="1232" height="648" alt="25" src="https://raw.githubusercontent.com/BROTHERHOOD42/Polarius-web/main/docs_img/25.PNG" />
<img width="1265" height="671" alt="26" src="https://raw.githubusercontent.com/BROTHERHOOD42/Polarius-web/main/docs_img/26.PNG" />
<img width="1268" height="670" alt="27" src="https://raw.githubusercontent.com/BROTHERHOOD42/Polarius-web/main/docs_img/27.PNG" />
<img width="1267" height="666" alt="28" src="https://raw.githubusercontent.com/BROTHERHOOD42/Polarius-web/main/docs_img/28.PNG" />
<img width="1267" height="671" alt="29" src="https://raw.githubusercontent.com/BROTHERHOOD42/Polarius-web/main/docs_img/29.PNG" />

**생성된 안건 확인**  
*안건 생성 양식에 기입한 제목 및 설명, 투표는 안건 생성과 동시에 하나의 제안묶음으로 자동 생성됩니다. 이를 고정하세요.  
*생성자 본인 또한 생성 시점의 토큰보유량에 따른 Voting Power를 행사하여 투표할 수 있습니다.
<img width="1255" height="668" alt="30" src="https://raw.githubusercontent.com/BROTHERHOOD42/Polarius-web/main/docs_img/30.PNG" />
<img width="1256" height="660" alt="31" src="https://raw.githubusercontent.com/BROTHERHOOD42/Polarius-web/main/docs_img/31.PNG" />

**투표 종료 확인**  
*투표 종료시 종료결과가 전송되며, Proposal목록 룸카드의 진행중 표시가 체크 표시로 변경됩니다.
<img width="1256" height="660" alt="32" src="https://raw.githubusercontent.com/BROTHERHOOD42/Polarius-web/main/docs_img/32.PNG" />
  
*Voting Power에 따른 투표는 기여량에 대한 영향력 행사의 개념이며, 토큰이 차감되지 않습니다.
<img width="1265" height="667" alt="33" src="https://raw.githubusercontent.com/BROTHERHOOD42/Polarius-web/main/docs_img/33.PNG" />
<img width="1268" height="667" alt="34" src="https://raw.githubusercontent.com/BROTHERHOOD42/Polarius-web/main/docs_img/34.PNG" />

**지갑 기능**
<img width="1258" height="667" alt="35" src="https://raw.githubusercontent.com/BROTHERHOOD42/Polarius-web/main/docs_img/35.PNG" />
<img width="1258" height="665" alt="36" src="https://raw.githubusercontent.com/BROTHERHOOD42/Polarius-web/main/docs_img/36.PNG" />
<img width="1263" height="660" alt="37" src="https://raw.githubusercontent.com/BROTHERHOOD42/Polarius-web/main/docs_img/37.PNG" />
[or](https://github.com/BROTHERHOOD42/Polarius-web/blob/main/docs/aliceview.md)
