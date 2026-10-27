# EVOLVE V620 — 기본 SHOP 통합 / DEV 팝업 완전 제거
날짜: 2026-10-28 KST

## 사용자의 새 확정 우선순위
기존 홈 화면 5탭의 **SHOP 하나만** 사용한다. 별도의 DEV 상점 버튼/모달/전용 진입 URL은 제거한다. 현재 SHOP의 기존 DNA 강화 카드들은 사용하지 않으므로 **상점 화면에서 숨기되 기존 세이브/전투 엔진의 DOM 참조는 안전하게 유지**한다.

## 실제 통합 변경
- 소스 `web/native-shop-v620.js` 신규: 일반 URL을 열고 홈 화면의 **SHOP** 탭만 누르면 TEST 상품 5종과 코어 컬렉션 2종, 테스트 결정 잔고, 확인/취소가 모두 **기존 SHOP 페이지 안에** 나타난다.
- 무료 테스트 획득: 첫 변이 지원/결정 +100/+300/공명 코어 획득. 코어 장착/해제, 심홍 코어 120 TEST 결정 소모. 상품 1회 획득/중복 억제, 부족 재화 안내, 취소 저장 바이트 불변, 손상 저장/쓰기 실패 시 안전 차단.
- **실제 돈 결제 절대 없음**: `MOCK_ONLY`, 가격 null, `checkout_enabled=false`, `client_grants_enabled=false`, 테스트 저장 `EVOLVE_DEV_MOCK_STORE_V1`만 사용. M03 유료 원장/기존 게임 저장 `EVOLVE_V575_TEST_*`·DNA 변경 없음.
- `web/mock-premium-v615.js`와 `web/mock-core-visuals-v617.js`의 브라우저 전역 접근 허용을 일반 게임 URL로 넓혔다. 이 API는 **테스트 전용**으로 유지, 실결제나 운영 권리 지급 기능 없음.
- `web/mock-premium-ui-v616.js` 및 `web/m05-shop-ui-v618.js` **소스 삭제**. `.github/workflows/m05-100-live-final.yml` 및 `m05-100-checkpoint.yml` 자동 DEV 팝업 검증도 제거. Git 이전 커밋과 M05 10~100% 복구 브랜치에서는 전체 역사 복원 가능.
- `tools/build_native_shop_v620.py` 실행으로 공개 배포 `dist/index.html`에서 DEV 상점 4개 스크립트 태그를 완전히 제거하고, 기존 쓸모없는 DEV 스크립트 **14개 해시 파일을 디스크와 manifest에서 삭제**. 기본 SHOP TEST 엔진·코어 이펙트·SHOP UI **3개 스크립트만** 새 해시로 로드. 총 리소스 1,083→**1,072**, 이미지 **1,021개 전부 원본 유지**.
- 원래 게임 기능을 깨지 않도록 옛 `#labPanel` DNA 강화 UI는 `#nativeShopLegacyResearchV620` 숨겨진 보관 컨테이너로 옮김. SHOP에서는 표시되지 않고 클릭할 수 없으며, 기존 세이브와 게임 루틴이 참조하는 DOM은 유지.
- 일반 실행에 쿼리 파라미터 `?evolveMockShop=1&evolveM05UX=1`가 **더 이상 필요 없음**. 설치된 Android 웹앱에서 일반 홈→SHOP으로 직접 진입.

## 검증 및 출시 조건
- 검증된 개발 브랜치 원본 `feature/native-shop-unification-20261028`, 초기 정식 브라우저 성공: https://github.com/idonutyou/EVOLVE/actions/runs/40588368786.
- 실제 Chromium **393×852 / 320×568 / 가로 852×393**에서 기본 SHOP 노출, 상품 5개/코어 2개, 44px 버튼, 공명 획득→장착, 결정 100+300→심홍 120 소모→280 잔고, 저장 분리, 손상 기록 무삭제, 별도 DEV 모달/버튼 미존재 성공. 기존 홈/파츠/전투 브라우저 회귀도 성공.
- 최종 정적 릴리스 검사 `tools/verify_native_shop_v620.py`: 이전 M05 100% baseline 자산 1,069개 바이트 SHA/이미지 1,021개 비교, DEV 14개 삭제와 신규 3개 확인, 실제 checkout 금지, 기존 SW 바이트 동일.
- `main`에 병합 전 최종 Python/Node·정적 게이트 성공이 필요. `main` 배포 후 실제 Pages URL 버전과 기본 SHOP 상품/장착/저장 QA 성공까지 확인하고 완료로 기록.
- **신규 이미지 렌더링 불필요**. 물리 Galaxy S23+ 발열·FPS 장시간 시험은 실제 수행하지 않았음.

## 복구 및 다음
- 업데이트 전 M05 100% 기준 커밋 `4bceade598f3caad3235d0b41e508b1e33c33768` 와 별도 `backup/monetization-m05-100-20261028` / 과거 10~90% 백업을 유지. 新 SHOP 복구 `backup/native-shop-v620-20261028` (Git full tree), `checkpoints/EVOLVE_NATIVE_SHOP_V620_20261028.zip`/JSON (이전 baseline에 적용할 증분, CRC+SHA).
- 이 수정은 **M06 10% 제작 진행으로 계산하지 않는다.** 중단 중인 M06 10% 프리미엄 판매 가치 기획은 기본 SHOP 공개 적용 이후 재개한다. **M06 10% 설계 단계 이미지 렌더링 불필요**, 실제 유료용 파츠·코어 신규 아트 제작 단계에서는 사전 안내 필요.
