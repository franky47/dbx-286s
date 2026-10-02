import { useId } from 'react'
import { useQueryStates } from 'nuqs'
import type { CSSProperties } from 'react'
import { Knob, KnobDial, KnobLabel, KnobValue, parseKnobValue } from '@/components/ui/knob'
import { UnitFace } from '@/components/unit-face'
import { controls, defaultSettings, formatValue } from '@/lib/controls'
import { graduationTaper } from '@/lib/graduations'
import { settingsParsers, settingsUrlKeys } from '@/lib/query-state'
import { UnitScale } from '@/components/unit-scale'
import { ThemeToggle } from '@/components/theme-toggle'
import type { ControlId, SwitchId } from '@/lib/controls'
import './App.css'

const KNOB_POSITIONS = 41

const positions: Record<ControlId, number> = {
  gain: 228,
  drive: 641,
  density: 743,
  frequency: 1045,
  deEss: 1149,
  low: 1292,
  high: 1391,
  threshold: 1505,
  ratio: 1618,
  output: 1756,
}

function DialCap() {
  const id = `dial-${useId().replaceAll(':', '')}`
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2=".8" y2="1">
          <stop stopColor="#56584e" />
          <stop offset=".5" stopColor="#292c25" />
          <stop offset="1" stopColor="#161913" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="52" r="29" fill="#000" opacity=".25" />
      <circle
        className="dial-edge"
        cx="50"
        cy="50"
        r="29"
        fill="#22261e"
        stroke="#73786a"
        strokeWidth="1.2"
      />
      <circle cx="50" cy="50" r="25" fill={`url(#${id})`} stroke="#151911" strokeWidth="1" />
      <circle
        cx="50"
        cy="50"
        r="22.5"
        fill="none"
        stroke="#fff"
        strokeOpacity=".07"
        strokeWidth=".7"
      />
      <line
        className="dial-indicator"
        x1="50"
        y1="27"
        x2="50"
        y2="43"
        stroke="#e7e8d9"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </>
  )
}

function parseValue(id: ControlId, text: string) {
  const minimum = controls[id].min
  if (text.trim().toUpperCase() === formatValue(id, minimum).toUpperCase()) return minimum
  return parseKnobValue(text)
}

function PanelKnob({
  id,
  value,
  onChange,
}: {
  id: ControlId
  value: number
  onChange: (value: number) => void
}) {
  const control = controls[id]
  const taper = graduationTaper(id)
  const toPosition = (next: number) => 1 + taper.toPosition(next) * (KNOB_POSITIONS - 1)
  const toValue = (position: number) =>
    Number(taper.toValue((position - 1) / (KNOB_POSITIONS - 1)).toFixed(6))
  const position = Math.round(toPosition(value))
  const processor = !['gain', 'output'].includes(id)
  return (
    <Knob
      className={`panel-knob ${processor ? 'processor-knob' : ''}`}
      style={{ left: `${(positions[id] - 50) / 19.8}%` }}
      min={1}
      max={KNOB_POSITIONS}
      step={1}
      fineStep={1}
      largeStep={10}
      value={position}
      resetValue={Math.round(toPosition(defaultSettings.values[id]))}
      arc={300}
      origin={toPosition(id === 'output' ? 0 : control.min)}
      format={(next) => formatValue(id, toValue(next))}
      parse={(text) => {
        const parsed = parseValue(id, text)
        return parsed === null ? null : toPosition(parsed)
      }}
      onValueChange={(next) => onChange(toValue(next))}
      allowWheel
    >
      <KnobLabel className="sr-only">{control.label}</KnobLabel>
      <KnobDial
        aria-valuemin={control.min}
        aria-valuemax={control.max}
        aria-valuenow={toValue(position)}
      >
        <UnitScale id={id} />
        <DialCap />
      </KnobDial>
      <KnobValue className="value-readout" />
    </Knob>
  )
}

function PanelSwitch({
  id,
  x,
  active,
  onToggle,
}: {
  id: SwitchId
  x: number
  active: boolean
  onToggle: (id: SwitchId) => void
}) {
  const names = {
    phantom: '48V phantom power',
    highPass: '80 Hz high-pass filter',
    bypass: 'Process bypass',
  }
  return (
    <button
      type="button"
      className={`panel-switch switch-${id}`}
      style={{ left: `${(x - 13) / 19.8}%` }}
      aria-label={names[id]}
      aria-pressed={active}
      onClick={() => onToggle(id)}
    >
      <span className="switch-key" />
      <span className="led" data-lit={active} />
    </button>
  )
}

function Meter({
  className = '',
  x,
  width,
  label,
  values,
  colors,
}: {
  x: number
  width: number
  label?: string
  values: string[]
  colors: string[]
  className?: string
}) {
  return (
    <div
      className={`meter ${className}`}
      style={{ left: `${x / 19.8}%`, width: `${width / 19.8}%` }}
      role="img"
      aria-label={`${label ?? 'Clip'} meter, no audio signal`}
    >
      {label && <span className="meter-title">{label}</span>}
      <div className="meter-well">
        {values.map((value, index) => (
          <span className="meter-segment" key={value}>
            <span>{value}</span>
            <i style={{ '--led-color': colors[index] } as CSSProperties} />
          </span>
        ))}
      </div>
    </div>
  )
}

function App() {
  const [settings, setSettings] = useQueryStates(settingsParsers, { urlKeys: settingsUrlKeys })
  function changeControl(id: ControlId, value: number) {
    void setSettings({ [id]: value })
  }
  function toggle(id: SwitchId) {
    void setSettings((current) => ({ [id]: !current[id] }))
  }
  return (
    <main className="unit-stage">
      <ThemeToggle />
      <h1 className="sr-only">DBX 286s mic preamp / processor</h1>
      <div className="rack-scroll" role="region" aria-label="DBX286S front panel">
        <div className="rack" data-bypassed={settings.bypass}>
          <UnitFace />
          {(Object.keys(controls) as ControlId[]).map((id) => (
            <PanelKnob
              key={id}
              id={id}
              value={settings[id]}
              onChange={(value) => changeControl(id, value)}
            />
          ))}
          <PanelSwitch id="phantom" x={390} active={settings.phantom} onToggle={toggle} />
          <PanelSwitch id="highPass" x={466} active={settings.highPass} onToggle={toggle} />
          <PanelSwitch id="bypass" x={540} active={settings.bypass} onToggle={toggle} />
          <Meter
            x={270}
            width={91}
            label="LEVEL (dBu)"
            values={['-20', '-10', '0', 'CLIP']}
            colors={['#98d839', '#98d839', '#e8d43c', '#e94821']}
          />
          <Meter
            className="processor-meter"
            x={791}
            width={176}
            label="GAIN REDUCTION dB"
            values={['30', '25', '20', '15', '12', '9', '6', '3']}
            colors={Array(8).fill('#e94821')}
          />
          <Meter
            className="processor-meter"
            x={1189}
            width={42}
            label="dB"
            values={['1', '6']}
            colors={['#98d839', '#e94821']}
          />
          <Meter
            className="threshold-meter processor-meter"
            x={1655}
            width={34}
            label="THRESHOLD"
            values={['−', '+']}
            colors={['#e94821', '#98d839']}
          />
          <Meter x={1790} width={25} values={['CLIP']} colors={['#e94821']} />
        </div>
      </div>
    </main>
  )
}

export default App
