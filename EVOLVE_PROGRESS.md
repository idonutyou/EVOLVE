# EVOLVE M05 STEP 3/3 · 100% 최종 완료 (2026-10-28 KST)

- M05 개발용 상점 UX 100% 완료. 게임 전체 완성도나 실제 결제 도입 100%라는 의미가 아님.
- GitHub Pages 배포 #40578916545 success: https://github.com/idonutyou/EVOLVE/actions/runs/40578916545.
- 실제 공개 URL에서 모바일 393×852 / 320×568, DEV 모의 코어 구매/장착/컬렉션, 홈 메뉴·터치, 원래 세이브 및 M03 원장 보호, 기본 URL DEV 숨김 검사 #40582048900 success: https://github.com/idonutyou/EVOLVE/actions/runs/40582048900.
- 원본 이미지 1,021개, 리소스 1,083개 유지. 기존 M04 DEV 9개 + 새 M05 DEV 5개만 허용하도록 V614 배포 게이트 보수.
- 운영 결제·가격·서버 권리 지급 OFF. 실결제는 완성 게임 M08 단계. 물리 Galaxy S23+ 장시간 시험 미실시.
- 복구: 이전 M05 10~90% 전부 보존, 최종 backup/monetization-m05-100-20261028 와 checkpoints/EVOLVE_M05_100_20261028.zip/JSON SHA256 CRC 원격 검증.
- 다음 고: M06 10% 유료 구매 가치가 충분한 프리미엄 외형/코어/생체무장 패키지 설계. M06 10% 신규 이미지 렌더링 불필요, 실제 프리미엄 아트 제작 단계는 이미지 필요.

---

# 최신 EVOLVE M05 90% — 개발용 버튼 충돌 수정/공개 통합 준비 (2026-10-28 KST)

- **M05 90%:** M04 개발용 DEV 상점 버튼과 ORGANISM 하단 5탭 실제 터치 충돌을 M05 옵트인 CSS만 수정해 제거. 기존 M04 구매 엔진과 일반 게임 UI 무변경. 새 이미지 렌더링 불필요.
- Chromium 실터치 **393×852·320×568·852×393**: 하단 5탭/ORGANISM 서브탭 locator.click, DEV 상점 열기, 겹침 0, 기본 URL DEV 숨김 **통과**. 이전 80% 전투 코어·전투 중 상점 차단, 70% 가로·포커스·12회, 60% 저장 에러, 50% 코어 장착, M04 원본 상점 재검사 통과.
- Node **62/62 통과**, 90% 소스/브라우저 증거 https://github.com/idonutyou/EVOLVE/actions/runs/40575562801 (브라우저 PASS, 원격 푸시 경합으로 전체 run fail), 기존 브라우저 QA 결과·소스 일치 확인 후 **저장 재검증 success** https://github.com/idonutyou/EVOLVE/actions/runs/40576659951.
- 기능 브랜치 빌드 `V575-STEP07-MONSTER-FEEDBACK-V614-M04-MOCK70-M05-UX90`, 해시 `b985a41a63ea8c9f4e9b6c773dbc7cbcb7b579855a907bdfb693e7e53463d60b`, 리소스 1,083개·원본 이미지 1,021개 그대로. 상용 결제 `checkout_enabled=false`, 가격 null.
- 90% 영구 복구 `backup/monetization-m05-090-20261028`, `checkpoints/EVOLVE_M05_090_20261028.zip` 및 JSON. 이전 10~80% 전부 보존.
- **다음 `고`: M05 100%** GitHub Pages 실제 URL/빌드/모바일/게임 저장 및 최종 백업·인수인계. 이미지 렌더링 **불필요**.
- 공개 main 통합은 90% 복구 확인 이후에만 수행하며, 최종 URL 검증은 100% 단계에서 별도 진행.

---

# 최신 EVOLVE M05 STEP 3/3 · 80% 배포 전 통합 검사 완료 (2026-10-28 KST)

- **M05 80% 완료:** 기존 M04 원본 게임 파일 바이트와 모의 상점 확장의 공존 확인. **이번에는 게임 화면 수정/실제 공개 배포 없음.**
- 정적 감사 `tools/verify_m05_080_integration.py` 성공: 원본 해시 자산 **1,078개 바이트 동일**(이미지 **1,021개**), M05 개발용 JS 4개만 추가, `index.html`은 플래그 스크립트·버전 정보를 제외하면 M04 main과 동일. 5종 결제 카탈로그 모두 가격 null·운영 checkout=false. 게임 원본·M04 엔진/SW·M03 경로 불변.
- Chromium 실동작 `tests/monetization_m05_080_integration_browser.cjs` + 기존 홈·파츠·M04 전투/모의 구매 회귀 성공; M05 코어 전투 발광/상점 전투 중 차단/원래 세이브 격리, 62/62 Node 검사 성공: https://github.com/idonutyou/EVOLVE/actions/runs/40573303980.
- **잔여 리스크:** M04에서 이어진 개발용 DEV 상점 버튼이 ORGANISM 하위 탭 터치를 가리는 경우 있음. 기본 URL에서는 개발 버튼이 없어 영향 없음. **90% 통합 전에 해소·재시험 필요**.
- 상세 `docs/monetization/M05_080_INTEGRATION_GATE_KO.md`; 기준 `main` SHA `fbe3224a3bdd95020829228427ddc3b05ed41f9e` 미변경, 물리 Galaxy S23+ 미시험. 빌드 M05-UX70 `a687afb0418f55d1e91ab1e9f1374f153d00b54fe6c2133a99096f15145663b0`.
- 80% 백업 `backup/monetization-m05-080-20261028` / `checkpoints/EVOLVE_M05_080_20261028.zip`·JSON (실제 원격 성공 후 복구 증거). 이전 10~70%/M04 백업 보존.
- **다음 `고`: M05 90%** 개발 오버레이 터치 겹침 해소 및 안전한 main 병합/개발 Pages 공개 반영 결정. **신규 이미지 렌더링 불필요**, 실결제는 M08까지 비활성.

---

# 최신 EVOLVE M05 STEP 2/3 · 70% 완료 (2026-10-28 KST)

- **M05 70%**: 개발용 모의 상점의 모바일 가로 화면·포커스·스크롤·뒤로가기/12회 반복 동작을 실제 Chrome에서 최종 검사하고 STEP 2/3 UI 구간 종료.
- UI `web/m05-shop-ui-v618.js` 및 `tools/build_m05_070.py`; 브라우저 `tests/monetization_m05_070_browser.cjs`; 보고 `docs/monetization/M05_070_RESPONSIVE_QA_KO.md`.
- **320×568 / 393×852 / 852×393**: 모달 내부 스크롤, 상점/컬렉션 복귀, Tab/Shift+Tab/Escape, 44px 주요 버튼, 12회 열고 닫기, 게임 세이브 보존 성공.
- 이전 50% 구매·장착, 60% 저장 손상·연속 확인 모바일 회귀도 성공. CI https://github.com/idonutyou/EVOLVE/actions/runs/40568940812 **success**. 설계/모의 결제 회귀 별도 62/62 검증 체크포인트에 포함.
- 빌드 `a687afb0418f55d1e91ab1e9f1374f153d00b54fe6c2133a99096f15145663b0`, 리소스 1,082개, 원본 이미지 1,021개 무변경. 실제 Android 물리 폰 테스트는 아직 아님.
- `main` 공개 게임 M04 SHA `fbe3224a3bdd95020829228427ddc3b05ed41f9e` 유지, 실결제 disabled, 기존 데이터 보전.
- **70% 복구:** `backup/monetization-m05-070-20261028`, `checkpoints/EVOLVE_M05_070_20261028.zip`/JSON (SHA/CRC/원격 재확인 후 유효). 10~60% 이전 백업 전부 보존.
- **다음 `고`: M05 80%, STEP 3/3** 배포 전 게임/세이브/전투·코어·상점 통합 회귀 및 합병 준비. **이미지 렌더링 불필요**.

---

# 최신 EVOLVE M05 STEP 2/3 · 60% 완료 (2026-10-28 KST)

- **M05 60%: 모의 저장 오류·구매 확인창 닫기 경합·중복 탭 차단을 실제 개발 웹 UI에 구현, 모바일 QA 성공**. 이 수치는 M05 단계별 진행률임.
- UI `web/m05-shop-ui-v618.js`에 손상 모의 저장 FAIL CLOSED 오류 모달, TEST 저장 쓰기 실패 안전 배너/구매·장착·초기화 차단, 확인 대화창 중 섹션 전환 차단, 배경·상단 닫기=구매 확인 취소 우선, 빠른 3회 확인 멱등 처리 추가.
- CI https://github.com/idonutyou/EVOLVE/actions/runs/40566198249 **success**. 기존 M04/M05 Node 62/62(50% 기준), 변경 후 Chromium 393×852·320×568, 신규 손상 JSON/Storage 쓰기 실패 시나리오, 50% 정상 구매/장착 회귀 모두 성공.
- 상세 `docs/monetization/M05_060_FAILURE_SAFETY_QA_KO.md`; 브라우저 `tests/monetization_m05_060_browser.cjs`; 빌드 `tools/build_m05_060.py`. manifest 1,081 / 원본 이미지 1,021개 불변.
- 개발 브랜치 build `5d5c8f1fe6970e5f82749f1ec6f7f6f59691a797f18aff56d8c99b6e7e92d34e`; `main`/공개 게임 미변경, 실결제 없음, 물리 Galaxy S23+ 미시험.
- 복구 `backup/monetization-m05-060-20261028`, `checkpoints/EVOLVE_M05_060_20261028.zip`/JSON (원격 검증 후 완료 확정). 이전 10~50% 복구, M04 모두 보존.
- **다음 `고`: M05 70% STEP 2/3 마무리 — 가로 화면/포커스/키보드/스크롤·장시간 QA**. 새 이미지 렌더링 **불필요**.

---

# 최신 EVOLVE M05 STEP 2/3 · 50% (2026-10-28 KST)

- **M05 50% 완료: 개발 브랜치에서 실제 모의 상품 보유→공명 코어 장착/해제→컬렉션→심홍 코어 해금/장착 UI 검증 성공**. 전체 게임 완성도가 아닌 M05 진행률.
- 소스 `web/m05-shop-ui-v618.js`; 빌드 `tools/build_m05_050.py`; 실동작 QA `tests/monetization_m05_050_browser.cjs`; 상세 `docs/monetization/M05_050_OWNED_EQUIP_QA_KO.md`.
- Chromium **393×852·320×568**: 모의 취소 세이브 바이트 불변, 공명 코어 구매/장착/해제, TEST 결정 +100/+300→120 해금→잔고 **280**, 심홍 장착, 홈 5탭 유지, 가로 넘침 0. 검사 success: https://github.com/idonutyou/EVOLVE/actions/runs/40562857322.
- Node M04/M05 **62/62 통과**, 원본 이미지 **1,021개** 보존, 브랜치 리소스 **1,080개**. 실제 물리 폰 시험은 미진행.
- 기능 브랜치 빌드 `8f07d26768a502d3a74a15d10f3ef6d63538b562d86782cb6c204aed43dc6ed3`. 2중 DEV 플래그 필요. main 공개 Pages는 M04 그대로, 진짜 과금 비활성.
- 원격 50% 백업 `backup/monetization-m05-050-20261028`; `checkpoints/EVOLVE_M05_050_20261028.zip`/JSON (검증 성공 후 확정). 이전 10~40%와 M04 백업 보존.
- **다음 `고`: M05 60% — 저장 오류·중복 탭/닫기 경합 보호 및 UI 안정화**. 이미지 렌더링 **불필요**.

---

# 최신 EVOLVE M05 STEP 2/3 · 40% (2026-10-28 KST)

- **M05 40%: 실제 개발용 상점/컬렉션 섹션 전환 + 상품 상세 UI 구현 및 Chrome 모바일 통과**. 전체 게임 완성도가 아니라 M05 개별 진행률.
- 구현 `web/m05-shop-ui-v618.js`, 패키징 `tools/build_m05_040.py`, 실동작 QA `tests/monetization_m05_040_browser.cjs`, 보고 `docs/monetization/M05_040_IMPL_QA_KO.md`.
- SHA-256 asset 하나 추가, 기능 브랜치 dist 리소스 1,079개/원본 이미지 1,021개 유지, M04 모의 구매 엔진·기존 저장/원본 게임 보존.
- 실제 Chrome 모바일 393×852·320×568: 2개 섹션, 상품 상세 5개, 모의 취소 바이트 불변, 테스트 결정 +100, 코어 2종, 버튼 44px, 가로 넘침 없음.
- GitHub Actions https://github.com/idonutyou/EVOLVE/actions/runs/40558205928 **success**, Node 62/62.
- M05 확장 UI는 `?evolveMockShop=1&evolveM05UX=1`에서만. `main`·공개 GitHub Pages는 현재 **변경하지 않음**; 실결제 없음.
- 40% 백업 `backup/monetization-m05-040-20261028`, `checkpoints/EVOLVE_M05_040_20261028.zip`/JSON (백업 SHA 확인 후 완료 기준). 이전 10/20/30% 모두 보존.
- **다음 `고` → M05 50%:** 소유/장착 상품 상세 CTA·상태 표시 개선. 이미지 렌더링 **불필요**.

---

# 최신: EVOLVE M05 STEP 1/3 · 30% 설계 완료 (2026-10-28 KST)

- **M05 30% STEP 1/3 종료**: 10% 정보 구조, 20% 상품/소유 상태, 30% 모바일 화면 전환·터치·스크롤·접근성 설계 동결. 이 퍼센트는 게임 전체가 아니라 M05의 진행률.
- 30% 명세 `monetization/m05/mobile-flow.v1.json`, 해설 `docs/monetization/M05_030_MOBILE_UX_FREEZE_KO.md`, 계약 검사 `tests/monetization_m05_mobile_flow.test.cjs`.
- 320×568·393×852 및 가로 852×393 화면 사양, 주요 터치 44px 이상, 본문 내부 스크롤, 확인창 취소 우선, 포커스 복귀·키보드·실패 안전 동작 확정.
- 기존 5개 홈 탭/파츠·게임 엔진/이미지 1,021개/상품 5종·코어 2종/모의 저장 격리 유지. 실제 결제 비활성.
- **UI 구현·공개 Pages 배포는 아직 미진행**. 30% 백업 `backup/monetization-m05-030-20261028`, ZIP `checkpoints/EVOLVE_M05_030_20261028.zip` 및 JSON (완료 검증 후 유효).
- 이전 M05 10/20% 및 M04 이하 모든 백업 보존. 작업 브랜치 `monetization-m05-ux-20261028`.
- **다음 `고`: M05 STEP 2/3 · 40% 개발용 상점/코어 컬렉션 UI 기초 구현**. 이미지 생성 불필요. 구현 후 실제 모바일 브라우저로 검사.

---

# 최신: EVOLVE M05 STEP 1/3 · 20% (2026-10-28 KST)

- **M05 20%: 상품 상세·구매/소유/장착 상태 전환·오류 문구 계약** 작성. 아직 UI 구현/Pages 배포 없음.
- 설계 계약 `monetization/m05/product-detail-states.v1.json` 및 상세 `docs/monetization/M05_020_DETAIL_STATES_KO.md`; M05 10% JSON은 그대로 보존.
- 기존 M04 SKU 5종·코어 2종/TEST 결정 120개 차감, 개발 전용 저장 `EVOLVE_DEV_MOCK_STORE_V1` 및 기존 홈 탭 5개 유지.
- 실패·확인취소·시즌 잠금·장착/해제·영수증 멱등 상태를 모델링하고 실제 M04 모의 엔진과 Node 계약 검증.
- 10% 복구 `backup/monetization-m05-010-20261028` 보존. **20% 복구: `backup/monetization-m05-020-20261028` + `checkpoints/EVOLVE_M05_020_20261028.zip` / JSON** (저장·검증 확인 후 사용).
- 기준 `main` `fbe3224a3bdd95020829228427ddc3b05ed41f9e` 및 공개 빌드는 M04 100%와 동일. 신규 이미지 없음·실결제 없음·모바일 실기기 시험 없음.
- **다음 `고`: M05 30% STEP 1/3 종료 — 터치·포커스·스크롤 모바일 상태도/접근성 상세설계. 이미지 렌더링 불필요.**

---

# M05 최신 진행 — STEP 1/3 · 10% 설계 (2026-10-28 KST)

- **M05 10%: 상점·코어 인벤토리 기본 정보 구조 설계 완료**. 구현·웹 배포는 아직 하지 않았다.
- 현재 작업 브랜치 `monetization-m05-ux-20261028`, 기준 M04 100% main `fbe3224a3bdd95020829228427ddc3b05ed41f9e`.
- 설계 `monetization/m05/store-inventory-ux.v1.json`, 검토 `docs/monetization/M05_010_UX_AUDIT_KO.md`, 테스트 `tests/monetization_m05_ux_design.test.cjs`.
- 5개 기존 홈 탭/기존 파츠 인벤토리 보호, DEV 모의 상점 → 코어 컬렉션 UX 규칙 및 모바일 44px 기준 정의.
- M04 기존 상품 5개·코어 2종/TEST 결정 120개 소비 유지, 시즌 패스 잠금·실제 결제 비활성 보존.
- 신규 이미지 없음. 아직 브라우저 UI 변경/기존 GitHub Pages 반영 없음.
- 원격 체크포인트: `backup/monetization-m05-010-20261028`, 아카이브 `checkpoints/EVOLVE_M05_010_20261028.zip` (검증 후 완료 처리).
- **다음 사용자 `고`: M05 20% 상품 상세/소유 상태와 오류 문구 계약 구체화**, 이미지 생성 불필요.

---

# EVOLVE — 검증된 현재 진행률 (2026-10-28 KST)

> 아래 비율은 EVOLVE 전체 완성도가 아니라 **수익화 각 단계의 개별 완성도**임.

| 단계 | 최종 확인 | 다음 작업 |
| --- | --- | --- |
| M01 상품/과금 모델 설계 | 100% 내부 설계 | 완료, 실판매 아님 |
| M02 경제 수치 시뮬레이션 | 100% 내부 시험 | 완료 |
| M03 개발용 권한·원장 | 100% 개발 프로토타입 | 운영 서비스 아님 |
| **M04 모의 상점·코어 외형·구매 흐름** | **100% 완료 (STEP 3/3)** | M05 STEP 1/3 착수 |
| M05 게임 상점·인벤토리 UX | **0%** | 다음 10% 사용성/플로우 설계 |
| M06 정식 프리미엄 아트 | 0% | M05 이후, 제작 전 렌더링 고지 |
| M07 반복 플레이 가치·시즌·경제 | 0% | 후속 개발 |
| M08 Google Play/Apple 실결제 | 0% | 게임 완성 후 |

## M04 100% 근거
- **라이브 모의 구매·취소·장착·복원 테스트 성공:** https://github.com/idonutyou/EVOLVE/actions/runs/40545030346
- **라이브 엔진/원본 아트/이동 검증 성공:** https://github.com/idonutyou/EVOLVE/actions/runs/40546116720
- 공개 게임 https://idonutyou.github.io/EVOLVE/ 및 모의 테스트 `?evolveMockShop=1` 검증.
- 공개 빌드 `9ab09b21eb95876b7977a0aaef34ac51c931c3565fcc8a9e45209812bdd290d6` / 리소스 1,078개 / 원본 이미지 1,021개.
- 기존 모의 저장 격리/실제 결제 비활성 유지. **물리 Galaxy S23+ 시험 아님**.
- 최종 상세 보고: `docs/monetization/M04_100_FINAL_REPORT_KO.md`.
- **100% 복구:** `backup/monetization-m04-100-20261028`, `checkpoints/EVOLVE_M04_100_20261028.json`.
- 10~90%와 배포 이전 main 복구 브랜치 보존. 이전 진행 기록은 Git 이력과 백업 브랜치 동명 문서에 보존.

## 다음 사용자 지시 `고`
M05 **STEP 1/3, 10%**부터 시작하고 원격 체크포인트를 2회 확인 후 보고한다. 첫 10%는 신규 이미지 생성 불필요. M04 개발 내용을 처음부터 반복하지 않는다.
