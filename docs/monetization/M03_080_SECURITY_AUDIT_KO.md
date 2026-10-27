# EVOLVE M03 80% — 인증·접근 통제 회귀 결과

2026-10-27 KST | M03 STEP 3/3 진행률 80% | **개발용 검증이며 상용 인증·과금은 비활성**

## 실제 수정
- `m03-server/db.cjs`: 인증된 사용자의 기존 계정을 **읽기 전용** 조회하는 `getAccount` 추가.
- `m03-server/api.cjs`: POST `/v1/accounts/bootstrap`에서만 `getOrCreateAccount` 허용. GET `/v1/me/wallet`, `/v1/me/entitlements`는 `getAccount`만 사용. 미등록 사용자 GET 호출이 계정/무료 재화 지갑을 생성하지 않도록 변경.
- 기존 `m03-server/tests/blockers.test.cjs`의 지갑 테스트용 저장소도 읽기 경계에 맞게 갱신.
- 신규 `m03-server/tests/security80.test.cjs`: 등록되지 않은 인증 사용자의 read 요청 차단, 타 사용자 계정 ID를 쿼리 문자열로 지정해도 서버 인증 계정만 조회, 정지 계정 차단, 잘못된 서명/만료/대상 클레임 인증 실패 4건 추가.

## 재현 가능한 GitHub Actions 증거
- 실제 실행: https://github.com/idonutyou/EVOLVE/actions/runs/40507797018
- SHA `3a1e0ab3d57a18162c201ca6073be43d7a9ca213`.
- GitHub Actions `postgres-test` 성공: Node 22 **22/22 passed, 0 failed**, 기존 PostgreSQL 17 임시 DB 통합 검사·dump/restore 성공.
- DB 직접권한 정책/RLS 검사, 외부 신원 제공자 실로그인·JWKS 회전, 세션 폐기, CSRF/CORS 운영 검증은 아직 수행하지 않았다.
- 정지/타계정 검증은 로컬 HTTP + 가짜 store 접근 검증이고, 모든 PostgreSQL 권한 제약이 상용 환경에서 시행된다는 뜻이 아니다.

## 향후 90% 작업
- PostgreSQL 백업→복원에서 단순 행 개수를 넘어 데이터 해시/행 내용 비교.
- 타 계정별 DB 조회와 불변 원장 DELETE/UPDATE 실패 검사, 재시도/실패 무결성 강화.
- 개발 서버의 localhost 제한 및 과금 차단 회귀 지속 확인.
- 이미지 렌더링 **불필요**. 공개 `dist/`, `web/`, 이미지, 저장 키, 운영 카탈로그 변경 없음. M04 이전 실제 고객 결제/유료 재화 지급 활성화 금지.
