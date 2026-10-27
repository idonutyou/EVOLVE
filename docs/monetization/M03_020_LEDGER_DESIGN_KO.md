# EVOLVE 수익화 M03 — 20% 권한 원장 구조·불변식 설계

2026-10-27 KST | STEP 1/3, 20% | **설계 SQL이며 실행·배포된 데이터베이스가 아니다.**
도면: `docs/monetization/M03_020_LEDGER_SCHEMA.sql`

## 최소 서버 권한 원칙
- 기존 클라이언트의 DNA, 보스 보상, 스테이지 메타는 서버 `mutation_crystal` 지급 근거가 아니다.
- 이용자는 인증된 세션의 `account_id`를 서버에서 결정. 요청 본문의 계정 ID를 신뢰하지 않는다.
- wallet은 (account, currency, source bucket=free/paid)별 서버 잔고 스냅샷. `available_units >= 0`, 기기 로컬 파일은 보조 UI만.
- ledger는 모든 재화 이동을 서명 있는 delta 기록으로 append-only. operation의 request hash + 계정별 idempotency key 고정; key 재사용 시 같으면 동일 결과, 다르면 409.
- 서버 reward는 서버의 검증된 진행 이벤트에 의해 1회 발생; 아직 이벤트 식별 및 공격 억제 정책 미확정 → M03에서는 비활성.
- 환불 이벤트는 `provider, provider_event_id`와 `provider_transaction_id`로 각각 중복 확인; 실제 서명·정산 확인은 M04.
- 권리는 `entitlement_sources` 행별 다중 소유 근거 보존. 하나의 결제만 환불될 때 그 원천만 무효화하고, 다른 원천이 active면 게임 내 사용 권리 유지.
- 소비는 무료/유료 각 bucket을 모두 원장에 기록. 우선 소진 순서는 사용자/정책 확정 전 **보류**; 장바구니 구매 시 재화 공급 원천을 뭉뚱그리지 않는다.

## 원자적 처리 프로토콜 (DB 실제 구현/동시성 시험은 40~70%)
1. 서명된 세션 인증 → 계정 잠김/정지 상태 확인 → 요청 idempotency key + 서버 기준 요청 fingerprint 확보.
2. 단일 DB 트랜잭션 시작 후 account lock, free/paid wallet 행을 고정 순서로 SELECT FOR UPDATE. 동일 계정이 병렬로 소비하더라도 순환 락 회피.
3. 이미 실행한 (account,key)면 fingerprint 일치 시 기존 결과만 반환하고 새 원장 행 금지; fingerprint 불일치 시 409.
4. 서버 검증 가능한 지급/권리 증거를 확보. M03 기간 구매·광고·자칭 완료 증빙은 모두 DENY. 충분한 잔고 확인 후 소비·지급을 계산.
5. immutable operation/entries INSERT, wallet snapshot UPDATE, entitlement source/case 상태 변경을 **하나의 COMMIT**으로 처리.
6. 예외/타임아웃 시 ROLLBACK. 커밋 여부가 불분명하면 재시도는 같은 idempotency key로 조회·재사용.
7. 균형 재검증: 각 (account,bucket)의 `wallet.available_units = SUM(ledger_entries.delta_units)`. 잔고 불일치는 fail closed + 운영 알림.

## 실패·공격 시나리오와 요구 결과
| 입력 | 서버의 예상 처리 |
| --- | --- |
| localStorage DNA + 클라이언트 직접 크레딧 | 거부, 원장 0 증가 |
| A의 세션으로 B의 wallet 조회 | 401/403, B의 데이터 유출 0 |
| 같은 지급 이벤트 두 번·병렬 재시도 | 단 한 번 지급, 같은 결과 재사용 |
| 동일 idempotency key + 다른 SKU/금액 | 409, 변경 없음 |
| 잔고 100에서 80+80 동시 지출 | 하나만 성공, 잔고 음수 불가 |
| PG 웹훅 반복·순서 역전·서명 위조 | 검증 전 지급 0; provider+event ID 중복 차단 |
| 환불 뒤 이미 사용한 결정 | 음수 잔고 자동 생성/고객 권리 임의 박탈 금지, **수동 검토 큐** |
| 구매/결정 사용으로 동일 외형을 두 번 획득 | 각 소유 원천 유지; 일부 환불 시 다른 유효 원천 보존 |
| 지급 도중 프로세스 사망 | 전체 롤백 또는 커밋, 부분 적용 금지 |
| 인증 세션 탈취·로그아웃·탈퇴 | 세션 취소/복구/보유·삭제 기준 검토, 권리 무단 이관 금지 |

## 아직 미확정이며 30%에 다룰 항목
- 인증 공급자와 계정 복구 방식, 서울/해외 운영 지역, 개인정보·로그 보유, 백업/복구 RPO/RTO.
- 서비스 운영 비용·DB 벤더·실제 DB 자격증명과 관리자 권한(여기서는 **생성하지 않음**).
- 실제 PG, 소비 우선순위, 결제 후 환불 시 권리·잔고 정책, 무료 보상 서버 검증 방식.
- 이번 도면의 SQL은 정적 제약만 포함. 파일이 있다는 사실이 데이터베이스 생성/운영·동시성 검증을 의미하지 않는다.
- 다음 30%: 기존 M01 계약과 충돌 없는 **M03 읽기 API, 비활성 처리 API, 계정 회복 운영·검증 게이트** 명세.
- 이미지 렌더링: **불필요**.
