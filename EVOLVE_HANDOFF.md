# EVOLVE — 새 채팅 자동 인수인계 (항상 먼저 읽기)

최초 생성: 2026-10-27 KST
저장소: `idonutyou/EVOLVE`
공개 게임: https://idonutyou.github.io/EVOLVE/

> 이 파일은 **재개 위치를 찾아가기 위한 안내서**이지 자동 최신화된 실행 로그가 아니다. 새 세션은 반드시 GitHub 브랜치, 커밋, 실제 소스, 최근 QA/체크포인트를 다시 조회해 기록의 최신성을 확인한다.

## 최신 재개 — M04 50% 개발용 홈 모의 구매 UI 구현 검증 완료 (2026-10-27)

- **현재 정확한 완료 지점:** M04 STEP 2/3 **50%**. 기존 40% 모의 구매 엔진을 실제 V614 메인 홈 UI에 연결하고 GitHub Actions에서 모바일 브라우저 393×852 실제 게임 쉘 시험 성공. **아직 공개 `main`/GitHub Pages에는 이 기능 미병합·미배포**.
- 작업 브랜치 `monetization-m04-payment-20261027` HEAD `4af248bd7d2b655afa77299e9c8afb2743d88278`. **50% 원격 백업** `backup/monetization-m04-050-20261027` @ 동일 SHA, ref+주요 파일/blob SHA를 **독립 2회 검증**. 과거 10~40% 및 모든 M01–M03 백업 유지.
- `web/mock-premium-ui-v616.js` + `web/mock-premium-v615.js`를 SHA256 명명 새 `dist/assets/` 파일 두 개로 복사·검증하고 `dist/index.html`의 홈에 **'◈ DEV 상점'** 진입 UI 연결. 기존 `#homeTabs` 5개 불변, 코어 실이미지/전투/원래 사용자 세이브 키 불변.
- **오직 `?evolveMockShop=1` 개발용 URL 플래그** 및 허용 호스트에서만 모의 상점 버튼 표시; 플래그 없으면 게임 화면과 일반 사용 흐름 영향 최소화. 테스트 결정 +100/+300, 1회 스타터 +75, 코어 소유/모의 장착, 시즌 패스 미완성 구매 차단. 모의 저장 `EVOLVE_DEV_MOCK_STORE_V1` 별도; 실제 과금·플랫폼 결제·유료 원장·실판매 없음.
- `dist/asset-manifest.json` 1067→1069 및 해당 검증 메타데이터 `dist/version.json`/`dist/verification.json`을 **개발 브랜치에서만** 갱신. 기존 이미지 바이트·원본 엔진 asset SHA 그대로.
- 검증: https://github.com/idonutyou/EVOLVE/actions/runs/40520829120 **success**. `tools/verify_site.py` 게임/이미지 검증 통과, Node 22 **26/26 통과**, 실제 V614 홈 Chromium 모바일 393×852 모의 구매→테스트 결정 400·코어 장착→재로드 복원·세이브 주요 필드 유지·탭 5개 유지·모의 URL 없으면 상점 없음. 스크린샷 GitHub Actions 아티팩트 ID `12741811864`. 물리 Galaxy S23+ 테스트는 하지 않음. 후속 계약 상태 변경 Node 26/26 실행도 https://github.com/idonutyou/EVOLVE/actions/runs/40521226187 에서 통과.
- 상세 `docs/monetization/M04_050_HOME_MOCK_UI_KO.md` (M04 작업 브랜치).
- **다음 사용자 `고` → M04 STEP 2/3 60%**: 상품의 게임 내 실질 가치·기존 파츠/코어 장착 경계 확인, 실제 외형이 필요한 콘텐츠/설계 확정·UI 검증. **이미지 렌더링: 60%의 실제 신규 코어/신체 외형 제작을 포함하면 필요하므로 작업 착수 전 사용자에게 사전 안내.** 기존 아트 수정·재생성 금지. 70% 저장·복원/취소·성능 및 메인 통합, 80~100% 공개 배포와 최종 검증.
- 최종 출시는 Google Play/App Store. 실제 Billing/StoreKit 연동은 게임 완성 후 M08. 사용자가 요구한 **과금할 만한 콘텐츠 우선**, 실제 결제는 후순위 원칙 유지.

## 2026-10-27 최신 M04 40% 원격 재개 — 모의 구매 엔진 검증 완료
- **M04 STEP 2/3 진행률 40% (모의 구매 로직만 완료)**. M04 개발 브랜치 `monetization-m04-payment-20261027` HEAD `0807072c06e3ae8663b3b7726334e8948b194626`. main 공개 게임 파일은 아직 바꾸지 않았다.
- 40% 원격 복구 `backup/monetization-m04-040-verified-20261027` @ `0807072c06e3ae8663b3b7726334e8948b194626` — 원격 ref 및 핵심 파일·blob SHA 2회 검증. 원래 40% 초기 복구 `backup/monetization-m04-040-20261027`도 보존.
- 실제 작성 코드: `web/mock-premium-v615.js` — 오직 `MOCK_ONLY` 테스트용 상품/재화·외형 소유권·코어 장착 상태·중복 방지·저장 복원/초기화 엔진. 신규 저장 키 `EVOLVE_DEV_MOCK_STORE_V1`. M03 유료 원장, 게임 저장 `EVOLVE_V575_TEST_*`, 라이브 결제와 격리.
- Node 22 GitHub Actions **26/26 통과** (설계 계약 12 + 모의 엔진 14): https://github.com/idonutyou/EVOLVE/actions/runs/40518045183 . 초안 테스트 두 번 실패 후 실제 수정·재검증 통과.
- **주의: 아직 `dist/index.html`과 메인 게임 상점 UI에 연결하지 않았다.** 게임에서 모의 구매 버튼을 누르는 경험은 50% 작업. 코어 테마는 테스트 소유·장착 **상태만** 기록하며, 새 외형 렌더링은 아직 구현하지 않았다.
- 상세: M04 작업 브랜치 `docs/monetization/M04_040_MOCK_RUNTIME_KO.md`, `monetization/m04/mock-premium-shop.design.json`.
- **다음 사용자의 `고` → M04 50%**: 실제 V614 게임 메인홈에 모의 구매 진입점/상품 획득/테스트 재화 표기를 안전하게 연결. 구조·에셋 검증 후 단계별 실게임 회귀. 신규 이미지 렌더링 **불필요**, 실제 외형 제작 단계는 사전 안내.
- 수익화 최우선은 플레이할 가치가 있는 콘텐츠·모의 구매. 실제 Google Play Billing 및 Apple StoreKit 연동은 게임 완성 후 M08. 기존 모든 백업 보존.

## 최우선 사용자 지시 — 실제 결제는 게임 완성 후, 지금은 모의 구매와 상품 콘텐츠 (2026-10-27)
- **최종 출시: Google Play + Apple App Store. 현재 GitHub Pages 웹은 개발/테스트 전용.** 웹 PG 우선 연동 계획 철회.
- **과금 최우선의 의미:** 게임 내 구매할 만한 패키지·변이 결정·캐릭터 각 부위/코어 외형·무기 연출·시즌 보상을 실제로 만들고 **모의 결제→획득→장착/사용/저장/복원** 테스트. 카드 청구·상점 사업자 계정·실 운영 PG·결제 서버는 **게임 완성 후 마지막 M08 단계**에서 Google Play Billing과 StoreKit 2를 연결.
- 기존 M03 개발용 원장 100%·M04 10~30% 연구는 백업에 보존하고 **반복하거나 결제 제공자 구현을 먼저 진행하지 않는다.** M04 30% 기획은 새 지침으로 교정됨.
- 최신 M04 작업 브랜치 `monetization-m04-payment-20261027`에 `docs/monetization/M04_MOCK_FIRST_PRIORITY_PIVOT_KO.md`와 `monetization/m04/mock-premium-shop.design.json` 저장. `monetization/m04/payment-flow.draft.json`의 실제 스토어 결제는 **M08로 미룸**.
- **최신 검증된 교정 백업** `backup/m04-030-mock-first-verified-20261027` @ `5a339a70a33e43d2de66eff9f690ec2d2c8dadb2`, 원격 ref와 주요 파일 2회 검증. 이전 교정 백업도 보존. 이 SHA는 **M04 작업 브랜치의 모의 구매 방향 교정 체크포인트**이며 main 게임을 바꾼 것이 아님.
- GitHub Actions Node 22 모의 구매/스토어 결제 분리 **12/12 정적 계약 테스트 통과**, https://github.com/idonutyou/EVOLVE/actions/runs/40514171284 . 실제 게임 모의 상점 구현·실결제 테스트 아님.
- M04 진행률은 **30% 설계/방향 교정 완료**. 다음 사용자 `고` → **M04 STEP 2/3 40% 실제 게임 내 모의 구매 및 상품 보상 인터페이스 구축**. 기존 저장 키/무료 DNA/확정 아트 보존, 판매 상품 카탈로그는 비활성 유지.
- 다음 작업의 이미지 렌더링: **필요 없음**. 실제 스킨/새 외형 이미지를 만드는 단계에서는 착수 전에 사용자에게 고지.
- 기존 완료 전 백업 삭제 금지. 실제 결제·유료 원장과 모의 구매 데이터는 절대 혼합하지 않는다.

## 최신 재개 지점 — M04 30% 설계 완료 (2026-10-27)

- M01/M02 시험 모델·계약 및 M03 개발용 원장 트랙은 이전 100% 완료 상태 유지. **실제 PG 승인·운영 서버·실매출은 미구현**.
- **M04 실제 결제 경로 STEP 1/3 (10~30%) 완료**. 작업 브랜치 `monetization-m04-payment-20261027`, SHA `5af53769bcaa30e1ba4d86e19e62226511fc58d5`. **M04 산출물 6개 파일은 아직 main에 병합하지 않았다.**
- M04 10% 백업 `backup/monetization-m04-010-20261027` @ `173f362bd3bdf1ecf2da9564b347bbe232908654`; 20% `backup/monetization-m04-020-20261027` @ `557082043f29f27e9c0c3c925a3ffd4ed10a77db`; **30%** `backup/monetization-m04-030-20261027` @ `5af53769bcaa30e1ba4d86e19e62226511fc58d5`. 10%마다 ref/파일 원격 **2회 검증**.
- 최신 작업 문서 `docs/monetization/M04_030_DESIGN_HANDOFF_KO.md` (M04 작업 브랜치). 공식 정책/웹 PG·Play 결제 분기, 서버 검증된 주문·결제상태·환불 안전 상태 JSON, 정적 계약 검사 8개.
- Node 22 GitHub Actions **8/8 통과 / 0 실패**: https://github.com/idonutyou/EVOLVE/actions/runs/40511265054 . **정적 설계 계약 검사로서 결제사 샌드박스/실결제 검증은 아님**.
- 독립 웹 PG의 첫 검토 후보 **토스페이먼츠**, 대안 포트원 V2, Play 배포 시 Google Play Billing 별도 검토. 아직 공급자 최종 선택·가맹점 계약·실가격·PG 자격증명 없음.
- 판매 플래그 `checkout_enabled=false`, M01 5종 SKU `draft_disabled`/가격 null 유지, `dist/`, `web/`, 이미지/게임 저장 키 변경 없음. 유료 결정 지급 활성화 없음.
- **다음 `고`: M04 STEP 2/3 (40~70%), 우선 40% 모의 공급자 adapter/서버 주문 검증 프로토타입 착수.** 신규 이미지 렌더링 필요 없음. 외부 계정 개설·실비용 발생 금지.
- 과거의 M03/M04 재개 기록은 이 최신 항목에 우선하지 않는다. 기존 모든 M01~M04 복구 백업 삭제 금지.

## 최신 M03 100% 복구 상태 — 이전 70% 기록보다 우선
- **M03 개발용 계정·원장 트랙 100% 완료**, PR #7로 main에 안전 병합. **실제 결제·실매출·운영 계정 서비스는 미구현**.
- M03 100% 통합 SHA `3d418b5e92d0ac0ef800d5cf453b85642c69223a`; 복구 브랜치 `backup/monetization-m03-100-20261027`, 원격 2회 검증.
- 실제 PostgreSQL 17 및 Node 22 테스트 **22/22** 통과. 백업/복원·원장 변경 차단·계정 분리 검증. CI https://github.com/idonutyou/EVOLVE/actions/runs/40508368361
- 상세: `docs/monetization/M03_100_FINAL_REPORT_KO.md`. **다음 `고`: M04 STEP 1/3 (10~30%)**, `docs/monetization/M04_HANDOFF_KO.md` 확인 후 과금사·판매 채널/정책부터 설계.
- 기존 M01/M02/M03 백업 유지, `dist/`, `web/`, 이미지/저장 키/실결제 카탈로그 불변. M04 이미지 렌더링 불필요.
- 하단의 70% 미완료 기록은 **이전 단계의 역사적 기록**이며 위 100% 검증 상태가 우선함.

## 새 채팅에서 처음 할 일
1. `AGENTS.md`, `EVOLVE_HANDOFF.md`, `EVOLVE_PROGRESS.md`, `EVOLVE_ROADMAP.md`를 읽는다.
2. `main`의 현재 커밋, 실제 작업 브랜치/백업 브랜치의 커밋, 관련 체크포인트의 **원격 파일 존재·내용**을 확인한다.
3. 마지막 확실하게 완료된 체크포인트와 진행 중인 단계를 구분한다. 커밋 시각, 브랜치 이름, 문서의 퍼센트 중 하나만 보고 최신이라고 단정하지 않는다.
4. 작업 파일과 `dist/` 운영 파일을 비교하고, 완료된 작업을 반복하지 않는다. 현재 세션의 수정 요청은 가장 최근 사용자 지시를 우선한다.
5. 이전 채팅 공유 링크의 열람 실패를 전체 내용을 읽은 것으로 표현하지 않는다.
6. 사용자가 **고/이어서 해**라고 하면 확인된 다음 하위 STEP을 진행한다. 이전에 완료된 범위는 되풀이하지 않는다.

## 2026-10-27 최신 M03 수익화 복구 상태 — 70% 작업 백업, 승인 보류

- M01(설계) 100%, M02(경제 모형) 100% 완료. **실결제·실매출 없음**.
- M03 10~30% 설계 완료. 40~60% 개발용 API·DB 소비·권리·환불 코드 보존.
- 최신 M03 작업 브랜치: `monetization-m03-ledger-20261027`, SHA `7927ab26f52e2c4c15d23ea1943f7e4576b2a17f`.
- 40% 백업: `backup/monetization-m03-040-20261027` @ `8e4e8706c24d16e824c57ea081c49845df1e9ec1`.
- 50% 백업: `backup/monetization-m03-050-20261027` @ `f3441f6bfd00ebe6d2da406d870b8a73d6308d29`.
- 60% 백업: `backup/monetization-m03-060-20261027` @ `8ddcbade5db871faf0b00b8c912ee2f5007c60e5`.
- **70% 작업 체크포인트 (완료 승인 보류)**: `backup/monetization-m03-070-20261027` @ `7927ab26f52e2c4c15d23ea1943f7e4576b2a17f`. 백업 SHA와 파일을 원격에서 두 번 확인했다.
- 핵심 문서: `docs/monetization/M03_070_QA_HANDOFF_KO.md` (M03 작업 브랜치).
- M03 코드 Native Node 22 국소 테스트 **12/12 통과**, 테스트 파일 8개 Git blob 원격과 바이트 일치 확인. 그러나 **실제 PostgreSQL 검증/백업복원은 실행하지 않았음**.
- 알려진 차단 2개: GET `/v1/accounts/bootstrap`가 인증 후 계정 생성 부작용 가능; wallet API가 OpenAPI에 요구한 `version`/`updatedAt` 누락. 반드시 수정·검증한 뒤 STEP 2/3을 최종 완료 처리.
- 다음 `고`: **M03 STEP 2/3의 70% 미해결 게이트부터 재개** (수정, 실제 PostgreSQL 동시성·복원 확인). 검증 못 하면 80%로 넘어가지 않는다.
- M03 운영 서버/실제 사용자 DB/PG/실제 결제 **없음**. GitHub Pages `dist/`, `web/`, 기존 이미지/저장 키, SKU 차단 설정 변경 없음.
- M01/M02/M03 기존 모든 백업 유지. 다음 작업 **이미지 렌더링 불필요**.

## 2026-10-27 M03 최신 검증 업데이트 (기존 70% 차단 기록보다 우선)
M03 STEP 2/3 **70% 검증 완료**. 작업 브랜치 `monetization-m03-ledger-20261027` SHA `c3e327e22db27905ba5f90bbac48ce8532b246f8`. 원격 검증 백업 `backup/monetization-m03-070-verified-20261027` (동일 SHA, 원격 2회 검사). 기존 bootstrap GET/지갑 응답 결함 수정. 실 PostgreSQL 17 + Node 22 18/18 테스트 통과, 80+80 동시 소비, 롤백, 재접속, pg_dump/pg_restore 복원 성공. CI https://github.com/idonutyou/EVOLVE/actions/runs/40506471512 . 최종 근거: 작업 브랜치 `docs/monetization/M03_070_VERIFIED_QA_KO.md`. **다음: M03 STEP 3/3 80%**, 이미지 불필요. 운영 서버·실제 결제·매출 없음. 기존 백업 유지, 공개 게임 파일 변경 없음.

## 작업 원칙
- 모든 큰 단계는 **1/3 설계(10~30%), 2/3 구현·국소 검증(40~70%), 3/3 회귀·실기기/브라우저 검증·배포(80~100%)**로 나눈다. 하위 단계 사이 사용자 지시를 따른다.
- **10%마다** 실제 복구 가능한 원격 백업을 남기고, 원격 ref + 파일 내용을 **두 번 확인**한 뒤에만 백업 성공으로 표시하고 진행 현황을 보고한다. 단순 로컬 저장/커밋/전송 시도는 성공이 아니다.
- 과거 백업 삭제, 강제 갱신(force push), 원본 이미지 재인코딩 및 저장 키 무단 변경 금지. 전체 작업의 완료 검증 이전에 과거 백업은 유지한다.
- 미완성 개발 코드는 분리된 작업 브랜치에서 다루고, 검증 전에는 `main` / 공개 Pages에 배포하지 않는다. 실제 브랜치 이름은 해당 단계 인수인계를 따른다.
- 단계별 **이미지 렌더링 필요 여부를 착수 전에 고지**하고, 끝날 때 다음 단계/렌더링 필요 여부를 알려준다.
- 과금/결제는 실제 서버 검증, 상품 계약, 사업자 승인 없이 활성화하지 않는다. 실제 판매와 설계·모의 수치를 구분한다.
- 원격 저장에 실패하면 어디까지 보존되었는지 정확히 보고하고 검증된 지점까지만 복구 가능하다고 말한다.
- 백업과 진척률은 **실제 소스·테스트/문서 변화**를 기준으로 판단한다. 채팅이 끊기면 마지막 검증된 원격 지점부터 재개한다.

## 새 채팅 시작 문장
EVOLVE 작업 이어서 진행해. GitHub `idonutyou/EVOLVE`의 `AGENTS.md`, `EVOLVE_HANDOFF.md`, `EVOLVE_PROGRESS.md`, `EVOLVE_ROADMAP.md`와 최신 원격 백업을 확인하고 마지막 **검증된** 체크포인트에서 재개해. 10% 단위 백업/2중 검증/보고, 각 단계 3개 STEP 분할, 수익화 최우선, 이미지 필요 여부 사전 고지를 지켜. 우선 복구 결과와 다음 하위 STEP을 보고해.
