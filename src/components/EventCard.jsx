import { useState } from 'react'
import { CATEGORIES } from '../data/tripData.js'

function PhotoSlot({ src, caption, dayId }) {
  const [err, setErr] = useState(false)
  const gradients = [
    'linear-gradient(135deg, #1A4A7A, #2980B9)',
    'linear-gradient(135deg, #6E2F10, #D35400)',
    'linear-gradient(135deg, #7D5800, #C9952B)',
    'linear-gradient(135deg, #0B4C40, #148F77)',
    'linear-gradient(135deg, #6B1A28, #8B2635)',
  ]
  if (!src || err) {
    return (
      <div
        className="rounded-xl flex items-center justify-center text-white/60 text-xs"
        style={{ width: 120, height: 90, minWidth: 120, background: gradients[(dayId - 1) % 5] }}
      >
        📷 사진 추가 예정
      </div>
    )
  }
  return (
    <div className="rounded-xl overflow-hidden" style={{ width: 120, height: 90, minWidth: 120 }}>
      <img src={src} alt={caption} className="w-full h-full object-cover" onError={() => setErr(true)} />
    </div>
  )
}

export default function EventCard({ event, dayId, isHighlight }) {
  const cat = CATEGORIES[event.category] || CATEGORIES.SIGHTSEEING
  const hasPhotos = event.photos && event.photos.length > 0

  return (
    <div
      className="ml-16 mb-5 fade-in-up"
      style={{ animationDelay: '0.05s' }}
    >
      {/* Time badge — floated left of the card, aligned to timeline dot */}
      <div className="flex items-start gap-3">
        {/* Dot on timeline */}
        <div
          className="absolute"
          style={{
            left: '2.85rem',
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: isHighlight ? '#C9952B' : cat.color,
            border: '3px solid white',
            boxShadow: `0 0 0 2px ${isHighlight ? '#C9952B' : cat.color}`,
            marginTop: 4,
            zIndex: 2,
          }}
        />

        {/* Card body */}
        <div
          className="flex-1 rounded-2xl overflow-hidden"
          style={{
            background: isHighlight && event.category === 'CELEBRATION'
              ? 'linear-gradient(135deg, #FEF9E7, #FFF3CD)'
              : 'white',
            boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
            border: isHighlight && event.category === 'CELEBRATION'
              ? '1.5px solid #C9952B40'
              : '1.5px solid #F0EBE3',
          }}
        >
          {/* Category + time strip */}
          <div
            className="flex items-center justify-between px-4 py-2"
            style={{ background: cat.bg, borderBottom: `2px solid ${cat.color}20` }}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{cat.emoji}</span>
              <span className="text-xs font-semibold" style={{ color: cat.color }}>
                {cat.label}
              </span>
            </div>
            <span className="text-xs text-gray-400 font-mono">{event.time}</span>
          </div>

          {/* Content */}
          <div className="px-4 py-3">
            <h3
              className="font-bold text-gray-800 leading-snug mb-1"
              style={{ fontSize: '1.05rem' }}
            >
              {event.title}
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              {event.description}
            </p>

            {/* Photos */}
            {hasPhotos && (
              <div className="photo-scroll mt-3">
                {event.photos.map((photo, i) => (
                  <PhotoSlot key={i} src={`/photos/day${dayId}/${photo}`} caption={photo} dayId={dayId} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
