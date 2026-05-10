import { tripData } from '../data/tripData.js'

const NAV_TABS = [
  { id: 'timeline',  label: '일정',    emoji: '📅' },
  { id: 'map',       label: '지도',    emoji: '🗺️' },
  { id: 'gallery',   label: '갤러리',  emoji: '🖼️' },
  { id: 'favorites', label: '즐겨찾기', emoji: '❤️' },
]

const DAY_SUBTITLES = {
  1: '아소산·유후인',
  2: '벳푸',
  3: '칠순 생신 ✨',
  4: '구로카와·구마모토',
  5: '귀국',
}

export default function Sidebar({ active, onChange, activeDay, onDayChange }) {
  return (
    <aside
      className="hidden md:flex flex-col flex-shrink-0 bg-white border-r border-gray-100"
      style={{ width: 200, boxShadow: '2px 0 12px rgba(0,0,0,0.04)' }}
    >
      {/* 앱 제목 */}
      <div className="px-5 py-5 border-b border-gray-100">
        <button onClick={() => {}} className="text-left w-full">
          <h1 className="font-bold text-gray-800 leading-tight"
            style={{ fontFamily: 'Noto Serif KR, serif', fontSize: '0.95rem' }}>
            {tripData.title}
          </h1>
          <p className="text-gray-400 text-xs mt-0.5">{tripData.dates}</p>
        </button>
      </div>

      {/* 탭 네비 */}
      <nav className="px-3 py-3 flex flex-col gap-0.5">
        {NAV_TABS.map(tab => {
          const on = active === tab.id
          return (
            <button key={tab.id} onClick={() => onChange(tab.id)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-left transition-colors"
              style={{
                background: on ? '#FEF0F2' : 'transparent',
                color: on ? '#8B2635' : '#6B7280',
              }}>
              <span style={{ fontSize: 16 }}>{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
          )
        })}
      </nav>

      {/* 일차 목록 */}
      <div className="px-3 pt-1 border-t border-gray-100 mt-1">
        <p className="text-xs text-gray-400 px-3 py-2 font-medium">일차별</p>
        {tripData.days.map(d => {
          const on = active === 'timeline' && activeDay === d.id
          return (
            <button key={d.id}
              onClick={() => { onChange('timeline'); onDayChange(d.id) }}
              className="flex flex-col px-3 py-2 rounded-xl w-full text-left transition-colors"
              style={{
                background: on ? '#FEF0F2' : 'transparent',
                color: on ? '#8B2635' : '#374151',
              }}>
              <span className="text-xs font-bold">Day {d.id}</span>
              <span className="text-xs mt-0.5 truncate"
                style={{ color: on ? '#8B263580' : '#9CA3AF' }}>
                {DAY_SUBTITLES[d.id]}
              </span>
            </button>
          )
        })}
      </div>

      {/* 하단 여백 */}
      <div className="flex-1" />
      <div className="px-5 py-4 border-t border-gray-50">
        <p className="text-xs text-gray-300 text-center">🌸 소중한 추억</p>
      </div>
    </aside>
  )
}
