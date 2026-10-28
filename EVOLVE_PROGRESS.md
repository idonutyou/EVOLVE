# EVOLVE M07 80% / STEP 3/3 — 게임 안에서 체험하는 V621 SHOP (2026-10-28 KST)

- 사용자의 최신 기준에 맞춰 **실제 결제만 제외하고 SHOP 내 상품/선물/월간 패스/외형 장착을 직접 체험 가능**하도록 구현. 유저 화면에는 "모의 구매/TEST 상품"을 쓰지 않고 '구매/수령/보유' 표시. **실결제 없음·금액 미청구·가격 후보**는 명확히 표시.
- 구현: `web/shop-experience-v621.js`/동등한 `dist/shop-experience-v621.js` 로컬 장부, `web/shop-front-v621.js`/`dist/shop-front-v621.js` 게임 본래 SHOP 마운트. `dist/index.html` 후크. 첫 구매 결정+50, 첫 패키지 결정+75, 결정100/300, 공명 코어 외형 영구 획득/기존 V617 게임 장착, 매일 무료 결정+20, 연구 시즌 패스 및 프리미엄 5단계 수령. 다른 HOME 탭/전투 코드/원본 캐릭터/몬스터/1021 이미지/기존 세이브 불변.
- 유료 시즌은 **KST 매월 1일 00:00~말일(다음 달 1일 00:00 미포함)**. 무료 이벤트는 별도 28일도 허용. 기존 M07 10~70%의 신뢰 이벤트 검증 없음은 유효: 일일/프리미엄 보상은 현 브라우저 별도 체험 지갑에만 지급, 실제 계정/게임 재화/서버 영수증과 무관. 영구 스킨은 기존 코어 브리지로 게임 내 실제 외형 전환.
- UX 참고: 2025~26 고매출 모바일게임의 패키지·재화·코스메틱·패스·첫구매 혜택 패턴. 특정 게임의 이미지는 복제하지 않았고 이번 단계는 CSS 그래픽만 적용. 상세 `docs/monetization/M07_080_ACTUAL_GAME_SHOP_KO.md`.
- 자동 QA: `tests/m07_080_shop_experience.test.cjs` 10~80% Node 테스트, `tests/m07_080_shop_browser.cjs` 393x852/320x568/852x393 실제 게임 SHOP/가격·보상·월간패스/원본 저장·외형 장착/오버플로·44px 버튼. `tests/home_hub_browser.cjs` 5개 HOME 탭·원래 게임 시작 보전. CI `M07 080 in-game SHOP experience` + `M07 080 browser integration` 성공 확인.
- 이전 공개 `main` 보존: `backup/pre-m07-080-live-20261028`. V621 배포 원본: `backup/m07-080-live-shop-v621-20261028` (SHA `44d3aa6d95cfcf0eeddc80fccc8a8fba90152c08`). `Publish EVOLVE Web` 자동 배포 완료 여부를 확인해야 최종 라이브 검증. M07 소스 백업 `backup/monetization-m07-080-20261028` + CRC ZIP/receipt.
- 다음 `고`: **M07 90%, STEP 3/3** — 실제 게임 내 체험 UX 심화, 시즌/결정 사용처 연동과 반복/종료/저장 복원 회귀, 구매/수령 UI 보정. **캐릭터/전투/몬스터 이미지 렌더링 불필요. 상점 배너/패스 UI 이미지는 제작 허용.**

---

# EVOLVE M07 70% — STEP 3/3 진행 (2026-10-28 KST)

- 70% 신규 **이미지 없는 연구 시즌 텍스트 UI 제작·검사**: `monetization/m07/season-text-view-070.cjs`(읽기 전용 HTML 생성), `season-text-demo-070.html`(독립 정적 미리보기), `tests/m07_070_text_preview.test.cjs`, `event-source-audit-070.v1.json`, `docs/monetization/M07_070_TEXT_PREVIEW_UI_AUDIT_KO.md`.
- 3종 무료 연구 미션/테스트 진척, 유료 월간 패스 종료 안내, `판매 준비 중·구매 불가` 문구만 표시. **실제 게임 또는 Pages 적용은 아직 안 됨**, 구매/보상/클라이언트 권리 부여/게임 세이브 저장 없음.
- 원본 HTML·게임 파일 조사: 기본 SHOP은 `homeShopViewV601`, 시즌 패스 카드 현재 disabled. CHALLENGE 기존 `homeChallengeViewV601`·`renderHomeChallengesV601` 존재. 실제 통합 때는 CHALLENGE 내부 별도 블록만 검토하고 기존 목록·메뉴·SHOP을 유지. `grantStageClearReward`와 관리자 진행도는 로컬 코드라 신뢰 이벤트 아님.
- 유료 시즌은 **매월 1일~말일 KST**, 무료 미션·이벤트는 28일 운영 가능, 영구 구매 외형은 기간 만료로 삭제 불가. M06 새 렌더링 계속 보류, 기존 1,021개 이미지·SHOP·게임 세이브·카탈로그·M06 이전 시안/백업 보존.
- GitHub 자동 검사 `M07 070 read-only text season preview`: 성공, 구버전 010/020/030 워크플로의 원본 보호 비교가 얕은 clone에서 깨지는 문제도 `fetch-depth:0`으로 수정.
- 70% 전체 원격 트리 복구 `backup/monetization-m07-070-20261028` 및 증분 ZIP/JSON 체크포인트 별도 검증.
- 다음 `고`: **M07 80%, STEP 3/3**. 원본 HOME/SHOP 보전 상태에서 CHALLENGE 텍스트 UI 기능 브랜치 통합·모바일 브라우저 QA 준비. **새 이미지 렌더링 불필요.**

---

# EVOLVE — M07 60% STEP 2/3 완료 (2026-10-28 KST)

- 실제 구현: 독립 테스트용 `monetization/m07/mission-batch-gate-060.cjs` — 미션 이벤트 최대 32개 묶음의 **전부 성공/전부 롤백** 테스트 처리, 요청 ID 재전송 중복 차단, 과거 리비전/다른 계정·무료 시즌 스냅샷 적용 거부. 실지급 0, 운영 권위/서버 연결 **없음**.
- 검사: `tests/m07_060_atomic_batch.test.cjs`, GitHub Actions run `40684783502` **success**. 10~60% Node 회귀 검사·원본 파일 보호.
- 핵심 소스 감사 추가 발견: `web/admin-mode-v585.js`에서 `grantStageClearReward` 래퍼와 `startHomeBattleV522` 확인, `web/admin-state-v585.js`에 `EVOLVE_V575_TEST_NORMAL_PROGRESS_V585` 일반 진행도 localStorage 저장 확인. **클라이언트의 로컬 진행·관리자 모드(도감 버튼 5회)는 유료 보상 검증 원천으로 사용 금지.** `monetization/m07/event-source-audit-060.v1.json` 참고.
- 확정 유지: 기간제 **유료 시즌은 매월 1일~해당월 말일 KST**, 무료 이벤트만 28일 주기 가능. SHOP 하나 및 M06 시안/모든 예전 백업 보호, 원본 게임·이미지 1,021개·세이브·카탈로그 변경 없음. 가격 null, 결제/클라이언트 지급 OFF.
- 상세 `docs/monetization/M07_060_ATOMIC_BATCH_EVENT_HOOK_AUDIT_KO.md`. 전체 소스 복구 `backup/monetization-m07-060-20261028`, 증분 `checkpoints/EVOLVE_M07_060_20261028.zip` + JSON 영수증.
- 다음 `고`: **M07 70% STEP 3/3** — 비이미지 시즌 텍스트 UI 계획/신뢰 이벤트 소스 감사·중복경계 테스트. **이미지 렌더링 불필요**.

---

# EVOLVE 최신 — M07 50% STEP 2/3 (2026-10-28 KST)
- 신규 이미지 필요한 작업 보류, M06 기존 시안 보존. M07 독립 Node TEST 엔진에 메모리 이벤트 저널·검증 리플레이 구현.
- 테스트 기록을 JSON으로 내보내 다시 시험 환경에서 복원, 손상/중복/계정 불일치/잘못된 기간 자동 거부. 오프라인 미확인 기록은 승인되지 않음.
- `mission-journal-050.cjs`, `m07_050_journal_restore.test.cjs`, `event-source-audit-050.v1.json`; 상세 `docs/monetization/M07_050_JOURNAL_RESTORE_QA_KO.md`.
- 유료 시즌 패스 달력 월간(1일~말일 KST), 무료 이벤트만 28일 허용. 원본 게임/SHOP/이미지/세이브 미수정, 실제 지급 및 결제 모두 비활성.
- 다음 '고'는 **M07 60%**, 비이미지 경계·중복·이벤트 소스 감사 강화.

---

# EVOLVE M07 40% — STEP 2/3 독립 비이미지 미션 시뮬레이터 (2026-10-28 KST)

- M07 10~30% 설계 동결 완료. **40% 실코드** `monetization/m07/mission-harness-040.cjs`: 별도 메모리에서 무료 일/주 연구 미션 3종의 시뮬레이션 이벤트 진척, 중복 이벤트 차단, 달력 기간 경계/스냅샷 계산, 보상 수령·구매 항상 OFF.
- `tests/m07_040_mission_harness.test.cjs`: 오프라인 미검증 진척 0, 동일 이벤트 중복, 다른 계정/시즌 거부, 28일 무료 기간, 윤년 2월·월말 KST 유료 기간 분리, 저장·실결제 금지 QA. GitHub Actions run `40682767590` **success**. 상세 `docs/monetization/M07_040_MISSION_HARNESS_QA_KO.md`.
- 최우선 기간: **유료 시즌은 1일~그달 말일까지(KST), 무료 이벤트만 선택적으로 28일**. 월말 유료 종료는 무료 진척/영구 유료 외형 소유권을 삭제하지 않는다.
- `simulateVerifiedEvent()`는 이름에 verified가 있어도 **테스트 입력을 가정하는 명시적 시뮬레이터**이며 서버 권위/실지급 기능 아님. reward grant 0, checkout/가격/권리 지급 OFF. 실제 게임 런타임/SHOP·전투·이미지/원본 세이브 수정 0.
- M06 신규 아트·이미지 렌더링 필요한 작업은 계속 보류하고, 기존 M06 시안·M01~M07 10~30% 백업 전부 보존.
- 이번 40% 복구: `backup/monetization-m07-040-20261028`, `checkpoints/EVOLVE_M07_040_20261028.zip` + JSON 영수증. ZIP은 증분이고 전체 게임 소스 복구는 Git branch.
- **다음 `고` = M07 50%, STEP 2/3**: 시뮬레이터 경계/중복/복원 일관성 강화 및 이벤트 소스 추가 감사. **이미지 렌더링 불필요**.

---

# EVOLVE M07 STEP 1/3 · 30% 최종 설계 동결 (2026-10-28 KST)

- M07 10%: 무료 연구 미션/선택형 유료 수집 가치 기획. 20%: 소스 이벤트 4파일 감사/UTC 무료 28일 상한·유료 KST 1일~말일 정책 정정. **30%: 미션/시즌 API·무료/유료 상태도·출시 차단 15개 게이트 설계 동결.**
- 최우선 사용자 정책: 기간제 **유료 시즌패스는 달력 매월 1일 00시~말일 KST, 다음달 1일 00시 미포함**, 무료 이벤트는 **28일 운영 가능**. 영구 보유 유료 외형은 월말 만료 시 삭제 금지.
- API 계약 `monetization/m07/season-api-contract-030.v1.json`, 상태 `monetization/m07/season-states-release-gates-030.v1.json`, 전이 `monetization/m07/season-state-transitions-030.v1.json`, 설명 `docs/monetization/M07_030_API_RELEASE_FREEZE_KO.md`, 검사 `tests/m07_030_api_release_freeze.test.cjs`.
- 현재 전부 **디자인 계약**이며 실제 미션/서버/고객 보상 지급, 실결제, 실제 게임 화면 변경, 프리미엄 이미지 생성 **없음**. 카탈로그 `season_research_pass_01` draft_disabled, 가격 null, checkout/client grants OFF.
- 기존 HOME SHOP 하나·원본 이미지 1,021개·게임 저장·M06 기존 시안/백업 보전. 모든 신규 이미지 렌더링 필요한 일은 계속 보류.
- M07 30% 복구 `backup/monetization-m07-030-20261028` 및 `checkpoints/EVOLVE_M07_030_20261028.zip`/JSON. 원격 무결성 2회 확인, 10/20% 및 이전 수익화/게임 백업 모두 유지.
- **다음 `고` = M07 40% STEP 2/3**, 실제 게임 연결 전 독립 메모리 전용 미션 진행·중복지급 검사 프로토타입. **이미지 렌더링 필요 없음**.

---

# EVOLVE — 유료 월간 / 무료 28일 허용 정책 확정 (2026-10-28 KST)

- 사용자 최종 지시: **유료 아이템(시즌패스)은 매월 1일 시작해 그달 말일 종료**, 실제 기간은 28/29/30/31일 가변. **무료 미션·이벤트만 28일 주기 가능.** 유료 상품을 28일 상품으로 설계·판매하지 않는다.
- 기준일 **한국시간 KST**, 월간 유료 권리 = 1일 00시 포함~다음달 1일 00시 미포함. 실제 구매 전 대상 월/만료일/남은 기간 표시, 월말 구매 공정성 검토 필요. 자동갱신 없음.
- 설계 소스 `monetization/m07/monthly-calendar-policy.v1.json`, `paid-month-calendar-v1.cjs`, `tests/m07_020_paid_month_policy.test.cjs`, `docs/monetization/M07_PAID_MONTH_FREE_28DAY_POLICY_KO.md`. 기존 `utc-period-planner-v1.cjs`의 28일 수치는 **무료 연구 미션 시안에만 적용**.
- 본편 원본/이미지/저장 불변, 이미지 렌더링 계속 보류, 시즌 패스 real checkout·가격·클라이언트 지급 계속 비활성. M07 20%의 정책 수정이며 **다음 '고'=M07 30%**, 이미지 불필요.

---

# EVOLVE M07 · STEP 1/3 20% | 시즌 신뢰 이벤트·UTC 보상 상한 (2026-10-28 KST)

- 사용자 요청 유지: **이미지 렌더링 필요한 M06/기타 작업 보류**, 비이미지 기능 우선, 기존 M06 생성 시안/백업 보존.
- M07 10% 무료/유료 연구 미션 방향, **20% 실제 파일 4종 감사**: `web/home-hub-v601.js`, `web/native-shop-v620.js`, `web/client.js`, `dist/index.html`에서 검증된 RUN/STAGE/CODEX 미션 이벤트를 찾지 못했다. 전체 엔진 감사/실제 이벤트 구현이 끝났다는 뜻이 아님.
- M07 20% 추가: `monetization/m07/season-period-reward-020.v1.json`, `event-source-audit-020.v1.json`, 순수 `utc-period-planner-v1.cjs`, `tests/m07_020_period_contract.test.cjs` 및 설명 `docs/monetization/M07_020_EVENT_UTC_CAP_AUDIT_KO.md`.
- 서버 검증 이벤트 생기기 전에는 **달성/재화 지급 없음**. 28일 가정 UTC 00시 일 경계/월요일 UTC 주 경계, 하루 2개·주 1개 완료 상한(2026-10-28 시작 예시 최대 61 '가상 연구 포인트'). 정식 결정·DNA/세이브와 무관.
- 5탭/원본 SHOP, 기존 원본 이미지 1,021개, 본편 `web`/`dist`/카탈로그·세이브 불변. 시즌패스 `draft_disabled`, 실제 가격 null, checkout/운영 지급 OFF.
- 20% 전체 트리 복구 `backup/monetization-m07-020-20261028`, 증분 ZIP/JSON 원격 무결성 2회 확인. 이전 백업 모두 삭제 금지.
- **다음 '고' M07 30% STEP 1/3**: 시즌/미션 상태도와 API 계약, 출시 차단 체크리스트 최종 동결. **이미지 렌더링 불필요**.

---

# EVOLVE 새 작업 우선순위 — 이미지 렌더링 보류 / M07 10% 착수 (2026-10-28 KST)

- **사용자 지시:** 추가 이미지 렌더링이 필요한 단계는 남겨 두고, 수익화에 도움이 되는 비이미지 단계부터 진행한다. 이미지 제작은 별도 재개 지시 전까지 보류.
- **M06:** 코어 프리미엄 설계 10~30% 및 `monetization-m06-premium-art-20261028` 브랜치 기록/이전 백업 전부 보존. 이력상 40% 시안 자료는 있으나 공개 게임 장착/판매 완성 아님. 추가 렌더링/리터치·이미지가 필수인 작업은 보류.
- **새 작업 M07 STEP 1/3 · 10%:** 무료 일/주 연구 미션과 시즌 보상·유료 코스메틱 수집을 연결하는 **비이미지 설계/검증**. 정식 시즌 패스 `season_research_pass_01` 판매·권리 지급 금지, 이미지 없는 게임 엔진/세이브/SHOP 원본 보존.
- 세부 계약 `monetization/m07/season-retention-010.v1.json`, 해설 `docs/monetization/M07_010_NON_RENDER_REORDER_KO.md`, 계약 검사 `tests/m07_010_nonrender_design.test.cjs`.
- 분리 브랜치 `monetization-m07-retention-20261028`, 백업 `backup/monetization-m07-010-20261028`; 10%마다 원격 백업 2회 확인 및 기존 백업 삭제 금지.
- **다음 '고': M07 20% STEP 1/3**, 검증 가능한 미션 이벤트 감사/UTC 시점·중복지급 방지·무료 보상 상한 설계. **이미지 렌더링 불필요**.

---

# EVOLVE 현재 우선작업 — 기본 SHOP 단일화 V620 (2026-10-28 KST)

- 사용자 결정: **기존 홈의 SHOP 하나만 사용**. DEV 상점 버튼·팝업·전용 URL/옛 TEST 상점 소스 삭제, 안 쓰는 기존 DNA 강화 카드는 SHOP에서 숨김. 게임 세이브/DOM 엔진은 보호.
- 신규 `web/native-shop-v620.js`는 SHOP에 5종 TEST 상품과 2종 코어 컬렉션/장착·해제·120 TEST 결정 교환 내장. **일반 앱 실행부터 접근**. 정식 가격·결제/운영 권리 지급은 여전히 OFF.
- 별도 DEV 소스 2개 삭제 + 게시된 구형 DEV 자산 **14개 삭제**, 새 native SHOP 전용 해시 JS 3개 추가. **1,072 리소스, 이미지 원본 1,021개** 보존.
- 실제 모바일 Chromium 393×852/320×568/가로852×393 및 홈/파츠/전투 QA success: https://github.com/idonutyou/EVOLVE/actions/runs/40588368786.
- 상세 `docs/monetization/NATIVE_SHOP_V620_MIGRATION_KO.md`. 배포 전 원본 바이트 감사 `tools/verify_native_shop_v620.py`.
- M05 작업 진척 100% 완료 사실은 유지. **M06 10% 기획은 사용자 SHOP 수정 요청으로 잠시 중단**; 이번 기능 정리는 M06 진도에 포함되지 않음.
- 다음 과제: 기본 SHOP 실제 온라인 배포 확인·백업 완료 후 M06 10% 구매 가치 콘텐츠 설계 재개. 이미지 렌더링 필요 없음.

---

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
