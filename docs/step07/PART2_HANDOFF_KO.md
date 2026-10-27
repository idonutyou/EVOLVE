# EVOLVE — STEP 07 / 2-of-3 구현 검증 인수인계 (70%)
작성일: 2026-10-27 KST

## 현재 정확한 상태
- STEP07 / 43 중 2/3(40~70%) 구간 완료 예정. **V614 후보가 분리 브랜치에서 구현·국소 브라우저 검증됨**.
- 구현 브랜치: `step07-monster-feedback-v614-20261027`.
- 공개 `main`/GitHub Pages는 **V613 그대로**다. V614 미배포·실기 Galaxy S23+ 미검증. 작업 중 임의 이미지 렌더링 0개.
- 40/50/60% 원격 Git 복구점은 `backup/step07-040-20261027`, `backup/step07-050-20261027`, `backup/step07-060-20261027`. 10~30%와 STEP06 백업도 삭제하지 않음.
- 후보 빌드: `V575-STEP07-MONSTER-FEEDBACK-V614` / `8bf4982e0c0662adaf631bc0abbf3f96cf9dc509697dd0f26d5d46408c046317`.
- 후보 엔진: `assets/e343fb68db8ad1e2fb09bad6c28f3d95eff1c5ef232438670453adb56cfba64a.js`; SHA-256 = e343fb68db8ad1e2fb09bad6c28f3d95eff1c5ef232438670453adb56cfba64a.
- 기존 1,021개 이미지 바이트 그대로 유지, asset manifest 1,067개 유지. V614이 추가한 것은 최신 게임 엔진 내 **시각 전용 코드**이고 추가 PNG/스프라이트·새 death echo 풀 없음.

## 구현 요약
- `web/monster-feedback-v614.js`: 일반/빠른/무거운/정예 구분, 간단한 흔들림과 감쇠, 기존 deathEcho에 무게감 추가, 실제 피해와 DOT/실드 구분, 24개(고밀도 상황에서 14개) 시각 반응 상한.
- `web/monster-feedback-adapter-v614.js`: 기존 게임 이벤트 브리지에 지연 구독해 시작 순서와 호환. 이미 존재하는 총/칼·가시/채찍·전격 포즈는 우선, 경고 중복 회피. GPU/Canvas 렌더 경로를 공통 포즈값으로 한 번만 보완. `spawnDeathEcho` 1개에만 시각 옵션을 적용; 기존 보스/TITAN 에코 변경 금지. reset/returnToHome에서 효과 초기화.
- `tools/package_monster_feedback_v614.py`: V613 고정 main 커밋 `82ccefffaf801be3e560310493eae86003c82d93`에서 인덱스/manifest/version을 가져와 **항상 같은 후보**를 재조립한다. 코드 삽입부 삭제 시 V613 엔진 완전 복원. 저장키·능력치·맵·보스 전투 코드 변경 없음.
- `tools/verify_monster_feedback_v614.py`: 복원 가능성, 실제 게임 로직 바이트 동등성, 1,021개 이미지 개별 SHA, 1,067개 자산 확인.
- `tests/monster_feedback_v614.test.cjs`, `tests/monster_feedback_browser_v614.cjs`, `.github/workflows/validate-step07.yml`: 국소 단위·Chromium 검증, 아티팩트 보존.

## 실제 검증 증거
- 후보 빌드 Actions #40431437009 success (24개 V612·V613·V614 단위 검사, 몬스터 모션/전격 회귀, 사이트 패키지 검증).
- 실제 mobile Chromium Actions **#40432070871 success** (23:??Z가 아닌 Actions에 기록된 실행 시각 확인). 새 피격은 원본 `hurtEnemy`로 실체력 -15와 일시 압축을 확인.
- 기존 총 명중은 STEP05만 소유(V614 재발동 0); 실제 치명타 적 사망은 기존 `deathEcho` 정확히 **1개**, V614 장식 **1회**. 250회 synthetic hit 관측은 최대 24개의 시각 포즈로 제한. 회전/귀환/저장/재접속 통과. 기존 STEP05 총·칼 및 STEP06 가시·채찍의 실제 Chromium 회귀도 통과. page errors/failed HTTP requests: 0.
- 전체 엔진에서 V614 추가부를 제거하면 V613 SHA-256 `abea964a4ccb5c0f4ea1079f481aa6bb5a4ec0574cf85c0b0801038b1b17d255`로 복원. 1,021 이미지 유지.
- 첫 브라우저 실패들은 V614 시험 코드의 없는 API 참조/피격 후 시간 미진행/죽음 에코 탐색 오류였고 기존 API에 맞춰 수정해 최종 40432070871 success로 검증했다.
- 자동 CI 성공은 Galaxy S23+ 실기 장시간 FPS·발열을 의미하지 않는다. 3분/5분 스트레스 게임플레이 수치 미측정.

## 다음 호출: STEP 07 / 3-of-3 (80/90/100%)
- **80%**: `docs/step07/TEST_MATRIX_V614.json`의 29개 항목을 pass/fail/untested로 기록. 기존 보스/중간보스/전투·맵/경고/저장/실제 3~5분 성능 지표 여부 확인. 필요 시 browser test 확대. 불확실한 항목을 통과로 표시하지 말 것.
- **90%**: 브라우저·전체 회귀 성공 시 **main 병합**, GitHub Pages 배포 작업 성공, `version.json` 및 manifest/엔진 SHA·공개 브라우저 QA로 V614 실배포 확인. 버그면 후보 브랜치부터 수정하고 이전 V613으로부터의 복구 경로 유지.
- **100%**: 최종 보고 및 `backup/step07-100-20261027` 전체 Git 저장소 복구 지점을 만들고 refs+원격 파일 재조회; 10~90% 백업 삭제하지 않음. 미검증 Galaxy S23+ 상태는 명확히 분리.
- **다음 STEP 08 — 타격감 첫 플레이 검증.** 신규 이미지 렌더링 기본 불필요. STEP07의 끝에 이 안내를 다시 포함.

## 반드시 지킬 정책
- 이미지는 신규 렌더 불필요. TITAN 고유 피격·사망, 중간보스 랭크, 지도·콜리전 JSON·세이브·스킬 공격력·전격 장비 잠금 보존.
- 독/침은 STEP06 제외 규칙 유지. STEP07 시각 이벤트 정책에서 spit 자체 기능 삭제가 아님.
- 이번 구간의 공개 사이트는 V613이며, 70% 설계+후보 완성을 100% 배포 완료로 표시하지 않는다.
