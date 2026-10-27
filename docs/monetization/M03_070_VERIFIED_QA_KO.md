# EVOLVE M03 70% — 개발용 PostgreSQL 검증 통과

작성: 2026-10-27 KST | M03 STEP 2/3(40~70%) **개발 단계 완료**
단, 실제 서버 운영·결제/광고 지급·PG 거래·매출은 **미구현**. 이미지 렌더링 불필요.

## 버그 수정
- `m03-server/api.cjs`: GET bootstrap을 DB 사용 전에 405로 거부.
- `m03-server/db.cjs`: 지갑 응답에 `version`, `updatedAt` 추가, 비정상 잔고·버전·시각 차단.
- `m03-server/tests/blockers.test.cjs`: 회귀 테스트 5건 추가.
- `m03-server/tests/postgres.integration.test.cjs`: 임시 실제 PostgreSQL 트랜잭션·동시 처리·재접속 검증.

## 실제 실행 증거
- GitHub Actions: https://github.com/idonutyou/EVOLVE/actions/runs/40505953388
- CI 커밋 `a64f802339b7c7edff0d19af0e15d5f93401f9dc`
- Node 22 **18/18 통과, 실패 0, skip 0**.
- PostgreSQL 17.11 실제 서비스 컨테이너 사용.
- 기본 스키마+멱등 확장 SQL 실제 적용 성공.
- 100 결정에 80+80 동시 지출은 1회만 성공. 반복 요청 무중복, 변조된 재요청 거부, 거래 기록 합계 20, 강제 ROLLBACK, 재접속 뒤 잔고 20 유지 확인.
- `pg_dump -Fc` → 별도 DB `pg_restore` 성공. 원본/복원 양쪽의 `wallets`, `ledger_entries`, `ledger_operations` 각각 2행으로 일치.
- 복원 내용 전 필드/백업 장애 목표, 실제 로그인 제공자·서명 키 회전·RLS/권한·환불 웹훅·재해 복구는 **별도 80~100% 검증 대상**.

## 안전·다음
- 개발 브랜치 `monetization-m03-ledger-20261027`; 공개 `main` 게임 `dist/`, `web/`, 이미지·저장 키·판매 설정 변경 없음.
- M01 카탈로그 5개 SKU 모두 판매 불가. 실제 고객 결제/원장 연결 없음.
- 이번 산출물 GitHub 원격 2회 검증 및 `backup/monetization-m03-070-verified-20261027` 생성 후 70% 종료로 기록.
- 다음 **M03 STEP 3/3 80~100%** 보안·복구·검증 단계. 이미지 렌더링 불필요.
