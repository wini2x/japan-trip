import { useRef, useEffect } from 'react'
import { tripData } from '../data/tripData.js'
import EventCard from './EventCard.jsx'

function DayHeader({ day }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl mb-5 mt-2"
      style={{
        background: `linear-gradient(135deg, ${day.headerGradient[0]}, ${day.headerGradient[1]})`,
        boxShadow: day.highlight
          ? '0 4px 20px rgba(201,149,43,0.4)'
          : '0 4px 16px rgba(0,0,0,0.15)',
      }}
    >
      {/* Decorative circle */}
      <div
        className="absolute -right-8 -top-8 opacity-10 rounded-full"
        style={{ width: 100, height: 100, background: 'white' }}
      />
      <div className="relative px-5 py-4">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-xs font-bold px-2.5 py-0.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
          >
            {day.dateShort}
          </span>
          <span className="text-white/70 text-xs">{day.date}</span>
          {day.highlight && <span className="text-xl">✨</span>}
        </div>
        <h2
          className="text-white font-bold leading-tight"
          style={{
            fontFamily: 'Noto Serif KR, serif',
            fontSize: '1.2rem',
          }}
        >
          {day.title}
        </h2>
        <p className="text-white/80 text-sm mt-0.5">{day.subtitle}</p>
      </div>
    </div>
  )
}

function BirthdayBanner({ message }) {
  return (
    <div
      className="rounded-2xl px-5 py-4 mb-5 text-center"
      style={{
        background: 'linear-gradient(135deg, #7D5800, #C9952B)',
        boxShadow: '0 4px 20px rgba(201,149,43,0.35)',
      }}
    >
      <div className="text-3xl mb-2">🎂</div>
      <p
        className="text-white font-bold text-lg leading-snug"
        style={{ fontFamily: 'Noto Serif KR, serif', textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
      >
        {message}
      </p>
      <div className="flex justify-center gap-2 mt-2 text-xl">
        <span>🌸</span><span>🎊</span><span>💕</span><span>🎊</span><span>🌸</span>
      </div>
    </div>
  )
}

export default function Timeline({ activeDay, onDayChange }) {
  const scrollRef = useRef(null)
  const dayRefs = useRef({})

  // Scroll to selected day
  useEffect(() => {
    const ref = dayRefs.current[activeDay]
    if (ref && scrollRef.current) {
      const top = ref.offsetTop - 60
      scrollRef.current.scrollTo({ top, behavior: 'smooth' })
    }
  }, [activeDay])

  return (
    <div className="flex flex-col h-full">
      {/* Sticky Day Tabs */}
      <div
        className="bg-white/95 border-b border-gray-100 flex-shrink-0"
        style={{ backdropFilter: 'blur(8px)', zIndex: 100 }}
      >
        <div className="flex overflow-x-auto scrollbar-none px-2 py-2 gap-2">
          {tripData.days.map((day) => {
            const isActive = activeDay === day.id
            return (
              <button
                key={day.id}
                onClick={() => onDayChange(day.id)}
                className="flex-shrink-0 flex flex-col items-center px-4 py-2 rounded-xl transition-all duration-200"
                style={{
                  background: isActive
                    ? `linear-gradient(135deg, ${day.headerGradient[0]}, ${day.headerGradient[1]})`
                    : '#F5F0E8',
                  boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
                  minWidth: 64,
                }}
              >
                <span className="text-xs font-bold" style={{ color: isActive ? 'white' : '#9CA3AF' }}>
                  {day.dateShort}
                </span>
                <span className="text-xs" style={{ color: isActive ? 'rgba(255,255,255,0.85)' : '#9CA3AF' }}>
                  {day.date.split(' ')[0]}
                </span>
                {day.highlight && <span className="text-xs">✨</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Scrollable content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto smooth-scroll px-4 pt-4 pb-24" style={{ background: '#F5F5F8' }}>
        {tripData.days.map((day) => (
          <div
            key={day.id}
            ref={(el) => (dayRefs.current[day.id] = el)}
          >
            {/* Birthday banner for Day 3 */}
            {day.highlight && day.highlightBanner && (
              <BirthdayBanner message={day.highlightBanner} />
            )}

            <DayHeader day={day} />

            {/* Timeline events */}
            <div className="relative">
              <div className="timeline-line" />
              {day.events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  dayId={day.id}
                  isHighlight={day.highlight}
                />
              ))}
            </div>

            {/* Day separator */}
            {day.id < tripData.days.length && (
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-gray-300 text-sm">✦</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
            )}
          </div>
        ))}

        {/* Footer */}
        <div className="text-center py-8 pb-4">
          <div className="text-3xl mb-3">🌸</div>
          <p
            className="text-gray-400 text-sm leading-relaxed"
            style={{ fontFamily: 'Noto Serif KR, serif' }}
          >
            소중한 추억을 함께 만들어주셔서<br />감사하고 사랑합니다 💕
          </p>
        </div>
      </div>
    </div>
  )
}
