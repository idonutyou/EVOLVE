# EVOLVE M05 — 90% STEP 3/3 통합·배포 후보 기록 (2026-10-28 KST)

## 변경 사항

- M05 개발 전용 `web/m05-shop-ui-v618.js`에서 기존 M04 `#m04MockTriggerV616`을 **하단 5개 홈 메뉴 위쪽의 별도 위치**로 옮기는 CSS 오버라이드를 추가했다.
- 원래 M04 구매 엔진·원래 앱 홈·파츠·전투/이미지·M03 유료 권리 및 서비스워커는 수정하지 않았다. 기본 URL에는 개발용 상점 자체가 나타나지 않는다.
- 목적은 80% Chromium QA에서 발견한 DEV 버튼이 `#homeSpecimenTab` 실제 손가락 터치 목표를 가리는 문제를 해결하는 것이다.
- 코드 및 해시 빌드: `web/m05-shop-ui-v618.js`, `tools/build_m05_090.py`; 브랜치 `dist/version.json`에 `M05-UX90`으로 기록. 기존 M04 모든 1,078개 해시 리소스(이미지 1,021개)와 M05 이전 4개 JS 리소스를 그대로 유지하면서 새 M05 옵트인 JS 한 개를 추가한다(전체 1,083개).

## 완료 승인 안전 기준

- `tests/monetization_m05_090_touch_browser.cjs`: 모바일 **393×852·320×568·852×393 가로**에서 DEV 버튼과 하단 5개 메뉴의 교차 영역 0, `#homeSpecimenTab` **실제 locator.click() 성공**, 홈 5메뉴 실제 클릭, DEV 상점 2개 탭 열림, 기본 URL DEV 숨김.
- 기존 M05 80% 실전 게임/코어 효과·전투 중 상점 접근 차단, M05 50~70% 구매/저장 안전·모바일 입력, 기존 M04 모의 상점 실동작을 순차로 검사.
- Node 기존 계약 **62/62**; `tools/verify_site.py`, `tools/verify_m05_090_release.py`, `tools/verify_m04_predeploy_gate.py` 통과.
- **실제로 성공한 GitHub Actions의 conclusion이 success일 때만 main에 fast-forward로 통합**하고, 공개 Pages의 배포 상태를 별도 확인한다. 실패했다면 공개 main은 변경하지 않는다.
- `main` 통합 전에 M04 기존 main SHA `fbe3224a3bdd95020829228427ddc3b05ed41f9e`가 변하지 않았는지 다시 비교하고, M05 90% 복구용 전체 트리 분기/증분 ZIP CRC와 SHA256 검증을 끝내야 한다.

## 결제·아트·데이터 보호

- M04 `MOCK_ONLY` 방식, `EVOLVE_DEV_MOCK_STORE_V1` 독립 테스트 로컬 저장, `EVOLVE_V575_TEST_*` 저장 및 DNA, 게임 밸런스·M03 상용 지갑/장부 불변.
- 상품 5종 `draft_disabled`, 실제 가격 null, `checkout_enabled=false` 유지. 정식 Google Play Billing / Apple StoreKit은 게임 전체 완료 뒤 M08에서 도입.
- 추가 이미지 렌더링 **없음**, 기존 이미지 1,021개 바이트와 5개 메인 탭 보존. 물리 Galaxy S23+ 장시간 사용/발열/FPS 실기기 검증은 아직 수행하지 않음.

## 모바일 검증 최종 증거 (2026-10-28 KST)

- [QA #40575562801](https://github.com/idonutyou/EVOLVE/actions/runs/40575562801): Chromium 실터치 3개 뷰포트에서 DEV vs 하단 메뉴 교차 영역 0, ORGANISM 실제 터치 정상, 기존 50~80% 회귀 통과, 62/62 Node 계약 통과. **마지막 commit push만 non-fast-forward 경합으로 거부**되어 전체 run 결론은 failure. 사용자 코드/게임 기능 테스트 실패가 아님.
- [검증 결과 재사용 및 빌드 저장 #40576659951](https://github.com/idonutyou/EVOLVE/actions/runs/40576659951): QA 성공 단계 API 확인 및 QA가 검사한 소스의 바이트 동일성 확인, 원본 보호·62/62 회귀 재검사, 최신 브랜치에서 M05-UX90 build를 안전하게 커밋·푸시. **success**.
- 최종 개발용 UI 빌드 SHA `b985a41a63ea8c9f4e9b6c773dbc7cbcb7b579855a907bdfb693e7e53463d60b`, 총 해시 자산 1,083개 (기존 1,078개 + DEV UI 스크립트 5개).

## 체크포인트 및 다음

- 90% 테스트: https://github.com/idonutyou/EVOLVE/actions/runs/40575562801 (성공 여부는 작업 최종 보고에서 별도 확정).
- 90% 복구 `backup/monetization-m05-090-20261028`; 파일 `checkpoints/EVOLVE_M05_090_20261028.zip`, `checkpoints/EVOLVE_M05_090_20261028.json`.
- 기존 10/20/30/40/50/60/70/80% 복구 브랜치와 ZIP 삭제 금지.
- **다음 `고` → M05 100%**: 실제 GitHub Pages의 공개 URL 및 실 모바일 QA 최종 확인, 개발/운영 결제 차단 검증, 인수인계 완결. **이미지 렌더링 불필요**.
