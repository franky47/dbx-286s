import type { ControlId } from './controls'
import type { Taper } from './audio/types'

interface Graduation {
  value: number
  position: number
  label: string
  lineLabel?: string
}

type FiveValues = readonly [number, number, number, number, number]

function quarters(values: FiveValues, labels: readonly string[]): Graduation[] {
  return values.map((value, index) => ({ value, position: index / 4, label: labels[index] }))
}

const amount = Array.from({ length: 11 }, (_, value) => ({
  value,
  position: value / 10,
  label: value === 0 ? 'OFF' : String(value),
}))

const gain = quarters([0, 15, 30, 45, 60], ['0', '+15', '+30', '+45', '+60'])
const lineLabels = ['-15', '0', '+15', '+30', '+45']

export const graduations: Record<ControlId, readonly Graduation[]> = {
  gain: gain.map((mark, index) => ({ ...mark, lineLabel: lineLabels[index] })),
  drive: amount,
  density: amount,
  frequency: quarters([800, 1000, 4000, 8000, 10000], ['800', '1k', '4k', '8k', '10k']),
  deEss: amount,
  low: amount,
  high: amount,
  threshold: quarters([-60, -30, -15, -5, 15], ['OFF', '-30', '-15', '-5', '+15']),
  ratio: quarters([1, 1.5, 2, 5, 10], ['MIN', '1.5:1', '2:1', '5:1', '10:1']),
  output: quarters([-30, -10, 0, 5, 10], ['-30', '-10', '0', '+5', '+10']),
}

function interpolate(
  marks: readonly Graduation[],
  input: number,
  from: 'value' | 'position',
  to: 'value' | 'position',
) {
  if (input <= marks[0][from]) return marks[0][to]
  for (let index = 1; index < marks.length; index += 1) {
    const upper = marks[index]
    if (input > upper[from]) continue
    const lower = marks[index - 1]
    const fraction = (input - lower[from]) / (upper[from] - lower[from])
    return lower[to] + fraction * (upper[to] - lower[to])
  }
  return marks[marks.length - 1][to]
}

export function graduationTaper(id: ControlId): Taper {
  const marks = graduations[id]
  return {
    toPosition: (value) => interpolate(marks, value, 'value', 'position'),
    toValue: (position) => interpolate(marks, position, 'position', 'value'),
  }
}
