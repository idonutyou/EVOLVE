# EVOLVE M09 — 100% 수익화 체험 기능 완료 및 공개 배포 검증
완료일(KST): 2026-10-29
공개 URL: https://idonutyou.github.io/EVOLVE/
메인 소스: main /dist/
실제 Pages 공개 브랜치: pages-fast-evolve-20261029 /(root)
최신 Pages 커밋: 735aa52278b721e1778fa0bd4a04b0765c9ab82d
공개 Pages 트리: 313b80d3bb6ea4763f2005345382fa2e1fd06c2a
기존 공개 HEAD 복구 백업: backup/pages-before-m09-100-20261029 (97f75bd95e125f44efe030063d7ef37647f1e3de)

## 이번 M09 구현 결과(실제 공개됨)
1. 기존 상점 6 SKU와 결제 없는 브라우저 체험 지갑을 보존한다.
2. 연구실 명패(180결정) 비전투 외형 1종의 영구 해금, HOME PARTS 장착/해제, 로컬 저장 및 중복 차감 방지.
3. 첫 진화 패키지 기본 160결정, 초회 +50결정, 첫 실험 기록 영구 프로필 배지. 기존 구매자는 기존 결정 잔액·영수증을 수정하지 않고 배지 자동 획득.
4. 달력 월간 연구 패스 누적 출석 1·3·7·14·21일: 각 35결정, 21일 완주 월간 연구자 영구 프로필 휘장; 구매 전 해당 달 출석 소급, 월말 21일 달성 불가능한 신규 구매 차단.
5. 개발 파라미터 (?evolveQA=1) 에서만 브라우저 로컬 퍼널 카운터. 개인정보 수집·실서비스 매출 계측/카드 청구 없음.
6. 320×568/393×852/852×393 크기 SHOP UI 크기·오버플로 처리. 게임 렌더러·맵·캐릭터/무기 에셋 미변경.
7. 신규 도감 프레임(360)과 연구실 테마(720)는 최초 명패 수익화의 후속 확장안으로 설계 보존; 이번 M09에는 미구현. 실제 운영 매출 기능은 향후 계정·서버 권위 원장/PG 영수증/환불·복원 통합 필요.

## 최종 게이트 확인
- GitHub Actions `EVOLVE M09 final shop release gate`, run 40807895773, SUCCESS.
- Node 이전 M07/M08 경제·저장 계약 + M09 회귀, 버전/웹-배포 파일 미러, 실제 Chrome/Playwright 경량 뷰포트 3개 PASS.
- 배포 전 Git 트리 비교: 15개 최상위 dist 항목 중 **4개 변경**(index.html, version.json, shop-experience-v621.js, shop-front-v621.js). 나머지 11개 Git 객체 일치, assets/ 엔트리 재사용.
- 공개 브랜치 업데이트는 기존 Pages HEAD를 부모로 갖는 Git commit 생성 + 기대 SHA 기반 non-force 갱신. 현재 Pages root tree = main:dist tree.
- GitHub Pages 네이티브 빌드/배포 run 40807993524, SUCCESS.
- 외부 공개 HTTP에서 버전 JSON이 **-M09-100**을 응답했고, 체험 상점 엔진은 starter 160결정을 응답, SHOP 프런트에 명패·starter 프로필 배지·월간 휘장 코드 확인.
- 공개 후 전체 게임 실기기 플레이 여부는 확인하지 않음. 기존 경량 브라우저 검사와 GitHub Pages 실제 공개 파일 검증 기준 충족. Android 실기기 테스트와 운영 결제는 별도 과제다.

## 복구 및 다음 단계
- M09 10~90% 복구 브랜치 보존, M09 100% 백업: backup/monetization-m09-100-20261029.
- 공개 버전 원상복원 시 backup/pages-before-m09-100-20261029 사용. 공개 branch를 강제 재설정하지 않고 별도 Git 객체 커밋으로 되돌릴 것.
- M10부터 사용자 요청 진행 단위는 30%/30%/30%/10%, 각 중간 10%별 GitHub 원격 복구 백업.
- 유료 결제는 현재 로컬 체험 전용이다. 실제 비용 청구나 매출 발생으로 오인하지 말 것.
