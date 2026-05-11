# 🌸 우리 가족의 일본 여행

**2026년 봄 · 규슈 · 4박 5일 렌트카 가족 여행** 기록 앱

아소산 → 유후인 → 벳푸 → 구로카와 → 구마모토

---

## 기능

- **일정 타임라인** — 일차별 이벤트 카드 (항공, 이동, 관광, 식사, 숙소 등)
- **지도** — Leaflet 기반 장소별 핀 표시
- **갤러리** — 사진·영상 그리드, 일차/유형 필터, 라이트박스 (핀치 줌·더블탭·스와이프)
- **즐겨찾기** — ❤️ 표시한 사진·영상만 모아보기
- **반응형** — 모바일 하단 탭 / PC 좌측 사이드바

## 사진 업로드 봇

Telegram 봇으로 사진·영상을 전송하면 자동으로 앱에 반영됩니다.

- 캡션 → 사진 설명으로 저장
- 태그·❤️ 설정 가능
- 영상은 ffmpeg로 썸네일 자동 생성

## 스택

| 구분 | 기술 |
|------|------|
| 프론트엔드 | React 18 + Vite + TailwindCSS |
| 지도 | Leaflet / react-leaflet |
| 업로드 봇 | python-telegram-bot 21 + Flask |
| 서빙 | nginx |

## 로컬 실행

```bash
# 프론트엔드
npm install
npm run dev

# 텔레그램 봇
cd photo_bot
cp .env.example .env   # 봇 토큰 입력
pip install -r requirements.txt
python bot.py
```

## 구조

```
japan-trip/
├── src/
│   ├── components/     # Gallery, Timeline, MapView, Favorites, Sidebar …
│   ├── data/
│   │   └── tripData.js # 일정 데이터
│   └── App.jsx
├── photo_bot/
│   ├── bot.py          # Telegram 업로드 봇
│   └── api.py          # Flask API
└── public/
    └── photos/         # 업로드된 사진·영상 (gitignore)
```
