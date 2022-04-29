import { definition, builder } from "@uesio/ui"
import { ChartOptions, DatasetChartOptions } from "chart.js"
export type SeriesDefinition = {
	name: string
	label: string
	valueField: string // this is what determines the total value on the y axis
	groupingField: string // This is what determines what bucket the data point goes into
	wire: string
	options: DatasetChartOptions
}

type WireLabels = {
	source: "WIRE"
	wire: string
	field: string
}

type ValueLabels = {
	source: "VALUE"
	values: ValueLabel[]
}

type ValueLabel = {
	key: string
	value: string
}

type DataLabels = {
	source: "DATA"
	field: string
}

type CategoryScale = {
	type: "CATEGORY"
	labels: WireLabels | ValueLabels | DataLabels
}

export type TimeScale = {
	type: "TIME"
	unit: "month"
}

export type Scale = CategoryScale | TimeScale

export type LineChartDefinition = {
	scales: Scale[]
	options: ChartOptions
	title?: string
	series: SeriesDefinition[]
} & definition.BaseDefinition

export interface Props extends definition.BaseProps {
	definition: LineChartDefinition
}

const PropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Chart",
	description: "Just a chart",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({
		text: "New chart",
	}),
	properties: [],
	sections: [],
	actions: [],
	traits: ["uesio.standalone"],
	classes: ["root"],
	type: "component",
}

export default PropertyDefinition
