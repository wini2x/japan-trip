import { useState } from 'react'
import { CATEGORIES } from '../data/tripData.js'

const DAY_GRADS = [
  ['#1A4A7A', '#2980B9'],
  ['#6E2F10', '#D35400'],
  ['#7D5800', '#C9952B'],
  ['#0B4C40', '#148F77'],
  ['#6B1A28', '#8B2635'],
]

function PhotoGrid({ photos, dayId }) {
  const [errs, setErrs] = useState({})
  if (!photos || photos.length === 0) return null

  const srcs = photos.map(p => `/photos/day${dayId}/${p}`)
  const valid = srcs.filter((_, i) => !errs[i])
  if (valid.length === 0) return null

  const onErr = (i) => setErrs(e => ({ ...e, [i]: true }))

  if (srcs.length === 1) {
    return (
      <div className="overflow-hidden rounded-xl mt-3 bg-gray-100">
        <img src={srcs[0]} alt="" loading="lazy"
          className="w-full object-cover"
          style={{ aspectRatio: '4/3' }}
          onError={() => onErr(0)} />
      </div>
    )
  }
  if (srcs.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-0.5 overflow-hidden rounded-xl mt-3">
        {srcs.map((src, i) => (
          <img key={i} src={src} alt="" loading="lazy"
            className="w-full object-cover aspect-square"
            onError={() => onErr(i)} />
        ))}
      </div>
    )
  }
  return (
    <div className="grid grid-cols-2 gap-0.5 overflow-hidden rounded-xl mt-3">
      <img src={srcs[0]} alt="" loading="lazy"
        className="w-full h-full object-cover row-span-2"
        style={{ aspectRatio: '3/4' }}
        onError={() => onErr(0)} />
      <div className="grid grid-rows-2 gap-0.5">
        {srcs.slice(1, 3).map((src, i) => (
          <img key={i} src={src} alt="" loading="lazy"
            className="w-full object-cover"
            style={{ aspectRatio: '4/3' }}
            onError={() => onErr(i + 1)} />
        ))}
      </div>
    </div>
  )
}

export default function EventCard({ event, dayId, isHighlight }) {
  const cat = CATEGORIES[event.category] || CATEGORIES.SIGHTSEEING
  const grad = DAY_GRADS[(dayId - 1) % 5]
  const isCelebration = isHighlight && event.category === 'CELEBRATION'

  return (
    <div className="ml-16 mb-4 fade-in-up" style={{ animationDelay: '0.05s' }}>
      <div className="flex items-start gap-3">
        {/* Timeline dot */}
        <div className="absolute"
          style={{
            left: '2.85rem',
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: isCelebration ? '#C9952B' : cat.color,
            border: '2.5px solid white',
            boxShadow: `0 0 0 2px ${isCelebration ? '#C9952B' : cat.color}`,
            marginTop: 14,
            zIndex: 2,
          }}
        />

        {/* Post card */}
        <article
          className="flex-1 rounded-2xl overflow-hidden bg-white"
          style={{
            boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)',
            border: isCelebration ? '1.5px solid #C9952B40' : '1px solid rgba(0,0,0,0.06)',
            background: isCelebration ? 'linear-gradient(135deg, #FFFDF5, #FEF9E7)' : 'white',
          }}
        >
          {/* Card header */}
          <div className="flex items-center gap-2.5 px-4 pt-3.5 pb-2">
            {/* Day avatar */}
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${grad[0]}, ${grad[1]})` }}>
              D{dayId}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: cat.bg, color: cat.color }}>
                  {cat.emoji} {cat.label}
                </span>
                {isCelebration && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                    🎂 특별
                  </span>
                )}
              </div>
            </div>
            <span className="text-xs text-gray-400 font-mono flex-shrink-0">{event.time}</span>
          </div>

          {/* Content */}
          <div className="px-4 pb-4">
            <h3 className="font-serif font-semibold text-gray-900 leading-snug mb-1.5"
              style={{ fontSize: '1.05rem' }}>
              {event.title}
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              {event.description}
            </p>
            <PhotoGrid photos={event.photos} dayId={dayId} />
          </div>
        </article>
      </div>
    </div>
  )
}
