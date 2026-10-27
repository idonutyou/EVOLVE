# M03 50% — 영속 원장 소비·멱등성 구현 점검 (2026-10-27)
범위: 별도 개발용 코드. 실결제·PG·실서버 배포 금지. 이미지 생성 불필요.

- `m03-server/wallet-ops.cjs`: 내부 서비스 호출용 단일 출처(bucket) 소비. 클라이언트 공개 라우트에 연결하지 않음.
- account `SELECT ... FOR UPDATE`로 계정별 소비 요청 직렬화, 원장 operation request_hash + key 중복 검증, wallet 조건부 원자적 감소, immutable entries 기록을 단일 `store.tx()` 안에 수행.
- 동일 key + 동일 페이로드: 기존 결과 재사용. 같은 key + 변경된 금액: 예외 및 DB 전체 ROLLBACK.
- `m03-server/migrations/002_idempotent_results.sql`: 20% PostgreSQL 스키마 설계 뒤 추가하는 개발용 결과열. **실DB에 실행했다고 보고할 수 없음.**
- `m03-server/tests/wallet.test.cjs`: 비동기 mock SQL 직렬화 시험 4개(경쟁 80+80, 동일 key 재실행, 페이로드 충돌, 음수). **mock 성공은 실제 PostgreSQL 락/트랜잭션 검증이 아님.**

제약: 무료/유료 bucket 사용 우선순위는 아직 확정되지 않았으므로 내부 소비는 명시된 단일 bucket으로만 동작한다. 유료 상품·결제 검증 이벤트·광고 보상·실재화 지급 호출은 만들어지지 않았으며 공개 API의 `POST` 과금 경로는 여전히 503이다. 운영 DB/계정 없음.

다음 60%: 외형 권리 원천을 분리해 유지하고, 환불 시 수동 검토 큐에 보존하며, 인증·권한/세션 실패 테스트 보강. 그다음 70% Node 회귀 및 가용 범위 검증·원격 인수인계.
