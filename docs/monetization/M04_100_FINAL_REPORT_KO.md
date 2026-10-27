# EVOLVE M04 — 100% 최종 보고 (2026-10-28 KST)

## 완료 범위
- 단계: **M04 과금 콘텐츠 및 개발용 모의 구매**, STEP 3/3 **100% 완료**. EVOLVE 게임 전체 완성도는 아님.
- 공개 개발 웹: https://idonutyou.github.io/EVOLVE/
- 모의 상점 검증 URL: https://idonutyou.github.io/EVOLVE/?evolveMockShop=1
- 코드 통합: main 커밋 `71f3549040e656324f766114503e6ba57a929eba`.
- 배포된 웹 버전: `V575-STEP07-MONSTER-FEEDBACK-V614-M04-MOCK70`.
- 배포된 빌드 지문: `9ab09b21eb95876b7977a0aaef34ac51c931c3565fcc8a9e45209812bdd290d6`.
- 변경 없는 원본 이미지 1,021개 및 리소스 1,078개.

## 실서버 통합 QA: 성공
- https://github.com/idonutyou/EVOLVE/actions/runs/40545030346 — **success**.
- GitHub Pages **실제 주소**에 Chrome 모바일 에뮬레이션(393×852 및 320×568)으로 접속해 다음을 테스트:
  1. 일반 URL의 모의 상점/API 미노출, 원래 5개 홈 메뉴 유지.
  2. 소형+100, 중형+300 모의 획득, 총 400개 테스트 결정.
  3. 공명 코어 구매/장착, 심홍 코어 해금 전 취소 시 저장 바이트 불변.
  4. 확인 후 테스트 결정 120개 차감(잔고 280), 두 코어 외형 구별.
  5. 구매·장착/해제 및 새로고침 후 소유·잔고·장착 복원.
  6. 저장 공간 실패 시 모의 지급 없음, 잘못된 모의 세이브 바이트 보존 및 지급 차단, 정상 복원 성공.
  7. 기존 DNA·스테이지·파츠·전투 수치 변경 없음, 실제 전투 코어 발광 6회, 발광 캐시 생성 2회.
  8. 테스트 데이터 2회 확인 초기화 후 기존 게임 저장값 보존.
- 증거 스크린샷 Actions 아티팩트 ID `12752527244`, 749,258B, SHA256 `a61d9bccde93b70b395d50a9566ac6d508b9f8854653bae1d85cc843df40cbd1`.

## 실서버 엔진/아트 검증: 성공
- https://github.com/idonutyou/EVOLVE/actions/runs/40546116720 — **success**.
- 공개 version.json·asset-manifest.json의 로컬 기준과 바이트 일치, 현재 엔진과 원본 아트 SHA256 일치, 캐릭터/무기/맵/이동 시스템 코드 및 원본 시각 요소 검증 성공.
- 90% 원래 Pages 워크플로 https://github.com/idonutyou/EVOLVE/actions/runs/40541493132 는 **배포 단계는 성공**, 이후 옛 검증기에서 엔진 파일이 1개뿐이라는 가정 때문에 전체 워크플로 결론이 failure였음. 버전이 올라가면서 여러 과거 엔진이 보존되는 구조를 고려해 `tools/verify_published_lettering_v584.py`와 `tools/verify_movement_field_v590.py`를 수정했고, 별도 공개 실서버 검증이 둘 다 성공함. 기존 아트나 게임 엔진 자체를 손대지 않았음.
- 자동 검사 성공과 실제 물리 단말 시험은 다르다. **Galaxy S23+ 장시간 FPS/발열·안정성 실기기 시험은 미진행**.

## 과금 및 안전 범위
- `?evolveMockShop=1` 개발 플래그와 허용 호스트에서만 모의 상점 활성. 일반 URL에는 기능 없음.
- 판매 초안 SKU 5개 상태 `draft_disabled`, 가격 null, `checkout_enabled=false`; 게임 내 실재화는 '테스트 결정'이며 실제 결제/유료 권리가 아님.
- 모의 테스트 전용 `EVOLVE_DEV_MOCK_STORE_V1`만 저장하고 원래 게임 `EVOLVE_V575_TEST_*`/무료 DNA와 M03 운영 권리 분리.
- 시즌 패스는 미완성이라 판매 잠금 유지. 공명·심홍 코어는 기존 이미지 위 발광 효과이므로 정식 신규 프리미엄 아트 제작(M06)은 아님.
- Play Billing / Apple StoreKit 2 실결제는 게임 완성 후 M08.

## 원격 복구 및 다음
- 100% 복구 브랜치: `backup/monetization-m04-100-20261028`, 복구 메타데이터 `checkpoints/EVOLVE_M04_100_20261028.json`.
- 10~90% 백업 및 배포 전 main 백업 `backup/m04-main-predeploy-20261028` 유지. 모든 백업은 명시적 사용자 승인 없이는 삭제하지 않는다.
- **다음 M05 STEP 1/3 · 10%**: 본게임 상점/인벤토리 사용성·모의 상품 UX 정의. 첫 10%는 새 이미지 렌더링 **불필요**. 각 10%마다 저장·두 번 확인·진행 보고.
