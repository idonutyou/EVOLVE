# EVOLVE — M03 계정·서버 권한 원장 착수 인수인계

작성일: 2026-10-27 KST | 상태: **M03 미착수**, 설계 기준만 인수인계 | 이미지 렌더링: 불필요

## 실제 수익화를 위한 목적
M01의 모의 결제 계약과 M02의 오프라인 경제 공식은 고객 재화 지급 권한이 없다. M03에서는 클라이언트 `localStorage`와 분리된 계정·영속 DB·서버 권한 원장을 만들어야 한다. M04에서 실제 제공자 테스트·서명·환불 검증을 통과하기 전까지 **구매 활성화와 유료 재화 자동 지급은 금지**한다.

## 경계·필수 원칙
1. `EVOLVE_V575_TEST_*` 등 기존 게임 저장 키, 맵·전투·장착·DNA 연구의 오프라인 흐름을 임의 변경하지 않는다. 클라이언트의 DNA 잔고나 호출 파라미터는 유료 재화의 서버 크레딧 증빙으로 사용할 수 없다.
2. 서버의 인증된 player/account ID에만 권리를 기록한다. 게스트 계정과 복구·계정 연결 요구를 분리 설계하고, 신원 확인되지 않은 브라우저 요청으로 서로의 자산을 전송할 수 없게 한다.
3. 화폐 종류와 출처를 구분: 기존 무료 DNA, 서버 검증 무료 `mutation_crystal`, 서버 결제로 확인된 유료 `mutation_crystal`. 서로 수동 변환·합산 지급을 금지하고, 소비 규칙은 정책으로 명시.
4. 잔고는 서버에서만 계산·검증하고 모든 지급·소비·취소 이벤트를 **추가만 가능한 원장(entry)** 으로 기록한다. 동일 요청 idempotency key와 provider transaction ID는 유일해야 한다.
5. 소비/잔고 확인/원장 생성은 **단일 DB 트랜잭션**에서 원자적으로 진행하고 동시 요청을 직렬화 또는 버전 검증해 이중 지출/중복 지급을 막는다.
6. 사용자 권리는 구매 원천별로 추적: 직접 현금 구매·결정 소비·시즌 보상 각각 별도 권리 근거로 연결. 하나의 구매가 환불되어도 독립적으로 취득한 유효 권리까지 삭제하면 안 된다.
7. 환불된 결정을 이미 소비했을 때 음수 잔고·권리 박탈·계정 잠금의 정책을 운영자/법률·결제 제공자 조건 확인 전 임의 자동화하지 않는다. 우선 **보류 및 수동 검토 큐**로 설계.
8. `M01 draft_skus.json`의 구매 차단값은 그대로 유지하고 실제 상품 가격은 반드시 검증된 제공자 카탈로그에서만 입력. 운영 비밀키·웹훅 비밀은 GitHub Pages 또는 Git 저장소에 두지 않는다.

## 데이터 모델 초안 (M03 10~30%에서 확정·검증)
- `accounts`: account_id, created_at, status, recovery_identity_ref, version
- `wallets`: account_id, currency, origin_bucket (free/paid), available_units, version
- `ledger_entries`: entry_id, account_id, bucket, delta, reason, source_id, idempotency_key, created_at, reversal_of
- `purchase_intents`: intent_id, account_id, proposed_sku, state (disabled/sandbox_pending/verified/reversed), created_at
- `entitlement_sources`: grant_id, account_id, entitlement_id, source_type, source_ref, state, revoked_at
- `provider_events`: provider, event_id, verified_at, payload_digest, processed_state (M04에서 실제 웹훅 확인 구현)
- `audit_events`: 요청 상관관계 ID, 관리자 조치/차단 이유, 민감정보 최소화

## 제안 API 경계 (M03에서는 mock/비활성 경로만)
- `POST /v1/accounts/bootstrap`: 서버 발급 계정/세션 생성; 인증/재시도 정책 필수
- `GET /v1/wallet`: 인증된 계정의 서버 잔고/버전 읽기
- `GET /v1/entitlements`: 권리 및 근거 조회, 취소 상태 반영
- `POST /v1/reward-claims`: 임무 완료 증빙 서버 검증 후 idempotent 지급 (실제 이벤트 정의 전엔 disabled)
- `GET /v1/catalog`: 현재 활성화 가능/불가 이유만 표시, 구매 시작은 disabled
- `POST /v1/purchases/verify` 및 provider webhook은 **M04 이후** 제공자 서명/서버 확인 완료 전 무효화

## M03 3개 STEP 순서
- **1/3 · 10~30%**: 기존 저장·M01 계약과 M02 모델 대조, 서버 후보/운영비/법적 데이터 보관 요구사항, DB 스키마/트랜잭션/인증/권한 및 장애 모델, 백업 계획 확정.
- **2/3 · 40~70%**: 개발용(실판매 금지) HTTPS API + 영속 테스트 DB, 원자적 원장/멱등 지급·소비·취소·복원, 동시성/재시도/권한 실패 테스트, 10%별 원격 복구.
- **3/3 · 80~100%**: 변경점 회귀·실제 테스트 환경에서 DB 경쟁/복원/보안 검사, 비밀키/권한 설정·모니터링/감사 로그, 공개 클라이언트의 구매 차단 유지, M04 결제 연계 계약 인수인계. 운영 판매는 여전히 금지.

## 착수 이전 확정할 결정
- 운영 계정/서버·DB 비용 및 배포 주체, 백업/로그 보관·개인정보 삭제 정책, 제공자 계정 및 운영상 서비스 지역, 지원/환불 기준, 무료/유료 원천 간 소비·환불 순서.
- 서버·실결제 구축 우선. 시즌/아트/상점 UI는 실제 공급 가능한 상품·권리·복원·가격 검증까지 후속 단계로 둔다.
- 이전의 `backup/monetization-m02-010~090-20261027` 및 M01 전체 백업은 삭제하지 않는다. 새 채팅에서는 `EVOLVE_HANDOFF.md`, `EVOLVE_PROGRESS.md`, `EVOLVE_ROADMAP.md`와 최신 commit/ref를 우선 읽는다.
