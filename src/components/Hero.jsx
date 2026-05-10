import { useState, useEffect } from 'react'
import { tripData } from '../data/tripData.js'

export default function Hero({ onEnter }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { setTimeout(() => setVisible(true), 100) }, [])

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center cursor-pointer select-none"
      style={{
        background: 'linear-gradient(160deg, #1A0A0E 0%, #4A1020 35%, #8B2635 65%, #C9952B 100%)',
      }}
      onClick={onEnter}
    >
      {/* Decorative cherry blossom petals */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-10"
            style={{
              width: `${20 + (i * 7) % 30}px`,
              height: `${20 + (i * 7) % 30}px`,
              background: i % 2 === 0 ? '#F8C8D0' : '#FDE8C0',
              top: `${(i * 17 + 5) % 90}%`,
              left: `${(i * 23 + 3) % 90}%`,
              transform: `rotate(${i * 30}deg)`,
            }}
          />
        ))}
      </div>

      {/* Japanese pattern top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold-dark via-gold to-gold-dark" />

      {/* Main content */}
      <div
        className="relative z-10 text-center px-8"
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(30px)', transition: 'all 0.8s ease-out' }}
      >
        {/* 벚꽃 아이콘 */}
        <div className="text-5xl mb-6">🌸</div>

        {/* 메인 타이틀 */}
        <h1
          className="text-white text-3xl font-bold leading-tight mb-2"
          style={{ fontFamily: 'Noto Serif KR, serif', textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}
        >
          우리 가족의
        </h1>
        <h1
          className="text-white text-4xl font-bold leading-tight mb-6"
          style={{ fontFamily: 'Noto Serif KR, serif', textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}
        >
          일본 여행
        </h1>

        {/* 구분선 */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-px w-16 bg-gold opacity-70" />
          <div className="text-gold text-lg">✦</div>
          <div className="h-px w-16 bg-gold opacity-70" />
        </div>

        {/* 서브 정보 */}
        <p className="text-amber-200 text-lg font-medium mb-1">
          {tripData.subtitle}
        </p>
        <p className="text-amber-300/80 text-base mb-1">
          {tripData.dates}
        </p>
        <p className="text-amber-200/70 text-sm mb-10">
          {tripData.description}
        </p>

        {/* 특별 Day 3 뱃지 */}
        <div
          className="inline-flex items-center gap-2 bg-gold/20 border border-gold/40 rounded-full px-4 py-2 mb-10"
          style={{ backdropFilter: 'blur(8px)' }}
        >
          <span className="text-base">🎂</span>
          <span className="text-amber-200 text-sm font-medium">칠순 생신 기념 여행</span>
        </div>

        {/* CTA 버튼 */}
        <div>
          <button
            className="pulse-slow bg-white/10 border-2 border-white/40 text-white rounded-full px-8 py-4 text-lg font-medium backdrop-blur-sm"
            style={{ transition: 'all 0.2s' }}
          >
            추억 열어보기 &nbsp;↓
          </button>
          <p className="text-white/40 text-xs mt-4">화면을 터치하세요</p>
        </div>
      </div>

      {/* 하단 패턴 */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-crimson-dark via-crimson to-crimson-dark" />
    </div>
  )
}
