# EVOLVE — M07 80% / STEP 3/3: 실제 게임 내 체험형 SHOP 연결 (2026-10-28)

- 사용자의 최신 우선순위: **실제 결제·외부 승인만 제외하고, 기존 게임에서 상품 수령/보유/외형 장착/시즌 활성화를 직접 체험**. 사용자 화면의 '모의 구매', 'TEST 상품' 표현은 사용하지 않는다. 대신 허위 카드 청구를 막기 위해 **'결제 연결 전 체험 중 · 금액 청구 없음'** 및 미확정 표시 가격을 분명히 고지한다.
- 현 단계 실제 구현: 기존 HOME **SHOP 단일 탭** 내부에 V621 카드형 스토어 UI를 연결한다. 새 DEV 상점/기타 HOME 탭 생성 없음. 상품 영역 추천/재화/외형/시즌/패키지; 첫 구매 결정 50개 보너스; 무료 일일 보급(결정 20); 변이 결정 묶음(100/300); 공명 코어 영구 획득 및 기존 V617 생체 전투 코어 장착; 유료 월간 패스(해당 월 1일~말일 KST), 보유 시 연구 단계 프리미엄 5종 결정 보상; 새 브라우저 저장 키로 새로고침 후 보존. 상품 카드 가격은 예시일 뿐 실제 청구 없음.
- 가상 재화·패스 데이터는 **브라우저 로컬 체험 지갑**이며 정식 게임 DNA/서버 원장·App Store/Google Play 영수증이 아니다. 실제 게임 내부에서 적용된 효과는 기존 V617 코어 장착 연동이고, 그 외 결정/연구 보상은 V621 별도 상점 체험 잔고에 저장된다. 실제 신뢰할 수 있는 플레이 완료/도감 이벤트는 아직 연동하지 않았다.
- 결제 버튼은 상품 확인 후 V621 로컬 장부에 즉시 지급, 영수증/외부 결제 SDK/돈 거래는 절대 사용하지 않는다. 브라우저 저장 손상 시 자동 초기화 금지.
- 유료 패스의 유효기간 **KST 매월 1일 00:00 ~ 해당 월 말일 23:59:59 (다음 달 1일 00:00 미포함)**. 무료 이벤트 28일은 별도 허용. 영구 획득 외형은 해당 월 만료 후에도 유지.
- V621 소스: `web/shop-experience-v621.js`, `web/shop-front-v621.js`, 동등한 `dist/*` 파일 및 `dist/index.html`. 기존 `web/native-shop-v620.js`·`web/mock-premium-v615.js`·전투/캐릭터/몬스터/1021개 이미지·세이브 변경하지 않음. 변경된 UI는 V620 화면을 대체 표시하지만 기존 코어 engine/브리지는 계속 사용.
- 2025/26 상위 모바일게임의 보편적 IAP 구성 참고: https://www.pocketgamer.biz/the-top-grossing-mobile-games-of-2025/ , https://mobilegamer.biz/2026s-top-10-grossing-mobile-games-so-far-honor-of-kings-whiteout-survival-lastwar-royal-match-pubg-mobile-more/ , https://resources-cdn.appfigures.com/industry-reports/appfigures-2025-mobile-game-trends-strategies-c.pdf , https://support.hoyoverse.com/hc/en-us/articles/50333903392153-How-does-the-First-Purchase-Bonus-work . 게임 고유 아트/상품명/시안 복제하지 않음.
- 실제 구동 검증: Node `tests/m07_080_shop_experience.test.cjs`; Playwright `tests/m07_080_shop_browser.cjs` 393×852, 320×568, 852×393에서 HOME 5개 탭, SHOP 5개 내부 범주, 구매/수령/재진입, 공명 코어 V617 장착, 월간 패스, 무료/유료 시즌 보상, 저장 손상 보호, 44px 클릭/가로 오버플로 검증. 추가로 `tests/home_hub_browser.cjs`를 V621 기준 업데이트.
- 정식 출시 전 차단 유지: 승인 가격, 구매 보호/환불/복원, 앱스토어 영수증·서버 계정 권한 검증, 실제 게임 전투 결과를 통한 미션 진척, 월말 구매자 가격·소급 보상 공정성, 이미지 코어/파츠 신규 제작. 신규 캐릭터/몬스터/전투 이미지 렌더링 없음. 상점 UI 배너 이미지는 이후 생성해도 되지만 이 단계는 CSS 장식만 사용.
- 사용자가 온라인 게임에서 확인할 주소: https://idonutyou.github.io/EVOLVE/ (배포 워크플로 성공 및 라이브 검증 이후). 보호 원본 main 백업: `backup/pre-m07-080-live-20261028`; V621 릴리스 백업: `backup/m07-080-live-shop-v621-20261028`. M07 전체 소스 `backup/monetization-m07-080-20261028`.
- 다음 `고` → **M07 90%, STEP 3/3**, 모바일 시각·동작 세부 보정과 시즌/상품 추가 체험, 원본 게임 UI/장부 충돌 검사. 이미지 렌더링 **전투/캐릭터/몬스터는 불필요, 상점 이미지 선택적으로 가능**.
