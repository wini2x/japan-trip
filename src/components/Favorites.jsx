import { useState, useEffect, useCallback, useRef } from 'react'
import { tripData } from '../data/tripData.js'

const DAY_NAMES = {
  1: '아소산·유후인', 2: '벳푸', 3: '칠순 생신 ✨', 4: '구로카와·구마모토', 5: '귀국',
}
const DAY_GRADS = [
  'linear-gradient(135deg,#1A4A7A,#2980B9)',
  'linear-gradient(135deg,#6E2F10,#D35400)',
  'linear-gradient(135deg,#7D5800,#C9952B)',
  'linear-gradient(135deg,#0B4C40,#148F77)',
  'linear-gradient(135deg,#6B1A28,#8B2635)',
]

function Lightbox({ items, initialIndex, onClose }) {
  const [idx, setIdx] = useState(initialIndex)
  const touchX = useRef(null)
  const item = items[idx]
  const src = `/photos/day${item.dayId}/${item.file}`

  const goPrev = useCallback(() => setIdx(i => (i > 0 ? i - 1 : items.length - 1)), [items.length])
  const goNext = useCallback(() => setIdx(i => (i < items.length - 1 ? i + 1 : 0)), [items.length])

  useEffect(() => {
    const h = (e) => {
      if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [goPrev, goNext, onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'rgba(0,0,0,0.95)' }}
      onTouchStart={e => { touchX.current = e.touches[0].clientX }}
      onTouchEnd={e => {
        const dx = e.changedTouches[0].clientX - (touchX.current ?? 0)
        if (dx > 50) goPrev(); else if (dx < -50) goNext()
        touchX.current = null
      }}
    >
      <div className="flex items-center justify-between px-5 py-4 flex-shrink-0">
        <span className="text-white/50 text-sm">{idx + 1} / {items.length}</span>
        <div className="flex items-center gap-1.5">
          {items.map((_, i) => (
            <div key={i} onClick={() => setIdx(i)} className="cursor-pointer rounded-full transition-all"
              style={{ width: i === idx ? 16 : 6, height: 6, background: i === idx ? 'white' : 'rgba(255,255,255,0.3)' }} />
          ))}
        </div>
        <button className="text-white/70 text-2xl w-10 h-10 flex items-center justify-center" onClick={onClose}>✕</button>
      </div>
      <div className="flex-1 flex items-center justify-center relative px-2 overflow-hidden">
        {items.length > 1 && (
          <button onClick={goPrev} className="absolute left-2 z-10 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)' }}>
            <span className="text-white text-xl leading-none">‹</span>
          </button>
        )}
        {item.type === 'video'
          ? <video key={src} src={src} controls autoPlay className="max-w-full rounded-xl" style={{ maxHeight: '70vh' }} />
          : <img key={src} src={src} alt={item.caption} className="max-w-full rounded-xl object-contain" style={{ maxHeight: '70vh' }} />
        }
        {items.length > 1 && (
          <button onClick={goNext} className="absolute right-2 z-10 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)' }}>
            <span className="text-white text-xl leading-none">›</span>
          </button>
        )}
      </div>
      <div className="flex-shrink-0 px-6 py-5 text-center">
        <p className="text-white font-medium text-sm leading-snug">{item.caption || DAY_NAMES[item.dayId]}</p>
        <p className="text-white/40 text-xs mt-1">
          {item.dayId}일차{item.tags?.length ? ' · ' + item.tags.map(t => `#${t}`).join(' ') : ''}
        </p>
      </div>
    </div>
  )
}

export default function Favorites({ closeSignal = 0 }) {
  const [liked, setLiked] = useState([])
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState(null)

  const fetchLiked = useCallback(async () => {
    try {
      const r = await fetch(`/photos/photo_uploads.json?t=${Date.now()}`)
      if (r.ok) {
        const all = await r.json()
        setLiked(all.filter(u => u.liked))
      }
    } catch (_) {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchLiked() }, [fetchLiked])
  useEffect(() => { if (closeSignal > 0) setLightbox(null) }, [closeSignal])

  const byDay = tripData.days.map(d => ({
    day: d,
    items: liked.filter(u => u.dayId === d.id),
  })).filter(g => g.items.length > 0)

  if (loading) {
    return <div className="flex items-center justify-center h-full text-3xl animate-spin">🌸</div>
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto smooth-scroll pb-28">
      <div className="px-5 pt-5 pb-3 flex-shrink-0">
        <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2"
          style={{ fontFamily: 'Noto Serif KR, serif' }}>
          ❤️ 즐겨찾기
        </h2>
        <p className="text-gray-400 text-xs mt-0.5">총 {liked.length}개</p>
      </div>

      {liked.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 px-8 text-center py-20">
          <div className="text-5xl mb-4">🤍</div>
          <p className="font-bold text-gray-600 mb-1">아직 즐겨찾기가 없어요</p>
          <p className="text-gray-400 text-sm">갤러리에서 사진/영상의 ❤️를 눌러보세요</p>
        </div>
      ) : (
        <div className="px-4">
          {byDay.map(({ day, items }) => (
            <div key={day.id} className="mb-7">
              <div className="flex items-center gap-2 mb-3">
                <div className="px-3 py-1 rounded-full text-white text-xs font-bold"
                  style={{ background: `linear-gradient(135deg,${day.headerGradient[0]},${day.headerGradient[1]})` }}>
                  Day {day.id}
                </div>
                <span className="text-gray-500 text-sm font-medium">{DAY_NAMES[day.id]}</span>
                <span className="text-gray-300 text-xs ml-auto">{items.length}개</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {items.map((item, i) => {
                  const thumbSrc = item.thumb
                    ? `/photos/day${item.dayId}/${item.thumb}`
                    : (item.type === 'photo' ? `/photos/day${item.dayId}/${item.file}` : null)

                  return (
                    <div key={item.id}
                      onClick={() => setLightbox({ items, initialIndex: i })}
                      className="rounded-2xl overflow-hidden cursor-pointer"
                      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
                      <div className="relative overflow-hidden" style={{ height: 140 }}>
                        {thumbSrc
                          ? <img src={thumbSrc} alt={item.caption}
                              className="w-full h-full object-cover" loading="lazy" />
                          : <div className="w-full h-full"
                              style={{ background: DAY_GRADS[(item.dayId - 1) % 5] }} />
                        }
                        {item.type === 'video' && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center"
                              style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
                              <span style={{ fontSize: 16, color: 'white' }}>▶</span>
                            </div>
                          </div>
                        )}
                        <div className="absolute top-2 right-2 text-base">❤️</div>
                      </div>
                      {item.caption && (
                        <div className="bg-white px-3 py-2">
                          <p className="text-gray-700 text-xs leading-snug truncate">{item.caption}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {lightbox && (
        <Lightbox items={lightbox.items} initialIndex={lightbox.initialIndex} onClose={() => setLightbox(null)} />
      )}
    </div>
  )
}
