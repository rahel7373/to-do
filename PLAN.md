# 할 일 관리 웹 PLAN

## 1. 개요
로그인 없이 쓰는 개인용 할 일 관리 웹앱. 화면은 한국어.

## 2. 기술 스택
- Next.js (JavaScript, App Router)
- 순수 CSS (CSS Modules)
- 데이터 저장: 브라우저 localStorage (서버·DB 없음)

## 3. 범위

### [1차]
- 할 일 추가
- 목록 보기
- 삭제

### [추가]
- 완료 체크 (완료 시 취소선)
- 마감일
  - 입력은 선택 사항 (비워둘 수 있음)
  - 마감일 순 정렬 (마감일 없는 항목은 맨 아래)
  - 기한이 지난 미완료 항목 강조 (빨간색 등)
  - D-day 표시 ("오늘", "D-3", "D+2")

### 하지 않을 것
- 로그인
- 공유
- 수정 (제목·마감일 변경). 잘못 입력하면 삭제 후 다시 등록

## 4. 데이터 모델
```js
{ id, title, done, dueDate /* 'YYYY-MM-DD' | null */, createdAt }
```
배열 전체를 localStorage 키 하나에 JSON으로 저장한다.

## 5. 구조 (App Router)
- `app/page.js` — 메인 화면 (클라이언트 컴포넌트)
- `app/layout.js`, `app/globals.css`
- 컴포넌트: `TodoForm`, `TodoList`, `TodoItem`
- 유틸: localStorage 읽기/쓰기, D-day 계산, 정렬
- SSR 때는 localStorage에 접근할 수 없으므로 마운트 후에 불러온다.

## 6. 단계별 작업
1. 프로젝트 초기화 (create-next-app, JavaScript, App Router)
2. [1차] 추가·목록·삭제 + localStorage 저장
3. [추가] 완료 체크·취소선
4. [추가] 마감일 입력·정렬·기한 지남 강조·D-day
5. 다듬기: 빈 목록 문구, 빈 제목 입력 방지

## 7. 검증
`npm run dev`로 실행해 수동 확인한다.
- 추가·삭제·완료 체크
- 새로고침 후에도 데이터 유지
- 마감일 정렬, D-day 표시, 기한 지남 강조
- 빈 제목은 추가되지 않음
