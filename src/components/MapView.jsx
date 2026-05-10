import { useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker } from 'react-leaflet'
import L from 'leaflet'
import { tripData, CATEGORIES } from '../data/tripData.js'

// Custom colored marker icon
function makeIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:28px;height:28px;
      background:${color};
      border:3px solid white;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30],
  })
}

const DAY_LABELS = ['전체', 'Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5']

export default function MapView() {
  const [selectedDay, setSelectedDay] = useState(0) // 0 = all

  const allEvents = useMemo(() =>
    tripData.days.flatMap((day) =>
      day.events
        .filter((e) => e.lat && e.lng)
        .map((e) => ({ ...e, dayId: day.id, dayLabel: day.dateShort, dayHighlight: day.highlight }))
    ), [])

  const filtered = selectedDay === 0
    ? allEvents
    : allEvents.filter((e) => e.dayId === selectedDay)

  // Route polyline for selected day(s)
  const routePoints = filtered.map((e) => [e.lat, e.lng])

  // Center: Kyushu region
  const center = [33.0, 131.0]

  return (
    <div className="flex flex-col h-full">
      {/* Day filter */}
      <div
        className="bg-white/95 border-b border-gray-100 flex-shrink-0 px-3 py-2"
        style={{ backdropFilter: 'blur(8px)', zIndex: 500 }}
      >
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {DAY_LABELS.map((label, i) => {
            const isActive = selectedDay === i
            const day = i > 0 ? tripData.days[i - 1] : null
            return (
              <button
                key={i}
                onClick={() => setSelectedDay(i)}
                className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200"
                style={{
                  background: isActive
                    ? (day ? `linear-gradient(135deg, ${day.headerGradient[0]}, ${day.headerGradient[1]})` : '#8B2635')
                    : '#F5F0E8',
                  color: isActive ? 'white' : '#6B6B6B',
                  boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
                }}
              >
                {label}{day?.highlight ? ' ✨' : ''}
              </button>
            )
          })}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={center}
          zoom={9}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='© <a href="https://openstreetmap.org">OpenStreetMap</a>'
          />

          {/* Route line */}
          {routePoints.length > 1 && (
            <Polyline
              positions={routePoints}
              color="#8B2635"
              weight={3}
              opacity={0.5}
              dashArray="6,6"
            />
          )}

          {/* Event markers */}
          {filtered.map((event, i) => {
            const cat = CATEGORIES[event.category] || CATEGORIES.SIGHTSEEING
            return (
              <Marker
                key={`${event.id}-${i}`}
                position={[event.lat, event.lng]}
                icon={makeIcon(event.dayHighlight && event.category === 'CELEBRATION' ? '#C9952B' : cat.color)}
              >
                <Popup>
                  <div style={{ fontFamily: 'Noto Sans KR, sans-serif', minWidth: 160 }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span>{cat.emoji}</span>
                      <span style={{ fontSize: 11, color: cat.color, fontWeight: 600 }}>{event.dayLabel}</span>
                      <span style={{ fontSize: 11, color: '#9CA3AF' }}>{event.time}</span>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 4px', color: '#2C2C2C' }}>
                      {event.title}
                    </p>
                    <p style={{ fontSize: 12, color: '#6B6B6B', margin: 0, lineHeight: 1.5 }}>
                      {event.description.slice(0, 60)}{event.description.length > 60 ? '…' : ''}
                    </p>
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>

        {/* Legend */}
        <div
          className="absolute bottom-6 right-3 bg-white/95 rounded-xl px-3 py-2 text-xs text-gray-500"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.12)', backdropFilter: 'blur(8px)', zIndex: 400 }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-4 h-0.5 bg-crimson" style={{ borderTop: '2px dashed #8B2635' }} />
            <span>이동 경로</span>
          </div>
          <p className="text-gray-400" style={{ fontSize: 10 }}>마커를 탭하면 정보가 나와요</p>
        </div>
      </div>
    </div>
  )
}
