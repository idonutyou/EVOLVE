# STEP 08 — 10% 타격감 플레이 검증 기준선 조사
작성일: 2026-10-27 (KST) · 구간 1/3 설계 · 실제 게임 파일 **변경 없음**

## 고정 기준
- 최종 공개 게임: `https://idonutyou.github.io/EVOLVE/`; `V575-STEP07-MONSTER-FEEDBACK-V614`
- 빌드: `8bf4982e0c0662adaf631bc0abbf3f96cf9dc509697dd0f26d5d46408c046317`
- V614 엔진: `assets/e343fb68db8ad1e2fb09bad6c28f3d95eff1c5ef232438670453adb56cfba64a.js`
- 설계 시작 main 커밋: `10fc95c7313a08084e7b95738f50188f72850a27`
- 단계 08의 목적: 일반·중간보스·TITAN의 근접/원거리 전투에서 **타격감을 직접 비교하는 검증**. 1/3은 평가 기준 확정만, 2/3에서 브라우저 플레이 측정, 3/3에서 분석 결과/수정 우선순위 마무리.
- **신규 이미지 렌더링: 불필요**. 플레이/로그/검증 화면 캡처는 기존 그래픽 촬영이며 새로운 이미지를 생성하는 작업이 아니다.
- 1/3에 `dist`, `web`, `tests`, `art`, `EVOLVE*`, Pages, UI·게임 수치 변경 금지.

## 코드·회귀 검사 조사 결과 (main 실제 저장소 파일 근거)
1. `tests/monster_feedback_browser_v614.cjs`: 실제 `hurtEnemy`로 대미지 15 / 피격 포즈, 총 타격 효과 소유권, 죽음 잔상 1개, 250개 **합성 hit 이벤트**의 활성 효과 상한, 세로·가로·귀환을 검사한다. **250마리 실제 전투가 아니다**.
2. `tests/weapon_hits_browser_v612.cjs`: 총 발사/칼 공격, 명중, 잔상·효과 및 가로 화면/장비 상태. `tests/organ_hits_browser_v613.cjs`: 가시·채찍·DOT, 전격 장비 잠금/모션 감소 검증.
3. `tests/horde_roles_browser.cjs`: 일반 몬스터 이동·투사체·전조 및 고밀도 30초 **고정 dt 가속 시뮬레이션**. 실제 30초 프레임 연속성이나 실기 FPS 증거로 사용하면 안 된다.
4. `tests/admin_combat_browser.cjs`: 일반 7종/추가 타입 카탈로그, 중간보스 5단계 등급, `alpha`/`sentinel`/`hunter`/`omega` 4개 중간보스의 3종 공격/예고와 실제 고정 dt 발동 검증. 중간보스 테스트 대상을 이 코드를 기반으로 만들 수 있다.
5. `tests/boss_cinematic_browser.cjs`, `tests/attack_warnings_browser.cjs`, `tests/visual_clarity_browser.cjs`: BIO, VENOM 경고/장면과 공격 전조, 세로·가로 렌더 회귀. 기획된 **7 TITAN 전체가 플레이 가능한 상태라고 가정하지 않는다**.
6. `tests/monster_motion.test.cjs`, `tests/visual_clarity_browser.cjs`: 걷기·피격·공격·사망 상태, 체력바 시인성, GPU/Canvas 보존의 기존 회귀 기준.
7. `docs/step07/VALIDATION_MATRIX_080.json`: 29개 검증 항목 중 pass 14/partial 11/pending 4로 엄격하게 보관됨. 특히 실기 Galaxy S23+에서 FPS/발열/메모리 및 1/3/5분 p50/p95 성능 자료 없음.
8. 많은 기존 브라우저 테스트가 `requestAnimationFrame`의 실제 게임 loop를 중단하고 `c.step(dt)`를 수동 호출한다. **그 검사는 기능/결과의 재현성에는 유효하지만 실제 게임 FPS 측정에는 부적합**. STEP08에서는 QA 수동 시간시험과 실시간 성능시험을 별도 트랙으로 설계해야 한다.

## 이번 STEP08의 10% 발견·위험
- 타격감 자체는 기능 테스트 통과만으로 확정 불가. 반응 지연·투사체 충돌 전달감·독립적인 몬스터 움직임·시야 혼잡도·사망 식별력을 구별하여 기록한다.
- 현실적 게임 시나리오는 장비(총/칼)와 부위(가시/채찍) 실제 장착/습득 여부를 따른다. 전격은 현재 잠금 상태를 우회하지 않는다. 침은 기존 게임 기능 유지하되 STEP06 효과 분석 대상과 구분한다.
- 중간보스와 TITAN은 실제 공격·체력·페이즈 변경을 일으키는 테스트가 필요하지만 **기존 정상 보스 패턴을 수정해서는 안 된다**. 테스트 전용 관리자/QA fixture가 허용한 범위에서만 제어한다.
- 50/180/250 실제 몬스터 스트레스에서 CPU/GPU/메모리·화면 밀도 비교가 필요; 합성 이벤트 250개를 대체 지표로 쓰지 않는다.
- 실제 3~5분 자동 브라우저 실행은 헤드리스 Chromium의 FPS만 대표한다. Galaxy S23+ 실제 열, GPU, 백그라운드 복귀, 네비게이션바 상태는 자동 CI로 확정하지 않는다.

## 다음 체크포인트
20%: 일반·중간보스·TITAN×근거리·원거리 매트릭스, 전투 지표·주관 체감 점수와 합격/보류 기준 확정.
30%: 게임/실시간 성능 타이머를 구분하는 브라우저 시험 구현 명세·회귀 안전장치·분석 보고서 양식·인수인계. Game/Pages 업로드 없음.
