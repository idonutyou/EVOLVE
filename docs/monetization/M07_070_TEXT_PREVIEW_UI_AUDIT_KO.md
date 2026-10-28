# EVOLVE M07 70% · STEP 3/3: 이미지 없는 연구 시즌 텍스트 UI
2026-10-28 KST

## 구현
`monetization/m07/season-text-view-070.cjs` — 미션 TEST 스냅샷만 받는 읽기 전용 한글 HTML 생성기. 진행 표시용 미션 3개, 유료 KST 월간 시즌 달력, 준비 중 상품 상태를 렌더링한다.
`monetization/m07/season-text-demo-070.html` — 휴대폰에서도 열어볼 수 있는 별도 정적 HTML 데모. 외부 이미지·스크립트·서버 요청·저장소 쓰기·구매 버튼·보상 수령 버튼 없음.
`tests/m07_070_text_preview.test.cjs` — 진척 미리보기, 달력/윤일, 서버 없는 보상 지급 0, 손상된/수령 가능한 상태를 렌더링하지 않는 계약, 시안 코드의 HTML escaping, 세 가지 진행 표시, 작은 화면·reduced motion 규칙 확인.
`.github/workflows/m07-070-text-preview.yml` — M07 10~70% 회귀 검사와 원본 게임·상품 목록 보호.

## 현재 앱에는 아직 연결하지 않음
이 구현은 테스트 전용으로 GitHub 기능 브랜치에 있다. 공개 GitHub Pages 본편은 변경하지 않았다. 실제 시즌 미션은 아직 실행되지 않고 구매도 비활성화되어 있다.

## 어떤 화면에 연결할지 확인한 근거
`web/home-hub-v601.js`: HOME 메뉴 탭 5개 `SHOP/PARTS/BATTLE/CHALLENGE/CODEX`, 기존 챌린지 영역 `homeChallengeViewV601`와 `renderHomeChallengesV601()` 존재. **기존 챌린지 목록을 지우지 않고 같은 탭에 텍스트 연구 미션 블록을 추가하는 방법**을 차후 검토.
`web/native-shop-v620.js`: `season_research_pass_01`은 이미 '아직 준비 중 · 구매할 수 없음' 상태. 현재 단일 SHOP을 그대로 유지하고 신규 DEV SHOP을 만들지 않는다.
`web/admin-mode-v585.js`: `grantStageClearReward` 로컬 보상 훅, `startHomeBattleV522` 전투 시작 훅. 서버 인증 플레이 증거가 아님. `web/admin-state-v585.js`의 normalProgress는 사용자 장치의 localStorage. 관리자 모드/변조된 게임 진행도를 유료 미션 권리의 검증으로 사용하지 않는다.
전체 해시 전투 번들 및 인증 서버의 실제 이벤트 출처 확인은 아직 완료되지 않았다. 검증된 서버 이벤트는 **0개**.

## 고정 운영 정책
기간제 유료 패스: **매월 1일 00시~해당 월 말일 한국시간**, 다음 달 1일 00시부터 종료. 28·29·30·31일 가변.
무료 미션/이벤트: 별도 28일 운영도 가능. 유료 패스의 월말 종료와 무료 기간은 독립.
영구 구매한 외형 보유권은 기간 종료로 삭제하지 않는다.
유료 시즌 SKU는 `draft_disabled`, 가격 null, checkout/client grants OFF, 실제 지급 0.
신규 이미지 렌더링·게임 코드·기존 이미지 1,021개·기본 SHOP·세이브 변경 없음. M06 시안과 모든 과거 백업 보존.

## 제한과 다음
현재 생성기는 `LOCAL_TEST_ONLY` 또는 `M07_LOCAL_TEST_BATCH_ONLY` 스냅샷만 받아, 실제 지급·구매·수령 가능한 상태가 포함되어 있으면 출력하지 않는다. 정적 HTML은 실제 플레이 데이터를 연결하지 않은 데모다. 완료된 프런트엔드 통합·브라우저 실기기 QA·서버 영수증 검증으로 표현하지 않는다.

**다음 M07 80%, STEP 3/3**: 본편 CHALLENGE 탭을 보존하며 읽기 전용 UI를 안전하게 통합할 방법, UI·접근성 테스트, 신규 이미지 불필요한 구현 준비. 기존 SHOP/세이브는 변경하지 않는다.
