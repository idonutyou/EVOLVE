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
