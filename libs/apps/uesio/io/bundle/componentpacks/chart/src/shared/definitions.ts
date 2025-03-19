import { LabelsDefinition } from "./labels"
import { SeriesDefinition } from "./aggregate"

export type ChartProps = {
  definition: ChartDefinition
  type: "line" | "bar"
}

type TicksOptions = {
  count?: number
}

type ScaleOptions = {
  beginAtZero?: boolean
  ticks?: TicksOptions
  suggestedMax?: number
}

type ScalesOptions = {
  y?: ScaleOptions
  x?: ScaleOptions
}

export type ChartDefinition = {
  labels: LabelsDefinition
  title?: string
  series: SeriesDefinition[]
  scales?: ScalesOptions
}
