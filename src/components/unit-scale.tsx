import { graduations } from '@/lib/graduations'
import type { ControlId } from '@/lib/controls'

function point(position: number, radius: number) {
  const radians = ((position * 300 - 150) * Math.PI) / 180
  return { x: 50 + radius * Math.sin(radians), y: 50 - radius * Math.cos(radians) }
}

export function UnitScale({ id }: { id: ControlId }) {
  return (
    <g className="unit-scale">
      {Array.from({ length: 21 }, (_, index) => {
        const major = index % 5 === 0
        const inner = point(index / 20, 30)
        const outer = point(index / 20, major ? 40 : 37)
        return (
          <line
            key={index}
            x1={inner.x}
            y1={inner.y}
            x2={outer.x}
            y2={outer.y}
            strokeWidth={major ? 1.7 : 1.1}
            strokeLinecap="round"
          />
        )
      })}
      {graduations[id].map((mark) => (
        <text
          key={mark.label}
          {...point(mark.position, 47)}
          dominantBaseline="central"
          textAnchor="middle"
          data-slot="unit-scale-label"
        >
          {mark.label}
        </text>
      ))}
      {graduations[id]
        .filter((mark) => mark.lineLabel)
        .map((mark) => (
          <text
            key={mark.label}
            {...point(mark.position, 60)}
            dominantBaseline="central"
            textAnchor={
              mark.position === 0.25 ? 'end' : mark.position === 0.75 ? 'start' : 'middle'
            }
            className="line-scale-label"
          >
            {mark.lineLabel}
          </text>
        ))}
    </g>
  )
}
