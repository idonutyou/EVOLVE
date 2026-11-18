# EVOLVE 독립 공개 브라우저 화면 검사

## 목적과 기준

ChatGPT 브라우저가 차단되더라도 GitHub Actions의 격리된 Chromium에서 **현재 공개된 EVOLVE 게임**을 검사한다. 공개 주소는 `https://idonutyou.github.io/EVOLVE/`이며, 검사는 개발 `main/dist`가 아닌 서버가 현재 제공하는 `version.json`의 빌드를 읽는다. 2026-11-18 검사 시스템 도입 시점에 `main`은 V667, Pages 루트는 V717이었다. 버전을 섞어 비교하지 않는다.

- 검사 코드: `tests/evolve_live_browser_evidence.cjs`
- 실행 워크플로: `.github/workflows/evolve-live-ui-evidence.yml`
- 증거: Actions 실행 화면의 Artifacts → `evolve-live-ui-<run-id>`
- 파일: `report.json`, HOME·상점·파츠·전투·챌린지·도감 PNG, 393×852 / 320×568 / 852×393 화면 PNG 및 실패 시 `99-failure.png`
- 실기기 테스트: 별개. 이 검사는 헤드리스 모바일 뷰포트 검사이지 Galaxy S23+ 또는 Fold7의 실기기 테스트가 아님.

## 실패 판정

1. `browser_or_network_environment` : 브라우저/네트워크 정책, DNS, 프록시, 연결 차단. 게임 자체 결함이라고 추정하지 않는다.
2. `startup_or_navigation_timeout` : 부팅·페이지 전환 지연. 무조건 게임 코드 문제로 간주하지 않고 네트워크/로더 상태와 함께 판단한다.
3. `game_or_test_assertion` : 페이지 준비, 필수 메뉴, 빌드 정보, 화면 경계, JavaScript 예외 등에 관한 검사 실패. 최신 화면 구조로 변경된 UI 셀렉터의 노후화도 포함한다.

`report.json`은 HTTP 오류, 리소스 요청 실패, 콘솔 오류, 페이지 예외를 분리한다. 이미지 등 비필수 리소스의 단발 실패는 일단 기록하고, HTML 및 필수 JS 요청 실패는 실패로 판정한다. 화면 이미지의 흐림/경계 품질은 PNG를 직접 확인해야 하며 픽셀 일치 통과라고 주장하지 않는다.

## 실행 규칙

- 개발용 브랜치에 검사 스크립트 또는 워크플로를 푸시하면 테스트 자동 실행.
- `main` 대상 PR에 이 파일들이 바뀌어도 자동 실행.
- `workflow_dispatch` 수동 실행은 워크플로가 기본 브랜치에 반영된 뒤 GitHub Actions의 **Run workflow**에서 사용.
- 기본 브랜치에 병합된 뒤에는 매일 **한국시간 09:15**에 공개 페이지를 자동 검사한다. 개발 `main`의 `dist/index.html` 또는 `dist/version.json` 변경 시에도 검사한다.
- 공개 게임 배포 직후에는 일일 예약 검사까지 기다리지 않고 해당 workflow를 수동 실행해 최신 빌드의 스크린샷과 오류를 확인할 것.
- `main`이나 `pages-fast-evolve-20261029` 게임 파일을 수정하지 않으며, Actions `GITHUB_TOKEN`으로 Pages 배포하지 않는다.
- 브라우저를 다시 열기 위해 같은 차단된 로컬 주소를 반복 재시도하지 않는다.

## 복구 및 비용 관리

최초 기준 main SHA `c7e6a07f89109c75cbeaa4958552a1c4628a1c76`. 이 작업은 전체 게임 리소스를 checkout하지 않는다. 10% 단위 백업 브랜치 `backup/browser-qa-20261118-010`부터 `-100`까지 이전 체크포인트를 삭제하지 않고 유지한다. 화면 변경과 관계없는 기존 28개 전체 브라우저 회귀 검사 실행을 방지한다.

검사는 라이브 사이트에서 새 익명 브라우저 컨텍스트로만 이루어지며 결제, 구매, 저장 초기화, 배포를 수행하지 않는다.

## 실제 실행 검증 (2026-11-18 KST)

- 성공한 Actions 실행: https://github.com/idonutyou/EVOLVE/actions/runs/44212319200
- 실행 당시 공개 빌드: `V717-SHOP-ORIGINAL-TEXTURE-REVIEW-20261117`
- 결과: **PASS**, 10개 실제 Chromium 스크린샷, JavaScript page errors **0**, failed requests **0**.
- 첫 실패는 숨김 처리된 구버전 버튼 ID, 두 번째 실패는 화면마다 다른 그래픽/기존 버튼 선택 방식, 세 번째 실패는 DNA가 `dna-lab.html`로 별도 이동한다는 점을 검사기가 고려하지 않았기 때문이었다. 검사의 탐색 순서를 수정한 후 성공했다.
- 화면 품질·터치·실기기 퍼포먼스가 모두 완벽하다고 주장하지 않는다. 별도 수동 검토가 필요하다.
