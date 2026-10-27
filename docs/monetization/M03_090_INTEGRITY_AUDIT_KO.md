# EVOLVE M03 90% — 실DB 원장 및 복원 무결성 검증

작성일 2026-10-27 KST | STEP 3/3 | 운영 판매 및 결제는 비활성. 이미지 렌더링 불필요.

## 실제 수행
- 실제 PostgreSQL 17을 사용해 `m03_ledger_entries`의 UPDATE/DELETE 및 `m03_ledger_operations`의 DELETE를 시도했고, append-only 트리거가 차단하는 것을 검증.
- 별도 계정과 지갑을 생성해 타 계정 잔고와 거래 기록이 섞이지 않음을 확인.
- `pg_dump -Fc`로 임시 DB를 백업하여 새 DB에 `pg_restore`한 뒤, 지갑·원장·operation 행 개수와 **모든 행의 JSON 값 집계 MD5**를 각각 대조해 일치 확인.
- 기존 경쟁 80+80 소비, 멱등 키 재사용, 롤백, 연결 재시작 테스트 유지.

## GitHub Actions 검증 결과
- https://github.com/idonutyou/EVOLVE/actions/runs/40508368361
- **Node 22 테스트 22개 통과, 실패 0, PostgreSQL 17 통합·복원 잡 success**.
- 복원 데이터 해시: wallet `bdf742272d91bc3d59d000cea1508100`, entries `9191afcc4872cb9123f35676e60a1576`, operations `706303f9f460032237ecc70a91875840`. 임시 CI DB 결과이며 운영 사용자 데이터가 아님.
- DB 트리거 거부 로그는 예상된 실패를 테스트가 정상 수용한 것.

## 범위와 남은 일
- 실제 운영 신원 제공자, 세션 회수·키 교체, 운영 DB 권한과 RPO/RTO, PG 결제 검증·환불·실매출은 미구현.
- `dist/`, `web/`, 이미지, 기존 게임 저장 및 판매 상품 카탈로그 변경 없음.
- 다음 100%: 개발용 M03 트랙 최종 감사·안전 병합·M04 인수인계. 실제 결제 활성화 금지.
