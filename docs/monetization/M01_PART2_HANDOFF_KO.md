# EVOLVE — 수익화 M01 2/3 (40~70%) 통합 인수인계
작성 2026-10-27 KST · **과금이 모든 게임 개발 단계의 1순위** · 신규 이미지 렌더링 **불필요**

## 0. 작업 상태와 실매출 진실
- 이 단계는 **상품·결제·장부의 실행 가능한 계약/단위 테스트를 제작**했다. **실제 체크아웃, 실결제, 계정 인증, 서버 원장은 없음**.
- 공개 게임 `V575-STEP07-MONSTER-FEEDBACK-V614` / build `8bf4982e0c0662adaf631bc0abbf3f96cf9dc509697dd0f26d5d46408c046317` 유지. `dist/`, 원래 `web/`, 게임 코드·장착·기존 DNA·이미지·Pages 변경 0.
- 작업 브랜치 `monetization-m01-contracts-20261027` (메인 문서형 M01 1/3·기존 STEP09 백업과 별도).
- STEP09 스킬 레벨/카드/진화 30% 설계 작업을 먼저 과금 실구매 인프라로 재편한 사용자 지시 유지. 이전 작업 파일/백업 폐기 금지.

## 1. 40% 실제 결과 — 상품 카탈로그
- `monetization/catalog/draft_skus.json`: starter once, mutation crystal small/mid, appearance core theme, 시즌패스 후보 **5종**.
- `draft_catalog.schema.json` + `catalog_guard.cjs`: 모든 가격/지급 수량/구매 권리 미등록(null), `draft_disabled`, `checkout_enabled=false`. 유효한 SKU로 호출해도 항상 `PAYMENTS_NOT_CONNECTED`.
- `tests/monetization_catalog_m01.test.cjs`: 클라이언트 가격/보상 위조, 중복 SKU, 임의 구매 활성/타 통화, localStorage DNA → 유료 구매 악용 차단 시험.
- GitHub Actions `40481177611` 성공; 원격 전체 저장소 복구 `backup/monetization-m01-040-20261027`.

## 2. 50% 실제 결과 — 안전한 상태 전이 모델
- `monetization/contracts/transaction_fsm.cjs`: `REQUESTED → PROVIDER_PENDING → PROVIDER_VERIFIED → LEDGER_CREDITED → CLIENT_ACKNOWLEDGED`; 검증된 환불 확정 시 `REFUNDED`.
- 중복 웹훅 재전송, 단계 생략, 브라우저 redirect 성공 위장, 지불 확인 없는 임의 적립, 다른 주문으로 영수증 재사용 거절. 동일 이벤트의 완전한 중복은 no-op.
- **QA 시뮬레이션 경계**: `QA_SIMULATED_* origin` 문자열은 진짜 보안 증명 불가. 이 모델을 브라우저나 결제 서버의 프로덕션 영수증 확인으로 사용하면 안 된다.
- CI `40481801295` 성공; 초기 CI `40481682963`은 완료된 주문에 오래된 이벤트가 동일하게 재전달되면 idempotent no-op인 점을 테스트가 잘못 예외로 기대한 **시험 코드 오류**였고 수정 후 통과.
- 복구 `backup/monetization-m01-050-20261027`.

## 3. 60% 실제 결과 — 서버 API 계약과 in-memory ledger
- `monetization/contracts/payment_api_contract.openapi.json`: 6개 **설계 전용** 엔드포인트(상품 주문 대기, signed provider webhook, 내 지갑, 내 구매 권리, 구매 복원, 검증 광고 보상). 모든 경로 미배포 `SPEC_ONLY`, .invalid 가짜 호스트, M01~M04 준비 전 503.
- `monetization/contracts/qa_ledger.cjs`: 테스트 전용 계정 지갑, 구매 이력, 비소모성 권리, 공급자 거래 ID/이벤트 ID 중복 차단, 정확한 사용자 소유권, 구매 복원, 지출 후 환불 시 잔액 0 아래로 내리지 않고 별도 **환불 채무** 추적.
- fixture 결정 지급량(10/20/50)은 **오직 테스트 코드 안의 모의 수치**이며 실제 상점 가격·상품 수량·무료/유료 경제 확정값이 아님. DNA는 서버 권한 원장에서 유료 재화로 자동 변환하지 않음.
- 반드시 M03에서 **서버 신원 인증·DB 트랜잭션·유니크 인덱스·재실행 내구성** 확보, M04에서 결제사 실제 서버 확인/서명 검증. 인메모리 Map은 멀티 프로세스 경쟁/리부팅 복구 불가.
- CI `40482396863` 성공; 복구 `backup/monetization-m01-060-20261027`.

## 4. 70% 실제 결과 — 고객 구매 퍼널 모의 검증
- `tests/monetization_funnel_m01.test.cjs`: 상품 클릭 거부/주문 시도, 결제사 시뮬레이션 검증, 실제 지급 이전 대기, QA 적립, 부정 리다이렉트, 동일 결제 재사용, 실패/취소, 환불, 비소모성 구매 권리·복원 등 연속 플로우 테스트.
- CI `40482685586` **45/45 pass**. V614 source byte parity 검증도 성공. `docs/monetization/M01_VALIDATION_070.json`에 실제 테스트·미실시 분류.
- 70% 복구 `backup/monetization-m01-070-20261027` 원격 ref/content 검증 대상으로 확보.
- 현재 과금 버튼 비활성, 유료 재화 실제 지급 없음, 결제 계정/백엔드/광고 계정 없음. 고객에게 가짜 결제 성공 안내를 표시하면 안 됨.

## 5. 다음 '고' → M01 3/3 (80~100%)
- **80%**: 새 계약·카탈로그 schema, event replay/환불/사람 계정 경계·정적 게임/프리미엄 장부 격리를 한 번 더 감사. 40개 M01 정식 출시 수락기준을 pass/partial/unimplemented로 세분.
- **90%**: 문서와 계약 테스트만 안전하게 `main` 병합(Pages 빌드 트리거·실 결제 활성화 금지), 원래 V614/manifest 재조회. 서버 인증/데이터 암호화가 구현되지 않았으므로 production revenue 완료 선언 절대 금지.
- **100%**: M01 최종 보고서 및 원격 10~100% 전체 Git 복구 확인, M02 재화·상품 정량화 인수인계. 실제 SKU 가격/결제 재화 수량은 M02 이전에 확정하지 않음.

## 6. M02→M04 필수 업무
- M02: 무료 DNA의 실제 수입/지출 및 기존 상점 기능 실측, 유료 `mutation_crystal` 소비처·한정 수급/무료 대안, 상품 수량·KRW 원화 가격 후보의 선택·시뮬레이션.
- M03: 계정/백엔드/서버 DB, 영구 트랜잭션·원장, 무료 데이터 migration, 시크릿/분석/백업·환불 정책.
- M04: 한국에서 가입 가능한 웹 결제 서비스 또는 목표 배포 앱스토어의 공식 결제 수단, 사업자/판매자 인증·약관, Sandbox → live 결제사 검증·웹훅 연동, **실구매 후 지급·복원 실증**. 스토어 정책과 지역 예외 검토.
- 사용자가 결제 사업자 및 실제 비밀키를 연결/설정해야 하는 단계가 오면 공개 저장소/채팅에 비밀키를 올리지 말 것.
- M05/M06 이후 상점·광고 UI는 실제 사용자 구매/광고 동의/실패 이후 정상 복귀까지. 새 이미지가 꼭 필요하면 해당 단계 작업 **전** 사전 알림.

## 7. 개발 순서
`M01 3/3 → M02(경제/상품 가격) → M03(계정/실원장) → M04(실결제) → M05(상점) → M06(선택 광고) → M07(시즌/재구매) → M08(매출검증/환불/운영) → 기존 STEP09 2/3`.
사용자 지시 1회 = M01 하위 구간 1개. 백업 10% 단위 원격 전체 트리 branch+재조회. 이미지 렌더링 불필요.
