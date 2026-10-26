# STEP 04 — 공통 타격 이벤트 기준 점검 (10%)
2026-10-26 Asia/Seoul
기준 main: 0e4d79f4e17107235dbafb945c3bab5be2a15048
기준 게임: V575-WEB-43-DISPLAY-RECOVERY
단계 목적: 실제 피해 계산, 넉백, 충돌 판정 보존하면서 단일 read-only hit event 제공.
현황: 조사 완료 / 구현 전
확인한 공격 경로: player-combat-v587(팔 찌르기), arm-items-v589(쌍포/쌍날), organ-skills-v598(가시/채찍/침), lightning-v576(현재 비활성), 코어 hurtEnemy와 보스 보호/데미지 중계.
원칙: 저장키, 스테이지, VFX, 이미지, 몬스터 AI, 체력 산식 수정 금지. 치명타 상태의 신뢰가능한 출처 없이는 null 기록; 확정되지 않은 치명타 임의 추론 금지.
실기 Galaxy S23+ 검증: 미수행.
다음: 경량 후처리 이벤트 브리지 설계와 독립 테스트.
