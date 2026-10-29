# EVOLVE 캐릭터·코어·무기 적용 FAST DELTA

현재 공개 게임: V629 PRIORITY. 이 문서는 게임을 수정하는 것이 아니라, 캐릭터 적용 시 전송·재패키징·검사 병목을 줄이는 작업 절차이다.

## 1. 최초에 단 한 번 확인

1. AGENTS.md와 EVOLVE_CURRENT_STATE.md를 읽고 GitHub main 최신 SHA를 확인한다.
2. dist/verification.json의 활성 엔진과 web/bio-core-art-v625.json의 **정확한 SHA-256 이미지 경로**만 읽는다.
3. Work 환경에서 ZIP이 안 보이더라도 GitHub 파일이 없다고 단정하지 않는다. main:dist/assets 및 backup/biocore-v625-assets-uploaded-20261029부터 확인한다.
4. 신규 이미지가 GitHub 백업 브랜치에 이미 있으면 Git blob SHA를 재사용한다. 원본 이미지 재업로드나 Base64 전송은 하지 않는다.

## 2. 실제 증분 캐릭터 적용

작업 도구: tools/character_delta_apply.py

* --mode inspect: manifest/인수인계/등록 이미지 메타데이터만 확인한다. 엔진이나 이미지 바이트를 가져오지 않는다. 새 이미지가 별도 Git 백업에 있다면 --image-ref <브랜치>로 기존 이미지 Git blob SHA를 찾아 재사용 계획을 만든다.
* --mode prepare --suffix CHAR630 --output-dir <격리된 작업폴더>: 현재 Git HEAD 또는 --baseline-ref <기준커밋>의 **현재 활성 엔진 하나**(약 1.7MiB)만 불러와 캐릭터 소스 모듈의 변경 전후를 대조한다. 원본 모듈이 정확히 한 번 일치해야 적용하며, 엔진의 다른 부분을 바꾸지 않았는지 되돌리기 검증을 수행한다.
* 변경이 없으면 status: unchanged로 종료하고 새 엔진 파일을 만들거나 중복 검사하지 않는다.
* 변경이 있으면 작은 스테이징 폴더에 새 엔진, index.html, version.json, asset-manifest.json, verification.json만 출력한다. dist 원본을 직접 덮어쓰거나 배포하지 않는다.

새 이미지가 현재 manifest에는 없고 다른 백업에만 있는 경우: --image-ref로 해당 백업의 실제 Git blob SHA를 확인한다. 스테이징 결과와 재사용 이미지 blob을 GitHub 연결 도구의 **단일 Git 트리 커밋**으로 조립한다. Git SHA와 이미지의 SHA-256은 서로 다른 해시다. 최초 업로드에서 SHA-256 검증을 통과하지 않은 파일은 재사용하지 않는다.

--baseline-ref는 이전 게임 엔진의 근거가 되는 검증된 커밋으로 선택한다. 현재 엔진에 기존 모듈이 정확히 없으면 실패 처리하고 과거 V625/V626 전체 엔진을 덮어쓰지 않는다. 386MiB 원본 파일 전체를 읽는 검사는 수행하지 않는다.

## 3. 최소 검증 + 원격 백업

* 가벼운 단위 검사: python3 -m unittest discover -s tests -p test_character_delta_apply.py -v
* 실제 프로젝트 사전 확인: python3 tools/character_delta_apply.py --mode inspect
* GitHub Actions EVOLVE fast character delta: 변경 파일만 sparse checkout하고 원본 이미지를 다운로드하지 않는다. 실제 활성 엔진 하나만 필요할 때 Git에서 읽는다.
* 중간 10%마다 원본을 다시 압축하거나 SHA 확인하지 않고 변경분/기준 SHA/복구 브랜치를 원격 백업한다.
* 100% 릴리스 직전에 **1회** 실제 게임 브라우저에서 새 캐릭터/무기/맵/저장 호환성을 확인한다. 신규 변경으로 실제 위험이 있을 때만 회귀검사를 확대한다.
* GitHub main 배포 후보가 확인되면 별도 Pages 브랜치 pages-fast-evolve-20261029의 root에 현재 dist Git 트리를 재사용해 동기화한다. 이전 Pages 상태를 원격 백업으로 남기고, native Pages 배포 성공 + 공개 버전을 확인한다.

이 도구는 이미지 생성·이미지 변경·GitHub 자동 푸시·자동 배포 기능이 아니다. 다른 EVOLVE 채팅방에서 캐릭터 적용을 시작할 때는 이 문서를 기본 절차로 사용해 동일한 검토를 반복하지 않는다.
