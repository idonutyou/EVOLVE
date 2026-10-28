# EVOLVE Pages 배포 운영 규칙 (2026-10-29 KST)

공개 사이트: https://idonutyou.github.io/EVOLVE/
실제 게시 소스: `pages-fast-evolve-20261029` 브랜치의 `/(root)`.
개발 기준: `main` 브랜치의 `dist/`.

## 가장 중요한 절차

1. 개발·백업·검사를 `main`에 완료한다. 10% 복구 지점은 계속 보존한다.
2. `main:dist` Git 트리 SHA와 `pages-fast-evolve-20261029^{tree}` SHA를 비교한다. 일치하면 **아무 작업도 하지 않는다.** 불필요한 386MB Pages 빌드를 시작하지 않는다.
3. `.github/workflows/pages-release-gate.yml`은 `main/dist/**` 변경에 자동 실행되는 읽기 전용 분류 검사다. 원본 에셋, 게임 엔진, 캐릭터, 저장 데이터 또는 알 수 없는 HTML 구조 변경은 정밀 검사가 필요하다고 판정한다. 분류 결과만으로 배포 승인으로 간주하지 않는다.
4. 필요한 QA가 통과한 경우에만, 연결된 인증된 GitHub **사용자/앱**으로 Pages 브랜치의 현재 HEAD를 확인하고, 해당 HEAD를 부모로 `main:dist` 트리를 루트로 갖는 커밋을 만든다. 기대 SHA를 설정한 non-force ref 갱신으로 경쟁 업데이트를 방지하고, 이전 Pages HEAD 백업 브랜치를 유지한다. 기존 원본 이미지 Git 객체는 그대로 재사용한다.
5. GitHub Actions의 `GITHUB_TOKEN`으로 Pages 브랜치에 푸시하는 자동화는 사용하지 않는다. 그 토큰으로 푸시한 커밋은 브랜치 기반 GitHub Pages 빌드를 시작하지 않는다.
6. 새 Pages 커밋에 대해 `pages build and deployment`가 실제로 성공했는지 확인하고, 공개 URL의 `version.json`, `index.html`, 변경된 파일을 검증한다. 공개 반영 전까지 '배포 완료'로 표시하지 않는다.

## 중복 작업 정리

- `.github/workflows/deploy-pages.yml`은 이제 **수동 전체 정밀검사 전용**이다. Pages 업로드·게시 권한이나 `main` 자동 트리거가 없다.
- 이전 `test-migration.yml`은 최초 설치·추출 관련 코드가 변경될 때만 실행한다. 단순 상점/수익화/게임 테스트 추가만으로 원본 추출 정밀검사를 반복하지 않는다.
- 원본 이미지 해시, 엔진, 게임 저장 시스템은 최적화 명목으로 바꾸지 않는다. 캐릭터 디자인/애니메이션 적용은 위험도가 높아 충분한 전투·이미지·기존 세이브 회귀검사를 먼저 실시한다.
- GitHub Pages 자체가 전체 정적 파일을 가져오고 게시하므로 게시 시간은 일정하지 않다. 이번 정리는 **불필요한 빌드 자체를 생략**하여 총 작업 시간을 줄인다.

## 자동화의 범위

브랜치 차이 감지는 GitHub Actions가 자동 수행한다. 실제 게시 브랜치 갱신은 사용자가 연결한 GitHub 도구를 통해 릴리스 시점에 수행한다. 완전 무인 자동 배포는 권한이 있는 GitHub App 또는 별도 토큰을 설정하기 전에는 제공한다고 주장하지 않는다.
