const TABS = [
  { id: 'timeline',  label: '일정',    emoji: '📅' },
  { id: 'map',       label: '지도',    emoji: '🗺️' },
  { id: 'gallery',   label: '갤러리',  emoji: '🖼️' },
  { id: 'favorites', label: '즐겨찾기', emoji: '❤️' },
]

export default function BottomNav({ active, onChange }) {
  return (
    <nav
      className="flex-shrink-0 bg-white border-t border-gray-100"
      style={{
        boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex">
        {TABS.map((tab) => {
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className="flex-1 flex flex-col items-center justify-center py-3 gap-1 relative"
              style={{ minHeight: 60 }}
            >
              <span className="text-2xl">{tab.emoji}</span>
              <span
                className="text-xs font-medium"
                style={{ color: isActive ? '#8B2635' : '#9CA3AF' }}
              >
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{ background: '#8B2635' }} />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
