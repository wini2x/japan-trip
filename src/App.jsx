import { useState } from 'react'
import Hero from './components/Hero.jsx'
import Sidebar from './components/Sidebar.jsx'
import BottomNav from './components/BottomNav.jsx'
import Timeline from './components/Timeline.jsx'
import MapView from './components/MapView.jsx'
import Gallery from './components/Gallery.jsx'
import Favorites from './components/Favorites.jsx'
import { tripData } from './data/tripData.js'

export default function App() {
  const [showHero, setShowHero] = useState(true)
  const [activeTab, setActiveTab] = useState('timeline')
  const [activeDay, setActiveDay] = useState(1)
  const [closeSignal, setCloseSignal] = useState(0)

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setCloseSignal(s => s + 1)
  }

  if (showHero) {
    return <Hero onEnter={() => setShowHero(false)} />
  }

  return (
    <div className="fixed inset-0 flex" style={{ background: '#F5F5F8' }}>

      {/* ── PC: 사이드바 ── */}
      <Sidebar
        active={activeTab}
        onChange={handleTabChange}
        activeDay={activeDay}
        onDayChange={setActiveDay}
      />

      {/* ── 메인 영역 ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* 모바일 전용 헤더 */}
        <header
          className="flex-shrink-0 flex items-center justify-between px-5 py-3 bg-white border-b border-gray-100 md:hidden"
          style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}
        >
          <div>
            <h1 className="font-serif font-bold text-gray-800 leading-none"
              style={{ fontSize: '1.05rem' }}>
              {tripData.title}
            </h1>
            <p className="text-gray-400 text-xs mt-0.5">{tripData.dates}</p>
          </div>
          <button onClick={() => setShowHero(true)} className="text-2xl" title="인트로로">
            🌸
          </button>
        </header>

        {/* 콘텐츠 */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'timeline' && (
            <Timeline activeDay={activeDay} onDayChange={setActiveDay} />
          )}
          {activeTab === 'map' && <MapView />}
          {activeTab === 'gallery' && <Gallery closeSignal={closeSignal} />}
          {activeTab === 'favorites' && <Favorites closeSignal={closeSignal} />}
        </div>

        {/* 모바일 전용 하단 탭 — z-[60]으로 라이트박스(z-50) 위에 유지 */}
        <div className="md:hidden flex-shrink-0" style={{ position: 'relative', zIndex: 60 }}>
          <BottomNav active={activeTab} onChange={handleTabChange} />
        </div>
      </div>
    </div>
  )
}
