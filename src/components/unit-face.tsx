const frames = [
  { x: 155, width: 360, label: 'MIC PREAMP' },
  { x: 590, width: 395, label: 'COMPRESSOR' },
  { x: 990, width: 245, label: 'DE-ESSER' },
  { x: 1240, width: 202, label: 'ENHANCER' },
  { x: 1448, width: 245, label: 'EXPANDER/GATE' },
  { x: 1698, width: 132, label: 'OUTPUT' },
]

function Screw({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r="11" fill="#41413a" opacity=".3" transform="translate(1 2)" />
      <circle r="9" fill="url(#screw-metal)" stroke="#74756d" strokeWidth="1" />
      <path d="M-4 0H4M0-4V4" stroke="#11130f" strokeWidth="2" transform="rotate(30)" />
    </g>
  )
}

export function UnitFace() {
  return (
    <svg className="unit-face" viewBox="0 0 1980 180" aria-hidden="true">
      <defs>
        <linearGradient id="face-metal" x2=".4" y2="1">
          <stop stopColor="#c4c4bd" />
          <stop offset=".5" stopColor="#d4d4cc" />
          <stop offset="1" stopColor="#bebfb7" />
        </linearGradient>
        <radialGradient id="screw-metal" cx="35%" cy="25%">
          <stop stopColor="#55574c" />
          <stop offset=".7" stopColor="#1c1e19" />
          <stop offset="1" stopColor="#080a08" />
        </radialGradient>
        <filter id="face-grain">
          <feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="3" seed="4" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope=".13" />
          </feComponentTransfer>
          <feBlend in="SourceGraphic" mode="multiply" />
        </filter>
        <mask id="rack-cutouts">
          <rect width="1980" height="180" rx="3" fill="white" />
          {[35, 1945].flatMap((x) =>
            [25, 155].map((y) => (
              <rect
                key={`${x}-${y}`}
                x={x - 22}
                y={y - 13}
                width="44"
                height="26"
                rx="12"
                fill="black"
              />
            )),
          )}
        </mask>
      </defs>
      <g mask="url(#rack-cutouts)">
        <rect width="1980" height="180" rx="3" fill="url(#face-metal)" filter="url(#face-grain)" />
        <rect
          x="1"
          y="1"
          width="1978"
          height="178"
          rx="3"
          fill="none"
          stroke="#e2e2da"
          strokeWidth="2"
        />
      </g>
      {frames.map((frame) => (
        <g key={frame.x}>
          <rect
            x={frame.x}
            y="23"
            width={frame.width}
            height="134"
            rx="8"
            fill="none"
            stroke="#64685b"
            strokeWidth="1.4"
          />
          <text x={frame.x + frame.width / 2} y="169" className="section-label">
            {frame.label}
          </text>
        </g>
      ))}
      <text x="78" y="102" className="dbx-logo">
        dbx
      </text>
      <text x="80" y="122" className="brand-tagline">
        PROFESSIONAL PRODUCTS
      </text>
      <text x="1922" y="84" className="model-label">
        286s
      </text>
      <text x="1922" y="103" className="model-caption">
        Mic Preamp/
      </text>
      <text x="1922" y="119" className="model-caption">
        Processor
      </text>
      <text x="228" y="132" className="control-unit">
        dB
      </text>
      <text x="228" y="144" className="control-label">
        GAIN
      </text>
      <text x="228" y="156" className="line-label">
        LINE
      </text>
      <text x="390" y="82" className="switch-label">
        48V
      </text>
      <text x="390" y="92" className="switch-label">
        PHANTOM
      </text>
      <text x="390" y="102" className="switch-label">
        POWER
      </text>
      <text x="466" y="92" className="switch-label">
        80Hz
      </text>
      <text x="466" y="102" className="switch-label">
        HIGH-PASS
      </text>
      <text x="546" y="93" className="switch-label">
        PROCESS
      </text>
      <text x="546" y="104" className="switch-label">
        BYPASS
      </text>
      <text x="641" y="144" className="control-label">
        DRIVE
      </text>
      <text x="743" y="144" className="control-label">
        DENSITY
      </text>
      <text x="1045" y="132" className="control-unit">
        Hz
      </text>
      <text x="1045" y="144" className="control-label">
        FREQUENCY
      </text>
      <text x="1149" y="144" className="control-label">
        THRESHOLD
      </text>
      <text x="1289" y="144" className="control-label">
        LF DETAIL
      </text>
      <text x="1394" y="144" className="control-label">
        HF DETAIL
      </text>
      <text x="1499" y="132" className="control-unit">
        dBu
      </text>
      <text x="1499" y="144" className="control-label">
        THRESHOLD
      </text>
      <text x="1601" y="144" className="control-label">
        RATIO
      </text>
      <text x="1742" y="132" className="control-unit">
        dB
      </text>
      <text x="1742" y="144" className="control-label">
        GAIN
      </text>
      <Screw x={115} y={42} />
      <Screw x={115} y={140} />
      <Screw x={990} y={18} />
      <Screw x={990} y={163} />
      <Screw x={1870} y={42} />
      <Screw x={1870} y={140} />
    </svg>
  )
}
