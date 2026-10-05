# 팀장님 지시 업무 워크클라우드 (Interactive Lecture Word Cloud)

강의 중 학습자들에게 **"팀장님께서 지시한 업무! 나는 무엇부터 할 것인가?"** 질문을 던지고, 학습자가 QR코드로 모바일 접속하여 익명으로 답변을 제출하면 실시간으로 유사 답변을 그룹화하고 빈도/공감수에 따라 폰트가 동적으로 커지는 인터랙티브 강의 플랫폼입니다.

---

## 주요 기능

1. **학습자 실시간 모바일 참여 (QR 코드)**
   - 대형 스크린의 QR코드를 카메라로 스캔하여 즉시 입장
   - 별도 회원가입/로그인/이름 입력 없이 완전 익명 제출
   - 9가지 빠른 힌트 칩 & 상세 메모 작성
   - 실시간 답변 확인 및 다른 동료 답변에 **+1 공감(Like)** 투표

2. **스마트 그룹핑 & 동적 폰트 스케일 워드클라우드**
   - 유사 답변 자동 카테고리 분류 (마감일 확인, 목적/배경 확인, 메모/요약, To-Do 분해 등)
   - 공감수 및 빈도에 따른 동적 타이포그래피 (최대 4배 확대 및 하이라이트)
   - 3가지 뷰 모드: **동적 워드클라우드 / 그룹별 카드 뷰 / 실시간 피드**

3. **강사용 제어 및 AI 분석**
   - 실시간 답변 접수 일시정지 / 재개
   - 강의 시연용 1-클릭 예시 데이터 채우기 (Seed)
   - 전체 초기화 및 결과 CSV 파일 다운로드
   - **Gemini AI 기반 심층 분석 및 강의 마무리 조언 리포트**

---

## 실행 방법 (Local Development)

```bash
# 패키지 설치
npm install

# 개발 서버 실행 (Express + Vite 통합)
npm run dev
```

서버가 실행되면 브라우저에서 `http://localhost:3000`으로 접속할 수 있습니다.

---

## Vercel 배포 가이드

본 프로젝트는 Vercel 배포를 위한 `vercel.json` 및 `api/index.ts` 설정이 완료되어 있습니다.

1. **GitHub에 저장소 생성 및 푸시**
   ```bash
   git remote add origin https://github.com/<사용자이름>/<저장소이름>.git
   git push -u origin main
   ```
2. **Vercel 연동**
   - [Vercel 대시보드](https://vercel.com/new)에 접속
   - 방금 푸시한 GitHub 저장소를 **Import**
   - 환경 변수(Environment Variables) 설정 (선택 사항):
     - `GEMINI_API_KEY`: Google AI Studio에서 발급받은 Gemini API 키 (AI 분석 기능 사용 시 필요)
   - **Deploy** 버튼 클릭
