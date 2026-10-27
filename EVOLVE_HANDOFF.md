# EVOLVE 최신 인수인계 — M04 100% 완료 (2026-10-28 KST)

> **다음 사용자 `고`는 M05 STEP 1/3 10%부터 시작한다.** M04 60~100% 작업 반복 금지. 아래의 90%/70% 기록은 이전 이력임.

- 저장소: `idonutyou/EVOLVE`. 개발 웹: https://idonutyou.github.io/EVOLVE/
- 실제 공개 빌드: `9ab09b21eb95876b7977a0aaef34ac51c931c3565fcc8a9e45209812bdd290d6`, 리소스 1,078개/원본 이미지 1,021개.
- 라이브 모의 구매/취소·테스트 결정 +400→280·코어 2종 장착·재로드/복구·게임 저장 보존 자동 QA **success**: https://github.com/idonutyou/EVOLVE/actions/runs/40545030346
- 라이브 게임 엔진/원본 아트/이동 코드 바이트 검증 **success**: https://github.com/idonutyou/EVOLVE/actions/runs/40546116720
- 90% 원본 Pages 워크플로 https://github.com/idonutyou/EVOLVE/actions/runs/40541493132 는 배포 단계 성공/이후 이전 엔진 개수 가정 검사 실패. 후속 수정 후 별도 공개 실서버 2종 검증으로 해당 문제 해결.
- 개발 플래그 `?evolveMockShop=1`만 상점 표시. 일반 URL 무영향, 시즌 패스 잠금, 실가격/실결제/API 비활성.
- 실기기 Galaxy S23+ 장시간 성능·발열 테스트는 **하지 않음**.
- 최종 보고: `docs/monetization/M04_100_FINAL_REPORT_KO.md`.
- 100% 백업: `backup/monetization-m04-100-20261028`; `checkpoints/EVOLVE_M04_100_20261028.json`. 이전 모든 체크포인트 삭제 금지.
- 다음 M05 상점/인벤토리 UX. **첫 10% 디자인 분석은 이미지 렌더링 불필요**. 모든 단계를 3 STEP/10%씩 진행하고 매 체크포인트 원격 저장 및 두 번 검증한다.
- 최종 타깃 Google Play·Apple App Store. 실제 Billing/StoreKit 연결은 게임 완성 후 M08.

---

# 최신 인수인계: EVOLVE M04 90% (2026-10-28 KST)

**M04 STEP 3/3 90% 완료 → 다음 `고`는 M04 100% 라이브 배포 검증·최종 백업.** 이 퍼센트는 게임 전체 진행률이 아님.

- main 병합 `71f3549040e656324f766114503e6ba57a929eba`; Pages 실행 https://github.com/idonutyou/EVOLVE/actions/runs/40541493132 배포 성공.
- 공개 version.json 빌드 `9ab09b21eb95876b7977a0aaef34ac51c931c3565fcc8a9e45209812bdd290d6` 확인.
- 신규 이미지 불필요. 원본 이미지 1,021개, 기존 저장·무료 DNA 보존. 실제 결제/가격 없음.
- 90% 체크포인트 `backup/monetization-m04-090-20261028`; 70/80%와 배포 전 main 백업 유지.
- 다음 100%는 개발용 `?evolveMockShop=1`의 모의 구매/취소/장착/새로고침과 일반 URL 무영향 검증. 물리 휴대폰 별도.
- 상세 `docs/monetization/M04_090_DEPLOY_KO.md`. 아래는 이전 70% 인수인계 원본으로 이력 보존.

---

# EVOLVE — 새 채팅 인수인계

최신 확인: 2026-10-27 KST. 저장소 `idonutyou/EVOLVE`.
공개 게임: https://idonutyou.github.io/EVOLVE/

## 현재 재개 지점

**M04 STEP 2/3 · 70% 완료. 다음은 STEP 3/3 · 80~100%.**
이는 EVOLVE 전체 완성도가 아닌 M04의 진행률이다. M01/M02/M03 내부 개발 트랙은 100%이며 실제 판매나 운영 계정 서비스가 출시된 것은 아니다.

- 작업 브랜치: `monetization-m04-payment-20261027`.
- 검증된 기능 코드: `01d606cdd068dda52a98dfa82457cad120e0ff4d`.
- 최종 모바일 CI: https://github.com/idonutyou/EVOLVE/actions/runs/40527650445 **success**.
- 복구: `backup/monetization-m04-070-20261027`, `checkpoints/EVOLVE_M04_070_20261027.zip`. 커밋 SHA와 ZIP 실측 크기/해시는 원격 ref 및 동명의 JSON에서 확인한다. 브랜치/아카이브를 생성하고 2회 원격 검증한 다음에만 완료 보고한다.
- 직전 60%: `backup/monetization-m04-060-20261027` @ `4a0fd221787700b9a423d116dfd8a60eb01e7648`. ZIP 749,275B, SHA256 `2c12f2fcf8c941985b97758d9e13cccdb0d13d48e5f3f9be1def9efece525235`. 원격 2회 대조·압축 멤버 재검사 완료.
- 작업 폴더: `/workspace/scratch/ea9960933ffc/EVOLVE_REPO`. 새 세션에서는 이 폴더 존재 여부보다 원격 커밋/파일을 우선한다.

## 실제 구현·검증한 것

- 개발용 `?evolveMockShop=1` + 허용 호스트에서만 모의 상점/API/코어 효과 활성화. 일반 URL에서는 진입점과 adapter 없음.
- 모의 상품 5종 유지. 스타터 +75(1회), 소형 +100/중형 +300 TEST 결정, 공명 코어 소유권, 보상 미완성 시즌 패스 잠금.
- 코어 발광 2종: 공명 코어를 모의 구매하고, 심홍 코어는 TEST 결정 120개로 해금. 실제 캐릭터 미리보기·파츠 화면·전투에 발광 표시, 장착/해제·재실행 복원 지원.
- 모의 구매 확인/취소, 저장 실패 시 미지급, 중복 지급/차감 방지, 잘못된 저장 데이터 보존 및 지급 차단, 정상 저장 복구 시 재표시, 2회 확인 테스트 초기화.
- Node 22 **34/34**, 리소스 **1,078개**/원본 이미지 **1,021개** 검증. 실제 V614 게임 쉘 모바일 **393×852, 320×568 자동 시험** 통과. 코어 교체 전후 파츠·능력치, DNA·스테이지 해금 보존. 한글 웹폰트 및 화면 스크린샷 검토.
- 발광 캐시 192×192 2장, 294,912B. 10,000회 단위 검사에서 재생성 2회, 실제 브라우저 전투에서도 2회. 물리 Galaxy S23+ FPS/발열·장시간 성능은 미검증.
- 기존 엔진에 구획된 시각 코드만 추가. 해당 구획 제거 시 V614 기준 엔진 바이트 일치. 원본 이미지 재생성·재인코딩 없음. 코어는 별도 발광 효과이며 M06 정식 신규 프리미엄 아트 완성은 아니다.

## 아직 하지 않은 것 / 다음 지시

**M04 기능은 main/공개 Pages에 미병합·미배포.** main에는 최신 인수인계 문서만 갱신한다.
사용자가 `고`/`이어서 진행해`라고 하면 **M04 80%**부터 시작한다. 60/70% 작업을 반복하지 않는다.

STEP 3/3: 80% 전체 회귀·배포 게이트 → 90% 안전한 main 통합·개발용 Pages 반영 → 100% 실제 배포 URL/버전/모의 구매·저장 재검증과 인수인계. 10%마다 원격 복구와 두 번 확인을 유지한다. 새 이미지 생성은 필요 없다. 실제 스토어 결제는 이 단계에 연결하지 않는다.

## 고정 사용자 원칙

- 최종 출시 Google Play·Apple App Store, 현재 웹은 개발용. 과금할 만한 콘텐츠/모의 구매 우선. 실제 Billing/StoreKit·운영 영수증/원장은 게임 완성 후 M08에서 연결.
- `EVOLVE_DEV_MOCK_STORE_V1`만 모의 저장. `EVOLVE_V575_TEST_*`, 무료 DNA, M03 유료 원장과 혼합/승격 금지. 판매용 카탈로그는 `draft_disabled`, 가격 null, `checkout_enabled=false` 유지.
- 단계는 3 STEP으로 분리: 설계 10~30%, 구현/검증 40~70%, 회귀/배포 80~100%. 현재 하위 STEP 종료 후 다음 사용자 지시를 기다린다.
- 10%마다 원격 ref+파일/압축 체크섬 두 번 대조 후 진행 보고. 과거 백업은 삭제·강제 갱신하지 않는다.
- 단계 시작 전 이미지 생성 필요 여부, 종료 시 다음 단계와 필요 여부 안내. 검증 전 main 배포 금지, 자동 새로고침 금지.
- 새 세션: `AGENTS.md`, 이 파일, `EVOLVE_PROGRESS.md`, `EVOLVE_ROADMAP.md`, 실제 브랜치/소스/최근 QA를 읽고 최신성 확인. 구 기록은 각 백업과 Git 이력에 보존되어 있다.

상세: `docs/monetization/M04_070_QA_HANDOFF_KO.md`, `docs/monetization/M04_070_QA_EVIDENCE.json`.
