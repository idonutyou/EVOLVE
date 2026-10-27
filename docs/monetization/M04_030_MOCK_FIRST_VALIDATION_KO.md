# EVOLVE M04 — 모의 과금 우선으로 변경한 30% 기준점 (최신)

날짜: 2026-10-27 KST
**사용자 최종 결정**: Google Play·Apple App Store 게임으로 출시. 현재 GitHub Pages 웹은 개발/테스트용. **게임 내 과금 상품·콘텐츠·모의 구매 시스템을 먼저 만들고, 실제 플랫폼 결제는 게임 완성 후 M08에서 연결한다.**

## 이번 방향 교정의 구체적 완료 범위
- `docs/monetization/M04_MOCK_FIRST_PRIORITY_PIVOT_KO.md`: 상품/모의 구매→보상→장착·사용→모의 취소/복원→프리미엄 콘텐츠 순서, 신규 이미지 필요 시점, M08 앱스토어 결제 후순위.
- `monetization/m04/mock-premium-shop.design.json`: `MOCK_ONLY`, 신규 격리 저장 키 `EVOLVE_DEV_MOCK_STORE_V1`, 모의 거래 ID·테스트 크레딧·M01 후보 SKU 연계·실제 유료 잔고 미전환 계약.
- `monetization/m04/payment-flow.draft.json`: 최종 배포 대상 Android Google Play/iOS App Store, StoreKit/Billing SDK 개발 `M08`까지 보류. `checkout_enabled=false` 유지.
- `tests/monetization_m04_design.test.cjs`, `.github/workflows/m04-design-gate.yml`: 모의 거래와 실결제 분리 및 상품 후보/플랫폼 출시 방향 계약 검사.
- GitHub Actions `40514171284` 성공: Node.js 테스트 **12/12 통과, 실패 0**. https://github.com/idonutyou/EVOLVE/actions/runs/40514171284
- 이 검사는 **설계 계약 검증**이며 게임 내 모의 상점·아이템 콘텐츠 구현 또는 실제 Play/App Store 결제 연동 검증이 아니다.

## 다음 작업(사용자 '고')
**M04 STEP 2/3, 40% 구현 착수**:
1. GitHub 메인 게임 현황을 먼저 조사: 실제 상점 UI, 인벤토리·외형 슬롯, 프리미엄 결정 및 로컬 저장 연결점. 기존 `EVOLVE_V575_TEST_*` 저장 키 불변.
2. 별도 `MOCK_ONLY` 구매 adapter를 구현해 기존 게임에서 호출 가능한 상품 획득/장착/사용 진입점을 설계. 실제 서버 유료 원장·스토어 결제 SDK 호출/업그레이드 금지.
3. 실제 판매 가치가 있는 상품별 인게임 보상을 연결하기 전, 콘텐츠·에셋 존재 여부를 확인. 부족한 유료 외형의 신규 이미지 생성이 필요한 STEP에서는 **시작 전에 이미지 렌더링 필요 여부 안내**.
4. 10% 단위로 독립 원격 복구 브랜치 생성 및 2회 원격 비교; 공개 게임 파일 변경 필요 시 사전 안전/회귀 검사 후 업데이트. 작업/백업은 전체 완료 전 삭제 금지.

## 현재 미구현 사항
- 인게임 모의 구매/장착 인터랙션, 인게임 상품 콘텐츠, 실제 Native 앱 빌드 및 Google Play/StoreKit 실결제, 운영 인증/DB·정산·환불은 모두 미구현.
- 기존 `monetization/catalog/draft_skus.json`의 구매 후보 5개는 가격 null/`draft_disabled` 상태 유지. `M04_010`~`M04_030_DESIGN_HANDOFF` 구 문서의 웹 PG 우선 가정은 **폐기된 역사적 자료**.
