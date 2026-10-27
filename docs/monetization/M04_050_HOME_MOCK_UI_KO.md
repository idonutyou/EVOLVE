# EVOLVE M04 — 50% 개발용 모의 상점 메인 홈 연결 / 검증 (2026-10-27)

**진행 상태: M04 STEP 2/3 (50%) 기능 브랜치 통합·브라우저 회귀 통과.** 실제 GitHub Pages 공개 `main`에는 미병합; 최종 모바일 스토어 결제는 M08. **신규 이미지 렌더링 불필요.**

## 실제 구현된 사용자 흐름
- `web/mock-premium-ui-v616.js`: V614의 기존 메인홈 `#poster`에 **'◈ DEV 상점'** 버튼을 별도 부착. 기존 `#homeTabs` 다섯 탭 구조/이벤트는 유지.
- 기능 진입: `?evolveMockShop=1` **명시적인 개발용 URL 플래그** + 허용 개발 호스트에서만. 플래그 없으면 상점 버튼/글로벌 모의 구매 API가 없다.
- 버튼 클릭 → 모바일 스크롤 가능한 모의 상점 팝업 → 5개 테스트 상품 카드 → 모의 구매 → **DEV TEST 결정** 잔고/소유 여부 표시.
- 테스트 수량: 스타터 지원 +75(계정당 1회), 소형 결정 +100, 중형 결정 +300, 코어 테마는 시험용 소유권과 **모의 장착/해제 상태**, 시즌 패스는 콘텐츠 미완성으로 구매 차단.
- 재실행 후 테스트 소유권/잔고 유지; 각 거래 `MOCK_ONLY`와 `dev_mock` 영수증/난수 요청 ID 사용. 레거시 `EVOLVE_V575_TEST_*` 저장, DNA, 기존 무료 경제, M03 실재화와 격리.
- 모의 코어 장착은 테스트 상태만 바꿈. **캐릭터의 실제 외형 이미지와 전투 그래픽은 바꾸지 않음**. 코어 테마 콘텐츠의 시각적 가치 창출은 이후 유료 콘텐츠 작업으로 분리.
- 테스트 초기화는 별도 확인을 두 번 눌러야 하며 `EVOLVE_DEV_MOCK_STORE_V1` 내 프로필만 리셋; 게임 저장 초기화는 아님.

## 변경된 파일 (M04 작업 브랜치)
- 소스: `web/mock-premium-v615.js` (40% 보존), `web/mock-premium-ui-v616.js` (50%).
- 검증된 신규 SHA256 게임 script asset 두 개:
  1. `dist/assets/d9db3b7dc93e39cccb5ad7f1ceb307cf44384dc80a99499cacba7044f9040f2b.js` (6,352B)
  2. `dist/assets/8fee1c1add722a5e9db8359fa997299454ec738a1b11a78d8466f6c7a8efbe56.js` (9,700B)
- `dist/index.html`: 두 해시 경로만 스크립트로 추가, 기존 맵/전투/내비/기타 스크립트 내용 변경 없음. 빌드 구분용 `EVOLVE_WEB_CONFIG` version/build 갱신.
- `dist/asset-manifest.json`: 두 신규 파일 SHA256·바이트 검증 엔트리 추가(기존 1,067 → 1,069). `dist/version.json`, `dist/verification.json`: 빌드/크기 일치하도록 갱신; 이전 엔진 source_sha256/이미지 bytes/개별 기존 애셋 모두 보존.
- `tests/monetization_m04_home_browser.cjs`, `.github/workflows/m04-home-qa.yml`: V614 실게임 쉘에서 모바일 에뮬레이션·모의 구매/장착/재진입/숨김·저장 보호 검사.
- `monetization/m04/mock-premium-shop.design.json`, `tests/monetization_m04_design.test.cjs`: '브랜치 연결 완료/공개 미배포' 상태에 맞춰 갱신.

## 실제 CI 증거
- 기능 브랜치 CI: https://github.com/idonutyou/EVOLVE/actions/runs/40520829120 **success**.
- `python3 tools/verify_site.py --dist dist` 원본 이미지 SHA 검증 등 완료. Node 22 설계+엔진 테스트 **26/26 성공**.
- Chrome 실제 V614 쉘 모바일 브라우저 자동 시험 **393×852** 통과. 기존 homeTabs 버튼 5개 유지. 모의 소형+중형 구매 합계 400 TEST 결정, 코어 외형 소유+모의 장착, 재로드 후 유지, 구 게임 DNA·스테이지 해금 유지, URL 플래그 제거 시 버튼 비노출 확인.
- 자동 모바일 시험 스크린샷: https://github.com/idonutyou/EVOLVE/actions/runs/40520829120/artifacts/12741811864 (GitHub Actions 보존 기간 적용).
- 초기 브라우저 테스트 1회는 게임 엔진의 그래픽 설정 `quality → auto` 자동 조정까지 모의 상점의 저장 훼손으로 오인해 실패함. 그 오탐을 수정하고 재실행해서 CI 통과한 상태. **실제 Galaxy S23+ 물리 기기/장시간 성능 검증은 하지 않음.**

## 사용자·수익화 안전
- **실제 결제 없음**: `checkout_enabled=false`, 원래 5종 판매용 SKU `draft_disabled`, 실결제 SDK / 사업자 / 카드 결제 / 서버 유료 원장 연계 없음.
- **아직 공개 게임 웹사이트 미배포**. M04 STEP 3/3 회귀 승인 전 기존 라이브 게임 유지. 작업 브랜치와 원격 복구에서만 이 UI를 검사했다.
- 마지막 50% 백업은 `backup/monetization-m04-050-20261027`를 HEAD에 생성하고 원격 ref + 파일 SHA 2회 대조 후 완료 판정.
- 현재 새로운 상품 자체의 재미/시각적 가치는 미완성. **다음 M04 60%**는 실제 게임 내 테스트 상품의 사용 가치/코어·기타 부위 장착 연계 및 기존 소유권 시스템과의 안전한 관계 정리. 새 **실제** 외형 아트가 필요한 작업은 시작 전에 이미지 렌더링 필요 여부를 안내하며 현 단계에서는 추가 렌더링 없음.
