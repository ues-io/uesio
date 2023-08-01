import { definition } from "@uesio/ui"
import { LabelsDefinition } from "./labels"
import { SeriesDefinition } from "./aggregate"

export type ChartProps = {
	definition: ChartDefinition
	type: "line" | "bar"
}

export type ChartDefinition = {
	labels: LabelsDefinition
	title?: string
	series: SeriesDefinition[]
} & definition.BaseDefinition
