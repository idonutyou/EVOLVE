#!/usr/bin/env python3
"""Stamp 100% ONLY after public Pages deploy and actual web QA have both passed."""
import os,json
from pathlib import Path
R=Path(__file__).resolve().parents[1]
pages=int(os.environ["M05_PAGES_RUN_ID"])
live=int(os.environ["M05_LIVE_RUN_ID"])
report=R/"docs/monetization/M05_100_LIVE_FINAL_QA_KO.md"
s=report.read_text()
assert "[최종 성공 run ID로 확정]" in s and "[성공 run ID와 결론 확인 후 확정]" in s
s=s.replace("[최종 성공 run ID로 확정]",f"#{pages} success")
s=s.replace("[성공 run ID와 결론 확인 후 확정]",f"#{live} success")
s=s.replace("## 범위와 성공 조건",f"## 최종 결과: 공개 배포 및 실 사이트 모바일 QA 성공\n\n- 공개 배포: https://github.com/idonutyou/EVOLVE/actions/runs/{pages} (success).\n- 실제 Pages URL에서 모바일/모의 구매/게임 저장: https://github.com/idonutyou/EVOLVE/actions/runs/{live} (success).\n- 운영 결제/가격 비활성, 원본 이미지 1,021개 보존. 물리 Galaxy S23+ 직접 검사는 아직 미실시.\n\n## 범위와 성공 조건")
report.write_text(s)
prefixes={
"EVOLVE_PROGRESS.md":f"""# EVOLVE M05 STEP 3/3 · 100% 최종 완료 (2026-10-28 KST)

- M05 개발용 상점 UX 100% 완료. 게임 전체 완성도나 실제 결제 도입 100%라는 의미가 아님.
- GitHub Pages 배포 #{pages} success: https://github.com/idonutyou/EVOLVE/actions/runs/{pages}.
- 실제 공개 URL에서 모바일 393×852 / 320×568, DEV 모의 코어 구매/장착/컬렉션, 홈 메뉴·터치, 원래 세이브 및 M03 원장 보호, 기본 URL DEV 숨김 검사 #{live} success: https://github.com/idonutyou/EVOLVE/actions/runs/{live}.
- 원본 이미지 1,021개, 리소스 1,083개 유지. 기존 M04 DEV 9개 + 새 M05 DEV 5개만 허용하도록 V614 배포 게이트 보수.
- 운영 결제·가격·서버 권리 지급 OFF. 실결제는 완성 게임 M08 단계. 물리 Galaxy S23+ 장시간 시험 미실시.
- 복구: 이전 M05 10~90% 전부 보존, 최종 backup/monetization-m05-100-20261028 와 checkpoints/EVOLVE_M05_100_20261028.zip/JSON SHA256 CRC 원격 검증.
- 다음 고: M06 10% 유료 구매 가치가 충분한 프리미엄 외형/코어/생체무장 패키지 설계. M06 10% 신규 이미지 렌더링 불필요, 실제 프리미엄 아트 제작 단계는 이미지 필요.

---

""",
"EVOLVE_HANDOFF.md":f"""# EVOLVE 최종 인수인계 — M05 100% 완료 (2026-10-28 KST)

- 다음 고는 M06 10% STEP 1/3. M05 10~100%를 다시 반복하지 않는다. 모든 작업의 최우선순위는 매출을 만들 수 있는 실제 구매 가치 콘텐츠.
- GitHub Pages https://idonutyou.github.io/EVOLVE/ ; 브랜치 main; 배포 버전 V575-STEP07-MONSTER-FEEDBACK-V614-M04-MOCK70-M05-UX90; 빌드 b985a41a63ea8c9f4e9b6c773dbc7cbcb7b579855a907bdfb693e7e53463d60b.
- Pages 배포 #{pages} success https://github.com/idonutyou/EVOLVE/actions/runs/{pages}, 공개 실 URL 모바일 Chrome QA #{live} success https://github.com/idonutyou/EVOLVE/actions/runs/{live}.
- M05: 10~30 정보/상품 UX 설계, 40 상점 상세, 50 코어 소유/장착, 60 손상/중복/닫기 안전, 70 모바일 접근성, 80 전체 게임 byte 감사, 90 DEV 터치 충돌 해결/메인 병합, 100 Pages 공개·실 URL QA.
- 주요 보존: 기존 게임 홈 5탭, 전투/파츠·맵·세이브·M03 장부, 기존 이미지 1,021개. 기존 자산 1,078개에 새 M05 개발 스크립트 5개만 추가하여 1,083개.
- 100% 배포 첫 실패는 낡은 V614 검증기의 허용 자산수 1,067/1,078, 두 번째는 기존 M04 DEV 9개를 제외한 추가 5개만 계산한 가정 때문. 지금은 총 DEV 14개, 이미지 1,021개를 정확히 검증한다.
- 정식 상품 가격 null, checkout_enabled=false, client_grants_enabled=false, 실제 Google Play/Apple Billing 및 영수증 검증 미구현. 게임 완성 후 M08에서 연결.
- 최종 전체 트리 복구 backup/monetization-m05-100-20261028; 90% 기준 ZIP checkpoints/EVOLVE_M05_100_20261028.zip 과 SHA256/CRC JSON. 10~90% 복구 절대 삭제 금지.
- 상세 최종 보고 docs/monetization/M05_100_LIVE_FINAL_QA_KO.md. 실제 물리 Galaxy S23+ 발열·프레임·장시간 시험은 미실시.
- M06 10% 이미지 렌더링 불필요; 향후 새 프리미엄 스킨 실 제작에는 렌더링 필요 가능성이 크므로 각 10% 이전에 알릴 것.
- 이전 인수인계는 아래 기록 그대로 유지.

---

""",
"EVOLVE_ROADMAP.md":f"""# EVOLVE M05 100% 완료 / 다음 M06 10% (2026-10-28 KST)

- M05 STEP 1/3 10~30% 설계 완료, STEP 2/3 40~70% 실제 모의 상점 구현 완료, STEP 3/3 80~100% 원본 게임 회귀/Pages 배포 및 실제 온라인 QA 완료.
- GitHub Pages #{pages} success, 실제 온라인 393/320 모바일 구매·장착·저장 #{live} success. 원본 1,021개 이미지, 5개 홈 메뉴 및 게임 저장 보전. 실결제는 M08까지 OFF.
- 다음 M06 10% STEP 1/3: 구매할 이유가 명확한 프리미엄 생체 파츠·코어 발광·테마 패키지 가치/희소성/구성/교체 슬롯 설계. 10% 디자인 설계는 신규 이미지 렌더링 불필요. 이후 실물 코스메틱 이미지 제작 단계 이미지 필요.
- M05 최종 복구 브랜치 backup/monetization-m05-100-20261028, ZIP/JSON 원격 SHA/CRC; 이전 10~90% 백업 보존.

---

"""}
for file,prefix in prefixes.items():
 f=R/file
 body=f.read_text()
 if body.startswith("# EVOLVE M05 STEP 3/3 · 100%") or body.startswith("# EVOLVE 최종 인수인계 — M05 100%") or body.startswith("# EVOLVE M05 100% 완료 / 다음 M06 10%"):
  raise RuntimeError("Already marked 100%; refusing duplicate")
 f.write_text(prefix+body)
print(json.dumps({"finalized":True,"pages_run":pages,"live_run":live,"changed":list(prefixes)}))
