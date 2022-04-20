import { definition, builder, signal } from "@uesio/ui"
import { ChartOptions, DatasetChartOptions } from "chart.js"
type SeriesDefinition = {
	name: string
	label: string
	field: string
	wire: string
	options: DatasetChartOptions
}

export type Definition = {
	text?: string
	icon?: string
	xAxis: {
		wire: string
		field: string
	}
	options: ChartOptions
	title?: string
	signals?: signal.SignalDefinition[]
	series: SeriesDefinition[]
} & definition.BaseDefinition

export interface Props extends definition.BaseProps {
	definition: Definition
}

const PropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Chart",
	description: "Just a chart",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({
		text: "New chart",
	}),
	properties: [
		{
			name: "text",
			type: "TEXT",
			label: "Text",
		},
		{
			name: "icon",
			type: "ICON",
			label: "Icon",
		},
	],
	sections: [
		{
			title: "Signals",
			type: "SIGNALS",
		},
	],
	actions: [
		{
			label: "Run Signals",
			type: "RUN_SIGNALS",
			slot: "signals",
		},
	],
	traits: ["uesio.standalone"],
	classes: ["root"],
	type: "component",
}

export default PropertyDefinition
