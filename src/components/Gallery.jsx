import { useState, useEffect, useCallback, useRef } from 'react'
import { tripData } from '../data/tripData.js'

const DAY_NAMES = {
  1: '아소산·유후인', 2: '벳푸', 3: '칠순 생신 ✨', 4: '구로카와·구마모토', 5: '귀국',
}
const TAG_LABELS = {
  자연: '🌿', nature: '🌿', 가족: '👨‍👩‍👧‍👦', family: '👨‍👩‍👧‍👦',
  음식: '🍽️', food: '🍽️', 온천: '♨️', onsen: '♨️',
  숙소: '🏡', stay: '🏡', 기념: '🎂', celebration: '🎂',
  쇼핑: '🛍️', shopping: '🛍️', 체험: '🎡', fun: '🎡',
  풍경: '🌄', 건물: '🏯', 드라이브: '🚗',
}
const PRESET_TAGS = ['자연', '가족', '음식', '온천', '숙소', '기념', '쇼핑', '체험', '풍경', '건물', '드라이브']
const DAY_GRADS = [
  'linear-gradient(135deg,#1A4A7A,#2980B9)',
  'linear-gradient(135deg,#6E2F10,#D35400)',
  'linear-gradient(135deg,#7D5800,#C9952B)',
  'linear-gradient(135deg,#0B4C40,#148F77)',
  'linear-gradient(135deg,#6B1A28,#8B2635)',
]

async function patchPhoto(id, updates) {
  return fetch(`/api/photos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
}

// ── Lightbox ──────────────────────────────────────────────────────────────────

function Lightbox({ items, initialIndex, onClose, onToggleLike }) {
  const [idx, setIdx] = useState(initialIndex)
  const [scale, setScale] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const gesture = useRef(null)
  const lastTap = useRef(0)
  const scaleRef = useRef(1)   // 스태일 클로저 방지용 ref
  const posRef = useRef({ x: 0, y: 0 })

  const item = items[Math.min(idx, items.length - 1)]
  const src = `/photos/day${item.dayId}/${item.file}`

  const resetZoom = useCallback(() => {
    scaleRef.current = 1; posRef.current = { x: 0, y: 0 }
    setScale(1); setPos({ x: 0, y: 0 })
  }, [])

  const goPrev = useCallback(() => { resetZoom(); setIdx(i => (i > 0 ? i - 1 : items.length - 1)) }, [items.length, resetZoom])
  const goNext = useCallback(() => { resetZoom(); setIdx(i => (i < items.length - 1 ? i + 1 : 0)) }, [items.length, resetZoom])

  useEffect(() => { resetZoom() }, [idx, resetZoom])

  useEffect(() => {
    const h = (e) => {
      if (e.key === 'Escape') { scaleRef.current > 1.05 ? resetZoom() : onClose() }
      else if (e.key === 'ArrowLeft' && scaleRef.current <= 1.05) goPrev()
      else if (e.key === 'ArrowRight' && scaleRef.current <= 1.05) goNext()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [goPrev, goNext, onClose, resetZoom])

  const onTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[1].clientX - e.touches[0].clientX
      const dy = e.touches[1].clientY - e.touches[0].clientY
      gesture.current = { type: 'pinch', startDist: Math.hypot(dx, dy), startScale: scaleRef.current }
    } else {
      const now = Date.now()
      if (now - lastTap.current < 280) {
        // 더블탭: 줌 토글
        lastTap.current = 0
        if (scaleRef.current > 1.05) { resetZoom() }
        else { scaleRef.current = 2.5; setScale(2.5) }
        gesture.current = null
        return
      }
      lastTap.current = now
      gesture.current = {
        type: 'single',
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        startPos: { ...posRef.current },
      }
    }
  }, [resetZoom])

  const onTouchMove = useCallback((e) => {
    if (!gesture.current) return
    e.preventDefault()
    if (gesture.current.type === 'pinch' && e.touches.length === 2) {
      const dx = e.touches[1].clientX - e.touches[0].clientX
      const dy = e.touches[1].clientY - e.touches[0].clientY
      const next = Math.min(4, Math.max(1, gesture.current.startScale * (Math.hypot(dx, dy) / gesture.current.startDist)))
      scaleRef.current = next
      setScale(next)
      if (next <= 1) { posRef.current = { x: 0, y: 0 }; setPos({ x: 0, y: 0 }) }
    } else if (gesture.current.type === 'single' && scaleRef.current > 1.05) {
      const np = {
        x: gesture.current.startPos.x + (e.touches[0].clientX - gesture.current.startX),
        y: gesture.current.startPos.y + (e.touches[0].clientY - gesture.current.startY),
      }
      posRef.current = np; setPos(np)
    }
  }, [])

  const onTouchEnd = useCallback((e) => {
    if (!gesture.current) return
    if (gesture.current.type === 'pinch') {
      if (scaleRef.current < 1.1) resetZoom()
    } else if (gesture.current.type === 'single' && scaleRef.current <= 1.05) {
      const dx = e.changedTouches[0].clientX - gesture.current.startX
      const dy = e.changedTouches[0].clientY - gesture.current.startY
      if (Math.abs(dy) > Math.abs(dx) && dy > 80) onClose()
      else if (Math.abs(dx) > 50) { if (dx > 0) goPrev(); else goNext() }
    }
    gesture.current = null
  }, [resetZoom, onClose, goPrev, goNext])

  // non-passive touchmove (preventDefault 작동)
  const mediaRef = useRef(null)
  useEffect(() => {
    const el = mediaRef.current
    if (!el) return
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => el.removeEventListener('touchmove', onTouchMove)
  }, [onTouchMove])

  const isZoomed = scale > 1.05
  const showDots = items.length > 1 && items.length <= 15

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: '#0A0A0A', zIndex: 110 }}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

      {/* 상단 */}
      <div className="flex-shrink-0 flex items-center justify-between px-4"
        style={{
          paddingTop: 'calc(14px + env(safe-area-inset-top, 0px))',
          paddingBottom: 12,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.65), transparent)',
        }}>
        <button onClick={onClose} className="flex items-center gap-1 font-medium"
          style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15 }}>
          <span style={{ fontSize: 22, lineHeight: 1 }}>‹</span> 목록
        </button>
        <span className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
          {idx + 1} / {items.length}
          {isZoomed && <span style={{ color: 'rgba(255,255,255,0.3)' }}> · {Math.round(scale * 100)}%</span>}
        </span>
        <button onClick={() => onToggleLike(item.id)}
          className="w-10 h-10 flex items-center justify-center text-2xl">
          {item.liked ? '❤️' : '🤍'}
        </button>
      </div>

      {/* 미디어 영역 */}
      <div ref={mediaRef} className="flex-1 flex items-center justify-center relative overflow-hidden"
        style={{ touchAction: 'none' }}>
        {item.type === 'video'
          ? <video key={src} src={src} controls autoPlay className="max-w-full max-h-full"
              style={{ maxHeight: '65vh', borderRadius: 12 }} />
          : <img key={src} src={src} alt={item.caption} draggable={false}
              className="max-w-full max-h-full object-contain select-none"
              style={{
                maxHeight: '65vh',
                transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
                transition: gesture.current ? 'none' : 'transform 0.2s ease',
                transformOrigin: 'center center',
                cursor: isZoomed ? 'grab' : 'default',
              }}
            />
        }
        {/* 좌우 탭 — 줌 아닐 때만 */}
        {!isZoomed && items.length > 1 && <>
          <div className="absolute left-0 top-0 bottom-0 w-1/3 flex items-center pl-3" onClick={goPrev}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.13)', backdropFilter: 'blur(4px)' }}>
              <span className="text-white text-xl leading-none">‹</span>
            </div>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1/3 flex items-center justify-end pr-3" onClick={goNext}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.13)', backdropFilter: 'blur(4px)' }}>
              <span className="text-white text-xl leading-none">›</span>
            </div>
          </div>
        </>}
        {/* 줌 힌트 */}
        {isZoomed && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs"
            style={{ background: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.6)' }}>
            더블탭으로 초기화
          </div>
        )}
      </div>

      {/* 하단 */}
      <div className="flex-shrink-0 px-5"
        style={{
          paddingTop: 16,
          paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
          background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
        }}>
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className="text-xs px-2.5 py-1 rounded-full text-white font-bold"
            style={{ background: DAY_GRADS[(item.dayId - 1) % 5] }}>
            Day {item.dayId} · {DAY_NAMES[item.dayId]}
          </span>
          {item.tags?.map(t => (
            <span key={t} className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>#{t}</span>
          ))}
        </div>
        {item.caption && (
          <p className="text-sm leading-snug mb-3" style={{ color: 'rgba(255,255,255,0.9)' }}>{item.caption}</p>
        )}
        {showDots && !isZoomed && (
          <div className="flex justify-center gap-1.5">
            {items.map((_, i) => (
              <div key={i} onClick={() => setIdx(i)} className="cursor-pointer rounded-full transition-all"
                style={{ width: i === idx ? 20 : 6, height: 6, background: i === idx ? 'white' : 'rgba(255,255,255,0.28)' }} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── 태그 변경 모달 ─────────────────────────────────────────────────────────────

function TagModal({ count, currentTags, onApply, onClose }) {
  const [active, setActive] = useState([...currentTags])
  const [custom, setCustom] = useState('')

  const toggle = (t) => setActive(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  const addCustom = () => {
    const t = custom.trim().replace(/^#/, '')
    if (t && !active.includes(t)) setActive(prev => [...prev, t])
    setCustom('')
  }

  // 현재 active 중 preset에 없는 것 (직접 입력된 태그들)
  const customTags = active.filter(t => !PRESET_TAGS.includes(t))

  return (
    <div className="fixed inset-0 z-50" style={{ touchAction: 'none' }}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose} />
      <div
        className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-white overflow-y-auto"
        style={{ maxHeight: '85vh', boxShadow: '0 -8px 40px rgba(0,0,0,0.18)' }}
      >
        {/* 핸들 */}
        <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mt-4 mb-3" />

        {/* 제목 + 적용 버튼 (같은 행) */}
        <div className="flex items-center justify-between px-5 mb-4">
          <p className="font-bold text-gray-800" style={{ fontSize: 16 }}>
            태그 변경 <span className="text-gray-400 font-normal text-sm">({count}개 선택)</span>
          </p>
          <button
            onClick={() => onApply(active)}
            className="px-4 py-2 rounded-xl text-white font-bold text-sm"
            style={{ background: 'linear-gradient(135deg,#6B1A28,#8B2635)', border: 'none' }}>
            적용하기
          </button>
        </div>

        {/* 태그 영역 */}
        <div className="px-5" style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}>

          {/* 직접 입력 — 프리셋 위에 배치해 항상 보이도록 */}
          <div className="flex gap-2 mb-4">
            <input
              value={custom}
              onChange={e => setCustom(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustom()}
              placeholder="태그 직접 입력 (예: 노을)"
              className="flex-1 rounded-xl text-sm text-gray-700"
              style={{ border: '1.5px solid #E5E7EB', padding: '10px 14px', outline: 'none' }}
            />
            <button onClick={addCustom}
              className="px-4 rounded-xl text-sm font-medium"
              style={{ background: '#F5F0E8', color: '#4B4B4B', border: 'none', padding: '10px 16px' }}>
              추가
            </button>
          </div>

          {/* 직접 추가된 태그들 */}
          {customTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {customTags.map(t => (
                <button key={t} onClick={() => toggle(t)}
                  className="flex items-center gap-1 px-3 py-2 rounded-full text-sm"
                  style={{ background: '#8B2635', color: 'white', border: '2px solid #8B2635' }}>
                  #{t} <span className="opacity-70">✕</span>
                </button>
              ))}
            </div>
          )}

          {/* 프리셋 태그 */}
          <div className="flex flex-wrap gap-2">
            {PRESET_TAGS.map(t => {
              const on = active.includes(t)
              return (
                <button key={t} onClick={() => toggle(t)}
                  className="flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium transition-all"
                  style={{
                    background: on ? '#8B2635' : '#F5F0E8',
                    color: on ? 'white' : '#4B4B4B',
                    border: on ? '2px solid #8B2635' : '2px solid transparent',
                  }}>
                  <span>{TAG_LABELS[t] || ''}</span>
                  <span>{t}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── 카드 컴포넌트 ─────────────────────────────────────────────────────────────

function CardShell({ children, onClick, selected, selectMode, style }) {
  return (
    <div
      onClick={onClick}
      className="rounded-2xl overflow-hidden cursor-pointer relative"
      style={{
        boxShadow: selected ? '0 0 0 3px #8B2635' : '0 2px 12px rgba(0,0,0,0.1)',
        transition: 'box-shadow 0.15s',
        ...style,
      }}
    >
      {children}
      {/* 선택 오버레이 */}
      {selectMode && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ borderRadius: 'inherit', border: selected ? '3px solid #8B2635' : 'none' }}
        >
          <div
            className="absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
            style={{
              background: selected ? '#8B2635' : 'rgba(255,255,255,0.75)',
              color: selected ? 'white' : 'transparent',
              border: selected ? 'none' : '2px solid rgba(255,255,255,0.9)',
              backdropFilter: 'blur(4px)',
            }}>
            {selected ? '✓' : ''}
          </div>
        </div>
      )}
    </div>
  )
}

function HeartBtn({ liked, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center z-10"
      style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)', border: 'none', fontSize: 16 }}
    >
      {liked ? '❤️' : '🤍'}
    </button>
  )
}

function Badges({ item }) {
  return (
    <div className="bg-white px-3 py-2">
      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
        <span className="text-xs font-bold px-1.5 py-0.5 rounded-full text-white"
          style={{ background: DAY_GRADS[(item.dayId - 1) % 5], fontSize: 10 }}>
          Day {item.dayId}
        </span>
        {item.tags?.slice(0, 2).map(t => (
          <span key={t} className="text-xs text-gray-400">#{t}</span>
        ))}
      </div>
      {item.caption && <p className="text-gray-700 text-xs leading-snug truncate">{item.caption}</p>}
    </div>
  )
}

function PhotoCard({ item, onClick, onHeart, selectMode, selected }) {
  const [err, setErr] = useState(false)

  return (
    <CardShell onClick={onClick} selected={selected} selectMode={selectMode}>
      <div className="relative overflow-hidden" style={{ height: 140 }}>
        {err
          ? <div className="w-full h-full flex items-center justify-center text-white/40 text-xs"
              style={{ background: DAY_GRADS[(item.dayId - 1) % 5] }}>📷</div>
          : <img src={`/photos/day${item.dayId}/${item.file}`} alt={item.caption}
              className="w-full h-full object-cover" onError={() => setErr(true)} loading="lazy" />
        }
        <HeartBtn liked={item.liked} onToggle={onHeart} />
      </div>
      <Badges item={item} />
    </CardShell>
  )
}

function VideoCard({ item, onClick, onHeart, selectMode, selected }) {
  const [thumbErr, setThumbErr] = useState(false)
  const thumbSrc = item.thumb ? `/photos/day${item.dayId}/${item.thumb}` : null

  return (
    <CardShell onClick={onClick} selected={selected} selectMode={selectMode}>
      <div className="relative overflow-hidden" style={{ height: 140 }}>
        {thumbSrc && !thumbErr
          ? <img src={thumbSrc} alt={item.caption} className="w-full h-full object-cover"
              onError={() => setThumbErr(true)} loading="lazy" />
          : <div className="w-full h-full flex items-center justify-center"
              style={{ background: DAY_GRADS[(item.dayId - 1) % 5] }} />
        }
        {/* 재생 버튼 오버레이 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
            <span style={{ fontSize: 20, color: 'white' }}>▶</span>
          </div>
        </div>
        <HeartBtn liked={item.liked} onToggle={onHeart} />
      </div>
      <Badges item={item} />
    </CardShell>
  )
}

// ── 갤러리 메인 ───────────────────────────────────────────────────────────────

const EMPTY_EVENTS = tripData.days.flatMap(d => d.events.map(e => ({ dayId: d.id, title: e.title })))

export default function Gallery({ closeSignal = 0 }) {
  const [uploads, setUploads] = useState([])
  const [loading, setLoading] = useState(true)
  const [dayFilter, setDayFilter] = useState(0)
  const [tagFilter, setTagFilter] = useState(null)
  const [typeFilter, setTypeFilter] = useState('all') // 'all' | 'photo' | 'video'
  const [likedOnly, setLikedOnly] = useState(false)
  const [lightboxIdx, setLightboxIdx] = useState(null)
  const [tick, setTick] = useState(Date.now())
  // 선택 모드
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [tagModal, setTagModal] = useState(false)

  const fetchUploads = useCallback(async () => {
    try {
      const r = await fetch(`/photos/photo_uploads.json?t=${Date.now()}`)
      if (r.ok) setUploads(await r.json())
    } catch (_) {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchUploads() }, [fetchUploads, tick])
  useEffect(() => { if (closeSignal > 0) setLightboxIdx(null) }, [closeSignal])

  const allTags = [...new Set(uploads.flatMap(u => u.tags ?? []))].filter(Boolean)

  const filtered = uploads.filter(u => {
    if (dayFilter && u.dayId !== dayFilter) return false
    if (tagFilter && !u.tags?.includes(tagFilter)) return false
    if (typeFilter !== 'all' && u.type !== typeFilter) return false
    if (likedOnly && !u.liked) return false
    return true
  })

  const photoCount = uploads.filter(u => u.type === 'photo' || !u.type).length
  const videoCount = uploads.filter(u => u.type === 'video').length

  // 하트 토글 (낙관적 업데이트)
  const toggleLike = async (e, item) => {
    e.stopPropagation()
    const next = !item.liked
    setUploads(prev => prev.map(u => u.id === item.id ? { ...u, liked: next } : u))
    try { await patchPhoto(item.id, { liked: next }) }
    catch { setUploads(prev => prev.map(u => u.id === item.id ? { ...u, liked: !next } : u)) }
  }

  const toggleLikeById = async (id) => {
    const target = uploads.find(u => u.id === id)
    if (!target) return
    const next = !target.liked
    setUploads(prev => prev.map(u => u.id === id ? { ...u, liked: next } : u))
    try { await patchPhoto(id, { liked: next }) }
    catch { setUploads(prev => prev.map(u => u.id === id ? { ...u, liked: !next } : u)) }
  }

  const toggleSelect = (id) => setSelected(prev => {
    const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s
  })

  const exitSelect = () => { setSelectMode(false); setSelected(new Set()) }

  const selectAll = () => setSelected(new Set(filtered.map(u => u.id)))

  // 태그 일괄 변경
  const applyTags = async (newTags) => {
    const ids = [...selected]
    setUploads(prev => prev.map(u => ids.includes(u.id) ? { ...u, tags: newTags } : u))
    await Promise.all(ids.map(id => patchPhoto(id, { tags: newTags })))
    setTagModal(false)
    exitSelect()
  }

  // 선택된 항목들의 태그 합집합
  const selectedItems = filtered.filter(u => selected.has(u.id))
  const unionTags = [...new Set(selectedItems.flatMap(u => u.tags ?? []))]

  const likedCount = uploads.filter(u => u.liked).length

  return (
    <div className="flex flex-col h-full">
      {/* ── 필터 헤더 ── */}
      <div className="bg-white/95 border-b border-gray-100 flex-shrink-0"
        style={{ backdropFilter: 'blur(8px)', zIndex: 100 }}>

        {/* Day 탭 + 사진/영상 토글 */}
        <div className="flex items-center gap-2 px-3 pt-2 pb-1" style={{ scrollbarWidth: 'none' }}>
          {/* Day 탭 (스크롤) */}
          <div className="flex gap-2 overflow-x-auto flex-1" style={{ scrollbarWidth: 'none' }}>
            {[{ id: 0, label: '전체' }, ...tripData.days.map(d => ({ id: d.id, label: `Day${d.id}${d.highlight ? '✨' : ''}` }))].map(d => {
              const day = tripData.days.find(x => x.id === d.id)
              const on = dayFilter === d.id
              return (
                <button key={d.id} onClick={() => { setDayFilter(d.id); setTagFilter(null) }}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium"
                  style={{
                    background: on ? (day ? `linear-gradient(135deg,${day.headerGradient[0]},${day.headerGradient[1]})` : '#8B2635') : '#F5F0E8',
                    color: on ? 'white' : '#6B6B6B',
                    boxShadow: on ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
                  }}>
                  {d.label}
                </button>
              )
            })}
          </div>
          {/* 사진/영상 토글 */}
          <div className="flex-shrink-0 flex rounded-full overflow-hidden border border-gray-200 text-xs font-medium">
            {[
              { key: 'all', label: '전체' },
              { key: 'photo', label: `📷 ${photoCount}` },
              { key: 'video', label: `🎬 ${videoCount}` },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setTypeFilter(key)}
                className="px-2.5 py-1.5"
                style={{
                  background: typeFilter === key ? '#8B2635' : 'white',
                  color: typeFilter === key ? 'white' : '#6B6B6B',
                }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 태그 + 즐겨찾기 + 선택 모드 버튼 */}
        <div className="flex items-center gap-2 px-3 pb-2 pt-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {/* 즐겨찾기 */}
          <button onClick={() => setLikedOnly(p => !p)}
            className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ background: likedOnly ? '#8B2635' : '#F5F0E8', color: likedOnly ? 'white' : '#6B6B6B' }}>
            ❤️ {likedCount}
          </button>

          {/* 태그 필터 */}
          {allTags.map(t => (
            <button key={t} onClick={() => setTagFilter(tagFilter === t ? null : t)}
              className="flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ background: tagFilter === t ? '#8B2635' : '#F5F0E8', color: tagFilter === t ? 'white' : '#6B6B6B' }}>
              {TAG_LABELS[t] || ''} {t}
            </button>
          ))}

          {/* 우측 여백 채우기 */}
          <div className="flex-1" />

          {/* 선택 / 취소 */}
          {!selectMode
            ? <button onClick={() => setSelectMode(true)}
                className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium"
                style={{ background: '#F5F0E8', color: '#6B6B6B' }}>선택</button>
            : <button onClick={exitSelect}
                className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium"
                style={{ background: '#8B2635', color: 'white' }}>취소</button>
          }

          {/* 새로고침 */}
          <button onClick={() => setTick(Date.now())}
            className="flex-shrink-0 text-gray-400 text-base px-1">↻</button>
        </div>

        {/* 선택 모드 액션 바 */}
        {selectMode && (
          <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100"
            style={{ background: '#FDFAF5' }}>
            <button onClick={selectAll} className="text-xs text-gray-500 underline">전체 선택</button>
            <span className="text-sm font-semibold text-gray-700">{selected.size}개 선택</span>
            <button
              disabled={selected.size === 0}
              onClick={() => setTagModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold"
              style={{
                background: selected.size > 0 ? '#8B2635' : '#E5E7EB',
                color: selected.size > 0 ? 'white' : '#9CA3AF',
              }}>
              🏷️ 태그 변경
            </button>
          </div>
        )}
      </div>

      {/* ── 본문 ── */}
      <div className="flex-1 overflow-y-auto smooth-scroll px-4 pt-4 pb-28">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-3xl animate-spin">🌸</div>
        ) : uploads.length === 0 ? (
          <div>
            <div className="rounded-2xl p-5 mb-5 text-center"
              style={{ background: 'linear-gradient(135deg,#FEF9E7,#FFF3CD)', border: '1px solid #F0D06040' }}>
              <div className="text-4xl mb-3">📱</div>
              <p className="font-bold text-amber-900 mb-1">텔레그램 봇으로 사진을 보내주세요</p>
              <p className="text-amber-700 text-sm">캡션: #N일차 #태그 설명</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {EMPTY_EVENTS.slice(0, 10).map((e, i) => (
                <div key={i} className="rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
                  <div className="flex items-center justify-center" style={{ height: 100, background: DAY_GRADS[(e.dayId - 1) % 5], opacity: 0.5 }}>
                    <span className="text-white/50 text-xs">Day {e.dayId}</span>
                  </div>
                  <div className="bg-white px-3 py-2"><p className="text-gray-400 text-xs truncate">{e.title}</p></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <p className="text-gray-400 text-xs mb-3">
              {filtered.length}개
              {likedOnly ? ' · ❤️ 즐겨찾기' : ''}
              {tagFilter ? ` · #${tagFilter}` : ''}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map((item, i) => {
                const isSelected = selected.has(item.id)
                const handleClick = selectMode
                  ? () => toggleSelect(item.id)
                  : () => setLightboxIdx(i)
                const handleHeart = (e) => { if (!selectMode) toggleLike(e, item) }
                return item.type === 'video'
                  ? <VideoCard key={item.id} item={item} onClick={handleClick} onHeart={handleHeart} selectMode={selectMode} selected={isSelected} />
                  : <PhotoCard key={item.id} item={item} onClick={handleClick} onHeart={handleHeart} selectMode={selectMode} selected={isSelected} />
              })}
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-10 text-gray-400">
                <p className="text-3xl mb-2">🔍</p>
                <p className="text-sm">해당 조건의 사진이 없습니다</p>
              </div>
            )}
          </div>
        )}
        <div className="text-center py-6"><span className="text-2xl">🌸</span></div>
      </div>

      {/* 라이트박스 */}
      {lightboxIdx !== null && !selectMode && (
        <Lightbox
          items={filtered}
          initialIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onToggleLike={toggleLikeById}
        />
      )}

      {/* 태그 변경 모달 */}
      {tagModal && (
        <TagModal count={selected.size} currentTags={unionTags} onApply={applyTags} onClose={() => setTagModal(false)} />
      )}
    </div>
  )
}
