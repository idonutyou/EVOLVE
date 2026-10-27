# EVOLVE M03 STEP 2/3 — 70% 구간 QA/인수인계 (2026-10-27)

**상태: 코드·Native Node 국소 시험 완료 / 실제 PostgreSQL 통합·백업 복원 게이트 미달성.**
따라서 M03 70%는 *작업 산출물 체크포인트*로만 보존하며, STEP 2/3의 완료 판정은 보류한다. 아직 운영 서버·실결제·실매출 없음. 신규 이미지 불필요.

## 40–60% 실제 변경
- `m03-server/` 아래 Node.js 개발 전용 API, RSA 서명 토큰 검사, PostgreSQL 질의 어댑터, 부팅 환경 차단 스크립트, 개발용 package manifest.
- `m03-server/wallet-ops.cjs`: 트랜잭션 내부 소비, 계정 단위 잠금, 중복 key 요청 fingerprint 일치 검사, 잔고 조건부 UPDATE, append-only operation/entry 원장.
- `m03-server/rights.cjs`: 권리 출처 집계, 환불 요청을 pending_review로만 저장. 결제사 승인/권리 자동 회수 미구현.
- `m03-server/migrations/002_idempotent_results.sql`: 미검증 개발 DB 변경안 (20% 설계 SQL 뒤 적용 필요).
- `m03-server/README.md`: 독립 개발용 실행 조건과 안전 경계.
- 사용자 게임 `dist/`, `web/`, 이미지, 기존 저장 키, M01 상품 카탈로그 변경 없음.

## 실제 시험
- Node.js v22.16.0의 `node --test` 실행: **12개 테스트 모두 통과(12/12)**.
- 테스트 범위: RSA 서명·유효기간·대상/발급자 거부 4개, 모의 SQL 소비 경쟁/재실행 4개, 환불 권리 출처 3개, 로컬 HTTP 인증 차단·503 응답 1개.
- 로컬 시험에 사용한 `auth.cjs`, `api.cjs`, `wallet-ops.cjs`, `rights.cjs` 및 `tests/{auth,api,wallet,rights}.test.cjs` 8개 파일의 Git blob SHA-1을 원격과 비교해 **모두 일치**시켰다.
- SQL 경쟁 시험은 **모의 DB 직렬화**로 이루어졌으며 실제 PostgreSQL의 SELECT FOR UPDATE, transaction abort, VACUUM, 재시작, 데이터 백업 복구를 증명하지 않는다.
- 이 런타임에는 `pg` 패키지와 실제 PostgreSQL 서버/CLI가 없고 외부 인프라를 새로 만들지 않았다. 신원 제공자 실제 연동, 계정 복구, CORS/CSRF 검증, DB 권한/프로덕션 운영은 미검증.

## 발견된 구체적 80% 이전 필수 수정
1. 현재 API `GET /v1/accounts/bootstrap`는 valid JWT를 가진 경우 계정 생성 뒤 405를 보낼 수 있어 **읽기 요청의 부작용**이 존재한다. DB 호출 전 메서드 차단 필요.
2. `readWallet` API 응답은 30% OpenAPI 계약의 `version`, `updatedAt`이 빠져 있다. 실제 서비스 연결 전 계약을 일치시켜야 한다.
3. 실제 신원 제공자 키 회전/JWKS, 토큰 취소, 인증 공급자 보안 정책은 미정.
4. 스키마를 실제 테스트 DB에 적용해 원장 잔고 일치, 중복 소비/반품, 권리 출처와 데이터베이스 복원 실험이 필요하다.
5. 계정 연결, 상품 지급, 권리 회수는 현재 의도적으로 비활성이므로 수익화 준비 완료가 아니다.

## 다음 재개
- **M03 STEP 2/3 70% 차단 해소**: 위 1~4번 수정·실제 PG 테스트, 백업/복원 수행. 테스트 DB 접근이 불가하면 그 사실을 유지하고 70% 승인하지 않는다.
- 안전 게이트 통과하면 M03 STEP 3/3(80~100%)의 보안 회귀, 배포 연계/사업자 PG M04 계약 준비.
- 원격 복구 ref: `backup/monetization-m03-070-20261027` (저장 뒤 GitHub ref 및 파일 2회 확인 필수).
- 이전 10~60% 및 M01/M02 백업은 삭제 금지. 이미지 렌더링 불필요.
