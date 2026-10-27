# EVOLVE M04 — 10% 결제 채널·PG 공식 문서 감사

검토일: 2026-10-27 KST | M04 STEP 1/3 (10%) | **공식 정책 조사/설계만 수행**
이미지 렌더링: 불필요. 외부 판매자 계정 연결·요금·상품 판매·비밀키 등록·코드 배포 없음.

## GitHub 기준
- 시작 main SHA: `7bd4312e757a2227f5e2fe0e3bd6c5ba40d3fcb1`.
- M03 100% 결제 비활성 원장 프로토타입 PR #7 병합·개발용 테스트 통과. **라이브 인증, 구매 검증, 운영 판매 없음**.
- `monetization/catalog/draft_skus.json`: 5개 상품 전부 `draft_disabled`, `price_minor`/결정 수량/권리 ID null, 판매/클라이언트 지급/가맹점/실원장 플래그 모두 false. 이 상태 변경 금지.
- 정적 공개 게임은 GitHub Pages. 브라우저에 비밀키·서버 원장 권한을 넣을 수 없으므로 별도 HTTPS 서비스 필수.

## 판매 경로 비교 (제안이며 출시 확정 아님)

| 판매 경로 | 사용할 결제 경로 | M04 적합성·제약 |
|---|---|---|
| **독립 웹 / PWA** (현 GitHub Pages) | 한국 PG의 브라우저 SDK + **별도 서버에서 결제 확정·조회** | **웹 선행 검토**: 현재 서비스/배포 유지, API 상품 검증 설계 가능. 사업자·PG 심사·서버 인증·운영비 미확정. |
| Google Play 배포 Android 게임 | 원칙적으로 Google Play Billing. 한국 게임용 대체 결제는 별도 등록/API·신고·수수료 규칙 검토 | **웹 PG를 앱 내 직접 붙여 우회하지 않음**. 한국의 대체결제 허용도 Play Console 등록·API·신고 요건을 면제하지 않음. |
| APK 독립 배포(Play 외부) | 배포 채널/계약에 맞는 웹 PG | 스토어 정책은 유통 경로별로 별도 검증. 설치·업데이트/환불/사용자 지원 책임 증가. |

### 공식 정책 근거
- Google Play의 디지털 아이템(게임 캐릭터, 가상 화폐 등)은 일반적으로 Google Play Billing 대상: https://support.google.com/googleplay/android-developer/answer/9858738?hl=en
- 한국 Google Play 대체결제는 **게임 포함** 별도 정책 프로그램. Play Billing과의 병행/설정, 대체결제 API, 거래 보고 등의 조건은 공식 조건을 따라야 함. 외부 웹결제 링크도 무조건 자유롭게 우회할 수 있는 것은 아님: https://support.google.com/googleplay/android-developer/answer/11222040?hl=en
- 일반 user-choice pilot의 'non-gaming' 설명과 **한국 게임 정책을 혼동하지 말 것**. 출시 직전 적용 채널/국가/시점별 확인 필수.

## 웹 PG 후보 비교 (실계약·비용 확정 아님)

| 후보 | 공식 확인 내용 | EVOLVE 판단 |
|---|---|---|
| **토스페이먼츠 직접** | 결제위젯/결제창, 서버 시크릿으로 `POST /v1/payments/confirm`; `paymentKey/orderId/amount` 제출하고 서버의 내부 주문 금액/계정과 승인 Payment 상태 `DONE` 대조. webhook 결제상태 변경/취소/가상계좌 이벤트. | **기본 검토 후보**: 단일 KRW 웹 PG에 단순. 판매자 계약/수수료/심사·지원수단 미확정. |
| **포트원 V2** | 브라우저 SDK로 요청 후 **서버에서 결제 단건 조회**해 `PAID`와 주문 금액 대조. 다중 PG 채널 추상화 가능. | **대안**: 여러 PG 전환/확장에 유리할 수 있음. 별도 PortOne/PG 계약, 비용·구현 복잡도 확인 필요. |
| **Google Play Billing** | Play 내 디지털 소비재/비소비재·구독 등 판매용. 서버 검증/구매 토큰/환불 수명주기 필요. | 향후 Play 버전에서는 별도 결제 adapter 필수; 웹 PG 결제 완료를 Play 인앱 구매 증빙으로 취급 금지. |

### 공식 개발 문서
- Toss 결제 승인·조회 API/상태: https://docs.tosspayments.com/reference
- Toss 결제위젯 서버 승인·키 관리: https://docs.tosspayments.com/guides/v2/payment-widget/integration
- Toss 테스트키는 실제 결제 아님: https://docs.tosspayments.com/resources/glossary/dev-center
- Toss 웹훅 재전송과 이벤트 구분: https://docs.tosspayments.com/guides/v2/webhook
- **Toss 일반 PAYMENT_STATUS_CHANGED에 무조건 HMAC 서명이 있다고 가정 금지**. 공식 문서상 이벤트 종류마다 증명 방식이 다름. 일반 결제 웹훅은 결제 조회 API로 서버 재검증; 가상계좌 `DEPOSIT_CALLBACK`은 해당 주문 발급 시 받은 secret 비교 등 이벤트 별 처리: https://docs.tosspayments.com/reference/using-api/webhook-events
- PortOne V2 서버 결제 검증: https://developers.portone.io/opi/ko/integration/start/v2/checkout
- PortOne V2 다중 PG 후보: https://developers.portone.io/opi/ko/integration/start/v2/readme?v=v2

## M04 경계·미해결 결정
- 어떤 공급사든 **브라우저의 success URL/paymentKey/price/paid=true를 그대로 믿고 크레딧 지급 금지**. 계정 신원·내부 주문(상품/가격/통화/수량), 공급자 거래/상태, 중복 거래·환불·취소를 서버 트랜잭션으로 검증해야 한다.
- `WAITING_FOR_DEPOSIT`은 **결제 완료 아님**. 가상계좌 입금이 최종 확인될 때만 `DONE` 재조회 검증 후 지급. 이중 웹훅·재전송·순서 역전 처리 필요.
- 현재 M01 카탈로그 가격과 콘텐츠 미확정. M02 시뮬레이션 가격은 **판매 가격 아님**.
- 사용자 운영 계정이 필요한 일: PG/사업자 신청 및 심사, 운영 서버/DB/인증 공급자 연결, 서류·수수료·상품/지역·환불 정책 확정. 이 문서 작성 중 개설·가입·요금 발생 **0건**.
- 다음 20%: 공급자와 무관한 주문/결제 상태 기계·조회/금액/통화/판매자·계정 검증 불변식. 다음 30%: 결정 게이트·테스트 계획·M04 STEP 2/3 구현 인수인계.
