# EVOLVE M07 90% — STEP 3/3: 기존 SHOP+CHALLENGE에서 모두 실제 조작 (2026-10-28 KST)

- M07 80% 실제 게임 내 기본 SHOP에 연동한 V621을 90%로 확장: **영구 코어 외형 2종 컬렉션/장착·해제(공명·심홍)**, V621 결정 **120개 사용→심홍 코어 교환**, 기존 V615/V617 코어 렌더러 전환 및 재입장 후 복원. 기존 캐릭터/몬스터 전투 코드/원본 그림은 수정하지 않음.
- **CHALLENGE** 기존 스테이지 카드 아래 '연구 시즌' 패널 추가. 무료 일일 연구 보급·월간 프리미엄 연구 단계 1~5 보상·완료 및 남은 기간·SHOP으로 이동을 기존 V621 브라우저 지갑과 동기화. 신규 HOME 탭이나 DEV 상점 없음.
- 이전 고객 지시: **유료 시즌 매월 1일~말일 KST(28/29/30/31일), 무료 미션/이벤트 28일 별도 운영 허용, 영구 외형 보유 유지**, 자동 구독 없음. 유저 UI는 정상 구매/장착/수령 용어를 사용하되 '결제 연결 전 체험·실제 청구 없음·표시 가격 미확정'은 명확히 고지. **결정/패스 보상은 브라우저 로컬 체험 재화**, 실제 DNA/서버 계정·구글 결제는 미연결.
- 매출 상위권(2026 Sensor Tower 월별 Honor of Kings/Whiteout Survival/Royal Match) 사례로 재방문 무료 보급·코어 외형의 영구 가치·재화 소모처·시즌 보상 등 범용 수익화 UX 적용. 게임 디자인/배너 저작물 복제 안 함. 상세 `docs/monetization/M07_090_SHOP_CHALLENGE_CORE_QA_KO.md`.
- 80% 배포 `Publish EVOLVE Web`는 **Pages 파일 업로드 자체는 성공, 직후 라이브 QA가 구버전 V620을 읽어 최종 실패**한 것으로 로그 확인. 90%에 `?v=90` 캐시 갱신 + `tools/wait_for_shop_publication.py` 공개 HTML/JS 3자산 폴링 후 브라우저 실검사 실행으로 수정.
- `tests/m07_090_crimson_pass.test.cjs`(결정 120/영구 보유/멱등성/KST 달력), `tests/m07_080_shop_browser.cjs`(실제 3개 모바일 사이즈/게임 코어 2개 장착/CHALLENGE 보상/세이브), `tests/home_hub_browser.cjs`(기존 메뉴/게임 시작). M07 90% Node·브라우저 워크플로 진단, 통과 확인 후 main 반영. 원본 이미지 1021개 유지.
- 복구 원본 `backup/pre-m07-090-live-20261028`; 90% 완성 전체 복구 `backup/monetization-m07-090-20261028` 및 소스 ZIP·검증표. 각 과거 백업 보존.
- 다음 `고`: **M07 100% 완료 검수 + M08(정식 결제 모듈 제외, 백엔드 영수증·권리 원장 설계) 준비**. 이미지 렌더링 **전투/캐릭터/몬스터는 필요 없음**, 상점 이미지/배너는 허용·별도 선택.

---

# EVOLVE 최신 인수인계 — 기본 SHOP 단일화 V620 (2026-10-28 KST)

> M06 10%를 진행하기 전에 사용자 요청인 **DEV 상점 삭제·원래 SHOP 교체 작업을 완료**해야 함. 완료 후 사용자 `고`는 M06 STEP 1/3 · 10%. M05 이전 기능 다시 구현 금지.

- GitHub `idonutyou/EVOLVE` 기능 브랜치 `feature/native-shop-unification-20261028`, 직전 공개 main `4bceade598f3caad3235d0b41e508b1e33c33768`. 성공 후 main fast-forward 및 실제 Pages 검증.
- `web/native-shop-v620.js`: 홈 5탭의 **SHOP** 페이지에만 TEST 구매 상품 5종, 코어 외형 2종, 소유/장착/확인/취소와 TEST 결정 표시. 기존 DNA 강화 카드 `labPanel`은 SHOP에서 숨기되 게임 루틴 참조 보호 위해 DOM 유지.
- 제거 `web/mock-premium-ui-v616.js`, `web/m05-shop-ui-v618.js` 소스, 기존 팝업/트리거용 해시 자산 14개; 3개 독립 native TEST JS 신규, 총 자산 1072 / 기존 이미지 1021 원본. 과거 M05 10~100% 복구는 삭제 금지.
- 기존 `web/mock-premium-v615.js`/ `web/mock-core-visuals-v617.js`는 일반 주소에서 테스트 기능 제공하도록 가드만 조정, 실제 인앱 결제 구현/서버 원장/DNA/전투 스탯 변화 없음. 독립 저장 키 `EVOLVE_DEV_MOCK_STORE_V1`, 실제 가격 null + checkout=false, client_grants=false.
- 3뷰포트 Chrome 통합 검사 https://github.com/idonutyou/EVOLVE/actions/runs/40588368786 success: 별도 DEV 버튼/모달 0, 기본 SHOP 구매·장착·TEST 결정 400→280·원래 저장 보호·손상 방치 안 함, 홈/파츠/전투 회귀 통과.
- 정적 QA `tools/verify_native_shop_v620.py`; 빌드 `tools/build_native_shop_v620.py`; 상세 `docs/monetization/NATIVE_SHOP_V620_MIGRATION_KO.md`; 공개 Pages 배포 검증/백업 `backup/native-shop-v620-20261028`, `checkpoints/EVOLVE_NATIVE_SHOP_V620_20261028.zip`/JSON.
- M05 완료는 유지, M06 10%는 사용자 요청으로 중단 상태; 재개 시 **과금 가치 콘텐츠 설계 최우선**. M06 10%는 이미지 렌더링 불필요, 실제 아트 제작 단계 전에는 알릴 것.
- 물리 Galaxy S23+ 장시간 FPS/발열 시험은 미진행. 이전 인수인계는 아래 유지.

---

# EVOLVE 최종 인수인계 — M05 100% 완료 (2026-10-28 KST)

- 다음 고는 M06 10% STEP 1/3. M05 10~100%를 다시 반복하지 않는다. 모든 작업의 최우선순위는 매출을 만들 수 있는 실제 구매 가치 콘텐츠.
- GitHub Pages https://idonutyou.github.io/EVOLVE/ ; 브랜치 main; 배포 버전 V575-STEP07-MONSTER-FEEDBACK-V614-M04-MOCK70-M05-UX90; 빌드 b985a41a63ea8c9f4e9b6c773dbc7cbcb7b579855a907bdfb693e7e53463d60b.
- Pages 배포 #40578916545 success https://github.com/idonutyou/EVOLVE/actions/runs/40578916545, 공개 실 URL 모바일 Chrome QA #40582048900 success https://github.com/idonutyou/EVOLVE/actions/runs/40582048900.
- M05: 10~30 정보/상품 UX 설계, 40 상점 상세, 50 코어 소유/장착, 60 손상/중복/닫기 안전, 70 모바일 접근성, 80 전체 게임 byte 감사, 90 DEV 터치 충돌 해결/메인 병합, 100 Pages 공개·실 URL QA.
- 주요 보존: 기존 게임 홈 5탭, 전투/파츠·맵·세이브·M03 장부, 기존 이미지 1,021개. 기존 자산 1,078개에 새 M05 개발 스크립트 5개만 추가하여 1,083개.
- 100% 배포 첫 실패는 낡은 V614 검증기의 허용 자산수 1,067/1,078, 두 번째는 기존 M04 DEV 9개를 제외한 추가 5개만 계산한 가정 때문. 지금은 총 DEV 14개, 이미지 1,021개를 정확히 검증한다.
- 정식 상품 가격 null, checkout_enabled=false, client_grants_enabled=false, 실제 Google Play/Apple Billing 및 영수증 검증 미구현. 게임 완성 후 M08에서 연결.
- 최종 전체 트리 복구 backup/monetization-m05-100-20261028; 90% 기준 ZIP checkpoints/EVOLVE_M05_100_20261028.zip 과 SHA256/CRC JSON. 10~90% 복구 절대 삭제 금지.
- 상세 최종 보고 docs/monetization/M05_100_LIVE_FINAL_QA_KO.md. 실제 물리 Galaxy S23+ 발열·프레임·장시간 시험은 미실시.
- M06 10% 이미지 렌더링 불필요; 향후 새 프리미엄 스킨 실 제작에는 렌더링 필요 가능성이 크므로 각 10% 이전에 알릴 것.
- 이전 인수인계는 아래 기록 그대로 유지.

---

# EVOLVE 최신 인수인계 — M05 STEP 3/3 · 90% 진행 (2026-10-28 KST)

> **다음 `고` = M05 100%**. 기존 M05 10~90% 기능을 다시 처음부터 구현하지 않는다. 최우선 과금 가치 콘텐츠 확보, 실제 매출 Billing은 게임 전체 완성 후 M08.

- GitHub `idonutyou/EVOLVE`; 기능 브랜치 `monetization-m05-ux-20261028`. 90% 기본 빌드 `V575-STEP07-MONSTER-FEEDBACK-V614-M04-MOCK70-M05-UX90`, sha `b985a41a63ea8c9f4e9b6c773dbc7cbcb7b579855a907bdfb693e7e53463d60b`. M04 main 원본 `fbe3224a3bdd95020829228427ddc3b05ed41f9e`는 변경 전 기준.
- **실제 수정** `web/m05-shop-ui-v618.js`의 M05 개발 옵트인 CSS에서 `#m04MockTriggerV616`을 하단 5탭 위로 옮겨 터치 겹침 제거. M04 원래 엔진·게임/전투/파츠·M03·오리지널 이미지 변경 없음.
- `tests/monetization_m05_090_touch_browser.cjs`: 393×852, 320×568, 852×393에서 ORGANISM 서브탭·하단 5탭 실제 locator.click 정상, DEV 버튼 간 터치 교차 없음, 개발 상점 표시 정상, 기본 URL의 DEV 기능 숨김. 이전 50~80% 회귀/전투·장착·저장 안전 통과, Node 62/62.
- 처음 workflow https://github.com/idonutyou/EVOLVE/actions/runs/40575562801 의 QA **모두 성공**했지만 브랜치에 이 대화의 문서 갱신이 추가되어 최종 git push만 non-fast-forward 거부. 검증 당시 소스와 현재 소스가 바이트 동일한지/모바일 단계 success 확인 후 https://github.com/idonutyou/EVOLVE/actions/runs/40576659951 **success**로 빌드를 개발 브랜치에 재저장했다.
- 리소스 총 1,083개, 원본 M04 1,078개/이미지 1,021개 불변, M05 DEV JS 5개 추가. 실결제 false/상품 가격 null, 운영 유료 권리·영수증 없음. 실제 Galaxy S23+ 장시간 물리 디바이스 시험은 미실시.
- 90% 복구 `backup/monetization-m05-090-20261028`(전체 Git 트리), ZIP `checkpoints/EVOLVE_M05_090_20261028.zip` 및 SHA/CRC JSON. 이전 10~80% 이전 백업 절대 삭제 금지.
- `main` 브랜치 fast-forward 후 Pages 워크플로 `deploy-pages.yml` 자동 배포. **실제 배포 완료/공개 URL 확인 없이 배포 성공이라 말하지 않는다**. M05 100%는 Pages 실 URL 재조회, 원본·게임 상태·모의/유료 분리, 최종 백업/인수인계 종결 단계.
- **다음 이미지 렌더링 불필요**. 기존 이미지 그대로 유지. M06 이후 프리미엄 코스메틱 아트는 별도 렌더링 안내 후 수행.
- 이전 인수인계는 아래 원문 계속 유지.

---

# EVOLVE 최신 인수인계 — M05 80% STEP 3/3 통합 회귀 통과 (2026-10-28 KST)

> 다음 사용자 `고` = **M05 90%**. 기존 M04/M05 10~80%를 반복하지 말고, 80% QA가 발견한 개발용 버튼 터치 충돌을 우선 해결한 뒤 안전 배포를 검토할 것.

- GitHub `idonutyou/EVOLVE` 기능 브랜치 `monetization-m05-ux-20261028`, 복구 `backup/monetization-m05-080-20261028`. main M04 기준 **`fbe3224a3bdd95020829228427ddc3b05ed41f9e`**, 공개 GitHub Pages **미변경**.
- 정적 게이트 `tools/verify_m05_080_integration.py` main의 기존 **1,078개 리소스 원본 바이트 SHA**를 브랜치와 비교, 이미지 **1,021개** 유지. M05 전용 해시 UI asset 4개로 총 1,082개. 정식 결제 false/모든 SKU 가격 null, 기존 M04 엔진·코어 렌더러·서비스워커 바이트 동일.
- `index.html`도 M05 한 태그/빌드 정보만 제외하면 main 원본과 완전 동일. 기타 게임 코드·M03 유료 원장 미수정.
- 실게임 브라우저 통합 `tests/monetization_m05_080_integration_browser.cjs` / 기존 `tests/home_hub_browser.cjs`, `tests/arm_items_browser.cjs`, `tests/monetization_m04_home_browser.cjs` 통과: 홈 5탭, ORGANISM 파츠, DEV 공명 코어 획득/장착, BATTLE 전투 발광 draw 6회/캐시 builds 2회, 전투 중 모의 상점 차단, M03·게임 저장값 보존. 기본 URL DEV 전역 없음.
- Node M04/M05 회귀 **62/62 pass**, CI **40573303980** https://github.com/idonutyou/EVOLVE/actions/runs/40573303980 success.
- **발견된 미해결 배치 문제:** 개발용 M04 `#m04MockTriggerV616` 버튼의 실제 터치 영역이 모바일 ORGANISM 서브탭 `#homeSpecimenTab`과 겹친다. 오리지널 게임 기능 자체는 정상(스크립트 클릭으로 검사), 기본 URL은 DEV 트리거 없음. **90% 때 개발용 상점 버튼 위치만 조정·실제 터치 회귀 후 main 병합/Pages 배포**. 메인 일반 게임 UI를 무단 재설계하지 말 것.
- M05 80% 품질 보고 `docs/monetization/M05_080_INTEGRATION_GATE_KO.md`, 체크포인트 ZIP `checkpoints/EVOLVE_M05_080_20261028.zip`·JSON, 전체 소스 복구 브랜치. 기존 10~70%/M04 백업 삭제 금지. 80% 새 이미지/게임 엔진 수정 없음.
- 다음 **90% 이미지 렌더링 불필요**. 안전 통합이 가능하면 main과 Pages 업데이트, 변경 생기면 별도 QA/원격 SHA 두 번 검증. 실제 Google Play/Apple Billing 등 **실결제 M08**, 개발 모의 구매만 존치.
- 실물 Galaxy S23+ 장시간 FPS/발열 테스트는 여전히 미실시. 기존 상세 인수인계는 아래 기록 유지.

---

# EVOLVE 최신 인수인계 — M05 STEP 2/3 · 70% 완료 (2026-10-28 KST)

> 사용자의 다음 `고`는 **M05 80% STEP 3/3 회귀/배포 안전 게이트**. M04와 M05 10~70%를 처음부터 다시 하지 말 것.

- GitHub `idonutyou/EVOLVE`; 작업 브랜치 `monetization-m05-ux-20261028`; main M04 100% `fbe3224a3bdd95020829228427ddc3b05ed41f9e` 불변/Pages 배포 기존대로.
- M05 70% 실제 UI `web/m05-shop-ui-v618.js`: 상세에서 원래 상점 또는 컬렉션으로 돌아가며 해당 위치 복원, Tab/Shift+Tab 포커스 트랩·Escape, 상단/하단 safe-area + 내부 스크롤, 모의 스토어 주요 44px 버튼. 구매·게임·이미지 소스 변경 없음.
- 브라우저 `tests/monetization_m05_070_browser.cjs`, 성공 Actions **40568940812** (URL https://github.com/idonutyou/EVOLVE/actions/runs/40568940812). **320×568 / 393×852 / 852×393**, 각 12번 열고 닫기, 상점/컬렉션 스크롤·Tab/ESC·원본 세이브 보존 통과. 50% 지급/장착, 60% 오류/레이스 재검사도 success.
- 이전 UX 설계 테스트 2개는 70% 해시 빌드를 정상 개발 빌드로 인식하도록 개선. 70% 체크포인트에서 Node 전체 62/62 정식 검증.
- 빌드 `V575-STEP07-MONSTER-FEEDBACK-V614-M04-MOCK70-M05-UX70`; SHA `a687afb0418f55d1e91ab1e9f1374f153d00b54fe6c2133a99096f15145663b0`; manifest 1082, 원본 이미지 1021.
- 70% 복구 `backup/monetization-m05-070-20261028`; `checkpoints/EVOLVE_M05_070_20261028.zip`/JSON, 각 파일 SHA/CRC. 기존 10/20/30/40/50/60% 백업 전부 삭제 금지.
- 개발 상점은 `?evolveMockShop=1&evolveM05UX=1` 호스트/홈 제한, M03/게임 저장 격리, 진짜 결제/가격 금지. M08에서 게임 완성 후 실결제 붙임. 실제 Galaxy S23+ 장기 실기기 FPS/발열 미실시.
- 다음 **M05 80%**: **이미지 신규 렌더링 없음**, 전체 게임·홈 탭·세이브·상점 구매/장착·오리지널 에셋 해시 회귀, 배포 전 브랜치 대 main 차이·CI 게이트, 공개 병합은 90~100% 검증 후.
- 이전 60% 이하 인수인계 문서는 뒤에 보존.

---

# EVOLVE 최신 인수인계 — M05 STEP 2/3 · 60% (2026-10-28 KST)

> 다음 `고` = **M05 70%** 모바일/가로/포커스·스크롤/안정성 통합 회귀. 10%씩 진행, 다음 단계 및 이미지 필요 여부를 꼭 알릴 것.

- GitHub `idonutyou/EVOLVE` 기능 브랜치 `monetization-m05-ux-20261028`; `main` 최종 M04 100% `fbe3224a3bdd95020829228427ddc3b05ed41f9e` 불변.
- 핵심 M05 `web/m05-shop-ui-v618.js` 레이어만 확장, 기존 M04 구매·코어 저장 엔진 `web/mock-premium-v615.js` / UI `web/mock-premium-ui-v616.js` / 게임 `dist` 이미지 원본·M03 원장 수정 없음.
- 60%: 개발 옵트인 2중 플래그 `?evolveMockShop=1&evolveM05UX=1`에서 손상 localStorage 데이터 안전 오류 모달, 저장 쓰기 실패 후 구매/장착/초기화 읽기 전용, 확인창 닫기·배경 터치=확인 취소 우선, 확인창 중 섹션 전환 차단 및 트리플 클릭 중복 지급 방지.
- 검사 https://github.com/idonutyou/EVOLVE/actions/runs/40566198249 성공, Node 62/62(빌드 전), 브라우저 393×852/320×568 양쪽 통과, 별도 손상 JSON/쓰기 거부 장면 검증, 50% 소유/장착/심홍 해금 QA 재검사. 원래 게임 세이브 바이트 보호.
- 신규 asset `assets/13a854181d47bd909efdcc938b4caf33db57cee36718d9b54dd4e61a1bcbadba.js`; 16,977 bytes. 브랜치 dist manifest 1,081개/원본 이미지 1,021개.
- 기능 브랜치 build `5d5c8f1fe6970e5f82749f1ec6f7f6f59691a797f18aff56d8c99b6e7e92d34e`. `main` 미병합·Pages 공개 미반영. 실결제는 M08에만. 물리 Galaxy S23+ 미시험.
- 60% 체크포인트 `backup/monetization-m05-060-20261028`와 `checkpoints/EVOLVE_M05_060_20261028.zip`/JSON; SHA/CRC/원격 2회 후 유효. 10/20/30/40/50% 이전 백업 삭제 금지.
- UI 예외 상세 `docs/monetization/M05_060_FAILURE_SAFETY_QA_KO.md`; 테스트 `tests/monetization_m05_060_browser.cjs`; 빌더 `tools/build_m05_060.py`.
- 다음 70% **신규 이미지 불필요**. 모바일 가로/터치·포커스·스크롤과 게임 홈 안전 복귀/접근성 검사, 반복 브라우저 QA 마무리. 80~100%는 main 통합/Pages 단계로만.
- 과거 인수인계 원문 아래 유지.

---

# EVOLVE 최신 인수인계 — M05 STEP 2/3 · 50% 완료 (2026-10-28 KST)

> 다음 `고`는 **M05 60%** 실제 UI의 저장 오류·중복탭·화면 전환 안정화를 진행한다. M04/M05 10~50%의 구현을 반복하지 않는다.

- GitHub `idonutyou/EVOLVE`; 브랜치 `monetization-m05-ux-20261028`. 기준 main `fbe3224a3bdd95020829228427ddc3b05ed41f9e`는 아직 M04 100% 그대로 (M05 Pages 미배포).
- M05 50%: `web/m05-shop-ui-v618.js` 기존 M04 UI와 모의 엔진을 **읽기/클릭 위임**하여 상품 상세의 소유/장착/해제 상태, 컬렉션 ‘1/2’ 보유 표시, 공명 코어 직접 상세 연결, 반복형 결정 묶음 CTA 구현. 새 코어/그림 생성 없음.
- 실제 브라우저 QA `tests/monetization_m05_050_browser.cjs`, GitHub Actions https://github.com/idonutyou/EVOLVE/actions/runs/40562857322 **success**, 393×852/320×568, 취소 바이트 동일, 공명 장착/해제, TEST 결정 400→심홍 해금 120→280, 심홍 장착, 기존 게임 세이브 불변, 오류 없음. Node 62/62.
- 초기 검사는 접근성 이름이 해금 버튼을 가린 문제로 실패했으나 수정 후 전체 성공. 상세 `docs/monetization/M05_050_OWNED_EQUIP_QA_KO.md`.
- 기능 브랜치 build `8f07d26768a502d3a74a15d10f3ef6d63538b562d86782cb6c204aed43dc6ed3`, manifest 1,080 / 원본 이미지 1,021. M05 40%의 해시 스크립트도 함께 보존.
- **50% 복구**: `backup/monetization-m05-050-20261028`; `checkpoints/EVOLVE_M05_050_20261028.zip`/JSON. 이전 M05 10/20/30/40%, M04 전부 삭제 금지. 원격 SHA·크기 파일내 JSON.
- 다음 **M05 60%**: 손상·쓰기 실패 모의 저장과 UI 오류 메시지/자동 초기화 차단, 짧은 반복 입력과 확인·취소·닫기 경합 검사. **이미지 필요 없음**. 모든 10%는 완성 기능 CI 후 SHA/CRC 백업 생성 및 GitHub 원격 2회 확인.
- 개발 웹 플래그 `?evolveMockShop=1&evolveM05UX=1`; 기본 URL과 기존 M04 전용 모드 M05 기능 미노출. 실제 결제·운영 권리·M03 원장 비활성, M08까지 보류. 실제 Galaxy S23+ 장시간 열/FPS 검증 없음.
- 이전 40% 이하 상세 인수인계는 아래 계속 보존.

---

# EVOLVE 최신 인수인계 — M05 40%, STEP 2/3 (2026-10-28 KST)

> 다음 사용자 `고`는 **M05 50%** 구현 단계로 이동한다. M04~M05 10/20/30%를 반복하지 않는다.

- 작업 브랜치 `monetization-m05-ux-20261028`; main 기준 `fbe3224a3bdd95020829228427ddc3b05ed41f9e`. 공개 게임은 M04 그대로.
- 40% 신규 `web/m05-shop-ui-v618.js`와 `tools/build_m05_040.py`, `tests/monetization_m05_040_browser.cjs`; 검증 `docs/monetization/M05_040_IMPL_QA_KO.md`.
- 개발 웹 오버레이 확장 **2중 플래그** `?evolveMockShop=1&evolveM05UX=1` (허용 호스트+홈에서만). M04 원래 `?evolveMockShop=1` 화면과 기본 URL은 변경 없이 유지.
- 실제 게임 HTML에서 상점/컬렉션 2개 UI 탭·5종 상품 상세·M04 구매 확인/취소 위임·코어 2종 표시. 393×852/320×568 QA 통과, 저장 안전, 탭 높이 44px.
- 기능 브랜치 version `V575-STEP07-MONSTER-FEEDBACK-V614-M04-MOCK70-M05-UX40`, build `45b179c830ad2e488d148c6d55a41c653694b4aba548da1ea32852b222299b62`; manifest 1079 / 원본 이미지 1021.
- QA https://github.com/idonutyou/EVOLVE/actions/runs/40558205928 success, Node 62/62. **Galaxy S23+ 실기기 FPS/발열 시험은 하지 않음**.
- 40% 복구 `backup/monetization-m05-040-20261028`; `checkpoints/EVOLVE_M05_040_20261028.zip`/JSON. 10/20/30% 이전 백업 전부 보존.
- 다음 M05 50%: 상품 상세 구매·보유·장착 UI 상태와 컬렉션 직접 이동을 구체적으로 개선. **이미지 새로 생성할 필요 없음.**
- 실제 결제·가격/StoreKit/Billing 비활성. 원본 저장 `EVOLVE_V575_TEST_*`, M03 유료 원장, 기존 이미지 보존. GitHub Pages는 STEP 3/3 80~100% 후 안전 배포.
- 과거 인수인계는 아래 원문으로 보존한다.

---

# EVOLVE 최신 작업 인수인계 — M05 STEP 1/3 · 30% 완료 (2026-10-28 KST)

> 사용자의 다음 `고`는 **M05 40% · STEP 2/3 구현 첫 구간**. M05 10~30% 설계와 M04 100%를 다시 하지 말 것.

- 베이스 main/M04 최종: `fbe3224a3bdd95020829228427ddc3b05ed41f9e`. 현재 공개 게임 동일.
- 작업 브랜치 `monetization-m05-ux-20261028`. **main 미병합**, 게임 파일 `dist/`와 기존 M04 소스 `web/`는 현재 30%까지 원본 유지.
- 설계 3종: `monetization/m05/store-inventory-ux.v1.json`, `product-detail-states.v1.json`, `mobile-flow.v1.json`; 최종 UX 문서 `docs/monetization/M05_030_MOBILE_UX_FREEZE_KO.md`.
- UX: 기존 홈 5탭 유지, 옵트인 상점 오버레이·상품 상세·코어 컬렉션·확인/취소·오류 화면. 기존 M04 테스트 결정, 코어 2종, 독립 저장만 사용. 320/393 모바일과 가로, 44px 터치, 스크롤/포커스/키보드 상태 명세 확정.
- 테스트 `tests/monetization_m05_mobile_flow.test.cjs`, 10/20%·M04 기존 테스트와 합쳐 설계 계약 검증. 모바일 시뮬레이션은 **구현 40% 이후**.
- 30% 백업 `backup/monetization-m05-030-20261028`; `checkpoints/EVOLVE_M05_030_20261028.zip`/JSON. 10/20% 백업 보존. 검증된 SHA/ZIP 크기는 해당 JSON 참조.
- 실제 결제/가격/제휴 SDK/Google Play·Apple StoreKit: **게임 완성 후 M08**. 현재 DEV MOCK ONLY.
- 다음 40%에는 **이미지 신규 렌더링 필요 없음**. 별도 M05 UI 모듈을 개발 브랜치에 구현하되 원본 게임/M04 모의 구매 엔진 저장을 덮어쓰지 말고 10% 증분 종료 후 원격 백업+2회 검증.
- 오래된 이전 인수인계 기록은 아래에 이력으로 보존한다.

---

# EVOLVE 최신 인수인계 — M05 20% (STEP 1/3, 2026-10-28 KST)

> 다음 사용자 `고`는 **M05 30%**에서 모바일 상점 화면 상태 전환/키보드·터치 접근성 설계를 마친다. 아직 게임 UI 자체를 구현하거나 배포하지 않았다.

- 작업 브랜치: `monetization-m05-ux-20261028`. M04 100% 기준 main 커밋: `fbe3224a3bdd95020829228427ddc3b05ed41f9e`.
- 20% 설계: `monetization/m05/product-detail-states.v1.json`; 해설 `docs/monetization/M05_020_DETAIL_STATES_KO.md`; 계약 검사 `tests/monetization_m05_product_detail.test.cjs`.
- 구매할 만한 상품 가치 5종을 투명하게 표시: 스타터 +75 TEST, 소형 +100 TEST, 중형 +300 TEST, 공명 코어 장착, 시즌 미완성 잠금. 심홍 코어 120 TEST 차감 후 소유/장착 상태.
- 결제/보상 확인·취소·처리·성공·실패, 12가지 우선 행동 상태, 13개 실제 M04 오류 코드의 사용자 메시지 및 빈 컬렉션 표시 계약.
- 물리 Galaxy S23+ 시험 미진행. 원본 이미지/전투·게임 데이터, M03 권리·실결제 비활성 유지.
- 백업: `backup/monetization-m05-020-20261028` (저장 완료 후 확인) / `checkpoints/EVOLVE_M05_020_20261028.zip` 및 JSON. 10%/M04 이전 모든 백업 삭제 금지.
- 다음 30%에 이미지 **불필요**. 단계는 10%씩 진행·원격 저장·2회 독립 검증.
- 이전 M05 10% 및 M04 인수인계는 아래 원문에 보존.

---

# EVOLVE 최신 작업 인수인계 — M05 STEP 1/3 · 10% (2026-10-28 KST)

> 다음 사용자 `고` = **M05 20% 상품 상세/코어 소유 상태와 오류 문구 설계**. M04를 반복하지 않는다. 이 진행률은 EVOLVE 게임 전체 완성도가 아니다.

- 기준 main / M04 100% 복구: `fbe3224a3bdd95020829228427ddc3b05ed41f9e`, `backup/monetization-m04-100-20261028`.
- M05 작업 브랜치: `monetization-m05-ux-20261028`. M05 신규 코드는 **설계 JSON / 문서 / 검증 테스트뿐**. 원본 게임·이미지·Pages 변경 없음.
- 새 UX 계약: `monetization/m05/store-inventory-ux.v1.json`, QA 메모 `docs/monetization/M05_010_UX_AUDIT_KO.md`.
- 기존 홈 5탭 (RESEARCH/ORGANISM/BATTLE/MEMORY/CODEX) 보호; 기존 ORGANISM 파츠 인벤토리를 모의 코어 소유권과 병합하지 않는다.
- 기존 M04 모의 구매+100/+300, 스타터+75, 공명 코어 구매, 심홍 코어 TEST 결정 120개 해금, 시즌 패스 잠금, 개발 플래그만 사용.
- M05 10% 체크포인트: `backup/monetization-m05-010-20261028`, `checkpoints/EVOLVE_M05_010_20261028.zip` + 동명 JSON (저장·검증된 경우만 완료 선언).
- 다음 20%는 상세 상품/상태/에러 메시지 계약, **이미지 렌더링 불필요**. M05 40~70% 실제 UI 개발 전 이미지 생성 필요 여부 재고지.
- 모든 10%에 백업·SHA/CRC 검증·독립 원격 확인 두 번, 이전 백업 삭제 금지.
- 결제 판매/실원장 연동 없음; Google Play/Apple 실제 결제는 게임 완성 후 M08.

---

# EVOLVE 최신 인수인계 — M04 100% 완료 (2026-10-28 KST)

> **다음 사용자 `고`는 M05 STEP 1/3 10%부터 시작한다.** M04 60~100% 작업 반복 금지. 아래의 90%/70% 기록은 이전 이력임.

- 저장소: `idonutyou/EVOLVE`. 개발 웹: https://idonutyou.github.io/EVOLVE/
- 실제 공개 빌드: `9ab09b21eb95876b7977a0aaef34ac51c931c3565fcc8a9e45209812bdd290d6`, 리소스 1,078개/원본 이미지 1,021개.
- 라이브 모의 구매/취소·테스트 결정 +400→280·코어 2종 장착·재로드/복구·게임 저장 보존 자동 QA **success**: https://github.com/idonutyou/EVOLVE/actions/runs/40545030346
- 라이브 게임 엔진/원본 아트/이동 코드 바이트 검증 **success**: https://github.com/idonutyou/EVOLVE/actions/runs/40546116720
- 90% 원본 Pages 워크플로 https://github.com/idonutyou/EVOLVE/actions/runs/40541493132 는 배포 단계 성공/이후 이전 엔진 개수 가정 검사 실패. 후속 수정 후 별도 공개 실서버 2종 검증으로 해당 문제 해결.
- 개발 플래그 `?evolveMockShop=1`만 상점 표시. 일반 URL 무영향, 시즌 패스 잠금, 실가격/실결제/API 비활성.
- 실기기 Galaxy S23+ 장시간 성능·발열 테스트는 **하지 않음**.
- 최종 보고: `docs/monetization/M04_100_FINAL_REPORT_KO.md`.
- 100% 백업: `backup/monetization-m04-100-20261028`; `checkpoints/EVOLVE_M04_100_20261028.json`. 이전 모든 체크포인트 삭제 금지.
- 다음 M05 상점/인벤토리 UX. **첫 10% 디자인 분석은 이미지 렌더링 불필요**. 모든 단계를 3 STEP/10%씩 진행하고 매 체크포인트 원격 저장 및 두 번 검증한다.
- 최종 타깃 Google Play·Apple App Store. 실제 Billing/StoreKit 연결은 게임 완성 후 M08.

---

# 최신 인수인계: EVOLVE M04 90% (2026-10-28 KST)

**M04 STEP 3/3 90% 완료 → 다음 `고`는 M04 100% 라이브 배포 검증·최종 백업.** 이 퍼센트는 게임 전체 진행률이 아님.

- main 병합 `71f3549040e656324f766114503e6ba57a929eba`; Pages 실행 https://github.com/idonutyou/EVOLVE/actions/runs/40541493132 배포 성공.
- 공개 version.json 빌드 `9ab09b21eb95876b7977a0aaef34ac51c931c3565fcc8a9e45209812bdd290d6` 확인.
- 신규 이미지 불필요. 원본 이미지 1,021개, 기존 저장·무료 DNA 보존. 실제 결제/가격 없음.
- 90% 체크포인트 `backup/monetization-m04-090-20261028`; 70/80%와 배포 전 main 백업 유지.
- 다음 100%는 개발용 `?evolveMockShop=1`의 모의 구매/취소/장착/새로고침과 일반 URL 무영향 검증. 물리 휴대폰 별도.
- 상세 `docs/monetization/M04_090_DEPLOY_KO.md`. 아래는 이전 70% 인수인계 원본으로 이력 보존.

---

# EVOLVE — 새 채팅 인수인계

최신 확인: 2026-10-27 KST. 저장소 `idonutyou/EVOLVE`.
공개 게임: https://idonutyou.github.io/EVOLVE/

## 현재 재개 지점

**M04 STEP 2/3 · 70% 완료. 다음은 STEP 3/3 · 80~100%.**
이는 EVOLVE 전체 완성도가 아닌 M04의 진행률이다. M01/M02/M03 내부 개발 트랙은 100%이며 실제 판매나 운영 계정 서비스가 출시된 것은 아니다.

- 작업 브랜치: `monetization-m04-payment-20261027`.
- 검증된 기능 코드: `01d606cdd068dda52a98dfa82457cad120e0ff4d`.
- 최종 모바일 CI: https://github.com/idonutyou/EVOLVE/actions/runs/40527650445 **success**.
- 복구: `backup/monetization-m04-070-20261027`, `checkpoints/EVOLVE_M04_070_20261027.zip`. 커밋 SHA와 ZIP 실측 크기/해시는 원격 ref 및 동명의 JSON에서 확인한다. 브랜치/아카이브를 생성하고 2회 원격 검증한 다음에만 완료 보고한다.
- 직전 60%: `backup/monetization-m04-060-20261027` @ `4a0fd221787700b9a423d116dfd8a60eb01e7648`. ZIP 749,275B, SHA256 `2c12f2fcf8c941985b97758d9e13cccdb0d13d48e5f3f9be1def9efece525235`. 원격 2회 대조·압축 멤버 재검사 완료.
- 작업 폴더: `/workspace/scratch/ea9960933ffc/EVOLVE_REPO`. 새 세션에서는 이 폴더 존재 여부보다 원격 커밋/파일을 우선한다.

## 실제 구현·검증한 것

- 개발용 `?evolveMockShop=1` + 허용 호스트에서만 모의 상점/API/코어 효과 활성화. 일반 URL에서는 진입점과 adapter 없음.
- 모의 상품 5종 유지. 스타터 +75(1회), 소형 +100/중형 +300 TEST 결정, 공명 코어 소유권, 보상 미완성 시즌 패스 잠금.
- 코어 발광 2종: 공명 코어를 모의 구매하고, 심홍 코어는 TEST 결정 120개로 해금. 실제 캐릭터 미리보기·파츠 화면·전투에 발광 표시, 장착/해제·재실행 복원 지원.
- 모의 구매 확인/취소, 저장 실패 시 미지급, 중복 지급/차감 방지, 잘못된 저장 데이터 보존 및 지급 차단, 정상 저장 복구 시 재표시, 2회 확인 테스트 초기화.
- Node 22 **34/34**, 리소스 **1,078개**/원본 이미지 **1,021개** 검증. 실제 V614 게임 쉘 모바일 **393×852, 320×568 자동 시험** 통과. 코어 교체 전후 파츠·능력치, DNA·스테이지 해금 보존. 한글 웹폰트 및 화면 스크린샷 검토.
- 발광 캐시 192×192 2장, 294,912B. 10,000회 단위 검사에서 재생성 2회, 실제 브라우저 전투에서도 2회. 물리 Galaxy S23+ FPS/발열·장시간 성능은 미검증.
- 기존 엔진에 구획된 시각 코드만 추가. 해당 구획 제거 시 V614 기준 엔진 바이트 일치. 원본 이미지 재생성·재인코딩 없음. 코어는 별도 발광 효과이며 M06 정식 신규 프리미엄 아트 완성은 아니다.

## 아직 하지 않은 것 / 다음 지시

**M04 기능은 main/공개 Pages에 미병합·미배포.** main에는 최신 인수인계 문서만 갱신한다.
사용자가 `고`/`이어서 진행해`라고 하면 **M04 80%**부터 시작한다. 60/70% 작업을 반복하지 않는다.

STEP 3/3: 80% 전체 회귀·배포 게이트 → 90% 안전한 main 통합·개발용 Pages 반영 → 100% 실제 배포 URL/버전/모의 구매·저장 재검증과 인수인계. 10%마다 원격 복구와 두 번 확인을 유지한다. 새 이미지 생성은 필요 없다. 실제 스토어 결제는 이 단계에 연결하지 않는다.

## 고정 사용자 원칙

- 최종 출시 Google Play·Apple App Store, 현재 웹은 개발용. 과금할 만한 콘텐츠/모의 구매 우선. 실제 Billing/StoreKit·운영 영수증/원장은 게임 완성 후 M08에서 연결.
- `EVOLVE_DEV_MOCK_STORE_V1`만 모의 저장. `EVOLVE_V575_TEST_*`, 무료 DNA, M03 유료 원장과 혼합/승격 금지. 판매용 카탈로그는 `draft_disabled`, 가격 null, `checkout_enabled=false` 유지.
- 단계는 3 STEP으로 분리: 설계 10~30%, 구현/검증 40~70%, 회귀/배포 80~100%. 현재 하위 STEP 종료 후 다음 사용자 지시를 기다린다.
- 10%마다 원격 ref+파일/압축 체크섬 두 번 대조 후 진행 보고. 과거 백업은 삭제·강제 갱신하지 않는다.
- 단계 시작 전 이미지 생성 필요 여부, 종료 시 다음 단계와 필요 여부 안내. 검증 전 main 배포 금지, 자동 새로고침 금지.
- 새 세션: `AGENTS.md`, 이 파일, `EVOLVE_PROGRESS.md`, `EVOLVE_ROADMAP.md`, 실제 브랜치/소스/최근 QA를 읽고 최신성 확인. 구 기록은 각 백업과 Git 이력에 보존되어 있다.

상세: `docs/monetization/M04_070_QA_HANDOFF_KO.md`, `docs/monetization/M04_070_QA_EVIDENCE.json`.
