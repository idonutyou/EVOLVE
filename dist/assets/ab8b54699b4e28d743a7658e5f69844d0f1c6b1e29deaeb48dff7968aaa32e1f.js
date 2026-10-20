
/* EVOLVE EN/KO language extension v3.6. Reusable in other standalone EVOLVE HTML versions.
 * Add this script after the game's main script, before </body>.
 * English is the default; Korean is opt-in and saved independently of game progress.
 * All original game systems, sprites, gameplay values and save data remain unchanged.
 */
(function EVOLVEI18N() {
'use strict';
if (window.EVOLVE_I18N && window.EVOLVE_I18N.installed) return;
const STORAGE_KEY = 'EVOLVE_V575_TEST_UI_LANGUAGE_V1';
const ROOT = document.getElementById('app') || document.body;
const DISALLOWED = 'script,style,noscript,svg,textarea,code,pre,[data-i18n-ignore]';
const PAIRS = String.raw`
SETTINGS|설정
FEEDBACK · ACCESSIBILITY · GRAPHICS · LOCAL SAVE|피드백 · 접근성 · 그래픽 · 로컬 저장
COMBAT FEEDBACK|전투 피드백
ACCESSIBILITY|접근성
GRAPHICS|그래픽
LOCAL DATA|로컬 데이터
SETTINGS ARE SAVED TO THIS DEVICE.|설정은 이 기기에 저장됩니다.
SETTING SAVED.|설정이 저장되었습니다.
GRAPHICS PROFILE APPLIED.|그래픽 설정을 적용했습니다.
BACKUP SAVE|저장 데이터 백업
CLIPBOARD|클립보드
RESTORE SAVE|저장 데이터 복원
PASTE DATA|데이터 붙여넣기
RESET PROGRESS · TAP TWICE|진행도 초기화 · 두 번 누르기
CONFIRM RESET|초기화 확인
TAP AGAIN|다시 누르기
RESET CANCELLED · NO DATA CHANGED.|초기화 취소 · 데이터 변경 없음
PROGRESS RESET · RELOADING…|진행도 초기화 · 다시 불러오는 중…
SAVE BACKUP COPIED TO CLIPBOARD.|저장 데이터가 클립보드에 복사되었습니다.
SAVE RESTORED · RELOADING…|저장 데이터 복원 · 다시 불러오는 중…
RESTORE FAILED · INVALID SAVE DATA.|복원 실패 · 잘못된 저장 데이터
TAP RESET AGAIN WITHIN 4.5s TO ERASE LOCAL PROGRESS.|4.5초 이내에 다시 눌러 기기 저장 진행도를 삭제하세요.
COPY SAVE DATA|저장 데이터 복사
PASTE EVOLVE SAVE DATA|EVOLVE 저장 데이터를 붙여넣으세요
SFX|효과음
HAPTIC|진동
SHAKE|화면 흔들림
FLASH|화면 점멸
REDUCED MOTION|동작 줄이기
DAMAGE NUMBERS|피해량 표시
HIGH CONTRAST|고대비
PERF STATUS|성능 정보
ON|켜짐
OFF|꺼짐
LOW|낮음
FULL|최대
HIGH|높음
AUTO|자동
ECO|절전
QUALITY|고품질
PAUSED|일시정지
RESUME|계속하기
HOME|홈
RESTART RUN|도전 다시 시작
START MUTATION|변이 시작
SPECIMEN|개체
GENOME LAB|유전체 연구소
GENOME CODEX|유전체 도감
MEMORY|기억
MEMORY ARCHIVE|기억 보관소
UNEQUIP MEMORY|기억 장착 해제
STARTING ORGANISM|시작 생명체
PERSISTENT LOADOUT|영구 시작 구성
EVOLUTION UNLOCK PATH|진화 해금 경로
BIOLOGICAL SURVIVAL PROTOCOL|생체 생존 프로토콜
ADAPT · SURVIVE · EVOLVE|적응 · 생존 · 진화
THREAT · ADAPTIVE|위협 · 적응형
CELL ORIGIN|세포의 기원
DNA BANK|DNA 보유량
NEXT APEX|다음 정점 보스
STAGE|스테이지
CLEAR|클리어
LEVEL|레벨
LEVEL UP|레벨 업
CHOOSE 1|하나 선택
CHOOSE A BUILD|빌드 선택
CHOOSE WEAPON|무기 선택
START THIS RUN AT ★1|선택한 무기를 ★1로 시작합니다
SELECTED WEAPON ★1 · ALL OTHER WEAPONS ★0|선택 무기 ★1 · 나머지 무기 ★0
CONTRACT|계약
CHOOSE A TARGET|목표 선택
CHOOSE THE NEXT BIO-DOMAIN|다음 생체 영역 선택
STAGE CLEAR|스테이지 클리어
CORE ABSORPTION|코어 흡수
ELITE BIO-CORE SECURED|정예 생체 코어 확보
EVO|진화
EVO READY|진화 가능
EVO COMPLETE|진화 완료
FINAL MUTATION|최종 변이
EVOLVED|진화 완료
EVOLUTION SCORE|진화 점수
RUN EVOLUTION|이번 도전의 진화
KILLS|처치 수
REROLL|다시 뽑기
RECOMBINE|재조합
BIAS · BUILD|우선 · 현재 빌드
BUILD bias favors your current organs, synergies, and Blueprint path.|빌드 우선은 현재 기관·시너지·설계도 경로에 가중치를 부여합니다.
ACTIVE|액티브
TAP ENEMY · FOCUS|적을 눌러 집중 공격
FOCUS TARGET|집중 대상
FOCUS LOCKED · AUTO ATTACK PRIORITIZES THIS TARGET|집중 대상 지정 · 자동 공격 우선 적용
AUTO TARGET RESTORED|자동 대상 선택 복원
TAP AN ENEMY · FOCUS PRIORITY TARGET|적을 누르면 우선 공격 대상을 지정합니다
SECTOR SCAN|구역 탐지
FARM ROUTE|파밍 경로
PREDATOR|포식형
SURVIVAL|생존형
EMPTY|없음
SET|세트
ARM|팔
MOUTH|입
TAIL|꼬리
LEG|다리
CORE|코어
PRIMARY|주력
SECONDARY|보조
PASSIVE|패시브
MAX|최대
SELECTED|선택됨
EQUIPPED|장착됨
LOCKED|잠김
UNLOCK|해금
LOCKED ORGANISM|잠긴 생명체
UNKNOWN|알 수 없음
UNKNOWN MEMORY|알 수 없는 기억
UNKNOWN PREDATOR|정체불명 포식자
BOSS|보스
FINAL BOSS|최종 보스
MID-BOSS|중간 보스
ELITE|정예
NEMESIS|숙적
APEX|정점
OMEGA|오메가
ANOMALY|이상 현상
BONUS|보너스
RARE|희귀
EPIC|영웅
COMMON|일반
SPECIALIZED|특화
STANDARD|표준
RANGED|원거리
HEAVY|중장갑
SHIELD|방패
HEAL|회복
TOXIC|독성
FROST|빙결
FORGE|용광로
ABYSS|심연
CRYO|냉각
GENE|유전자
INFERNO|화염
RIFT|균열
CHEST|상자
RELIC|유물
RELICS|유물
HAZARD|위험 지대
RECOVERY|회복
REGEN|재생
STREAK|연속
CHAIN|연속 처치
WAVE|웨이브
WAVE DOMINATED|웨이브 제압
TACTICAL WAVES|전술 웨이브
TACTICAL WAVE DOMINATED|전술 웨이브 제압
HOSTILES INBOUND|적군 접근 중
FLANKERS INBOUND|측면 적군 접근 중
MILESTONE CLEARED|주요 단계 클리어
OMEGA MILESTONE CLEARED|오메가 주요 단계 클리어
CONTRACT COMPLETE|계약 완료
CONTRACT FAILED|계약 실패
CONTRACT HUNT COMPLETE|계약 사냥 완료
CONTRACT RETALIATION|계약 반격
NEMESIS DESTROYED|숙적 격파
NEMESIS ERASED|숙적 소멸
NEMESIS EXTRACTED|숙적 추출 완료
PERFECT EVASION|완벽한 회피
PREDATION OVERDRIVE|포식 과부하
FEEDING FRENZY|폭식 광란
UNSTABLE GENOME · CHOOSE ONE|불안정 유전체 · 하나 선택
UNSTABLE MUTATION|불안정 변이
UNSTABLE EVOLUTION|불안정 진화
MUTATION ACQUIRED|변이 획득
MUTATION FEED|변이 흡수
BIO-ORGAN IMPLANT|생체 기관 이식
BIO-CHEST SECURED|생체 상자 확보
BIO-CORE EXPOSED|생체 코어 노출
BIOMASS CORE DETECTED|생체 물질 코어 발견
BIO HARVEST · CORE DETECTED|생체 수확 · 코어 발견
BIOLOGICAL STRUCTURE REWRITTEN|생체 구조 재구성 완료
BIOLOGICAL STRUCTURE|생체 구조
CELL MASS RESTORED|세포량 회복
CELL REPAIR ACCELERATED|세포 복구 가속
ENEMY ADAPTATION DETECTED|적의 적응 확인
BREACH GATE OPEN|탈출 관문 개방
BREACH GATE · REACH EXIT|탈출 관문 · 출구로 이동
ESCAPE THE SECTOR|구역 탈출
TIME OVER|시간 종료
INVINCIBLE|무적
HP FULL|체력 최대
OVERGROWTH CORE ENTERED|과성장 코어 진입
ELITE NEST AWAKENED|정예 둥지 활성화
ELITE NEST PURGED|정예 둥지 제거
NEST PURGED|둥지 제거
SHIELD CAPSULE · BARRIER READY|방패 캡슐 · 보호막 준비
SHIELD CAPSULE|방패 캡슐
HEALTH CAPSULE|회복 캡슐
GENE CAPSULE|유전자 캡슐
KNOWLEDGE CAPSULE|지식 캡슐
REGEN POD|재생 포드
BIO CHEST|생체 상자
BIO POOL|생체 웅덩이
ENTER THE FIELD AND ABSORB|필드로 들어가 흡수하세요
STAND INSIDE TO ABSORB|안으로 들어가 흡수하세요
HOLD TO START CHALLENGE|길게 눌러 도전 시작
KEEP THE CHAIN ALIVE|연속 처치를 유지하세요
KILL HEALER|치유자 우선 처치
KILL CELL|세포 우선 처치
BREAK SUPPORT FIRST|지원 유닛 먼저 처치
BREAK SHIELD|방패 파괴
DODGE|회피
SIDESTEP|옆으로 회피
MOVE OUT|밖으로 이동
BACK OFF|물러서기
BREAK AWAY|거리 벌리기
FIND GAP|틈 찾기
RELOCATE|위치 변경
APPROACH|접근
CHARGE|돌진
STOMP|내리찍기
SWARM FRONT|군집 전선
REWARD CHALLENGE|보상 도전
RELIC CHALLENGE|유물 도전
TACTICAL RECALIBRATION|전술 재조정
CELL BLOOM|세포 개화
HAZARD SALVAGE|위험 물질 회수
APEX BIOCORE|정점 생체 코어
FACILITY|시설
INFECTED FACILITY|감염 시설
CULTIVATION|배양
CULTIVATION LAB|배양 연구소
DISPOSAL|폐기장
DISPOSAL YARD|폐기물 처리장
TITAN NEST|타이탄 둥지
SECURITY UPLINK|보안 통신 시설
UPLINK|통신 시설
MUTATION VAT|변이 배양조
VAT|배양조
WASTE REACTOR|폐기물 반응로
WASTE|폐기물
TITAN COCOON|타이탄 고치
TITAN|타이탄
CONTAINMENT WARDEN|격리 감시자
GROWTH CHIMERA|성장 키메라
TOXIC MAULER|독성 파괴자
TITAN BERSERKER|타이탄 광전사
ORIGIN COLOSSUS|기원의 거신
BLADE SERAPH|칼날 세라프
PYRE TITAN|화염 타이탄
FROST TITAN|빙결 타이탄
ABYSS MATRIARCH|심연의 여왕
ABERRANT TITAN|변종 타이탄
TITAN SENTINEL|타이탄 파수꾼
OMEGA SPITTER|오메가 포자포식자
OMEGA HUNTER|오메가 사냥꾼
OVERGROWTH CORE|과성장 코어
BIO TITAN|바이오 타이탄
ALPHA BRUTE|알파 브루트
WARDEN|감시자
RUNNER|돌격형
CRAWLER|기어다니는 개체
SPITTER|원거리 분사형
SYMBIOTE|공생체
EMBERMAW|화염 아귀
BRUTE|중장갑 개체
PRIME CELL|원시 세포
ACID WHELP|산성 새끼
FORGE SPAWN|용광로 피조물
ABYSS LARVA|심연 유충
HIVE TYRANT|군체 폭군
BULWARK|보루
HARVESTER|수확자
PURIFIER|정화자
GENOME HUNTER|유전체 사냥꾼
MELTDOWN MAULER|용융 파괴자
MEMORY EXTRACTED|기억 추출 완료
BALLISTIC MEMORY|탄도 기억
CORROSIVE MEMORY|부식 기억
CORE MEMORY|코어 기억
HUNTER MEMORY|사냥꾼 기억
NEMESIS MEMORY|숙적의 기억
ARM DAMAGE|팔 공격 피해
ACID DAMAGE|산성 피해
TAIL DAMAGE|꼬리 공격 피해
ALL DAMAGE / ARMOR|모든 공격 피해 / 방어력
SPEED / ACTIVE|이동 속도 / 액티브
NEMESIS DEFEATS|숙적 격파 수
MEMORY RANKS|기억 강화 단계
ONE MEMORY MAY BE EQUIPPED|기억은 하나만 장착할 수 있습니다
RARE BIO-ORGANS UNLOCKED|희귀 생체 기관 해금
SURVIVAL DATA SECURED|생존 데이터 확보
EVOLUTION UNLOCK|진화 해금
ORIGIN ASCENSION|기원 각성
CELL AWAKENING|세포 각성
PRIMAL AWAKENING|원시 각성
VOID AWAKENING|공허 각성
GENOME APEX|유전체 정점
RAPID MUTATION|급속 변이
PERFECT EVASION · +COUNTER|완벽 회피 · 반격 추가
COUNTER CHARGING|반격 충전 중
COUNTER BREAK|반격 파괴
DASH COOLDOWN -0.55s|대시 재사용 대기시간 -0.55초
BIO ACTIVE COOLDOWN -20%|BIO 액티브 재사용 대기시간 -20%
DAMAGE TAKEN -10%|받는 피해 -10%
DAMAGE TAKEN -8%|받는 피해 -8%
DAMAGE TAKEN -3%|받는 피해 -3%
HP REGEN +0.18 / sec|초당 체력 재생 +0.18
REGEN +0.22 / sec|초당 재생 +0.22
MOVE SPEED +3%|이동 속도 +3%
PICKUP RANGE +30|획득 범위 +30
ALL DAMAGE +12%|모든 공격 피해 +12%
CONTACT DAMAGE +12%|접촉 피해 +12%
CLOSE DAMAGE +16%|근접 피해 +16%
ARM DAMAGE +15%|팔 공격 피해 +15%
TAIL DAMAGE +18%|꼬리 공격 피해 +18%
ACID DAMAGE +18%|산성 피해 +18%
ACID DAMAGE +22%|산성 피해 +22%
CANNON ARM|포격 팔
ACID MOUTH|산성 입
CRUSH LEG|분쇄 다리
PHANTOM WINGS|환영 날개
GRAVITY WELL|중력 우물
SIEGE MODE|공성 모드
ADAPT BURST|적응 폭발
PIERCE BEAM|관통 광선
BROODSTORM|군체 폭풍
RED REAPER|붉은 수확자
GENE BLOOM|유전자 개화
GENE LATTICE|유전자 격자
CRYO CAGE|빙결 감옥
NULL FIELD|무효화 지대
OMEGA POOL|오메가 웅덩이
APEX NOVA|정점 폭발
ORIGIN NOVA|기원의 폭발
THERMAL BURST|열폭발
ACID BURST|산성 폭발
CRYO BURST|빙결 폭발
PLAGUE BURST|역병 폭발
GENESIS FRACTURE|창세 균열
ABYSS CROSS|심연의 십자
PYRE WHEEL|화염 바퀴
FROST CROSS|빙결 십자
MAGMA CROWN|마그마 왕관
ORIGIN QUAKE|기원의 진동
BIO SPIRAL|생체 나선
BIO SPINES|생체 가시
OMEGA TROPHY|오메가 트로피
APEX TROPHY|정점 트로피
APEX GENE|정점 유전자
APEX ORGAN QUALITY|정점 기관 품질
ORGAN QUALITY|기관 품질
ADAPTATION|적응
TRANSCENDENCE|초월
OVERDRIVE|과부하
HYPERMUTATION|초변이
OVERLOAD GRID|과부하 격자
RECOMBINATION CASCADE|연쇄 재조합
RECOMBINATION ZONE|재조합 구역
PREDATION|포식
RAPID DOMINATION|급속 지배
RAPID CLEAR|신속 클리어
TACTICAL CLEAR|전술 클리어
FAST CLEAR|빠른 클리어
CLEAR CACHE|보관 데이터 정리
GENE RIFT DETECTED · FOLLOW MARKER|유전자 균열 발견 · 표시를 따라가세요
RIFT COLLAPSED · SWARM INCOMING|균열 붕괴 · 군집 접근 중
MOVE · WASD / ARROW KEYS|이동 · WASD / 방향키
MOVE · TOUCH ANYWHERE & DRAG|이동 · 화면을 누른 채 드래그
DASH · SPACE TO EVADE|대시 · 스페이스 키로 회피
DASH · TAP ➤ TO EVADE|대시 · ➤ 버튼으로 회피
BIO ACTIVE · PRESS E|BIO 액티브 · E 키
BIO · TAP ACTIVE|BIO · 액티브 버튼 누르기
LOADING SPECIMEN…|생명체 불러오는 중…
SPECIMEN // ACTIVE BIO-WEAPON|개체 // 생체 무기 활성
SPECIMEN // BIO-CONTAINMENT|개체 // 생체 격리
DNA|DNA
EVOLVE|EVOLVE
BIO|BIO
`; 
const EXTRA = String.raw`
BIO-SYNC|생체 동기화
BIO-CONTAINMENT|생체 격리
BIOHAZARD|생물학적 위험
CONTAMINATION|오염
START|시작
RETURN|돌아가기
RETRY SAME BUILD|같은 빌드로 다시 도전
RUN IT BACK|다시 도전
HOMEOSTASIS|항상성 유지
CELL MASS|세포량
GENOME COLLAPSE|유전체 붕괴
GENOME ANOMALY|유전체 이상
BIO HARVEST|생체 수확
EXTERMINATION|섬멸
CONTROLLED HUNT|통제된 사냥
PREDATOR TRIAL|포식자 시련
RELIC EXPOSED|유물 노출
RELIC SALVAGED|유물 확보
RELIC ABSORBED|유물 흡수
ZONE ORGAN EXTRACTED|구역 기관 추출 완료
ANOMALY EXTRACT|이상 개체 추출
ZONE SET|구역 세트
CELL DAMAGE|세포 피해
ATTACK SPEED|공격 속도
COMBAT SPEED|전투 속도
RANGED BURST|원거리 폭발
HEAVY KNOCKBACK|강한 밀쳐내기
MULTI HIT|다단 공격
SHOCKWAVE|충격파
MUTAGEN RESERVE|변이원 비축
WEAPON|무기
WEAPON SELECT|무기 선택
EXPOSED CORE · DAMAGE +35%|코어 노출 · 피해 +35%
BIO ACTIVE CHARGED|BIO 액티브 충전 완료
DEVOUR · BIO ACTIVE CHARGED|포식 · BIO 액티브 충전 완료
PREDATOR WARD BREACHED|포식자 보호막 돌파
TITAN RESPONSE ESCALATED|타이탄 대응 강화
PURIFICATION ACTIVE|정화 가동
PERFECT ADAPTATION|완벽한 적응
LETHAL DAMAGE ADAPTED · ONE-TIME SAFETY|치명타 적응 · 1회 생존 보호
HYPERMUTATION RESPONSE|초변이 대응
TRANSCENDENCE RESPONSE|초월 대응
GENE RIFT|유전자 균열
RELIC SENSE|유물 감지
RELIC CHANCE UP|유물 확률 증가
BIOLOGICAL DOMINANCE|생체 지배
FEEDING FRENZY · |폭식 광란 · 
PERFECT EVASION ×|완벽 회피 ×
PERFECT EVASION 3회로 적 생체핵을 3초간 노출|완벽 회피 3회로 적 생체핵을 3초간 노출
RAPID DOMINATION ×|급속 지배 ×
CORE EXPOSED|코어 노출
BOSS SIGNAL|보스 신호
ELITE SIGNAL|정예 신호
APEX SIGNAL|정점 신호
NEMESIS SIGNAL|숙적 신호
MID-BOSS SIGNAL|중간 보스 신호
NEMESIS FORMED|숙적 생성
GENE SWARM · PREPARE|유전자 군집 · 대비하세요
ORIGIN SWARM · PREPARE|기원 군집 · 대비하세요
ABYSS CROSS · ROTATE OUT|심연의 십자 · 회전하여 피하세요
ALPHA SLAM · GET OUT|알파 강타 · 범위를 벗어나세요
CONTAINMENT PURGE · MOVE|격리 정화 · 이동하세요
PRIMAL SWEEP · SIDESTEP|원시 휩쓸기 · 옆으로 피하세요
PRIMAL SWEEP|원시 휩쓸기
VOID COLLAPSE · ESCAPE THE CORE|공허 붕괴 · 중심에서 벗어나세요
CORE NOVA · FIND A GAP|코어 폭발 · 빈틈을 찾으세요
ORIGIN NOVA · FIND A GAP|기원 폭발 · 빈틈을 찾으세요
GENESIS FRACTURE · CHANGE LANE|창세 균열 · 이동 경로를 바꾸세요
GENE LATTICE · SWITCH LANE|유전자 격자 · 다른 길로 이동하세요
GENE BLOOM · KEEP MOVING|유전자 개화 · 계속 이동하세요
GENE BLOOM · FREE DNA|유전자 개화 · 추가 DNA
BIO SPIRAL · THREAD THE GAP|생체 나선 · 틈을 통과하세요
BIO SPINES · LEAVE THE MARKS|생체 가시 · 흔적을 벗어나세요
PYRE WHEEL · ROTATE WITH IT|화염 바퀴 · 함께 회전하세요
FROST CROSS · FIND A QUADRANT|빙결 십자 · 안전 구역을 찾으세요
FROST FAN · CUT ACROSS|서리 부채 · 가로질러 피하세요
CRYO CAGE · BREAK OUT|빙결 감옥 · 빠져나오세요
CRYO LOCK · KEEP MOVING|빙결 봉쇄 · 계속 이동하세요
CRYO BURST · MOVE OUT|빙결 폭발 · 밖으로 이동하세요
THERMAL BURST · MOVE OUT|열폭발 · 밖으로 이동하세요
ACID BURST · MOVE OUT|산성 폭발 · 밖으로 이동하세요
ACID BLOOM|산성 개화
BIO POOL · RELOCATE|생체 웅덩이 · 위치를 바꾸세요
NULL CARAPACE|무효화 갑각
FROST STALKER|서리 추적자
PHASE MUSCLE|위상 근육
PHASE GENE|위상 유전자
REACTOR GENE|반응로 유전자
VIRULENT GENE|맹독 유전자
PREDATOR GENE|포식자 유전자
HYDRA GENE|히드라 유전자
BASTION GENE|방어 유전자
HASTE GENE|가속 유전자
OVERBORE ROUND|고관통 탄환
PIERCE + PRECISION|관통 + 정밀도
SIEGE LINK|공성 연결
SIEGE LOBE|공성 엽
SIEGE ORGANISM|공성 개체
RAIL / ARM FIRE|레일 / 팔 포격
CROSS-LANCE MATRIX|교차 창 진형
APEX FLOW|정점 흐름
CHAIN FLOW|연쇄 흐름
PREDATOR FLOW|포식자 흐름
NEURAL OVERDRIVE|신경 과부하
NEURAL SHARD|신경 파편
MOTOR NERVES|운동 신경
HYPERKINETIC|초고속 운동
HASTE|가속
CELL DENSITY|세포 밀도
FRACTAL LIMBS|프랙탈 사지
BLOOD DANCE|피의 춤
BLOOD HUNTER|피의 사냥꾼
BLACK SUN|검은 태양
BULWARK RESPONSE|보루 대응
BULWARK COLUMN|보루 기둥
CRYO APEX|빙결 정점
THERMAL APEX|열에너지 정점
ABSOLUTE ZERO|절대영도
WHITEOUT DOMAIN|백색 폭풍 영역
CRYO NODE|냉각 결정
CRYO LANCE|빙결 창
CRYO VAULT|빙결 보관소
INFERNO HIVE|화염 군체
GENE TEMPLE|유전자 사원
TITAN SINEW|타이탄 힘줄
TITAN HEART|타이탄 심장
TITAN STRIDER|타이탄 보행자
TITAN 근섬유가 근접 절단기관을 증폭합니다.|타이탄 근섬유가 근접 절단 기관을 증폭합니다.
ABYSS EYE|심연의 눈
ABYSSAL OVERDRIVE|심연 과부하
CORE DEVOURER|코어 포식자
CORE MELTDOWN|코어 용융
CORE NOVA|코어 폭발
CORE GENE|코어 유전자
CORE Lv.2 · ACTIVE: GRAVITY WELL|코어 Lv.2 · 액티브: 중력 우물
ARM Lv.1 · ACTIVE: SIEGE MODE|팔 Lv.1 · 액티브: 공성 모드
MOUTH Lv.1 · ACTIVE: PLAGUE BLOOM|입 Lv.1 · 액티브: 역병 개화
TAIL Lv.1 · ACTIVE: RENDING DANCE|꼬리 Lv.1 · 액티브: 절단의 춤
HOMEOSTASIS · ACTIVE: ADAPT BURST|항상성 · 액티브: 적응 폭발
ARM / SUN LANCE 대응 프로토콜|팔 / 태양 창 대응 프로토콜
ACID / PLAGUE 대응 프로토콜|산성 / 역병 대응 프로토콜
TAIL / RED REAPER 대응 프로토콜|꼬리 / 붉은 수확자 대응 프로토콜
DASH / VOID CARAPACE 대응 프로토콜|대시 / 공허 갑각 대응 프로토콜
BIO-CONTAINMENT // SPECIMEN ACTIVE|생체 격리 // 개체 활성
BOSS NEARBY|보스 접근 중
TITAN NEST · FINAL WINDOW|타이탄 둥지 · 최종 시간대
VORACIOUS LENS|탐식의 렌즈
RAZOR WING|칼날 날개
RAZOR TEMPEST|칼날 폭풍
RAZOR TENDON|칼날 힘줄
RAZORLING|칼날 유충
RAZOR MEMORY|칼날 기억
RAZOR TAIL|칼날 꼬리
RAPTOR MATRIX|랩터 매트릭스
REACTIVE SHELL|반응성 껍질
REGEN MESH|재생 망
REGENESIS|재생
REGENERATIVE SURGE|재생 폭발
REGENERATIVE|재생형
REND|절단
RENDING DANCE|절단의 춤
PREDATOR FANG|포식자의 송곳니
PREDATOR GENES|포식자 유전자
PREDATOR BLOOM|포식자 개화
PREDATOR EDGE|포식자 칼날
POISON|독
PLAGUE|역병
PLAGUE TISSUE|역병 조직
PLAGUE WYRM|역병 와이번
PLAGUE VORTEX|역병 소용돌이
PLAGUE BLOOM|역병 개화
PICKUP|획득
RECOMBINATION|재조합
SERRATED GLAND|톱니샘
SPORE FEATHERS|포자 깃털
STABILIZER MESH|안정화 망
SOLAR MELTDOWN|태양 용융
SUN LANCE|태양 창
THERMAL SAC|열 주머니
THERMAL RUNAWAY|열폭주
THERMAL VENT|열 배출구
TOXIC VATS|독성 배양조
TOXIC VATS ONLINE|독성 배양조 가동
TOXIC FIELD|독성 지대
TOXIC RECLAIMER|독성 회수자
VOID LATTICE|공허 격자
VOID COLLAPSE|공허 붕괴
VOID CARAPACE|공허 갑각
WING|날개
XP|XP
`; 
// Language QA v2: game-identifying names are NOT ordinary translatable words.
// Include all playables, enemy classes, bosses, elite titles and evolutionary forms.
const CHARACTER_AND_BOSS_NAMES = [
 'PRIME CELL','RAZORLING','ACID WHELP','FORGE SPAWN','ABYSS LARVA',
 'CRAWLER','RUNNER','BRUTE','SPITTER','WARDEN','FROST STALKER','SYMBIOTE','EMBERMAW',
 'BIO TITAN','FROST TITAN','ABERRANT TITAN','PYRE TITAN','ORIGIN COLOSSUS','ABYSS MATRIARCH',
 'ALPHA BRUTE','OMEGA SPITTER','TITAN SENTINEL','OMEGA HUNTER','GENOME HUNTER',
 'GROWTH CHIMERA','TOXIC MAULER','CONTAINMENT WARDEN','TITAN BERSERKER',
 'PLAGUE WYRM','BLADE SERAPH','SIEGE ORGANISM','BLACK SUN',
 'PERFECT ADAPTATION','TITAN STRIDER','PHANTOM WINGS',
 'HIVE TYRANT','BLOOD HUNTER','CORE DEVOURER',
 'BOSS BLADE VARIANT','UNKNOWN PREDATOR'
];
const PROTECTED_STANDALONE = new Set([...CHARACTER_AND_BOSS_NAMES,'TITAN','TAP TO CONTINUE']);
// Single-word names are protected when used as entity names, not when merely
// contained in other phrases (e.g. TITAN NEST should remain translatable).
const PROTECT_INSIDE = [...CHARACTER_AND_BOSS_NAMES.filter(s=>s.includes(' ')),'TAP TO CONTINUE'].sort((a,b)=>b.length-a.length);
const PROTECT_REGEX = new RegExp('(?<![A-Za-z])(?:'+PROTECT_INSIDE.join('|')+')(?![A-Za-z])','g');
// TITAN is both the proper name of an enemy and an ordinary word in locations
// such as TITAN NEST; protect only when the surrounding message is about a boss.
const SINGLE_ENEMY_CONTEXT = /(?<![A-Za-z])(?:BRUTE|CRAWLER|RUNNER|SPITTER|WARDEN|SYMBIOTE|EMBERMAW)(?=\s*(?:[·|:]\s*(?:PHASE|HP|LV|LEVEL|BOSS|ELIMINATED|DEFEATED|DESTROYED|\d)|\bELIMINATED\b|\bDEFEATED\b|\bDESTROYED\b))/g;
const TITAN_BOSS_CONTEXT = /(?<![A-Za-z])TITAN(?=\s*(?:[·|:]\s*(?:PHASE\b|HP\b|BOSS\b|LV\b|LEVEL\b|\d)|\bELIMINATED\b|\bDEFEATED\b|\bDESTROYED\b))/g;
function maskGameNames(input,names) {
 let masked=input.replace(PROTECT_REGEX,hit=>{
  const n=names.length;names.push(hit);return '\uE100'+n+'\uE101';
 });
 masked=masked.replace(SINGLE_ENEMY_CONTEXT,hit=>{const i=names.length;names.push(hit);return '\uE100'+i+'\uE101';});
 return masked.replace(TITAN_BOSS_CONTEXT,hit=>{
  const n=names.length;names.push(hit);return '\uE100'+n+'\uE101';
 });
}
const EXACT = new Map();
for (const line of (PAIRS+EXTRA).trim().split(/\r?\n/)) {
 const j = line.indexOf('|');
 if (j > 0) EXACT.set(line.slice(0,j).trim(), line.slice(j+1));
}
// Priority whole-phrase UI translations; no partial-word synthetic grammar.
const QA_EXACT_PAIRS = String.raw`
NEW MUTATION|새 변이 시작
DOMINANT MUTATION|주요 변이
EVO MATERIAL|진화 재료
EVO PATH|진화 경로
EVO NEED|진화 조건
NEW ACTIVE|신규 액티브
DASH REC|대시 회복
ATK CD|공격 간격
PIERCE|관통
RANGE|사거리
VOLLEY|연발
REQ|필요
BOOST|강화
HIVE SURGE|군체 공세
HUNT PACK|추격 군집
PICKUP +8|획득 범위 +8
GPU BATCH|GPU 일괄 처리
GPU BATCH · ON|GPU 일괄 처리 · 켜짐
GPU BATCH · OFF|GPU 일괄 처리 · 꺼짐
MAX BUILD|최대 빌드
SPAWN SELECTED BOSS|선택한 보스 소환
FORCE NEXT BOSS PHASE|보스 다음 단계 강제 전환
DAMAGE ON|피해 켜짐
INVINCIBLE|무적
MANUAL SPAWN · DAMAGE SWITCH · XP 30px|수동 소환 · 피해 전환 · XP 30px
STAGE CLEAR|스테이지 클리어
RUN BUILD READOUT|이번 도전 빌드 분석
ADAPTATION NOTE|적응 분석
NO COMBAT DAMAGE DATA · EVOLUTION ENDED BEFORE ORGAN ATTACKS|전투 피해 기록 없음 · 기관 공격 전에 진화 종료
OVER-SPECIALIZED|한쪽에 치우친 빌드
SURVIVAL GAP|생존 능력 부족
STRONG EXECUTION|뛰어난 전투 수행
STABLE EVOLUTION|안정적인 진화
COMBAT|전투
SKILL|기술
OBJECTIVE|목표
EVOLUTION|진화
SURVIVAL|생존
PRIMARY|주력
SECONDARY|보조
SPECIALIZED|특화
FOCUSED|집중형
HYBRID|혼합형
STOMP / STAGGER|내려찍기 / 경직
MULTI HIT|다단 공격
AOE / EXECUTE|범위 공격 / 처형
CONTROL / PIERCE|군중 제어 / 관통
RANGED BURST|원거리 폭발
NO COMBAT DAMAGE DATA|전투 피해 기록 없음
STAGES TO UNLOCK|스테이지 클리어 시 해금
RAPID ATTACK|빠른 공격
DAMAGE RESIST|피해 저항
ENEMY HP|적 체력
ENEMY SPEED|적 이동 속도
ELITE HP|정예 체력
REWARD ALREADY SECURED|보상 이미 획득함
EPIC ORGAN ACCESS|영웅 등급 기관 사용 가능
ROUTE MASTERY|경로 숙련도
ROUTE MASTERY PERSISTS|경로 숙련도가 유지됩니다
GENOME DNA BANKED|유전체 DNA 보관 완료
SUCCESS|성공
BANK DNA|보관 DNA
GUARANTEED RELIC|유물 확정 획득
ACTIVE RECALIBRATED|액티브 재조정 완료
TACTICAL WAVE|전술 웨이브
WARNING|경고
ASCEND|각성 형태
PER RANK|등급당
STAGE SELECT|스테이지 선택
PHASE|단계
POWER|전투력
ADAPTED VS|적응 대상
DEFEATS|격파 수
PICKUP|획득 범위

BOSS NEARBY|보스 접근 중
PHASE I|1페이즈
PHASE II|2페이즈
PHASE III|3페이즈
PHASE IV|4페이즈
TAP FOR INVINCIBILITY|누르면 무적
TAP TO ENABLE DAMAGE|누르면 피해 적용
CANNON ARM / ARTILLERY DAMAGE +3% PER RANK|포격 팔 / 포격 피해 등급당 +3%
ACID DAMAGE +3% PER RANK|산성 피해 등급당 +3%
TAIL DAMAGE +3% PER RANK|꼬리 공격 피해 등급당 +3%
ALL DAMAGE +2% · ARMOR +1% PER RANK|등급당 모든 공격 피해 +2% · 방어력 +1%
MOVE SPEED +2% · BIO ACTIVE RECOVERY +2% PER RANK|등급당 이동 속도 +2% · BIO 액티브 회복 +2%
BIO-CONTAINMENT BREACHED.|생체 격리구역 돌파 성공.
Cells collapsed. Try a different mutation build.|세포가 붕괴했습니다. 다른 변이 조합으로 다시 시도해 보세요.
RETURNS IN THE NEXT RUN.|다음 도전에 다시 침입합니다.
Defeat a Nemesis adapted against this mutation.|이 변이에 적응한 숙적을 처치하면 해금됩니다.
Encounter or evolve to discover|조우하거나 진화하면 발견됩니다
RAPID CELL REPAIR|빠른 세포 재생
CRYO LOCK|빙결 봉쇄
THERMAL VENT|열 배출구
DAMAGE +20% · SPEED +14% · RAPID ATTACK|공격 피해 +20% · 이동 속도 +14% · 빠른 공격
AGGRESSIVE DOMAIN|공격형 구역
PRIORITY THREATS|최우선 위협
REWARD ALREADY SECURED|보상 이미 획득함
RETRY SAME BUILD|같은 빌드로 다시 도전
CLEAR HORDE|적 무리 제거
CLEAR BOSS|보스 제거
UNSUPPORTED|지원되지 않음
FRAME HITCH|프레임 지연
BASE BUILD|기본 빌드
NO COMBAT DAMAGE DATA|전투 피해 기록 없음
ASCEND:|각성 형태:
EVOLVE|EVOLVE
`; 
for(const line of QA_EXACT_PAIRS.trim().split(/\r?\n/)) {
 const idx=line.indexOf('|');if(idx>0)EXACT.set(line.slice(0,idx).trim(),line.slice(idx+1));
}
// EVOLVE locale-pack v3 curated EN/KO UI, full-sentence entries win over fragments.
const QA_V3_PHRASES = String.raw`
Rapid-fire biological artillery organ|고속 생체 포격 기관
Acid projectiles that slow enemies|산성 투사체와 둔화
Close-range sweeping slash organ|근접 광역 절단 기관
Orbiting bio-blades with multiple hits|회전 생체 칼날과 다중 타격
Shockwave strikes focused on stagger|충격파와 Stagger 중심 타격
PRIME CELL ultimate adaptation|PRIME CELL 궁극 적응
RAZORLING ultimate adaptation|RAZORLING 궁극 적응
ACID WHELP ultimate adaptation|ACID WHELP 궁극 적응
FORGE SPAWN ultimate adaptation|FORGE SPAWN 궁극 적응
ABYSS LARVA ultimate adaptation|ABYSS LARVA 궁극 적응
Pickup range and DNA efficiency|흡수 범위와 DNA 효율
Tail and overall damage boost|꼬리/전체 공격 강화
Damage and maximum HP|공격력과 최대 체력
Armor and movement speed|방어력과 이동속도
Attack cadence and movement speed boost|공격주기와 이동 강화
Bonus damage against elites and TITANs|엘리트/TITAN 추가 피해
Increased ARM attack damage|ARM 계열 공격 증폭
Increased ACID attack damage|ACID 공격 증폭
Increased TAIL attack damage|TAIL 공격 증폭
Reduced damage taken|받는 피해 감소
Continuous HP regeneration|지속 체력 회복
Faster dash recharge|대시 회복 가속
Increased pickup range|흡수 범위 증가
ALPHA BRUTE signature organ|ALPHA BRUTE 시그니처 기관
OMEGA SPITTER signature organ|OMEGA SPITTER 시그니처 기관
TITAN signature organ|TITAN 시그니처 기관
ORIGIN COLOSSUS signature organ|ORIGIN COLOSSUS 시그니처 기관
ABYSS MATRIARCH signature organ|ABYSS MATRIARCH 시그니처 기관
Swarm pressure · flanking waves from both sides|군집 압박 · 좌우 웨이브로 접근
Flanking assault · telegraphed charge · chases low-HP targets|측면 침투 · 예고 돌진 · 저체력 추격
Telegraphed close-range slam with heavy area damage|근거리 SLAM 예고 후 강한 범위 충격
Ranged · spreading acid shots + periodic ACID MARK|RANGED · 확산 산성탄 + 주기적 ACID MARK
Shield · protects nearby units + periodic BARRIER PULSE|SHIELD · 주변 보호 + 주기적 BARRIER PULSE
Slow · cryo shots + telegraphed freezing beam|SLOW · CRYO 탄 + 직선 동결 사격 예고
Heal · supports nearby units with a regenerative tether|HEAL · 생체 회복 TETHER 지원
Inferno charge · leaves a molten trail|INFERNO 돌진 · 용암 궤적
First elite predator|첫 번째 엘리트 포식자
Toxic artillery elite|독성 포격 엘리트
Final CRYO organism|CRYO 최종 개체
Final GENE organism|GENE 최종 개체
Final INFERNO organism|INFERNO 최종 개체
Major boss every 5 stages|5스테이지 단위 대형 보스
OMEGA boss every 10 stages|10스테이지 단위 OMEGA 보스
Countermeasure against ARM / SUN LANCE|ARM / SUN LANCE 대응 프로토콜
Countermeasure against area blasts / BROODSTORM|광역 폭발 / BROODSTORM 대응 프로토콜
Countermeasure against ACID / PLAGUE|ACID / PLAGUE 대응 프로토콜
Countermeasure against TAIL / RED REAPER|TAIL / RED REAPER 대응 프로토콜
Countermeasure against DASH / VOID CARAPACE|DASH / VOID CARAPACE 대응 프로토콜
Enter a danger zone, then escape before impact to charge COUNTER|위험 예고 안에 들어갔다가 충돌 직전에 탈출하면 COUNTER 충전
Trigger 3 PERFECT EVASIONS to expose an enemy bio-core for 3 seconds|PERFECT EVASION 3회로 적 생체핵을 3초간 노출
Tap an enemy to prioritize it for auto-attacks|전장의 적을 탭하면 자동공격 우선 대상을 지정
Quickly clear timed enemy groups for bonus DNA and PREDATION|시간대별 역할 조합을 빠르게 제거하면 추가 DNA와 PREDATION 획득
Repeated heavy hits briefly interrupt normal enemies|연속 강타로 일반 적의 움직임을 짧게 끊는 충격 시스템
An elite or boss that ended your run returns stronger next run|런을 끝낸 엘리트/보스가 다음 런에 강화되어 재침입
Defeat an ARM-adapted Nemesis to obtain|ARM 대응 Nemesis 처치로 획득
Defeat an ACID-adapted Nemesis to obtain|ACID 대응 Nemesis 처치로 획득
Defeat a TAIL-adapted Nemesis to obtain|TAIL 대응 Nemesis 처치로 획득
Defeat a CORE-adapted Nemesis to obtain|CORE 대응 Nemesis 처치로 획득
Defeat a HASTE-adapted Nemesis to obtain|HASTE 대응 Nemesis 처치로 획득
Elite variant with high speed and damage|고속·고화력 엘리트 변종
Elite variant with high HP and damage reduction|고체력·피해감소 엘리트 변종
Elite variant with continuous regeneration|지속회복 엘리트 변종
Cryogenic zone. Enemies advance more slowly, but elite armor is stronger and CRYO LOCK restricts the field.|냉각 제어 구역. 적의 접근 속도는 낮지만 Elite 외골격이 강화되고 CRYO LOCK이 전장을 봉쇄합니다.
Recombination zone. Enemies gain HP, but you earn more XP and DNA.|재조합 구역. 적 체력은 늘지만 성장 속도와 DNA 수확량이 함께 증가합니다.
Extreme-heat zone. Both sides deal more damage, and THERMAL VENT activates more often.|고온 포식 구역. 양쪽 화력이 함께 올라가고 THERMAL VENT가 더 자주 열립니다.
Break through HIVE SURGE and defeat the target number of enemies.|HIVE SURGE를 뚫고 목표 수를 제거합니다.
Maintain a kill streak against HUNT PACK.|HUNT PACK 속에서 연속 처치를 유지합니다.
Capture and absorb 3 BIOMASS CORES yourself.|BIOMASS CORE 3개를 직접 점령·흡수합니다.
Failed to defeat the boss before the time limit.|제한시간 내 처치하지 못했습니다.
Approach to absorb|접근해서 흡수
Expose the bio-core weak points of elites and TITANs for extra damage.|엘리트와 TITAN의 생체핵을 감지해 약점을 찢습니다.
Amplify bio-artillery nerves to boost ARM attacks.|생체 포격 신경을 증폭해 ARM 계열 화력을 강화합니다.
Overload acid organs to increase their corrosive potency.|산성기관의 독성 농도를 비정상적으로 끌어올립니다.
Reinforce tail muscles for more slashing damage.|꼬리 근육을 고밀도로 재구성해 절단력을 높입니다.
A reactive shell contracts on impact to absorb incoming damage.|충격 순간 수축하는 외피가 직접 피해를 흡수합니다.
Create regenerative tissue across damaged organs.|손상된 조직 사이에 회복성 망상세포를 형성합니다.
Rapid muscle contractions shorten dash recharge time.|폭발성 근수축으로 대시 기관의 회복을 단축합니다.
Outer cilia pull DNA and growth materials from farther away.|외피 섬모가 DNA와 성장 물질을 더 멀리서 끌어옵니다.
ALPHA BRUTE impact marrow; boosts predatory damage at close range.|ALPHA BRUTE의 충격 골수. 근거리 공격에서 포식 반응이 폭발합니다.
OMEGA SPITTER toxin sac; strengthens acid attacks and slow effects.|OMEGA SPITTER의 독낭. 산성 공격과 둔화 반응을 강화합니다.
TITAN heart core; improves sustained HP regeneration.|TITAN의 심근핵. 지속 회복력을 높입니다.
ORIGIN COLOSSUS nucleus; amplifies all attacking organs.|ORIGIN COLOSSUS의 원시 핵. 모든 공격 기관을 동시에 증폭합니다.
ABYSS MATRIARCH sensory organ; reduces BIO ACTIVE cooldown.|ABYSS MATRIARCH의 감각기관. BIO ACTIVE 재사용을 단축합니다.
Immediately raises a random primary mutation by 1 level.|무작위 주 변이를 1단계 즉시 성장시킵니다.
Reinforces cell nuclei to significantly improve survivability.|세포핵을 재구성해 생존력을 크게 올립니다.
Overdrives metabolism to increase all damage dealt.|대사기관을 폭주시켜 모든 공격의 위력을 증가시킵니다.
Creates reactive armor that reduces incoming damage.|충격에 반응하는 외골격을 형성합니다.
Boosts neural reflexes and dash recharge speed.|신경 반응과 대시 회복 속도를 강화합니다.
Extracts DNA and recombination resources from elite cores.|엘리트 핵에서 순수 DNA와 재조합 자원을 추출합니다.
Replicates limbs to fire one extra bio-projectile, but reduces maximum HP.|사지가 자기복제되며 기본 생체 포격 수가 늘어납니다. 대신 세포 안정성이 감소합니다.
Accelerates metabolism, reducing cooldown for all attack organs.|대사 주기가 비정상적으로 빨라져 모든 공격 기관의 재사용 속도가 상승합니다.
Gains extremely dense armor at the cost of movement speed.|밀도가 극단적으로 높은 외골격을 얻지만 이동 신경이 둔화됩니다.
Overdevelops close-range nerves to boost tail and acid attacks.|근접 신경계가 과발달해 꼬리와 산성 기관이 더 공격적으로 작동합니다.
Facility control tissue disperses impact damage.|시설 제어조직이 충격을 분산합니다.
Cultivated tissue continuously regenerates HP.|배양조직이 지속적으로 세포를 재생합니다.
Recycles toxic waste into offensive organs.|폐기물 독성을 공격기관에 재활용합니다.
TITAN muscle fibers strengthen close-range cutting organs.|TITAN 근섬유가 근접 절단기관을 증폭합니다.
DAMAGE ON · TAP FOR INVINCIBILITY|피해 판정 켜짐 · 누르면 무적
INVINCIBLE · TAP TO ENABLE DAMAGE|무적 켜짐 · 누르면 피해 적용
DAMAGE ON|피해 판정 켜짐
INVINCIBLE|무적
GPU BATCH · ON|GPU 일괄 처리 · 켜짐
GPU BATCH · OFF|GPU 일괄 처리 · 꺼짐
MANUAL SPAWN · DAMAGE SWITCH · XP 30px|수동 소환 · 피해 판정 전환 · XP 30px
TAP TO CONTINUE|TAP TO CONTINUE
CAMPAIGN CYCLE|캠페인 회차
GENE RESONANCE|유전자 공명
GENE RIFT|유전자 균열
RIFT ABSORBED|균열 흡수 완료
APEX SIGNAL|정점 위협 신호
CLEAR THE LANE|공격 경로에서 벗어나세요
BOSS APPROACHING|보스 접근 중
NEXT APEX|다음 정점 보스
NEXT OMEGA|다음 오메가 보스
BOSS NEARBY|보스 접근 중
PERF STATUS|성능 정보
GPU BATCH|GPU 일괄 처리
UNSUPPORTED|지원되지 않음
RECOVERING|복구 중
FRAME HITCH|프레임 지연
STABLE|안정
FATAL|치명적
VICTORY|승리
DEATH|사망
EXTINCT|멸종
EVOLVED|진화 완료
TIME OVER|시간 초과
CONTINUE|계속하기
RETRY|재도전
RESTART RUN|도전 다시 시작
RUN IT BACK|같은 빌드로 재도전
RETRY SAME BUILD|같은 빌드로 재도전
NEW MUTATION|새로운 변이로 시작
SFX|효과음
HAPTIC|진동
SHAKE|화면 흔들림
FLASH|화면 점멸
DAMAGE NUMBERS|피해량 표시
REDUCED MOTION|동작 줄이기
HIGH CONTRAST|고대비
ECO|절전
QUALITY|고화질
AUTO|자동
COOLDOWN|쿨타임
ATTACK SPEED|공격 속도
DASH COOLDOWN|대시 쿨타임
DASH REC|대시 재충전
ATK CD|공격 간격
PICKUP|획득 범위
PICKUP RANGE|획득 범위
DAMAGE TAKEN|받는 피해
ALL DAMAGE|전체 공격 피해
PLAYER DAMAGE|플레이어 공격 피해
ENEMY DAMAGE|적 공격력
ENEMY SPEED|적 이동 속도
CRIT CHANCE|치명타 확률
CRIT DAMAGE|치명타 피해
REGEN|체력 재생
MAX HP|최대 체력
HP REGEN|체력 재생
ARMOR|방어력
SHIELD|보호막
RESIST|저항력
PIERCE|관통
VOLLEY|연발
PROJECTILE|투사체
PROJECTILES|투사체
AOE|범위 공격
RANGE|사거리
DURATION|지속시간
REROLL|다시 뽑기
NEW ACTIVE|신규 액티브 스킬
EVO MATERIAL|진화 재료
EVO PATH|진화 경로
EVO NEED|진화 조건
EVO READY|진화 가능
EVO COMPLETE|진화 완료
PREDATION|포식
MUTATION|변이
SURVIVAL GAP|생존 능력 부족
STRONG EXECUTION|뛰어난 전투 수행
OVER-SPECIALIZED|한쪽에 치우친 빌드
STABLE EVOLUTION|안정적인 진화
BIO ACTIVE|BIO 액티브
SURVIVAL|생존
POWER|공격력
WAVE|웨이브
STAGE|스테이지
LEVEL|레벨
RANK|등급
PHASE|페이즈
SPAWN SELECTED BOSS|선택한 보스 소환
FORCE NEXT BOSS PHASE|보스 다음 페이즈로 전환
REWARD ALREADY SECURED|이미 획득한 보상
PER RANK|등급당
HIVE SURGE|군체 공세
HUNT PACK|추격 군집
END EVOLUTION|진화 종료
CLEAR HORDE|적 무리 처치
CLEAR BOSS|보스 처치
DAMAGE SWITCH|피해 판정 전환
NO COMBAT DAMAGE DATA|전투 피해 기록 없음
RELIC|유물
RELICS|유물
MEMORY|기억
ARM|팔
MOUTH|입
TAIL|꼬리
LEG|다리
WING|날개
CORE|코어
GENE|유전자
DNA|DNA
XP|XP
EXP|EXP
FPS|FPS
HUD|HUD
`;
for(const line of QA_V3_PHRASES.trim().split(/\r?\n/)) {
 const p=line.indexOf('|');if(p>0)EXACT.set(line.slice(0,p).trim(),line.slice(p+1));
}
const QA_V3_ACCESSIBILITY = String.raw`
Defeated enemies|처치한 몬스터 수
Experience to next level|다음 레벨까지 경험치
Boss HP|보스 체력
Pause|일시정지
Minimap around the character|캐릭터 주변 미니맵
Mobile portrait: move with joystick · BIO ACTIVE · ➤ dash|모바일 세로: 조이스틱 이동 · BIO 액티브 · ➤ 대시
PC: WASD / arrow keys · E for active · Space to dash|PC: WASD / 방향키 · E 액티브 · Space 대시
864px reference width · actual crystal height|기준 864px 너비 · 실제 결정체 높이
XP reference height|XP 기준 높이
Show capture view|캡처 화면 보기
Save measurement JSON|측정 JSON 저장
Reference and live game use the same renderer. Example renders are not guaranteed to be pixel-identical.|기준 화면과 실제 게임은 같은 렌더러 사용. 원본 예시 생성 이미지는 픽셀 동일을 보장하지 않음.
Open|열기
Collapse|접기
`;
for(const line of QA_V3_ACCESSIBILITY.trim().split(/\r?\n/)){const p=line.indexOf('|');if(p>0)EXACT.set(line.slice(0,p).trim(),line.slice(p+1));}
const EVOLVE_V3_NARRATIVE = String.raw`
HASTE is low. On your next run, prioritize TEMPO / DODGE to handle danger patterns.|가속 능력이 부족합니다. 다음 도전에서는 TEMPO와 DODGE를 우선 강화해 위험 공격에 대응하세요.
CORE investment is low. Improve POWER / SURVIVAL to survive late-game mistakes.|코어 투자가 부족합니다. 공격력과 생존력을 강화하면 후반에 더 오래 버틸 수 있습니다.
 has an unusually large share of damage. Add another attack organ or HASTE to handle crowds and bosses more reliably.|의 공격 피해 비중이 높습니다. 다른 공격 기관이나 가속 능력을 보강하면 적 무리와 보스에 더 안정적으로 대응할 수 있습니다.
Your combat performance is strong. Keep this approach to challenge higher Risk or Route Mastery.|전투 수행이 뛰어납니다. 현재 빌드를 유지하면서 높은 위험도와 경로 숙련도에 도전해 보세요.
Your build is well balanced. Try RUN IT BACK to test it again, or NEW MUTATION to try a new approach.|균형 잡힌 빌드입니다. 같은 빌드로 재도전하거나 새로운 변이를 선택해 보세요.
APEX SIGNAL · APPROACH · CLEAR THE LANE|정점 위협 접근 중 · 공격 경로에서 벗어나세요
GENE RIFT · Approach to absorb|유전자 균열 · 접근하여 흡수
REGEN POD · +12 HP|재생 포드 · 체력 +12
DASH COOLDOWN -0.55s|대시 쿨타임 -0.55초
BOSS NEARBY · FROST TITAN · PHASE II|보스 접근 중 · FROST TITAN · 2페이즈
TITAN STRIDER · EVO READY|TITAN STRIDER · 진화 가능
CAMPAIGN CYCLE|캠페인 회차
DAMAGE ON · TAP FOR INVINCIBILITY|피해 판정 켜짐 · 누르면 무적
INVINCIBLE · TAP TO ENABLE DAMAGE|무적 켜짐 · 누르면 피해 적용
`;
for(const row of EVOLVE_V3_NARRATIVE.trim().split(/\r?\n/)){const i=row.indexOf('|');if(i>0)EXACT.set(row.slice(0,i).trim(),row.slice(i+1));}
// Carefully translated context-sensitive phrases (boss identity never translated).
const QA_V35_TEXT = String.raw`
TITAN ELIMINATED|TITAN 격파
PRESS TO CONTINUE|눌러서 계속하기
RANGED · spreading acid shots + periodic ACID MARK|원거리 공격 · 확산 산성탄을 발사하고 주기적으로 산성 표식을 부여합니다
Ranged · spreading acid shots + periodic ACID MARK|원거리 공격 · 확산 산성탄을 발사하고 주기적으로 산성 표식을 부여합니다
SHIELD · protects nearby units + periodic BARRIER PULSE|방어형 · 주변 아군을 보호하고 주기적으로 보호막 파동을 방출합니다
Shield · protects nearby units + periodic BARRIER PULSE|방어형 · 주변 아군을 보호하고 주기적으로 보호막 파동을 방출합니다
SLOW · cryo shots + telegraphed freezing beam|둔화형 · 냉각탄을 발사하며 빙결 광선 공격을 미리 예고합니다
Slow · cryo shots + telegraphed freezing beam|둔화형 · 냉각탄을 발사하며 빙결 광선 공격을 미리 예고합니다
HEAL · supports nearby units with a regenerative tether|지원형 · 재생 연결선으로 주변 아군의 체력을 회복합니다
Heal · supports nearby units with a regenerative tether|지원형 · 재생 연결선으로 주변 아군의 체력을 회복합니다
RANGED · PIERCE|원거리 · 관통
ACID · CONTROL|산성 · 제어
SWEEP · EXECUTE|휩쓸기 · 처형
MULTI HIT · ORBIT|다단 공격 · 회전
HIVE SURGE · CLEAR 5 STAGES TO UNLOCK|군체 공세 · 스테이지 5개 클리어 시 해금
`;
for(const row of QA_V35_TEXT.trim().split(/\r?\n/)){
 const i=row.indexOf('|');if(i>0)EXACT.set(row.slice(0,i).trim(),row.slice(i+1));
}

// QA v3.6: complete UI phrases take priority over token-level fallbacks.
const QA_V36_EXACT = String.raw`
ACID MAW|산성 포식구
OMEGA BLADDER|오메가 독낭
PREDATOR HEART|포식자의 심장
HUNTER REFLEX|사냥꾼의 반사신경
MUTAGEN SURGE|변이원 폭주
MORE TOXIC PROJECTILES|독성 투사체 추가
STAGE 5 TROPHY|스테이지 5 트로피
TWIN VOLLEY|쌍발 사격
GENOME CODEX|유전체 도감
GENOME LAB|유전체 연구소
MUTATIONS|변이
EVOLUTIONS|진화
APEX_FUSIONS|정점 융합
BIO_ORGANS|생체 기관
EVO MATERIAL|진화 재료
EVO PATH|진화 경로
EVO NEED|진화 조건
DISCOVERED|발견
RANGED|원거리
SHIELD|방패
SLOW|둔화
HEAL|회복
STOMP · STAGGER|내려찍기 · 경직
ALL DAMAGE|모든 공격 피해
ALL DMG|모든 공격 피해
ALL DAMAGE +8%|모든 공격 피해 +8%
AREA|공격 범위
STYLE|공격 방식
BLADES|칼날 수
BOSS NEARBY|보스 접근 중
ACID GLOB|산성탄
STAGE CLEAR|스테이지 클리어
RIFT|균열
GPU BATCH · RECOVERING|GPU 일괄 처리 · 복구 중
GPU BATCH · UNSUPPORTED|GPU 일괄 처리 · 지원되지 않음
EVOLVE organism|EVOLVE 생명체
REACH EXIT|출구로 이동
ELIMINATE|처치
HOSTILES|적
DASH FASTER|대시 재충전 가속
OFFENSE|공격형
TEMPO|기동형
ECONOMY|자원형
CONTROLLED HUNT|통제된 사냥
RECOMBINATION ZONE|유전자 재조합 지대
AGGRESSIVE DOMAIN|공격적인 영역
Fires 1 additional bio-projectile, but reduces maximum HP by up to 12 (minimum maximum HP: 60).|생체 투사체가 1개 추가됩니다. 최대 체력이 최대 12 감소하며, 최대 체력은 60 미만으로 내려가지 않습니다.
Shortens primary, acid, and tail attack cooldowns, but reduces maximum HP by up to 10 (minimum maximum HP: 60).|기본 공격·산성 공격·꼬리 공격의 쿨타임을 단축합니다. 최대 체력이 최대 10 감소하며, 최대 체력은 60 미만으로 내려가지 않습니다.
Cryogenic zone. Enemies move 12% slower, but have 4% more HP. Elite enemies gain 15% HP, and CRYO LOCK restricts the field. Pickup range +8.|냉각 지대입니다. 적의 이동 속도 -12%, 일반 적 체력 +4%, 정예 적 체력 +15%, 획득 범위 +8이 적용되며 CRYO LOCK이 전장을 제한합니다.
Recombination zone. Enemy HP +10%, elite HP +4%, pickup range +12, XP +12%, DNA +18% (plus route mastery bonuses).|재조합 지대입니다. 일반 적 체력 +10%, 정예 적 체력 +4%, 획득 범위 +12, XP +12%, DNA +18%가 적용됩니다. 경로 숙련도 보너스는 별도 적용됩니다.
Extreme-heat zone. Player damage +12%, enemy damage +10%, enemy speed +9%, enemy HP +4%, elite HP +8%, and DNA gain +12% (plus route mastery bonuses).|고열 지대입니다. 내 공격 피해 +12%, 적 공격 피해 +10%, 적 이동 속도 +9%, 일반 적 체력 +4%, 정예 적 체력 +8%, DNA 획득량 +12%가 적용됩니다. 경로 숙련도 보너스는 별도 적용됩니다.
ENEMY SPEED -12% · ELITE HP +15% · PICKUP +8|적 이동 속도 -12% · 정예 적 체력 +15% · 획득 범위 +8
XP +12% · DNA +18% · ENEMY HP +10%|XP +12% · DNA +18% · 일반 적 체력 +10%
PLAYER DAMAGE +12% · ENEMY DAMAGE +10% · ENEMY SPEED +9%|내 공격 피해 +12% · 적 공격 피해 +10% · 적 이동 속도 +9%
DAMAGE ON · TAP FOR INVINCIBILITY|피해 판정 켜짐 · 누르면 무적
INVINCIBLE · TAP TO ENABLE DAMAGE|무적 켜짐 · 누르면 피해 적용
DAMAGE ON|피해 판정 켜짐
INVINCIBLE|무적
`;
for(const row of QA_V36_EXACT.trim().split(/\r?\n/)){
 const idx=row.indexOf('|'); if(idx>0)EXACT.set(row.slice(0,idx).trim(),row.slice(idx+1));
}

const DYNAMIC_RULES = [
 [/^(.+?) · PHASE (I{1,3}|IV|V|[0-9]+)$/i,(_,name,p)=>`${translateEnglish(name)} · ${{I:1,II:2,III:3,IV:4,V:5}[p]||p}페이즈`],
 [/^(.+?) · CLEAR (\d+) STAGES? TO UNLOCK$/i,(_,label,n)=>`${translateEnglish(label)} · 스테이지 ${n}개 클리어 시 해금`],
 [/^CLEAR (\d+) STAGES? TO UNLOCK$/i,(_,n)=>`스테이지 ${n}개 클리어 시 해금`],
 [/^(.+?) · CLEAR (\d+) STAGES?$/i,(_,label,n)=>`${translateEnglish(label)} · 스테이지 ${n}개 클리어`],
 [/^ELIMINATE (\d+) HOSTILES$/i,(_,n)=>`적 ${n}마리 처치`],
 [/^REACH KILL CHAIN (\d+)$/i,(_,n)=>`연속 처치 ${n}회 달성`],
 [/^ABSORB (\d+) BIOMASS CORES?$/i,(_,n)=>`생체 코어 ${n}개 흡수`],
 [/^DISCOVERED (\d+) \/ (\d+) · ORIGIN (.+)$/i,(_,have,total,origin)=>`발견 ${have}/${total} · 기원 ${origin}`],
 [/^DISCOVERED (\d+) \/ (\d+)$/i,(_,have,total)=>`발견 ${have}/${total}`],
 [/^STAGE (\d+) TROPHY$/i,(_,n)=>`스테이지 ${n} 트로피`],
 [/^STAGE (\d+) · SECTOR (\d+) · (.+)$/i,(_,n,sector,zone)=>`스테이지 ${n} · 구역 ${sector} · ${translateEnglish(zone)}`],
 [/^NEXT STAGE · THREAT \+(\d+)% · CYCLE (\d+)$/i,(_,threat,cycle)=>`다음 스테이지 · 위협 +${threat}% · ${cycle}회차`],
 [/^(.+?) · GPU BATCH · (RECOVERING|UNSUPPORTED|ON|OFF)$/i,(_,label,v)=>`${label} · ${translateEnglish('GPU BATCH · '+v)}`],

 [/^([A-Z]+) has an unusually large share of damage\. Add another attack organ or HASTE to handle crowds and bosses more reliably\.$/,(_,organ)=>`${translateEnglish(organ)}의 공격 피해 비중이 높습니다. 다른 공격 기관이나 가속 능력을 보강하면 적 무리와 보스에 더 안정적으로 대응할 수 있습니다.`],

 [/^(.+?) · CLEAR (\d+) STAGES TO UNLOCK$/i,(_,label,n)=>`${translateEnglish(label)} · 스테이지 ${n}개 클리어 시 해금`],
 [/^(.+?) · (HASTE is low\. On your next run, prioritize TEMPO \/ DODGE to handle danger patterns\.|CORE investment is low\. Improve POWER \/ SURVIVAL to survive late-game mistakes\.)$/,(_,label,msg)=>{
   const translated=EXACT.get(msg);return translated?`${translateEnglish(label)} · ${translated}`:null;
 }],
 [/^([A-Z][A-Z0-9 ]+?) ELIMINATED$/,(_,boss)=>{
   const clean=boss.trim();return PROTECTED_STANDALONE.has(clean)?`${clean} 격파`:null;
 }],
 [/^CAMPAIGN CYCLE (\d+) · STAGE (\d+)$/i,(_,cycle,stage)=>`캠페인 ${cycle}회차 · 스테이지 ${stage}`],
 [/^NEXT OMEGA · STAGE (\d+)$/i,(_,stage)=>`다음 오메가 보스 · 스테이지 ${stage}`],
 [/^NEXT APEX · STAGE (\d+)$/i,(_,stage)=>`다음 정점 보스 · 스테이지 ${stage}`],
 [/^STAGE (\d+) REWARD ALREADY SECURED$/i,(_,stage)=>`스테이지 ${stage} 보상은 이미 획득했습니다`],
 [/^PICKUP ([+\-]?\d+(?:\.\d+)?)$/i,(_,n)=>`획득 범위 ${n}`],
 [/^ARM Lv\.(\d+)$/i,(_,n)=>`팔 Lv.${n}`],
 [/^MOUTH Lv\.(\d+)$/i,(_,n)=>`입 Lv.${n}`],
 [/^TAIL Lv\.(\d+)$/i,(_,n)=>`꼬리 Lv.${n}`],
 [/^WING Lv\.(\d+)$/i,(_,n)=>`날개 Lv.${n}`],
 [/^LEG Lv\.(\d+)$/i,(_,n)=>`다리 Lv.${n}`],
 [/^RIFT ABSORBED · ([+]?[0-9]+) DNA$/i,(_,n)=>`유전자 균열 흡수 · ${n} DNA`],
 [/^OBJECTIVE · (\d+)\/(\d+)$/i,(_,n,max)=>`목표 · ${n}/${max}`],
 [/^WAVE (\d+)$/i,(_,n)=>`웨이브 ${n}`],
 [/^BOSS NEARBY · (.+?) · PHASE (I{1,3}|IV|V|[0-9]+)$/i,(_,name,phase)=>`보스 접근 중 · ${name} · ${{I:1,II:2,III:3,IV:4,V:5}[phase]||phase}페이즈`],
 [/^SFX · (ON|OFF)$/i,(_,v)=>`효과음 · ${v==='ON'?'켜짐':'꺼짐'}`],
 [/^HAPTIC · (ON|OFF)$/i,(_,v)=>`진동 · ${v==='ON'?'켜짐':'꺼짐'}`],
 [/^CLEAR (\d+) STAGES TO UNLOCK$/i, (_,n)=>`스테이지 ${n}개 클리어 시 해금`],
 [/^CLEAR (\d+) STAGES$/i, (_,n)=>`스테이지 ${n}개 클리어`],
 [/^STAGE (\d+)$/i,(_,n)=>`스테이지 ${n}`],
 [/^RANK (\d+) \/ (\d+)$/i,(_,n,max)=>`등급 ${n}/${max}`],
 [/^RECOMBINE ×(\d+)$/i,(_,n)=>`재조합 ×${n}`],
 [/^NEMESIS DEFEATS (\d+) · MEMORY RANKS (\d+) \/ (\d+) · ONE MEMORY MAY BE EQUIPPED$/,(_,n,r,max)=>`숙적 격파 ${n}회 · 기억 강화 ${r}/${max} · 기억은 하나만 장착할 수 있습니다`],
 [/^SUCCESS · \+(\d+) BANK DNA · DAMAGE \+(\d+)%$/,(_,a,b)=>`성공 · 보관 DNA +${a} · 공격 피해 +${b}%`],
 [/^SUCCESS · \+(\d+) BANK DNA · SPEED \+(\d+)$/,(_,a,b)=>`성공 · 보관 DNA +${a} · 이동 속도 +${b}`],
 [/^SUCCESS · \+(\d+) BANK DNA · GUARANTEED RELIC$/,(_,a)=>`성공 · 보관 DNA +${a} · 유물 확정 획득`],
 [/^NEMESIS DEFEATS (\d+)$/,(_,n)=>`숙적 격파 ${n}회`],
 [/^(.+?) per rank$/i,(_,what)=>translateEnglish(what)+' · 등급당'],
 [/^(.+?) \+(\d+(?:\.\d+)?)% per rank$/i,(_,what,p)=>translateEnglish(what)+` +${p}% · 등급당`],
 [/^\+(\d+) GENOME DNA BANKED(?: · SKILL \+(\d+))?$/,(_,n,s)=>`유전체 DNA +${n} 보관`+(s?` · 기술 보너스 +${s}`:'')],
];
const SUBSTITUTIONS = [
 ['CAMPAIGN CYCLE','캠페인 회차'],['NEXT OMEGA','다음 오메가 보스'],['NEXT APEX','다음 정점 보스'],
 ['GENE RESONANCE','유전자 공명'],['GENE RIFT','유전자 균열'],['RIFT ABSORBED','균열 흡수 완료'],
 ['WARNING','경고'],['APPROACHING','접근 중'],['THE LANE','진행 경로'],['OBJECTIVE','목표'],
 ['END EVOLUTION','진화 종료'],['HORDES','적 무리'],['DAMAGE','피해량'],['UNSUPPORTED','지원되지 않음'],
 ['PRESS E','E 키 누르기'],['RESIST','저항력'],['FPS','FPS'],['CAMPAIGN','캠페인'],
 ['ASCEND:','각성 형태:'],['EVO READY','진화 가능'],['EVO COMPLETE','진화 완료'],
 ['GENE RIFT','유전자 균열'],['REGEN POD','재생 포드'],['APEX SIGNAL','정점 위협 신호'],
 ['BOSS NEARBY','보스 접근 중'],['REGEN POD','재생 포드'],['APEX SIGNAL','정점 위협 신호'],['PHASE III','3페이즈'],['PHASE II','2페이즈'],['PHASE I','1페이즈'],
 ['PER RANK','등급당'],['HIVE SURGE','군체 공세'],['HUNT PACK','추격 군집'],
 ['GPU BATCH','GPU 일괄 처리'],['FORCE NEXT BOSS PHASE','보스 다음 단계 강제 전환'],
 ['NEW MUTATION','새 변이 시작'],['DOMINANT MUTATION','주요 변이'],['NEW ACTIVE','신규 액티브'],
 ['EVO MATERIAL','진화 재료'],['EVO PATH','진화 경로'],['EVO NEED','진화 조건'],
 ['DAMAGE ON','피해 켜짐'],['NEARBY','접근 중'],

 ['STARTING ORGANISM','시작 생명체'], ['EVOLUTION UNLOCK PATH','진화 해금 경로'],
 ['GENOME LAB','유전체 연구소'], ['CORE ABSORPTION','코어 흡수'],
 ['PERFECT EVASION','완벽 회피'], ['FINAL BOSS','최종 보스'],
 ['MID-BOSS','중간 보스'], ['REROLL','다시 뽑기'],
 ['THREAT','위협'], ['MILESTONE','주요 단계'], ['REWARD','보상'], ['ADAPTATION','적응'], ['ENEMY','적'], ['FOCUS','집중 공격'],
 ['HUNTER','사냥꾼'], ['ORGANISM','생명체'], ['SECURED','확보'],
 ['EXTRACTED','추출'], ['ABSORBED','흡수'], ['COLLAPSED','붕괴'],
 ['DETECTED','발견'], ['CLEARED','클리어'], ['FAILED','실패'],
 ['DEFEATED','격파'], ['CHOOSE','선택'], ['COMPLETED','완료'],
 ['COMPLETE','완료'], ['DAMAGE NUMBERS','피해량 표시'],
 ['DAMAGE RESIST','피해 저항'], ['DAMAGE TAKEN','받는 피해'],
 ['ATTACK SPEED','공격 속도'], ['MOVE SPEED','이동 속도'],
 ['PLAYER DAMAGE','플레이어 피해'], ['ENEMY DAMAGE','적 공격력'],
 ['ENEMY SPEED','적 이동 속도'], ['ENEMY HP','적 체력'],
 ['HP REGEN','체력 재생'], ['MAX HP','최대 체력'], ['ALL DAMAGE','모든 공격 피해'],
 ['ACID DAMAGE','산성 피해'], ['TAIL DAMAGE','꼬리 공격 피해'],
 ['ARM DAMAGE','팔 공격 피해'], ['ORGAN QUALITY','기관 품질'],
 ['PICKUP RANGE','획득 범위'], ['BIO ACTIVE','BIO 액티브'],
 ['ELITE','정예'], ['BOSS','보스'], ['NEMESIS','숙적'],
 ['SECTOR','구역'], ['STAGE','스테이지'], ['CLEAR','클리어'], ['WAVE','웨이브'],
 ['CYCLE','사이클'], ['LEVEL','레벨'], ['CHAIN','연속'],
 ['KILL','처치'], ['KILLS','처치 수'], ['RELIC','유물'],
 ['MEMORY','기억'], ['APEX','정점'], ['OMEGA','오메가'],
 ['ACTIVE','액티브'], ['ORGAN','기관'], ['GENE','유전자'],
 ['MUTATION','변이'], ['EVOLUTION','진화'], ['PREDATION','포식'],
 ['SURVIVAL','생존'], ['PREDATOR','포식자'], ['DEFENSE','방어'],
 ['ARMOR','방어력'], ['SHIELD','방패'], ['SPEED','속도'],
 ['HEALTH','체력'], ['DMG','피해'], ['DASH','대시'],
 ['HEAL','회복'], ['REGEN','재생'], ['COOLDOWN','쿨타임'],
 ['RANKS','등급'], ['RANK','등급'], ['STREAK','연속'], ['BONUS','보너스'],
 ['UPGRADE','강화'], ['UNLOCKED','해금'], ['LOCKED','잠김'],
 ['SELECTED','선택됨'], ['EQUIPPED','장착됨'], ['BARRIERS','보호막'],
 ['HAPTIC','진동'], ['SHAKE','흔들림'], ['GRAPHICS','그래픽'],
 ['AUTO','자동'], ['QUALITY','품질'], ['NORMAL','보통'],
 ['HIGH','높음'], ['LOW','낮음'], ['FULL','최대'],
 ['MAX','최대'], ['NONE','없음'], ['UNKNOWN','알 수 없음'],
 ['READY','준비 완료'], ['PRESS','누르기'], ['TAP','터치'],
 ['ENTER','진입'], ['RETURN','돌아가기'], ['ATTACK','공격'],
 ['MOVE','이동'], ['ABSORB','흡수'], ['EXPOSED','노출'],
 ['NEST','둥지'], ['CORE','코어'], ['DNA','DNA'],
 ['FROST','빙결'], ['TOXIC','독성'], ['ACID','산성'],
 ['VOID','공허'], ['CRYO','냉각'], ['INFERNO','화염'],
 ['FACILITY','시설'], ['CULTIVATION','배양'], ['DISPOSAL','폐기'],
 ['TITAN','타이탄'], ['BIOMASS','생체 물질'], ['CELL','세포'],
 ['HUNT','사냥'], ['BUILD','빌드'], ['BASE','기본'],
 ['DOUBLE','2중'], ['TRIPLE','3중'], ['PERFECT','완벽'],
 ['RAPID','신속'], ['FINAL','최종'], ['PROGRESS','진행도'],
 ['CONTRACT','계약'], ['FUSION','융합'], ['SWARM','군집'],
 ['SLOW','둔화'], ['REPEAT','반복'], ['RANGED','원거리'],
 ['BRUTE','BRUTE'], ['ECO','절전'], ['HARD','어려움'],
 ['OFF','꺼짐'], ['ON','켜짐']
].sort((a,b)=>b[0].length-a[0].length);
const REGEX_SUB = SUBSTITUTIONS.map(([en,ko])=>[new RegExp('(?<![A-Za-z])'+en.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?![A-Za-z])','g'),ko]);
let lang;
try {lang=localStorage.getItem(STORAGE_KEY)==='ko'?'ko':'en';} catch(_) {lang='en';}
const translationsCache = new Map();
function translateEnglish(text) {
 if(typeof text!=='string'||!/[A-Za-z]/.test(text))return text;
 const cached=translationsCache.get(text);if(cached!==undefined)return cached;
 const match=text.match(/^(\s*)([\s\S]*?)(\s*)$/);
 const middle=match?match[2]:text;
 let ko;
 // EVOLVE is the game's title; EVOLVED is a past-participle result status.
 // Character/boss proper names and the TAP TO CONTINUE prompt are immutable.
 if(PROTECTED_STANDALONE.has(middle)) ko=middle;
 else {
   ko=EXACT.get(middle);
   if(ko===undefined){
     for(const [pattern,render] of DYNAMIC_RULES){
       const matched=middle.match(pattern);
       if(matched){const translated=render(...matched);if(typeof translated==='string'){ko=translated;break;}}
     }
   }
   if(ko===undefined){
     // Mask embedded boss and character names so word-by-word rules cannot
     // turn FROST TITAN into 빙결 타이탄 or OMEGA SPITTER into 오메가 ...
     const names=[];
     let masked=maskGameNames(middle,names);
     ko=masked;
     // Never splice Korean phrases with English word substitutions.
     // Source UI data is normalized into complete English phrases at install time.
     if(!/[가-힣]/.test(masked))for(const [re,to] of REGEX_SUB)ko=ko.replace(re,to);
     ko=ko.replace(/\s{3,}/g,'  ').replace(/\uE100(\d+)\uE101/g,(_,i)=>names[+i]||'');
   }
 }
 const result=(match?match[1]:'')+ko+(match?match[3]:'');
 if(translationsCache.size>4096)translationsCache.clear();
 translationsCache.set(text,result);return result;
}
function translate(text){return lang==='ko'?translateEnglish(text):text;}
const textRecord=new WeakMap();
const attrRecord=new WeakMap();
const attrNames=['title','placeholder','aria-label','alt'];
function acceptable(node){
 const p=node.nodeType===3?node.parentElement:node;
 return p && !p.closest(DISALLOWED) && (p===ROOT||ROOT.contains(p));
}
function updateTextNode(node) {
 if(!node||node.nodeType!==3||!acceptable(node))return;
 const value=node.nodeValue;
 if(!value||!/[A-Za-z가-힣]/.test(value))return;
 let r=textRecord.get(node);
 if(!r){r={en:value,last:null};textRecord.set(node,r);}
 else if(value!==r.last && value!==r.en){r.en=value;}
 const rendered=translate(r.en);
 r.last=rendered;
 if(rendered!==value)node.nodeValue=rendered;
}
// UI-driven image lookup must read the original English descriptor even while
// localized labels are on screen. This is read-only and does not change cards.
function originalText(root){
 if(!root)return '';
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
 let n,buf='';while((n=walker.nextNode())){const r=textRecord.get(n);buf+=(r?r.en:n.nodeValue);}
 return buf;
}
function updateAttrs(node){
 if(!node||node.nodeType!==1||!acceptable(node))return;
 for(const key of attrNames){
  if(!node.hasAttribute(key))continue;
  const v=node.getAttribute(key);let rec=attrRecord.get(node);if(!rec){rec={};attrRecord.set(node,rec);}
  let state=rec[key];if(!state){state={en:v,last:null};rec[key]=state;}
  else if(v!==state.last && v!==state.en){state.en=v;}
  const rendered=translate(state.en);state.last=rendered;
  if(rendered!==v)node.setAttribute(key,rendered);
 }
}
function updateSubtree(node){
 if(!node)return;
 if(node.nodeType===3){updateTextNode(node);return;}
 if(node.nodeType!==1||!acceptable(node))return;
 updateAttrs(node);
 const walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT,{
  acceptNode(n){return acceptable(n)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;}
 });
 let current;while((current=walker.nextNode())){if(current.nodeType===3)updateTextNode(current);else updateAttrs(current);}
}
// MutationObserver fires in the microtask checkpoint *before* the browser paints.
// Apply translations in this same checkpoint: delaying 45ms made each frame
// alternate between English source labels and translated Korean labels.
// Own translations are idempotent and cannot start an update loop.
let observer=null;
function monitor(){
 observer=new MutationObserver(records=>{
  for(const m of records){
   if(m.type==='characterData')updateTextNode(m.target);
   else if(m.type==='attributes')updateAttrs(m.target);
   else for(const n of m.addedNodes)updateSubtree(n);
  }
 });
 observer.observe(ROOT,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:attrNames});
}
function installCanvasTranslator(){
 if(typeof CanvasRenderingContext2D==='undefined')return;
 const proto=CanvasRenderingContext2D.prototype;
 for(const method of ['fillText','strokeText','measureText']){
  const original=proto[method];if(typeof original!=='function'||original.__evolveI18N)continue;
  const wrapped=function(label,...args){return original.call(this,typeof label==='string'?translate(label):label,...args);};
  wrapped.__evolveI18N=true;
  proto[method]=wrapped;
 }
}

function installNativeDialogs(){
 const nativePrompt=window.prompt;
 if(typeof nativePrompt!=='function'||nativePrompt.__evolveLocalized)return;
 const allowed=new Set(['COPY SAVE DATA','PASTE EVOLVE SAVE DATA']);
 const wrapped=function(message,...args){
   const label=String(message);
   return nativePrompt.call(window,lang==='ko'&&allowed.has(label)?translateEnglish(label):message,...args);
 };
 wrapped.__evolveLocalized=true;
 window.prompt=wrapped;
}

function installLanguageUi(){
 if(document.getElementById('evolveLangSelect'))return;
 const panel=document.getElementById('settingsPanel');if(!panel)return;
 const div=document.createElement('div');div.className='settingsSection evolveLangSection';div.id='evolveLangSelect';
 div.innerHTML='<h3 data-i18n-ignore>LANGUAGE / 언어</h3><div class="evolveLangGrid" role="group" aria-label="Language / 언어"><button type="button" class="evolveLangButton" data-evolve-lang="en">English</button><button type="button" class="evolveLangButton" data-evolve-lang="ko">한국어</button></div>';
 const first=panel.querySelector('.settingsSection');if(first)panel.insertBefore(div,first);else panel.appendChild(div);
 div.addEventListener('click',e=>{const b=e.target.closest('[data-evolve-lang]');if(b)setLanguage(b.dataset.evolveLang);});
 updateSelected();
}
function updateSelected(){
 document.documentElement.lang=lang;
 document.documentElement.dataset.evolveLang=lang;
 document.querySelectorAll('[data-evolve-lang]').forEach(el=>{
  const active=el.dataset.evolveLang===lang;
  el.classList.toggle('active',active);el.setAttribute('aria-pressed',String(active));
 });
}
function setLanguage(next){
 lang=next==='ko'?'ko':'en';
 try{localStorage.setItem(STORAGE_KEY,lang);}catch(_){}
 updateSelected();
 // Full pass is needed when changing language; routine game updates use incremental passes.
 updateSubtree(ROOT);
 const msg=document.getElementById('settingsStatus');
 if(msg){msg.textContent=lang==='ko'?'언어가 한국어로 변경되었습니다. 자동으로 저장됩니다.':'Language changed to English. Saved automatically.';}
 if(typeof window.syncDamageButtonV489==='function')window.syncDamageButtonV489();
 if(typeof window.refreshEvolveHomeV522==='function')window.refreshEvolveHomeV522();
 return lang;
}
const css=document.createElement('style');css.id='evolveLangStyles';
css.textContent=`
 html[data-evolve-lang="ko"] .endBuildAnalysis, html[data-evolve-lang="ko"] #endBuildAnalysis,
 html[data-evolve-lang="ko"] #endAdaptation,html[data-evolve-lang="ko"] #endEvolutionPath{overflow-wrap:anywhere;word-break:keep-all}
 html[data-evolve-lang="ko"] .cardTitle, html[data-evolve-lang="ko"] .rewardTitle{letter-spacing:0;word-break:keep-all;overflow-wrap:anywhere}
 html[data-evolve-lang="ko"] .cardTag,html[data-evolve-lang="ko"] .rewardTag{letter-spacing:0;overflow-wrap:anywhere}
 html[data-evolve-lang="ko"] .endTitle{letter-spacing:0!important}
 html[data-evolve-lang="ko"] #stressPanelV424 .stressBtnV424{letter-spacing:0;line-height:1.2;overflow-wrap:anywhere}

 /* On small screens the entire dialog, including actions, must remain reachable. */
 #endOverlay{overflow-x:hidden;overflow-y:auto;align-items:safe center;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}
 #endOverlay>.endBox{flex:0 0 auto;max-width:min(100%,420px);margin:0 auto}
 #routeOverlay{overflow-y:auto;align-items:safe center;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}
 #routeOverlay>#routePanel{flex:0 0 auto;min-width:0;margin:0 auto}
 @media(max-height:600px){#endOverlay{padding:14px 12px calc(18px + var(--safeB))}#routeOverlay{padding:calc(18px + var(--safeT)) 12px calc(14px + var(--safeB))}}
 @media(max-height:420px){#routeOverlay #routeCards{grid-template-columns:repeat(3,minmax(0,1fr));gap:5px}#routeOverlay .routeCard{min-height:0;padding:6px}#routeOverlay .routeHead h2{font-size:21px}}

 .evolveLangSection .evolveLangGrid{display:grid;grid-template-columns:1fr 1fr;gap:7px}
 .evolveLangSection h3{font-size:10px!important;letter-spacing:.10em!important;color:#ceeaff!important}
 .evolveLangButton{height:45px;min-width:0;border:1px solid #3c5363;border-radius:9px;background:#101923;color:#c4d6e3;font-size:12px;font-weight:900;letter-spacing:.015em;touch-action:manipulation}
 .evolveLangButton.active{background:linear-gradient(180deg,#154456,#0a2533);border-color:#61d1ee;box-shadow:inset 0 0 17px #4ac1ee22,0 0 12px #23d6fd18;color:#fff}
 html[data-evolve-lang="ko"] #settingsBtn::after{content:'설정'!important;letter-spacing:0}
 html[data-evolve-lang="ko"] #memoryBtn::after{content:'기억'!important;letter-spacing:0}
 html[data-evolve-lang="ko"] #codexBtn::after{content:'도감'!important;letter-spacing:0}
 html[data-evolve-lang="ko"] .originCard.selected::after{content:'선택됨'!important}
 html[data-evolve-lang="ko"] .memoryCard.selected::after{content:'장착됨'!important}
 html[data-evolve-lang="ko"] .contractCard[data-contract="exterminate"] .contractIcon::after{content:'사냥'!important}
 html[data-evolve-lang="ko"] .contractCard[data-contract="predator"] .contractIcon::after{content:'연속'!important}
 html[data-evolve-lang="ko"] .contractCard[data-contract="harvest"] .contractIcon::after{content:'흡수'!important}
 html[data-evolve-lang="ko"] #posterHero::after{content:'개체 // 생체 무기 활성'!important;letter-spacing:.08em!important}
 html[data-evolve-lang="ko"] #poster::before{content:'EVOLVE · 생존 프로토콜'!important}
 html[data-evolve-lang="ko"] .part.dominant::before{content:'주력'!important;letter-spacing:0}
 html[data-evolve-lang="ko"] .settingsSection h3{letter-spacing:.075em;font-size:10px}
 html[data-evolve-lang="ko"] .settingsSection .settingBtn{font-size:10px;line-height:1.3;letter-spacing:0;overflow-wrap:anywhere}
 html[data-evolve-lang="ko"] .settingsSub{font-size:9px;letter-spacing:.035em}
 html[data-evolve-lang="ko"] #settingsStatus{font-size:9px;line-height:1.35}
 @media(max-width:390px){html[data-evolve-lang="ko"] .settingsSection .settingBtn{font-size:9px}}
 html[data-evolve-lang="ko"] .settingsGrid .settingBtn{letter-spacing:0;font-size:10px;line-height:1.3;white-space:normal;overflow-wrap:anywhere}
 html[data-evolve-lang="ko"] .contractCard h3, html[data-evolve-lang="ko"] .originCard b{letter-spacing:0}
 @media(max-width:390px){html[data-evolve-lang="ko"] .settingsGrid .settingBtn{font-size:9px}}
`;
document.head.appendChild(css);
installCanvasTranslator();
installNativeDialogs();
installLanguageUi();
updateSelected();
updateSubtree(ROOT);
monitor();
window.EVOLVE_I18N={installed:true,version:'3.6',getLanguage:()=>lang,setLanguage,translateEnglish,originalText,storageKey:STORAGE_KEY,protectedNames:[...PROTECTED_STANDALONE],
 audit:(values)=>values.map(en=>({en,ko:translateEnglish(en),untranslated:en===translateEnglish(en)}))};
if(typeof window.refreshEvolveHomeV522==='function')window.refreshEvolveHomeV522();
})();
